import type { Express, Request, Response } from "express";
import {
  getSession as getLegacySession,
  updateFile as legacyUpdateFile,
} from "./sessionStorage";
import {
  getSession,
  getFile,
  updateFile,
  undo,
  redo,
  resetFile,
  getFileDiff,
  getDirtyFiles,
} from "./lib/sessionManager";
import { createWorker } from "./lib/workerUtils";
import path from "path";
import archiver from "archiver";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface FileNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileNode[];
}

// Build hierarchical file tree from flat file list
function buildFileTree(filePaths: string[]): FileNode[] {
  const root: FileNode[] = [];
  const map = new Map<string, FileNode>();

  // Sort paths for consistent ordering
  const sortedPaths = [...filePaths].sort();

  sortedPaths.forEach((filePath) => {
    const parts = filePath.split("/").filter((p) => p.length > 0);
    let currentLevel = root;
    let currentPath = "";

    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isFile = index === parts.length - 1;

      // Check if node already exists at this level
      let node = currentLevel.find((n) => n.name === part);

      if (!node) {
        node = {
          name: part,
          path: currentPath,
          type: isFile ? "file" : "folder",
          children: isFile ? undefined : [],
        };
        currentLevel.push(node);
        map.set(currentPath, node);
      }

      if (!isFile && node.children) {
        currentLevel = node.children;
      }
    });
  });

  return root;
}

