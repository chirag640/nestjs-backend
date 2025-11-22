import { wizardConfigSchema } from "../../shared/schema";
import * as fs from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const configPath = join(__dirname, "../../test-config-validation.json");
const configContent = fs.readFileSync(configPath, "utf-8");
const config = JSON.parse(configContent);

console.log("Testing config validation...\n");

const result = wizardConfigSchema.safeParse(config);

if (result.success) {
  console.log("✅ Config is VALID!");
  console.log("\nParsed config:");
  console.log(JSON.stringify(result.data, null, 2));
} else {
  console.log("❌ Config has VALIDATION ERRORS:\n");
  result.error.errors.forEach((err, idx) => {
    console.log(`${idx + 1}. Path: ${err.path.join(".")}`);
    console.log(`   Message: ${err.message}`);
    console.log(`   Code: ${err.code}`);
    if (err.code === "invalid_type") {
      console.log(
        `   Expected: ${(err as any).expected}, Received: ${(err as any).received}`
      );
    }
    console.log();
  });
}
