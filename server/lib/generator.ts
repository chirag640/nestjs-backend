import * as prettier from "prettier";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { renderTemplate, type TemplateContext } from "./templateRenderer";
import type { WizardConfig } from "../../shared/schema";
import { buildIR, type ProjectIR, type ModelIR } from "./irBuilder";

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface GeneratedFile {
  path: string;
  content: string;
}

/**
 * Format code using Prettier
 */
async function formatCode(
  code: string,
  filePathOrParser: string
): Promise<string> {
  try {
    // Determine parser - either already a parser name or extract from file extension
    let parser: string = "typescript";

    // Check if it's already a parser name (no path separators or extensions)
    if (
      !filePathOrParser.includes("/") &&
      !filePathOrParser.includes("\\") &&
      !filePathOrParser.includes(".")
    ) {
      // It's already a parser name like "json", "yaml", "typescript", etc.
      parser = filePathOrParser;
    } else {
      // It's a file path, detect parser from extension
      if (filePathOrParser.endsWith(".json")) {
        parser = "json";
      } else if (
        filePathOrParser.endsWith(".yml") ||
        filePathOrParser.endsWith(".yaml")
      ) {
        parser = "yaml";
      } else if (filePathOrParser.endsWith(".md")) {
        parser = "markdown";
      } else if (filePathOrParser.endsWith(".ts")) {
        parser = "typescript";
      } else if (filePathOrParser.endsWith(".js")) {
        parser = "babel";
      } else {
        // Default to typescript for unknown extensions
        parser = "typescript";
      }
    }

    return await prettier.format(code, {
      parser,
      singleQuote: true,
      trailingComma: "all",
      semi: true,
      tabWidth: 2,
      printWidth: 100,
    });
  } catch (error) {
    console.error(`Prettier formatting error (${filePathOrParser}):`, error);
    // Return unformatted code if formatting fails
    return code;
  }
}

/**
 * Generate all project files based on configuration
 */
export async function generateProject(
  config: WizardConfig
): Promise<GeneratedFile[]> {
  const { projectSetup, databaseConfig } = config;

  if (!projectSetup || !databaseConfig) {
    throw new Error("Project setup and database configuration are required");
  }

  // Build Intermediate Representation
  const ir: ProjectIR = buildIR(config);

  // Use full IR as context for templates
  const context = ir;

  const files: GeneratedFile[] = [];

  // Define template mappings
  const templates = [
    {
      template: "nestjs/main.ts.njk",
      output: "src/main.ts",
      parser: "typescript",
    },
    {
      template: "nestjs/app.module.ts.njk",
      output: "src/app.module.ts",
      parser: "typescript",
    },
    {
      template: "nestjs/app.controller.ts.njk",
      output: "src/app.controller.ts",
      parser: "typescript",
    },
    {
      template: "nestjs/app.service.ts.njk",
      output: "src/app.service.ts",
      parser: "typescript",
    },
    {
      template: "nestjs/package.json.njk",
      output: "package.json",
      parser: "json",
    },
    {
      template: "nestjs/tsconfig.json.njk",
      output: "tsconfig.json",
      parser: "json",
    },
    {
      template: "nestjs/.eslintrc.js.njk",
      output: ".eslintrc.js",
      parser: "babel",
    },
    {
      template: "nestjs/.prettierrc.njk",
      output: ".prettierrc",
      parser: "json",
    },
    {
      template: "nestjs/nest-cli.json.njk",
      output: "nest-cli.json",
      parser: "json",
    },
    {
      template: "nestjs/.env.example.njk",
      output: ".env.example",
      parser: null,
    },
    { template: "nestjs/.gitignore.njk", output: ".gitignore", parser: null },
    { template: "nestjs/Dockerfile.njk", output: "Dockerfile", parser: null },
    {
      template: "nestjs/docker-compose.yml.njk",
      output: "docker-compose.yml",
      parser: "yaml",
    },
    {
      template: "nestjs/README.md.njk",
      output: "README.md",
      parser: "markdown",
    },
    {
      template: "nestjs/CONTRIBUTING.md.njk",
      output: "CONTRIBUTING.md",
      parser: "markdown",
    },
    {
      template: "nestjs/CHANGELOG.md.njk",
      output: "CHANGELOG.md",
      parser: "markdown",
    },
    {
      template: "nestjs/app.controller.spec.ts.njk",
      output: "src/app.controller.spec.ts",
      parser: "typescript",
    },
    {
      template: "nestjs/app.service.spec.ts.njk",
      output: "src/app.service.spec.ts",
      parser: "typescript",
    },
  ];

  // Render and format each template
  for (const { template, output, parser } of templates) {
    try {
      // Debug: log project info when rendering README to catch undefined fields
      if (template === "nestjs/README.md.njk") {
        console.log(
          "[DEBUG] Rendering README with project IR:",
          JSON.stringify(ir.project)
        );
      }
      const rendered = renderTemplate(template, context);
      const content = parser ? await formatCode(rendered, parser) : rendered;

      files.push({
        path: output,
        content,
      });
    } catch (error) {
      console.error(`Error generating ${output}:`, error);
      throw new Error(`Failed to generate file: ${output}`);
    }
  }

  // Generate model files if MongoDB is selected
  if (databaseConfig.databaseType === "MongoDB" && ir.models.length > 0) {
    for (const model of ir.models) {
      const modelFiles = await generateModelFiles(model, ir);
      files.push(...modelFiles);
    }
  }

  // Generate Sprint 5 feature files
  const featureFiles = await generateFeatureFiles(ir);
  files.push(...featureFiles);

  // Generate Sprint 6 relationship files
  if (ir.relationships && ir.relationships.length > 0) {
    const relationshipFiles = await generateRelationshipFiles(ir);
    files.push(...relationshipFiles);
  }

  // Generate Sprint 8 Docker files
  if (ir.docker && ir.docker.enabled) {
    const dockerFiles = await generateDockerFiles(ir);
    files.push(...dockerFiles);
  }

  // Generate Sprint 8 CI/CD files
  if (ir.cicd && ir.cicd.enabled) {
    const cicdFiles = await generateCICDFiles(ir);
    files.push(...cicdFiles);
  }

  // Generate Sprint 8 E2E test files
  if (ir.cicd && ir.cicd.includeE2E) {
    const testFiles = await generateE2ETestFiles(ir);
    files.push(...testFiles);
  }

  // Generate global exception filter
  const exceptionFilterFile = await generateExceptionFilter(ir);
  files.push(exceptionFilterFile);

  // Generate Sprint 8 environment validation
  const envValidationFile = await generateEnvValidation(ir);
  files.push(envValidationFile);

  // Generate actual .env file with secure secrets
  const envFile = await generateEnvFile(ir);
  files.push(envFile);

  // Generate pagination utility
  const paginationFile = await generatePaginationDto(ir);
  files.push(paginationFile);

  // Generate error response DTO
  const errorResponseFile = await generateErrorResponseDto(ir);
  files.push(errorResponseFile);

  // Generate error codes enum
  const errorCodesFile = await generateErrorCodes(ir);
  files.push(errorCodesFile);

  // Generate global exception filter (production-ready version)
  const globalExceptionFilterFile = await generateGlobalExceptionFilter(ir);
  files.push(globalExceptionFilterFile);

  // Generate success response interceptor
  const successInterceptorFile = await generateSuccessInterceptor(ir);
  files.push(successInterceptorFile);

  // Generate logging interceptor
  const loggingInterceptorFile = await generateLoggingInterceptor(ir);
  files.push(loggingInterceptorFile);

  // Generate request ID middleware
  const requestIdMiddlewareFile = await generateRequestIdMiddleware(ir);
  files.push(requestIdMiddlewareFile);

  // Generate timeout middleware
  const timeoutMiddlewareFile = await generateTimeoutMiddleware(ir);
  files.push(timeoutMiddlewareFile);

  // Generate pagination query DTO
  const paginationQueryDtoFile = await generatePaginationQueryDto(ir);
  files.push(paginationQueryDtoFile);

  // Generate base repository with transaction support (MongoDB only)
  if (ir.database.type === "MongoDB") {
    const baseRepositoryFile = await generateBaseRepository(ir);
    files.push(baseRepositoryFile);

    // Generate soft delete plugin
    const softDeletePluginFile = await generateSoftDeletePlugin(ir);
    files.push(softDeletePluginFile);
  }

  // Generate refresh token schema if auth is enabled with rotation
  if (ir.auth?.enabled && ir.auth?.jwt?.rotation) {
    const refreshTokenSchemaFile = await generateRefreshTokenSchema(ir);
    files.push(refreshTokenSchemaFile);

    const refreshTokenServiceFile = await generateRefreshTokenService(ir);
    files.push(refreshTokenServiceFile);
  }

  // Generate sanitization pipe
  const sanitizationPipeFile = await generateSanitizationPipe(ir);
  files.push(sanitizationPipeFile);

  // Generate sanitize utility
  const sanitizeUtilFile = await generateSanitizeUtil(ir);
  files.push(sanitizeUtilFile);

  // Generate CSRF middleware
  const csrfMiddlewareFile = await generateCsrfMiddleware(ir);
  files.push(csrfMiddlewareFile);

  // Generate Postman collection
  const postmanCollectionFile = await generatePostmanCollection(ir);
  files.push(postmanCollectionFile);

  // Generate Sprint 8 metadata file
  const metadataFile = await generateMetadata(ir);
  files.push(metadataFile);

  return files;
}

