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
  }

  // Generate health controller if enabled
  if (ir.features.health) {
    const healthFiles = await generateHealthFiles();
    files.push(...healthFiles);
  }

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
 * Generate health check files (Sprint 3)
 */
async function generateHealthFiles(): Promise<GeneratedFile[]> {
  const files: GeneratedFile[] = [];

  try {
    const rendered = renderTemplate("health/health.controller.njk", {});
    const content = await formatCode(rendered, "typescript");
    files.push({
      path: "src/health/health.controller.ts",
      content,
    });
  } catch (error) {
    console.error("Error generating health controller:", error);
    throw new Error("Failed to generate health controller");
  }

  return files;
}
