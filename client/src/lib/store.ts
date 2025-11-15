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
  updateFeatureSelection: (
    data: Partial<WizardConfig["featureSelection"]>
  ) => void;
  resetWizard: () => void;
  isStepValid: (step: number) => boolean;
}

const TOTAL_STEPS = 7;

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
        if (currentStep < TOTAL_STEPS) {
          set({ currentStep: currentStep + 1 });
        }
      },

      previousStep: () => {
        const { currentStep } = get();
        if (currentStep > 1) {
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
            const models = config.modelDefinition?.models || [];
            return models.length > 0;
          }
          case 4: {
            const auth = config.authConfig;
            if (!auth) return false;
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
          case 5: {
            return true;
          }
          case 6: {
            return true;
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