/**
 * Generate all files for a single model
 */
async function generateModelFiles(
  model: ModelIR,
  ir: ProjectIR
): Promise<GeneratedFile[]> {
  const files: GeneratedFile[] = [];

  const modelTemplates = [
    {
      template: "mongoose/schema.njk",
      output: `${model.modulePath}/schemas/${model.fileName}.schema.ts`,
      parser: "typescript",
    },
    {
      template: "mongoose/repository.njk",
      output: `${model.modulePath}/${model.fileName}.repository.ts`,
      parser: "typescript",
    },
    {
      template: "mongoose/service.njk",
      output: `${model.modulePath}/${model.fileName}.service.ts`,
      parser: "typescript",
    },
    {
      template: "mongoose/controller.njk",
      output: `${model.modulePath}/${model.fileName}.controller.ts`,
      parser: "typescript",
    },
    {
      template: "mongoose/module.njk",
      output: `${model.modulePath}/${model.fileName}.module.ts`,
      parser: "typescript",
    },
    {
      template: "mongoose/dto-create.njk",
      output: `${model.modulePath}/dto/create-${model.fileName}.dto.ts`,
      parser: "typescript",
    },
    {
      template: "mongoose/dto-update.njk",
      output: `${model.modulePath}/dto/update-${model.fileName}.dto.ts`,
      parser: "typescript",
    },
    {
      template: "mongoose/dto-output.njk",
      output: `${model.modulePath}/dto/${model.fileName}-output.dto.ts`,
      parser: "typescript",
    },
    {
      template: "mongoose/service.spec.njk",
      output: `${model.modulePath}/${model.fileName}.service.spec.ts`,
      parser: "typescript",
    },
    {
      template: "mongoose/controller.spec.njk",
      output: `${model.modulePath}/${model.fileName}.controller.spec.ts`,
      parser: "typescript",
    },
  ];

  for (const { template, output, parser } of modelTemplates) {
    try {
      const rendered = renderTemplate(template, { model, project: ir });
      const content = parser ? await formatCode(rendered, parser) : rendered;

      files.push({
        path: output,
        content,
      });
    } catch (error) {
      console.error(
        `Error generating ${output} for model ${model.name}:`,
        error
      );
      throw new Error(`Failed to generate ${output} for model ${model.name}`);
    }
  }

  return files;
}

/**
 * Generate all auth-related files (Sprint 3)
 */
