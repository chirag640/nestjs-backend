import nunjucks from "nunjucks";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure Nunjucks environment
const templatesPath = path.join(__dirname, "..", "templates");

const env = nunjucks.configure(templatesPath, {
  autoescape: false,
  throwOnUndefined: true,
  trimBlocks: true,
  lstripBlocks: true,
});

// Add custom filters
env.addFilter("lower", (str: any) => String(str ?? "").toLowerCase());
env.addFilter("upper", (str: any) => String(str ?? "").toUpperCase());
env.addFilter("replace", (str: string, search: string, replace: string) =>
  str.replace(new RegExp(search, "g"), replace)
);

// Provide a default filter to avoid throwing on undefined values in templates
env.addFilter("default", (value: any, fallback: any) => {
  if (value === undefined || value === null || value === "") return fallback;
  return value;
});

export interface TemplateContext {
  projectName: string;
  description: string;
  author: string;
  license: string;
  nodeVersion: string;
  packageManager: string;
  databaseType: string;
  provider: string;
  connectionString: string;
  autoMigration: string;
}

/**
 * Render a template file with the provided context
 */
export function renderTemplate(
  templatePath: string,
  context: TemplateContext | Record<string, any>
): string {
  try {
    // Provide backward-compatible flat aliases for templates that still use them
    const ctx: Record<string, any> = { ...(context as Record<string, any>) };

    // If we receive a ProjectIR-like context, expose flat names expected by older templates
    if (ctx.project) {
      const p = ctx.project;
      ctx.projectName = ctx.projectName ?? p.name;
      ctx.description = ctx.description ?? p.description;
      ctx.author = ctx.author ?? p.author;
      ctx.license = ctx.license ?? p.license;
      ctx.nodeVersion = ctx.nodeVersion ?? p.nodeVersion;
      ctx.packageManager = ctx.packageManager ?? p.packageManager;
    }

    if (ctx.database || ctx.project?.database) {
      const db = ctx.database ?? ctx.project?.database;
      ctx.databaseType = ctx.databaseType ?? db.type;
      ctx.provider = ctx.provider ?? db.provider;
      ctx.connectionString = ctx.connectionString ?? db.connectionString;
      ctx.autoMigration = ctx.autoMigration ?? db.autoMigration;
      ctx.orm = ctx.orm ?? db.orm;

      // Normalized dbType for templates expecting 'postgres'|'mysql'|'mongodb'
      const map: Record<string, string> = {
        PostgreSQL: "postgres",
        MySQL: "mysql",
        MongoDB: "mongodb",
      };
      ctx.dbType =
        ctx.dbType ?? map[db.type] ?? String(db.type ?? "").toLowerCase();
    }

    return env.render(templatePath, ctx);
  } catch (error) {
    console.error(`Error rendering template ${templatePath}:`, error);
    throw new Error(`Failed to render template: ${templatePath}`);
  }
}

/**
 * Render a template string directly
 */
export function renderString(
  template: string,
  context: TemplateContext | Record<string, any>
): string {
  try {
    return nunjucks.renderString(template, context);
  } catch (error) {
    console.error("Error rendering template string:", error);
    throw new Error("Failed to render template string");
  }
}
