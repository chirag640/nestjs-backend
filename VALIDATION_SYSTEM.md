# Enhanced Validation System

## Overview

The validation system has been significantly enhanced to provide comprehensive, powerful validation that catches **all** potential issues before generation, ensuring no errors occur during project generation.

## Features

### 1. **Multi-Layer Validation**

The validation system performs checks at multiple levels:

#### Schema Validation

- Validates against Zod schema
- Checks data types, required fields, and format constraints
- Ensures basic configuration structure is correct

#### Template Validation

- Verifies all required templates exist
- Checks templates based on enabled features
- Prevents "template not found" errors during generation

#### Semantic Validation

- Validates model and relationship integrity
- Checks for naming conflicts and conventions
- Validates feature dependencies
- Ensures database/ORM compatibility

#### Feature-Specific Validation

- Authentication configuration (User model, strategies, etc.)
- OAuth provider configuration (client ID, secret, callback URL)
- Database connection string format
- File upload configuration
- Email service configuration
- CI/CD pipeline configuration
- Docker and deployment settings

### 2. **Comprehensive Error Reporting**

Errors are categorized by severity:

- **Errors** (❌): Must be fixed before generation - will cause generation to fail
- **Warnings** (⚠️): Potential issues that may cause runtime problems
- **Suggestions** (💡): Recommendations for improvements

### 3. **Smart Suggestions**

The system provides actionable suggestions:

```typescript
interface ValidationSuggestion {
  type: "fix" | "enhancement" | "warning";
  title: string;
  description: string;
  autoFixable: boolean;
  fix?: any; // The fix to apply (for future auto-fix feature)
}
```

**Example suggestions:**

- "Add User Model" - when auth is enabled without User model
- "Fix ORM Selection" - when using incompatible database/ORM combination
- "Fix Model Name" - when model names don't follow PascalCase convention
- "Add Relationships" - when multiple models exist without relationships

### 4. **Detailed Error Context**

Each error includes:

- **Path**: Exact location in configuration (e.g., `modelDefinition.models[0].name`)
- **Message**: Clear description of the issue
- **Suggestion**: How to fix the issue
- **Code**: Error code for programmatic handling (e.g., `MISSING_USER_MODEL`)

## Validation Checks

### Template Validation

✓ Core NestJS templates exist
✓ Auth templates (JWT, Local, OAuth) exist when auth is enabled
✓ Docker templates exist when Docker is enabled
✓ CI/CD templates exist for selected provider
✓ File upload templates exist when enabled
✓ Email service templates exist when enabled

### Model Validation

✓ At least one model exists
✓ Model names are unique
✓ Model names follow PascalCase convention
✓ Each model has at least one field
✓ Field names follow camelCase convention
✓ Field types are valid
✓ No conflicting field constraints

### Relationship Validation

✓ Source and target models exist
✓ Relationship types are valid
✓ Self-referential relationships are flagged
✓ Isolated models (no relationships) are flagged

### Authentication Validation

✓ User model exists when auth is enabled
✓ User model has email field
✓ User model has password field
✓ At least one auth strategy is selected
✓ JWT secret is configured (production warning)

### Database Validation

✓ Database type is selected
✓ ORM is compatible with database type

- MongoDB → Mongoose only
- PostgreSQL/MySQL → TypeORM or Prisma
  ✓ Connection string format is valid
  ✓ Connection string matches database type

### OAuth Validation

✓ At least one OAuth provider when OAuth is enabled
✓ OAuth requires auth to be enabled
✓ Client ID is provided for each provider
✓ Client secret is provided for each provider
✓ Callback URL is properly formatted

### File Upload Validation

✓ Storage type is selected
✓ Cloud storage providers have credentials warning
✓ Large file size limits are flagged
✓ File type restrictions are recommended

### CI/CD Validation

✓ E2E tests require test execution enabled
✓ Auto-deploy requires deployment environment
✓ Auto-deploy requires deployment platform
✓ Provider-specific templates exist

### Email Validation

✓ Email provider is selected
✓ Sender email is configured
✓ Email format is valid
✓ Provider credentials warning

### Feature Dependency Validation

✓ OAuth requires authentication
✓ Role-based access requires authentication
✓ CI/CD auto-deploy requires platform selection

### Naming Conflict Validation

✓ Model names don't conflict with system modules
✓ Reserved names are flagged (System, Admin, Config, etc.)

## Usage

### API Endpoint

```http
POST /api/validate-config
Content-Type: application/json

{
  "projectSetup": { ... },
  "databaseConfig": { ... },
  "modelDefinition": { ... },
  ...
}
```

### Response Format

#### Success (with warnings)

```json
{
  "valid": true,
  "errors": [],
  "warnings": [
    {
      "path": "modelDefinition.relationships",
      "message": "Multiple models defined but no relationships",
      "suggestion": "Consider adding relationships between models if they are related",
      "code": "NO_RELATIONSHIPS",
      "severity": "warning"
    }
  ],
  "suggestions": [
    {
      "type": "enhancement",
      "title": "Add Relationships",
      "description": "You have multiple models but no relationships. Most applications benefit from defining relationships between models.",
      "autoFixable": false
    }
  ],
  "summary": "✅ Configuration is valid and ready for generation"
}
```

