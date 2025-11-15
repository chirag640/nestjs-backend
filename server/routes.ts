import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { wizardConfigSchema } from "../shared/schema";
import { generateProject } from "./lib/generator";
import { streamZip } from "./lib/zipGenerator";
import { createSession } from "./sessionStorage";
import { registerPreviewRoutes } from "./previewRoutes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Register preview API routes
  registerPreviewRoutes(app);

  /**
   * POST /api/generate
   * Generate a NestJS project based on wizard configuration
   * Query param: mode=preview (returns sessionId) or mode=download (streams ZIP)
   */
  app.post("/api/generate", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validationResult = wizardConfigSchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid configuration",
          details: validationResult.error.errors,
        });
      }

      const config = validationResult.data;
      const projectName = config.projectSetup.projectName;
      const mode = (req.query.mode as string) || "preview"; // default to preview mode

      console.log(`🚀 Generating project: ${projectName} (mode: ${mode})`);

      // Generate project files
      const files = await generateProject(config);

      console.log(`✅ Generated ${files.length} files for ${projectName}`);

      if (mode === "download") {
        // Stream ZIP directly to client
        await streamZip(res, files, projectName);
      } else {
        // Preview mode: Create session and return sessionId
        const sessionId = createSession(files, projectName);
        res.json({
          sessionId,
          projectName,
          totalFiles: files.length,
          expiresIn: "30 minutes",
        });
      }
    } catch (error) {
      console.error("Generation error:", error);

      if (!res.headersSent) {
        res.status(500).json({
          error: "Failed to generate project",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  });

  /**
   * GET /api/health
   * Health check endpoint
   */
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "FoundationWizard API",
    });
  });

  const httpServer = createServer(app);

  return httpServer;
}
