# Sprint 2 Testing Guide: Model Generation & CRUD Endpoints

## Overview

This guide covers comprehensive testing for Sprint 2's Mongoose code generation features, including model builder UI validation, code generation, and CRUD endpoint verification.

## Prerequisites

### Development Environment

- Node.js 18+ installed
- MongoDB installed and running (or Docker with MongoDB image)
- VS Code with REST Client extension (or Postman/Insomnia)
- Terminal access

### Project Setup

```bash
cd FoundationWizard
npm install
npm run dev  # Start development server on http://localhost:5000
```

## Test Suite 1: Model Builder UI

### Test 1.1: Create Basic Model

**Objective**: Verify basic model creation functionality

**Steps**:

1. Navigate to Step 3 (Model Builder)
2. Click "Add Model" button
3. Enter model name: `User`
4. Verify model appears in list
5. Click on "User" model
6. Click "Add Field" button
7. Add field with:
   - Name: `email`
   - Type: `string`
   - Required: ✓
   - Unique: ✓

**Expected Result**:

- Model "User" created successfully
- Field "email" appears in fields list
- React Flow diagram shows User node with email field

### Test 1.2: Field Type Validation

**Objective**: Ensure all field types are supported

**Steps**:

1. Create new model "Product"
2. Add fields with each type:
   - `name` (string)
   - `price` (number)
   - `inStock` (boolean)
   - `releaseDate` (date)
   - `categoryId` (objectId)
3. Save model

**Expected Result**:

- All field types accepted
- No validation errors
- Types displayed correctly in UI

### Test 1.3: Field Name Validation (camelCase)

**Objective**: Enforce camelCase naming for fields

**Steps**:

1. Create model "TestModel"
2. Try adding field with name: `FirstName` (PascalCase)
3. Observe validation error
4. Change to `firstName` (camelCase)
5. Save field

**Expected Result**:

- `FirstName` rejected with error message
- `firstName` accepted and saved

### Test 1.4: Model Name Validation (PascalCase)

**Objective**: Enforce PascalCase naming for models

**Steps**:

1. Try creating model with name: `userProfile` (camelCase)
2. Observe validation error
3. Change to `UserProfile` (PascalCase)
4. Save model

**Expected Result**:

- `userProfile` rejected with error message
- `UserProfile` accepted and saved

### Test 1.5: Reserved Field Names

**Objective**: Block reserved Mongoose field names

**Steps**:

1. Create model "ReservedTest"
2. Try adding field with name: `_id`
3. Try adding field with name: `__v`
4. Try adding field with name: `constructor`
5. Try adding field with name: `validFieldName`

**Expected Result**:

- `_id`, `__v`, `constructor` rejected with error
- `validFieldName` accepted

### Test 1.6: Field Validation Rules

**Objective**: Test validation rule configuration

**Steps**:

1. Create model "ValidationTest"
2. Add string field `username`:
   - minLength: 3
   - maxLength: 20
   - pattern: `^[a-zA-Z0-9]+$`
3. Add number field `age`:
   - min: 18
   - max: 120
4. Add string field `status`:
   - enum: ["active", "inactive", "pending"]

**Expected Result**:

- All validation rules saved correctly
- Rules displayed in field details

### Test 1.7: Timestamps Toggle

**Objective**: Verify timestamps functionality

**Steps**:

1. Create model "TimestampTest"
2. Enable timestamps toggle
3. Add field `title` (string)
4. Save model

**Expected Result**:

- Timestamps enabled indicator shown
- Generated code will include `{ timestamps: true }`

### Test 1.8: Delete Model

**Objective**: Test model deletion

**Steps**:

1. Create model "DeleteMe"
2. Add field `test` (string)
3. Click delete icon on model
4. Confirm deletion

**Expected Result**:

- Model removed from list
- React Flow diagram updated
- No errors in console

### Test 1.9: Delete Field

**Objective**: Test field deletion

**Steps**:

1. Create model "FieldDeleteTest"
2. Add fields: `field1`, `field2`, `field3`
3. Delete `field2`

**Expected Result**:

- `field2` removed from list
- `field1` and `field3` remain
- Model diagram updated

### Test 1.10: Edit Field

**Objective**: Test field modification

