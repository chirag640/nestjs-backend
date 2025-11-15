# Sprint 2: Mongoose Code Generation with Model Builder

## Overview

Sprint 2 extends the Foundation Wizard with advanced model definition capabilities and full Mongoose CRUD module generation. Users can now visually design data models in Step 3, define field-level validation, and generate production-ready NestJS modules with complete CRUD operations.

## Features Implemented

### 1. Enhanced Schema Validation (`shared/schema.ts`)

- **New Field Types**: `string`, `number`, `boolean`, `date`, `objectId`
- **Validation Rules**: `minLength`, `maxLength`, `min`, `max`, `pattern`, `enum`
- **Field Properties**: `required`, `unique`, `indexed`, `defaultValue`
- **Model Properties**: `timestamps` flag for automatic createdAt/updatedAt
- **Naming Validation**: camelCase for fields, PascalCase for models

```typescript
const fieldSchema = z.object({
  id: z.string(),
  name: z
    .string()
    .regex(/^[a-z][a-zA-Z0-9]*$/, "Field names must be camelCase"),
  type: z.enum(["string", "number", "boolean", "date", "objectId"]),
  required: z.boolean().optional(),
  unique: z.boolean().optional(),
  indexed: z.boolean().optional(),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().optional(),
  enum: z.array(z.string()).optional(),
  defaultValue: z.any().optional(),
});
```

### 2. Model Builder UI (`client/src/pages/steps/Step3ModelBuilder.tsx`)

- **Visual Model Designer**: Add, edit, delete models and fields
- **Field Configuration**: Type selection, validation rules, flags
- **React Flow Diagram**: Interactive visualization of models
- **Real-time Validation**: Instant feedback on naming and structure
- **Timestamps Toggle**: Enable automatic timestamp fields

### 3. Intermediate Representation (IR) Builder (`server/lib/irBuilder.ts`)

Transforms raw configuration into structured IR for template rendering:

```typescript
interface ModelFieldIR {
  name: string; // Original: "firstName"
  type: string; // Original: "string"
  tsType: string; // TypeScript: "string"
  mongooseType: string; // Mongoose: "String"
  required: boolean;
  unique: boolean;
  indexed: boolean;
  validators: string[]; // Generated validators
  validation?: object; // Original validation rules
}

interface ModelIR {
  originalName: string; // "User"
  pascalName: string; // "User"
  camelName: string; // "user"
  kebabName: string; // "user"
  pluralName: string; // "users"
  pluralKebabName: string; // "users"
  fields: ModelFieldIR[];
  timestamps: boolean;
  // Generated names
  schemaFileName: string; // "user.schema.ts"
  repositoryFileName: string; // "user.repository.ts"
  serviceFileName: string; // "user.service.ts"
  controllerFileName: string; // "user.controller.ts"
  moduleFileName: string; // "user.module.ts"
  createDtoFileName: string; // "create-user.dto.ts"
  updateDtoFileName: string; // "update-user.dto.ts"
  outputDtoFileName: string; // "user-output.dto.ts"
}
```

**Key Functions**:

- `buildIR()`: Main entry point, validates and transforms entire config
- `buildModelIR()`: Transforms single model with naming conventions
- `buildFieldIR()`: Enhances field with type mappings and validators
- `validateModels()`: Checks for duplicates and reserved names

### 4. Naming Utilities (`server/lib/namingUtils.ts`)

Comprehensive string transformation utilities:

```typescript
// Case Transformations
toPascalCase("user_profile") → "UserProfile"
toCamelCase("user_profile")  → "userProfile"
toKebabCase("UserProfile")   → "user-profile"
toSnakeCase("UserProfile")   → "user_profile"

// Pluralization
pluralize("user")     → "users"
pluralize("category") → "categories"
singularize("users")  → "user"

// Type Mappings
fieldTypeToMongooseType("string")   → "String"
fieldTypeToMongooseType("objectId") → "Schema.Types.ObjectId"
mongooseTypeToTsType("String")      → "string"
mongooseTypeToTsType("ObjectId")    → "Types.ObjectId"

// Validation
isReservedFieldName("_id")        → true
isReservedFieldName("constructor") → true
getValidatorDecorator(field)       → "@IsString()\n@Length(3, 50)"
```

### 5. Mongoose Templates (`server/templates/mongoose/`)

#### a) Schema Template (`schema.njk`)

Generates Mongoose schema with decorators:

```typescript
@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, minlength: 3, maxlength: 50 })
  name: string;

  @Prop({ min: 18, max: 120 })
  age: number;
}
```

#### b) Repository Template (`repository.njk`)

Data access layer with CRUD operations:

```typescript
@Injectable()
export class UserRepository {
  async create(data: CreateUserDto): Promise<UserDocument>;
  async findAll(): Promise<UserDocument[]>;
  async findById(id: string): Promise<UserDocument | null>;
  async update(id: string, data: UpdateUserDto): Promise<UserDocument | null>;
  async delete(id: string): Promise<boolean>;
  async count(): Promise<number>;
}
```

