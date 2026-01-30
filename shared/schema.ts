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
  foreignKeyName: z.string().optional(), // Custom FK name (e.g. "authorId" instead of "userId")
  inverseFieldName: z.string().optional(), // Custom inverse field name (e.g. "posts" instead of "user")
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
    mfa: z.object({
      enabled: z.boolean().default(false),
      methods: z.array(z.enum(["totp", "sms", "email"])).default(["totp"]),
      required: z.boolean().default(false), // Force MFA for all users
      backupCodes: z.number().min(0).max(20).default(10), // Number of backup codes
      totpIssuer: z.string().optional(), // Name shown in authenticator apps
    }).optional(),
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

  // Production Readiness (Sprint 9)
  gitHooks: z.boolean().default(true), // Enable Husky and lint-staged
  sonarQube: z.boolean().default(false), // Enable SonarQube configuration
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

// Step 9: Mobile Configuration (Mobile Backend Features)
export const biometricAuthSchema = z.object({
  enabled: z.boolean().default(false),
  rpId: z.string().optional(), // Relying Party ID (your domain, e.g., "example.com")
  rpName: z.string().optional(), // Human-readable RP name
  allowedAuthenticators: z
    .array(z.enum(["platform", "cross-platform"]))
    .default(["platform"]), // platform = device biometrics, cross-platform = security keys
  userVerification: z.enum(["required", "preferred", "discouraged"]).default("required"),
  attestation: z.enum(["none", "indirect", "direct"]).default("none"), // none = privacy-friendly
  residentKey: z.enum(["required", "preferred", "discouraged"]).default("preferred"), // For usernameless login
  timeout: z.number().default(60000), // Challenge timeout in ms
});

export type BiometricAuth = z.infer<typeof biometricAuthSchema>;

export const deviceManagementSchema = z.object({
  enabled: z.boolean().default(true),
  maxDevicesPerUser: z.number().min(1).max(50).default(5),
  trackDeviceInfo: z.boolean().default(true), // Track OS, app version, IP
  autoRevokeInactiveDays: z.number().min(0).default(90), // Auto-revoke after N days inactive (0 = never)
  requireDeviceApproval: z.boolean().default(false), // Require approval for new devices
});

export type DeviceManagement = z.infer<typeof deviceManagementSchema>;

export const offlineSyncSchema = z.object({
  enabled: z.boolean().default(false),
  conflictResolution: z
    .enum(["server-wins", "client-wins", "last-write-wins", "manual"])
    .default("last-write-wins"),
  deltaSync: z.boolean().default(true), // Only sync changes since last sync
  batchSize: z.number().min(10).max(1000).default(100), // Max items per sync batch
  syncModels: z.array(z.string()).optional(), // List of model names to sync (empty = all)
  idempotencyKeyTTL: z.number().default(86400), // Idempotency key TTL in seconds (24h default)
});

export type OfflineSync = z.infer<typeof offlineSyncSchema>;

export const mobileConfigSchema = z.object({
  enabled: z.boolean().default(false),
  clientTypes: z
    .array(z.enum(["web", "mobile", "both"]))
    .default(["both"]), // Target client types
  disableCsrfForBearerAuth: z.boolean().default(true), // CSRF not needed for JWT Bearer auth
  biometricAuth: biometricAuthSchema.optional(),
  deviceManagement: deviceManagementSchema.optional(),
  offlineSync: offlineSyncSchema.optional(),
});

export type MobileConfig = z.infer<typeof mobileConfigSchema>;

// Step 10: Real-time WebSocket Configuration
export const realtimeConfigSchema = z.object({
  enabled: z.boolean().default(false),
  provider: z.enum(["socket.io", "ws"]).default("socket.io"),
  authentication: z.boolean().default(true), // JWT auth for WebSocket
  cors: z.boolean().default(true), // Enable CORS for WebSocket
  rooms: z.boolean().default(true), // Support named rooms
  presence: z.boolean().default(false), // Online/offline status tracking
  scaling: z.enum(["none", "redis"]).default("none"), // Redis adapter for horizontal scaling
  namespaces: z.array(z.string()).default([]), // Custom namespaces (e.g., /chat, /notifications)
  events: z.object({
    modelChanges: z.boolean().default(true), // Broadcast CRUD changes
    customEvents: z.array(z.string()).default([]), // Custom event names
  }).optional(),
});

export type RealtimeConfig = z.infer<typeof realtimeConfigSchema>;

