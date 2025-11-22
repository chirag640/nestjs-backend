import { generateProject } from "../lib/generator";
import * as fs from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const configPath = join(__dirname, "../../test-config-validation.json");
const configContent = fs.readFileSync(configPath, "utf-8");
const config = JSON.parse(configContent);

console.log("Testing project generation...\n");

try {
  const files = await generateProject(config);
  console.log(`✅ Generated ${files.length} files successfully!`);
  console.log("\nFirst 10 files:");
  files.slice(0, 10).forEach((file, idx) => {
    console.log(`${idx + 1}. ${file.path} (${file.content.length} bytes)`);
  });
} catch (error: any) {
  console.error("❌ Generation FAILED:");
  console.error(error.message);
  console.error("\nStack trace:");
  console.error(error.stack);
}
