import { useWizardStore } from "@/lib/store";
import { Code2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";

interface WizardLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

const STEP_TITLES = [
  "Project Setup",
  "Database Configuration",
  "Model Definition",
  "Authentication & Authorization",
  "Feature Selection",
  "Review & Generate",
  "Code Preview",
  "Docker & CI/CD",
];

export function WizardLayout({
  children,
  title,
  description,
}: WizardLayoutProps) {
  const { currentStep, previousStep, nextStep, isStepValid } = useWizardStore();
  const canProceed = isStepValid(currentStep);
  const progress = (currentStep / 8) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Code2
                  className="w-5 h-5 text-primary"
                  data-testid="icon-wizard-logo"
                />
              </div>
              <div>
                <h1
                  className="text-lg font-semibold text-foreground"
                  data-testid="text-wizard-title"
                >
                  Project Wizard
                </h1>
                <p
                  className="text-xs text-muted-foreground"
                  data-testid="text-step-counter"
                >
                  Step {currentStep === 3.5 ? "3 (Relationships)" : currentStep}{" "}
                  of 8
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (
                  confirm(
                    "Are you sure you want to clear all data and start over?"
                  )
                ) {
                  useWizardStore.getState().resetWizard();
                }
              }}
              className="text-xs gap-2"
              data-testid="button-clear-session"
            >
              <RotateCcw className="w-3 h-3" />
              Clear Session
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress
              value={progress}
              className="h-1"
              data-testid="progress-wizard"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              {STEP_TITLES.map((stepTitle, index) => (
                <span
                  key={index}
                  className={`hidden md:block ${index + 1 === currentStep ? "text-primary font-medium" : ""} ${index + 1 < currentStep ? "text-foreground/60" : ""}`}
                  data-testid={`text-step-label-${index + 1}`}
                >
                  {index + 1}
                </span>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb Dots */}
          <div
            className="flex items-center justify-center gap-2 mb-6"
            data-testid="breadcrumb-steps"
          >
            {STEP_TITLES.map((_, index) => (
              <div key={index} className="flex items-center">
                <div
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    index + 1 === currentStep
                      ? "bg-primary scale-125"
                      : index + 1 < currentStep
                        ? "bg-primary/50"
                        : "bg-border"
                  }`}
                  data-testid={`breadcrumb-dot-${index + 1}`}
                />
                {index < STEP_TITLES.length - 1 && (
                  <div
                    className={`w-8 h-0.5 mx-1 ${
                      index + 1 < currentStep ? "bg-primary/30" : "bg-border"
                    }`}
                    data-testid={`breadcrumb-connector-${index + 1}`}
                  />
                )}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Step Title */}
              <div className="space-y-2">
                <h2
                  className="text-2xl font-semibold text-foreground"
                  data-testid="text-step-title"
                >
                  {title}
                </h2>
                {description && (
                  <p
                    className="text-sm text-muted-foreground"
                    data-testid="text-step-description"
                  >
                    {description}
                  </p>
                )}
              </div>

              {/* Step Content */}
              <div className="bg-card border border-card-border rounded-lg p-6 md:p-8 shadow-xl">
                {children}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Footer Navigation */}
      <footer className="border-t border-white/10 bg-card/50 backdrop-blur-sm sticky bottom-0">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="outline"
              onClick={previousStep}
              disabled={currentStep === 1}
              data-testid="button-previous"
              className="w-full md:w-auto"
            >
              Previous
            </Button>

            <div
              className="hidden md:block text-xs text-muted-foreground"
              data-testid="text-current-step-name"
            >
              {STEP_TITLES[currentStep - 1]}
            </div>

            <Button
              onClick={nextStep}
              disabled={!canProceed || currentStep === 8}
              data-testid="button-next"
              className="w-full md:w-auto"
            >
              {currentStep === 6
                ? "Continue to Preview"
                : currentStep === 7
                  ? "Configure Deployment"
                  : currentStep === 8
                    ? "Complete"
                    : "Next"}
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
