# 🚨 Error Handling & Troubleshooting Guide

## Overview

The FoundationWizard now provides **comprehensive error reporting** that helps you identify and fix issues quickly. When generation fails, you'll receive detailed information about:

- **Exact location** of the problem (configuration path, line number)
- **What went wrong** (clear description of the issue)
- **How to fix it** (actionable suggestions)
- **Current value** (what you provided)

---

## Error Display

### Error Information Structure

Each error shows:

```
┌─────────────────────────────────────────────┐
│ #1  Location                                │
│     Path: configuration → section → field   │
│                                             │
│ Issue: Clear description of what's wrong   │
│ Current value: "your-value-here"           │
│                                             │
│ 💡 Fix: Specific suggestion to resolve     │
└─────────────────────────────────────────────┘
```

### Error Categories

#### 1. **Configuration Validation Errors**

Caught before generation starts. These prevent the generation process from beginning.

**Example:**

```
Location: projectSetup → projectName
Path: projectSetup.projectName
Issue: Expected string but got number
Current value: 123
💡 Fix: Please provide a valid string value
```

#### 2. **Pre-Generation Validation Errors**

Comprehensive checks performed by the ValidationService before generation.

**Example:**

```
Location: Validation Check #1
Path: modelDefinition.models[0].name
Issue: Model name "user" must be PascalCase
Current value: "user"
💡 Fix: Use PascalCase (e.g., User, BlogPost, OrderItem)
```

#### 3. **Generation Process Errors**

Errors that occur during code generation.

**Example:**

```
Location: Template System
Path: templates/nestjs/custom-feature.ts.njk
Issue: Required template file is missing
Current value: nestjs/custom-feature.ts.njk
💡 Fix: This usually indicates a feature was selected that is not yet implemented. Try disabling advanced features.
```

---

## Common Errors & Solutions

### 🔴 Model Name Errors

#### Error: Model name must be PascalCase

**Problem:**

```json
{
  "modelDefinition": {
    "models": [
      {
        "name": "user",  // ❌ Wrong: lowercase
        "fields": [...]
      }
    ]
  }
}
```

**Solution:**

```json
{
  "modelDefinition": {
    "models": [
      {
        "name": "User",  // ✅ Correct: PascalCase
        "fields": [...]
      }
    ]
  }
}
```

**Valid Examples:**

- ✅ `User`
- ✅ `BlogPost`
- ✅ `OrderItem`
- ✅ `UserProfile`
- ❌ `user` (lowercase)
- ❌ `blog_post` (snake_case)
- ❌ `order-item` (kebab-case)

---

### 🔴 Field Name Errors

#### Error: Field name must be camelCase

**Problem:**

```json
{
  "fields": [
    {
      "name": "FirstName", // ❌ Wrong: PascalCase
      "type": "string"
    }
  ]
}
```

**Solution:**

```json
{
  "fields": [
    {
      "name": "firstName", // ✅ Correct: camelCase
      "type": "string"
    }
  ]
}
```

**Valid Examples:**

- ✅ `firstName`
- ✅ `emailAddress`
- ✅ `isActive`
- ✅ `createdAt`
- ❌ `FirstName` (PascalCase)
- ❌ `first_name` (snake_case)
- ❌ `first-name` (kebab-case)

---

### 🔴 Field Type Errors

#### Error: Invalid field type

**Problem:**

```json
{
  "fields": [
    {
      "name": "age",
      "type": "integer" // ❌ Wrong: invalid type
    }
  ]
}
```

**Solution:**

```json
{
  "fields": [
    {
      "name": "age",
      "type": "number" // ✅ Correct: valid type
    }
  ]
}
```

**Valid Field Types:**

- `"string"` - Text data
- `"number"` - Numeric values (integers and decimals)
- `"boolean"` - True/false values
- `"date"` - Date only
- `"datetime"` - Date and time
- `"string[]"` - Array of strings
- `"json"` - JSON object
- `"json[]"` - Array of JSON objects
- `"objectId"` - MongoDB ObjectId
- `"enum"` - Enumerated values (requires `values` array)

---

### 🔴 Enum Field Errors

#### Error: Enum field must have values array

**Problem:**