async function generateAuthFiles(ir: ProjectIR): Promise<GeneratedFile[]> {
  const files: GeneratedFile[] = [];

  const authTemplates = [
    {
      template: "auth/auth.module.njk",
      output: "src/modules/auth/auth.module.ts",
      parser: "typescript",
    },
    {
      template: "auth/auth.controller.njk",
      output: "src/modules/auth/auth.controller.ts",
      parser: "typescript",
    },
    {
      template: "auth/auth.service.njk",
      output: "src/modules/auth/auth.service.ts",
      parser: "typescript",
    },
    {
      template: "auth/strategies/jwt.strategy.njk",
      output: "src/modules/auth/strategies/jwt.strategy.ts",
      parser: "typescript",
    },
    {
      template: "auth/guards/jwt-auth.guard.njk",
      output: "src/modules/auth/guards/jwt-auth.guard.ts",
      parser: "typescript",
    },
    {
      template: "auth/guards/email-verified.guard.njk",
      output: "src/modules/auth/guards/email-verified.guard.ts",
      parser: "typescript",
    },
    {
      template: "auth/decorators/require-email-verification.decorator.njk",
      output:
        "src/modules/auth/decorators/require-email-verification.decorator.ts",
      parser: "typescript",
    },
    {
      template: "auth/dtos/register.dto.njk",
      output: "src/modules/auth/dtos/register.dto.ts",
      parser: "typescript",
    },
    {
      template: "auth/dtos/login.dto.njk",
      output: "src/modules/auth/dtos/login.dto.ts",
      parser: "typescript",
    },
    {
      template: "auth/dtos/refresh.dto.njk",
      output: "src/modules/auth/dtos/refresh.dto.ts",
      parser: "typescript",
    },
    {
      template: "auth/dtos/user-output.dto.njk",
      output: "src/modules/user/dtos/user-output.dto.ts",
      parser: "typescript",
    },
    {
      template: "auth/dtos/forgot-password.dto.njk",
      output: "src/modules/auth/dtos/forgot-password.dto.ts",
      parser: "typescript",
    },
    {
      template: "auth/dtos/reset-password.dto.njk",
      output: "src/modules/auth/dtos/reset-password.dto.ts",
      parser: "typescript",
    },
    {
      template: "auth/password-reset.service.njk",
      output: "src/modules/auth/password-reset.service.ts",
      parser: "typescript",
    },
    {
      template: "auth/password-reset.controller.njk",
      output: "src/modules/auth/password-reset.controller.ts",
      parser: "typescript",
    },
    {
      template: "auth/email-verification.service.njk",
      output: "src/modules/auth/email-verification.service.ts",
      parser: "typescript",
    },
    {
      template: "auth/email-verification.controller.njk",
      output: "src/modules/auth/email-verification.controller.ts",
      parser: "typescript",
    },
    {
      template: "auth/rbac/roles.decorator.njk",
      output: "src/modules/auth/rbac/roles.decorator.ts",
      parser: "typescript",
    },
    {
      template: "auth/rbac/roles.guard.njk",
      output: "src/modules/auth/rbac/roles.guard.ts",
      parser: "typescript",
    },
    {
      template: "auth/rbac/roles.enum.njk",
      output: "src/modules/auth/rbac/roles.enum.ts",
      parser: "typescript",
    },
    {
      template: "auth/user.schema.njk",
      output: "src/modules/user/user.schema.ts",
      parser: "typescript",
    },
    {
      template: "auth/user.repository.njk",
      output: "src/modules/user/user.repository.ts",
      parser: "typescript",
    },
  ];

  for (const { template, output, parser } of authTemplates) {
    try {
      const rendered = renderTemplate(template, ir);
      const content = parser ? await formatCode(rendered, parser) : rendered;
      files.push({ path: output, content });
    } catch (error) {
      console.error(`Error generating auth file ${output}:`, error);
      throw new Error(`Failed to generate auth file: ${output}`);
    }
  }

  return files;
}

/**
 * Generate OAuth files (strategies, guards, controller) based on enabled providers
 */
async function generateOAuthFiles(ir: ProjectIR): Promise<GeneratedFile[]> {
  const files: GeneratedFile[] = [];

  if (!ir.oauth || !ir.oauth.enabled || !ir.oauth.providers.length) {
    return files;
  }

  // Generate strategy and guard for each enabled provider
  for (const provider of ir.oauth.providers) {
    const providerName = provider.name.toLowerCase();

    // Generate strategy file
    try {
      const strategyTemplate = `auth/oauth/${providerName}.strategy.njk`;
      const rendered = renderTemplate(strategyTemplate, ir);
      const content = await formatCode(rendered, "typescript");
      files.push({
        path: `src/modules/auth/oauth/${providerName}.strategy.ts`,
        content,
      });
    } catch (error) {
      console.error(`Error generating ${providerName} strategy:`, error);
      throw new Error(`Failed to generate ${providerName} strategy`);
    }

    // Generate guard file
    try {
      const guardTemplate = `auth/oauth/${providerName}.guard.njk`;
      const rendered = renderTemplate(guardTemplate, ir);
      const content = await formatCode(rendered, "typescript");
      files.push({
        path: `src/modules/auth/oauth/${providerName}.guard.ts`,
        content,
      });
    } catch (error) {
      console.error(`Error generating ${providerName} guard:`, error);
      throw new Error(`Failed to generate ${providerName} guard`);
    }
  }

  // Generate OAuth controller (shared by all providers)
  try {
    const rendered = renderTemplate("auth/oauth/oauth.controller.njk", ir);
    const content = await formatCode(rendered, "typescript");
    files.push({
      path: "src/modules/auth/oauth/oauth.controller.ts",
      content,
    });
  } catch (error) {
    console.error("Error generating OAuth controller:", error);
    throw new Error("Failed to generate OAuth controller");
  }

  return files;
}

/**
 * Generate relationship files (join models, DTOs) based on relationship configuration
 */
