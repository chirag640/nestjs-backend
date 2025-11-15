# Sprint 6 - Relationship Implementation Quick Reference

## Relationship Types Supported

### 1. One-to-One

**Use Case:** Each user has one profile  
**Example:** User ↔ Profile

```typescript
// In Profile schema:
@Prop({ type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true })
userId: Schema.Types.ObjectId;

// In User schema (virtual):
UserSchema.virtual('profile', {
  ref: 'Profile',
  localField: '_id',
  foreignField: 'userId',
  justOne: true,
});

// Repository methods:
await userRepository.setProfile(userId, profileId);
await userRepository.removeProfile(userId);
const profile = await userRepository.getProfile(userId);
```

---

### 2. One-to-Many

**Use Case:** Each user has many posts  
**Example:** User → Posts

```typescript
// In Post schema:
@Prop({ type: Schema.Types.ObjectId, ref: 'User', required: true })
userId: Schema.Types.ObjectId;

// In User schema (virtual):
UserSchema.virtual('posts', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'userId',
  justOne: false,
});

// Repository methods:
await userRepository.addPost(userId, [postId1, postId2]);
await userRepository.removePost(userId, [postId1]);
const posts = await userRepository.getPosts(userId);
```

---

### 3. Many-to-Many (Simple)

**Use Case:** Users have many roles (no extra data)  
**Example:** User ↔ Role

```typescript
// In User schema:
@Prop({ type: [{ type: Schema.Types.ObjectId, ref: 'Role' }], default: [] })
roles: Schema.Types.ObjectId[];

// Repository methods:
await userRepository.addRole(userId, [roleId1, roleId2]);
await userRepository.removeRole(userId, [roleId1]);
const roles = await userRepository.getRoles(userId);
```

---

### 4. Many-to-Many (With Attributes)

**Use Case:** Users have roles with assignment date and notes  
**Example:** User ↔ Role (via UserRole join table)

```typescript
// Generated UserRole join collection:
@Schema({ timestamps: true })
export class UserRole {
  @Prop({ type: Schema.Types.ObjectId, ref: "User", required: true })
  userId: Schema.Types.ObjectId;

  @Prop({ type: Schema.Types.ObjectId, ref: "Role", required: true })
  roleId: Schema.Types.ObjectId;

  // Custom attributes:
  @Prop({ type: Date, default: Date.now })
  assignedAt: Date;

  @Prop({ type: String })
  notes: string;
}

// Repository methods:
await userRepository.addRoleWithAttributes(userId, roleId, {
  assignedAt: new Date(),
  notes: "Admin privileges",
});
await userRepository.removeRoleRelation(userId, roleId);
const rolesWithData = await userRepository.getRolesWithAttributes(userId);
await userRepository.updateRelationAttributes(userId, roleId, {
  notes: "Updated privileges",
});
```

---

## Configuration in Wizard

### Step 3.1 - Relationship Configuration

```typescript
{
  type: "many-to-many",
  fromModel: "User",
  toModel: "Role",
  fieldName: "roles",
  through: "UserRole",  // Optional custom join model name
  attributes: [         // Optional join model fields
    { name: "assignedAt", type: "date", required: true },
    { name: "notes", type: "string", required: false }
  ]
}
```

---

## Generated Files

### For Each Relationship:

1. **DTOs:**
   - `dto/connect-{from}-{to}.dto.ts` - Connect existing records
   - `dto/disconnect-{from}-{to}.dto.ts` - Remove connections
   - `dto/create-{joinmodel}.dto.ts` - Create M:N with attributes

2. **Join Models (M:N with attributes only):**
   - `src/modules/relationships/{joinmodel}.schema.ts`

3. **Repository Methods:**
   - Auto-injected into existing repository templates
   - All relationship operations available per model

---

## Repository Method Patterns

### One-to-One:

- `set{ToModel}(fromId, toId)` - Set the relationship
- `remove{ToModel}(fromId)` - Clear the relationship
- `get{ToModel}(fromId)` - Get related record

