import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WizardConfig } from "@shared/schema";
import { defaultWizardConfig } from "@shared/schema";

interface WizardStore {
  currentStep: number;
  config: Partial<WizardConfig>;
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: number) => void;
  updateProjectSetup: (data: Partial<WizardConfig["projectSetup"]>) => void;
  updateDatabaseConfig: (data: Partial<WizardConfig["databaseConfig"]>) => void;
  updateModelDefinition: (
    data: Partial<WizardConfig["modelDefinition"]>
  ) => void;
  updateAuthConfig: (data: Partial<WizardConfig["authConfig"]>) => void;
  updateOAuthConfig: (data: Partial<WizardConfig["oauthConfig"]>) => void;
  updateFeatureSelection: (
    data: Partial<WizardConfig["featureSelection"]>
  ) => void;
  updateDockerConfig: (data: Partial<WizardConfig["dockerConfig"]>) => void;
  updateCICDConfig: (data: Partial<WizardConfig["cicdConfig"]>) => void;
  resetWizard: () => void;
  isStepValid: (step: number) => boolean;
}

const TOTAL_STEPS = 8;

export const useWizardStore = create<WizardStore>()(
  persist(
    (set, get) => ({
      currentStep: 1,
      config: defaultWizardConfig,

      setCurrentStep: (step: number) => {
        if (step >= 1 && step <= TOTAL_STEPS) {
          set({ currentStep: step });
        }
      },

      nextStep: () => {
        const { currentStep } = get();
        if (currentStep === 4) {
          // Go to relationship config (step 4.5) after model definition
          set({ currentStep: 4.5 });
        } else if (currentStep === 4.5) {
          // Go to feature selection (step 5) after relationship config
          set({ currentStep: 5 });
        } else if (currentStep < TOTAL_STEPS) {
          set({ currentStep: currentStep + 1 });
        }
      },

      previousStep: () => {
        const { currentStep } = get();
        if (currentStep === 4.5) {
          // Go back to model definition (step 4) from relationship config
          set({ currentStep: 4 });
        } else if (currentStep === 5) {
          // Go back to relationship config (step 4.5) from feature selection
          set({ currentStep: 4.5 });
        } else if (currentStep > 1) {
          set({ currentStep: currentStep - 1 });
        }
      },

      goToStep: (step: number) => {
        if (step >= 1 && step <= TOTAL_STEPS) {
          set({ currentStep: step });
        }
      },

      updateProjectSetup: (data) => {
        set((state) => ({
          config: {
            ...state.config,
            projectSetup: { ...state.config.projectSetup, ...data } as any,
          },
        }));
      },

      updateDatabaseConfig: (data) => {
        set((state) => ({
          config: {
            ...state.config,
            databaseConfig: { ...state.config.databaseConfig, ...data } as any,
          },
        }));
      },

      updateModelDefinition: (data) => {
        set((state) => ({
          config: {
            ...state.config,
            modelDefinition: {
              ...state.config.modelDefinition,
              ...data,
            } as any,
          },
        }));
      },

      updateAuthConfig: (data) => {
        set((state) => ({
          config: {
            ...state.config,
            authConfig: { ...state.config.authConfig, ...data } as any,
          },
        }));
      },

      updateOAuthConfig: (data) => {
        set((state) => ({
          config: {
            ...state.config,
            oauthConfig: { ...state.config.oauthConfig, ...data } as any,
          },
        }));
      },

      updateFeatureSelection: (data) => {
        set((state) => ({
          config: {
            ...state.config,
            featureSelection: {
              ...state.config.featureSelection,
              ...data,
            } as any,
          },
        }));
      },

      updateDockerConfig: (data) => {
        set((state) => ({
          config: {
            ...state.config,
            dockerConfig: { ...state.config.dockerConfig, ...data } as any,
          },
        }));
      },

      updateCICDConfig: (data) => {
        set((state) => ({
          config: {
            ...state.config,
            cicdConfig: { ...state.config.cicdConfig, ...data } as any,
          },
        }));
      },

      resetWizard: () => {
        set({ currentStep: 1, config: defaultWizardConfig });
      },

      isStepValid: (step: number): boolean => {
        const { config } = get();

        switch (step) {
          case 1: {
            const ps = config.projectSetup;
            return !!(
              ps?.projectName &&
              ps.description &&
              ps.author &&
              /^[a-z0-9-]+$/.test(ps.projectName)
            );
          }
          case 2: {
            const db = config.databaseConfig;
            return !!db?.connectionString;
          }
          case 3: {
            // Auth step - always valid (auth is optional)
            const auth = config.authConfig;
            if (!auth) return true;
            // If auth is disabled, step is valid
            if (!auth.enabled) return true;
            // If auth is enabled, validate JWT config and roles
            return !!(
              auth.jwt?.accessTTL &&
              auth.jwt?.refreshTTL &&
              auth.roles &&
              auth.roles.length > 0
            );
          }
          case 4: {
            // Model definition step
            const models = config.modelDefinition?.models || [];
            return models.length > 0;
          }
          case 4.5: {
            // Relationship config is optional, always valid
            return true;
          }
          case 5: {
            return true;
          }
          case 6: {
            return true;
          }
          case 7: {
            return true; // Preview step, always valid
          }
          case 8: {
            return true; // Docker/CI-CD is optional, always valid
          }
          default:
            return false;
        }
      },
    }),
    {
      name: "wizard-storage",
      partialize: (state) => ({
        config: state.config,
        currentStep: state.currentStep,
      }),
    }
  )
);
