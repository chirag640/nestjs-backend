import { useWizardStore } from "@/lib/store";
import { WizardLayout } from "@/components/wizard/WizardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Edit2, Copy, Download, Loader2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { projectSetupSchema, databaseConfigSchema } from "@shared/schema";

export default function Step6Review() {
  const { config, goToStep } = useWizardStore();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const configJson = JSON.stringify(config, null, 2);

  // Validate Steps 1-2 on mount and config changes
  useEffect(() => {
    const errors: string[] = [];

    const step1Validation = projectSetupSchema.safeParse(config.projectSetup);
    if (!step1Validation.success) {
      errors.push("Step 1 (Project Setup) is incomplete or invalid");
    }

    const step2Validation = databaseConfigSchema.safeParse(
      config.databaseConfig
    );
    if (!step2Validation.success) {
      errors.push("Step 2 (Database Config) is incomplete or invalid");
    }

    setValidationErrors(errors);
  }, [config]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(configJson);
    toast({
      title: "Copied!",
      description: "Configuration copied to clipboard",
    });
  };

  const downloadConfig = () => {
    const blob = new Blob([configJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${config.projectSetup?.projectName || "project"}-config.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded!",
      description: "Configuration file downloaded",
    });
  };

  const generateProject = async () => {
    setIsGenerating(true);
    setGenerationProgress(10);

    try {
      // Validate required steps
      if (!config.projectSetup || !config.databaseConfig) {
        throw new Error("Please complete Steps 1 and 2 before generating");
      }

      setGenerationProgress(30);

      // Call API to generate project
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      });

      setGenerationProgress(60);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Generation failed");
      }

      setGenerationProgress(80);

      // Get ZIP file as blob
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      // Trigger download
      const a = document.createElement("a");
      a.href = url;
      a.download = `${config.projectSetup.projectName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setGenerationProgress(100);
      setIsGenerating(false);
      setIsComplete(true);

      toast({
        title: "Generation Complete!",
        description: `${config.projectSetup.projectName}.zip has been downloaded`,
      });
    } catch (error) {
      setIsGenerating(false);
      setGenerationProgress(0);

      toast({
        title: "Generation Failed",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const sections = [
    { id: 1, title: "Project Setup", data: config.projectSetup },
    { id: 2, title: "Database Configuration", data: config.databaseConfig },
    { id: 3, title: "Model Definition", data: config.modelDefinition },
    { id: 4, title: "Authentication", data: config.authConfig },
    { id: 5, title: "Features", data: config.featureSelection },
  ];

  return (
    <WizardLayout
      title="Review & Generate"
      description="Review your configuration and generate your project"
    >
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Configuration Sections */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-sm font-medium uppercase tracking-wide opacity-60">
            Configuration
          </h3>

          {sections.map((section) => (
            <Card
              key={section.id}
              className="p-4 hover-elevate cursor-pointer"
              onClick={() => goToStep(section.id)}
              data-testid={`section-card-${section.id}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold mb-1">
                    {section.title}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {section.id === 5
                      ? `${(section.data as any)?.features?.length || 0} features selected`
                      : section.id === 3
                        ? `${(section.data as any)?.models?.length || 0} models defined`
                        : section.id === 4
                          ? `${(section.data as any)?.roles?.length || 0} roles configured`
                          : "Configured"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  data-testid={`button-edit-${section.id}`}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Right: Code Preview */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium uppercase tracking-wide opacity-60">
              Configuration JSON
            </h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                data-testid="button-copy-config"
              >
                <Copy className="w-3.5 h-3.5 mr-1.5" />
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadConfig}
                data-testid="button-download-config"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Download
              </Button>
            </div>
          </div>

          <div className="border border-white/10 rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
            <SyntaxHighlighter
              language="json"
              style={vscDarkPlus}
              customStyle={{
                margin: 0,
                fontSize: "13px",
                background: "hsl(var(--card))",
              }}
              showLineNumbers
            >
              {configJson}
            </SyntaxHighlighter>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Configuration Incomplete</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  {validationErrors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
                <p className="mt-2 text-sm">
                  Please complete the required steps before generating your
                  project.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Generation Section */}
          <div className="pt-4 space-y-4">
            {!isGenerating && !isComplete && (
              <Button
                className="w-full"
                size="lg"
                onClick={generateProject}
                disabled={validationErrors.length > 0}
                data-testid="button-generate"
              >
                Generate & Download Project
              </Button>
            )}

            {isGenerating && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Generating project...
                  </span>
                  <span className="font-medium">{generationProgress}%</span>
                </div>
                <Progress value={generationProgress} className="h-2" />
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Please wait while we generate your project</span>
                </div>
              </div>
            )}

            {isComplete && (
              <Card className="p-6 bg-primary/5 border-primary/20">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                    <Download className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-2">
                      Project Ready!
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Your project configuration has been generated successfully
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={downloadConfig}
                    data-testid="button-download-final"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Configuration
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </WizardLayout>
  );
}