### One-to-Many:

- `add{ToModel}(fromId, toIds[])` - Add related records
- `remove{ToModel}(fromId, toIds[])` - Remove related records
- `get{ToModel}s(fromId)` - Get all related records

### Many-to-Many (Simple):

- `add{ToModel}(fromId, toIds[])` - Add to array
- `remove{ToModel}(fromId, toIds[])` - Remove from array
- `get{ToModel}s(fromId)` - Get all related

### Many-to-Many (With Attributes):

- `add{ToModel}WithAttributes(fromId, toId, attributes)` - Create join record
- `remove{ToModel}Relation(fromId, toId)` - Delete join record
- `get{ToModel}sWithAttributes(fromId)` - Query with join data
- `updateRelationAttributes(fromId, toId, attributes)` - Update join record

---

## Examples

### Example 1: Blog System

```typescript
// User (one) → Posts (many)
{
  type: "one-to-many",
  fromModel: "User",
  toModel: "Post",
  fieldName: "posts"
}

// Usage:
const user = await userService.create({ name: 'John' });
const post = await postService.create({ title: 'Hello', userId: user._id });
const userPosts = await userRepository.getPosts(user._id);
```

### Example 2: E-commerce

```typescript
// Order (many) ↔ Product (many) with OrderItem
{
  type: "many-to-many",
  fromModel: "Order",
  toModel: "Product",
  fieldName: "products",
  through: "OrderItem",
  attributes: [
    { name: "quantity", type: "number", required: true },
    { name: "price", type: "number", required: true },
    { name: "discount", type: "number", required: false }
  ]
}

// Usage:
await orderRepository.addProductWithAttributes(orderId, productId, {
  quantity: 2,
  price: 29.99,
  discount: 5
});
const orderItems = await orderRepository.getProductsWithAttributes(orderId);
```

### Example 3: Social Network

```typescript
// User (many) ↔ User (many) - Friendships with status
{
  type: "many-to-many",
  fromModel: "User",
  toModel: "User",
  fieldName: "friends",
  through: "Friendship",
  attributes: [
    { name: "status", type: "string", required: true },
    { name: "createdAt", type: "date", required: true }
  ]
}

// Usage:
await userRepository.addUserWithAttributes(userId1, userId2, {
  status: 'pending',
  createdAt: new Date()
});
await userRepository.updateRelationAttributes(userId1, userId2, {
  status: 'accepted'
});
```

---

## Best Practices

1. **Naming Conventions:**
   - Use plural for one-to-many/many-to-many fields: `posts`, `roles`, `tags`
   - Use singular for one-to-one: `profile`, `address`
   - Join models use PascalCase: `UserRole`, `OrderItem`

2. **Performance:**
   - Use simple M:N (array refs) when no attributes needed
   - Use join collections only when you need extra fields
   - Always add compound indexes on join collections
   - Use `.lean()` for read-only operations
   - Use `.populate()` carefully to avoid N+1 queries

3. **Validation:**
   - All DTOs include class-validator decorators
   - MongoDB IDs validated with `@IsMongoId()`
   - Arrays validated with `@ArrayNotEmpty()`
   - Nested objects validated with `@ValidateNested()`

4. **Error Handling:**
   - Check for null returns from repository methods
   - Handle duplicate key errors on join collections
   - Validate IDs exist before creating relationships

---

## IR Builder Details

The `buildRelationshipsIR()` function:

1. Maps each relationship from config
2. Generates unique relationship ID
3. Builds attribute fields using `buildFieldIR()`
4. Creates complete `ModelIR` for join tables (M:N with attributes)
5. Assigns proper TypeScript and Mongoose types
6. Sets up validation rules

Join models automatically include:

- Timestamps (`createdAt`, `updatedAt`)
- Compound unique index on foreign keys
- Proper schema decorators
- TypeScript types

---

**Sprint 6 Complete!** 🎉

Both OAuth2 and Relationships are production-ready.
