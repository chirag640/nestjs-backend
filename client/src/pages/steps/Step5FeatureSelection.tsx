import { useWizardStore } from "@/lib/store";
import { WizardLayout } from "@/components/wizard/WizardLayout";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { FeatureSelection } from "@shared/schema";
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
  ListTodo,
  CloudUpload,
  // Phase 4 Enterprise icons
  Wifi,
  CreditCard,
  BarChart3,
  Bell,
  Brain,
  FileSpreadsheet,
  Languages,
  Share2,
  Users,
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
  {
    key: "queues" as const,
    icon: ListTodo,
    title: "Background Job Queues",
    description:
      "BullMQ job queues with Redis for async processing, scheduled tasks, and cleanup operations",
    recommended: false,
  },
  {
    key: "s3Upload" as const,
    icon: CloudUpload,
    title: "AWS S3 File Uploads",
    description:
      "S3 file lifecycle with presigned URLs, temp staging, automatic cleanup, versioning, and Glacier archiving",
    recommended: false,
  },
  {
    key: "fieldLevelAccessControl" as const,
    icon: Shield,
    title: "Field-Level Access Control (FLAC)",
    description:
      "Role-based field filtering to hide sensitive data (medical notes, SSN, salaries) from unauthorized users. Includes admin UI for managing permissions.",
    recommended: true,
  },
];

const PRODUCTION_FEATURES = [
  {
    key: "gitHooks" as const,
    icon: GitBranch,
    title: "Git Hooks",
    description:
      "Husky and lint-staged configuration for pre-commit linting and commit message validation",
    recommended: true,
  },
  {
    key: "sonarQube" as const,
    icon: Activity,
    title: "SonarQube Analysis",
    description:
      "Static code analysis configuration and Docker service for continuous code quality inspection",
    recommended: false,
  },
];

// Phase 4 Enterprise Features
const ENTERPRISE_FEATURES = [
  {
    key: "realtime" as const,
    icon: Wifi,
    title: "Real-time WebSockets",
    description: "Socket.io gateway with JWT auth, rooms, presence tracking, and Redis scaling",
    recommended: false,
    badge: "Enterprise",
  },
  {
    key: "graphql" as const,
    icon: Share2,
    title: "GraphQL API",
    description: "Apollo Server with auto-generated types, subscriptions, and complexity analysis",
    recommended: false,
    badge: "Enterprise",
  },
  {
    key: "payments" as const,
    icon: CreditCard,
    title: "Payment Integration",
    description: "Stripe and Razorpay support with subscriptions, invoicing, and webhooks",
    recommended: false,
    badge: "Enterprise",
  },
  {
    key: "multitenancy" as const,
    icon: Users,
    title: "Multi-Tenancy",
    description: "Tenant isolation via headers, subdomains, or JWT with separate databases/schemas",
    recommended: false,
    badge: "Enterprise",
  },
  {
    key: "analytics" as const,
    icon: BarChart3,
    title: "API Analytics",
    description: "Prometheus metrics for HTTP requests, latency, errors, and business KPIs",
    recommended: false,
    badge: "Enterprise",
  },
  {
    key: "featureFlags" as const,
    icon: GitBranch,
    title: "Feature Flags",
    description: "A/B testing with percentage rollout, user targeting, and variant tracking",
    recommended: false,
    badge: "Enterprise",
  },
  {
    key: "notifications" as const,
    icon: Bell,
    title: "Multi-Channel Notifications",
    description: "Email, SMS (Twilio), Push (FCM), and In-App notifications with templates",
    recommended: false,
    badge: "Enterprise",
  },
  {
    key: "ai" as const,
    icon: Brain,
    title: "AI/ML Integration",
    description: "OpenAI and Anthropic with embeddings, summarization, moderation, and recommendations",
    recommended: false,
    badge: "Enterprise",
  },
  {
    key: "reports" as const,
    icon: FileSpreadsheet,
    title: "Report Generation",
    description: "PDF, Excel, CSV export with scheduling and email delivery",
    recommended: false,
    badge: "Enterprise",
  },
  {
    key: "i18n" as const,
    icon: Languages,
    title: "Internationalization",
    description: "Multi-language support with date/number/currency formatting and RTL",
    recommended: false,
    badge: "Enterprise",
  },
];
const ENCRYPTION_STRATEGIES = [
  {
    value: "disabled" as const,
    label: "Disabled (No Encryption)",
    cost: "FREE",
    security: "None",
    description: "No field-level encryption. Use for public data only.",
    icon: "🔓",
    recommended: false,
    bestFor: "Public data, blogs, non-sensitive information",
    color: "text-red-600",
  },
  {
    value: "local" as const,
    label: "Local (Free Alternative)",
    cost: "FREE",
    security: "Strong (AES-256-GCM)",
    description:
      "FREE encryption using environment variable key. Perfect for startups!",
    icon: "💚",
    recommended: true,
    bestFor: "Startups, internal tools, < 100K users",
    color: "text-green-600",
    requirements: "ENCRYPTION_MASTER_KEY (64-char hex)",
  },
  {
    value: "aws_kms" as const,
    label: "AWS KMS (Enterprise)",
    cost: "~$7/month",
    security: "Bank-grade (HSM + Auto Rotation)",
    description: "Enterprise encryption with AWS KMS. HIPAA/GDPR compliant.",
    icon: "🔐",
    recommended: false,
    bestFor: "Medical data, financial data, enterprise, compliance",
    color: "text-blue-600",
    requirements: "AWS account, KMS_KEY_ID, AWS credentials",
    compliance: "HIPAA, GDPR, PCI DSS",
  },
];

