# 📝 Complete JSON Configuration Guide

## Overview

This guide provides **every single detail** needed to create a JSON configuration file that generates a complete NestJS backend project. The configuration is validated and then used to generate all necessary files, modules, and features.

> **💡 Tip**: If you encounter any errors during generation, check the [ERROR_HANDLING_GUIDE.md](./ERROR_HANDLING_GUIDE.md) for detailed troubleshooting steps and solutions.

---

## 📋 Table of Contents

1. [Root Structure](#root-structure)
2. [Project Setup](#1-project-setup)
3. [Database Configuration](#2-database-configuration)
4. [Model Definition](#3-model-definition)
5. [Authentication Configuration](#4-authentication-configuration)
6. [OAuth Configuration](#5-oauth-configuration)
7. [Feature Selection](#6-feature-selection)
8. [Docker Configuration](#7-docker-configuration)
9. [CI/CD Configuration](#8-cicd-configuration)
10. [Mobile Configuration](#9-mobile-configuration)
11. [Complete Examples](#complete-examples)

---

## Root Structure

```json
{
  "projectSetup": {
    /* Section 1 */
  },
  "databaseConfig": {
    /* Section 2 */
  },
  "modelDefinition": {
    /* Section 3 */
  },
  "authConfig": {
    /* Section 4 */
  },
  "oauthConfig": {
    /* Section 5 - Optional */
  },
  "featureSelection": {
    /* Section 6 */
  },
  "dockerConfig": {
    /* Section 7 - Optional */
  },
  "cicdConfig": {
    /* Section 8 - Optional */
  },
  "mobileConfig": {
    /* Section 9 - Optional (Mobile Features) */
  }
}
```

---

## 1. Project Setup

**Purpose**: Define basic project metadata and setup information.

```json
{
  "projectSetup": {
    "projectName": "string",
    "description": "string",
    "author": "string",
    "license": "string",
    "nodeVersion": "string",
    "packageManager": "string"
  }
}
```

### Fields

| Field            | Type   | Required | Valid Values                                                    | Description                 | Example                                     |
| ---------------- | ------ | -------- | --------------------------------------------------------------- | --------------------------- | ------------------------------------------- |
| `projectName`    | string | ✅ Yes   | Lowercase letters, numbers, hyphens                             | Project folder name         | `"health-records-api"`                      |
| `description`    | string | ✅ Yes   | Any string                                                      | Brief project description   | `"Digital health record management system"` |
| `author`         | string | ✅ Yes   | Any string                                                      | Author or organization name | `"John Doe"`                                |
| `license`        | string | ✅ Yes   | `"MIT"`, `"Apache-2.0"`, `"GPL-3.0"`, `"BSD-3-Clause"`, `"ISC"` | Software license            | `"MIT"`                                     |
| `nodeVersion`    | string | ✅ Yes   | `"18"`, `"20"`, `"22"`                                          | Node.js version             | `"20"`                                      |
| `packageManager` | string | ✅ Yes   | `"npm"`, `"yarn"`, `"pnpm"`                                     | Package manager to use      | `"npm"`                                     |

### Validation Rules

- ✅ `projectName` must match regex: `/^[a-z0-9-]+$/` (lowercase letters, numbers, hyphens only)
- ✅ All fields are required
- ✅ Cannot be empty strings

### Example

```json
{
  "projectSetup": {
    "projectName": "employee-management-api",
    "description": "Employee management system with role-based access",
    "author": "Your Company",
    "license": "MIT",
    "nodeVersion": "20",
    "packageManager": "npm"
  }
}
```

---

## 2. Database Configuration

**Purpose**: Define database type, provider, and connection settings.

```json
{
  "databaseConfig": {
    "databaseType": "string",
    "provider": "string",
    "connectionString": "string",
    "autoMigration": "string"
  }
}
```

### Fields

| Field              | Type   | Required | Valid Values                                                    | Description             | Example                            |
| ------------------ | ------ | -------- | --------------------------------------------------------------- | ----------------------- | ---------------------------------- |
| `databaseType`     | string | ✅ Yes   | `"MongoDB"`, `"PostgreSQL"`, `"MySQL"`                          | Type of database        | `"MongoDB"`                        |
| `provider`         | string | ✅ Yes   | `"Neon"`, `"Supabase"`, `"Atlas"`, `"PlanetScale"`, `"Railway"` | Hosting provider        | `"Atlas"`                          |
| `connectionString` | string | ✅ Yes   | Valid connection string                                         | Database connection URL | `"mongodb://localhost:27017/mydb"` |
| `autoMigration`    | string | ✅ Yes   | `"push"`, `"manual"`                                            | Migration strategy      | `"push"`                           |

### Connection String Formats

**MongoDB:**

```
mongodb://localhost:27017/database_name
mongodb+srv://username:password@cluster.mongodb.net/database_name
```

**PostgreSQL:**

```
postgresql://username:password@localhost:5432/database_name
postgres://username:password@hostname:5432/database_name
```

**MySQL:**

```
mysql://username:password@localhost:3306/database_name
```

### Validation Rules

- ✅ Connection string format must match database type
- ✅ MongoDB uses Mongoose ORM (automatic)
- ✅ PostgreSQL/MySQL use TypeORM (automatic)

### Example

```json
{
  "databaseConfig": {
    "databaseType": "MongoDB",
    "provider": "Atlas",
    "connectionString": "mongodb+srv://user:pass@cluster.mongodb.net/health_records",
    "autoMigration": "push"
  }
}
```

---

## 3. Model Definition

**Purpose**: Define data models (entities/schemas) and their relationships.

```json
{
  "modelDefinition": {
    "models": [
      /* Array of model objects */
    ],
    "relationships": [
      /* Array of relationship objects */
    ]
  }
}
```

### 3.1 Models Array

Each model defines a data entity in your application.

```json
{
  "id": "string (optional)",
  "name": "string",
  "fields": [ /* Array of field objects */ ],
  "timestamps": boolean,
  "relationships": [ /* Optional inline relationships */ ]
}
```

#### Model Fields

| Field           | Type    | Required | Valid Values                  | Description                    | Example        |
| --------------- | ------- | -------- | ----------------------------- | ------------------------------ | -------------- |
| `id`            | string  | ❌ No    | Any string                    | Auto-generated if not provided | `"model-user"` |
| `name`          | string  | ✅ Yes   | PascalCase                    | Model name                     | `"User"`       |
| `fields`        | array   | ✅ Yes   | Array of field objects        | Model fields                   | `[{...}]`      |
| `timestamps`    | boolean | ❌ No    | `true`, `false`               | Add createdAt/updatedAt        | `true`         |
| `relationships` | array   | ❌ No    | Array of relationship objects | Inline relationships           | `[{...}]`      |

#### Validation Rules

- ✅ Model name must be **PascalCase** (e.g., `User`, `BlogPost`, `OrderItem`)
- ✅ Model names must be **unique**
- ✅ At least **one field** is required
- ⚠️ Avoid reserved names: `System`, `Admin`, `Config`, `Database`, `Auth`

### 3.2 Fields Array

Each field defines a property of the model.

```json
{
  "id": "string (optional)",
  "name": "string",
  "type": "string",
  "required": boolean,
  "unique": boolean,
  "indexed": boolean,
  "default": "any (optional)",
  "defaultValue": "any (optional)",
  "minLength": number (optional),
  "maxLength": number (optional),
  "min": number (optional),
  "max": number (optional),
  "pattern": "string (optional)",
  "values": ["string"] (optional for enum)
}
```

#### Field Properties

| Property       | Type    | Required                  | Valid Values     | Description                    | Example                  |
| -------------- | ------- | ------------------------- | ---------------- | ------------------------------ | ------------------------ |
| `id`           | string  | ❌ No                     | Any string       | Auto-generated if not provided | `"field-email"`          |
| `name`         | string  | ✅ Yes                    | camelCase        | Field name                     | `"email"`                |
| `type`         | string  | ✅ Yes                    | See types below  | Data type                      | `"string"`               |
| `required`     | boolean | ❌ No                     | `true`, `false`  | Field is mandatory             | `true`                   |
| `unique`       | boolean | ❌ No                     | `true`, `false`  | Value must be unique           | `true`                   |
| `indexed`      | boolean | ❌ No                     | `true`, `false`  | Create database index          | `true`                   |
| `default`      | any     | ❌ No                     | Type-specific    | Default value                  | `"active"`               |
| `defaultValue` | any     | ❌ No                     | Type-specific    | Alias for `default`            | `0`                      |
| `minLength`    | number  | ❌ No                     | Positive integer | Min string length              | `3`                      |
| `maxLength`    | number  | ❌ No                     | Positive integer | Max string length              | `100`                    |
| `min`          | number  | ❌ No                     | Number           | Min number value               | `0`                      |
| `max`          | number  | ❌ No                     | Number           | Max number value               | `120`                    |
| `pattern`      | string  | ❌ No                     | Regex string     | Validation regex               | `"^[A-Z]"`               |
| `values`       | array   | ❌ No (required for enum) | Array of strings | Enum values                    | `["active", "inactive"]` |

#### Valid Field Types

| Type         | Description           | Example Value            | Use Case                    |
| ------------ | --------------------- | ------------------------ | --------------------------- |
| `"string"`   | Text data             | `"John Doe"`             | Names, emails, descriptions |
| `"number"`   | Numeric data          | `42`, `3.14`             | Age, price, quantity        |
| `"boolean"`  | True/false            | `true`, `false`          | Flags, status               |
| `"date"`     | Date only             | `"2024-01-22"`           | Birth date, deadline        |
| `"datetime"` | Date and time         | `"2024-01-22T10:30:00Z"` | Timestamps                  |
| `"string[]"` | Array of strings      | `["tag1", "tag2"]`       | Tags, categories            |
| `"json"`     | JSON object           | `{"key": "value"}`       | Complex data                |
| `"json[]"`   | Array of JSON objects | `[{...}, {...}]`         | Multiple complex items      |
| `"objectId"` | MongoDB ObjectId      | Auto-generated           | References                  |
| `"enum"`     | Enumerated values     | `"active"`               | Status, role, type          |

#### Field Naming Rules

- ✅ Must be **camelCase** (e.g., `firstName`, `emailAddress`, `isActive`)
- ✅ Start with lowercase letter
- ✅ Can contain letters and numbers
- ❌ No special characters except numbers

### 3.3 Relationships Array

Define how models relate to each other.

```json
{
  "id": "string (optional)",
  "type": "string",
  "sourceModel": "string (optional)",
  "targetModel": "string",
  "fieldName": "string",
  "through": "string (optional)",
  "foreignKeyName": "string (optional)",
  "inverseFieldName": "string (optional)"
}
```

#### Relationship Properties

| Property           | Type   | Required | Valid Values    | Description                    | Example            |
| ------------------ | ------ | -------- | --------------- | ------------------------------ | ------------------ |
| `id`               | string | ❌ No    | Any string      | Auto-generated                 | `"rel-user-posts"` |
| `type`             | string | ✅ Yes   | See types below | Relationship type              | `"one-to-many"`    |
| `sourceModel`      | string | ❌ No    | Model name      | Source model (can be inferred) | `"User"`           |
| `targetModel`      | string | ✅ Yes   | Model name      | Target model                   | `"Post"`           |
| `fieldName`        | string | ✅ Yes   | camelCase       | Field name in source           | `"posts"`          |
| `through`          | string | ❌ No    | Model name      | Join table for many-to-many    | `"UserRole"`       |
| `foreignKeyName`   | string | ❌ No    | camelCase       | Custom FK name                 | `"authorId"`       |
| `inverseFieldName` | string | ❌ No    | camelCase       | Field name in target           | `"author"`         |

#### Relationship Types

| Type             | Description                | Example        | Source Field       | Target Field      |
| ---------------- | -------------------------- | -------------- | ------------------ | ----------------- |
| `"one-to-one"`   | Each source has one target | User → Profile | `profile` (object) | `user` (object)   |
| `"one-to-many"`  | One source, many targets   | User → Posts   | `posts` (array)    | `author` (object) |
| `"many-to-one"`  | Many sources, one target   | Posts → User   | `author` (object)  | `posts` (array)   |
| `"many-to-many"` | Many sources, many targets | Users ↔ Roles | `roles` (array)    | `users` (array)   |

### Model Definition Example

```json
{
  "modelDefinition": {
    "models": [
      {
        "name": "User",
        "timestamps": true,
        "fields": [
          {
            "name": "email",
            "type": "string",
            "required": true,
            "unique": true,
            "indexed": true,
            "maxLength": 255
          },
          {
            "name": "password",
            "type": "string",
            "required": true,
            "minLength": 8
          },
          {
            "name": "firstName",
            "type": "string",
            "required": true
          },
          {
            "name": "lastName",
            "type": "string",
            "required": true
          },
          {
            "name": "age",
            "type": "number",
            "min": 0,
            "max": 150
          },
          {
            "name": "isActive",
            "type": "boolean",
            "default": true
          },
          {
            "name": "role",
            "type": "enum",
            "values": ["admin", "user", "moderator"],
            "default": "user"
          },
          {
            "name": "tags",
            "type": "string[]"
          }
        ]
      },
      {
        "name": "Post",
        "timestamps": true,
        "fields": [
          {
            "name": "title",
            "type": "string",
            "required": true,
            "maxLength": 200
          },
          {
            "name": "content",
            "type": "string",
            "required": true
          },
          {
            "name": "status",
            "type": "enum",
            "values": ["draft", "published", "archived"],
            "default": "draft"
          },
          {
            "name": "publishedAt",
            "type": "datetime"
          },
          {
            "name": "views",
            "type": "number",
            "default": 0,
            "min": 0
          }
        ]
      }
    ],
    "relationships": [
      {
        "type": "one-to-many",
        "sourceModel": "User",
        "targetModel": "Post",
        "fieldName": "posts",
        "foreignKeyName": "authorId",
        "inverseFieldName": "author"
      }
    ]
  }
}
```

---

## 4. Authentication Configuration

**Purpose**: Configure authentication and authorization features.

```json
{
  "authConfig": {
    "enabled": boolean,
    "method": "string",
    "jwt": {
      "accessTTL": "string",
      "refreshTTL": "string",
      "rotation": boolean,
      "blacklist": boolean
    },
    "roles": ["string"]
  }
}
```

### Fields

| Field     | Type    | Required            | Valid Values      | Description                      | Default             |
| --------- | ------- | ------------------- | ----------------- | -------------------------------- | ------------------- |
| `enabled` | boolean | ❌ No               | `true`, `false`   | Enable authentication            | `false`             |
| `method`  | string  | ✅ Yes (if enabled) | `"jwt"`           | Auth method (only JWT supported) | `"jwt"`             |
| `jwt`     | object  | ✅ Yes (if enabled) | JWT config object | JWT settings                     | See below           |
| `roles`   | array   | ❌ No               | Array of strings  | User roles                       | `["Admin", "User"]` |

### JWT Configuration

| Field        | Type    | Required | Valid Values    | Description            | Default |
| ------------ | ------- | -------- | --------------- | ---------------------- | ------- |
| `accessTTL`  | string  | ❌ No    | Time format     | Access token lifetime  | `"15m"` |
| `refreshTTL` | string  | ❌ No    | Time format     | Refresh token lifetime | `"7d"`  |
| `rotation`   | boolean | ❌ No    | `true`, `false` | Rotate refresh tokens  | `true`  |
| `blacklist`  | boolean | ❌ No    | `true`, `false` | Blacklist on logout    | `true`  |

#### Time Format

Format: `<number><unit>` where unit is:

- `m` = minutes
- `h` = hours
- `d` = days

Examples: `"15m"`, `"1h"`, `"7d"`, `"30d"`

### Validation Rules

- ✅ If auth is enabled, a **User model** is required
- ✅ User model should have `email` and `password` fields
- ✅ At least one role must be defined

### Example

```json
{
  "authConfig": {
    "enabled": true,
    "method": "jwt",
    "jwt": {
      "accessTTL": "15m",
      "refreshTTL": "7d",
      "rotation": true,
      "blacklist": true
    },
    "roles": ["Admin", "User", "Moderator"]
  }
}
```

---

## 5. OAuth Configuration

**Purpose**: Configure OAuth2 social login providers.

```json
{
  "oauthConfig": {
    "enabled": boolean,
    "providers": [
      {
        "name": "string",
        "clientId": "string",
        "clientSecret": "string",
        "callbackURL": "string"
      }
    ]
  }
}
```

### Fields

| Field       | Type    | Required            | Valid Values              | Description     |
| ----------- | ------- | ------------------- | ------------------------- | --------------- |
| `enabled`   | boolean | ❌ No               | `true`, `false`           | Enable OAuth    |
| `providers` | array   | ✅ Yes (if enabled) | Array of provider objects | OAuth providers |

### Provider Object

| Field          | Type   | Required | Valid Values           | Description         | Example                                        |
| -------------- | ------ | -------- | ---------------------- | ------------------- | ---------------------------------------------- |
| `name`         | string | ✅ Yes   | `"google"`, `"github"` | Provider name       | `"google"`                                     |
| `clientId`     | string | ✅ Yes   | Any string             | OAuth client ID     | `"123456789.apps.googleusercontent.com"`       |
| `clientSecret` | string | ✅ Yes   | Any string             | OAuth client secret | `"GOCSPX-xxxxxxxxxxxx"`                        |
| `callbackURL`  | string | ✅ Yes   | Valid URL              | Callback URL        | `"http://localhost:3000/auth/google/callback"` |

### Validation Rules

- ✅ OAuth requires authentication to be enabled (`authConfig.enabled = true`)
- ✅ At least one provider must be configured if OAuth is enabled
- ✅ Callback URL must be a valid URL

### Example

```json
{
  "oauthConfig": {
    "enabled": true,
    "providers": [
      {
        "name": "google",
        "clientId": "123456789.apps.googleusercontent.com",
        "clientSecret": "GOCSPX-xxxxxxxxxxxx",
        "callbackURL": "http://localhost:3000/auth/google/callback"
      },
      {
        "name": "github",
        "clientId": "Iv1.a1b2c3d4e5f6g7h8",
        "clientSecret": "0123456789abcdef0123456789abcdef01234567",
        "callbackURL": "http://localhost:3000/auth/github/callback"
      }
    ]
  }
}
```

---

## 6. Feature Selection

**Purpose**: Toggle various NestJS features and middleware.

```json
{
  "featureSelection": {
    "cors": boolean,
    "helmet": boolean,
    "compression": boolean,
    "validation": boolean,
    "logging": boolean,
    "caching": boolean,
    "swagger": boolean,
    "health": boolean,
    "rateLimit": boolean,
    "versioning": boolean,
    "queues": boolean,
    "s3Upload": boolean,
    "encryptionStrategy": "string",
    "fieldLevelAccessControl": boolean,
    "gitHooks": boolean,
    "sonarQube": boolean
  }
}
```

### All Features

| Feature                   | Type    | Default      | Description               | Use Case                       |
| ------------------------- | ------- | ------------ | ------------------------- | ------------------------------ |
| `cors`                    | boolean | `true`       | Enable CORS               | Allow cross-origin requests    |
| `helmet`                  | boolean | `true`       | Security headers          | Protect against common attacks |
| `compression`             | boolean | `true`       | Response compression      | Reduce response size           |
| `validation`              | boolean | `true`       | Global validation pipe    | Validate DTOs automatically    |
| `logging`                 | boolean | `true`       | Structured logging (Pino) | Production logging             |
| `caching`                 | boolean | `false`      | Redis caching             | Cache responses                |
| `swagger`                 | boolean | `false`      | API documentation         | Auto-generate API docs         |
| `health`                  | boolean | `true`       | Health checks             | Monitor service health         |
| `rateLimit`               | boolean | `false`      | Rate limiting             | Prevent abuse                  |
| `versioning`              | boolean | `false`      | API versioning            | Version your API (v1, v2)      |
| `queues`                  | boolean | `false`      | Background jobs (BullMQ)  | Process tasks async            |
| `s3Upload`                | boolean | `false`      | AWS S3 file uploads       | Handle file uploads            |
| `encryptionStrategy`      | string  | `"disabled"` | Field encryption          | Encrypt sensitive data         |
| `fieldLevelAccessControl` | boolean | `false`      | Field-level permissions   | Hide fields by role            |
| `gitHooks`                | boolean | `true`       | Husky & lint-staged       | Pre-commit hooks               |
| `sonarQube`               | boolean | `false`      | Code quality              | Static analysis                |

### Encryption Strategy

| Value        | Description        | Cost   | Use Case                        |
| ------------ | ------------------ | ------ | ------------------------------- |
| `"disabled"` | No encryption      | Free   | Development, non-sensitive data |
| `"local"`    | Env key encryption | Free   | Production, moderate security   |
| `"aws_kms"`  | AWS KMS encryption | ~$7/mo | Enterprise, high security       |

### Example

```json
{
  "featureSelection": {
    "cors": true,
    "helmet": true,
    "compression": true,
    "validation": true,
    "logging": true,
    "caching": false,
    "swagger": true,
    "health": true,
    "rateLimit": true,
    "versioning": false,
    "queues": false,
    "s3Upload": false,
    "encryptionStrategy": "disabled",
    "fieldLevelAccessControl": false,
    "gitHooks": true,
    "sonarQube": false
  }
}
```

---

## 7. Docker Configuration

**Purpose**: Configure Docker containerization settings.

```json
{
  "dockerConfig": {
    "enabled": boolean,
    "includeCompose": boolean,
    "includeProd": boolean,
    "healthCheck": boolean,
    "nonRootUser": boolean,
    "multiStage": boolean
  }
}
```

### Fields

| Field            | Type    | Required | Default | Description                 |
| ---------------- | ------- | -------- | ------- | --------------------------- |
| `enabled`        | boolean | ❌ No    | `true`  | Enable Docker               |
| `includeCompose` | boolean | ❌ No    | `true`  | Generate docker-compose.yml |
| `includeProd`    | boolean | ❌ No    | `true`  | Production Dockerfile       |
| `healthCheck`    | boolean | ❌ No    | `true`  | Add health check            |
| `nonRootUser`    | boolean | ❌ No    | `true`  | Run as non-root user        |
| `multiStage`     | boolean | ❌ No    | `true`  | Multi-stage build           |

### Example

```json
{
  "dockerConfig": {
    "enabled": true,
    "includeCompose": true,
    "includeProd": true,
    "healthCheck": true,
    "nonRootUser": true,
    "multiStage": true
  }
}
```

---

## 8. CI/CD Configuration

**Purpose**: Configure continuous integration and deployment pipelines.

```json
{
  "cicdConfig": {
    "enabled": boolean,
    "githubActions": boolean,
    "gitlabCI": boolean,
    "includeTests": boolean,
    "includeE2E": boolean,
    "includeSecurity": boolean,
    "autoDockerBuild": boolean
  }
}
```

### Fields

| Field             | Type    | Required | Default | Description             |
| ----------------- | ------- | -------- | ------- | ----------------------- |
| `enabled`         | boolean | ❌ No    | `true`  | Enable CI/CD            |
| `githubActions`   | boolean | ❌ No    | `true`  | GitHub Actions workflow |
| `gitlabCI`        | boolean | ❌ No    | `false` | GitLab CI pipeline      |
| `includeTests`    | boolean | ❌ No    | `true`  | Run unit tests          |
| `includeE2E`      | boolean | ❌ No    | `true`  | Run E2E tests           |
| `includeSecurity` | boolean | ❌ No    | `true`  | Security scanning       |
| `autoDockerBuild` | boolean | ❌ No    | `true`  | Build Docker images     |

### Validation Rules

- ⚠️ If `includeE2E` is `true`, `includeTests` should also be `true`

### Example

```json
{
  "cicdConfig": {
    "enabled": true,
    "githubActions": true,
    "gitlabCI": false,
    "includeTests": true,
    "includeE2E": true,
    "includeSecurity": true,
    "autoDockerBuild": true
  }
}
```

---

## 9. Mobile Configuration

**Purpose**: Configure mobile-specific features for backend APIs serving mobile applications (Flutter, React Native, etc.).

> **📱 Note**: This section enables powerful mobile features like biometric authentication, device management, and offline sync. See [MOBILE_INTEGRATION_GUIDE.md](./MOBILE_INTEGRATION_GUIDE.md) for client-side implementation examples.

```json
{
  "mobileConfig": {
    "enabled": boolean,
    "clientTypes": ["web" | "mobile" | "both"],
    "disableCsrfForBearerAuth": boolean,
    "biometricAuth": { /* See below */ },
    "deviceManagement": { /* See below */ },
    "offlineSync": { /* See below */ }
  }
}
```

### Main Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `enabled` | boolean | ❌ No | `false` | Enable mobile features |
| `clientTypes` | array | ❌ No | `["both"]` | Target client types: `"web"`, `"mobile"`, `"both"` |
| `disableCsrfForBearerAuth` | boolean | ❌ No | `true` | Disable CSRF for JWT Bearer auth (recommended for mobile) |

### 9.1 Biometric Authentication (WebAuthn/Passkeys)

Configure FIDO2/WebAuthn for passwordless biometric login.

```json
{
  "biometricAuth": {
    "enabled": true,
    "rpId": "example.com",
    "rpName": "My App",
    "allowedAuthenticators": ["platform"],
    "userVerification": "required",
    "attestation": "none",
    "residentKey": "preferred",
    "timeout": 60000
  }
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `enabled` | boolean | ❌ No | `false` | Enable WebAuthn/biometric auth |
| `rpId` | string | ❌ No | - | Relying Party ID (your domain without protocol) |
| `rpName` | string | ❌ No | projectName | Human-readable app name |
| `allowedAuthenticators` | array | ❌ No | `["platform"]` | `"platform"` (device biometrics) or `"cross-platform"` (security keys) |
| `userVerification` | string | ❌ No | `"required"` | `"required"`, `"preferred"`, or `"discouraged"` |
| `attestation` | string | ❌ No | `"none"` | `"none"` (privacy-friendly), `"indirect"`, or `"direct"` |
| `residentKey` | string | ❌ No | `"preferred"` | For usernameless login: `"required"`, `"preferred"`, `"discouraged"` |
| `timeout` | number | ❌ No | `60000` | Challenge timeout in milliseconds |

### 9.2 Device Management

Configure multi-device session tracking and management.

```json
{
  "deviceManagement": {
    "enabled": true,
    "maxDevicesPerUser": 5,
    "trackDeviceInfo": true,
    "autoRevokeInactiveDays": 90,
    "requireDeviceApproval": false
  }
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `enabled` | boolean | ❌ No | `true` | Enable device tracking |
| `maxDevicesPerUser` | number | ❌ No | `5` | Max concurrent devices per user (1-50) |
| `trackDeviceInfo` | boolean | ❌ No | `true` | Track OS, app version, IP address |
| `autoRevokeInactiveDays` | number | ❌ No | `90` | Auto-revoke after N days inactive (0 = never) |
| `requireDeviceApproval` | boolean | ❌ No | `false` | Require user approval for new devices |

### 9.3 Offline Sync

Configure delta sync and conflict resolution for offline-first mobile apps.

```json
{
  "offlineSync": {
    "enabled": true,
    "conflictResolution": "last-write-wins",
    "deltaSync": true,
    "batchSize": 100,
    "syncModels": ["Note", "Task"],
    "idempotencyKeyTTL": 86400
  }
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `enabled` | boolean | ❌ No | `false` | Enable offline sync endpoints |
| `conflictResolution` | string | ❌ No | `"last-write-wins"` | Strategy: `"server-wins"`, `"client-wins"`, `"last-write-wins"`, `"manual"` |
| `deltaSync` | boolean | ❌ No | `true` | Only sync changes since last sync |
| `batchSize` | number | ❌ No | `100` | Max items per sync batch (10-1000) |
| `syncModels` | array | ❌ No | `[]` | Model names to sync (empty = all) |
| `idempotencyKeyTTL` | number | ❌ No | `86400` | Idempotency key TTL in seconds (24h default) |

### Complete Mobile Config Example

```json
{
  "mobileConfig": {
    "enabled": true,
    "clientTypes": ["both"],
    "disableCsrfForBearerAuth": true,
    "biometricAuth": {
      "enabled": true,
      "rpId": "example.com",
      "rpName": "My Mobile App",
      "allowedAuthenticators": ["platform"],
      "userVerification": "required"
    },
    "deviceManagement": {
      "enabled": true,
      "maxDevicesPerUser": 5,
      "trackDeviceInfo": true,
      "autoRevokeInactiveDays": 90
    },
    "offlineSync": {
      "enabled": true,
      "conflictResolution": "last-write-wins",
      "deltaSync": true,
      "syncModels": ["Note", "Task"]
    }
  }
}
```

### Required Environment Variables

When mobile features are enabled, add these to your `.env`:

```env
# Biometric Auth (if enabled)
WEBAUTHN_RP_ID=example.com
WEBAUTHN_RP_NAME=My App
WEBAUTHN_ORIGIN=https://example.com

# Push Notifications (for device management)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# Caching (recommended for sync)
REDIS_URL=redis://localhost:6379
```

---

## Complete Examples

### Example 1: Minimal Blog API

```json
{
  "projectSetup": {
    "projectName": "blog-api",
    "description": "Simple blog API",
    "author": "John Doe",
    "license": "MIT",
    "nodeVersion": "20",
    "packageManager": "npm"
  },
  "databaseConfig": {
    "databaseType": "MongoDB",
    "provider": "Atlas",
    "connectionString": "mongodb://localhost:27017/blog",
    "autoMigration": "push"
  },
  "modelDefinition": {
    "models": [
      {
        "name": "Post",
        "timestamps": true,
        "fields": [
          {
            "name": "title",
            "type": "string",
            "required": true
          },
          {
            "name": "content",
            "type": "string",
            "required": true
          },
          {
            "name": "published",
            "type": "boolean",
            "default": false
          }
        ]
      }
    ],
    "relationships": []
  },
  "authConfig": {
    "enabled": false,
    "method": "jwt",
    "roles": ["Admin", "User"]
  },
  "featureSelection": {
    "cors": true,
    "helmet": true,
    "compression": true,
    "validation": true,
    "logging": true,
    "caching": false,
    "swagger": true,
    "health": true,
    "rateLimit": false,
    "versioning": false,
    "queues": false,
    "s3Upload": false,
    "encryptionStrategy": "disabled",
    "fieldLevelAccessControl": false,
    "gitHooks": true,
    "sonarQube": false
  }
}
```

### Example 2: Full-Featured E-commerce API

```json
{
  "projectSetup": {
    "projectName": "ecommerce-api",
    "description": "E-commerce platform with authentication",
    "author": "E-Shop Inc",
    "license": "MIT",
    "nodeVersion": "20",
    "packageManager": "npm"
  },
  "databaseConfig": {
    "databaseType": "PostgreSQL",
    "provider": "Neon",
    "connectionString": "postgresql://user:pass@localhost:5432/ecommerce",
    "autoMigration": "push"
  },
  "modelDefinition": {
    "models": [
      {
        "name": "User",
        "timestamps": true,
        "fields": [
          {
            "name": "email",
            "type": "string",
            "required": true,
            "unique": true
          },
          {
            "name": "password",
            "type": "string",
            "required": true
          },
          {
            "name": "firstName",
            "type": "string",
            "required": true
          },
          {
            "name": "lastName",
            "type": "string",
            "required": true
          }
        ]
      },
      {
        "name": "Product",
        "timestamps": true,
        "fields": [
          {
            "name": "name",
            "type": "string",
            "required": true
          },
          {
            "name": "description",
            "type": "string"
          },
          {
            "name": "price",
            "type": "number",
            "required": true,
            "min": 0
          },
          {
            "name": "stock",
            "type": "number",
            "default": 0,
            "min": 0
          },
          {
            "name": "category",
            "type": "enum",
            "values": ["electronics", "clothing", "books", "home"],
            "required": true
          }
        ]
      },
      {
        "name": "Order",
        "timestamps": true,
        "fields": [
          {
            "name": "status",
            "type": "enum",
            "values": [
              "pending",
              "processing",
              "shipped",
              "delivered",
              "cancelled"
            ],
            "default": "pending"
          },
          {
            "name": "total",
            "type": "number",
            "required": true,
            "min": 0
          }
        ]
      }
    ],
    "relationships": [
      {
        "type": "one-to-many",
        "sourceModel": "User",
        "targetModel": "Order",
        "fieldName": "orders",
        "inverseFieldName": "customer"
      }
    ]
  },
  "authConfig": {
    "enabled": true,
    "method": "jwt",
    "jwt": {
      "accessTTL": "15m",
      "refreshTTL": "7d",
      "rotation": true,
      "blacklist": true
    },
    "roles": ["Admin", "Customer"]
  },
  "oauthConfig": {
    "enabled": true,
    "providers": [
      {
        "name": "google",
        "clientId": "your-client-id.apps.googleusercontent.com",
        "clientSecret": "your-client-secret",
        "callbackURL": "http://localhost:3000/auth/google/callback"
      }
    ]
  },
  "featureSelection": {
    "cors": true,
    "helmet": true,
    "compression": true,
    "validation": true,
    "logging": true,
    "caching": true,
    "swagger": true,
    "health": true,
    "rateLimit": true,
    "versioning": false,
    "queues": true,
    "s3Upload": true,
    "encryptionStrategy": "local",
    "fieldLevelAccessControl": true,
    "gitHooks": true,
    "sonarQube": false
  },
  "dockerConfig": {
    "enabled": true,
    "includeCompose": true,
    "includeProd": true,
    "healthCheck": true,
    "nonRootUser": true,
    "multiStage": true
  },
  "cicdConfig": {
    "enabled": true,
    "githubActions": true,
    "gitlabCI": false,
    "includeTests": true,
    "includeE2E": true,
    "includeSecurity": true,
    "autoDockerBuild": true
  }
}
```

### Example 3: Health Records System

```json
{
  "projectSetup": {
    "projectName": "health-records-api",
    "description": "Digital health record management system for migrant workers",
    "author": "Health Tech Solutions",
    "license": "MIT",
    "nodeVersion": "20",
    "packageManager": "npm"
  },
  "databaseConfig": {
    "databaseType": "MongoDB",
    "provider": "Atlas",
    "connectionString": "mongodb+srv://user:pass@cluster.mongodb.net/health_records",
    "autoMigration": "push"
  },
  "modelDefinition": {
    "models": [
      {
        "name": "Worker",
        "timestamps": true,
        "fields": [
          {
            "name": "workerId",
            "type": "string",
            "required": true,
            "unique": true
          },
          {
            "name": "fullName",
            "type": "string",
            "required": true
          },
          {
            "name": "dateOfBirth",
            "type": "date"
          },
          {
            "name": "gender",
            "type": "enum",
            "values": ["male", "female", "other"]
          },
          {
            "name": "bloodGroup",
            "type": "string"
          },
          {
            "name": "contactNumber",
            "type": "string"
          }
        ]
      },
      {
        "name": "HealthRecord",
        "timestamps": true,
        "fields": [
          {
            "name": "recordType",
            "type": "enum",
            "values": ["checkup", "vaccination", "treatment", "test"],
            "required": true
          },
          {
            "name": "date",
            "type": "datetime",
            "required": true
          },
          {
            "name": "diagnosis",
            "type": "string"
          },
          {
            "name": "prescription",
            "type": "string"
          },
          {
            "name": "notes",
            "type": "string"
          }
        ]
      },
      {
        "name": "User",
        "timestamps": true,
        "fields": [
          {
            "name": "email",
            "type": "string",
            "required": true,
            "unique": true
          },
          {
            "name": "password",
            "type": "string",
            "required": true
          },
          {
            "name": "firstName",
            "type": "string",
            "required": true
          },
          {
            "name": "lastName",
            "type": "string",
            "required": true
          },
          {
            "name": "role",
            "type": "enum",
            "values": ["doctor", "admin", "viewer"],
            "default": "viewer"
          }
        ]
      }
    ],
    "relationships": [
      {
        "type": "one-to-many",
        "sourceModel": "Worker",
        "targetModel": "HealthRecord",
        "fieldName": "healthRecords",
        "inverseFieldName": "worker"
      }
    ]
  },
  "authConfig": {
    "enabled": true,
    "method": "jwt",
    "jwt": {
      "accessTTL": "30m",
      "refreshTTL": "14d",
      "rotation": true,
      "blacklist": true
    },
    "roles": ["Admin", "Doctor", "Viewer"]
  },
  "featureSelection": {
    "cors": true,
    "helmet": true,
    "compression": true,
    "validation": true,
    "logging": true,
    "caching": false,
    "swagger": true,
    "health": true,
    "rateLimit": true,
    "versioning": false,
    "queues": false,
    "s3Upload": false,
    "encryptionStrategy": "local",
    "fieldLevelAccessControl": true,
    "gitHooks": true,
    "sonarQube": false
  },
  "dockerConfig": {
    "enabled": true,
    "includeCompose": true,
    "includeProd": true,
    "healthCheck": true,
    "nonRootUser": true,
    "multiStage": true
  },
  "cicdConfig": {
    "enabled": true,
    "githubActions": true,
    "gitlabCI": false,
    "includeTests": true,
    "includeE2E": true,
    "includeSecurity": true,
    "autoDockerBuild": true
  }
}
```

---

## Validation Checklist

Before generating your project, ensure:

### Required Fields

- ✅ All required fields in `projectSetup` are filled
- ✅ `databaseConfig` is complete
- ✅ At least one model is defined
- ✅ Each model has at least one field

### Naming Conventions

- ✅ Project name is lowercase with hyphens
- ✅ Model names are PascalCase
- ✅ Field names are camelCase

### Authentication

- ✅ If auth is enabled, User model exists
- ✅ User model has `email` and `password` fields
- ✅ JWT configuration is provided

### OAuth

- ✅ OAuth requires authentication enabled
- ✅ At least one provider configured
- ✅ All provider fields filled

### Relationships

- ✅ Source and target models exist
- ✅ Field names are unique within models
- ✅ Relationship types are valid

---

## Common Patterns

### User with Profile (One-to-One)

```json
{
  "models": [
    {
      "name": "User",
      "fields": [
        { "name": "email", "type": "string", "required": true, "unique": true },
        { "name": "password", "type": "string", "required": true }
      ]
    },
    {
      "name": "Profile",
      "fields": [
        { "name": "bio", "type": "string" },
        { "name": "avatar", "type": "string" }
      ]
    }
  ],
  "relationships": [
    {
      "type": "one-to-one",
      "sourceModel": "User",
      "targetModel": "Profile",
      "fieldName": "profile",
      "inverseFieldName": "user"
    }
  ]
}
```

### Blog with Posts and Comments (One-to-Many)

```json
{
  "models": [
    {
      "name": "User",
      "fields": [
        {
          "name": "username",
          "type": "string",
          "required": true,
          "unique": true
        }
      ]
    },
    {
      "name": "Post",
      "fields": [
        { "name": "title", "type": "string", "required": true },
        { "name": "content", "type": "string", "required": true }
      ]
    },
    {
      "name": "Comment",
      "fields": [{ "name": "text", "type": "string", "required": true }]
    }
  ],
  "relationships": [
    {
      "type": "one-to-many",
      "sourceModel": "User",
      "targetModel": "Post",
      "fieldName": "posts",
      "inverseFieldName": "author"
    },
    {
      "type": "one-to-many",
      "sourceModel": "Post",
      "targetModel": "Comment",
      "fieldName": "comments",
      "inverseFieldName": "post"
    }
  ]
}
```

### Users and Roles (Many-to-Many)

```json
{
  "models": [
    {
      "name": "User",
      "fields": [
        { "name": "email", "type": "string", "required": true, "unique": true }
      ]
    },
    {
      "name": "Role",
      "fields": [
        { "name": "name", "type": "string", "required": true, "unique": true }
      ]
    }
  ],
  "relationships": [
    {
      "type": "many-to-many",
      "sourceModel": "User",
      "targetModel": "Role",
      "fieldName": "roles",
      "inverseFieldName": "users"
    }
  ]
}
```

---

## Tips and Best Practices

### 1. Start Small

Begin with minimal configuration and add features incrementally.

### 2. Use Descriptive Names

- Models: `User`, `BlogPost`, `OrderItem`
- Fields: `firstName`, `emailAddress`, `createdAt`

### 3. Plan Relationships Carefully

Draw an entity-relationship diagram before coding.

### 4. Security First

- Always enable `helmet` and `cors`
- Use strong authentication for production
- Consider field-level access control for sensitive data

### 5. Performance

- Index frequently queried fields
- Enable caching for read-heavy operations
- Use queues for time-consuming tasks

### 6. Testing

- Enable CI/CD with tests
- Include E2E tests for critical flows

### 7. Documentation

- Enable Swagger for automatic API docs
- Add meaningful descriptions

---

## Troubleshooting

### Validation Fails

**Problem**: Configuration doesn't validate

**Solution**:

1. Check the validation error message
2. Verify all required fields are present
3. Ensure naming conventions (PascalCase for models, camelCase for fields)
4. Verify model names in relationships exist

### Generation Fails

**Problem**: Template not found error

**Solution**:

1. Ensure all templates exist in `server/templates/`
2. Check that features requiring specific templates are properly configured

### Authentication Issues

**Problem**: Auth enabled but no User model

**Solution**:
Add a User model with at least `email` and `password` fields.

---

## Next Steps

After creating your JSON configuration:

1. **Validate**: Use the validation button in the UI
2. **Review**: Check errors, warnings, and suggestions
3. **Fix**: Address any validation issues
4. **Generate**: Click generate to create your project
5. **Download**: Get the complete project as a ZIP file

---

## Support

For more information:

- **Validation Guide**: See `VALIDATION_SYSTEM.md`
- **Quick Reference**: See `VALIDATION_QUICK_REFERENCE.md`
- **Architecture**: See `VALIDATION_ARCHITECTURE.md`

---

**Last Updated**: January 22, 2026  
**Version**: 2.0
