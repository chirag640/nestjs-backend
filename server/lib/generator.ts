import * as prettier from "prettier";
import { renderTemplate, type TemplateContext } from "./templateRenderer";
import type { WizardConfig } from "../../shared/schema";
import { buildIR, type ProjectIR, type ModelIR } from "./irBuilder";

export interface GeneratedFile {
  path: string;
  content: string;
}

/**
 * Format code using Prettier
 */
async function formatCode(code: string, parser: string): Promise<string> {
  try {
    return await prettier.format(code, {
      parser,
      singleQuote: true,
      trailingComma: "all",
      semi: true,
      tabWidth: 2,
      printWidth: 100,
    });
  } catch (error) {
    console.error(`Prettier formatting error (${parser}):`, error);
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

  // Generate auth files if auth is enabled
  if (ir.auth && ir.auth.enabled) {
    const authFiles = await generateAuthFiles(ir);
    files.push(...authFiles);

    // Generate OAuth files if OAuth is enabled
    if (ir.oauth && ir.oauth.enabled) {
      const oauthFiles = await generateOAuthFiles(ir);
      files.push(...oauthFiles);
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
