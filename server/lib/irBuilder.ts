import type { WizardConfig, Model, Field } from "../../shared/schema";
import {
  toPascalCase,
  toCamelCase,
  toKebabCase,
  pluralize,
  mongooseTypeToTsType,
  fieldTypeToMongooseType,
  getValidatorDecorator,
  isReservedFieldName,
  sanitizeModelName,
} from "./namingUtils";
import { geminiService } from "./geminiService";

/**
 * Intermediate Representation for Model Fields
 */
export interface ModelFieldIR {
  name: string; // camelCase field name
  type: string; // original type (string, number, etc.)
  tsType: string; // TypeScript type
  mongooseType: string; // Mongoose Schema type
  required: boolean;
  unique: boolean;
  indexed: boolean;
  defaultValue?: string | number | boolean | null;
  validators: string[]; // class-validator decorators
  // Validation rules
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  enum?: string[];
  // Enhanced validation from Gemini
  enhancedValidators?: string[]; // Additional validators (IsPositive, IsInt, etc.)
  // API Documentation
  apiExample?: string; // Example value for Swagger
  apiDescription?: string; // Field description for API docs
}

/**
 * Intermediate Representation for Models
 */
export interface ModelIR {
  // Names in different cases
  name: string; // PascalCase: User
  nameCamel: string; // camelCase: user
  nameKebab: string; // kebab-case: user
  namePlural: string; // plural: users
  namePluralKebab: string; // plural kebab: users

  // Module structure
  modulePath: string; // src/modules/user
  fileName: string; // user

  // Routing
  route: string; // /users

  // Model data
  fields: ModelFieldIR[];
  timestamps: boolean;

  // DTOs
  createDtoName: string; // CreateUserDto
  updateDtoName: string; // UpdateUserDto
  outputDtoName: string; // UserOutputDto

  // RBAC (Role-Based Access Control)
  rbacRoles?: {
    create?: string[]; // Roles allowed to create
    read?: string[]; // Roles allowed to read (null = all authenticated)
    update?: string[]; // Roles allowed to update
    delete?: string[]; // Roles allowed to delete
  };
}

/**
 * Intermediate Representation for Authentication (Sprint 3)
 */
export interface AuthIR {
  enabled: boolean;
  method: "jwt";
  jwt: {
    accessTTL: string;
    refreshTTL: string;
    rotation: boolean;
    blacklist: boolean;
  };
  roles: string[];
  rbac?: {
    enabled: boolean; // Enable role-based access control on controllers
  };
  // Generated names
  modulePath: string; // src/modules/auth
  strategyName: string; // JwtStrategy
  guardName: string; // JwtAuthGuard
  rolesGuardName: string; // RolesGuard
  rolesDecoratorName: string; // Roles
}

/**
 * Intermediate Representation for OAuth2 (Sprint 6)
 */
export interface OAuthProviderIR {
  name: "google" | "github";
  clientId: string;
  clientSecret: string;
  callbackURL: string;
  strategyName: string; // GoogleStrategy | GithubStrategy
  guardName: string; // GoogleOAuthGuard | GithubOAuthGuard
}

export interface OAuthIR {
  enabled: boolean;
  providers: OAuthProviderIR[];
  modulePath: string; // src/modules/auth/oauth
}

/**
 * Intermediate Representation for Relationships (Sprint 6)
 */
export interface RelationshipIR {
  id: string;
  type: "one-to-one" | "one-to-many" | "many-to-one" | "many-to-many";
  fromModel: string;
  toModel: string;
  fieldName: string;
  through?: string; // join model name for many-to-many
  attributes?: ModelFieldIR[]; // for N:M with attributes
  // Generated names
  throughModel?: ModelIR; // Generated join model for M:N
}

/**
 * Intermediate Representation for Feature Toggles (Sprint 3-5)
 */
export interface FeaturesIR {
  // Basic features
  cors: boolean;
  helmet: boolean;
  compression: boolean;
  validation: boolean;

  // Advanced features (Sprint 5)
  logging: boolean; // Pino structured logging
  caching: boolean; // Redis caching
  swagger: boolean; // API documentation
  health: boolean; // Terminus health checks
  rateLimit: boolean; // Throttler rate limiting
  versioning: boolean; // URI-based API versioning

  // Background job queues
  queues: boolean; // BullMQ job queues with BullBoard monitoring

  // File upload with S3 lifecycle
  s3Upload: boolean; // AWS S3 file uploads with presigned URLs and automatic lifecycle management
}