#### c) Service Template (`service.njk`)

Business logic with DTO mapping:

```typescript
@Injectable()
export class UserService {
  async create(dto: CreateUserDto): Promise<UserOutputDto>;
  async findAll(): Promise<UserOutputDto[]>;
  async findById(id: string): Promise<UserOutputDto>;
  async update(id: string, dto: UpdateUserDto): Promise<UserOutputDto>;
  async delete(id: string): Promise<void>;
}
```

#### d) Controller Template (`controller.njk`)

REST API endpoints:

```typescript
@Controller('users')
export class UserController {
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateUserDto);

  @Get()
  async findAll();

  @Get(':id')
  async findById(@Param('id') id: string);

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto);

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string);
}
```

#### e) Module Template (`module.njk`)

Wires all components together:

```typescript
@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService, UserRepository],
})
export class UserModule {}
```

#### f) DTO Templates (`dto-create.njk`, `dto-update.njk`, `dto-output.njk`)

Type-safe data transfer objects:

```typescript
// CreateUserDto
export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @Length(3, 50)
  name: string;

  @IsNumber()
  @Min(18)
  @Max(120)
  @IsOptional()
  age?: number;
}

// UpdateUserDto
export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @Length(3, 50)
  @IsOptional()
  name?: string;

  @IsNumber()
  @Min(18)
  @Max(120)
  @IsOptional()
  age?: number;
}

// UserOutputDto
export class UserOutputDto {
  id: string;
  email: string;
  name: string;
  age?: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### 6. Generator Enhancement (`server/lib/generator.ts`)

Updated to support model generation:

```typescript
export async function generateProject(config: WizardConfig) {
  const ir = buildIR(config);
  const files: GeneratedFile[] = [];

  // Generate base NestJS files
  for (const template of baseTemplates) {
    const content = await renderTemplate(template, ir);
    files.push({ path: template.replace(".njk", ""), content });
  }

  // Generate model files
  for (const model of ir.models || []) {
    const modelFiles = await generateModelFiles(model, ir);
    files.push(...modelFiles);
  }

  return files;
}

async function generateModelFiles(model: ModelIR, ir: ProjectIR) {
  const basePath = `src/modules/${model.kebabName}`;
  return [
    {
      path: `${basePath}/${model.schemaFileName}`,
      content: await renderTemplate("mongoose/schema.njk", {
        model,
        project: ir,
      }),
    },
    {
      path: `${basePath}/${model.repositoryFileName}`,
      content: await renderTemplate("mongoose/repository.njk", {
        model,
        project: ir,
      }),
    },
    {
      path: `${basePath}/${model.serviceFileName}`,
      content: await renderTemplate("mongoose/service.njk", {
        model,
        project: ir,
      }),
    },
    {
      path: `${basePath}/${model.controllerFileName}`,
      content: await renderTemplate("mongoose/controller.njk", {
        model,
        project: ir,
      }),
    },
    {
      path: `${basePath}/${model.moduleFileName}`,
      content: await renderTemplate("mongoose/module.njk", {
        model,
        project: ir,
      }),
    },
    {
      path: `${basePath}/dtos/${model.createDtoFileName}`,
      content: await renderTemplate("mongoose/dto-create.njk", {
        model,
        project: ir,
      }),
    },
    {
      path: `${basePath}/dtos/${model.updateDtoFileName}`,
      content: await renderTemplate("mongoose/dto-update.njk", {
        model,
        project: ir,
      }),
    },
    {
      path: `${basePath}/dtos/${model.outputDtoFileName}`,
      content: await renderTemplate("mongoose/dto-output.njk", {
        model,
        project: ir,
      }),
    },
  ];
}
```

### 7. App Module Auto-Import (`server/templates/nestjs/app.module.ts.njk`)

Dynamically imports generated model modules:

```typescript
{% if models and models.length > 0 %}
// Auto-generated model modules
{% for model in models %}
import { {{ model.pascalName }}Module } from './modules/{{ model.kebabName }}/{{ model.moduleFileName.replace('.ts', '') }}';
{% endfor %}
{% endif %}

@Module({
  imports: [
    {% if models and models.length > 0 %}
    // Model modules
    {% for model in models %}
    {{ model.pascalName }}Module,
    {% endfor %}
    {% endif %}
  ],
})
```

## Generated Project Structure

```
generated-project/
├── src/
│   ├── main.ts
│   ├── app.module.ts          # Auto-imports model modules
│   ├── app.controller.ts
│   ├── app.service.ts
│   └── modules/
│       ├── user/              # Generated from User model
│       │   ├── user.schema.ts
│       │   ├── user.repository.ts
│       │   ├── user.service.ts
│       │   ├── user.controller.ts
│       │   ├── user.module.ts
│       │   └── dtos/
│       │       ├── create-user.dto.ts
│       │       ├── update-user.dto.ts
│       │       └── user-output.dto.ts
│       └── product/           # Generated from Product model
│           ├── product.schema.ts
│           ├── product.repository.ts
│           ├── product.service.ts
│           ├── product.controller.ts
│           ├── product.module.ts
│           └── dtos/
│               ├── create-product.dto.ts
│               ├── update-product.dto.ts
│               └── product-output.dto.ts
├── package.json
├── tsconfig.json
├── nest-cli.json
├── .env.example
└── README.md
```

## Usage Example

### Step 1: Define Model in UI

```typescript
Model: User
Fields:
  - name: email, type: string, required: true, unique: true
  - name: firstName, type: string, required: true, minLength: 2, maxLength: 50
  - name: lastName, type: string, required: true, minLength: 2, maxLength: 50
  - name: age, type: number, min: 18, max: 120
  - name: role, type: string, enum: ["admin", "user", "guest"]
