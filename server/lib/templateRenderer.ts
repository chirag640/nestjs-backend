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
env.addFilter("lower", (str: string) => str.toLowerCase());
env.addFilter("upper", (str: string) => str.toUpperCase());
env.addFilter("replace", (str: string, search: string, replace: string) =>
  str.replace(new RegExp(search, "g"), replace)
);

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
  context: TemplateContext
): string {
  try {
    return env.render(templatePath, context);
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
  context: TemplateContext
): string {
  try {
    return nunjucks.renderString(template, context);
  } catch (error) {
    console.error("Error rendering template string:", error);
    throw new Error("Failed to render template string");
  }
}