export function registerPreviewRoutes(app: Express) {
  // SECURITY NOTE: In production, these preview routes should be protected with authentication
  // middleware to prevent unauthorized access to preview sessions. For now, sessions are
  // ephemeral (30min TTL) and only accessible via generated sessionId.
  // TODO: Add authentication middleware when moving to production

  // GET /api/preview/tree - Returns file tree hierarchy
  app.get("/api/preview/tree", (req: Request, res: Response) => {
    const sessionId = req.query.sessionId as string;

    if (!sessionId) {
      return res.status(400).json({ error: "Missing sessionId parameter" });
    }

    const session = getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found or expired" });
    }

    const filePaths = Array.from(session.files.keys());
    const tree = buildFileTree(filePaths);
    const dirtyFiles = getDirtyFiles(sessionId);

    res.json({
      tree,
      totalFiles: session.files.size,
      dirtyFiles: dirtyFiles.length,
      projectName: session.projectName,
    });
  });

  // GET /api/preview/file - Returns content of specific file
  app.get("/api/preview/file", (req: Request, res: Response) => {
    const sessionId = req.query.sessionId as string;
    const filePath = req.query.path as string;

    if (!sessionId || !filePath) {
      return res
        .status(400)
        .json({ error: "Missing sessionId or path parameter" });
    }

    const fileSession = getFile(sessionId, filePath);
    if (!fileSession) {
      return res
        .status(404)
        .json({ error: `File not found or session expired: ${filePath}` });
    }

    res.json({
      path: filePath,
      content: fileSession.content,
      size: fileSession.content.length,
      dirty: fileSession.dirty,
      version: fileSession.version,
      canUndo: fileSession.undoStack.length > 0,
      canRedo: fileSession.redoStack.length > 0,
    });
  });

  // POST /api/preview/file - Save edited file
  app.post("/api/preview/file", (req: Request, res: Response) => {
    const { sessionId, path, content } = req.body;

    if (!sessionId || !path || content === undefined) {
      return res
        .status(400)
        .json({ error: "Missing sessionId, path, or content" });
    }

    const success = updateFile(sessionId, path, content);
    if (!success) {
      return res.status(404).json({ error: "Session not found or expired" });
    }

    res.json({ success: true, path });
  });

  // POST /api/preview/format - Format code with Prettier
  app.post("/api/preview/format", async (req: Request, res: Response) => {
    const { code, language } = req.body;

    if (!code) {
      return res.status(400).json({ error: "Missing code parameter" });
    }

    // Validate code size to prevent excessive CPU/memory usage
    const MAX_CODE_LENGTH = parseInt(
      process.env.MAX_CODE_LENGTH || "200000",
      10
    );
    if (code.length > MAX_CODE_LENGTH) {
      console.warn(
        `[Preview] Rejected format request: code size ${code.length} exceeds limit ${MAX_CODE_LENGTH}`
      );
      return res.status(413).json({
        error: "Payload too large",
        message: `Code size (${code.length} chars) exceeds maximum allowed (${MAX_CODE_LENGTH} chars)`,
      });
    }

    try {
      // Dynamic import for Prettier (ESM module)
      const prettier = await import("prettier");

      let parser = "typescript";
      if (language === "json") parser = "json";
      else if (language === "yaml") parser = "yaml";
      else if (language === "markdown") parser = "markdown";

      const formatted = await prettier.format(code, {
        parser,
        semi: true,
        singleQuote: true,
        trailingComma: "all",
        printWidth: 100,
        tabWidth: 2,
      });

      res.json({ formatted });
    } catch (error: any) {
      res.status(400).json({
        error: "Formatting failed",
        message: error.message,
      });
    }
  });

  // GET /api/preview/download - Stream ZIP of session files
  app.get("/api/preview/download", (req: Request, res: Response) => {
    const sessionId = req.query.sessionId as string;

    if (!sessionId) {
      return res.status(400).json({ error: "Missing sessionId parameter" });
    }

    const session = getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found or expired" });
    }

    const projectName = session.projectName || "nestjs-backend";
    const filename = `${projectName}.zip`;

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    const archive = archiver("zip", { zlib: { level: 9 } });

    // Register error handler before piping to prevent sending JSON after headers are sent
    archive.on("error", (err) => {
      console.error("[Preview] Archive error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to create archive" });
      } else {
        // Headers already sent, abort the stream
        res.destroy(err);
      }
    });

    archive.pipe(res);

    // Add all files from session (use latest edited content)
    session.files.forEach((fileSession, path) => {
      archive.append(fileSession.content, { name: path });
    });

    // Add metadata file
    const metadata = {
      projectName: session.projectName,
      generatedAt: session.createdAt.toISOString(),
      totalFiles: session.files.size,
      files: Array.from(session.files.keys()),
    };
    archive.append(JSON.stringify(metadata, null, 2), {
      name: ".generator-metadata.json",
    });

    archive.finalize();
  });

  // GET /api/preview/stats - Get session statistics (for debugging)
  app.get("/api/preview/stats", (req: Request, res: Response) => {
    const sessionId = req.query.sessionId as string;

    if (!sessionId) {
      return res.status(400).json({ error: "Missing sessionId parameter" });
    }

    const session = getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found or expired" });
    }

    const dirtyFiles = getDirtyFiles(sessionId);

    res.json({
      sessionId: session.id,
      projectName: session.projectName,
      totalFiles: session.files.size,
      dirtyFiles: dirtyFiles.length,
      createdAt: session.createdAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
      files: Array.from(session.files.keys()),
    });
  });

  // POST /api/preview/undo - Undo last change
  app.post("/api/preview/undo", (req: Request, res: Response) => {
    const { sessionId, path } = req.body;

    if (!sessionId || !path) {
      return res.status(400).json({ error: "Missing sessionId or path" });
    }

    const content = undo(sessionId, path);
    if (content === null) {
      return res
        .status(404)
        .json({ error: "Cannot undo: no history or session not found" });
    }

    const fileSession = getFile(sessionId, path);
    res.json({
      success: true,
      content,
      canUndo: fileSession?.undoStack.length || 0 > 0,
      canRedo: fileSession?.redoStack.length || 0 > 0,
    });
  });

  // POST /api/preview/redo - Redo last undo
  app.post("/api/preview/redo", (req: Request, res: Response) => {
    const { sessionId, path } = req.body;

    if (!sessionId || !path) {
      return res.status(400).json({ error: "Missing sessionId or path" });
    }

    const content = redo(sessionId, path);
    if (content === null) {
      return res
        .status(404)
        .json({ error: "Cannot redo: no history or session not found" });
    }

    const fileSession = getFile(sessionId, path);
    res.json({
      success: true,
      content,
      canUndo: fileSession?.undoStack.length || 0 > 0,
      canRedo: fileSession?.redoStack.length || 0 > 0,
    });
  });

  // POST /api/preview/reset - Reset file to original content
  app.post("/api/preview/reset", (req: Request, res: Response) => {
    const { sessionId, path } = req.body;

    if (!sessionId || !path) {
      return res.status(400).json({ error: "Missing sessionId or path" });
    }

    const success = resetFile(sessionId, path);
    if (!success) {
      return res.status(404).json({ error: "Session not found or expired" });
    }

    const fileSession = getFile(sessionId, path);
    res.json({
      success: true,
      content: fileSession?.content,
      dirty: false,
    });
  });

  // GET /api/preview/diff - Get diff between original and current
  app.get("/api/preview/diff", (req: Request, res: Response) => {
    const sessionId = req.query.sessionId as string;
    const filePath = req.query.path as string;

    if (!sessionId || !filePath) {
      return res
        .status(400)
        .json({ error: "Missing sessionId or path parameter" });
    }

    const diff = getFileDiff(sessionId, filePath);
    if (!diff) {
      return res
        .status(404)
        .json({ error: "File not found or session expired" });
    }

    res.json(diff);
  });

  // POST /api/preview/lint - Run ESLint on code
  app.post("/api/preview/lint", async (req: Request, res: Response) => {
    const { code, filePath, fix = false } = req.body;

    if (!code || !filePath) {
      return res.status(400).json({ error: "Missing code or filePath" });
    }

    // Validate code size
    const MAX_CODE_LENGTH = parseInt(
      process.env.MAX_CODE_LENGTH || "200000",
      10
    );
    if (code.length > MAX_CODE_LENGTH) {
      return res.status(413).json({
        error: "Payload too large",
        message: `Code size exceeds maximum allowed (${MAX_CODE_LENGTH} chars)`,
      });
    }

    try {
      const worker = createWorker("lintWorker", {
        resourceLimits: {
          maxOldGenerationSizeMb: 256, // 256MB memory limit
        },
      });

      const timeout = setTimeout(() => {
        worker.terminate();
        res
          .status(408)
          .json({ error: "Lint timeout: operation took too long" });
      }, 10000); // 10 second timeout

      worker.on("message", (result: any) => {
        clearTimeout(timeout);
        worker.terminate();

        if (result.success) {
          res.json(result.results);
        } else {
          res.status(400).json({ error: result.error });
        }
      });

      worker.on("error", (error: any) => {
        clearTimeout(timeout);
        worker.terminate();
        res.status(500).json({ error: error.message });
      });

      worker.postMessage({ code, filePath, fix });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Linting failed" });
    }
  });

  // POST /api/preview/typecheck - Run TypeScript compiler on files
  app.post("/api/preview/typecheck", async (req: Request, res: Response) => {
    const { sessionId, files } = req.body;

    if (!sessionId && !files) {
      return res.status(400).json({ error: "Missing sessionId or files" });
    }

    try {
      // Get all files from session or use provided files
      let fileMap: Record<string, string> = {};

      if (sessionId) {
        const session = getSession(sessionId);
        if (!session) {
          return res
            .status(404)
            .json({ error: "Session not found or expired" });
        }

        // Convert session files to flat object
        session.files.forEach((fileSession, path) => {
          fileMap[path] = fileSession.content;
        });
      } else {
        fileMap = files;
      }

      // Calculate total size
      const totalSize = Object.values(fileMap).reduce(
        (sum, content) => sum + content.length,
        0
      );
      const MAX_TOTAL_SIZE = parseInt(
        process.env.MAX_TYPECHECK_SIZE || "5000000",
        10
      ); // 5MB

      if (totalSize > MAX_TOTAL_SIZE) {
        return res.status(413).json({
          error: "Payload too large",
          message: `Total code size exceeds maximum allowed (${MAX_TOTAL_SIZE} bytes)`,
        });
      }

      const worker = createWorker("typecheckWorker", {
        resourceLimits: {
          maxOldGenerationSizeMb: 512, // 512MB for TypeScript compiler
        },
      });

      const timeout = setTimeout(() => {
        worker.terminate();
        res
          .status(408)
          .json({ error: "Typecheck timeout: operation took too long" });
      }, 30000); // 30 second timeout for typecheck

      worker.on("message", (result: any) => {
        clearTimeout(timeout);
        worker.terminate();

        if (result.success) {
          res.json({ diagnostics: result.diagnostics });
        } else {
          res.status(400).json({ error: result.error });
        }
      });

      worker.on("error", (error: any) => {
        clearTimeout(timeout);
        worker.terminate();
        res.status(500).json({ error: error.message });
      });

      worker.postMessage({ files: fileMap });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Typecheck failed" });
    }
  });
}