**Steps**:

1. Create model "EditTest"
2. Add field `status` (string, not required)
3. Click edit on `status` field
4. Change type to `boolean`
5. Enable required checkbox
6. Save changes

**Expected Result**:

- Field type changed to boolean
- Required flag updated
- Changes reflected in UI

## Test Suite 2: Code Generation

### Test 2.1: Generate Project with Single Model

**Objective**: Verify basic code generation

**Configuration**:

```json
{
  "projectName": "test-single-model",
  "database": "mongodb",
  "models": [
    {
      "name": "User",
      "fields": [
        { "name": "email", "type": "string", "required": true, "unique": true },
        { "name": "firstName", "type": "string", "required": true },
        { "name": "lastName", "type": "string", "required": true }
      ],
      "timestamps": true
    }
  ]
}
```

**Steps**:

1. Complete Steps 1-5 with above configuration
2. Navigate to Step 6 (Review)
3. Click "Generate & Download"
4. Wait for ZIP download
5. Extract ZIP to `test-single-model/`

**Expected Result**:

- ZIP file downloads successfully
- Extracted structure contains:
  ```
  test-single-model/
  ├── src/
  │   ├── main.ts
  │   ├── app.module.ts
  │   └── modules/
  │       └── user/
  │           ├── user.schema.ts
  │           ├── user.repository.ts
  │           ├── user.service.ts
  │           ├── user.controller.ts
  │           ├── user.module.ts
  │           └── dtos/
  │               ├── create-user.dto.ts
  │               ├── update-user.dto.ts
  │               └── user-output.dto.ts
  ├── package.json
  ├── tsconfig.json
  └── README.md
  ```

### Test 2.2: Verify Generated Schema

**Objective**: Check schema file correctness

**Steps**:

1. Open `src/modules/user/user.schema.ts`
2. Verify content:

**Expected Content**:

```typescript
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
```

**Validation**:

- Correct imports
- `@Schema({ timestamps: true })` decorator
- All fields with correct decorators
- Schema factory export

### Test 2.3: Verify Generated DTOs

**Objective**: Check DTO file correctness

**Files to Check**:

- `dtos/create-user.dto.ts`
- `dtos/update-user.dto.ts`
- `dtos/user-output.dto.ts`

**Expected CreateUserDto**:

```typescript
import { IsEmail, IsString, IsNotEmpty } from "class-validator";

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;
}
```

**Expected UpdateUserDto**:

```typescript
import { IsEmail, IsString, IsOptional } from "class-validator";

export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;
}
```

**Expected UserOutputDto**:

```typescript
export class UserOutputDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Test 2.4: Verify App Module Imports

**Objective**: Ensure models are imported in app.module

**Steps**:

1. Open `src/app.module.ts`
2. Verify imports section

**Expected Content**:

```typescript
import { UserModule } from "./modules/user/user.module";

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGODB_URI),
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

### Test 2.5: TypeScript Compilation

**Objective**: Verify generated code compiles without errors

**Steps**:

```bash
cd test-single-model
npm install
npm run build
```

**Expected Result**:

- No TypeScript errors
- Build succeeds
- `dist/` folder created with compiled JS

### Test 2.6: Generate Project with Multiple Models

**Objective**: Test generation with complex structure

**Configuration**:

```json
{
  "projectName": "test-multi-model",
  "database": "mongodb",
  "models": [
    {
      "name": "User",
      "fields": [
        { "name": "email", "type": "string", "required": true, "unique": true },
        { "name": "role", "type": "string", "enum": ["admin", "user"] }
      ],
      "timestamps": true
    },
    {
      "name": "Product",
      "fields": [
        { "name": "name", "type": "string", "required": true },
        { "name": "price", "type": "number", "required": true, "min": 0 },
        { "name": "inStock", "type": "boolean", "defaultValue": true }
      ],
      "timestamps": true
    },
    {
      "name": "Order",
      "fields": [
        { "name": "userId", "type": "objectId", "required": true },
        { "name": "productId", "type": "objectId", "required": true },
        { "name": "quantity", "type": "number", "required": true, "min": 1 }
      ],
      "timestamps": true
    }
  ]
}
```

**Steps**:

1. Generate project with above config
2. Extract ZIP
3. Verify structure

**Expected Result**:

```
test-multi-model/
└── src/
    └── modules/
        ├── user/
        │   └── (8 files)
        ├── product/
        │   └── (8 files)
        └── order/
            └── (8 files)
```

### Test 2.7: Verify Naming Conventions

**Objective**: Check file naming consistency

**Steps**:

1. Open generated project
2. Verify file names follow kebab-case:
   - `user.schema.ts`
   - `user.repository.ts`
   - `create-user.dto.ts`
3. Verify class names follow PascalCase:
   - `class User`
   - `class UserRepository`
   - `class CreateUserDto`

**Expected Result**:

- All file names in kebab-case
- All class names in PascalCase
- Consistent naming across all models

## Test Suite 3: Runtime Testing

### Test 3.1: Start Generated Application

**Objective**: Verify generated app starts successfully

**Steps**:

```bash
cd test-single-model
cp .env.example .env
# Edit .env with MongoDB URI
npm run start:dev
```

**Expected Result**:

- Application starts without errors
- Console shows: `Application is running on: http://localhost:3000`
- MongoDB connection successful

### Test 3.2: Test POST Endpoint (Create)

**Objective**: Create new user via API

**Request**:

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

**Expected Response** (201 Created):

```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "john.doe@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z"
}
```

### Test 3.3: Test POST Validation (Required Fields)

**Objective**: Verify required field validation

**Request**:

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John"
  }'
```

**Expected Response** (400 Bad Request):

```json
{
  "statusCode": 400,
  "message": [
    "email should not be empty",
    "email must be an email",
    "lastName should not be empty"
  ],
  "error": "Bad Request"
}
```

### Test 3.4: Test POST Validation (Unique Constraint)

**Objective**: Verify unique email enforcement

**Request 1** (Create user):

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "duplicate@example.com",
    "firstName": "First",
    "lastName": "User"
  }'
```

**Request 2** (Duplicate email):

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "duplicate@example.com",
    "firstName": "Second",
    "lastName": "User"
  }'
```

**Expected Response for Request 2** (409 Conflict or 500):

```json
{
  "statusCode": 500,
  "message": "E11000 duplicate key error",
  "error": "Internal Server Error"
}
```

### Test 3.5: Test GET Endpoint (List All)

**Objective**: Retrieve all users

**Request**:

```bash
curl http://localhost:3000/users
```

**Expected Response** (200 OK):

```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  },
  {
    "id": "507f1f77bcf86cd799439012",
    "email": "jane.smith@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "createdAt": "2025-01-15T10:35:00.000Z",
    "updatedAt": "2025-01-15T10:35:00.000Z"
  }
]
```

### Test 3.6: Test GET/:id Endpoint (Find One)

**Objective**: Retrieve single user by ID

**Request**:

```bash
curl http://localhost:3000/users/507f1f77bcf86cd799439011
```

**Expected Response** (200 OK):

```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "john.doe@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z"
}
```

### Test 3.7: Test GET/:id with Invalid ID

**Objective**: Verify error handling for non-existent ID

**Request**:

```bash
curl http://localhost:3000/users/507f1f77bcf86cd799439099
```

**Expected Response** (404 Not Found):

```json
{
  "statusCode": 404,
  "message": "User not found",
  "error": "Not Found"
}
```

### Test 3.8: Test PATCH/:id Endpoint (Update)

**Objective**: Update user fields

**Request**:

```bash
curl -X PATCH http://localhost:3000/users/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jonathan"
  }'
```

**Expected Response** (200 OK):

```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "john.doe@example.com",
  "firstName": "Jonathan",
  "lastName": "Doe",
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:40:00.000Z"
}
```

### Test 3.9: Test PATCH Validation

**Objective**: Verify update validation rules

**Request**:

```bash
curl -X PATCH http://localhost:3000/users/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email"
  }'