// Step 11: Webhook Configuration (Outgoing)
export const webhookConfigSchema = z.object({
  enabled: z.boolean().default(false),
  events: z.array(z.string()).default([]), // e.g., ["order.created", "payment.completed"]
  retries: z.number().min(0).max(10).default(3),
  backoff: z.enum(["linear", "exponential"]).default("exponential"),
  signature: z.enum(["none", "hmac-sha256"]).default("hmac-sha256"),
  timeout: z.number().min(1000).max(30000).default(5000), // Request timeout in ms
  logging: z.boolean().default(true), // Log webhook deliveries
});

export type WebhookConfig = z.infer<typeof webhookConfigSchema>;

// Step 12: Audit Logging Configuration
export const auditConfigSchema = z.object({
  enabled: z.boolean().default(false),
  storage: z.enum(["database", "elasticsearch"]).default("database"),
  retention: z.string().regex(/^\d+(d|w|m|y)$/).default("90d"), // Days to keep logs
  events: z.array(z.enum([
    "create", "update", "delete", "login", "logout", 
    "access", "export", "import", "permission_change"
  ])).default(["create", "update", "delete", "login"]),
  piiMasking: z.boolean().default(true), // Mask PII in audit logs
  userTracking: z.boolean().default(true), // Track user who made the change
  ipTracking: z.boolean().default(true), // Track IP address
});

export type AuditConfig = z.infer<typeof auditConfigSchema>;

// Step 13: GraphQL Configuration
export const graphqlConfigSchema = z.object({
  enabled: z.boolean().default(false),
  playground: z.boolean().default(true), // GraphQL Playground in dev
  introspection: z.boolean().default(true), // Schema introspection
  subscriptions: z.boolean().default(false), // GraphQL Subscriptions
  complexity: z.object({
    enabled: z.boolean().default(true), // Query complexity analysis
    maxComplexity: z.number().default(100),
    maxDepth: z.number().default(7),
  }).optional(),
  caching: z.boolean().default(false), // Response caching
  federation: z.boolean().default(false), // Apollo Federation support
});

export type GraphQLConfig = z.infer<typeof graphqlConfigSchema>;

// Step 14: Multi-tenancy Configuration
export const multitenancyConfigSchema = z.object({
  enabled: z.boolean().default(false),
  strategy: z.enum(["database", "schema", "row"]).default("row"),
  // database = separate DB per tenant
  // schema = separate schema per tenant (PostgreSQL)
  // row = shared tables with tenant_id column
  tenantIdSource: z.enum(["header", "subdomain", "jwt"]).default("header"),
  headerName: z.string().default("X-Tenant-ID"),
  defaultTenant: z.string().optional(),
  isolation: z.boolean().default(true), // Enforce tenant isolation
});

export type MultitenancyConfig = z.infer<typeof multitenancyConfigSchema>;

// Step 15: Payment Integration Configuration
export const paymentConfigSchema = z.object({
  enabled: z.boolean().default(false),
  providers: z.array(z.enum(["stripe", "razorpay"])).default([]),
  stripe: z.object({
    webhookSecret: z.string().optional(),
    currency: z.string().default("usd"),
    paymentMethods: z.array(z.string()).default(["card"]),
  }).optional(),
  razorpay: z.object({
    webhookSecret: z.string().optional(),
    currency: z.string().default("INR"),
  }).optional(),
  subscriptions: z.boolean().default(false), // Subscription billing
  invoicing: z.boolean().default(false), // Invoice generation
});

export type PaymentConfig = z.infer<typeof paymentConfigSchema>;

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
  mobileConfig: mobileConfigSchema.optional(),
  realtimeConfig: realtimeConfigSchema.optional(),
  webhookConfig: webhookConfigSchema.optional(),
  auditConfig: auditConfigSchema.optional(),
  graphqlConfig: graphqlConfigSchema.optional(),
  multitenancyConfig: multitenancyConfigSchema.optional(),
  paymentConfig: paymentConfigSchema.optional(),
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
    gitHooks: true,
    sonarQube: false,
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
  mobileConfig: {
    enabled: false,
    clientTypes: ["both"] as const,
    disableCsrfForBearerAuth: true,
    biometricAuth: {
      enabled: false,
      allowedAuthenticators: ["platform"] as const,
      userVerification: "required" as const,
      attestation: "none" as const,
      residentKey: "preferred" as const,
      timeout: 60000,
    },
    deviceManagement: {
      enabled: true,
      maxDevicesPerUser: 5,
      trackDeviceInfo: true,
      autoRevokeInactiveDays: 90,
      requireDeviceApproval: false,
    },
    offlineSync: {
      enabled: false,
      conflictResolution: "last-write-wins" as const,
      deltaSync: true,
      batchSize: 100,
      idempotencyKeyTTL: 86400,
    },
  },
};
