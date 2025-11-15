import { useWizardStore } from "@/lib/store";
import { WizardLayout } from "@/components/wizard/WizardLayout";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Globe,
  Shield,
  Zap,
  CheckCircle2,
  FileText,
  Activity,
  Settings,
  Info,
  Database,
  BookOpen,
  Timer,
  GitBranch,
} from "lucide-react";

const BASIC_FEATURES = [
  {
    key: "cors" as const,
    icon: Globe,
    title: "CORS",
    description:
      "Enable Cross-Origin Resource Sharing for API access from different domains",
    recommended: true,
  },
  {
    key: "helmet" as const,
    icon: Shield,
    title: "Helmet",
    description:
      "Secure HTTP headers protection against common vulnerabilities",
    recommended: true,
  },
  {
    key: "compression" as const,
    icon: Zap,
    title: "Compression",
    description: "Gzip compression middleware to reduce response payload size",
    recommended: true,
  },
  {
    key: "validation" as const,
    icon: CheckCircle2,
    title: "Global Validation",
    description:
      "Automatic request validation using class-validator decorators",
    recommended: true,
  },
];

const ADVANCED_FEATURES = [
  {
    key: "logging" as const,
    icon: FileText,
    title: "Structured Logging",
    description:
      "Pino logger with request tracking, performance metrics, and JSON formatting",
    recommended: true,
  },
  {
    key: "caching" as const,
    icon: Database,
    title: "Redis Caching",
    description:
      "Distributed caching with cache-manager and Redis for improved performance",
    recommended: false,
  },
  {
    key: "swagger" as const,
    icon: BookOpen,
    title: "API Documentation",
    description:
      "Interactive Swagger/OpenAPI docs with JWT authentication support",
    recommended: false,
  },
  {
    key: "health" as const,
    icon: Activity,
    title: "Health Checks",
    description: "Terminus health endpoints for database and system monitoring",
    recommended: true,
  },
  {
    key: "rateLimit" as const,
    icon: Timer,
    title: "Rate Limiting",
    description:
      "Throttler middleware to prevent abuse and protect against DDoS attacks",
    recommended: false,
  },
  {
    key: "versioning" as const,
    icon: GitBranch,
    title: "API Versioning",
    description: "URI-based API versioning (v1, v2) for backward compatibility",
    recommended: false,
  },
];

export default function Step5FeatureSelection() {
  const { config, updateFeatureSelection } = useWizardStore();
  const features = config.featureSelection!;

  const updateFeature = (key: keyof typeof features, checked: boolean) => {
    updateFeatureSelection({ [key]: checked });
  };

  const totalFeatures = BASIC_FEATURES.length + ADVANCED_FEATURES.length;
  const enabledCount = Object.values(features).filter(Boolean).length;

  return (
    <WizardLayout
      title="Feature Selection"
      description="Configure system-level features and middleware for your NestJS application"
    >
      <div className="space-y-6">
        <Alert>
          <Info className="w-4 h-4" />
          <AlertDescription>
            Configure production-ready features for your NestJS application.
            Basic features provide security and performance, while advanced
            features add enterprise capabilities like caching and monitoring.
          </AlertDescription>
        </Alert>

        {/* Basic Features Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
              Basic Features
            </h3>
          </div>
          {BASIC_FEATURES.map((feature) => {
            const Icon = feature.icon;
            const isEnabled = features[feature.key];

            return (
              <Card
                key={feature.key}
                className={`p-5 transition-all duration-200 ${
                  isEnabled ? "border-primary/30 bg-primary/5" : "border-border"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isEnabled
                        ? "bg-primary/20 border border-primary/30"
                        : "bg-secondary/50"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        isEnabled ? "text-primary" : "text-muted-foreground"
                      }`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-base">
                        {feature.title}
                      </h3>
                      {feature.recommended && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>

                  <Switch
                    checked={isEnabled}
                    onCheckedChange={(checked) =>
                      updateFeature(feature.key, checked)
                    }
                    data-testid={`toggle-${feature.key}`}
                  />
                </div>
              </Card>
            );
          })}
        </div>

        {/* Advanced Features Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
              Advanced Features
            </h3>
          </div>
          {ADVANCED_FEATURES.map((feature) => {
            const Icon = feature.icon;
            const isEnabled = features[feature.key];

            return (
              <Card
                key={feature.key}
                className={`p-5 transition-all duration-200 ${
                  isEnabled ? "border-primary/30 bg-primary/5" : "border-border"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isEnabled
                        ? "bg-primary/20 border border-primary/30"
                        : "bg-secondary/50"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        isEnabled ? "text-primary" : "text-muted-foreground"
                      }`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-base">
                        {feature.title}
                      </h3>
                      {feature.recommended && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>

                  <Switch
                    checked={isEnabled}
                    onCheckedChange={(checked) =>
                      updateFeature(feature.key, checked)
                    }
                    data-testid={`toggle-${feature.key}`}
                  />
                </div>
              </Card>
            );
          })}
        </div>

        {/* Feature Summary */}
        <Card className="p-4 bg-secondary/30">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                {enabledCount} of {totalFeatures} features enabled
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {enabledCount === totalFeatures
                  ? "All features enabled - maximum configuration"
                  : "You can enable/disable features based on your requirements"}
              </p>
            </div>
          </div>
        </Card>

        {/* Code Impact Preview */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">main.ts Configuration Preview</h4>
          <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto font-mono">
            {`async function bootstrap() {
  const app = await NestFactory.create(AppModule${features.logging ? ", { bufferLogs: true }" : ""});
${features.logging ? "  app.useLogger(app.get(Logger));" : ""}
${features.versioning ? "  app.enableVersioning({ type: VersioningType.URI });" : ""}
${features.helmet ? "  app.use(helmet());" : ""}
${features.compression ? "  app.use(compression());" : ""}
${features.cors ? "  app.enableCors();" : ""}
${features.validation ? "  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));" : ""}
${features.swagger ? "  // Swagger setup at /api/docs" : ""}
${features.health ? "  // Health endpoint at /health" : ""}
${features.rateLimit ? "  // Rate limiting via Throttler module" : ""}
${features.caching ? "  // Redis caching via CacheModule" : ""}
  await app.listen(process.env.PORT || 3000);
}`}
          </pre>
        </div>
      </div>
    </WizardLayout>
  );
}
