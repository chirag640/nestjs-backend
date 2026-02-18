import { useEffect, useState } from "react";
import { useDebouncedValue } from "./use-debounced-value";
import type { WizardConfig } from "../../../shared/schema";

export interface ValidationError {
  path: string;
  issue?: string;
  message?: string;
  suggestion?: string;
  code?: string;
  severity?: string;
}

export interface ValidationWarning {
  path: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Hook for debounced configuration validation
 * Reduces API calls by only validating after user stops making changes
 *
 * Expected improvement: 20 requests/min → 1 request/min (20x reduction)
 *
 * @param config - The wizard configuration to validate
 * @param debounceDelay - Delay in milliseconds (default: 1000ms)
 * @returns Validation state and result
 *
 * @example
 * ```tsx
 * const { isValidating, result } = useValidation(config, 1000);
 *
 * if (result?.valid) {
 *   // Config is valid
 * } else {
 *   // Show errors: result.errors
 * }
 * ```
 */
export function useValidation(
  config: WizardConfig | null,
  debounceDelay: number = 1000,
) {
  const [isValidating, setIsValidating] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [lastValidatedConfig, setLastValidatedConfig] = useState<string>("");

  // Debounce config changes to avoid excessive API calls
  const debouncedConfig = useDebouncedValue(config, debounceDelay);

  useEffect(() => {
    // Skip validation if config is null or hasn't changed
    if (!debouncedConfig) {
      setResult(null);
      return;
    }

    // Skip validation if config hasn't actually changed
    const configString = JSON.stringify(debouncedConfig);
    if (configString === lastValidatedConfig) {
      return;
    }

    // Perform validation
    const validateConfig = async () => {
      setIsValidating(true);

      try {
        const response = await fetch("/api/validate-config", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: configString,
        });

        if (!response.ok) {
          throw new Error("Validation request failed");
        }

        const data: ValidationResult = await response.json();
        setResult(data);
        setLastValidatedConfig(configString);
      } catch (error) {
        console.error("Validation error:", error);
        // On error, assume invalid but don't block user
        setResult({
          valid: false,
          errors: [
            {
              path: "configuration",
              issue: "Could not validate configuration",
              suggestion: "Check your internet connection and try again",
            },
          ],
          warnings: [],
        });
      } finally {
        setIsValidating(false);
      }
    };

    validateConfig();
  }, [debouncedConfig, lastValidatedConfig]);

  return {
    isValidating,
    result,
    isValid: result?.valid ?? false,
    errors: result?.errors ?? [],
    warnings: result?.warnings ?? [],
  };
}