/**
 * Docker Configuration IR (Sprint 8)
 */
export interface DockerIR {
  enabled: boolean;
  includeCompose: boolean;
  includeProd: boolean;
  healthCheck: boolean;
  nonRootUser: boolean;
  multiStage: boolean;
}

/**
 * CI/CD Configuration IR (Sprint 8)
 */
export interface CICDIR {
  enabled: boolean;
  githubActions: boolean;
  gitlabCI: boolean;
  includeTests: boolean;
  includeE2E: boolean;
  includeSecurity: boolean;
  autoDockerBuild: boolean;
}

/**
 * Complete Intermediate Representation
 */
export interface ProjectIR {
  project: {
    name: string;
    description: string;
    author: string;
    license: string;
    nodeVersion: string;
    packageManager: string;
  };
  database: {
    type: string;
    provider: string;
    connectionString: string;
    autoMigration: string;
    orm: string; // 'mongoose' | 'typeorm'
  };
  models: ModelIR[];
  auth?: AuthIR; // Optional auth configuration
  oauth?: OAuthIR; // Optional OAuth2 configuration
  relationships: RelationshipIR[]; // Model relationships
  features: FeaturesIR; // Feature toggles
  docker?: DockerIR; // Docker configuration
  cicd?: CICDIR; // CI/CD configuration
  metadata: {
    // Generation metadata
    generatorVersion: string;
    timestamp: string;
    nestjsVersion: string;
  };
}

/**
 * Build Intermediate Representation from configuration
 */
export function buildIR(config: WizardConfig): ProjectIR {
  if (!config.projectSetup || !config.databaseConfig) {
    throw new Error("Project setup and database configuration are required");
  }

  const models = config.modelDefinition?.models || [];

  // Validate models
  validateModels(models);

  // Determine ORM based on database type
  const orm =
    config.databaseConfig.databaseType === "MongoDB" ? "mongoose" : "typeorm";

  const ir: ProjectIR = {
    project: {
      name: config.projectSetup.projectName,
      description: config.projectSetup.description,
      author: config.projectSetup.author,
      license: config.projectSetup.license,
      nodeVersion: config.projectSetup.nodeVersion,
      packageManager: config.projectSetup.packageManager,
    },
    database: {
      type: config.databaseConfig.databaseType,
      provider: config.databaseConfig.provider,
      connectionString: config.databaseConfig.connectionString,
      autoMigration: config.databaseConfig.autoMigration,
      orm,
    },
    models: models.map((model) => buildModelIR(model)),
    relationships: buildRelationshipsIR(config),
    features: buildFeaturesIR(config),
    metadata: {
      generatorVersion: "1.0.0",
      timestamp: new Date().toISOString(),
      nestjsVersion: "11.0.0",
    },
  };

  // Add auth if enabled
  if (config.authConfig?.enabled) {
    ir.auth = buildAuthIR(config);
  }

  // Add OAuth if enabled
  if (config.oauthConfig?.enabled && config.oauthConfig.providers.length > 0) {
    ir.oauth = buildOAuthIR(config);
  }

  // Add Docker if enabled (default: true)
  if (config.dockerConfig?.enabled !== false) {
    ir.docker = {
      enabled: config.dockerConfig?.enabled ?? true,
      includeCompose: config.dockerConfig?.includeCompose ?? true,
      includeProd: config.dockerConfig?.includeProd ?? true,
      healthCheck: config.dockerConfig?.healthCheck ?? true,
      nonRootUser: config.dockerConfig?.nonRootUser ?? true,
      multiStage: config.dockerConfig?.multiStage ?? true,
    };
  }

  // Add CI/CD if enabled (default: true)
  if (config.cicdConfig?.enabled !== false) {
    ir.cicd = {
      enabled: config.cicdConfig?.enabled ?? true,
      githubActions: config.cicdConfig?.githubActions ?? true,
      gitlabCI: config.cicdConfig?.gitlabCI ?? false,
      includeTests: config.cicdConfig?.includeTests ?? true,
      includeE2E: config.cicdConfig?.includeE2E ?? true,
      includeSecurity: config.cicdConfig?.includeSecurity ?? true,
      autoDockerBuild: config.cicdConfig?.autoDockerBuild ?? true,
    };
  }

  return ir;
}

/**
 * Build IR for a single model
 */
