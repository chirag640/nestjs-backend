# 🚀 Quick Start - Sprint 1 Testing

## Step-by-Step Testing Guide

### 1️⃣ Start the Development Server

```powershell
npm run dev
```

Expected output:

```
serving on port 5000
```

### 2️⃣ Open Browser

Navigate to: `http://localhost:5000`

### 3️⃣ Fill Step 1 - Project Setup

| Field           | Example Value                           |
| --------------- | --------------------------------------- |
| Project Name    | `my-awesome-crm`                        |
| Description     | `A powerful CRM system for sales teams` |
| Author          | `Your Name`                             |
| License         | `MIT`                                   |
| Node Version    | `20`                                    |
| Package Manager | `npm` (or your preference)              |

✅ Click "Next" or press Enter

### 4️⃣ Fill Step 2 - Database Configuration

**For PostgreSQL (Neon):**

```
Database Type: PostgreSQL
Provider: Neon
Connection String: postgresql://user:password@ep-cool-example.us-east-2.aws.neon.tech/mydb
Auto Migration: Push (Auto)
```

**For MongoDB (Atlas):**

```
Database Type: MongoDB
Provider: Atlas
Connection String: mongodb+srv://username:password@cluster0.mongodb.net/mydb
Auto Migration: Push (Auto)
```

**For MySQL:**

```
Database Type: MySQL
Provider: Railway
Connection String: mysql://user:password@mysql.railway.internal:3306/railway
Auto Migration: Manual
```

✅ Click "Next" or press Enter

### 5️⃣ Navigate to Step 6 - Review

- Click through Steps 3, 4, 5 (they're not functional yet)
- Or click "Step 6" in the navigation

### 6️⃣ Verify Configuration

You should see:

- ✅ All 5 section cards on the left
- ✅ Configuration JSON preview on the right
- ✅ No validation errors
- ✅ "Generate & Download Project" button enabled

### 7️⃣ Generate Project

1. Click **"Generate & Download Project"**
2. Wait for progress bar (10% → 100%)
3. ZIP file downloads automatically: `my-awesome-crm.zip`

### 8️⃣ Test Generated Project

```powershell
# Extract ZIP
Expand-Archive -Path my-awesome-crm.zip -DestinationPath .

# Navigate into project
cd my-awesome-crm

# Install dependencies
npm install

# Create .env file
Copy-Item .env.example .env

# (Optional) Update DATABASE_URL in .env if needed

# Start development server
npm run start:dev
```

### 9️⃣ Verify Running Application

Expected console output:

```
[Nest] 12345  - 11/14/2024, 10:30:45 AM     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 11/14/2024, 10:30:45 AM     LOG [InstanceLoader] AppModule dependencies initialized +15ms
[Nest] 12345  - 11/14/2024, 10:30:45 AM     LOG [RoutesResolver] AppController {/}: +3ms
[Nest] 12345  - 11/14/2024, 10:30:45 AM     LOG [RouterExplorer] Mapped {/, GET} route +2ms
[Nest] 12345  - 11/14/2024, 10:30:45 AM     LOG [RouterExplorer] Mapped {/health, GET} route +1ms
[Nest] 12345  - 11/14/2024, 10:30:45 AM     LOG [NestApplication] Nest application successfully started +2ms
🚀 my-awesome-crm is running on http://localhost:3000
```

### 🔟 Test Endpoints

**Test Hello World:**

```powershell
curl http://localhost:3000
```

Expected: `Hello from my-awesome-crm!`

**Test Health Check:**

```powershell
curl http://localhost:3000/health
```

Expected:

```json
{
  "status": "ok",
  "timestamp": "2024-11-14T10:30:45.123Z"
}
```

---

## 🎯 Success Criteria

✅ Server starts without errors  
✅ Port 3000 is accessible  
✅ Hello endpoint returns project name  
✅ Health check returns 200 OK  
✅ All files are properly formatted  
✅ TypeScript compiles without errors

---

## 🧪 Advanced Testing

### Test Different Database Types

1. **PostgreSQL + TypeORM**
   - Check `app.module.ts` → Should have `TypeOrmModule.forRoot()`
   - Check `package.json` → Should have `typeorm` and `pg`

2. **MongoDB + Mongoose**
   - Check `app.module.ts` → Should have `MongooseModule.forRoot()`
   - Check `package.json` → Should have `mongoose`

3. **MySQL + TypeORM**
   - Check `app.module.ts` → Should have `TypeOrmModule.forRoot({ type: 'mysql' })`
   - Check `package.json` → Should have `typeorm` and `mysql2`

### Test Package Managers

**With pnpm:**

```powershell
# In Step 1, select: Package Manager = pnpm
# After generation:
pnpm install
pnpm run start:dev
```

**With yarn:**

```powershell
# In Step 1, select: Package Manager = yarn
# After generation:
yarn install
yarn start:dev
```

### Test Docker Setup

```powershell
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Test endpoint
curl http://localhost:3000

# Stop containers
docker-compose down
```

---

## ❌ Troubleshooting

### Issue: "Generate button is disabled"

**Solution:** Complete Steps 1 and 2 with valid data

### Issue: "Generation Failed" error

**Solution:** Check browser console and server logs for details

### Issue: "npm install" fails in generated project

**Solution:** Ensure internet connection and try again with `npm install --legacy-peer-deps`

### Issue: "Port 3000 already in use"

**Solution:** Kill existing process or change port in `.env`

### Issue: TypeScript errors after extraction

**Solution:** Run `npm run build` to verify - should compile successfully

---

## 📊 Expected File Sizes

| File                 | Approx Size |
| -------------------- | ----------- |
| `my-awesome-crm.zip` | 5-10 KB     |
| `package.json`       | 1-2 KB      |
| `README.md`          | 2-3 KB      |
| `src/main.ts`        | ~500 bytes  |
| `src/app.module.ts`  | ~400 bytes  |
| Total ZIP content    | ~8-15 KB    |

---

## 🎉 You're Done!

If all tests pass, Sprint 1 is successfully implemented! 🚀

**Next:** Try different configurations and prepare for Sprint 2 (Model Builder).