```json
{
  "fields": [
    {
      "name": "status",
      "type": "enum" // ❌ Missing: values array
    }
  ]
}
```

**Solution:**

```json
{
  "fields": [
    {
      "name": "status",
      "type": "enum",
      "values": ["active", "inactive", "pending"] // ✅ Added: values
    }
  ]
}
```

---

### 🔴 Relationship Errors

#### Error: Source model not found in relationships

**Problem:**

```json
{
  "relationships": [
    {
      "type": "one-to-many",
      "sourceModel": "Customer", // ❌ Model doesn't exist
      "targetModel": "Order",
      "fieldName": "orders"
    }
  ]
}
```

**Solution:**

```json
{
  "models": [
    {
      "name": "Customer",  // ✅ Define the model first
      "fields": [...]
    },
    {
      "name": "Order",
      "fields": [...]
    }
  ],
  "relationships": [
    {
      "type": "one-to-many",
      "sourceModel": "Customer",  // ✅ Now it exists
      "targetModel": "Order",
      "fieldName": "orders"
    }
  ]
}
```

**Checklist:**

- ✅ Both `sourceModel` and `targetModel` must match existing model names exactly
- ✅ Model names are case-sensitive (`User` ≠ `user`)
- ✅ Define models before referencing them in relationships

---

### 🔴 Authentication Errors

#### Error: Auth enabled but User model not found

**Problem:**

```json
{
  "authConfig": {
    "enabled": true,  // ❌ Auth enabled
    "method": "jwt"
  },
  "modelDefinition": {
    "models": [
      {
        "name": "Customer",  // ❌ No User model
        "fields": [...]
      }
    ]
  }
}
```

**Solution:**

```json
{
  "authConfig": {
    "enabled": true,
    "method": "jwt"
  },
  "modelDefinition": {
    "models": [
      {
        "name": "User", // ✅ User model added
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
          }
        ]
      }
    ]
  }
}
```

**Requirements when auth is enabled:**

- ✅ Must have a model named exactly `User`
- ✅ User model must have an `email` field (string, unique)
- ✅ User model must have a `password` field (string, required)

---

### 🔴 OAuth Errors

#### Error: OAuth enabled but authentication is disabled

**Problem:**

```json
{
  "authConfig": {
    "enabled": false  // ❌ Auth disabled
  },
  "oauthConfig": {
    "enabled": true,  // ❌ OAuth requires auth
    "providers": [...]
  }
}
```

**Solution:**

```json
{
  "authConfig": {
    "enabled": true,  // ✅ Enable auth first
    "method": "jwt"
  },
  "oauthConfig": {
    "enabled": true,  // ✅ Now OAuth can be enabled
    "providers": [...]
  }
}
```

---

### 🔴 Required Field Errors

#### Error: Required field is missing

**Problem:**

```json
{
  "projectSetup": {
    "projectName": "my-api"
    // ❌ Missing: description, author, license, etc.
  }
}
```

**Solution:**

```json
{
  "projectSetup": {
    "projectName": "my-api",
    "description": "My awesome API", // ✅ Added
    "author": "John Doe", // ✅ Added
    "license": "MIT", // ✅ Added
    "nodeVersion": "20", // ✅ Added
    "packageManager": "npm" // ✅ Added
  }
}
```

---

### 🔴 Template Not Found Errors

#### Error: Required template file is missing

**Problem:**
This usually means a feature was selected that isn't fully implemented yet.

**Example Error:**

```
Location: Template System
Path: templates/nestjs/custom-feature.ts.njk
Issue: Required template file is missing: nestjs/custom-feature.ts.njk
💡 Fix: Try disabling advanced features
```

**Solution:**

1. Go back to **Step 5: Feature Selection**
2. Disable advanced features one by one:
   - Try disabling `queues`
   - Try disabling `s3Upload`
   - Try disabling `sonarQube`
   - Try setting `encryptionStrategy` to `"disabled"`
3. Try generating again

---

## Understanding Error Paths

Error paths use the `→` arrow to show the hierarchy:

```
projectSetup → projectName
```

Means: The error is in `config.projectSetup.projectName`

```
modelDefinition → models → 0 → name
```

Means: The error is in the first model's name (`config.modelDefinition.models[0].name`)

```
modelDefinition → relationships → 2 → targetModel
```