function buildModelIR(model: Model): ModelIR {
  // Sanitize model name to avoid conflicts with built-in types
  const sanitizedName = sanitizeModelName(model.name);
  const nameCamel = toCamelCase(sanitizedName);
  const nameKebab = toKebabCase(sanitizedName);
  // Apply pluralization to the PascalCase name first, then convert to kebab-case
  // This avoids issues like "Users" -> "userses"
  const namePlural = pluralize(sanitizedName); // Pluralize PascalCase: "User" -> "Users"
  const namePluralCamel = toCamelCase(namePlural); // To camelCase: "Users" -> "users"
  const namePluralKebab = toKebabCase(namePlural); // To kebab: "Users" -> "users"

  // Smart RBAC roles based on entity sensitivity
  const rbacRoles = getSmartRbacRoles(sanitizedName, model.fields);

  return {
    name: sanitizedName, // Sanitized PascalCase name
    nameCamel,
    nameKebab,
    namePlural: namePluralCamel,
    namePluralKebab,
    modulePath: `src/modules/${nameKebab}`,
    fileName: nameKebab,
    route: `/${namePluralKebab}`,
    fields: model.fields.map((field) => buildFieldIR(field)),
    timestamps: model.timestamps ?? true,
    createDtoName: `Create${sanitizedName}Dto`,
    updateDtoName: `Update${sanitizedName}Dto`,
    outputDtoName: `${sanitizedName}OutputDto`,
    rbacRoles,
  };
}

/**
 * Build IR for a single field with enhanced validation and API examples
 */
function buildFieldIR(field: Field): ModelFieldIR {
  // Get smart defaults for validation (synchronous fallback from Gemini service)
  const smartDefaults = getSmartFieldDefaults(field.name, field.type);

  // Merge user-provided validation with smart defaults
  const minLength = field.minLength ?? smartDefaults.minLength;
  const maxLength = field.maxLength ?? smartDefaults.maxLength;
  const min = field.min ?? smartDefaults.min;
  const max = field.max ?? smartDefaults.max;
  const pattern = field.pattern ?? smartDefaults.pattern;

  // Handle default value - support "now" literal for datetime fields
  let defaultValue = field.default ?? field.defaultValue;

  // Use 'values' if provided, fallback to 'enum' for backward compatibility
  const enumValues = (field as any).values ?? field.enum;

  return {
    name: field.name, // Already camelCase from validation
    type: field.type,
    tsType: mongooseTypeToTsType(field.type),
    mongooseType: fieldTypeToMongooseType(field.type),
    required: field.required ?? false,
    unique: field.unique ?? false,
    indexed: field.indexed ?? false,
    defaultValue,
    validators: getValidatorDecorator({
      type: field.type,
      name: field.name, // Pass name for email detection
      minLength,
      maxLength,
      min,
      max,
      pattern,
      enum: field.enum,
      values: enumValues,
    }),
    minLength,
    maxLength,
    min,
    max,
    pattern,
    enum: enumValues,
    // Enhanced validators
    enhancedValidators: smartDefaults.additionalValidators || [],
    // API Documentation
    apiExample: formatApiExample(smartDefaults.exampleValue, field.type),
    apiDescription: smartDefaults.description || field.name,
  };
}

/**
 * Get smart validation defaults for a field (extracted from Gemini fallback logic)
 */
/**
 * Determine smart RBAC roles based on entity name and fields
 * Sensitive entities get admin-only create/update/delete by default
 */
function getSmartRbacRoles(
  modelName: string,
  fields: Field[]
): {
  create?: string[];
  read?: string[];
  update?: string[];
  delete?: string[];
} {
  const lowerName = modelName.toLowerCase();

  // High-sensitivity entities (admin-only CRUD)
  const highSensitivity = [
    "user",
    "account",
    "admin",
    "role",
    "permission",
    "audit",
    "log",
    "config",
    "setting",
    "payment",
    "transaction",
    "invoice",
    "billing",
    "subscription",
    "license",
    "credential",
  ];

  // Medium-sensitivity entities (admin + manager for CUD, any authenticated for read)
  const mediumSensitivity = [
    "patient",
    "doctor",
    "employee",
    "worker",
    "staff",
    "department",
    "organization",
    "team",
    "project",
    "order",
    "contract",
    "document",
    "report",
    "record",
  ];

  // Check if model has sensitive fields
  const hasSensitiveFields = fields.some((f) => {
    const fieldName = f.name.toLowerCase();
    return (
      fieldName.includes("password") ||
      fieldName.includes("ssn") ||
      fieldName.includes("salary") ||
      fieldName.includes("credit") ||
      fieldName.includes("secret") ||
      fieldName.includes("token")
    );
  });

  // High sensitivity: Admin-only
  if (
    highSensitivity.some((s) => lowerName.includes(s)) ||
    hasSensitiveFields
  ) {
    return {
      create: ["Admin"],
      update: ["Admin"],
      delete: ["Admin"],
      // read is undefined = requires auth but no specific role
    };
  }

  // Medium sensitivity: Admin + Manager
  if (mediumSensitivity.some((s) => lowerName.includes(s))) {
    return {
      create: ["Admin", "Manager"],
      update: ["Admin", "Manager"],
      delete: ["Admin"],
      // read is undefined = requires auth but no specific role
    };
  }

  // Low sensitivity: No specific role restrictions (just auth required)
  return {};
}