Timestamps: true
```

### Step 2: Generate Project

Click "Generate & Download" on Step 6

### Step 3: Run Generated Project

```bash
cd generated-project
npm install
npm run start:dev
```

### Step 4: Test CRUD Endpoints

```bash
# Create user
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","firstName":"John","lastName":"Doe","age":25,"role":"user"}'

# Get all users
curl http://localhost:3000/users

# Get user by ID
curl http://localhost:3000/users/507f1f77bcf86cd799439011

# Update user
curl -X PATCH http://localhost:3000/users/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -d '{"age":26}'

# Delete user
curl -X DELETE http://localhost:3000/users/507f1f77bcf86cd799439011
```

## Validation Rules

### Model Names

- Must be PascalCase: `User`, `UserProfile`, `ProductCategory`
- Cannot be reserved: `Model`, `Schema`, `Document`
- Must be unique within project

### Field Names

- Must be camelCase: `firstName`, `userId`, `createdAt`
- Cannot be reserved: `_id`, `__v`, `__t`, `constructor`, `prototype`
- Must be unique within model

### Field Types & Validators

| Type     | Validators                          | Example                                           |
| -------- | ----------------------------------- | ------------------------------------------------- |
| string   | minLength, maxLength, pattern, enum | `{ type: 'string', minLength: 3, maxLength: 50 }` |
| number   | min, max                            | `{ type: 'number', min: 0, max: 100 }`            |
| boolean  | -                                   | `{ type: 'boolean', defaultValue: false }`        |
| date     | -                                   | `{ type: 'date', required: true }`                |
| objectId | -                                   | `{ type: 'objectId', unique: true }`              |

## Key Files Reference

### Backend

- `server/lib/irBuilder.ts` - IR transformation logic
- `server/lib/namingUtils.ts` - String utilities
- `server/lib/generator.ts` - Main generation orchestrator
- `server/templates/mongoose/*.njk` - Mongoose templates
- `shared/schema.ts` - Validation schemas

### Frontend

- `client/src/pages/steps/Step3ModelBuilder.tsx` - Model designer UI
- `client/src/lib/store.ts` - Zustand state management

## Testing Checklist

- [ ] Create model with all field types
- [ ] Add validation rules (minLength, max, pattern)
- [ ] Enable timestamps
- [ ] Generate project
- [ ] Extract and npm install
- [ ] Start dev server
- [ ] Test POST endpoint (create)
- [ ] Test GET endpoint (list all)
- [ ] Test GET/:id endpoint (find one)
- [ ] Test PATCH/:id endpoint (update)
- [ ] Test DELETE/:id endpoint (delete)
- [ ] Verify validation errors (required, minLength, etc.)
- [ ] Verify unique constraint enforcement
- [ ] Verify timestamps in response

## Known Limitations

1. **No Relationships**: Model relationships (one-to-many, many-to-many) not yet implemented
2. **No Migrations**: No migration system for schema changes
3. **Single Database**: Only MongoDB/Mongoose supported (TypeORM coming in Sprint 3)
4. **No Seed Data**: No automatic seed data generation

## Next Sprint (Sprint 3)

Planned features:

1. TypeORM support for PostgreSQL/MySQL
2. Model relationships (one-to-many, many-to-many)
3. Advanced validation (custom validators)
4. Migration generation
5. Seed data templates
6. Authentication integration
7. Authorization decorators

## Troubleshooting

### Issue: Generated code has TypeScript errors

**Solution**: Ensure all dependencies are installed: `npm install`

### Issue: MongoDB connection fails

**Solution**: Update `.env` with correct MongoDB URI: `MONGODB_URI=mongodb://localhost:27017/mydb`

### Issue: Validator decorators not working

**Solution**: Ensure `class-validator` and `class-transformer` are in dependencies

### Issue: Model not found in app.module

**Solution**: Verify model is included in `wizardConfig.models` array

## Support

For issues or questions:

1. Check TESTING_GUIDE.md for common scenarios
2. Review ARCHITECTURE.md for system design
3. Examine generated code for template structure
4. Check browser console for frontend errors
5. Check terminal for backend errors

---

**Sprint 2 Completion Date**: 2025-01-XX  
**Contributors**: GitHub Copilot + User  
**Status**: ✅ Complete (Documentation Phase)