```

**Expected Response** (400 Bad Request):

```json
{
  "statusCode": 400,
  "message": ["email must be an email"],
  "error": "Bad Request"
}
```

### Test 3.10: Test DELETE/:id Endpoint

**Objective**: Delete user

**Request**:

```bash
curl -X DELETE http://localhost:3000/users/507f1f77bcf86cd799439011
```

**Expected Response** (204 No Content):

- Empty body
- HTTP status 204

**Verification**:

```bash
curl http://localhost:3000/users/507f1f77bcf86cd799439011
# Should return 404 Not Found
```

## Test Suite 4: Advanced Validation

### Test 4.1: String Length Validation

**Configuration**:

```json
{
  "name": "username",
  "type": "string",
  "required": true,
  "minLength": 3,
  "maxLength": 20
}
```

**Test Cases**:

```bash
# Too short (2 characters)
curl -X POST http://localhost:3000/users \
  -d '{"username": "ab"}' # Expected: 400 Error

# Valid (5 characters)
curl -X POST http://localhost:3000/users \
  -d '{"username": "alice"}' # Expected: 201 Created

# Too long (21 characters)
curl -X POST http://localhost:3000/users \
  -d '{"username": "verylongusernamethat"}' # Expected: 400 Error
```

### Test 4.2: Number Range Validation

**Configuration**:

```json
{
  "name": "age",
  "type": "number",
  "min": 18,
  "max": 120
}
```

**Test Cases**:

```bash
# Below minimum
curl -X POST http://localhost:3000/users \
  -d '{"age": 16}' # Expected: 400 Error

# Valid
curl -X POST http://localhost:3000/users \
  -d '{"age": 25}' # Expected: 201 Created

# Above maximum
curl -X POST http://localhost:3000/users \
  -d '{"age": 150}' # Expected: 400 Error
```

### Test 4.3: Enum Validation

**Configuration**:

```json
{
  "name": "role",
  "type": "string",
  "enum": ["admin", "user", "guest"]
}
```

**Test Cases**:

```bash
# Valid enum value
curl -X POST http://localhost:3000/users \
  -d '{"role": "admin"}' # Expected: 201 Created

# Invalid enum value
curl -X POST http://localhost:3000/users \
  -d '{"role": "superadmin"}' # Expected: 400 Error
```

### Test 4.4: Pattern Validation

**Configuration**:

```json
{
  "name": "username",
  "type": "string",
  "pattern": "^[a-zA-Z0-9_]+$"
}
```

**Test Cases**:

```bash
# Valid pattern
curl -X POST http://localhost:3000/users \
  -d '{"username": "john_doe123"}' # Expected: 201 Created

# Invalid pattern (special characters)
curl -X POST http://localhost:3000/users \
  -d '{"username": "john@doe!"}' # Expected: 400 Error
```

### Test 4.5: Timestamps Verification

**Objective**: Verify automatic timestamp fields

**Steps**:

1. Create user
2. Check response for `createdAt` and `updatedAt`
3. Update user
4. Verify `updatedAt` changed, `createdAt` unchanged

**Expected Behavior**:

- `createdAt`: Set on creation, never changes
- `updatedAt`: Set on creation, updates on every modification

## Test Suite 5: Multi-Model Integration

### Test 5.1: Generate Three Related Models

**Configuration**:

- User (email, role)
- Product (name, price)
- Order (userId, productId, quantity)

**Steps**:

1. Generate project with all three models
2. Start application
3. Create test data:

   ```bash
   # Create user
   USER_ID=$(curl -X POST http://localhost:3000/users \
     -d '{"email":"test@example.com","role":"user"}' \
     | jq -r '.id')

   # Create product
   PRODUCT_ID=$(curl -X POST http://localhost:3000/products \
     -d '{"name":"Widget","price":19.99}' \
     | jq -r '.id')

   # Create order
   curl -X POST http://localhost:3000/orders \
     -d "{\"userId\":\"$USER_ID\",\"productId\":\"$PRODUCT_ID\",\"quantity\":5}"
   ```

**Expected Result**:

- All three endpoints functional
- Order created with valid user and product IDs

### Test 5.2: Verify Independent CRUD Operations

**Objective**: Ensure each model works independently

**Steps**:

1. Perform CRUD operations on User model
2. Perform CRUD operations on Product model
3. Perform CRUD operations on Order model
4. Verify no cross-model interference

**Expected Result**:

- Each model maintains independent state
- No errors across models

## Performance Tests

### Test P.1: Bulk Create Performance

**Objective**: Test creation of 100 users

**Script**:

```bash
for i in {1..100}; do
  curl -X POST http://localhost:3000/users \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"user$i@example.com\",\"firstName\":\"User\",\"lastName\":\"$i\"}"
