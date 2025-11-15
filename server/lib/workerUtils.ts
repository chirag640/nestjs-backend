import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { Worker, type WorkerOptions } from "worker_threads";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get the correct path for a worker file in both dev and production environments
 * In dev: workers are .ts files run with tsx
 * In production: workers are compiled to .js files
 */
export function getWorkerPath(workerName: string): string {
  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    // In development, workers are TypeScript files
    const tsPath = path.join(__dirname, "..", "workers", `${workerName}.ts`);
    return tsPath;
  } else {
    // In production, workers are compiled JavaScript files
    const jsPath = path.join(__dirname, "workers", `${workerName}.js`);

    // Verify the file exists
    if (!fs.existsSync(jsPath)) {
      throw new Error(
        `Worker not found: ${jsPath}. Did you run 'npm run build'?`
      );
    }

    return jsPath;
  }
}

/**
 * Create a Worker with TypeScript support in development
 */
export function createWorker(
  workerName: string,
  options?: WorkerOptions
): Worker {
  const isDev = process.env.NODE_ENV === "development";
  const workerPath = getWorkerPath(workerName);

  if (isDev) {
    // In development, use tsx loader for TypeScript files
    const tsxPath = path.join(
      process.cwd(),
      "node_modules",
      "tsx",
      "dist",
      "loader.mjs"
    );

    return new Worker(workerPath, {
      ...options,
      execArgv: ["--import", tsxPath],
    });
  } else {
    // In production, use compiled JavaScript files
    return new Worker(workerPath, options);
  }
}