async function generateRelationshipFiles(
  ir: ProjectIR
): Promise<GeneratedFile[]> {
  const files: GeneratedFile[] = [];

  if (!ir.relationships || ir.relationships.length === 0) {
    return files;
  }

  for (const relationship of ir.relationships) {
    // Generate join model for many-to-many with attributes
    if (relationship.throughModel) {
      const joinModelContext = {
        relationship,
        model: relationship.throughModel,
        project: ir,
      };

      try {
        const rendered = renderTemplate(
          "mongoose/relationship-manytomany-join.njk",
          joinModelContext
        );
        const content = await formatCode(rendered, "typescript");
        const fileName = relationship.throughModel.fileName;
        files.push({
          path: `src/modules/relationships/${fileName}.schema.ts`,
          content,
        });
      } catch (error) {
        console.error(
          `Error generating join model for ${relationship.id}:`,
          error
        );
      }
    }

    // Generate relationship DTOs
    const dtoContext = { relationship, project: ir };

    // Connect DTO
    try {
      const rendered = renderTemplate(
        "mongoose/dto-connect-relationship.njk",
        dtoContext
      );
      const content = await formatCode(rendered, "typescript");
      const fromModel = relationship.fromModel.toLowerCase();
      const toModel = relationship.toModel.toLowerCase();
      files.push({
        path: `src/modules/relationships/dto/connect-${fromModel}-${toModel}.dto.ts`,
        content,
      });
    } catch (error) {
      console.error(
        `Error generating connect DTO for ${relationship.id}:`,
        error
      );
    }

    // Disconnect DTO
    try {
      const rendered = renderTemplate(
        "mongoose/dto-disconnect-relationship.njk",
        dtoContext
      );
      const content = await formatCode(rendered, "typescript");
      const fromModel = relationship.fromModel.toLowerCase();
      const toModel = relationship.toModel.toLowerCase();
      files.push({
        path: `src/modules/relationships/dto/disconnect-${fromModel}-${toModel}.dto.ts`,
        content,
      });
    } catch (error) {
      console.error(
        `Error generating disconnect DTO for ${relationship.id}:`,
        error
      );
    }

    // Create join DTO (for M:N with attributes)
    if (
      relationship.type === "many-to-many" &&
      relationship.attributes &&
      relationship.attributes.length > 0
    ) {
      try {
        const rendered = renderTemplate(
          "mongoose/dto-create-join.njk",
          dtoContext
        );
        const content = await formatCode(rendered, "typescript");
        const joinName = (
          relationship.through ||
          `${relationship.fromModel}${relationship.toModel}`
        ).toLowerCase();
        files.push({
          path: `src/modules/relationships/dto/create-${joinName}.dto.ts`,
          content,
        });
      } catch (error) {
        console.error(
          `Error generating create-join DTO for ${relationship.id}:`,
          error
        );
      }
    }
  }

  return files;
}

/**
 * Generate Sprint 5 feature files based on feature toggles
 */
async function generateFeatureFiles(ir: ProjectIR): Promise<GeneratedFile[]> {
  const files: GeneratedFile[] = [];

  // Logging feature (Pino)
  if (ir.features.logging) {
    const loggingTemplates = [
      {
        template: "features/logging/logger.module.njk",
        output: "src/modules/logger/logger.module.ts",
      },
      {
        template: "features/logging/logging.interceptor.njk",
        output: "src/modules/logger/logging.interceptor.ts",
      },
    ];

    for (const { template, output } of loggingTemplates) {
      try {
        const rendered = renderTemplate(template, ir);
        const content = await formatCode(rendered, "typescript");
        files.push({ path: output, content });
      } catch (error) {
        console.error(`Error generating logging file ${output}:`, error);
      }
    }
  }

  // Caching feature (Redis)
  if (ir.features.caching) {
    const cachingTemplates = [
      {
        template: "features/caching/cache.module.njk",
        output: "src/modules/cache/cache.module.ts",
      },
      {
        template: "features/caching/cache.interceptor.njk",
        output: "src/modules/cache/cache.interceptor.ts",
      },
    ];

    for (const { template, output } of cachingTemplates) {
      try {
        const rendered = renderTemplate(template, ir);
        const content = await formatCode(rendered, "typescript");
        files.push({ path: output, content });
      } catch (error) {
        console.error(`Error generating caching file ${output}:`, error);
      }
    }
  }

  // Swagger documentation
  if (ir.features.swagger) {
    try {
      const rendered = renderTemplate(
        "features/swagger/swagger.config.njk",
        ir
      );
      const content = await formatCode(rendered, "typescript");
      files.push({
        path: "src/config/swagger.config.ts",
        content,
      });
    } catch (error) {
      console.error("Error generating Swagger config:", error);
    }
  }

  // Health checks (Terminus)
  if (ir.features.health) {
    const healthTemplates = [
      {
        template: "features/health/health.module.njk",
        output: "src/modules/health/health.module.ts",
      },
      {
        template: "features/health/health.controller.njk",
        output: "src/modules/health/health.controller.ts",
      },
    ];

    for (const { template, output } of healthTemplates) {
      try {
        const rendered = renderTemplate(template, ir);
        const content = await formatCode(rendered, "typescript");
        files.push({ path: output, content });
      } catch (error) {
        console.error(`Error generating health file ${output}:`, error);
      }
    }
  }

  // Rate limiting (Throttler)
  if (ir.features.rateLimit) {
    try {
      const rendered = renderTemplate(
        "features/throttler/throttler.module.njk",
        ir
      );
      const content = await formatCode(rendered, "typescript");
      files.push({
        path: "src/modules/throttler/throttler.module.ts",
        content,
      });
    } catch (error) {
      console.error("Error generating Throttler module:", error);
    }
  }

  // Background Job Queues (BullMQ)
  if (ir.features.queues) {
    const queueFiles = await generateQueueFiles(ir);
    files.push(...queueFiles);
  }

  // S3 File Upload Lifecycle
  if (ir.features.s3Upload) {
    const s3Files = await generateS3LifecycleFiles(ir);
    files.push(...s3Files);
  }

  // Email Service (always generated when auth is enabled)
  if (ir.auth?.enabled) {
    const emailFiles = await generateEmailFiles(ir);
    files.push(...emailFiles);
  }

  // Encryption Layer (KMS + AES-GCM field-level encryption)
  // CRITICAL for medical data, financial data, or PII
  const encryptionFiles = await generateEncryptionFiles(ir);
  files.push(...encryptionFiles);

  // Field-Level Access Control (FLAC)
  // Role-based field filtering to hide sensitive data from unauthorized users
  const flacFiles = await generateFieldAccessFiles(ir);
  files.push(...flacFiles);

  // Database Seeding Script (always generated)
  const seedFiles = await generateSeedScript(ir);
  files.push(...seedFiles);

  // Git Hooks (Husky + lint-staged)
  if (ir.features.gitHooks) {
    const gitHooksFiles = await generateGitHooksFiles(ir);
    files.push(...gitHooksFiles);
  }

  // SonarQube Configuration
  if (ir.features.sonarQube) {
    const sonarFiles = await generateSonarFiles(ir);
    files.push(...sonarFiles);
  }

  return files;
}

