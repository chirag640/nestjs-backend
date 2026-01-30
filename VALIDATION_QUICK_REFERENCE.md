# 🚀 Validation System - Quick Reference

## ⚡ Quick Start

### Using the UI

1. Navigate to **Step 0: Import Configuration**
2. Paste your JSON configuration
3. Click **"Validate"** button
4. Review results in 3 sections:
   - ❌ **Errors** (must fix)
   - ⚠️ **Warnings** (should fix)
   - 💡 **Suggestions** (recommendations)

### Using the API

```bash
curl -X POST http://localhost:5000/api/validate-config \
  -H "Content-Type: application/json" \
  -d @config.json
```

## 🔍 What Gets Validated

| Category          | What's Checked                   | Example Issues Caught           |
| ----------------- | -------------------------------- | ------------------------------- |
| **Templates**     | Files exist for enabled features | "Template not found" errors     |
| **Models**        | Names, fields, types, formats    | Duplicate names, missing fields |
| **Relationships** | Source/target models exist       | Broken references               |
| **Auth**          | User model, strategies, fields   | Missing User model              |
| **Database**      | Type, ORM compatibility          | MongoDB with TypeORM            |
| **OAuth**         | Providers, credentials           | Missing client ID               |
| **Fields**        | Types, constraints, naming       | Invalid field types             |
| **File Upload**   | Storage, limits, types           | Missing restrictions            |
| **Deployment**    | Platform, Docker, config         | Missing credentials             |
| **CI/CD**         | Pipeline, tests, deploy          | E2E without tests               |
| **Email**         | Provider, sender, format         | Invalid email format            |
| **Naming**        | Reserved words, conflicts        | "System" model name             |
| **Dependencies**  | Feature requirements             | OAuth without auth              |

## 📋 Common Error Fixes

### ❌ MISSING_USER_MODEL

**Error**: Authentication is enabled but no "User" model found  
**Fix**: Add a User model with email and password fields:

```json
{
  "name": "User",
  "fields": [
    { "name": "email", "type": "String", "required": true, "unique": true },
    { "name": "password", "type": "String", "required": true }
  ]
}
```

### ❌ INVALID_ORM_FOR_DATABASE

**Error**: MongoDB cannot use TypeORM  
**Fix**: Change ORM to Mongoose:

```json
{
  "databaseConfig": {
    "databaseType": "MongoDB",
    "orm": "Mongoose"
  }
}
```

### ❌ TEMPLATE_NOT_FOUND

**Error**: Required template file missing  
**Fix**: Ensure all template files exist in `server/templates/`

### ❌ OAUTH_REQUIRES_AUTH

**Error**: OAuth enabled but authentication is disabled  
**Fix**: Enable authentication:

```json
{
  "authConfig": {
    "enabled": true,
    "oauth": { "enabled": true }
  }
}
```

### ⚠️ NO_RELATIONSHIPS

**Warning**: Multiple models but no relationships  
**Fix**: Add relationships between models:

```json
{
  "relationships": [
    {
      "sourceModel": "User",
      "targetModel": "Post",
      "type": "one-to-many",
      "sourceField": "posts",
      "targetField": "author"
    }
  ]
}
```

### ⚠️ INVALID_MODEL_NAME_FORMAT

**Warning**: Model name "user_account" not in PascalCase  
**Fix**: Use PascalCase: "UserAccount"

## 🎯 Error Severity Guide

### 🔴 Errors (Blocks Generation)

- Missing required models
- Invalid ORM/database combination
- Missing templates
- Invalid feature dependencies
- Missing required configuration

**Action**: Must fix before generation

### 🟡 Warnings (Allows Generation)

- No relationships between models
- Invalid naming conventions
- Missing optional configuration
- Potential runtime issues
- Best practice violations

**Action**: Should fix for better quality

### 🔵 Info (Informational)

- Configuration recommendations
- Enhancement suggestions
- Optional improvements

**Action**: Consider for optimization

## 📊 Response Format

```typescript
interface ValidationResult {
  valid: boolean; // Can proceed with generation?
  errors: ValidationError[]; // Critical issues
  warnings: ValidationError[]; // Potential problems
  suggestions: ValidationSuggestion[]; // Recommendations
  summary: string; // Overall status message
}

interface ValidationError {
  path: string; // Location: "authConfig.strategies"
  message: string; // What's wrong
  suggestion: string; // How to fix
  code: string; // Error code: "MISSING_USER_MODEL"
  severity: "error" | "warning" | "info";
}

interface ValidationSuggestion {
  type: "fix" | "enhancement" | "warning";
  title: string; // "Add User Model"
  description: string; // Detailed explanation
  autoFixable: boolean; // Can be auto-fixed?
}
```

## 🔧 Error Codes Reference

### Model Errors