#### Failure

```json
{
  "valid": false,
  "errors": [
    {
      "path": "authConfig",
      "message": "Authentication is enabled but no \"User\" model found",
      "suggestion": "Create a User model with fields like: email, password, firstName, lastName",
      "code": "MISSING_USER_MODEL",
      "severity": "error"
    }
  ],
  "warnings": [],
  "suggestions": [
    {
      "type": "fix",
      "title": "Add User Model",
      "description": "Authentication requires a User model. Add a User model with email and password fields.",
      "autoFixable": false
    }
  ],
  "summary": "❌ 1 error(s) found - generation will fail | 💡 1 suggestion(s) available"
}
```

## UI Components

### Validation Display

The UI displays validation results in three organized sections:

1. **Errors Section** (Red)
   - Critical issues that must be fixed
   - Shows path, message, and suggestion
   - Displays error code badge

2. **Warnings Section** (Yellow)
   - Potential issues that should be addressed
   - Shows path, message, and suggestion
   - Displays warning code badge

3. **Suggestions Section** (Blue)
   - Recommendations and enhancements
   - Shows suggestion type (fix/enhancement/warning)
   - Indicates if auto-fixable

4. **Validation Stats**
   - Summary bar showing count of errors, warnings, and suggestions
   - Color-coded indicators

## Error Codes

### Template Errors

- `TEMPLATE_NOT_FOUND`: Required template file missing

### Model Errors

- `NO_MODELS`: No models defined
- `MISSING_MODEL_NAME`: Model missing name property
- `DUPLICATE_MODEL_NAME`: Model name already exists
- `INVALID_MODEL_NAME_FORMAT`: Model name not in PascalCase
- `NO_FIELDS`: Model has no fields
- `MISSING_FIELD_NAME`: Field missing name property
- `INVALID_FIELD_NAME_FORMAT`: Field name not in camelCase
- `INVALID_FIELD_TYPE`: Unsupported field type

### Relationship Errors

- `INVALID_SOURCE_MODEL`: Source model doesn't exist
- `INVALID_TARGET_MODEL`: Target model doesn't exist
- `SELF_REFERENTIAL_RELATIONSHIP`: Model refers to itself
- `NO_RELATIONSHIPS`: Multiple models without relationships (warning)

### Authentication Errors

- `MISSING_USER_MODEL`: Auth enabled without User model
- `MISSING_EMAIL_FIELD`: User model missing email field
- `MISSING_PASSWORD_FIELD`: User model missing password field
- `NO_AUTH_STRATEGIES`: No authentication strategies selected

### Database Errors

- `MISSING_DATABASE_CONFIG`: Database configuration missing
- `INVALID_ORM_FOR_DATABASE`: ORM not compatible with database
- `INVALID_CONNECTION_STRING`: Connection string format invalid

### OAuth Errors

- `NO_OAUTH_PROVIDERS`: OAuth enabled without providers
- `MISSING_OAUTH_CLIENT_ID`: Provider missing client ID
- `MISSING_OAUTH_CLIENT_SECRET`: Provider missing client secret
- `OAUTH_REQUIRES_AUTH`: OAuth requires authentication enabled

### Feature Dependency Errors

- `RBAC_REQUIRES_AUTH`: Role-based access requires authentication
- `AUTO_DEPLOY_NO_PLATFORM`: Auto-deploy without platform selected
- `E2E_WITHOUT_TEST_EXECUTION`: E2E tests without test execution

### Other Errors

- `CONFLICTING_CONSTRAINTS`: Field has conflicting constraints
- `INVALID_EMAIL_FIELD_TYPE`: Email field not String type
- `INVALID_EMAIL_FORMAT`: Invalid email address format
- `POTENTIAL_NAMING_CONFLICT`: Model name conflicts with system
- `MISSING_EMAIL_PROVIDER`: Email enabled without provider

## Benefits

1. **Zero Generation Failures**: Catches all issues before generation starts
2. **Clear Guidance**: Provides actionable suggestions for every issue
3. **Better UX**: Users know exactly what to fix and how
4. **Faster Development**: No trial-and-error debugging
5. **Production Ready**: Validates best practices and security concerns
6. **Feature Coverage**: Validates all features comprehensively

## Future Enhancements

- [ ] Auto-fix functionality for simple issues
- [ ] Configuration migration/upgrade tool
- [ ] Real-time validation in wizard steps
- [ ] Export validation report
- [ ] Custom validation rules
- [ ] Validation plugins

## Testing

To test the enhanced validation:

1. Try configurations with intentional errors:

   ```json
   {
     "authConfig": { "enabled": true },
     "modelDefinition": { "models": [] }
   }
   ```

2. Validate without required templates (move a template temporarily)

3. Test with mismatched database/ORM combinations

4. Test with OAuth but no auth enabled

5. Test with invalid model/field names

The validation system will catch all these issues and provide detailed feedback.
