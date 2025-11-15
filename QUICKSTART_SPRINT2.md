# Quick Start: Testing Sprint 2

## 🚀 5-Minute Test Guide

### Prerequisites

```bash
# Ensure MongoDB is running
mongod --version  # Should show MongoDB version

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Step 1: Start Foundation Wizard (30 seconds)

```bash
cd d:\Projects\webdev\Automations\FoundationWizard
npm run dev
```

Open: http://localhost:5000

### Step 2: Create Test Configuration (2 minutes)

#### Step 1: Project Setup

- Project Name: `test-sprint2`
- Description: `Sprint 2 Testing Project`
- Author: `Your Name`
- Port: `3000`
- Node Version: `20`
- Package Manager: `npm`

#### Step 2: Database Configuration

- Database Type: `MongoDB`
- Host: `localhost`
- Port: `27017`
- Database Name: `test_sprint2`
- Username: _(leave empty for local)_
- Password: _(leave empty for local)_

#### Step 3: Model Builder

**Create User Model:**

1. Click "Add Model"
2. Model Name: `User`
3. Enable Timestamps: ✅
4. Add Fields:

   ```
   Field 1:
   - Name: email
   - Type: string
   - Required: ✅
   - Unique: ✅

   Field 2:
   - Name: firstName
   - Type: string
   - Required: ✅
   - Min Length: 2
   - Max Length: 50

   Field 3:
   - Name: lastName
   - Type: string
   - Required: ✅
   - Min Length: 2
   - Max Length: 50

   Field 4:
   - Name: age
   - Type: number
   - Min: 18
   - Max: 120

   Field 5:
   - Name: role
   - Type: string
   - Enum: admin,user,guest (comma-separated)
   ```

#### Step 4: Authentication Setup

- Skip for now (click Next)

#### Step 5: Feature Selection

- Keep defaults (click Next)

#### Step 6: Review & Generate

- Verify all settings
- Click **"Generate & Download"**
- Wait for `test-sprint2.zip` download

### Step 3: Test Generated Project (2 minutes)

```bash
# Extract and setup
cd ~/Desktop  # or any test directory
unzip test-sprint2.zip
cd test-sprint2

# Install dependencies
npm install

# Configure environment
copy .env.example .env  # Windows
# or
cp .env.example .env    # macOS/Linux

# Edit .env (use Notepad or VS Code)
# Set: MONGODB_URI=mongodb://localhost:27017/test_sprint2

# Start server
npm run start:dev
```

**Expected Output:**

```
[Nest] 12345  - 01/15/2025, 10:30:00 AM     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 01/15/2025, 10:30:00 AM     LOG [InstanceLoader] AppModule dependencies initialized
[Nest] 12345  - 01/15/2025, 10:30:00 AM     LOG [InstanceLoader] MongooseModule dependencies initialized
[Nest] 12345  - 01/15/2025, 10:30:00 AM     LOG [InstanceLoader] UserModule dependencies initialized
[Nest] 12345  - 01/15/2025, 10:30:00 AM     LOG [RoutesResolver] AppController {/}: +1ms
[Nest] 12345  - 01/15/2025, 10:30:00 AM     LOG [RouterExplorer] Mapped {/, GET} route +1ms
[Nest] 12345  - 01/15/2025, 10:30:00 AM     LOG [RoutesResolver] UserController {/users}: +0ms
[Nest] 12345  - 01/15/2025, 10:30:00 AM     LOG [RouterExplorer] Mapped {/users, POST} route +0ms
[Nest] 12345  - 01/15/2025, 10:30:00 AM     LOG [RouterExplorer] Mapped {/users, GET} route +0ms
[Nest] 12345  - 01/15/2025, 10:30:00 AM     LOG [RouterExplorer] Mapped {/users/:id, GET} route +0ms
[Nest] 12345  - 01/15/2025, 10:30:00 AM     LOG [RouterExplorer] Mapped {/users/:id, PATCH} route +0ms
[Nest] 12345  - 01/15/2025, 10:30:00 AM     LOG [RouterExplorer] Mapped {/users/:id, DELETE} route +0ms
[Nest] 12345  - 01/15/2025, 10:30:00 AM     LOG [NestApplication] Nest application successfully started +2ms
Application is running on: http://localhost:3000
```

### Step 4: Test CRUD Endpoints (1 minute)

Open new terminal and run:

```bash
# Test 1: Create User (POST)
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"john@example.com\",\"firstName\":\"John\",\"lastName\":\"Doe\",\"age\":25,\"role\":\"user\"}"

# Expected: 201 Created with user object + timestamps

# Test 2: Get All Users (GET)
curl http://localhost:3000/users

# Expected: 200 OK with array of users

# Test 3: Get User by ID (GET)
# Copy the 'id' from Test 1 response, then:
curl http://localhost:3000/users/<USER_ID_HERE>

