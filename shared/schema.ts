import { z } from "zod";

// Step 1: Project Setup
export const projectSetupSchema = z.object({
  projectName: z
    .string()
    .min(1, "Project name is required")
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens only"),
  description: z.string().min(1, "Description is required"),
  author: z.string().min(1, "Author is required"),
  license: z.enum(["MIT", "Apache-2.0", "GPL-3.0", "BSD-3-Clause", "ISC"]),
  nodeVersion: z.enum(["18", "20", "22"]),
  packageManager: z.enum(["npm", "yarn", "pnpm"]),
});

export type ProjectSetup = z.infer<typeof projectSetupSchema>;

// Step 2: Database Configuration
export const databaseConfigSchema = z.object({
  databaseType: z.enum(["MongoDB", "PostgreSQL", "MySQL"]),
  provider: z.enum(["Neon", "Supabase", "Atlas", "PlanetScale", "Railway"]),
  connectionString: z.string().min(1, "Connection string is required"),
  autoMigration: z.enum(["push", "manual"]),
});

export type DatabaseConfig = z.infer<typeof databaseConfigSchema>;

// Step 3: Model Definition (Enhanced for Sprint 2+)
export const fieldSchema = z.object({
  id: z.string().optional(), // Optional for manual JSON configs
  name: z
    .string()
    .min(1, "Field name is required")
    .regex(/^[a-z][a-zA-Z0-9]*$/, "Field name must be camelCase"),
  type: z.enum([
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
  ]),
  required: z.boolean().default(false),
  unique: z.boolean().default(false),
  indexed: z.boolean().default(false),
  default: z
    .union([z.string(), z.number(), z.boolean(), z.literal("now"), z.null()])
    .optional(),
  defaultValue: z
    .union([z.string(), z.number(), z.boolean(), z.literal("now"), z.null()])
    .optional(), // Backward compatibility
  // Validation rules
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().optional(), // regex pattern for string validation
  enum: z.array(z.string()).optional(), // DEPRECATED: use 'values' instead
  values: z.array(z.string()).optional(), // for enum types - custom values
  gender: z.enum(["male", "female", "other"]).optional(), // Example enum field (ignore in parsing)
});

export type Field = z.infer<typeof fieldSchema>;

export const relationshipSchema = z.object({
  id: z.string().optional(), // Optional for manual JSON configs
  type: z.enum(["one-to-one", "one-to-many", "many-to-one", "many-to-many"]),
  sourceModel: z.string().optional(), // Optional - inferred from model context
  targetModel: z.string(),
  fieldName: z.string(),
  through: z.string().optional(), // join model name for many-to-many
  attributes: z.array(fieldSchema).optional(), // attributes for N:M relationships
});

export type Relationship = z.infer<typeof relationshipSchema>;

export const modelSchema = z.object({
  id: z.string().optional(), // Optional for manual JSON configs
  name: z
    .string()
    .min(1, "Model name is required")
    .regex(/^[A-Z][a-zA-Z0-9]*$/, "Model name must be PascalCase"),
  fields: z.array(fieldSchema).min(1, "Model must have at least one field"),
  timestamps: z.boolean().default(true), // auto-add createdAt/updatedAt
  relationships: z.array(relationshipSchema).optional(), // Inline relationships (alternative to top-level)
});

export type Model = z.infer<typeof modelSchema>;

export const modelDefinitionSchema = z.object({
  models: z.array(modelSchema),
  relationships: z.array(relationshipSchema).default([]),
});

export type ModelDefinition = z.infer<typeof modelDefinitionSchema>;

// Step 4: Authentication & Authorization (Sprint 3)
export const authConfigSchema = z
  .object({
    enabled: z.boolean().default(false),
    method: z.enum(["jwt"]).default("jwt"), // Only JWT in Sprint 3
    jwt: z
      .object({
        accessTTL: z
          .string()
          .regex(/^\d+(m|h|d)$/, "Must be in format: 15m, 1h, 7d")
          .default("15m"),
        refreshTTL: z
          .string()
          .regex(/^\d+(m|h|d)$/, "Must be in format: 15m, 1h, 7d")
          .default("7d"),
        rotation: z.boolean().default(true), // Rotate refresh tokens
        blacklist: z.boolean().default(true), // Blacklist refresh tokens on logout
      })
      .optional(),
    roles: z
      .array(z.string())
      .min(1, "At least one role is required")
      .default(["Admin", "User"]),
  })
  .refine((data) => !data.enabled || data.jwt !== undefined, {
    message: "jwt is required when auth.enabled is true",
    path: ["jwt"],
  });

export type AuthConfig = z.infer<typeof authConfigSchema>;

// Step 4.1: OAuth2 Configuration (Sprint 6)
export const oauthProviderSchema = z.object({
  name: z.enum(["google", "github"]),
  clientId: z.string().min(1, "Client ID is required"),
  clientSecret: z.string().min(1, "Client Secret is required"),
  callbackURL: z.string().url("Must be a valid URL"),
});