/**
 * Generate Background Job Queue files (BullMQ + BullBoard)
 */
async function generateQueueFiles(ir: ProjectIR): Promise<GeneratedFile[]> {
  const files: GeneratedFile[] = [];

  const queueTemplates = [
    // Core queue infrastructure
    {
      template: "features/queues/queue.module.njk",
      output: "src/modules/queue/queue.module.ts",
    },
    {
      template: "features/queues/queue.config.njk",
      output: "src/modules/queue/queue.config.ts",
    },

    // Job interfaces
    {
      template: "features/queues/interfaces/notification-jobs.interface.njk",
      output: "src/modules/queue/interfaces/notification-jobs.interface.ts",
    },
    {
      template: "features/queues/interfaces/document-jobs.interface.njk",
      output: "src/modules/queue/interfaces/document-jobs.interface.ts",
    },
    {
      template: "features/queues/interfaces/sync-jobs.interface.njk",
      output: "src/modules/queue/interfaces/sync-jobs.interface.ts",
    },
    {
      template: "features/queues/interfaces/analytics-jobs.interface.njk",
      output: "src/modules/queue/interfaces/analytics-jobs.interface.ts",
    },
    {
      template: "features/queues/interfaces/cleanup-jobs.interface.njk",
      output: "src/modules/queue/interfaces/cleanup-jobs.interface.ts",
    },

    // Producers
    {
      template: "features/queues/producers/notification.producer.njk",
      output: "src/modules/queue/producers/notification.producer.ts",
    },
    {
      template: "features/queues/producers/document.producer.njk",
      output: "src/modules/queue/producers/document.producer.ts",
    },
    {
      template: "features/queues/producers/sync.producer.njk",
      output: "src/modules/queue/producers/sync.producer.ts",
    },
    {
      template: "features/queues/producers/analytics.producer.njk",
      output: "src/modules/queue/producers/analytics.producer.ts",
    },
    {
      template: "features/queues/producers/cleanup.producer.njk",
      output: "src/modules/queue/producers/cleanup.producer.ts",
    },

    // Processors
    {
      template: "features/queues/processors/notification.processor.njk",
      output: "src/modules/queue/processors/notification.processor.ts",
    },
    {
      template: "features/queues/processors/document.processor.njk",
      output: "src/modules/queue/processors/document.processor.ts",
    },
    {
      template: "features/queues/processors/sync.processor.njk",
      output: "src/modules/queue/processors/sync.processor.ts",
    },
    {
      template: "features/queues/processors/analytics.processor.njk",
      output: "src/modules/queue/processors/analytics.processor.ts",
    },
    {
      template: "features/queues/processors/cleanup.processor.njk",
      output: "src/modules/queue/processors/cleanup.processor.ts",
    },

    // Worker entry points
    {
      template: "features/queues/workers/queue-worker.main.njk",
      output: "src/workers/queue-worker.main.ts",
    },
    {
      template: "features/queues/workers/dedicated-worker.main.njk",
      output: "src/workers/dedicated-worker.main.ts",
    },
    {
      template: "features/queues/workers/README.md.njk",
      output: "src/workers/README.md",
      parser: "markdown",
    },
  ];

  for (const { template, output, parser } of queueTemplates) {
    try {
      const rendered = renderTemplate(template, ir);
      const content = parser
        ? await formatCode(rendered, parser as any)
        : rendered;
      files.push({ path: output, content });
    } catch (error) {
      console.error(`Error generating queue file ${output}:`, error);
    }
  }

  return files;
}

/**
 * Generate S3 File Upload Lifecycle files
 */
async function generateS3LifecycleFiles(
  ir: ProjectIR
): Promise<GeneratedFile[]> {
  const files: GeneratedFile[] = [];

  const s3Templates = [
    // Core S3 service
    {
      template: "features/s3-lifecycle/s3-lifecycle.service.njk",
      output: "src/modules/s3-lifecycle/s3-lifecycle.service.ts",
    },
    {
      template: "features/s3-lifecycle/s3-lifecycle.module.njk",
      output: "src/modules/s3-lifecycle/s3-lifecycle.module.ts",
    },
    {
      template: "features/s3-lifecycle/file-upload.controller.njk",
      output: "src/modules/s3-lifecycle/file-upload.controller.ts",
    },

    // Interfaces and DTOs
    {
      template: "features/s3-lifecycle/interfaces/file-metadata.interface.njk",
      output: "src/modules/s3-lifecycle/interfaces/file-metadata.interface.ts",
    },
    {
      template: "features/s3-lifecycle/dtos/file-upload.dto.njk",
      output: "src/modules/s3-lifecycle/dtos/file-upload.dto.ts",
    },

    // Documentation
    {
      template: "features/s3-lifecycle/S3_LIFECYCLE_RULES.md.njk",
      output: "S3_LIFECYCLE_RULES.md",
    },
  ];

  for (const { template, output } of s3Templates) {
    try {
      const rendered = renderTemplate(template, ir);
      files.push({
        path: output,
        content: await formatCode(rendered, output),
      });
    } catch (error) {
      console.error(`Error generating ${output}:`, error);
    }
  }

  return files;
}

/**
 * Generate Email Service files
 */
