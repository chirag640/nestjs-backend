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
} from "./namingUtils";

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

  return {
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
  };
}

/**
 * Build IR for a single model
 */
function buildModelIR(model: Model): ModelIR {
  const nameCamel = toCamelCase(model.name);
  const nameKebab = toKebabCase(model.name);
  const namePlural = pluralize(nameCamel);
  const namePluralKebab = toKebabCase(namePlural);

  return {
    name: model.name, // Already PascalCase from validation
    nameCamel,
    nameKebab,
    namePlural,
    namePluralKebab,
    modulePath: `src/modules/${nameKebab}`,
    fileName: nameKebab,
    route: namePluralKebab,
    fields: model.fields.map((field) => buildFieldIR(field)),
    timestamps: model.timestamps ?? true,
    createDtoName: `Create${model.name}Dto`,
    updateDtoName: `Update${model.name}Dto`,
    outputDtoName: `${model.name}OutputDto`,
  };
}

/**
 * Build IR for a single field
 */
function buildFieldIR(field: Field): ModelFieldIR {
  return {
    name: field.name, // Already camelCase from validation
    type: field.type,
    tsType: mongooseTypeToTsType(field.type),
    mongooseType: fieldTypeToMongooseType(field.type),
    required: field.required ?? false,
    unique: field.unique ?? false,
    indexed: field.indexed ?? false,
    defaultValue: field.defaultValue,
    validators: getValidatorDecorator({
      type: field.type,
      minLength: field.minLength,
      maxLength: field.maxLength,
      min: field.min,
      max: field.max,
      pattern: field.pattern,
      enum: field.enum,
    }),
    minLength: field.minLength,
    maxLength: field.maxLength,
    min: field.min,
    max: field.max,
    pattern: field.pattern,
    enum: field.enum,
  };
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

    // Check for reserved field names
    model.fields.forEach((field) => {
      if (isReservedFieldName(field.name)) {
        errors.push(
          `Reserved field name "${field.name}" in model "${model.name}"`
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