# Expected: 200 OK with single user object

# Test 4: Update User (PATCH)
curl -X PATCH http://localhost:3000/users/<USER_ID_HERE> \
  -H "Content-Type: application/json" \
  -d "{\"firstName\":\"Jonathan\"}"

# Expected: 200 OK with updated user (updatedAt changed)

# Test 5: Delete User (DELETE)
curl -X DELETE http://localhost:3000/users/<USER_ID_HERE>

# Expected: 204 No Content

# Test 6: Verify Deletion
curl http://localhost:3000/users/<USER_ID_HERE>

# Expected: 404 Not Found
```

## ✅ Success Criteria

If you see:

- ✅ Server starts without errors
- ✅ All 5 routes registered (`POST`, `GET`, `GET/:id`, `PATCH/:id`, `DELETE/:id`)
- ✅ MongoDB connection successful
- ✅ Create user returns 201 with timestamps
- ✅ Get all returns array
- ✅ Update changes `updatedAt`
- ✅ Delete returns 204
- ✅ Deleted user returns 404

**🎉 Sprint 2 is working perfectly!**

## 🐛 Troubleshooting

### Issue: "Cannot connect to MongoDB"

```bash
# Check if MongoDB is running
mongod --version

# If not, start it:
# macOS/Linux:
sudo systemctl start mongod
# or
mongod --dbpath=/path/to/data

# Windows:
net start MongoDB
# or run Docker:
docker run -d -p 27017:27017 mongo
```

### Issue: "Module not found"

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Port 3000 already in use"

```bash
# Change port in .env:
PORT=3001

# Or kill process on port 3000:
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -ti:3000 | xargs kill
```

### Issue: "Validation failed"

Check that your request body matches the schema:

- `email`: Must be valid email format
- `firstName`: Required, 2-50 characters
- `lastName`: Required, 2-50 characters
- `age`: Optional, 18-120
- `role`: Optional, one of: admin, user, guest

## 📊 Test Results Template

```
✅ PASS: Server starts
✅ PASS: Routes registered
✅ PASS: MongoDB connection
✅ PASS: POST /users (create)
✅ PASS: GET /users (list)
✅ PASS: GET /users/:id (find one)
✅ PASS: PATCH /users/:id (update)
✅ PASS: DELETE /users/:id (delete)
✅ PASS: Timestamps working
✅ PASS: Validation working

Sprint 2 Status: ✅ FULLY WORKING
```

## 🎯 Advanced Testing (Optional)

### Test Validation Rules

```bash
# Test 1: Missing required field
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d "{\"firstName\":\"John\"}"

# Expected: 400 Bad Request (email required)

# Test 2: Invalid email
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"invalid\",\"firstName\":\"John\",\"lastName\":\"Doe\"}"

# Expected: 400 Bad Request (invalid email)

# Test 3: Field too short
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"firstName\":\"J\",\"lastName\":\"Doe\"}"

# Expected: 400 Bad Request (minLength violation)

# Test 4: Invalid enum value
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"firstName\":\"John\",\"lastName\":\"Doe\",\"role\":\"superadmin\"}"

# Expected: 400 Bad Request (invalid role)

# Test 5: Duplicate email
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"john@example.com\",\"firstName\":\"John\",\"lastName\":\"Doe\"}"

curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"john@example.com\",\"firstName\":\"Jane\",\"lastName\":\"Smith\"}"

# Expected: 500 Internal Server Error (duplicate key)
```

## 📚 Next Steps

After confirming Sprint 2 works:

1. **Review Generated Code**

   ```bash
   code test-sprint2  # Open in VS Code
   ```

   Examine:
   - `src/modules/user/user.schema.ts` - Mongoose schema
   - `src/modules/user/user.controller.ts` - REST endpoints
   - `src/modules/user/dtos/` - DTOs with validators

2. **Try Multiple Models**
   - Create User, Product, Order models
   - Test relationships (foreign keys)

3. **Customize Templates**
   - Modify `server/templates/mongoose/*.njk`
   - Add custom methods or decorators

4. **Read Documentation**
   - `SPRINT2_README.md` - Full feature documentation
   - `SPRINT2_TESTING.md` - Comprehensive test suite
   - `SPRINT2_SUMMARY.md` - Implementation overview

## 🎉 Congratulations!

You've successfully tested Sprint 2's Mongoose code generation!

Your Foundation Wizard can now:

- ✅ Generate complete NestJS projects
- ✅ Create production-ready CRUD modules
- ✅ Handle complex validation rules
- ✅ Auto-import all modules
- ✅ Support multiple models

**Ready for Sprint 3: TypeORM + Relationships!** 🚀

---

**Estimated Test Time**: 5-10 minutes  
**Last Updated**: 2025-01-XX  
**Status**: Ready for Testing