async function generateEmailFiles(ir: ProjectIR): Promise<GeneratedFile[]> {
  const files: GeneratedFile[] = [];

  const emailTemplates = [
    // Core email service
    {
      template: "email/email.module.njk",
      output: "src/email/email.module.ts",
    },
    {
      template: "email/email.service.njk",
      output: "src/email/email.service.ts",
    },

    // Email templates (Handlebars)
    {
      template: "email/templates/email-verification.hbs",
      output: "src/email/templates/email-verification.hbs",
    },
    {
      template: "email/templates/password-reset.hbs",
      output: "src/email/templates/password-reset.hbs",
    },
    {
      template: "email/templates/welcome.hbs",
      output: "src/email/templates/welcome.hbs",
    },
    {
      template: "email/templates/notification.hbs",
      output: "src/email/templates/notification.hbs",
    },
  ];

  for (const { template, output } of emailTemplates) {
    try {
      let content: string;

      // For .hbs files (Handlebars), copy them as-is without Nunjucks rendering
      if (template.endsWith(".hbs")) {
        const templatePath = join(__dirname, "..", "templates", template);
        content = readFileSync(templatePath, "utf-8");
      } else {
        // For .njk files (Nunjucks), render and format
        const rendered = renderTemplate(template, ir);
        content = output.endsWith(".ts")
          ? await formatCode(rendered, output)
          : rendered;
      }

      files.push({
        path: output,
        content,
      });
    } catch (error) {
      console.error(`Error generating ${output}:`, error);
    }
  }

  return files;
}

/**
 * Generate Encryption Layer files
 */
async function generateEncryptionFiles(
  ir: ProjectIR
): Promise<GeneratedFile[]> {
  const files: GeneratedFile[] = [];

  const encryptionFiles = [
    {
      template: "common/encryption-strategy.enum.njk",
      output: "src/common/encryption-strategy.enum.ts",
    },
    {
      template: "common/local-kms.service.njk",
      output: "src/common/local-kms.service.ts",
    },
    {
      template: "common/kms.service.njk",
      output: "src/common/kms.service.ts",
    },
    {
      template: "common/encryption.util.njk",
      output: "src/common/encryption.util.ts",
    },
    {
      template: "common/encryption.service.njk",
      output: "src/common/encryption.service.ts",
    },
    {
      template: "common/encryption.module.njk",
      output: "src/common/encryption.module.ts",
    },
    {
      template: "common/encryption.interceptor.njk",
      output: "src/common/encryption.interceptor.ts",
    },
  ];

  for (const { template, output } of encryptionFiles) {
    try {
      const rendered = renderTemplate(template, ir);
      const content = await formatCode(rendered, output);
      files.push({
        path: output,
        content,
      });
    } catch (error) {
      console.error(`Error generating ${output}:`, error);
    }
  }

  return files;
}

/**
 * Generate Field-Level Access Control (FLAC) files
 */
async function generateFieldAccessFiles(
  ir: ProjectIR
): Promise<GeneratedFile[]> {
  const files: GeneratedFile[] = [];

  // FLAC files are always generated when auth is enabled
  if (!ir.auth?.enabled) {
    return files;
  }

  const flacFiles = [
    {
      template: "access-control/field-access.policy.njk",
      output: "src/access-control/field-access.policy.ts",
    },
    {
      template: "access-control/field-filter.util.njk",
      output: "src/access-control/field-filter.util.ts",
    },
    {
      template: "access-control/field-access-rule.schema.njk",
      output: "src/access-control/field-access-rule.schema.ts",
    },
    {
      template: "access-control/field-access.decorator.njk",
      output: "src/access-control/field-access.decorator.ts",
    },
    {
      template: "access-control/field-access.interceptor.njk",
      output: "src/access-control/field-access.interceptor.ts",
    },
    {
      template: "access-control/field-access.service.njk",
      output: "src/access-control/field-access.service.ts",
    },
    {
      template: "access-control/field-access.controller.njk",
      output: "src/access-control/field-access.controller.ts",
    },
    {
      template: "access-control/field-access.module.njk",
      output: "src/access-control/field-access.module.ts",
    },
    {
      template: "FIELD_ACCESS_CONTROL_GUIDE.md.njk",
      output: "FIELD_ACCESS_CONTROL_GUIDE.md",
    },
  ];

  for (const { template, output } of flacFiles) {
    try {
      const rendered = renderTemplate(template, ir);
      const content = output.endsWith(".md")
        ? rendered
        : await formatCode(rendered, output);
      files.push({
        path: output,
        content,
      });
    } catch (error) {
      console.error(`Error generating ${output}:`, error);
    }
  }

  return files;
}

/**
 * Generate Database Seeding Script
 */
async function generateSeedScript(ir: ProjectIR): Promise<GeneratedFile[]> {
  const files: GeneratedFile[] = [];

  try {
    const rendered = renderTemplate("scripts/seed.ts.njk", ir);
    files.push({
      path: "src/scripts/seed.ts",
      content: await formatCode(rendered, "src/scripts/seed.ts"),
    });
  } catch (error) {
    console.error("Error generating seed script:", error);
  }

  return files;
}

/**
 * Generate Docker files (Sprint 8)
 */
async function generateDockerFiles(ir: ProjectIR): Promise<GeneratedFile[]> {
  const files: GeneratedFile[] = [];

  // Dockerfile
  try {
    const rendered = renderTemplate("docker/Dockerfile.njk", ir);
    files.push({
      path: "Dockerfile",
      content: rendered,
    });
  } catch (error) {
    console.error("Error generating Dockerfile:", error);
  }

  // .dockerignore
  try {
    const rendered = renderTemplate("docker/.dockerignore.njk", ir);
    files.push({
      path: ".dockerignore",
      content: rendered,
    });
  } catch (error) {
    console.error("Error generating .dockerignore:", error);
  }

  // docker-compose.yml
  if (ir.docker?.includeCompose) {
    try {
      const rendered = renderTemplate("docker/docker-compose.yml.njk", ir);
      files.push({
        path: "docker-compose.yml",
        content: rendered,
      });
    } catch (error) {
      console.error("Error generating docker-compose.yml:", error);
    }
  }

  // docker-compose.prod.yml
  if (ir.docker?.includeProd) {
    try {
      const rendered = renderTemplate("docker/docker-compose.prod.yml.njk", ir);
      files.push({
        path: "docker-compose.prod.yml",
        content: rendered,
      });
    } catch (error) {
      console.error("Error generating docker-compose.prod.yml:", error);
    }
  }

  return files;
}

/**
 * Generate CI/CD workflow files (Sprint 8)
 */