function getSmartFieldDefaults(
  fieldName: string,
  fieldType: string
): {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  additionalValidators?: string[];
  exampleValue: string;
  description: string;
} {
  const lowerName = fieldName.toLowerCase();

  // String field defaults
  if (fieldType === "string") {
    // Email detection
    if (lowerName.includes("email")) {
      return {
        additionalValidators: ["IsEmail"],
        exampleValue: "user@example.com",
        description: "Email address",
      };
    }
    // URL detection
    if (
      lowerName.includes("url") ||
      lowerName.includes("website") ||
      lowerName.includes("link")
    ) {
      return {
        additionalValidators: ["IsUrl"],
        maxLength: 2000,
        exampleValue: "https://example.com",
        description: "URL address",
      };
    }
    // Phone detection
    if (lowerName.includes("phone") || lowerName.includes("mobile")) {
      return {
        pattern: "^\\+?[1-9]\\d{1,14}$",
        minLength: 10,
        maxLength: 20,
        exampleValue: "+1234567890",
        description: "Phone number",
      };
    }
    // Name fields
    if (
      lowerName.includes("name") ||
      lowerName.includes("firstname") ||
      lowerName.includes("lastname")
    ) {
      return {
        minLength: 2,
        maxLength: 50,
        exampleValue: lowerName.includes("first")
          ? "'John'"
          : lowerName.includes("last")
            ? "'Doe'"
            : "'Sample Name'",
        description: fieldName.charAt(0).toUpperCase() + fieldName.slice(1),
      };
    }
    // Title fields
    if (lowerName.includes("title")) {
      return {
        minLength: 3,
        maxLength: 100,
        exampleValue: "'Sample Title'",
        description: "Title or heading",
      };
    }
    // Description/content fields
    if (
      lowerName.includes("description") ||
      lowerName.includes("content") ||
      lowerName.includes("body")
    ) {
      return {
        minLength: 10,
        maxLength: 5000,
        exampleValue: "'This is a sample description text'",
        description: "Description or content",
      };
    }
    // Slug fields
    if (lowerName.includes("slug")) {
      return {
        pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
        minLength: 3,
        maxLength: 100,
        exampleValue: "'sample-slug'",
        description: "URL-friendly slug",
      };
    }
    // Address fields
    if (lowerName.includes("address")) {
      return {
        minLength: 5,
        maxLength: 500,
        exampleValue: "'123 Main St, City, State 12345'",
        description: "Physical address",
      };
    }
    // Color fields
    if (lowerName.includes("color")) {
      return {
        pattern: "^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$",
        minLength: 4,
        maxLength: 7,
        exampleValue: "'#FF5733'",
        description: "Hex color code",
      };
    }
    // Default string
    return {
      minLength: 1,
      maxLength: 255,
      exampleValue: "'Sample text'",
      description: fieldName.charAt(0).toUpperCase() + fieldName.slice(1),
    };
  }

  // Number field defaults
  if (fieldType === "number") {
    // Age detection
    if (lowerName.includes("age")) {
      return {
        min: 0,
        max: 150,
        additionalValidators: ["IsInt"],
        exampleValue: "25",
        description: "Age in years",
      };
    }
    // Price/cost detection
    if (
      lowerName.includes("price") ||
      lowerName.includes("cost") ||
      lowerName.includes("amount")
    ) {
      return {
        min: 0,
        max: 999999.99,
        additionalValidators: ["IsPositive"],
        exampleValue: "99.99",
        description: "Price amount",
      };
    }
    // Quantity/count detection
    if (
      lowerName.includes("quantity") ||
      lowerName.includes("count") ||
      lowerName.includes("stock")
    ) {
      return {
        min: 0,
        max: 999999,
        additionalValidators: ["IsInt"],
        exampleValue: "100",
        description: "Quantity or count",
      };
    }
    // Rating detection
    if (lowerName.includes("rating") || lowerName.includes("score")) {
      return {
        min: 0,
        max: 5,
        exampleValue: "4.5",
        description: "Rating score",
      };
    }
    // Percentage detection
    if (lowerName.includes("percent") || lowerName.includes("rate")) {
      return {
        min: 0,
        max: 100,
        exampleValue: "75",
        description: "Percentage value",
      };
    }
    // Default number
    return {
      min: 0,
      max: 1000000,
      exampleValue: "42",
      description:
        fieldName.charAt(0).toUpperCase() + fieldName.slice(1) + " value",
    };
  }

  // Boolean field
  if (fieldType === "boolean") {
    return {
      additionalValidators: ["IsBoolean"],
      exampleValue: "true",
      description:
        lowerName.startsWith("is") || lowerName.startsWith("has")
          ? fieldName.charAt(0).toUpperCase() + fieldName.slice(1)
          : "Is " + fieldName,
    };
  }

  // Date field
  if (fieldType === "Date") {
    return {
      additionalValidators: ["IsDateString"],
      exampleValue: "'2024-01-01T00:00:00.000Z'",
      description: "Date and time",
    };
  }

  // Array field
  if (fieldType === "array") {
    return {
      additionalValidators: ["ArrayMinSize(0)", "ArrayMaxSize(100)"], // These need params
      exampleValue: "['item1', 'item2']",
      description:
        fieldName.charAt(0).toUpperCase() + fieldName.slice(1) + " array",
    };
  }

  // Default
  return {
    exampleValue: "null",
    description: fieldName,
  };
}