Means: The error is in the third relationship's targetModel

---

## How to Use Error Information

### Step 1: Read the Error Location

This tells you **where** in your configuration the problem is.

### Step 2: Read the Issue

This tells you **what** is wrong.

### Step 3: Check Current Value

This shows you **what you provided**.

### Step 4: Apply the Fix

Follow the **💡 Fix** suggestion to resolve the issue.

### Step 5: Retry

Click **"Retry Generation"** to try again.

---

## Using the Validation Button

**Before generating**, always click the **"Validate"** button in Step 0 (Manual Config) to catch errors early.

The validator checks:

- ✅ Schema structure
- ✅ Template availability
- ✅ Model definitions
- ✅ Relationships
- ✅ Authentication setup
- ✅ OAuth configuration
- ✅ Database compatibility
- ✅ Feature dependencies
- ✅ Naming conventions
- ✅ Field types
- ✅ Required fields

It provides three types of feedback:

- 🔴 **Errors**: Must fix before generation
- 🟡 **Warnings**: Should review but won't block generation
- 🔵 **Suggestions**: Optional improvements

---

## Best Practices

### 1. Validate Early

Run validation after importing or creating your JSON config.

### 2. Fix Errors First

Address all red (error) items before trying to generate.

### 3. Review Warnings

Yellow (warning) items won't block generation but should be reviewed.

### 4. Use Suggestions

Blue (suggestion) items help improve your configuration.

### 5. Start Simple

If you get many errors:

1. Start with a minimal configuration
2. Test generation
3. Add features incrementally

### 6. Check Examples

Refer to the complete examples in `JSON_CONFIGURATION_GUIDE.md`:

- Minimal Blog API
- Full-Featured E-commerce API
- Health Records System

### 7. Use JSON Schema

Your IDE can provide autocomplete and validation if you use the schema.

---

## Error Severity Levels

| Level      | Symbol | Meaning         | Action Required            |
| ---------- | ------ | --------------- | -------------------------- |
| Error      | 🔴     | Critical issue  | Must fix before generation |
| Warning    | 🟡     | Potential issue | Should review              |
| Suggestion | 🔵     | Improvement     | Optional                   |
| Success    | ✅     | No issues       | Ready to generate          |

---

## Quick Troubleshooting Checklist

Before generating, verify:

- [ ] All model names are **PascalCase**
- [ ] All field names are **camelCase**
- [ ] All field types are **valid** (string, number, boolean, etc.)
- [ ] All **required fields** are filled
- [ ] All relationship `sourceModel` and `targetModel` **exist**
- [ ] If auth is enabled, **User model exists** with email and password
- [ ] If OAuth is enabled, **auth is also enabled**
- [ ] Project name is **lowercase-with-hyphens**
- [ ] Enum fields have **values arrays**
- [ ] Connection string matches **database type**

---

## Getting Help

If you're still stuck after following this guide:

1. **Check the validation output** - It provides detailed analysis
2. **Review example configurations** in `JSON_CONFIGURATION_GUIDE.md`
3. **Compare with working examples** - See what's different
4. **Start with minimal config** - Add features gradually
5. **Check console logs** - In development mode, technical details are included

---

## Technical Details (For Developers)

### Error Response Structure

```typescript
{
  error: string;           // Error title
  message: string;         // Error message
  errors: [{              // Array of detailed errors
    location: string;      // Where the error occurred
    path: string;          // Configuration path
    issue: string;         // What went wrong
    suggestion: string;    // How to fix it
    value?: string;        // Current value (if applicable)
    code?: string;         // Error code (if applicable)
  }];
  warnings?: any[];       // Array of warnings
  hint?: string;          // General hint
  technicalDetails?: {    // Only in development mode
    stack: string;
    timestamp: string;
  };
}
```

### Error Detection Points

1. **Schema Validation** (routes.ts)
   - Zod schema validation
   - Type checking
   - Required field verification

2. **Pre-Generation Validation** (validationService.ts)
   - Template availability
   - Model structure
   - Relationships
   - Feature dependencies

3. **Generation Process** (generator.ts)
   - Template rendering
   - File generation
   - Code formatting

---

**Last Updated**: January 22, 2026  
**Version**: 2.0
