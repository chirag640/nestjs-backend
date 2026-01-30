import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { wizardConfigSchema } from "../shared/schema";
import { generateProject } from "./lib/generator";
import { streamZip } from "./lib/zipGenerator";
import { createSession } from "./lib/sessionManager";
import { registerPreviewRoutes } from "./previewRoutes";
import { ValidationService } from "./lib/validationService";

export async function registerRoutes(app: Express): Promise<Server> {
  // Register preview API routes
  registerPreviewRoutes(app);

  // Initialize validation service
  const validationService = new ValidationService();

  /**
   * POST /api/validate-config
   * Comprehensive validation that checks all aspects of the configuration
   * including schema validation, template availability, and feature dependencies
   */
  app.post("/api/validate-config", async (req: Request, res: Response) => {
    try {
      // First, validate against schema
      const schemaValidation = wizardConfigSchema.safeParse(req.body);

      if (!schemaValidation.success) {
        // Transform Zod errors into user-friendly format with suggestions
        const errors = schemaValidation.error.errors.map((err) => {
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
            severity: "error",
          };
        });

        return res.status(400).json({
          valid: false,
          errors,
          warnings: [],
          suggestions: [],
          summary: `❌ Schema validation failed: ${errors.length} error(s)`,
        });
      }

      // Perform comprehensive validation
      const config = schemaValidation.data;
      const validationResult = await validationService.validate(config);

      // Return appropriate status code
      const statusCode = validationResult.valid ? 200 : 400;

      return res.status(statusCode).json(validationResult);
    } catch (error) {
      console.error("Validation error:", error);
      return res.status(500).json({
        valid: false,
        errors: [
          {
            path: "internal",
            message: "Internal validation error",
            suggestion: "Please try again or contact support",
            code: "INTERNAL_ERROR",
            severity: "error",
          },
        ],
        warnings: [],
        suggestions: [],
        summary: "❌ Internal error during validation",
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
        // Format detailed error messages with exact locations
        const errors = validationResult.error.errors.map((err, index) => {
          const path = err.path.join(" → ");
          const location = `Line: ${index + 1}, Path: ${path || "root"}`;

          let userFriendlyMessage = err.message;
          let suggestion = "";

          // Provide specific, actionable suggestions
          if (err.code === "invalid_type") {
            userFriendlyMessage = `Expected ${err.expected} but got ${err.received}`;
            suggestion = `Please provide a valid ${err.expected} value`;
          } else if (err.code === "invalid_enum_value") {
            const options = (err as any).options || [];
            userFriendlyMessage = `Invalid value. Must be one of: ${options.join(", ")}`;
            suggestion = `Choose from: ${options.join(", ")}`;
          } else if (err.message.includes("PascalCase")) {
            suggestion = "Use PascalCase (e.g., User, BlogPost, OrderItem)";
          } else if (err.message.includes("camelCase")) {
            suggestion =
              "Use camelCase (e.g., firstName, emailAddress, isActive)";
          }

          return {
            location,
            path,
            issue: userFriendlyMessage,
            suggestion,
            value: JSON.stringify((err as any).received || "(empty)"),
          };
        });

        return res.status(400).json({
          error: "Configuration Validation Failed",
          message: `Found ${errors.length} error(s) in your configuration`,
          errors,
          hint: "Please fix the errors listed below and try again",
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
          message: `Mode must be one of: ${ALLOWED_MODES.join(", ")}`,
          errors: [
            {
              location: "Request Parameter",
              path: "mode",
              issue: `Invalid mode: ${mode}`,
              suggestion: `Use 'preview' or 'download'`,
              value: mode,
            },
          ],
        });
      }

      // Run comprehensive validation before generation
      const validationCheck = await validationService.validate(config);
      if (!validationCheck.valid) {
        const criticalErrors = validationCheck.errors.filter(
          (e: any) => e.severity === "error",
        );

        return res.status(400).json({
          error: "Pre-Generation Validation Failed",
          message: `Found ${criticalErrors.length} critical error(s) that will prevent successful generation`,
          errors: criticalErrors.map((e: any, index: number) => ({
            location: `Validation Check #${index + 1}`,
            path: e.path || "configuration",
            issue: e.message,
            suggestion: e.suggestion || "See validation details",
            code: e.code,
          })),
          warnings: validationCheck.warnings,
          hint: "Fix critical errors before generating. Use the Validate button to see detailed analysis.",
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
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        const errorStack = error instanceof Error ? error.stack : "";

        // Parse error message for specific issues
        let specificErrors: any[] = [];

        if (errorMessage.includes("template not found")) {
          const match = errorMessage.match(/template not found: (.+)/);
          const templateName = match ? match[1] : "unknown";
          specificErrors.push({
            location: "Template System",
            path: `templates/${templateName}`,
            issue: `Required template file is missing: ${templateName}`,
            suggestion:
              "This usually indicates a feature was selected that is not yet implemented. Try disabling advanced features.",
            value: templateName,
          });
        } else if (
          errorMessage.includes("model") ||
          errorMessage.includes("Model")
        ) {
          specificErrors.push({
            location: "Model Definition",
            path: "modelDefinition.models",
            issue: errorMessage,
            suggestion:
              "Check that all model names are PascalCase and field names are camelCase",
            value: "See error message above",
          });
        } else if (errorMessage.includes("field")) {
          specificErrors.push({
            location: "Field Definition",
            path: "modelDefinition.models[].fields",
            issue: errorMessage,
            suggestion:
              "Ensure field names use camelCase and types are valid (string, number, boolean, date, etc.)",
            value: "See error message above",
          });
        } else if (errorMessage.includes("relationship")) {
          specificErrors.push({
            location: "Relationship Configuration",
            path: "modelDefinition.relationships",
            issue: errorMessage,
            suggestion:
              "Verify that sourceModel and targetModel refer to existing models",
            value: "See error message above",
          });
        } else {
          // Generic error
          specificErrors.push({
            location: "Generation Process",
            path: "unknown",
            issue: errorMessage,
            suggestion:
              "Please check your configuration and try again. If the issue persists, contact support.",
            value: "N/A",
          });
        }

        res.status(500).json({
          error: "Project Generation Failed",
          message: errorMessage,
          errors: specificErrors,
          hint: "Review the errors below and fix them in your configuration",
          technicalDetails:
            process.env.NODE_ENV === "development"
              ? {
                  stack: errorStack?.split("\n").slice(0, 5).join("\n"),
                  timestamp: new Date().toISOString(),
                }
              : undefined,
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