/**
 * Format API example for Swagger
 */
function formatApiExample(value: string, fieldType: string): string {
  // If value is already quoted or is a number/boolean, return as-is
  if (
    value.startsWith("'") ||
    value.startsWith('"') ||
    value.startsWith("[") ||
    fieldType === "number" ||
    fieldType === "boolean"
  ) {
    return value;
  }
  // Otherwise wrap in quotes for strings
  return `'${value}'`;
}

/**
 * Validate models for common errors
 */
function validateModels(models: Model[]): void {
  const errors: string[] = [];

  // Check for duplicate model names
  const modelNames = new Set<string>();
  models.forEach((model) => {
    if (modelNames.has(model.name)) {
      errors.push(`Duplicate model name: ${model.name}`);
    }
    modelNames.add(model.name);

    // Check model name follows PascalCase convention
    if (!/^[A-Z][a-zA-Z0-9]*$/.test(model.name)) {
      errors.push(
        `Model name "${model.name}" must be PascalCase (start with uppercase, alphanumeric only)`
      );
    }

    // Check for reserved field names
    model.fields.forEach((field) => {
      if (isReservedFieldName(field.name)) {
        errors.push(
          `Reserved field name "${field.name}" in model "${model.name}"`
        );
      }

      // Check field name follows camelCase convention
      if (!/^[a-z][a-zA-Z0-9]*$/.test(field.name)) {
        errors.push(
          `Field name "${field.name}" in model "${model.name}" must be camelCase (start with lowercase, alphanumeric only)`
        );
      }
    });

    // Check for duplicate field names within model
    const fieldNames = new Set<string>();
    model.fields.forEach((field) => {
      if (fieldNames.has(field.name)) {
        errors.push(
          `Duplicate field name "${field.name}" in model "${model.name}"`
        );
      }
      fieldNames.add(field.name);
    });
  });

  if (errors.length > 0) {
    throw new Error(`Model validation failed:\n${errors.join("\n")}`);
  }
}

/**
 * Build Auth IR from configuration (Sprint 3)
 */
function buildAuthIR(config: WizardConfig): AuthIR {
  const authConfig = config.authConfig!;

  if (authConfig.enabled && !authConfig.jwt) {
    throw new Error(
      "JWT configuration is required when authentication is enabled"
    );
  }

  const jwtConfig = authConfig.jwt || {
    accessTTL: "15m",
    refreshTTL: "7d",
    rotation: true,
    blacklist: true,
  };

  return {
    enabled: authConfig.enabled,
    method: authConfig.method,
    jwt: jwtConfig,
    roles: authConfig.roles,
    rbac: {
      enabled: authConfig.enabled, // Enable RBAC by default when auth is enabled
    },
    modulePath: "src/modules/auth",
    strategyName: "JwtStrategy",
    guardName: "JwtAuthGuard",
    rolesGuardName: "RolesGuard",
    rolesDecoratorName: "Roles",
  };
}

