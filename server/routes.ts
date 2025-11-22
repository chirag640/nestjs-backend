import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { wizardConfigSchema } from "../shared/schema";
import { generateProject } from "./lib/generator";
import { streamZip } from "./lib/zipGenerator";
import { createSession } from "./lib/sessionManager";
import { registerPreviewRoutes } from "./previewRoutes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Register preview API routes
  registerPreviewRoutes(app);

  /**
   * POST /api/validate-config
   * Validate wizard configuration and return detailed errors with suggestions
   */
  app.post("/api/validate-config", async (req: Request, res: Response) => {
    try {
      const validationResult = wizardConfigSchema.safeParse(req.body);

      if (!validationResult.success) {
        // Transform Zod errors into user-friendly format with suggestions
        const errors = validationResult.error.errors.map((err) => {
          const path = err.path.join(".");
          let suggestion = "";

          // Provide helpful suggestions based on error type
          if (err.code === "invalid_type") {
            suggestion = `Expected type: ${err.expected}, but received: ${err.received}`;
          } else if (err.code === "invalid_enum_value") {
            const options = (err as any).options;
            suggestion = `Valid options: ${options ? options.join(", ") : "see documentation"}`;
          } else if (err.code === "too_small") {
            suggestion = `Minimum ${(err as any).minimum} items required`;
          } else if (err.code === "invalid_string") {
            suggestion =
              "Check format requirements (e.g., camelCase, PascalCase, regex pattern)";
          }

          return {
            path,
            message: err.message,
            suggestion,
            code: err.code,
          };
        });

        return res.status(400).json({
          valid: false,
          errors,
          summary: `Found ${errors.length} validation error(s)`,
        });
      }

      // Additional semantic validation
      const config = validationResult.data;
      const warnings: any[] = [];

      // Check for models with no relationships (might be intentional, but worth noting)
      const models = config.modelDefinition?.models || [];
      const relationships = config.modelDefinition?.relationships || [];

      // Collect inline relationships
      const allRelationships = [...relationships];
      models.forEach((model) => {
        if (model.relationships) {
          allRelationships.push(...model.relationships);
        }
      });

      if (models.length > 1 && allRelationships.length === 0) {
        warnings.push({
          type: "info",
          message:
            "You have multiple models but no relationships defined. Consider adding relationships if models are related.",
        });
      }

      // Check for auth enabled but no User model
      if (config.authConfig?.enabled) {
        const hasUserModel = models.some((m) => m.name === "User");
        if (!hasUserModel) {
          warnings.push({
            type: "warning",
            message:
              "Authentication is enabled but no 'User' model found. Auth system requires a User model.",
          });
        }
      }

      return res.json({
        valid: true,
        message: "Configuration is valid",
        warnings,
      });
    } catch (error) {
      console.error("Validation error:", error);
      return res.status(500).json({
        valid: false,
        error: "Internal validation error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

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

      // Validate mode parameter
      const ALLOWED_MODES = ["preview", "download"];
      if (!ALLOWED_MODES.includes(mode)) {
        return res.status(400).json({
          error: "Invalid mode parameter",
          details: `Mode must be one of: ${ALLOWED_MODES.join(", ")}`,
        });
      }

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