export default function Step5FeatureSelection() {
  const { config, updateFeatureSelection } = useWizardStore();
  const features = config.featureSelection ?? ({} as FeatureSelection);

  const updateFeature = (key: keyof typeof features, checked: boolean) => {
    updateFeatureSelection({ [key]: checked });
  };

  const totalFeatures =
    BASIC_FEATURES.length +
    ADVANCED_FEATURES.length +
    PRODUCTION_FEATURES.length +
    ENTERPRISE_FEATURES.length;
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

        {/* Production Features Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
              Production Readiness
            </h3>
          </div>
          {PRODUCTION_FEATURES.map((feature) => {
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

        {/* Enterprise Features Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-purple-500" />
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
              🚀 Enterprise Features
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-100 font-medium">
              Phase 4
            </span>
          </div>
          {ENTERPRISE_FEATURES.map((feature) => {
            const Icon = feature.icon;
            const isEnabled = (features as any)[feature.key];

            return (
              <Card
                key={feature.key}
                className={`p-5 transition-all duration-200 ${
                  isEnabled ? "border-purple-500/30 bg-purple-500/5" : "border-border"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isEnabled
                        ? "bg-purple-500/20 border border-purple-500/30"
                        : "bg-secondary/50"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        isEnabled ? "text-purple-500" : "text-muted-foreground"
                      }`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-base">
                        {feature.title}
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-100 font-medium">
                        {feature.badge}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>

                  <Switch
                    checked={isEnabled}
                    onCheckedChange={(checked) =>
                      updateFeatureSelection({ [feature.key]: checked } as any)
                    }
                    data-testid={`toggle-${feature.key}`}
                  />
                </div>
              </Card>
            );
          })}
        </div>

        {/* Field-Level Encryption Strategy */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
              🔐 Field-Level Encryption Strategy
            </h3>
          </div>

          <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
            <Info className="w-4 h-4 text-amber-600" />
            <AlertDescription className="text-sm text-amber-900 dark:text-amber-100">
              <strong>Choose your encryption strategy</strong> based on your
              budget and compliance needs. Encrypts sensitive fields
              (healthHistory, SSN, etc.) before storing in MongoDB.{" "}
              <strong>Start with LOCAL (free)</strong>, upgrade to AWS KMS later
              for compliance.
            </AlertDescription>
          </Alert>

          <div className="grid gap-3">
            {ENCRYPTION_STRATEGIES.map((strategy) => {
              const isSelected = features.encryptionStrategy === strategy.value;

              return (
                <Card
                  key={strategy.value}
                  onClick={() =>
                    updateFeatureSelection({
                      encryptionStrategy: strategy.value,
                    })
                  }
                  className={`p-5 cursor-pointer transition-all duration-200 hover:shadow-md ${
                    isSelected
                      ? "border-primary/50 bg-primary/10 ring-2 ring-primary/20"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-3xl flex-shrink-0">
                      {strategy.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-base">
                          {strategy.label}
                        </h3>
                        {strategy.recommended && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100 font-medium">
                            💡 Recommended
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground mb-2">
                        {strategy.description}
                      </p>

                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2 py-1 rounded-md bg-background border">
                          <strong>Cost:</strong> {strategy.cost}
                        </span>
                        <span className="px-2 py-1 rounded-md bg-background border">
                          <strong>Security:</strong> {strategy.security}
                        </span>
                        {strategy.compliance && (
                          <span className="px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
                            ✅ {strategy.compliance}
                          </span>
                        )}
                      </div>

                      {strategy.requirements && (
                        <p className="text-xs text-muted-foreground mt-2">
                          <strong>Requirements:</strong> {strategy.requirements}
                        </p>
                      )}

                      <p className="text-xs text-muted-foreground mt-2">
                        <strong>Best for:</strong> {strategy.bestFor}
                      </p>
                    </div>

                    {isSelected && (
                      <div className="flex-shrink-0">
                        <CheckCircle2 className="w-6 h-6 text-primary" />
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {features.encryptionStrategy !== "disabled" && (
            <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-sm text-green-900 dark:text-green-100">
                ✅ <strong>Encryption enabled!</strong> Sensitive fields will be
                encrypted with{" "}
                {features.encryptionStrategy === "local" ? (
                  <>
                    <strong>FREE local AES-256-GCM</strong>. Set{" "}
                    <code className="bg-green-100 dark:bg-green-900 px-1 rounded">
                      ENCRYPTION_MASTER_KEY
                    </code>{" "}
                    in your .env file.
                  </>
                ) : (
                  <>
                    <strong>AWS KMS</strong> (~$7/month). Configure{" "}
                    <code className="bg-green-100 dark:bg-green-900 px-1 rounded">
                      KMS_KEY_ID
                    </code>{" "}
                    in your .env file.
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}
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
${features.queues ? "  // BullMQ queues: email, notification, document, cleanup" : ""}
${features.s3Upload ? "  // S3 file uploads with presigned URLs and lifecycle" : ""}
${features.gitHooks ? "  // Git hooks: pre-commit (lint-staged), commit-msg (commitlint)" : ""}
${features.sonarQube ? "  // SonarQube: docker-compose service + sonar-project.properties" : ""}
${features.encryptionStrategy && features.encryptionStrategy !== "disabled" ? `  // 🔐 Encryption: ${features.encryptionStrategy.toUpperCase()} (${features.encryptionStrategy === "local" ? "FREE" : "~$7/mo"})` : ""}
  await app.listen(process.env.PORT || 3000);
}`}
          </pre>
        </div>
      </div>
    </WizardLayout>
  );
}
