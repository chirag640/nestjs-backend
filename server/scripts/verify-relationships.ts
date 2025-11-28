
import { buildIR } from "../lib/irBuilder";
import { WizardConfig } from "../../shared/schema";

async function verifyRelationships() {
  console.log("Verifying relationship field injection...");

  const mockConfig: WizardConfig = {
    projectSetup: {
      projectName: "test-project",
      description: "Test",
      author: "Test",
      license: "MIT",
      nodeVersion: "20",
      packageManager: "npm",
    },
    databaseConfig: {
      databaseType: "MongoDB",
      provider: "Atlas",
      connectionString: "mongodb://localhost:27017/test",
      autoMigration: "push",
    },
    modelDefinition: {
      models: [
        {
          name: "User",
          fields: [{ name: "email", type: "string", required: true, unique: true, indexed: true }],
          timestamps: true,
        },
        {
          name: "Todo",
          fields: [{ name: "title", type: "string", required: true, unique: false, indexed: false }],
          timestamps: true,
        },
        {
          name: "Profile",
          fields: [{ name: "bio", type: "string", required: false, unique: false, indexed: false }],
          timestamps: true,
        },
        {
          name: "Tag",
          fields: [{ name: "name", type: "string", required: true, unique: true, indexed: true }],
          timestamps: true,
        },
      ],
      relationships: [
        {
          type: "one-to-many",
          sourceModel: "User",
          targetModel: "Todo",
          fieldName: "todos",
          foreignKeyName: "ownerId", // Custom FK name
          inverseFieldName: "tasks", // Custom inverse name
        },
        {
          type: "one-to-one",
          sourceModel: "User",
          targetModel: "Profile",
          fieldName: "profileId",
        },
        {
          type: "many-to-many",
          sourceModel: "Todo",
          targetModel: "Tag",
          fieldName: "tags",
        },
      ],
    },
    authConfig: { enabled: false, method: "jwt", roles: ["Admin"] },
    featureSelection: {
      cors: true,
      helmet: true,
      compression: true,
      validation: true,
      logging: true,
      caching: false,
      swagger: false,
      health: true,
      rateLimit: false,
      versioning: false,
      queues: false,
      s3Upload: false,
      encryptionStrategy: "disabled",
      fieldLevelAccessControl: false,
      gitHooks: true,
      sonarQube: false,
    },
  };

  try {
    const ir = buildIR(mockConfig);
    
    // 1. Check One-to-Many (Todo -> User)
    const todoModel = ir.models.find((m) => m.name === "Todo");
    if (!todoModel) throw new Error("Todo model not found");
    const ownerIdField = todoModel.fields.find((f) => f.name === "ownerId");
    
    if (ownerIdField && ownerIdField.type === "objectId") {
      console.log("✅ SUCCESS: One-to-Many FK (ownerId) injected correctly");
    } else {
      console.error("❌ FAILURE: One-to-Many FK missing or invalid");
    }

    // 2. Check One-to-One (User -> Profile)
    const userModel = ir.models.find((m) => m.name === "User");
    if (!userModel) throw new Error("User model not found");
    const profileIdField = userModel.fields.find((f) => f.name === "profileId");

    if (profileIdField && profileIdField.type === "objectId" && profileIdField.unique) {
      console.log("✅ SUCCESS: One-to-One FK (profileId) injected correctly with unique constraint");
    } else {
      console.error("❌ FAILURE: One-to-One FK missing or invalid");
    }

    // 3. Check Many-to-Many (Todo -> Tag)
    const tagsField = todoModel.fields.find((f) => f.name === "tags");
    
    if (tagsField && tagsField.type === "objectId[]" && tagsField.tsType === "string[]") {
      console.log("✅ SUCCESS: Many-to-Many field (tags) injected correctly as array");
    } else {
      console.error("❌ FAILURE: Many-to-Many field missing or invalid");
      console.log("Found:", tagsField);
    }

  } catch (error) {
    console.error("❌ ERROR:", error);
    process.exit(1);
  }
}

verifyRelationships();
