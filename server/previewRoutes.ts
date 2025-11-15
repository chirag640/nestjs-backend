import type { Express, Request, Response } from "express";
import { getSession, updateFile } from "./sessionStorage";
import archiver from "archiver";

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

    res.json({
      tree,
      totalFiles: session.files.size,
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

    const session = getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found or expired" });
    }

    const content = session.files.get(filePath);
    if (content === undefined) {
      return res.status(404).json({ error: `File not found: ${filePath}` });
    }

    res.json({
      path: filePath,
      content,
      size: content.length,
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

    // Add all files from session
    session.files.forEach((content, path) => {
      archive.append(content, { name: path });
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

    res.json({
      sessionId: session.id,
      projectName: session.projectName,
      totalFiles: session.files.size,
      createdAt: session.createdAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
      files: Array.from(session.files.keys()),
    });
  });
}
