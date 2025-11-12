import { z } from "zod";

// Step 1: Project Setup
export const projectSetupSchema = z.object({
  projectName: z.string().min(1, "Project name is required").regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens only"),
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

// Step 3: Model Definition
export const fieldSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Field name is required"),
  type: z.enum(["UUID", "String", "Boolean", "Int", "Float", "DateTime"]),
  required: z.boolean(),
  unique: z.boolean(),
  primaryKey: z.boolean(),
});

export type Field = z.infer<typeof fieldSchema>;

export const relationshipSchema = z.object({
  id: z.string(),
  type: z.enum(["one-to-many", "many-to-many"]),
  sourceModel: z.string(),
  targetModel: z.string(),
  fieldName: z.string(),
});

export type Relationship = z.infer<typeof relationshipSchema>;

export const modelSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Model name is required"),
  fields: z.array(fieldSchema),
});

export type Model = z.infer<typeof modelSchema>;

export const modelDefinitionSchema = z.object({
  models: z.array(modelSchema),
  relationships: z.array(relationshipSchema),
});

export type ModelDefinition = z.infer<typeof modelDefinitionSchema>;

// Step 4: Authentication & Authorization
export const authConfigSchema = z.object({
  provider: z.enum(["JWT", "OAuth", "NextAuth"]),
  jwtSecret: z.string().min(1, "JWT secret is required"),
  jwtExpiration: z.string().min(1, "JWT expiration is required"),
  roles: z.array(z.string()).min(1, "At least one role is required"),
  permissions: z.record(z.string(), z.array(z.string())),
});

export type AuthConfig = z.infer<typeof authConfigSchema>;

// Step 5: Feature Selection
export const featureSelectionSchema = z.object({
  features: z.array(z.enum([
    "authentication",
    "orm",
    "ci-cd",
    "linting",
    "testing",
    "docker"
  ])),
});

export type FeatureSelection = z.infer<typeof featureSelectionSchema>;

// Complete Wizard Configuration
export const wizardConfigSchema = z.object({
  projectSetup: projectSetupSchema,
  databaseConfig: databaseConfigSchema,
  modelDefinition: modelDefinitionSchema,
  authConfig: authConfigSchema,
  featureSelection: featureSelectionSchema,
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
    provider: "JWT",
    jwtSecret: "",
    jwtExpiration: "7d",
    roles: [],
    permissions: {},
  },
  featureSelection: {
    features: [],
  },
};