done
```

**Expected Result**:

- All 100 users created successfully
- Average response time < 100ms
- No memory leaks

### Test P.2: Query Performance

**Objective**: Test listing 100+ users

**Request**:

```bash
time curl http://localhost:3000/users
```

**Expected Result**:

- Response time < 200ms
- All users returned
- No pagination errors (if implemented)

## Regression Tests

### Test R.1: Regenerate Same Config

**Objective**: Verify idempotent generation

**Steps**:

1. Generate project with config A
2. Note file checksums
3. Generate project with config A again
4. Compare checksums

**Expected Result**:

- Identical file contents
- Consistent formatting

### Test R.2: Update Existing Model

**Objective**: Test project regeneration with model changes

**Steps**:

1. Generate project with User model (2 fields)
2. Add 3 more fields to User model
3. Regenerate project
4. Verify new fields in schema

**Expected Result**:

- New fields present in schema
- Existing fields unchanged
- DTOs updated

## Edge Cases

### Test E.1: Empty Model (No Fields)

**Steps**:

1. Create model with no fields
2. Attempt generation

**Expected Result**:

- Validation error or warning
- Schema generated with only timestamps

### Test E.2: Model with 50+ Fields

**Steps**:

1. Create model with 50 fields
2. Generate project
3. Test CRUD operations

**Expected Result**:

- Generation succeeds
- All fields in DTOs
- No performance degradation

### Test E.3: Special Characters in Model Name

**Steps**:

1. Try creating model: `User-Profile`
2. Try creating model: `User_Profile`
3. Try creating model: `User Profile`

**Expected Result**:

- All rejected with validation error
- Only alphanumeric PascalCase accepted

## Automated Test Script

```bash
#!/bin/bash
# Sprint 2 Automated Test Suite

set -e

echo "🧪 Sprint 2 Testing Suite"
echo "=========================="

# Test 1: Generate project
echo "📦 Test 1: Generating project..."
curl -X POST http://localhost:5000/api/generate \
  -H "Content-Type: application/json" \
  -d @test-config.json \
  -o test-project.zip

# Test 2: Extract and build
echo "🔨 Test 2: Building project..."
unzip -q test-project.zip -d test-project
cd test-project
npm install --silent
npm run build

# Test 3: Start server
echo "🚀 Test 3: Starting server..."
npm run start:dev &
SERVER_PID=$!
sleep 5

# Test 4: CRUD operations
echo "✅ Test 4: Testing CRUD endpoints..."

# Create
USER_ID=$(curl -s -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","firstName":"Test","lastName":"User"}' \
  | jq -r '.id')

echo "Created user: $USER_ID"

# Read
curl -s http://localhost:3000/users/$USER_ID | jq

# Update
curl -s -X PATCH http://localhost:3000/users/$USER_ID \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Updated"}' | jq

# Delete
curl -s -X DELETE http://localhost:3000/users/$USER_ID

echo "🎉 All tests passed!"

# Cleanup
kill $SERVER_PID
cd ..
rm -rf test-project test-project.zip
```

## Test Report Template

```markdown
# Sprint 2 Test Report

**Date**: YYYY-MM-DD
**Tester**: [Name]
**Environment**: [OS, Node version, MongoDB version]

## Test Results Summary

- **Total Tests**: XX
- **Passed**: XX
- **Failed**: XX
- **Skipped**: XX

## Failed Tests

| Test ID | Description       | Expected  | Actual    | Severity |
| ------- | ----------------- | --------- | --------- | -------- |
| 3.4     | Unique constraint | 409 Error | 500 Error | Medium   |

## Performance Metrics

- **Generation Time**: XX ms
- **Build Time**: XX s
- **Average API Response**: XX ms

## Notes

[Additional observations]

## Sign-off

- [ ] All critical tests passed
- [ ] Performance acceptable
- [ ] Ready for production
```

---

**Document Version**: 1.0  
**Last Updated**: 2025-11-15 **Status**: Ready for Testing
