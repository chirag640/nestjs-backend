import { generateProject } from "../lib/generator";

// Test scenarios
const scenarios = [
  {
    name: "Basic MongoDB with Auth",
    config: {
      projectSetup: {
        projectName: "test-mongodb-auth",
        description: "MongoDB with JWT auth",
        author: "TestUser",
        license: "MIT",
        nodeVersion: "20",
        packageManager: "npm",
      },
      databaseConfig: {
        databaseType: "MongoDB",
        provider: "MongoDB Atlas",
        connectionString: "mongodb://localhost:27017/testdb",
        autoMigration: "none",
      },
      modelDefinition: {
        models: [
          {
            id: "m1",
            name: "User",
            fields: [
              {
                id: "f1",
                name: "email",
                type: "string",
                required: true,
                unique: true,
                indexed: true,
              },
              {
                id: "f2",
                name: "name",
                type: "string",
                required: true,
              },
            ],
            timestamps: true,
          },
        ],
        relationships: [],
      },
      authConfig: {
        enabled: true,
        method: "jwt",
        jwt: {
          accessTTL: "15m",
          refreshTTL: "7d",
          rotation: true,
          blacklist: true,
        },
        roles: ["Admin", "User"],
      },
      oauthConfig: { enabled: false, providers: [] },
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
      },
      dockerConfig: {
        enabled: false,
        includeCompose: false,
        includeProd: false,
        healthCheck: false,
        nonRootUser: false,
        multiStage: false,
      },
      cicdConfig: {
        enabled: false,
        githubActions: false,
        gitlabCI: false,
        includeTests: false,
        includeE2E: false,
        includeSecurity: false,
        autoDockerBuild: false,
      },
    },
  },
  {
    name: "PostgreSQL with OAuth",
    config: {
      projectSetup: {
        projectName: "test-postgres-oauth",
        description: "PostgreSQL with OAuth",
        author: "TestUser",
        license: "MIT",
        nodeVersion: "20",
        packageManager: "npm",
      },
      databaseConfig: {
        databaseType: "PostgreSQL",
        provider: "Neon",
        connectionString: "postgres://user:pass@localhost:5432/test",
        autoMigration: "push",
      },
      modelDefinition: {
        models: [],
        relationships: [],
      },
      authConfig: {
        enabled: true,
        method: "jwt",
        jwt: {
          accessTTL: "15m",
          refreshTTL: "7d",
          rotation: true,
          blacklist: true,
        },
        roles: ["Admin", "User"],
      },
      oauthConfig: {
        enabled: true,
        providers: [
          {
            name: "Google",
            clientId: "test-google-id",
            clientSecret: "test-google-secret",
            callbackURL: "/auth/google/callback",
            scopes: ["email", "profile"],
          },
        ],
      },
      featureSelection: {
        cors: true,
        helmet: true,
        compression: true,
        validation: true,
        logging: false,
        caching: false,
        swagger: false,
        health: false,
        rateLimit: false,
        versioning: false,
      },
      dockerConfig: {
        enabled: false,
        includeCompose: false,
        includeProd: false,
        healthCheck: false,
        nonRootUser: false,
        multiStage: false,
      },
      cicdConfig: {
        enabled: false,
        githubActions: false,
        gitlabCI: false,
        includeTests: false,
        includeE2E: false,
        includeSecurity: false,
        autoDockerBuild: false,
      },
    },
  },
  {
    name: "MongoDB with Complex Relationships",
    config: {
      projectSetup: {
        projectName: "test-relationships",
        description: "MongoDB with all relationship types",
        author: "TestUser",
        license: "MIT",
        nodeVersion: "20",
        packageManager: "npm",
      },
      databaseConfig: {
        databaseType: "MongoDB",
        provider: "MongoDB Atlas",
        connectionString: "mongodb://localhost:27017/testdb",
        autoMigration: "none",
      },
      modelDefinition: {
        models: [
          {
            id: "m1",
            name: "User",
            fields: [
              {
                id: "f1",
                name: "email",
                type: "string",
                required: true,
                unique: true,
              },
              {
                id: "f2",
                name: "name",
                type: "string",
                required: true,
              },
            ],
            timestamps: true,
          },
          {
            id: "m2",
            name: "Post",
            fields: [
              {
                id: "f3",
                name: "title",
                type: "string",
                required: true,
              },
              {
                id: "f4",
                name: "content",
                type: "string",
                required: true,
              },
            ],
            timestamps: true,
          },
          {
            id: "m3",
            name: "Tag",
            fields: [
              {
                id: "f5",
                name: "name",
                type: "string",
                required: true,
                unique: true,
              },
            ],
            timestamps: true,
          },
          {
            id: "m4",
            name: "Profile",
            fields: [
              {
                id: "f6",
                name: "bio",
                type: "string",
                required: false,
              },
              {
                id: "f7",
                name: "avatarUrl",
                type: "string",
                required: false,
              },
            ],
            timestamps: true,
          },
        ],
        relationships: [
          {
            id: "r1",
            type: "one-to-many",
            sourceModel: "User",
            targetModel: "Post",
            fieldName: "posts",
          },
          {
            id: "r2",
            type: "many-to-many",
            sourceModel: "Post",
            targetModel: "Tag",
            fieldName: "tags",
            through: "PostTag",
          },
          {
            id: "r3",
            type: "one-to-one",
            sourceModel: "User",
            targetModel: "Profile",
            fieldName: "profile",
          },
          {
            id: "r4",
            type: "many-to-many",
            sourceModel: "User",
            targetModel: "Tag",
            fieldName: "followedTags",
            through: "UserFollowTag",
            attributes: [
              {
                id: "a1",
                name: "followedAt",
                type: "date",
                required: true,
              },
              {
                id: "a2",
                name: "notificationsEnabled",
                type: "boolean",
                required: true,
              },
            ],
          },
        ],
      },
      authConfig: {
        enabled: false,
        method: "jwt",
        jwt: {
          accessTTL: "15m",
          refreshTTL: "7d",
          rotation: false,
          blacklist: false,
        },
        roles: [],
      },
      oauthConfig: { enabled: false, providers: [] },
      featureSelection: {
        cors: true,
        helmet: true,
        compression: true,
        validation: true,
        logging: false,
        caching: false,
        swagger: false,
        health: false,
        rateLimit: false,
        versioning: false,
      },
      dockerConfig: {
        enabled: false,
        includeCompose: false,
        includeProd: false,
        healthCheck: false,
        nonRootUser: false,
        multiStage: false,
      },
      cicdConfig: {
        enabled: false,
        githubActions: false,
        gitlabCI: false,
        includeTests: false,
        includeE2E: false,
        includeSecurity: false,
        autoDockerBuild: false,
      },
    },
  },
  {
    name: "Full Stack with All Features",
    config: {
      projectSetup: {
        projectName: "test-fullstack",
        description: "Full featured application",
        author: "TestUser",
        license: "MIT",
        nodeVersion: "20",
        packageManager: "npm",
      },
      databaseConfig: {
        databaseType: "MongoDB",
        provider: "MongoDB Atlas",
        connectionString: "mongodb://localhost:27017/testdb",
        autoMigration: "none",
      },
      modelDefinition: {
        models: [
          {
            id: "m1",
            name: "Product",
            fields: [
              {
                id: "f1",
                name: "name",
                type: "string",
                required: true,
              },
              {
                id: "f2",
                name: "price",
                type: "number",
                required: true,
              },
              {
                id: "f3",
                name: "inStock",
                type: "boolean",
                required: true,
              },
            ],
            timestamps: true,
          },
        ],
        relationships: [],
      },
      authConfig: {
        enabled: true,
        method: "jwt",
        jwt: {
          accessTTL: "15m",
          refreshTTL: "7d",
          rotation: true,
          blacklist: true,
        },
        roles: ["Admin", "User", "Manager"],
      },
      oauthConfig: {
        enabled: true,
        providers: [
          {
            name: "Google",
            clientId: "test-google-id",
            clientSecret: "test-google-secret",
            callbackURL: "/auth/google/callback",
            scopes: ["email", "profile"],
          },
          {
            name: "GitHub",
            clientId: "test-github-id",
            clientSecret: "test-github-secret",
            callbackURL: "/auth/github/callback",
            scopes: ["user:email"],
          },
        ],
      },
      featureSelection: {
        cors: true,
        helmet: true,
        compression: true,
        validation: true,
        logging: true,
        caching: true,
        swagger: true,
        health: true,
        rateLimit: true,
        versioning: true,
      },
      dockerConfig: {
        enabled: true,
        includeCompose: true,
        includeProd: true,
        healthCheck: true,
        nonRootUser: true,
        multiStage: true,
      },
      cicdConfig: {
        enabled: true,
        githubActions: true,
        gitlabCI: true,
        includeTests: true,
        includeE2E: true,
        includeSecurity: true,
        autoDockerBuild: true,
      },
    },
  },
  {
    name: "PostgreSQL Basic No Auth",
    config: {
      projectSetup: {
        projectName: "test-postgres-basic",
        description: "Basic PostgreSQL project",
        author: "TestUser",
        license: "MIT",
        nodeVersion: "20",
        packageManager: "pnpm",
      },
      databaseConfig: {
        databaseType: "PostgreSQL",
        provider: "Supabase",
        connectionString: "postgres://user:pass@localhost:5432/test",
        autoMigration: "migrate",
      },
      modelDefinition: {
        models: [],
        relationships: [],
      },
      authConfig: {
        enabled: false,
        method: "jwt",
        jwt: {
          accessTTL: "15m",
          refreshTTL: "7d",
          rotation: false,
          blacklist: false,
        },
        roles: [],
      },
      oauthConfig: { enabled: false, providers: [] },
      featureSelection: {
        cors: true,
        helmet: true,
        compression: false,
        validation: true,
        logging: false,
        caching: false,
        swagger: true,
        health: true,
        rateLimit: false,
        versioning: false,
      },
      dockerConfig: {
        enabled: true,
        includeCompose: true,
        includeProd: false,
        healthCheck: true,
        nonRootUser: false,
        multiStage: false,
      },
      cicdConfig: {
        enabled: true,
        githubActions: true,
        gitlabCI: false,
        includeTests: true,
        includeE2E: false,
        includeSecurity: false,
        autoDockerBuild: false,
      },
    },
  },
];

