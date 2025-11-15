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
} from "lucide-react";

const FEATURES = [
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
  {
    key: "logging" as const,
    icon: FileText,
    title: "Logging",
    description:
      "Console logger for debugging and monitoring application behavior",
    recommended: true,
  },
  {
    key: "health" as const,
    icon: Activity,
    title: "Health Check",
    description: "GET /health endpoint for monitoring service availability",
    recommended: true,
  },
];

export default function Step5FeatureSelection() {
  const { config, updateFeatureSelection } = useWizardStore();
  const features = config.featureSelection!;

  const updateFeature = (key: keyof typeof features, checked: boolean) => {
    updateFeatureSelection({ [key]: checked });
  };

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
            These features add production-ready security, performance, and
            monitoring capabilities. All features are{" "}
            <strong>recommended</strong> and can be toggled individually.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          {FEATURES.map((feature) => {
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
                {enabledCount} of {FEATURES.length} features enabled
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {enabledCount === FEATURES.length
                  ? "All recommended features enabled - optimal configuration"
                  : "You can enable/disable features based on your requirements"}
              </p>
            </div>
          </div>
        </Card>

        {/* Code Impact Preview */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">main.ts Configuration Preview</h4>
          <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto">
            {`async function bootstrap() {
  const app = await NestFactory.create(AppModule);
${features.helmet ? "  app.use(helmet());" : ""}
${features.compression ? "  app.use(compression());" : ""}
${features.cors ? "  app.enableCors();" : ""}
${features.validation ? "  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));" : ""}
${features.logging ? "  app.useLogger(new Logger());" : ""}
  await app.listen(3000);
}`}
          </pre>
        </div>
      </div>
    </WizardLayout>
  );
}
