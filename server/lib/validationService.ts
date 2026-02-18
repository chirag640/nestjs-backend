import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { WizardConfig } from "../../shared/schema";
import { buildIR, type ProjectIR } from "./irBuilder";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface ValidationError {
  path: string;
  message: string;
  suggestion: string;
  code: string;
  severity: "error" | "warning" | "info";
}

export interface ValidationSuggestion {
  type: "fix" | "enhancement" | "warning";
  title: string;
  description: string;
  autoFixable: boolean;
  fix?: any; // The fix to apply
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  suggestions: ValidationSuggestion[];
  summary: string;
}

/**
 * Comprehensive validation service that checks all aspects of the configuration
 * to ensure successful generation
 */
export class ValidationService {
  private templatesPath: string;

  constructor() {
    // Resolve templates path relative to this file's location
    // Handles both tsx (ESM) runtime and compiled dist/ output
    const fromImportMeta = join(
      dirname(fileURLToPath(import.meta.url)),
      "..",
      "templates",
    );
    const fromCwd = join(process.cwd(), "server", "templates");

    if (existsSync(fromImportMeta)) {
      this.templatesPath = fromImportMeta;
    } else if (existsSync(fromCwd)) {
      this.templatesPath = fromCwd;
      console.log(
        `[ValidationService] Using CWD-based templates path: ${fromCwd}`,
      );
    } else {
      this.templatesPath = fromImportMeta; // fallback, will show proper errors
      console.warn(
        `[ValidationService] Templates directory not found at: ${fromImportMeta} or ${fromCwd}`,
      );
    }
  }

  /**
   * Perform comprehensive validation
   */
  async validate(config: WizardConfig): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const suggestions: ValidationSuggestion[] = [];

    // 1. Validate templates exist
    this.validateTemplates(config, errors, suggestions);

    // 2. Validate models and relationships
    this.validateModelsAndRelationships(config, errors, warnings, suggestions);

    // 3. Validate authentication configuration
    this.validateAuthConfig(config, errors, warnings, suggestions);

    // 4. Validate database configuration
    this.validateDatabaseConfig(config, errors, warnings, suggestions);

    // 5. Validate OAuth configuration
    this.validateOAuthConfig(config, errors, warnings, suggestions);

    // 6. Validate field types and constraints
    this.validateFieldTypes(config, errors, warnings, suggestions);

    // 7. Validate file upload configuration
    this.validateFileUploadConfig(config, errors, warnings, suggestions);

    // 8. Validate deployment configuration
    this.validateDeploymentConfig(config, errors, warnings, suggestions);

    // 9. Validate CI/CD configuration
    this.validateCICDConfig(config, errors, warnings, suggestions);

    // 10. Validate email configuration
    this.validateEmailConfig(config, errors, warnings, suggestions);

    // 11. Check for potential naming conflicts
    this.validateNamingConflicts(config, errors, warnings, suggestions);

    // 12. Validate feature dependencies
    this.validateFeatureDependencies(config, errors, warnings, suggestions);

    const valid = errors.length === 0;
    const summary = this.generateSummary(errors, warnings, suggestions);