async function runScenario(scenario: any, index: number) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`[${index + 1}/${scenarios.length}] Testing: ${scenario.name}`);
  console.log("=".repeat(60));

  try {
    const startTime = Date.now();
    const files = await generateProject(scenario.config);
    const duration = Date.now() - startTime;

    console.log(
      `✅ SUCCESS - Generated ${files.length} files in ${duration}ms`
    );
    console.log(`\nGenerated files:`);
    files.forEach((f) => console.log(`  - ${f.path}`));

    return {
      success: true,
      scenario: scenario.name,
      fileCount: files.length,
      duration,
    };
  } catch (err: any) {
    console.error(`❌ FAILED - ${err.message}`);
    console.error(`Error stack:`, err.stack);
    return { success: false, scenario: scenario.name, error: err.message };
  }
}

async function run() {
  console.log("🚀 Starting comprehensive generation tests...");
  console.log(`Total scenarios to test: ${scenarios.length}\n`);

  const results = [];

  for (let i = 0; i < scenarios.length; i++) {
    const result = await runScenario(scenarios[i], i);
    results.push(result);
  }

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 TEST SUMMARY");
  console.log("=".repeat(60));

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(`\n✅ Successful: ${successful.length}/${results.length}`);
  successful.forEach((r: any) => {
    console.log(`  ✓ ${r.scenario} (${r.fileCount} files, ${r.duration}ms)`);
  });

  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}/${results.length}`);
    failed.forEach((r: any) => {
      console.log(`  ✗ ${r.scenario}`);
      console.log(`    Error: ${r.error}`);
    });
  }

  console.log("\n" + "=".repeat(60));
  console.log(
    successful.length === results.length
      ? "🎉 All tests passed!"
      : "⚠️  Some tests failed - review errors above"
  );
}

run();
