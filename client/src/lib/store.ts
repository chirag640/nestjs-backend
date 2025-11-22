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
  syncUserModel: () => void;
  updateOAuthConfig: (data: Partial<WizardConfig["oauthConfig"]>) => void;
  updateFeatureSelection: (
    data: Partial<WizardConfig["featureSelection"]>
  ) => void;
  updateDockerConfig: (data: Partial<WizardConfig["dockerConfig"]>) => void;
  updateCICDConfig: (data: Partial<WizardConfig["cicdConfig"]>) => void;
  // Full setters for JSON import
  setProjectSetup: (data: WizardConfig["projectSetup"]) => void;
  setDatabaseConfig: (data: WizardConfig["databaseConfig"]) => void;
  setModelDefinition: (data: WizardConfig["modelDefinition"]) => void;
  setAuthConfig: (data: WizardConfig["authConfig"]) => void;
  setOAuthConfig: (data: WizardConfig["oauthConfig"]) => void;
  setFeatureSelection: (data: WizardConfig["featureSelection"]) => void;
  setDockerConfig: (data: WizardConfig["dockerConfig"]) => void;
  setCICDConfig: (data: WizardConfig["cicdConfig"]) => void;
  resetWizard: () => void;
  isStepValid: (step: number) => boolean;
}

const TOTAL_STEPS = 8;

export const useWizardStore = create<WizardStore>()(
  persist(
    (set, get) => ({
      currentStep: 0, // Start at Step 0 (Manual Config Import)
      config: defaultWizardConfig,

      setCurrentStep: (step: number) => {
        if (step >= 0 && step <= TOTAL_STEPS) {
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
        } else if (currentStep > 0) {
          set({ currentStep: currentStep - 1 });
        }
      },

      goToStep: (step: number) => {
        if (step >= 0 && step <= TOTAL_STEPS) {
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
        // Auto-sync User model when auth is enabled/disabled
        get().syncUserModel();
      },

      syncUserModel: () => {
        const { config } = get();
        const authEnabled = config.authConfig?.enabled ?? false;
        const models = config.modelDefinition?.models || [];
        const userModelExists = models.some((m) => m.name === "User");

        if (authEnabled && !userModelExists) {
          // Create User model automatically
          const userModel: any = {
            id: `user-model-${Date.now()}`,
            name: "User",
            fields: [
              {
                id: `field-${Date.now()}-1`,
                name: "email",
                type: "string",
                required: true,
                unique: true,
                indexed: true,
              },
              {
                id: `field-${Date.now()}-2`,
                name: "password",
                type: "string",
                required: true,
                unique: false,
                indexed: false,
              },
              {
                id: `field-${Date.now()}-3`,
                name: "role",
                type: "string",
                required: true,
                unique: false,
                indexed: true,
              },
            ],
            timestamps: true,
          };

          set((state) => ({
            config: {
              ...state.config,
              modelDefinition: {
                ...state.config.modelDefinition,
                models: [userModel, ...models],
              } as any,
            },
          }));
        } else if (!authEnabled && userModelExists) {
          // Remove User model if auth is disabled
          const filteredModels = models.filter((m) => m.name !== "User");
          // Also remove relationships involving User model
          const relationships = config.modelDefinition?.relationships || [];
          const filteredRelationships = relationships.filter(
            (r) => r.sourceModel !== "User" && r.targetModel !== "User"
          );

          set((state) => ({
            config: {
              ...state.config,
              modelDefinition: {
                models: filteredModels,
                relationships: filteredRelationships,
              } as any,
            },
          }));
        }
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

      // Full setters for JSON import
      setProjectSetup: (data) => {
        set((state) => ({
          config: { ...state.config, projectSetup: data },
        }));
      },

      setDatabaseConfig: (data) => {
        set((state) => ({
          config: { ...state.config, databaseConfig: data },
        }));
      },

      setModelDefinition: (data) => {
        set((state) => ({
          config: { ...state.config, modelDefinition: data },
        }));
      },

      setAuthConfig: (data) => {
        set((state) => ({
          config: { ...state.config, authConfig: data },
        }));
      },

      setOAuthConfig: (data) => {
        set((state) => ({
          config: { ...state.config, oauthConfig: data },
        }));
      },

      setFeatureSelection: (data) => {
        set((state) => ({
          config: { ...state.config, featureSelection: data },
        }));
      },

      setDockerConfig: (data) => {
        set((state) => ({
          config: { ...state.config, dockerConfig: data },
        }));
      },

      setCICDConfig: (data) => {
        set((state) => ({
          config: { ...state.config, cicdConfig: data },
        }));
      },

      resetWizard: () => {
        set({ currentStep: 0, config: defaultWizardConfig });
      },

      isStepValid: (step: number): boolean => {
        const { config } = get();

        switch (step) {
          case 0: {
            // Manual config import step - always valid (optional step)
            return true;
          }
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
