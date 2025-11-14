import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { wizardConfigSchema } from "../shared/schema";
import { generateProject } from "./lib/generator";
import { streamZip } from "./lib/zipGenerator";

export async function registerRoutes(app: Express): Promise<Server> {
  /**
   * POST /api/generate
   * Generate a NestJS project based on wizard configuration
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

      console.log(`🚀 Generating project: ${projectName}`);

      // Generate project files
      const files = await generateProject(config);

      console.log(`✅ Generated ${files.length} files for ${projectName}`);

      // Stream ZIP to client
      await streamZip(res, files, projectName);
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