export type OAuthProvider = z.infer<typeof oauthProviderSchema>;

export const oauthConfigSchema = z.object({
  enabled: z.boolean().default(false),
  providers: z.array(oauthProviderSchema).default([]),
});

export type OAuthConfig = z.infer<typeof oauthConfigSchema>;

// Step 5: Feature Selection (Sprint 3-5 - Toggles)
export const featureSelectionSchema = z.object({
  // Basic Features (Sprint 3)
  cors: z.boolean().default(true),
  helmet: z.boolean().default(true),
  compression: z.boolean().default(true),
  validation: z.boolean().default(true), // Global ValidationPipe

  // Advanced Features (Sprint 5)
  logging: z.boolean().default(true), // Pino structured logging
  caching: z.boolean().default(false), // Redis caching with @nestjs/cache-manager
  swagger: z.boolean().default(false), // API documentation
  health: z.boolean().default(true), // Terminus health checks
  rateLimit: z.boolean().default(false), // Throttler rate limiting
  versioning: z.boolean().default(false), // URI-based API versioning (v1, v2)

  // Background Job Queues (BullMQ)
  queues: z.boolean().default(false), // Enable BullMQ job queues for background processing

  // File Upload with S3 Lifecycle Management
  s3Upload: z.boolean().default(false), // Enable AWS S3 file uploads with presigned URLs and lifecycle rules

  // Field-Level Encryption Strategy
  encryptionStrategy: z
    .enum(["disabled", "local", "aws_kms"])
    .default("disabled"), // Encryption strategy: disabled (FREE, no encryption), local (FREE, env key), aws_kms (PAID ~$7/mo, enterprise)

  // Field-Level Access Control (FLAC)
  fieldLevelAccessControl: z.boolean().default(false), // Enable role-based field filtering to hide sensitive data from unauthorized users
});

export type FeatureSelection = z.infer<typeof featureSelectionSchema>;

// Step 8: Docker Configuration (Sprint 8)
export const dockerConfigSchema = z.object({
  enabled: z.boolean().default(true),
  includeCompose: z.boolean().default(true),
  includeProd: z.boolean().default(true),
  healthCheck: z.boolean().default(true),
  nonRootUser: z.boolean().default(true),
  multiStage: z.boolean().default(true),
});

export type DockerConfig = z.infer<typeof dockerConfigSchema>;

// Step 8: CI/CD Configuration (Sprint 8)
export const cicdConfigSchema = z.object({
  enabled: z.boolean().default(true),
  githubActions: z.boolean().default(true),
  gitlabCI: z.boolean().default(false),
  includeTests: z.boolean().default(true),
  includeE2E: z.boolean().default(true),
  includeSecurity: z.boolean().default(true),
  autoDockerBuild: z.boolean().default(true),
});

export type CICDConfig = z.infer<typeof cicdConfigSchema>;

// Complete Wizard Configuration
export const wizardConfigSchema = z.object({
  projectSetup: projectSetupSchema,
  databaseConfig: databaseConfigSchema,
  modelDefinition: modelDefinitionSchema,
  authConfig: authConfigSchema,
  oauthConfig: oauthConfigSchema.optional(),
  featureSelection: featureSelectionSchema,
  dockerConfig: dockerConfigSchema.optional(),
  cicdConfig: cicdConfigSchema.optional(),
});

export type WizardConfig = z.infer<typeof wizardConfigSchema>;

// Export default initial state
export const defaultWizardConfig: Partial<WizardConfig> = {
  projectSetup: {
    projectName: "",
    description: "",
    author: "",
    license: "MIT",
    nodeVersion: "20",
    packageManager: "npm",
  },
  databaseConfig: {
    databaseType: "PostgreSQL",
    provider: "Neon",
    connectionString: "",
    autoMigration: "push",
  },
  modelDefinition: {
    models: [],
    relationships: [],
  },
  authConfig: {
    enabled: false,
    method: "jwt" as const,
    jwt: {
      accessTTL: "15m",
      refreshTTL: "7d",
      rotation: true,
      blacklist: true,
    },
    roles: ["Admin", "User"],
  },
  oauthConfig: {
    enabled: false,
    providers: [],
  },
  featureSelection: {
    cors: true,
    helmet: true,
    compression: true,
    validation: true,
    logging: true,
    caching: false,
    swagger: false,
    health: true,
    rateLimit: false,
    versioning: false,
    queues: false,
    s3Upload: false,
    encryptionStrategy: "disabled" as const,
    fieldLevelAccessControl: false,
  },
  dockerConfig: {
    enabled: true,
    includeCompose: true,
    includeProd: true,
    healthCheck: true,
    nonRootUser: true,
    multiStage: true,
  },
  cicdConfig: {
    enabled: true,
    githubActions: true,
    gitlabCI: false,
    includeTests: true,
    includeE2E: true,
    includeSecurity: true,
    autoDockerBuild: true,
  },
};