async function generateCICDFiles(ir: ProjectIR): Promise<GeneratedFile[]> {
  const files: GeneratedFile[] = [];

  // GitHub Actions workflow
  if (ir.cicd?.githubActions) {
    try {
      const rendered = renderTemplate("cicd/github-actions.yml.njk", ir);
      files.push({
        path: ".github/workflows/build.yml",
        content: rendered,
      });
    } catch (error) {
      console.error("Error generating GitHub Actions workflow:", error);
    }
  }

  // GitLab CI pipeline
  if (ir.cicd?.gitlabCI) {
    try {
      const rendered = renderTemplate("cicd/gitlab-ci.yml.njk", ir);
      files.push({
        path: ".gitlab-ci.yml",
        content: rendered,
      });
    } catch (error) {
      console.error("Error generating GitLab CI pipeline:", error);
    }
  }

  return files;
}

/**
 * Generate E2E test files (Sprint 8)
 */
async function generateE2ETestFiles(ir: ProjectIR): Promise<GeneratedFile[]> {
  const files: GeneratedFile[] = [];

  // Jest E2E configuration
  try {
    const rendered = renderTemplate("tests/jest-e2e.json.njk", ir);
    const content = await formatCode(rendered, "json");
    files.push({
      path: "test/jest-e2e.json",
      content,
    });
  } catch (error) {
    console.error("Error generating jest-e2e.json:", error);
  }

  // Test setup file
  try {
    const rendered = renderTemplate("tests/setup.ts.njk", ir);
    const content = await formatCode(rendered, "typescript");
    files.push({
      path: "test/setup.ts",
      content,
    });
  } catch (error) {
    console.error("Error generating test setup:", error);
  }

  // Auth E2E tests (if auth is enabled)
  if (ir.auth && ir.auth.enabled) {
    try {
      const rendered = renderTemplate("tests/auth.e2e-spec.ts.njk", ir);
      const content = await formatCode(rendered, "typescript");
      files.push({
        path: "test/e2e/auth.e2e-spec.ts",
        content,
      });
    } catch (error) {
      console.error("Error generating auth E2E tests:", error);
    }
  }

  // CRUD E2E tests for each model
  for (const model of ir.models) {
    try {
      const rendered = renderTemplate("tests/crud.e2e-spec.ts.njk", {
        model,
        auth: ir.auth,
        project: ir,
      });
      const content = await formatCode(rendered, "typescript");
      files.push({
        path: `test/e2e/${model.fileName}.e2e-spec.ts`,
        content,
      });
    } catch (error) {
      console.error(`Error generating ${model.name} E2E tests:`, error);
    }
  }

  return files;
}

/**
 * Generate environment validation schema (Sprint 8)
 */
async function generateEnvValidation(ir: ProjectIR): Promise<GeneratedFile> {
  const rendered = renderTemplate("nestjs/env.schema.ts.njk", ir);
  const content = await formatCode(rendered, "typescript");

  return {
    path: "src/env.schema.ts",
    content,
  };
}

/**
 * Generate actual .env file with secure random secrets
 */
async function generateEnvFile(ir: ProjectIR): Promise<GeneratedFile> {
  // Use dynamic import for crypto since this file uses ES modules
  const crypto = await import("crypto");

  // Generate cryptographically secure random secrets
  const jwtSecret = crypto.randomBytes(32).toString("hex");
  const jwtRefreshSecret = crypto.randomBytes(32).toString("hex");

  // Create context with generated secrets
  const envContext = {
    ...ir,
    generatedSecrets: {
      jwtSecret,
      jwtRefreshSecret,
    },
  };

  // Render the .env.example template
  let rendered = renderTemplate("nestjs/.env.example.njk", envContext);

  // Replace placeholder secrets with generated ones
  rendered = rendered
    .replace(
      /JWT_SECRET=CHANGE_THIS_TO_A_STRONG_SECRET_MINIMUM_32_CHARACTERS/g,
      `JWT_SECRET=${jwtSecret}`
    )
    .replace(
      /JWT_REFRESH_SECRET=CHANGE_THIS_TO_A_DIFFERENT_STRONG_SECRET_MINIMUM_32_CHARACTERS/g,
      `JWT_REFRESH_SECRET=${jwtRefreshSecret}`
    );

  return {
    path: ".env",
    content: rendered,
  };
}

/**
 * Generate generator metadata file (Sprint 8)
 */
async function generateMetadata(ir: ProjectIR): Promise<GeneratedFile> {
  const rendered = renderTemplate("generator-meta.json.njk", ir);
  const content = await formatCode(rendered, "json");

  return {
    path: "generator-meta.json",
    content,
  };
}

/**
 * Generate global HTTP exception filter
 */
async function generateExceptionFilter(ir: ProjectIR): Promise<GeneratedFile> {
  const rendered = renderTemplate("filters/http-exception.filter.njk", ir);
  const content = await formatCode(rendered, "typescript");

  return {
    path: "src/filters/http-exception.filter.ts",
    content,
  };
}

/**
 * Generate pagination utility DTO
 */
async function generatePaginationDto(ir: ProjectIR): Promise<GeneratedFile> {
  const rendered = renderTemplate("nestjs/pagination.dto.njk", ir);
  const content = await formatCode(rendered, "typescript");

  return {
    path: "src/pagination.dto.ts",
    content,
  };
}

/**
 * Generate error response DTO
 */
async function generateErrorResponseDto(ir: ProjectIR): Promise<GeneratedFile> {
  const rendered = renderTemplate("common/error-response.dto.njk", ir);
  const content = await formatCode(rendered, "typescript");

  return {
    path: "src/common/error-response.dto.ts",
    content,
  };
}

/**
 * Generate base repository with transaction support
 */
async function generateBaseRepository(ir: ProjectIR): Promise<GeneratedFile> {
  const rendered = renderTemplate("mongoose/base.repository.njk", ir);
  const content = await formatCode(rendered, "typescript");

  return {
    path: "src/common/base.repository.ts",
    content,
  };
}

/**
 * Generate error codes enum
 */
