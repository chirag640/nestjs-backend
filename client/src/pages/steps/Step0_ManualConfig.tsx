import { useState } from "react";
import { useWizardStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  FileJson,
  Upload,
  CheckCircle2,
  AlertCircle,
  Wand2,
  ArrowRight,
  Copy,
  Download,
  AlertTriangle,
} from "lucide-react";
import { WizardLayout } from "@/components/wizard/WizardLayout";
import { wizardConfigSchema } from "@shared/schema";

interface ValidationError {
  path: string;
  message: string;
  suggestion?: string;
  code?: string;
  severity?: "error" | "warning" | "info";
}

interface ValidationSuggestion {
  type: "fix" | "enhancement" | "warning";
  title: string;
  description: string;
  autoFixable: boolean;
  fix?: any;
}

interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
  warnings?: ValidationError[];
  suggestions?: ValidationSuggestion[];
  summary?: string;
  message?: string;
}

export default function Step0_ManualConfig() {
  const {
    nextStep,
    config,
    setProjectSetup,
    setDatabaseConfig,
    setModelDefinition,
    setAuthConfig,
    setOAuthConfig,
    setFeatureSelection,
    setDockerConfig,
    setCICDConfig,
  } = useWizardStore();
  const { toast } = useToast();

  const [jsonInput, setJsonInput] = useState("");
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Example template configs
  const exampleTemplates = {
    healthRecord: {
      name: "Health Record System",
      description: "Digital health records for migrant workers",
      config: {
        projectSetup: {
          projectName: "health-records",
          description: "Digital health record management system",
          author: "Your Name",
          license: "MIT",
          nodeVersion: "20",
          packageManager: "npm",
        },
        databaseConfig: {
          databaseType: "MongoDB",
          provider: "Atlas",
          connectionString:
            "mongodb+srv://user:pass@cluster.mongodb.net/health",
          autoMigration: "push",
        },
        modelDefinition: {
          models: [
            {
              name: "Worker",
              timestamps: true,
              fields: [
                {
                  name: "workerId",
                  type: "string",
                  required: true,
                  unique: true,
                },
                { name: "fullName", type: "string", required: true },
                { name: "dateOfBirth", type: "date" },
                {
                  name: "gender",
                  type: "enum",
                  values: ["male", "female", "other"],
                },
                { name: "bloodGroup", type: "string" },
              ],
            },
          ],
          relationships: [],
        },
        authConfig: {
          enabled: true,
          method: "jwt",
          jwt: {
            accessTTL: "15m",
            refreshTTL: "7d",
            rotation: true,
            blacklist: true,
          },
          roles: ["admin", "doctor", "worker"],
        },
        featureSelection: {
          cors: true,
          helmet: true,
          compression: true,
          validation: true,
          logging: true,
          caching: false,
          swagger: true,
          health: true,
          rateLimit: true,
          versioning: false,
        },
      },
    },
    ecommerce: {
      name: "E-commerce Platform",
      description: "Product catalog with orders and payments",
      config: {
        projectSetup: {
          projectName: "ecommerce-api",
          description: "E-commerce backend API",
          author: "Your Name",
          license: "MIT",
          nodeVersion: "20",
          packageManager: "npm",
        },
        databaseConfig: {
          databaseType: "MongoDB",
          provider: "Atlas",
          connectionString:
            "mongodb+srv://user:pass@cluster.mongodb.net/ecommerce",
          autoMigration: "push",
        },
        modelDefinition: {
          models: [
            {
              name: "Product",
              timestamps: true,
              fields: [
                { name: "name", type: "string", required: true },
                { name: "price", type: "number", required: true, min: 0 },
                { name: "inventory", type: "number", default: 0 },
                { name: "tags", type: "string[]" },
                { name: "metadata", type: "json" },
              ],
            },
          ],
          relationships: [],
        },
        authConfig: {
          enabled: true,
          method: "jwt",
          jwt: {
            accessTTL: "15m",
            refreshTTL: "7d",
            rotation: true,
            blacklist: true,
          },
          roles: ["Admin", "Seller", "Customer"],
        },
        featureSelection: {
          cors: true,
          helmet: true,
          compression: true,
          validation: true,
          logging: true,
          caching: true,
          swagger: true,
          health: true,
          rateLimit: true,
          versioning: true,
        },
      },
    },
    perfectRelationships: {
      name: "Complex Relationships",
      description: "Demo of 1:1, 1:N, M:N with custom naming",
      config: {
        projectSetup: {
          projectName: "relationship-demo",
          description:
            "Demonstration of all relationship types with custom naming",
          author: "Foundation Wizard",
          license: "MIT",
          nodeVersion: "20",
          packageManager: "npm",
        },
        databaseConfig: {
          databaseType: "MongoDB",
          provider: "Atlas",
          connectionString: "mongodb://localhost:27017/relationship-demo",
          autoMigration: "push",
        },
        modelDefinition: {
          models: [
            {
              name: "User",
              fields: [
                { name: "email", type: "string", required: true, unique: true },
                { name: "name", type: "string", required: true },
              ],
              timestamps: true,
            },
            {
              name: "Profile",
              fields: [
                { name: "bio", type: "string", required: false },
                { name: "avatarUrl", type: "string", required: false },
              ],
              timestamps: true,
            },
            {
              name: "Post",
              fields: [
                { name: "title", type: "string", required: true },
                { name: "content", type: "string", required: true },
                { name: "published", type: "boolean", default: false },
              ],
              timestamps: true,
            },
            {
              name: "Category",
              fields: [
                { name: "name", type: "string", required: true, unique: true },
              ],
              timestamps: true,
            },
            {
              name: "Tag",
              fields: [
                { name: "name", type: "string", required: true, unique: true },
              ],
              timestamps: true,
            },
          ],
          relationships: [
            {
              type: "one-to-one",
              sourceModel: "User",
              targetModel: "Profile",
              fieldName: "profileId",
              foreignKeyName: "profileId",
              inverseFieldName: "user",
            },
            {
              type: "one-to-many",
              sourceModel: "User",
              targetModel: "Post",
              fieldName: "posts",
              foreignKeyName: "authorId",
              inverseFieldName: "author",
            },
            {
              type: "many-to-one",
              sourceModel: "Post",
              targetModel: "Category",
              fieldName: "categoryId",
              foreignKeyName: "categoryId",
              inverseFieldName: "posts",
            },
            {
              type: "many-to-many",
              sourceModel: "Post",
              targetModel: "Tag",
              fieldName: "tags",
              inverseFieldName: "posts",
            },
          ],
        },
        authConfig: {
          enabled: true,
          method: "jwt",
          jwt: {
            accessTTL: "15m",
            refreshTTL: "7d",
            rotation: true,
            blacklist: true,
          },
          roles: ["Admin", "User"],
        },
        featureSelection: {
          cors: true,
          helmet: true,
          compression: true,
          validation: true,
          logging: true,
          caching: false,
          swagger: true,
          health: true,
          rateLimit: false,
          versioning: false,
          queues: false,
          s3Upload: false,
          encryptionStrategy: "disabled",
          fieldLevelAccessControl: false,
          gitHooks: true,
          sonarQube: false,
        },
      },
    },
  };

  const handleValidate = async () => {
    if (!jsonInput.trim()) {
      toast({
        title: "Empty Input",
        description: "Please paste your configuration JSON",
        variant: "destructive",
      });
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      // Parse JSON first
      let parsedConfig;
      try {
        parsedConfig = JSON.parse(jsonInput);
      } catch (parseError: any) {
        throw new Error(`JSON Parse Error: ${parseError.message}`);
      }

      // Try server-side validation first
      try {
        const response = await fetch("/api/validate-config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsedConfig),
        });

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Server not responding");
        }

        const result: ValidationResult = await response.json();
        setValidationResult(result);

        if (result.valid) {
          toast({
            title: "✅ Valid Configuration",
            description: result.message || "Configuration is ready to import",
          });
        } else {
          toast({
            title: "❌ Validation Failed",
            description:
              result.summary || `Found ${result.errors?.length || 0} errors`,
            variant: "destructive",
          });
        }
        return;
      } catch (serverError: any) {
        // Server unavailable - fall back to client-side validation
        console.warn(
          "Server validation failed, using client-side:",
          serverError.message,
        );

        const clientValidation = wizardConfigSchema.safeParse(parsedConfig);

        if (!clientValidation.success) {
          const errors = clientValidation.error.errors.map((err) => ({
            path: err.path.join("."),
            message: err.message,
            code: err.code,
            suggestion: getErrorSuggestion(err),
          }));

          setValidationResult({
            valid: false,
            errors,
            summary: `Found ${errors.length} validation error(s) (client-side validation)`,
          });

          toast({
            title: "⚠️ Validation Failed (Offline Mode)",
            description: `Found ${errors.length} errors. Server validation unavailable.`,
            variant: "destructive",
          });
        } else {
          setValidationResult({
            valid: true,
            message: "Configuration is valid (client-side validation)",
            warnings: [
              {
                type: "info",
                message:
                  "Using client-side validation. Start the dev server for full validation (semantic checks, relationship integrity, etc.)",
              },
            ],
          });

          toast({
            title: "✅ Valid (Offline Mode)",
            description:
              "Basic validation passed. Start server for complete validation.",
          });
        }
        return;
      }
    } catch (error: any) {
      setValidationResult({
        valid: false,
        errors: [
          {
            path: "root",
            message: error.message || "Validation error",
            suggestion: "Check your JSON syntax and configuration structure",
          },
        ],
      });

      toast({
        title: "Validation Error",
        description: error.message || "An error occurred during validation",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Helper function to provide suggestions for common Zod errors
  const getErrorSuggestion = (error: any): string => {
    const path = error.path?.join(".") || "";

    // Specific OAuth callbackURL error
    if (path.includes("oauthConfig") && path.includes("callbackURL")) {
      return 'OAuth provider requires "callbackURL" field (capital URL). Example: "/auth/google/callback"';
    }

    // Common typo: callbackUrl vs callbackURL
    if (path.includes("oauthConfig") && error.code === "invalid_type") {
      return 'Did you mean "callbackURL" (capital URL)? Common typo: callbackUrl → callbackURL';
    }

    // Model definition errors
    if (path.includes("models") && error.code === "too_small") {
      return "At least one model is required for your project";
    }

    // Field errors
    if (path.includes("fields") && error.code === "too_small") {
      return "Each model must have at least one field";
    }

    // Database configuration
    if (path.includes("databaseType") && error.code === "invalid_enum_value") {
      return 'Valid database types: "PostgreSQL", "MySQL", "MongoDB"';
    }

    if (path.includes("orm") && error.code === "invalid_enum_value") {
      return 'Valid ORM options: "TypeORM", "Prisma", "Mongoose"';
    }

    // Auth configuration
    if (
      path.includes("authConfig.strategies") &&
      error.code === "invalid_enum_value"
    ) {
      return 'Valid authentication strategies: "jwt", "local", "api-key", "oauth2"';
    }

    // Generic suggestions by error type
    if (error.code === "invalid_type") {
      return `Expected type: ${error.expected}, but received: ${error.received}`;
    }
    if (error.code === "invalid_enum_value") {
      return `Valid options: ${error.options?.join(", ") || "see documentation"}`;
    }
    if (error.code === "too_small") {
      return `Minimum ${error.minimum} items required`;
    }
    if (error.code === "invalid_string") {
      return "Check format requirements (e.g., camelCase, PascalCase)";
    }
    if (error.code === "unrecognized_keys") {
      return `Remove unrecognized keys: ${error.keys?.join(", ")}`;
    }
    return "Please check the configuration documentation";
  };

  const handleImport = async () => {
    if (!validationResult?.valid) {
      toast({
        title: "Cannot Import",
        description: "Please fix validation errors first",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);

    try {
      const parsedConfig = JSON.parse(jsonInput);

      // Populate Zustand store with parsed config
      if (parsedConfig.projectSetup) {
        setProjectSetup(parsedConfig.projectSetup);
      }
      if (parsedConfig.databaseConfig) {
        setDatabaseConfig(parsedConfig.databaseConfig);
      }
      if (parsedConfig.modelDefinition) {
        // Add IDs to models/fields/relationships if missing
        const models = parsedConfig.modelDefinition.models?.map(
          (model: any) => ({
            ...model,
            id: model.id || `model-${model.name}`,
            fields: model.fields?.map((field: any, idx: number) => ({
              ...field,
              id: field.id || `field-${model.name}-${field.name}-${idx}`,
            })),
          }),
        );

        const relationships =
          parsedConfig.modelDefinition.relationships?.map(
            (rel: any, idx: number) => ({
              ...rel,
              id: rel.id || `rel-${idx}`,
            }),
          ) || [];

        setModelDefinition({ models, relationships });
      }
      if (parsedConfig.authConfig) {
        setAuthConfig(parsedConfig.authConfig);
      }
      if (parsedConfig.oauthConfig) {
        setOAuthConfig(parsedConfig.oauthConfig);
      }
      if (parsedConfig.featureSelection) {
        setFeatureSelection(parsedConfig.featureSelection);
      }
      if (parsedConfig.dockerConfig) {
        setDockerConfig(parsedConfig.dockerConfig);
      }
      if (parsedConfig.cicdConfig) {
        setCICDConfig(parsedConfig.cicdConfig);
      }

      toast({
        title: "✅ Configuration Imported",
        description:
          "You can now review or edit the configuration in the wizard",
      });

      // Navigate to next step
      nextStep();
    } catch (error: any) {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import configuration",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleLoadTemplate = (templateKey: keyof typeof exampleTemplates) => {
    const template = exampleTemplates[templateKey];
    setJsonInput(JSON.stringify(template.config, null, 2));
    toast({
      title: "Template Loaded",
      description: `${template.name} configuration loaded`,
    });
  };

  const handleCopyExample = () => {
    const example = JSON.stringify(
      exampleTemplates.healthRecord.config,
      null,
      2,
    );
    navigator.clipboard.writeText(example);
    toast({
      title: "Copied to Clipboard",
      description: "Example configuration copied",
    });
  };

  return (
    <WizardLayout
      title="Import Configuration"
      description="Start with a JSON config or use the visual wizard"
    >
      <div className="space-y-6">
        {/* Quick Start Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card
            className="p-6 hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => nextStep()}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Wand2 className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Visual Wizard</h3>
                <p className="text-sm text-muted-foreground">
                  Step-by-step guided setup
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-6 border-primary/50">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <FileJson className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Import JSON Config</h3>
                <p className="text-sm text-muted-foreground">
                  Paste your configuration below
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Example Templates */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Quick Start Templates</h3>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleLoadTemplate("healthRecord")}
            >
              Health Records
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleLoadTemplate("ecommerce")}
            >
              E-commerce
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleLoadTemplate("perfectRelationships")}
            >
              Perfect Relationships
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopyExample}>
              <Copy className="w-4 h-4 mr-2" />
              Copy Example
            </Button>
          </div>
        </div>

        {/* JSON Input */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Configuration JSON</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={handleValidate}
              disabled={isValidating || !jsonInput.trim()}
            >
              {isValidating ? "Validating..." : "Validate"}
            </Button>
          </div>

          <textarea
            className="w-full h-96 p-4 rounded-lg border bg-muted font-mono text-sm"
            placeholder='Paste your configuration JSON here...\n\nExample:\n{\n  "projectSetup": {\n    "projectName": "my-api",\n    ...\n  },\n  "databaseConfig": { ... },\n  ...\n}'
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
          />
        </div>

        {/* Validation Results */}
        {validationResult && (
          <div className="space-y-4">
            {/* Summary Alert */}
            {validationResult.valid ? (
              <Alert className="border-green-500/50 bg-green-500/10">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-700 dark:text-green-300">
                  <div className="font-semibold">
                    {validationResult.summary || "✅ Configuration is valid"}
                  </div>
                  {validationResult.message && (
                    <div className="text-sm mt-1">
                      {validationResult.message}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-semibold">
                    {validationResult.summary || "Validation failed"}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Errors Section */}
            {validationResult.errors && validationResult.errors.length > 0 && (
              <Card className="p-4 border-red-500/50 bg-red-500/5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <h3 className="font-semibold text-red-700 dark:text-red-300">
                    Errors ({validationResult.errors.length})
                  </h3>
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {validationResult.errors.map((error, idx) => (
                    <div
                      key={idx}
                      className="border-l-2 border-red-500 pl-3 py-2 bg-background/50 rounded-r"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm text-red-700 dark:text-red-300">
                            {error.path || "Config"}
                          </div>
                          <div className="text-sm mt-1">{error.message}</div>
                          {error.suggestion && (
                            <div className="text-sm text-muted-foreground mt-2 bg-muted/50 p-2 rounded">
                              💡{" "}
                              <span className="font-medium">Suggestion:</span>{" "}
                              {error.suggestion}
                            </div>
                          )}
                        </div>
                        {error.code && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {error.code}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Warnings Section */}
            {validationResult.warnings &&
              validationResult.warnings.length > 0 && (
                <Card className="p-4 border-yellow-500/50 bg-yellow-500/5">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <h3 className="font-semibold text-yellow-700 dark:text-yellow-300">
                      Warnings ({validationResult.warnings.length})
                    </h3>
                  </div>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {validationResult.warnings.map((warning, idx) => (
                      <div
                        key={idx}
                        className="border-l-2 border-yellow-500 pl-3 py-2 bg-background/50 rounded-r"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-sm text-yellow-700 dark:text-yellow-300">
                              {warning.path || "Config"}
                            </div>
                            <div className="text-sm mt-1">
                              {warning.message}
                            </div>
                            {warning.suggestion && (
                              <div className="text-sm text-muted-foreground mt-2 bg-muted/50 p-2 rounded">
                                💡{" "}
                                <span className="font-medium">Suggestion:</span>{" "}
                                {warning.suggestion}
                              </div>
                            )}
                          </div>
                          {warning.code && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {warning.code}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

            {/* Suggestions Section */}
            {validationResult.suggestions &&
              validationResult.suggestions.length > 0 && (
                <Card className="p-4 border-blue-500/50 bg-blue-500/5">
                  <div className="flex items-center gap-2 mb-3">
                    <Wand2 className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-700 dark:text-blue-300">
                      Suggestions ({validationResult.suggestions.length})
                    </h3>
                  </div>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {validationResult.suggestions.map((suggestion, idx) => (
                      <div
                        key={idx}
                        className="border-l-2 border-blue-500 pl-3 py-2 bg-background/50 rounded-r"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm text-blue-700 dark:text-blue-300">
                                {suggestion.title}
                              </span>
                              {suggestion.autoFixable && (
                                <Badge
                                  variant="secondary"
                                  className="text-xs bg-blue-100 text-blue-700"
                                >
                                  Auto-fixable
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm mt-1">
                              {suggestion.description}
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={`ml-2 text-xs ${
                              suggestion.type === "fix"
                                ? "border-red-500 text-red-500"
                                : suggestion.type === "warning"
                                  ? "border-yellow-500 text-yellow-600"
                                  : "border-blue-500 text-blue-600"
                            }`}
                          >
                            {suggestion.type}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

            {/* Validation Stats */}
            {(validationResult.errors?.length ||
              validationResult.warnings?.length ||
              validationResult.suggestions?.length) && (
              <div className="flex gap-4 text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                {validationResult.errors &&
                  validationResult.errors.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-red-500">●</span>
                      <span>
                        {validationResult.errors.length}{" "}
                        {validationResult.errors.length === 1
                          ? "Error"
                          : "Errors"}
                      </span>
                    </div>
                  )}
                {validationResult.warnings &&
                  validationResult.warnings.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-500">●</span>
                      <span>
                        {validationResult.warnings.length}{" "}
                        {validationResult.warnings.length === 1
                          ? "Warning"
                          : "Warnings"}
                      </span>
                    </div>
                  )}
                {validationResult.suggestions &&
                  validationResult.suggestions.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-blue-500">●</span>
                      <span>
                        {validationResult.suggestions.length}{" "}
                        {validationResult.suggestions.length === 1
                          ? "Suggestion"
                          : "Suggestions"}
                      </span>
                    </div>
                  )}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            size="lg"
            onClick={handleImport}
            disabled={!validationResult?.valid || isImporting}
            className="flex-1"
          >
            <Upload className="w-4 h-4 mr-2" />
            {isImporting ? "Importing..." : "Import & Continue"}
          </Button>
          <Button size="lg" variant="outline" onClick={() => nextStep()}>
            Skip Import
          </Button>
        </div>

        {/* Help Text */}
        <div className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg">
          <p className="font-medium mb-2">💡 Tips:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Use templates above to get started quickly</li>
            <li>
              Supported field types: string, number, boolean, date, datetime,
              string[], json, json[], enum
            </li>
            <li>
              Relationships can be defined inline in models or as a separate
              array
            </li>
            <li>All IDs are auto-generated if not provided</li>
          </ul>
        </div>
      </div>
    </WizardLayout>
  );
}
