import { useWizardStore } from "@/lib/store";
import { WizardLayout } from "@/components/wizard/WizardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Edit2, Copy, Download, Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useToast } from "@/hooks/use-toast";
import { useValidation } from "@/hooks/use-validation";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Step6Review() {
  const { config, goToStep } = useWizardStore();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Use debounced validation hook (reduces API calls by 20x)
  const { isValidating, errors, warnings } = useValidation(config, 1000);

  const configJson = JSON.stringify(config, null, 2);

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

          {/* Validation Status */}
          {isValidating && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertTitle>Validating configuration...</AlertTitle>
              <AlertDescription>
                Checking your configuration for errors and warnings.
              </AlertDescription>
            </Alert>
          )}

          {/* Validation Errors */}
          {!isValidating && errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Configuration Errors</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  {errors.map((error, idx) => (
                    <li key={idx}>
                      <strong>{error.path}:</strong>{" "}
                      {error.issue ?? error.message}
                      {error.suggestion && (
                        <span className="text-xs block ml-4 mt-1">
                          💡 {error.suggestion}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-sm">
                  Please fix these errors before generating your project.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Validation Warnings */}
          {!isValidating && warnings.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Configuration Warnings</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  {warnings.map((warning, idx) => (
                    <li key={idx}>
                      <strong>{warning.path}:</strong> {warning.message}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-sm">
                  These warnings won't prevent generation but may need
                  attention.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Actions Section */}
          <div className="pt-4 space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Click "Continue" to generate your project and preview it in the
                browser before downloading.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={downloadConfig}
                data-testid="button-download-config"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Config
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={copyToClipboard}
                data-testid="button-copy-config"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Config
              </Button>
            </div>
          </div>
        </div>
      </div>
    </WizardLayout>
  );
}