- `NO_MODELS` - No models defined
- `MISSING_MODEL_NAME` - Model without name
- `DUPLICATE_MODEL_NAME` - Model name already exists
- `INVALID_MODEL_NAME_FORMAT` - Not PascalCase
- `NO_FIELDS` - Model has no fields
- `MISSING_FIELD_NAME` - Field without name
- `INVALID_FIELD_NAME_FORMAT` - Not camelCase
- `INVALID_FIELD_TYPE` - Unsupported field type

### Relationship Errors

- `INVALID_SOURCE_MODEL` - Source model doesn't exist
- `INVALID_TARGET_MODEL` - Target model doesn't exist
- `SELF_REFERENTIAL_RELATIONSHIP` - Model refers to itself
- `NO_RELATIONSHIPS` - No relationships defined

### Auth Errors

- `MISSING_USER_MODEL` - No User model for auth
- `MISSING_EMAIL_FIELD` - User model missing email
- `MISSING_PASSWORD_FIELD` - User model missing password
- `NO_AUTH_STRATEGIES` - No strategies selected

### Database Errors

- `MISSING_DATABASE_CONFIG` - No database config
- `INVALID_ORM_FOR_DATABASE` - Incompatible ORM
- `INVALID_CONNECTION_STRING` - Wrong format

### OAuth Errors

- `NO_OAUTH_PROVIDERS` - No providers configured
- `MISSING_OAUTH_CLIENT_ID` - Missing client ID
- `MISSING_OAUTH_CLIENT_SECRET` - Missing secret
- `OAUTH_REQUIRES_AUTH` - OAuth needs auth enabled

### Feature Errors

- `RBAC_REQUIRES_AUTH` - RBAC needs auth
- `AUTO_DEPLOY_NO_PLATFORM` - No platform selected
- `E2E_WITHOUT_TEST_EXECUTION` - E2E without tests
- `TEMPLATE_NOT_FOUND` - Template file missing

### Other Errors

- `CONFLICTING_CONSTRAINTS` - Field constraint conflict
- `INVALID_EMAIL_FIELD_TYPE` - Email not String
- `INVALID_EMAIL_FORMAT` - Invalid email
- `POTENTIAL_NAMING_CONFLICT` - Name conflicts with system
- `MISSING_EMAIL_PROVIDER` - No email provider

## 💡 Best Practices

### 1. Always Validate Before Generating

```bash
# Validate first
curl -X POST /api/validate-config -d @config.json

# If valid, then generate
curl -X POST /api/generate?mode=download -d @config.json
```

### 2. Fix Errors in Order

1. Fix critical errors first (🔴)
2. Address warnings next (🟡)
3. Consider suggestions last (💡)

### 3. Use Suggestions

- Suggestions provide actionable fixes
- Look for "Auto-fixable" badge
- Follow the recommendation steps

### 4. Check Summary

```
✅ Configuration is valid and ready for generation
   → Safe to generate

❌ 3 error(s) found - generation will fail
   → Must fix errors first

⚠️  2 warning(s) found
   → Can generate but might have issues
```

## 🎨 UI Color Codes

- 🔴 **Red** = Errors (must fix)
- 🟡 **Yellow** = Warnings (should fix)
- 🔵 **Blue** = Suggestions (consider)
- 🟢 **Green** = Valid (ready to go)

## 📞 Support

If validation fails unexpectedly:

1. Check error code in documentation
2. Read the suggestion message
3. Verify configuration structure
4. Check template files exist
5. Review feature dependencies

## 🔗 Related Documentation

- **VALIDATION_SYSTEM.md** - Complete system documentation
- **VALIDATION_ARCHITECTURE.md** - Technical architecture
- **VALIDATION_ENHANCEMENT_SUMMARY.md** - What's new

## ⚙️ Configuration Tips

### Valid Database/ORM Combinations

✅ PostgreSQL + TypeORM  
✅ PostgreSQL + Prisma  
✅ MySQL + TypeORM  
✅ MySQL + Prisma  
✅ MongoDB + Mongoose  
❌ MongoDB + TypeORM  
❌ PostgreSQL + Mongoose

### Required Fields for Auth

- User model with:
  - `email` field (String, unique)
  - `password` field (String)
- At least one strategy: jwt, local, api-key, or oauth2

### OAuth Requirements

- Authentication must be enabled
- At least one provider configured
- Each provider needs:
  - Client ID
  - Client secret
  - Callback URL

### Model Naming

- Models: **PascalCase** (User, BlogPost, UserProfile)
- Fields: **camelCase** (firstName, emailAddress, createdAt)
- Avoid: Reserved names (System, Admin, Config)

## 🚦 Validation States

```
🟢 VALID
├─ No errors
├─ May have warnings
└─ Safe to generate

🟡 VALID WITH WARNINGS
├─ No errors
├─ Has warnings
└─ Can generate (with caution)

🔴 INVALID
├─ Has errors
├─ May have warnings/suggestions
└─ Cannot generate (must fix errors)
```

---

**Last Updated**: January 2026  
**Version**: 2.0 (Enhanced Validation System)