/**
 * Build Features IR from configuration (Sprint 3-5)
 */
function buildFeaturesIR(config: WizardConfig): FeaturesIR {
  const features = config.featureSelection!;

  return {
    cors: features.cors ?? true,
    helmet: features.helmet ?? true,
    compression: features.compression ?? true,
    validation: features.validation ?? true,
    logging: features.logging ?? true,
    caching: features.caching ?? false,
    swagger: features.swagger ?? false,
    health: features.health ?? true,
    rateLimit: features.rateLimit ?? false,
    versioning: features.versioning ?? false,
    queues: features.queues ?? false,
    s3Upload: features.s3Upload ?? false,
  };
}

/**
 * Build OAuth IR from configuration (Sprint 6)
 */
function buildOAuthIR(config: WizardConfig): OAuthIR {
  const oauthConfig = config.oauthConfig!;

  const providers: OAuthProviderIR[] = oauthConfig.providers.map((provider) => {
    const capitalizedName =
      provider.name.charAt(0).toUpperCase() + provider.name.slice(1);
    return {
      name: provider.name,
      clientId: provider.clientId,
      clientSecret: provider.clientSecret,
      callbackURL: provider.callbackURL,
      strategyName: `${capitalizedName}Strategy`,
      guardName: `${capitalizedName}OAuthGuard`,
    };
  });

  return {
    enabled: oauthConfig.enabled,
    providers,
    modulePath: "src/modules/auth/oauth",
  };
}

/**
 * Build Relationships IR from configuration (Sprint 6)
 */
function buildRelationshipsIR(config: WizardConfig): RelationshipIR[] {
  const topLevelRelationships = config.modelDefinition?.relationships || [];
  const models = config.modelDefinition?.models || [];
  const modelNames = new Set(models.map((m) => m.name));

  // Collect all relationships (top-level + inline from models)
  const allRelationships = [...topLevelRelationships];

  // Extract inline relationships from models
  models.forEach((model) => {
    if (model.relationships && model.relationships.length > 0) {
      model.relationships.forEach((rel) => {
        allRelationships.push({
          ...rel,
          id: rel.id || `${model.name}-${rel.fieldName}`,
          sourceModel: rel.sourceModel || model.name, // Infer source model if not provided
        });
      });
    }
  });

  // Validate that referenced models exist
  allRelationships.forEach((rel) => {
    if (rel.sourceModel && !modelNames.has(rel.sourceModel)) {
      throw new Error(
        `Relationship references non-existent source model: ${rel.sourceModel}`
      );
    }
    if (!modelNames.has(rel.targetModel)) {
      throw new Error(
        `Relationship references non-existent target model: ${rel.targetModel}`
      );
    }
  });

  return allRelationships.map((rel) => {
    const relationshipIR: RelationshipIR = {
      id:
        rel.id ||
        `${rel.sourceModel || "unknown"}_${rel.targetModel}_${rel.fieldName}`,
      type: rel.type,
      fromModel: rel.sourceModel || "Unknown",
      toModel: rel.targetModel,
      fieldName: rel.fieldName,
      through: rel.through,
    };

    // Build attributes if provided for M:N relationships
    if (rel.attributes && rel.attributes.length > 0) {
      relationshipIR.attributes = rel.attributes.map((field) =>
        buildFieldIR(field)
      );
    }

    // Generate join model for many-to-many with attributes
    if (rel.type === "many-to-many" && rel.through && rel.attributes) {
      const joinModelName = rel.through;
      const joinModel: ModelIR = {
        name: joinModelName,
        nameCamel: toCamelCase(joinModelName),
        nameKebab: toKebabCase(joinModelName),
        namePlural: pluralize(toCamelCase(joinModelName)),
        namePluralKebab: toKebabCase(pluralize(toCamelCase(joinModelName))),
        modulePath: `src/modules/${toKebabCase(joinModelName)}`,
        fileName: toKebabCase(joinModelName),
        route: toKebabCase(pluralize(toCamelCase(joinModelName))),
        fields: relationshipIR.attributes || [],
        timestamps: true,
        createDtoName: `Create${joinModelName}Dto`,
        updateDtoName: `Update${joinModelName}Dto`,
        outputDtoName: `${joinModelName}OutputDto`,
      };
      relationshipIR.throughModel = joinModel;
    }

    return relationshipIR;
  });
}