    return {
      valid,
      errors,
      warnings,
      suggestions,
      summary,
    };
  }

  /**
   * Validate that all required templates exist
   */
  private validateTemplates(
    config: WizardConfig,
    errors: ValidationError[],
    suggestions: ValidationSuggestion[],
  ): void {
    const requiredTemplates = this.getRequiredTemplates(config);

    for (const template of requiredTemplates) {
      const templatePath = join(this.templatesPath, template);
      if (!existsSync(templatePath)) {
        errors.push({
          path: "templates",
          message: `Required template not found: ${template}`,
          suggestion: `Ensure the template file exists at server/templates/${template}`,
          code: "TEMPLATE_NOT_FOUND",
          severity: "error",
        });

        suggestions.push({
          type: "fix",
          title: `Missing Template: ${template}`,
          description: `The template ${template} is required but not found. This will cause generation to fail.`,
          autoFixable: false,
        });
      }
    }
  }

  /**
   * Get list of required templates based on configuration
   */
  private getRequiredTemplates(config: WizardConfig): string[] {
    const templates = [
      "nestjs/main.ts.njk",
      "nestjs/app.module.ts.njk",
      "nestjs/package.json.njk",
      "nestjs/tsconfig.json.njk",
      "nestjs/README.md.njk",
      "nestjs/.gitignore.njk",
      "nestjs/.eslintrc.js.njk",
      "nestjs/.prettierrc.njk",
    ];

    // Add auth templates if auth is enabled
    if (config.authConfig?.enabled) {
      templates.push(
        "auth/auth.module.njk",
        "auth/auth.controller.njk",
        "auth/auth.service.njk",
      );

      if (config.authConfig.method === "jwt") {
        templates.push(
          "auth/strategies/jwt.strategy.njk",
          "auth/guards/jwt-auth.guard.njk",
        );
      }
    }

    // Add OAuth templates if OAuth is enabled
    if (config.oauthConfig?.enabled) {
      templates.push(
        "auth/oauth/oauth.controller.njk",
        "auth/oauth/oauth.module.njk",
      );
    }

    // Add Docker templates if Docker is enabled
    if (config.dockerConfig?.enabled) {
      templates.push("docker/Dockerfile.njk", "docker/docker-compose.yml.njk");
    }

    // Add CI/CD templates if enabled
    if (config.cicdConfig?.enabled) {
      // Add GitHub Actions if enabled
      if (config.cicdConfig.githubActions) {
        templates.push("cicd/github-actions.yml.njk");
      }
      // Add GitLab CI if enabled
      if (config.cicdConfig.gitlabCI) {
        templates.push("cicd/gitlab-ci.yml.njk");
      }
    }

    // Note: File upload and email are features in featureSelection, not separate configs
    // Template validation for these would be added here when templates exist

    return templates;
  }

  /**
   * Validate models and relationships
   */
  private validateModelsAndRelationships(
    config: WizardConfig,
    errors: ValidationError[],
    warnings: ValidationError[],
    suggestions: ValidationSuggestion[],
  ): void {
    const models = config.modelDefinition?.models || [];
    const relationships = config.modelDefinition?.relationships || [];

    if (models.length === 0) {
      errors.push({
        path: "modelDefinition.models",
        message: "At least one model is required",
        suggestion: "Add at least one model to your project",
        code: "NO_MODELS",
        severity: "error",
      });

      suggestions.push({
        type: "fix",
        title: "No Models Defined",
        description:
          "Your project needs at least one model to generate a functional API.",
        autoFixable: false,
      });
    }

    // Check for invalid model names
    const modelNames = new Set<string>();
    models.forEach((model, index) => {
      if (!model.name) {
        errors.push({
          path: `modelDefinition.models[${index}].name`,
          message: "Model name is required",
          suggestion: "Provide a valid PascalCase name for the model",
          code: "MISSING_MODEL_NAME",
          severity: "error",
        });
      } else {
        // Check for duplicate model names
        if (modelNames.has(model.name)) {
          errors.push({
            path: `modelDefinition.models[${index}].name`,
            message: `Duplicate model name: ${model.name}`,
            suggestion: "Each model must have a unique name",
            code: "DUPLICATE_MODEL_NAME",
            severity: "error",
          });
        }
        modelNames.add(model.name);

        // Validate model name format (PascalCase)
        if (!/^[A-Z][a-zA-Z0-9]*$/.test(model.name)) {
          warnings.push({
            path: `modelDefinition.models[${index}].name`,
            message: `Model name "${model.name}" should be in PascalCase`,
            suggestion:
              'Use PascalCase for model names (e.g., "User", "BlogPost")',
            code: "INVALID_MODEL_NAME_FORMAT",
            severity: "warning",
          });

          suggestions.push({
            type: "fix",
            title: `Fix Model Name: ${model.name}`,
            description: `Model name should be in PascalCase. Suggested: ${this.toPascalCase(model.name)}`,
            autoFixable: true,
            fix: {
              path: `modelDefinition.models[${index}].name`,
              value: this.toPascalCase(model.name),
            },
          });
        }
      }

      // Check for models with no fields
      if (!model.fields || model.fields.length === 0) {
        errors.push({
          path: `modelDefinition.models[${index}].fields`,
          message: `Model "${model.name}" has no fields`,
          suggestion: "Add at least one field to the model",
          code: "NO_FIELDS",
          severity: "error",
        });
      }

      // Validate field names
      model.fields?.forEach((field, fieldIndex) => {
        if (!field.name) {
          errors.push({
            path: `modelDefinition.models[${index}].fields[${fieldIndex}].name`,
            message: "Field name is required",
            suggestion: "Provide a valid camelCase name for the field",
            code: "MISSING_FIELD_NAME",
            severity: "error",
          });
        } else if (!/^[a-z][a-zA-Z0-9]*$/.test(field.name)) {
          warnings.push({
            path: `modelDefinition.models[${index}].fields[${fieldIndex}].name`,
            message: `Field name "${field.name}" should be in camelCase`,
            suggestion:
              'Use camelCase for field names (e.g., "firstName", "emailAddress")',
            code: "INVALID_FIELD_NAME_FORMAT",
            severity: "warning",
          });
        }
      });
    });

    // Validate relationships
    relationships.forEach((rel, index) => {
      if (rel.sourceModel && !modelNames.has(rel.sourceModel)) {
        errors.push({
          path: `modelDefinition.relationships[${index}].sourceModel`,
          message: `Source model "${rel.sourceModel}" does not exist`,
          suggestion: `Valid models: ${Array.from(modelNames).join(", ")}`,
          code: "INVALID_SOURCE_MODEL",
          severity: "error",
        });
      }

      if (!rel.targetModel) {
        errors.push({
          path: `modelDefinition.relationships[${index}].targetModel`,
          message: "Target model is required",
          suggestion: `Valid models: ${Array.from(modelNames).join(", ")}`,
          code: "MISSING_TARGET_MODEL",
          severity: "error",
        });
      } else if (!modelNames.has(rel.targetModel)) {
        errors.push({
          path: `modelDefinition.relationships[${index}].targetModel`,
          message: `Target model "${rel.targetModel}" does not exist`,
          suggestion: `Valid models: ${Array.from(modelNames).join(", ")}`,
          code: "INVALID_TARGET_MODEL",
          severity: "error",
        });
      }

      // Check for self-referential relationships
      if (
        rel.sourceModel &&
        rel.targetModel &&
        rel.sourceModel === rel.targetModel
      ) {
        warnings.push({
          path: `modelDefinition.relationships[${index}]`,
          message: `Self-referential relationship detected: ${rel.sourceModel} → ${rel.targetModel}`,
          suggestion:
            "Self-referential relationships may require special handling. Ensure this is intentional.",
          code: "SELF_REFERENTIAL_RELATIONSHIP",
          severity: "warning",
        });
      }
    });

    // Check for isolated models (multiple models with no relationships)
    if (models.length > 1 && relationships.length === 0) {
      warnings.push({
        path: "modelDefinition.relationships",
        message: "Multiple models defined but no relationships",
        suggestion:
          "Consider adding relationships between models if they are related",
        code: "NO_RELATIONSHIPS",
        severity: "info",
      });

      suggestions.push({
        type: "enhancement",
        title: "Add Relationships",
        description:
          "You have multiple models but no relationships. Most applications benefit from defining relationships between models.",
        autoFixable: false,
      });
    }
  }

  /**
   * Validate authentication configuration
   */
  private validateAuthConfig(
    config: WizardConfig,
    errors: ValidationError[],
    warnings: ValidationError[],
    suggestions: ValidationSuggestion[],
  ): void {
    if (!config.authConfig?.enabled) {
      return;
    }

    const models = config.modelDefinition?.models || [];
    const hasUserModel = models.some((m) => m.name === "User");

    if (!hasUserModel) {
      errors.push({
        path: "authConfig",
        message: 'Authentication is enabled but no "User" model found',
        suggestion:
          "Create a User model with fields like: email, password, firstName, lastName",
        code: "MISSING_USER_MODEL",
        severity: "error",
      });

      suggestions.push({
        type: "fix",
        title: "Add User Model",
        description:
          "Authentication requires a User model. Add a User model with email and password fields.",
        autoFixable: false,
      });
    } else {
      // Check if User model has required fields
      const userModel = models.find((m) => m.name === "User");
      const fieldNames = new Set(userModel?.fields?.map((f) => f.name) || []);

      if (!fieldNames.has("email")) {
        warnings.push({
          path: "authConfig",
          message: 'User model should have an "email" field',
          suggestion:
            "Add an email field to the User model (type: String, unique: true)",
          code: "MISSING_EMAIL_FIELD",
          severity: "warning",
        });
      }

      if (!fieldNames.has("password")) {
        warnings.push({
          path: "authConfig",
          message: 'User model should have a "password" field',
          suggestion: "Add a password field to the User model (type: String)",
          code: "MISSING_PASSWORD_FIELD",
          severity: "warning",
        });
      }
    }

    // Validate method - JWT is the only supported method currently
    if (!config.authConfig.method) {
      errors.push({
        path: "authConfig.method",
        message: "Authentication method is required",
        suggestion: "Set method to 'jwt'",
        code: "NO_AUTH_METHOD",
        severity: "error",
      });
    }
  }

  /**
   * Validate database configuration
   */
  private validateDatabaseConfig(
    config: WizardConfig,
    errors: ValidationError[],
    warnings: ValidationError[],
    suggestions: ValidationSuggestion[],
  ): void {
    if (!config.databaseConfig) {
      errors.push({
        path: "databaseConfig",
        message: "Database configuration is required",
        suggestion: "Select a database type (PostgreSQL, MySQL, or MongoDB)",
        code: "MISSING_DATABASE_CONFIG",
        severity: "error",
      });
      return;
    }

    const { databaseType } = config.databaseConfig;

    // Note: ORM selection is handled by the generator based on database type
    // MongoDB -> Mongoose, PostgreSQL/MySQL -> TypeORM (by default)
    // No ORM field exists in current schema

    // Check connection string format
    if (config.databaseConfig.connectionString) {
      const connStr = config.databaseConfig.connectionString;
      const isValid = this.validateConnectionString(connStr, databaseType);

      if (!isValid) {
        warnings.push({
          path: "databaseConfig.connectionString",
          message: `Connection string format may be invalid for ${databaseType}`,
          suggestion: this.getConnectionStringExample(databaseType),
          code: "INVALID_CONNECTION_STRING",
          severity: "warning",
        });
      }
    }
  }

  /**
   * Validate OAuth configuration
   */
  private validateOAuthConfig(
    config: WizardConfig,
    errors: ValidationError[],
    warnings: ValidationError[],
    suggestions: ValidationSuggestion[],
  ): void {
    if (!config.oauthConfig?.enabled) {
      return;
    }

    const providers = config.oauthConfig.providers || [];

    if (providers.length === 0) {
      errors.push({
        path: "oauthConfig.providers",
        message: "OAuth is enabled but no providers configured",
        suggestion: "Add at least one OAuth provider (Google or GitHub)",
        code: "NO_OAUTH_PROVIDERS",
        severity: "error",
      });
    }

    providers.forEach((provider, index) => {
      if (!provider.clientId || provider.clientId.trim() === "") {
        warnings.push({
          path: `oauthConfig.providers[${index}].clientId`,
          message: `${provider.name} OAuth provider is missing clientId`,
          suggestion: `Obtain a client ID from ${provider.name} developer console`,
          code: "MISSING_OAUTH_CLIENT_ID",
          severity: "warning",
        });
      }

      if (!provider.clientSecret || provider.clientSecret.trim() === "") {
        warnings.push({
          path: `oauthConfig.providers[${index}].clientSecret`,
          message: `${provider.name} OAuth provider is missing clientSecret`,
          suggestion: `Obtain a client secret from ${provider.name} developer console`,
          code: "MISSING_OAUTH_CLIENT_SECRET",
          severity: "warning",
        });
      }
    });
  }

  /**
   * Validate field types and constraints
   */
  private validateFieldTypes(
    config: WizardConfig,
    errors: ValidationError[],
    warnings: ValidationError[],
    suggestions: ValidationSuggestion[],
  ): void {
    const models = config.modelDefinition?.models || [];

    models.forEach((model, modelIndex) => {
      model.fields?.forEach((field, fieldIndex) => {
        // Check for invalid field types (match schema enum values - lowercase)
        const validTypes = [
          "string",
          "number",
          "boolean",
          "date",
          "datetime",
          "string[]",
          "json",
          "json[]",
          "objectId",
          "enum",
        ];

        if (!validTypes.includes(field.type)) {
          warnings.push({
            path: `modelDefinition.models[${modelIndex}].fields[${fieldIndex}].type`,
            message: `Field "${field.name}" has unsupported type: ${field.type}`,
            suggestion: `Valid types: ${validTypes.join(", ")}`,
            code: "INVALID_FIELD_TYPE",
            severity: "warning",
          });
        }

        // Check for conflicting constraints
        if (field.required && field.defaultValue !== undefined) {
          warnings.push({
            path: `modelDefinition.models[${modelIndex}].fields[${fieldIndex}]`,
            message: `Field "${field.name}" is both required and has a default value`,
            suggestion:
              "Required fields with defaults will always use the default. Consider if this is intentional.",
            code: "CONFLICTING_CONSTRAINTS",
            severity: "info",
          });
        }

        // Check email format field
        if (
          field.name.toLowerCase().includes("email") &&
          field.type !== "string"
        ) {
          warnings.push({
            path: `modelDefinition.models[${modelIndex}].fields[${fieldIndex}].type`,
            message: `Field "${field.name}" appears to be an email but type is ${field.type}`,
            suggestion: 'Email fields should be type "string"',
            code: "INVALID_EMAIL_FIELD_TYPE",
            severity: "warning",
          });
        }
      });
    });
  }

  /**
   * Validate file upload configuration
   */
  private validateFileUploadConfig(
    config: WizardConfig,
    errors: ValidationError[],
    warnings: ValidationError[],
    suggestions: ValidationSuggestion[],
  ): void {
    // File upload is part of featureSelection.s3Upload in current schema
    // This method is kept for future expansion when file upload config is added
    if (!config.featureSelection?.s3Upload) {
      return;
    }

    // Future: Add validation for s3Upload configuration
    suggestions.push({
      type: "warning",
      title: "S3 Upload Configuration",
      description:
        "S3 file upload is enabled. Ensure you configure AWS credentials in environment variables.",
      autoFixable: false,
    });
  }

  /**
   * Validate deployment configuration
   */
  private validateDeploymentConfig(
    config: WizardConfig,
    errors: ValidationError[],
    warnings: ValidationError[],
    suggestions: ValidationSuggestion[],
  ): void {
    if (!config.dockerConfig) {
      return;
    }

    if (config.dockerConfig.enabled) {
      suggestions.push({
        type: "enhancement",
        title: "Docker Configuration",
        description:
          "Docker is enabled. Ensure you have Docker installed and configured on your deployment target.",
        autoFixable: false,
      });
    }
  }

  /**
   * Validate CI/CD configuration
   */
  private validateCICDConfig(
    config: WizardConfig,
    errors: ValidationError[],
    warnings: ValidationError[],
    suggestions: ValidationSuggestion[],
  ): void {
    if (!config.cicdConfig?.enabled) {
      return;
    }

    const cicd = config.cicdConfig;

    if (cicd.includeE2E && !cicd.includeTests) {
      warnings.push({
        path: "cicdConfig",
        message: "E2E tests included but test execution is disabled",
        suggestion:
          'Enable "includeTests" to execute E2E tests in CI/CD pipeline',
        code: "E2E_WITHOUT_TEST_EXECUTION",
        severity: "warning",
      });
    }
  }

  /**
   * Validate email configuration
   */
  private validateEmailConfig(
    config: WizardConfig,
    errors: ValidationError[],
    warnings: ValidationError[],
    suggestions: ValidationSuggestion[],
  ): void {
    // Email configuration is not in current schema
    // This method is kept for future expansion
    return;
  }

  /**
   * Validate naming conflicts
   */
  private validateNamingConflicts(
    config: WizardConfig,
    errors: ValidationError[],
    warnings: ValidationError[],
    suggestions: ValidationSuggestion[],
  ): void {
    const reservedNames = [
      "System",
      "Admin",
      "Config",
      "Database",
      "Auth",
      "User",
    ];
    const models = config.modelDefinition?.models || [];

    models.forEach((model, index) => {
      if (reservedNames.includes(model.name)) {
        warnings.push({
          path: `modelDefinition.models[${index}].name`,
          message: `Model name "${model.name}" may conflict with system modules`,
          suggestion: `Consider using a more specific name (e.g., "${model.name}Profile", "App${model.name}")`,
          code: "POTENTIAL_NAMING_CONFLICT",
          severity: "warning",
        });
      }
    });
  }

  /**
   * Validate feature dependencies
   */
  private validateFeatureDependencies(
    config: WizardConfig,
    errors: ValidationError[],
    warnings: ValidationError[],
    suggestions: ValidationSuggestion[],
  ): void {
    // OAuth requires auth to be enabled
    if (config.oauthConfig?.enabled && !config.authConfig?.enabled) {
      errors.push({
        path: "oauthConfig",
        message: "OAuth requires authentication to be enabled",
        suggestion: 'Enable authentication in "authConfig.enabled"',
        code: "OAUTH_REQUIRES_AUTH",
        severity: "error",
      });
    }

    // Note: deploymentConfig and platform are not in current schema
    // Removed auto-deploy validation as it's not applicable
  }

  /**
   * Helper methods
   */

  private toPascalCase(str: string): string {
    return str
      .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ""))
      .replace(/^(.)/, (c) => c.toUpperCase());
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private validateConnectionString(connStr: string, dbType: string): boolean {
    if (dbType === "PostgreSQL") {
      return (
        connStr.startsWith("postgresql://") || connStr.startsWith("postgres://")
      );
    } else if (dbType === "MySQL") {
      return connStr.startsWith("mysql://");
    } else if (dbType === "MongoDB") {
      return (
        connStr.startsWith("mongodb://") || connStr.startsWith("mongodb+srv://")
      );
    }
    return true;
  }

  private getConnectionStringExample(dbType: string): string {
    const examples: Record<string, string> = {
      PostgreSQL: 'Example: "postgresql://user:password@localhost:5432/dbname"',
      MySQL: 'Example: "mysql://user:password@localhost:3306/dbname"',
      MongoDB: 'Example: "mongodb://localhost:27017/dbname"',
    };
    return (
      examples[dbType] ||
      "Check database documentation for connection string format"
    );
  }

  private generateSummary(
    errors: ValidationError[],
    warnings: ValidationError[],
    suggestions: ValidationSuggestion[],
  ): string {
    if (errors.length === 0 && warnings.length === 0) {
      return "✅ Configuration is valid and ready for generation";
    }

    const parts = [];

    if (errors.length > 0) {
      parts.push(`❌ ${errors.length} error(s) found - generation will fail`);
    }

    if (warnings.length > 0) {
      parts.push(`⚠️  ${warnings.length} warning(s) found`);
    }

    if (suggestions.length > 0) {
      parts.push(`💡 ${suggestions.length} suggestion(s) available`);
    }

    return parts.join(" | ");
  }
}
