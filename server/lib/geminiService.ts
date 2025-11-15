import { GoogleGenerativeAI } from "@google/generative-ai";

interface FieldValidationRules {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  additionalValidators?: string[];
}

interface FieldExample {
  value: string;
  description: string;
}

interface ValidationResult {
  rules: FieldValidationRules;
  example: FieldExample;
}

/**
 * Gemini AI Service for intelligent code generation
 * Uses Google Gemini API to generate smart validation rules, examples, and descriptions
 */
export class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private enabled: boolean = false;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey.length > 10) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      this.enabled = true;
      console.log("✅ Gemini AI enabled for intelligent generation");
    } else {
      console.log("ℹ️  Gemini AI disabled (no API key). Using fallback smart defaults.");
    }
  }

  /**
   * Generate intelligent validation rules and examples for a field
   */
  async generateFieldValidation(
    fieldName: string,
    fieldType: string,
    modelName: string,
    modelDescription?: string
  ): Promise<ValidationResult> {
    // Fallback to smart defaults if Gemini is disabled
    if (!this.enabled) {
      return this.getFallbackValidation(fieldName, fieldType);
    }

    try {
      const prompt = `You are an API validation expert. Generate validation rules and an example for this field:

Field Name: ${fieldName}
Field Type: ${fieldType}
Model: ${modelName}
Context: ${modelDescription || "Generic model"}

Return ONLY a JSON object with this EXACT structure (no markdown, no explanation):
{
  "rules": {
    "minLength": number | null,
    "maxLength": number | null,
    "min": number | null,
    "max": number | null,
    "pattern": "regex string" | null,
    "additionalValidators": ["validator1", "validator2"] | []
  },
  "example": {
    "value": "realistic example value",
    "description": "brief field description"
  }
}

Rules:
- For strings: suggest minLength (1-5), maxLength (50-1000)
- For numbers: suggest min/max based on field name (age: 0-150, price: 0-1000000)
- For emails: pattern for email validation
- For URLs: use IsUrl validator
- For phone: use IsPhoneNumber validator
- additionalValidators: array of class-validator decorator names (IsPositive, IsInt, etc.)
- Example must be realistic and match the field type/name
- Description should be 3-10 words`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      
      // Remove markdown code blocks if present
      const jsonText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(jsonText);

      return {
        rules: {
          minLength: parsed.rules.minLength,
          maxLength: parsed.rules.maxLength,
          min: parsed.rules.min,
          max: parsed.rules.max,
          pattern: parsed.rules.pattern,
          additionalValidators: parsed.rules.additionalValidators || [],
        },
        example: {
          value: parsed.example.value,
          description: parsed.example.description,
        },
      };
    } catch (error) {
      console.warn(`⚠️  Gemini API error for field '${fieldName}': ${error}. Using fallback.`);
      return this.getFallbackValidation(fieldName, fieldType);
    }
  }

  /**
   * Generate batch validations for multiple fields (more efficient)
   */
  async generateBatchValidations(
    fields: Array<{ name: string; type: string }>,
    modelName: string,
    modelDescription?: string
  ): Promise<Map<string, ValidationResult>> {
    if (!this.enabled || fields.length === 0) {
      const results = new Map<string, ValidationResult>();
      fields.forEach((field) => {
        results.set(field.name, this.getFallbackValidation(field.name, field.type));
      });
      return results;
    }

    try {
      const prompt = `You are an API validation expert. Generate validation rules and examples for ALL these fields:

Model: ${modelName}
Context: ${modelDescription || "Generic model"}
Fields:
${fields.map((f) => `- ${f.name} (${f.type})`).join("\n")}

Return ONLY a JSON object with this EXACT structure (no markdown):
{
  "fieldName1": {
    "rules": { "minLength": number | null, "maxLength": number | null, "min": number | null, "max": number | null, "pattern": "regex" | null, "additionalValidators": [] },
    "example": { "value": "example", "description": "description" }
  },
  "fieldName2": { ... }
}

Rules: Same as before - realistic validation and examples for production APIs.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      
      const jsonText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(jsonText);

      const results = new Map<string, ValidationResult>();
      for (const field of fields) {
        if (parsed[field.name]) {
          results.set(field.name, {
            rules: parsed[field.name].rules || {},
            example: parsed[field.name].example || { value: "", description: "" },
          });
        } else {
          results.set(field.name, this.getFallbackValidation(field.name, field.type));
        }
      }
      return results;
    } catch (error) {
      console.warn(`⚠️  Gemini batch API error: ${error}. Using fallback.`);
      const results = new Map<string, ValidationResult>();
      fields.forEach((field) => {
        results.set(field.name, this.getFallbackValidation(field.name, field.type));
      });
      return results;
    }
  }

  /**
   * Smart fallback validation rules (no AI required)
   */
  private getFallbackValidation(fieldName: string, fieldType: string): ValidationResult {
    const lowerName = fieldName.toLowerCase();
    const rules: FieldValidationRules = {};
    let exampleValue = "";
    let description = "";

    // String field defaults
    if (fieldType === "string") {
      rules.minLength = 1;
      rules.maxLength = 255;

      // Email detection
      if (lowerName.includes("email")) {
        rules.additionalValidators = ["IsEmail()"];
        exampleValue = "user@example.com";
        description = "Email address";
        delete rules.minLength;
        delete rules.maxLength;
      }
      // URL detection
      else if (lowerName.includes("url") || lowerName.includes("website") || lowerName.includes("link")) {
        rules.additionalValidators = ["IsUrl()"];
        exampleValue = "https://example.com";
        description = "URL address";
        rules.maxLength = 2000;
      }
      // Phone detection
      else if (lowerName.includes("phone") || lowerName.includes("mobile")) {
        rules.pattern = "^\\+?[1-9]\\d{1,14}$";
        exampleValue = "+1234567890";
        description = "Phone number";
        rules.minLength = 10;
        rules.maxLength = 20;
      }
      // Name fields
      else if (lowerName.includes("name") || lowerName.includes("firstname") || lowerName.includes("lastname")) {
        rules.minLength = 2;
        rules.maxLength = 50;
        exampleValue = lowerName.includes("first") ? "John" : lowerName.includes("last") ? "Doe" : "Sample Name";
        description = `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}`;
      }
      // Title fields
      else if (lowerName.includes("title")) {
        rules.minLength = 3;
        rules.maxLength = 100;
        exampleValue = "Sample Title";
        description = "Title or heading";
      }
      // Description/content fields
      else if (lowerName.includes("description") || lowerName.includes("content") || lowerName.includes("body")) {
        rules.minLength = 10;
        rules.maxLength = 5000;
        exampleValue = "This is a sample description text.";
        description = "Description or content";
      }
      // Password fields
      else if (lowerName.includes("password")) {
        rules.minLength = 8;
        rules.maxLength = 72;
        rules.pattern = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]+$";
        exampleValue = "P@ssw0rd123!";
        description = "Secure password";
      }
      // Slug fields
      else if (lowerName.includes("slug")) {
        rules.pattern = "^[a-z0-9]+(?:-[a-z0-9]+)*$";
        exampleValue = "sample-slug";
        description = "URL-friendly slug";
        rules.minLength = 3;
        rules.maxLength = 100;
      }
      // Address fields
      else if (lowerName.includes("address")) {
        rules.minLength = 5;
        rules.maxLength = 500;
        exampleValue = "123 Main St, City, State 12345";
        description = "Physical address";
      }
      // Color fields
      else if (lowerName.includes("color")) {
        rules.pattern = "^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$";
        exampleValue = "#FF5733";
        description = "Hex color code";
        rules.minLength = 4;
        rules.maxLength = 7;
      }
      // Default string
      else {
        exampleValue = "Sample text";
        description = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
      }
    }
    // Number field defaults
    else if (fieldType === "number") {
      rules.min = 0;
      rules.max = 1000000;

      // Age detection
      if (lowerName.includes("age")) {
        rules.min = 0;
        rules.max = 150;
        rules.additionalValidators = ["IsInt()"];
        exampleValue = "25";
        description = "Age in years";
      }
      // Price/cost detection
      else if (lowerName.includes("price") || lowerName.includes("cost") || lowerName.includes("amount")) {
        rules.min = 0;
        rules.max = 999999.99;
        rules.additionalValidators = ["IsPositive()"];
        exampleValue = "99.99";
        description = "Price amount";
      }
      // Quantity/count detection
      else if (lowerName.includes("quantity") || lowerName.includes("count") || lowerName.includes("stock")) {
        rules.min = 0;
        rules.max = 999999;
        rules.additionalValidators = ["IsInt()", "Min(0)"];
        exampleValue = "100";
        description = "Quantity or count";
      }
      // Rating detection
      else if (lowerName.includes("rating") || lowerName.includes("score")) {
        rules.min = 0;
        rules.max = 5;
        exampleValue = "4.5";
        description = "Rating score";
      }
      // Percentage detection
      else if (lowerName.includes("percent") || lowerName.includes("rate")) {
        rules.min = 0;
        rules.max = 100;
        exampleValue = "75";
        description = "Percentage value";
      }
      // Default number
      else {
        exampleValue = "42";
        description = `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} value`;
      }
    }
    // Boolean field
    else if (fieldType === "boolean") {
      rules.additionalValidators = ["IsBoolean()"];
      exampleValue = "true";
      description = lowerName.includes("is") || lowerName.includes("has")
        ? fieldName.charAt(0).toUpperCase() + fieldName.slice(1)
        : `Is ${fieldName}`;
    }
    // Date field
    else if (fieldType === "Date") {
      rules.additionalValidators = ["IsDateString()"];
      exampleValue = "2024-01-01T00:00:00.000Z";
      description = "Date and time";
    }

    return {
      rules,
      example: {
        value: exampleValue,
        description: description || fieldName,
      },
    };
  }

  /**
   * Check if Gemini AI is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

// Singleton instance
export const geminiService = new GeminiService();
