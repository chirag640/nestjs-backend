import { parentPort, workerData } from "worker_threads";
import ts from "typescript";

interface TypecheckRequest {
  files: Record<string, string>;
  compilerOptions?: ts.CompilerOptions;
}

interface DiagnosticResult {
  file: string | null;
  message: string;
  line: number | null;
  column: number | null;
  category: "error" | "warning" | "suggestion";
  code: number;
}

/**
 * Worker thread for TypeScript type-checking
 * Runs in isolation with no disk/network access
 */
if (!parentPort) {
  throw new Error("This file must be run as a Worker");
}

parentPort.on("message", (request: TypecheckRequest) => {
  try {
    const results = typecheckProject(request.files, request.compilerOptions);
    parentPort!.postMessage({ success: true, diagnostics: results });
  } catch (error: any) {
    parentPort!.postMessage({
      success: false,
      error: error.message || "Typecheck failed",
    });
  }
});

function typecheckProject(
  fileMap: Record<string, string>,
  customOptions?: ts.CompilerOptions
): DiagnosticResult[] {
  const defaultOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.CommonJS,
    lib: ["lib.es2020.d.ts"],
    strict: true,
    esModuleInterop: true,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: true,
    noEmit: true,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    resolveJsonModule: true,
    allowSyntheticDefaultImports: true,
    experimentalDecorators: true,
    emitDecoratorMetadata: true,
    ...customOptions,
  };

  // Create in-memory compiler host
  const compilerHost = ts.createCompilerHost(defaultOptions, true);

  // Override file reading to use in-memory files only
  compilerHost.readFile = (fileName: string) => {
    // Normalize path separators
    const normalizedPath = fileName.replace(/\\/g, "/");
    return fileMap[normalizedPath] || fileMap[fileName] || "";
  };

  compilerHost.fileExists = (fileName: string) => {
    const normalizedPath = fileName.replace(/\\/g, "/");
    return normalizedPath in fileMap || fileName in fileMap;
  };

  compilerHost.getSourceFile = (
    fileName: string,
    languageVersion: ts.ScriptTarget
  ) => {
    const normalizedPath = fileName.replace(/\\/g, "/");
    const sourceText =
      fileMap[normalizedPath] || fileMap[fileName] || undefined;
    return sourceText !== undefined
      ? ts.createSourceFile(fileName, sourceText, languageVersion, true)
      : undefined;
  };

  // Disable disk/network operations
  compilerHost.writeFile = () => {
    throw new Error("Write operations are disabled in sandbox");
  };

  // Create program with all files
  const fileNames = Object.keys(fileMap);
  const program = ts.createProgram(fileNames, defaultOptions, compilerHost);

  // Get all diagnostics
  const allDiagnostics = ts.getPreEmitDiagnostics(program);

  // Transform diagnostics to serializable format
  return allDiagnostics.map((diagnostic) => {
    const message = ts.flattenDiagnosticMessageText(
      diagnostic.messageText,
      "\n"
    );

    let file: string | null = null;
    let line: number | null = null;
    let column: number | null = null;

    if (diagnostic.file && diagnostic.start !== undefined) {
      file = diagnostic.file.fileName;
      const { line: l, character } =
        diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
      line = l + 1; // 1-indexed
      column = character + 1; // 1-indexed
    }

    let category: "error" | "warning" | "suggestion" = "error";
    if (diagnostic.category === ts.DiagnosticCategory.Warning) {
      category = "warning";
    } else if (diagnostic.category === ts.DiagnosticCategory.Suggestion) {
      category = "suggestion";
    }

    return {
      file,
      message,
      line,
      column,
      category,
      code: diagnostic.code,
    };
  });
}
