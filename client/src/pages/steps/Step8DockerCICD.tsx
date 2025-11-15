import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useWizardStore } from "@/lib/store";
import { WizardLayout } from "@/components/wizard/WizardLayout";
import {
  Container,
  FileCode2,
  GitBranch,
  Rocket,
  CheckCircle2,
  Shield,
} from "lucide-react";

export default function Step8DockerCICD() {
  const { config, updateDockerConfig, updateCICDConfig } = useWizardStore();

  const dockerConfig = config.dockerConfig ?? {
    enabled: true,
    includeCompose: true,
    includeProd: true,
    healthCheck: true,
    nonRootUser: true,
    multiStage: true,
  };

  const cicdConfig = config.cicdConfig ?? {
    enabled: true,
    githubActions: true,
    gitlabCI: false,
    includeTests: true,
    includeE2E: true,
    includeSecurity: true,
    autoDockerBuild: true,
  };

  const updateDocker = (key: keyof typeof dockerConfig, value: boolean) => {
    updateDockerConfig({ [key]: value });
  };

  const updateCICD = (key: keyof typeof cicdConfig, value: boolean) => {
    updateCICDConfig({ [key]: value });
  };

  return (
    <WizardLayout
      title="Docker & CI/CD"
      description="Configure Docker containers and CI/CD pipelines for production deployment"
    >
      <div className="space-y-6">
        <Alert>
          <Rocket className="h-4 w-4" />
          <AlertDescription>
            Generate production-ready Docker containers and automated CI/CD
            pipelines. Your application will be ready to deploy in minutes!
          </AlertDescription>
        </Alert>

        {/* Docker Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Container className="h-5 w-5" />
              <CardTitle>Docker Configuration</CardTitle>
            </div>
            <CardDescription>
              Generate Docker files for containerized deployment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label
                  htmlFor="docker-enabled"
                  className="text-base font-medium"
                >
                  Enable Docker
                </Label>
                <p className="text-sm text-muted-foreground">
                  Generate Dockerfile and .dockerignore
                </p>
              </div>
              <Switch
                id="docker-enabled"
                checked={dockerConfig.enabled}
                onCheckedChange={(checked) => updateDocker("enabled", checked)}
              />
            </div>

            {dockerConfig.enabled && (
              <>
                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="docker-compose" className="font-medium">
                      Docker Compose
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Include docker-compose.yml for development
                    </p>
                  </div>
                  <Switch
                    id="docker-compose"
                    checked={dockerConfig.includeCompose}
                    onCheckedChange={(checked) =>
                      updateDocker("includeCompose", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="docker-prod" className="font-medium">
                      Production Compose
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Include docker-compose.prod.yml for production
                    </p>
                  </div>
                  <Switch
                    id="docker-prod"
                    checked={dockerConfig.includeProd}
                    onCheckedChange={(checked) =>
                      updateDocker("includeProd", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="docker-health"
                      className="font-medium flex items-center gap-1"
                    >
                      Health Checks{" "}
                      <Badge variant="secondary" className="text-xs">
                        Recommended
                      </Badge>
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Add Docker health check instructions
                    </p>
                  </div>
                  <Switch
                    id="docker-health"
                    checked={dockerConfig.healthCheck}
                    onCheckedChange={(checked) =>
                      updateDocker("healthCheck", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="docker-user"
                      className="font-medium flex items-center gap-1"
                    >
                      Non-Root User{" "}
                      <Badge variant="secondary" className="text-xs">
                        Security
                      </Badge>
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Run container as non-root user (best practice)
                    </p>
                  </div>
                  <Switch
                    id="docker-user"
                    checked={dockerConfig.nonRootUser}
                    onCheckedChange={(checked) =>
                      updateDocker("nonRootUser", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="docker-multistage"
                      className="font-medium flex items-center gap-1"
                    >
                      Multi-Stage Build{" "}
                      <Badge variant="secondary" className="text-xs">
                        Optimized
                      </Badge>
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Smaller image size (~30-40MB final)
                    </p>
                  </div>
                  <Switch
                    id="docker-multistage"
                    checked={dockerConfig.multiStage}
                    onCheckedChange={(checked) =>
                      updateDocker("multiStage", checked)
                    }
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* CI/CD Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              <CardTitle>CI/CD Pipeline</CardTitle>
            </div>
            <CardDescription>
              Automate testing, building, and deployment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="cicd-enabled" className="text-base font-medium">
                  Enable CI/CD
                </Label>
                <p className="text-sm text-muted-foreground">
                  Generate workflow configuration files
                </p>
              </div>
              <Switch
                id="cicd-enabled"
                checked={cicdConfig.enabled}
                onCheckedChange={(checked) => updateCICD("enabled", checked)}
              />
            </div>

            {cicdConfig.enabled && (
              <>
                <Separator />

                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    Platform Support
                  </Label>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label
                        htmlFor="github-actions"
                        className="font-medium flex items-center gap-1"
                      >
                        GitHub Actions{" "}
                        <Badge variant="default" className="text-xs">
                          Popular
                        </Badge>
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        .github/workflows/build.yml
                      </p>
                    </div>
                    <Switch
                      id="github-actions"
                      checked={cicdConfig.githubActions}
                      onCheckedChange={(checked) =>
                        updateCICD("githubActions", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="gitlab-ci" className="font-medium">
                        GitLab CI
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        .gitlab-ci.yml
                      </p>
                    </div>
                    <Switch
                      id="gitlab-ci"
                      checked={cicdConfig.gitlabCI}
                      onCheckedChange={(checked) =>
                        updateCICD("gitlabCI", checked)
                      }
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    Pipeline Features
                  </Label>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label
                        htmlFor="cicd-tests"
                        className="font-medium flex items-center gap-1"
                      >
                        Unit Tests{" "}
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Run npm test on every push
                      </p>
                    </div>
                    <Switch
                      id="cicd-tests"
                      checked={cicdConfig.includeTests}
                      onCheckedChange={(checked) =>
                        updateCICD("includeTests", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label
                        htmlFor="cicd-e2e"
                        className="font-medium flex items-center gap-1"
                      >
                        E2E Tests{" "}
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Generate E2E test suite and run in CI
                      </p>
                    </div>
                    <Switch
                      id="cicd-e2e"
                      checked={cicdConfig.includeE2E}
                      onCheckedChange={(checked) =>
                        updateCICD("includeE2E", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label
                        htmlFor="cicd-security"
                        className="font-medium flex items-center gap-1"
                      >
                        Security Audit{" "}
                        <Shield className="h-3 w-3 text-blue-500" />
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        npm audit + Trivy vulnerability scanning
                      </p>
                    </div>
                    <Switch
                      id="cicd-security"
                      checked={cicdConfig.includeSecurity}
                      onCheckedChange={(checked) =>
                        updateCICD("includeSecurity", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label
                        htmlFor="cicd-docker"
                        className="font-medium flex items-center gap-1"
                      >
                        Auto Docker Build{" "}
                        <FileCode2 className="h-3 w-3 text-purple-500" />
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Build and push Docker image on main branch
                      </p>
                    </div>
                    <Switch
                      id="cicd-docker"
                      checked={cicdConfig.autoDockerBuild}
                      onCheckedChange={(checked) =>
                        updateCICD("autoDockerBuild", checked)
                      }
                      disabled={!dockerConfig.enabled}
                    />
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        {(dockerConfig.enabled || cicdConfig.enabled) && (
          <Alert>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription>
              <span className="font-medium">
                Your application will include:
              </span>
              <ul className="mt-2 space-y-1 text-sm">
                {dockerConfig.enabled && (
                  <>
                    <li>✅ Production-ready Docker configuration</li>
                    {dockerConfig.includeCompose && (
                      <li>✅ Development docker-compose setup</li>
                    )}
                    {dockerConfig.includeProd && (
                      <li>✅ Production docker-compose configuration</li>
                    )}
                  </>
                )}
                {cicdConfig.enabled && (
                  <>
                    {cicdConfig.githubActions && (
                      <li>✅ GitHub Actions workflow</li>
                    )}
                    {cicdConfig.gitlabCI && <li>✅ GitLab CI pipeline</li>}
                    {cicdConfig.includeE2E && (
                      <li>✅ Complete E2E test suite</li>
                    )}
                    {cicdConfig.includeSecurity && (
                      <li>✅ Automated security scanning</li>
                    )}
                  </>
                )}
                <li>✅ Environment variable validation with Zod</li>
                <li>✅ Generator metadata for tracking</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </WizardLayout>
  );
}
