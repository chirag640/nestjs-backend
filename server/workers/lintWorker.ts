import { parentPort } from "worker_threads";
import { ESLint } from "eslint";

interface LintRequest {
  code: string;
  filePath: string;
  fix?: boolean;
}

interface LintResult {
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  ruleId: string | null;
  message: string;
  severity: 1 | 2; // 1 = warning, 2 = error
  fixable?: boolean;
}

/**
 * Worker thread for ESLint linting
 * Runs in isolation with limited file system access
 */
if (!parentPort) {
  throw new Error("This file must be run as a Worker");
}

parentPort.on("message", async (request: LintRequest) => {
  try {
    const results = await lintCode(request.code, request.filePath, request.fix);
    parentPort!.postMessage({ success: true, results });
  } catch (error: any) {
    parentPort!.postMessage({
      success: false,
      error: error.message || "Linting failed",
    });
  }
});

async function lintCode(
  code: string,
  filePath: string,
  fix: boolean = false
): Promise<{ diagnostics: LintResult[]; fixedCode?: string }> {
  // ESLint configuration for TypeScript/NestJS projects
  const eslint = new ESLint({
    fix,
    useEslintrc: false,
    baseConfig: {
      env: {
        node: true,
        es2021: true,
      },
      extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: "module",
        project: null, // Don't require tsconfig.json
      },
      plugins: ["@typescript-eslint"],
      rules: {
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/no-unused-vars": [
          "warn",
          { argsIgnorePattern: "^_" },
        ],
        "no-console": "off",
        "prefer-const": "warn",
        "no-var": "error",
      },
    },
  });

  const results = await eslint.lintText(code, { filePath });

  if (results.length === 0) {
    return { diagnostics: [] };
  }

  const result = results[0];
  const diagnostics: LintResult[] = result.messages.map((msg: any) => ({
    line: msg.line,
    column: msg.column,
    endLine: msg.endLine,
    endColumn: msg.endColumn,
    ruleId: msg.ruleId,
    message: msg.message,
    severity: msg.severity as 1 | 2,
    fixable: msg.fix !== undefined,
  }));

  // Return fixed code if requested
  const response: { diagnostics: LintResult[]; fixedCode?: string } = {
    diagnostics,
  };

  if (fix && result.output) {
    response.fixedCode = result.output;
  }

  return response;
}