async function generateErrorCodes(ir: ProjectIR): Promise<GeneratedFile> {
  const rendered = renderTemplate("common/error-codes.enum.njk", ir);
  const content = await formatCode(rendered, "typescript");

  return {
    path: "src/common/error-codes.enum.ts",
    content,
  };
}

/**
 * Generate global exception filter
 */
async function generateGlobalExceptionFilter(
  ir: ProjectIR
): Promise<GeneratedFile> {
  const rendered = renderTemplate("common/global-exception.filter.njk", ir);
  const content = await formatCode(rendered, "typescript");

  return {
    path: "src/common/global-exception.filter.ts",
    content,
  };
}

/**
 * Generate success response interceptor
 */
async function generateSuccessInterceptor(
  ir: ProjectIR
): Promise<GeneratedFile> {
  const rendered = renderTemplate(
    "common/success-response.interceptor.njk",
    ir
  );
  const content = await formatCode(rendered, "typescript");

  return {
    path: "src/common/success-response.interceptor.ts",
    content,
  };
}

/**
 * Generate logging interceptor
 */
async function generateLoggingInterceptor(
  ir: ProjectIR
): Promise<GeneratedFile> {
  const rendered = renderTemplate("common/logging.interceptor.njk", ir);
  const content = await formatCode(rendered, "typescript");

  return {
    path: "src/common/logging.interceptor.ts",
    content,
  };
}

/**
 * Generate request ID middleware
 */
async function generateRequestIdMiddleware(
  ir: ProjectIR
): Promise<GeneratedFile> {
  const rendered = renderTemplate("common/request-id.middleware.njk", ir);
  const content = await formatCode(rendered, "typescript");

  return {
    path: "src/common/request-id.middleware.ts",
    content,
  };
}

/**
 * Generate timeout middleware
 */
async function generateTimeoutMiddleware(
  ir: ProjectIR
): Promise<GeneratedFile> {
  const rendered = renderTemplate("common/timeout.middleware.njk", ir);
  const content = await formatCode(rendered, "typescript");

  return {
    path: "src/common/timeout.middleware.ts",
    content,
  };
}

/**
 * Generate Git Hooks files (Husky + lint-staged)
 */
async function generateGitHooksFiles(ir: ProjectIR): Promise<GeneratedFile[]> {
  const files: GeneratedFile[] = [];

  // .lintstagedrc
  try {
    const rendered = renderTemplate("nestjs/.lintstagedrc.njk", ir);
    const content = await formatCode(rendered, "json");
    files.push({
      path: ".lintstagedrc",
      content,
    });
  } catch (error) {
    console.error("Error generating .lintstagedrc:", error);
  }

  // Husky hooks
  const hooks = [
    {
      template: "husky/pre-commit.njk",
      output: ".husky/pre-commit",
    },
    {
      template: "husky/commit-msg.njk",
      output: ".husky/commit-msg",
    },
  ];

  for (const { template, output } of hooks) {
    try {
      const rendered = renderTemplate(template, ir);
      // Hooks are shell scripts, no formatting needed usually, or use simple formatting
      files.push({
        path: output,
        content: rendered,
      });
    } catch (error) {
      console.error(`Error generating ${output}:`, error);
    }
  }

  return files;
}

/**
 * Generate SonarQube configuration files
 */
async function generateSonarFiles(ir: ProjectIR): Promise<GeneratedFile[]> {
  const files: GeneratedFile[] = [];

  try {
    const rendered = renderTemplate("sonar/sonar-project.properties.njk", ir);
    files.push({
      path: "sonar-project.properties",
      content: rendered,
    });
  } catch (error) {
    console.error("Error generating sonar-project.properties:", error);
  }

  return files;
}

/**
 * Generate pagination query DTO
 */
async function generatePaginationQueryDto(
  ir: ProjectIR
): Promise<GeneratedFile> {
  const rendered = renderTemplate("common/pagination-query.dto.njk", ir);
  const content = await formatCode(rendered, "typescript");

  return {
    path: "src/common/pagination-query.dto.ts",
    content,
  };
}

/**
 * Generate soft delete plugin for Mongoose
 */
async function generateSoftDeletePlugin(ir: ProjectIR): Promise<GeneratedFile> {
  const rendered = renderTemplate("common/soft-delete.plugin.njk", ir);
  const content = await formatCode(rendered, "typescript");

  return {
    path: "src/common/soft-delete.plugin.ts",
    content,
  };
}

/**
 * Generate refresh token schema for auth
 */
async function generateRefreshTokenSchema(
  ir: ProjectIR
): Promise<GeneratedFile> {
  const rendered = renderTemplate("auth/refresh-token.schema.njk", ir);
  const content = await formatCode(rendered, "typescript");

  return {
    path: "src/auth/refresh-token.schema.ts",
    content,
  };
}

async function generateRefreshTokenService(
  ir: ProjectIR
): Promise<GeneratedFile> {
  const rendered = renderTemplate("auth/refresh-token.service.njk", ir);
  const content = await formatCode(rendered, "typescript");

  return {
    path: "src/auth/refresh-token.service.ts",
    content,
  };
}

async function generateSanitizationPipe(ir: ProjectIR): Promise<GeneratedFile> {
  const rendered = renderTemplate("common/sanitization.pipe.njk", ir);
  const content = await formatCode(rendered, "typescript");

  return {
    path: "src/common/sanitization.pipe.ts",
    content,
  };
}

async function generateSanitizeUtil(ir: ProjectIR): Promise<GeneratedFile> {
  const rendered = renderTemplate("common/sanitize.util.njk", ir);
  const content = await formatCode(rendered, "typescript");

  return {
    path: "src/common/sanitize.util.ts",
    content,
  };
}

async function generateCsrfMiddleware(ir: ProjectIR): Promise<GeneratedFile> {
  const rendered = renderTemplate("common/csrf.middleware.njk", ir);
  const content = await formatCode(rendered, "typescript");

  return {
    path: "src/common/csrf.middleware.ts",
    content,
  };
}

async function generatePostmanCollection(
  ir: ProjectIR
): Promise<GeneratedFile> {
  const rendered = renderTemplate("postman/collection.json.njk", ir);

  return {
    path: "postman-collection.json",
    content: rendered,
  };
}
