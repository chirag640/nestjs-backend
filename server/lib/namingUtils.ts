/**
 * Naming convention utilities for code generation
 */

/**
 * Convert string to PascalCase
 * @example "user profile" → "UserProfile"
 */
export function toPascalCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/^[a-z]/, (chr) => chr.toUpperCase());
}

/**
 * Convert string to camelCase
 * @example "user profile" → "userProfile"
 */
export function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/**
 * Convert string to kebab-case
 * @example "UserProfile" → "user-profile"
 */
export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

/**
 * Convert string to snake_case
 * @example "UserProfile" → "user_profile"
 */
export function toSnakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[\s-]+/g, "_")
    .toLowerCase();
}

/**
 * Simple English pluralization with case preservation
 * @example "user" → "users", "User" → "Users", "category" → "categories", "Category" → "Categories"
 */
export function pluralize(word: string): string {
  if (!word) return word;

  const lower = word.toLowerCase();
  const isUpperCase = word[0] === word[0].toUpperCase();

  // Irregular plurals
  const irregulars: Record<string, string> = {
    person: "people",
    child: "children",
    tooth: "teeth",
    foot: "feet",
    mouse: "mice",
    goose: "geese",
  };

  if (irregulars[lower]) {
    const result = irregulars[lower];
    return isUpperCase
      ? result.charAt(0).toUpperCase() + result.slice(1)
      : result;
  }

  let result: string;

  // Words ending in y
  if (lower.endsWith("y") && !/[aeiou]y$/.test(lower)) {
    result = lower.slice(0, -1) + "ies";
  }
  // Words ending in s, ss, sh, ch, x, z
  else if (/(?:s|ss|sh|ch|x|z)$/.test(lower)) {
    result = lower + "es";
  }
  // Words ending in f or fe
  else if (lower.endsWith("f")) {
    result = lower.slice(0, -1) + "ves";
  } else if (lower.endsWith("fe")) {
    result = lower.slice(0, -2) + "ves";
  }
  // Default: add s
  else {
    result = lower + "s";
  }

  // Preserve original casing (PascalCase or camelCase)
  if (isUpperCase) {
    return result.charAt(0).toUpperCase() + result.slice(1);
  }
  return result;
}

/**
 * Singularize a plural word (basic implementation)
 * @example "users" → "user", "categories" → "category"
 */
export function singularize(word: string): string {
  const lower = word.toLowerCase();

  // Irregular singulars
  const irregulars: Record<string, string> = {
    people: "person",
    children: "child",
    teeth: "tooth",
    feet: "foot",
    mice: "mouse",
    geese: "goose",
  };

  if (irregulars[lower]) {
    return irregulars[lower];
  }

  // -ies → -y
  if (lower.endsWith("ies")) {
    return lower.slice(0, -3) + "y";
  }

  // -ves → -f or -fe
  if (lower.endsWith("ves")) {
    return lower.slice(0, -3) + "f";
  }

  // -ses, -shes, -ches, -xes, -zes → remove -es
  if (/(?:ses|shes|ches|xes|zes)$/.test(lower)) {
    return lower.slice(0, -2);
  }

  // -s → remove -s
  if (lower.endsWith("s") && lower.length > 1) {
    return lower.slice(0, -1);
  }

  return lower;
}

/**
 * Reserved MongoDB/Mongoose field names that should be avoided
 */
export const RESERVED_FIELD_NAMES = [
  "_id",
  "id",
  "__v",
  "__t",
  "constructor",
  "prototype",
  "schema",
  "collection",
  "db",
  "modelName",
  "base",
  "baseModelName",
];

/**
 * Check if a field name is reserved
 */
export function isReservedFieldName(name: string): boolean {
  return RESERVED_FIELD_NAMES.includes(name.toLowerCase());
}

/**
 * Convert Mongoose type to TypeScript type
 */
export function mongooseTypeToTsType(mongooseType: string): string {
  const typeMap: Record<string, string> = {
    string: "string",
    number: "number",
    boolean: "boolean",
    date: "Date",
    objectId: "string", // ObjectId is represented as string in DTOs
  };

  return typeMap[mongooseType.toLowerCase()] || "any";
}

/**
 * Convert field type to Mongoose Schema type
 */
export function fieldTypeToMongooseType(fieldType: string): string {
  const typeMap: Record<string, string> = {
    string: "String",
    number: "Number",
    boolean: "Boolean",
    date: "Date",
    objectId: "Schema.Types.ObjectId",
  };

  return typeMap[fieldType.toLowerCase()] || "Schema.Types.Mixed";
}

/**
 * Get class-validator decorator for field type
 */
export function getValidatorDecorator(field: {
  type: string;
  name?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  enum?: string[];
}): string[] {
  const decorators: string[] = [];

  switch (field.type) {
    case "string":
      // Use @IsEmail() for fields named 'email' or containing 'email'
      if (field.name && field.name.toLowerCase().includes("email")) {
        decorators.push("IsEmail()");
      } else {
        decorators.push("IsString()");
      }
      if (field.minLength) decorators.push(`MinLength(${field.minLength})`);
      if (field.maxLength) decorators.push(`MaxLength(${field.maxLength})`);
      if (field.pattern) {
        try {
          // Validate the regex pattern
          new RegExp(field.pattern);
          decorators.push(`Matches(/${field.pattern}/)`);
        } catch (error) {
          console.warn(
            `Invalid regex pattern "${field.pattern}", skipping Matches decorator`
          );
        }
      }
      if (field.enum) decorators.push(`IsIn(['${field.enum.join("', '")}'])`);
      break;
    case "number":
      decorators.push("IsNumber()");
      if (field.min !== undefined) decorators.push(`Min(${field.min})`);
      if (field.max !== undefined) decorators.push(`Max(${field.max})`);
      break;
    case "boolean":
      decorators.push("IsBoolean()");
      break;
    case "date":
      decorators.push("IsDate()");
      break;
    case "objectId":
      decorators.push("IsMongoId()");
      break;
  }

  return decorators;
}
