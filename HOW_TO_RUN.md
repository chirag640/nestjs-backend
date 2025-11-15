# How to Run FoundationWizard

## 🚀 Quick Start Guide

FoundationWizard is a NestJS Backend Generator with a visual wizard interface. Follow these steps to run the application:

### Prerequisites

Before running the application, ensure you have:

- **Node.js** (v18, v20, or v22)
- **npm**, **yarn**, or **pnpm** package manager
- **Windows** environment (current setup)

### Installation Steps

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Start Development Server**

   ```bash
   npm run dev
   ```

   The application will start on **http://localhost:5000**

### Available Scripts

- **`npm run dev`** - Start development server with hot-reload
- **`npm run build`** - Build for production (client + server)
- **`npm start`** - Run production server
- **`npm run check`** - TypeScript type checking
- **`npm run db:push`** - Push database schema changes (Drizzle)

## 📱 Accessing the Application

Once the server is running:

1. Open your browser
2. Navigate to **http://localhost:5000**
3. You'll see the FoundationWizard interface

## 🛠️ What Does This Do?

FoundationWizard is a code generator that helps you create production-ready NestJS backend applications through an interactive 8-step wizard:

### Step-by-Step Wizard Flow:

1. **Project Setup** - Configure project name, author, license, Node version
2. **Database Configuration** - Choose database (MongoDB/PostgreSQL/MySQL) and provider
3. **Model Builder** - Define your data models with fields and validations
4. **Authentication Setup** - Configure JWT auth with RBAC (optional)
5. **Feature Selection** - Enable features (CORS, Helmet, Logging, Caching, Swagger, etc.)
6. **Relationships** - Define model relationships (one-to-one, one-to-many, many-to-many)
7. **Preview & Edit** - View, edit, and customize generated code with Monaco editor
8. **Docker & CI/CD** - Configure containerization and CI/CD pipelines

### Generated Output:

After completing the wizard, you can download a complete NestJS application with:

- ✅ Full CRUD operations for all models
- ✅ JWT Authentication with role-based access control
- ✅ OAuth2 integration (Google, GitHub)
- ✅ Model relationships and validation
- ✅ Advanced features (logging, caching, Swagger docs, health checks)
- ✅ Docker configuration and docker-compose files
- ✅ CI/CD pipelines (GitHub Actions, GitLab CI)
- ✅ E2E test suites
- ✅ Environment validation with Zod
- ✅ Production-ready security (Helmet, rate limiting)

## 🏗️ Technology Stack

### Frontend:

- React 18
- TypeScript
- TailwindCSS
- Radix UI Components
- Monaco Editor (code editing)
- Zustand (state management)
- React Query
- Wouter (routing)

### Backend:

- Express.js
- TypeScript
- Nunjucks (templating)
- Worker Threads (for code operations)
- WebSocket (real-time updates)
- Archiver (ZIP generation)

### Code Generation:

- NestJS 11 templates
- Mongoose/TypeORM/Prisma support
- ESLint & Prettier integration
- TypeScript compilation checking

## 📂 Project Structure

```
FoundationWizard/
├── client/               # React frontend
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/       # Wizard steps
│   │   ├── lib/         # Store, utilities
│   │   └── hooks/       # Custom hooks
│   └── public/          # Static assets
├── server/              # Express backend
│   ├── lib/             # Core logic (IR builder, generator, naming)
│   ├── templates/       # Nunjucks templates for code generation
│   │   ├── auth/       # Authentication templates
│   │   ├── cicd/       # CI/CD workflow templates
│   │   ├── docker/     # Docker configuration templates
│   │   ├── features/   # Feature module templates
│   │   ├── mongoose/   # MongoDB/Mongoose templates
│   │   ├── nestjs/     # Core NestJS templates
│   │   └── tests/      # E2E test templates
│   ├── workers/         # Background workers (lint, format, typecheck)
│   └── index.ts         # Server entry point
├── shared/              # Shared types and schemas
└── attached_assets/     # Documentation

```

## 🔧 Troubleshooting

### Port Already in Use

If port 5000 is already in use:

1. Stop the existing process using port 5000
2. Or modify `server/index.ts` to use a different port

### TypeScript Errors

Some minor TypeScript warnings may appear but won't prevent the app from running:

- Template files (`.njk` Dockerfile templates) show false Docker syntax errors
- Step3_1RelationshipConfig.tsx has type errors (unused file)

These don't affect functionality.

### Installation Issues

If you encounter dependency issues:

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 🎯 Current Status

✅ **Sprint 8 Complete** - All features implemented including:

- Docker & Docker Compose templates
- CI/CD automation (GitHub Actions, GitLab CI)
- E2E test generation
- Environment validation
- Generator metadata system
- Full 8-step wizard with preview & editing

The application is **production-ready** and can generate fully functional NestJS backends!

## 📝 Notes

- Generated projects include all necessary dependencies
- Code is formatted with Prettier and validated with ESLint
- Type-checking is performed on generated TypeScript files
- Preview feature allows live editing before download
- All generated code follows NestJS best practices

## 🤝 Support

For issues or questions:

1. Check the wizard step descriptions
2. Review generated code in the Preview step
3. Use the Monaco editor to modify generated files
4. Download and test the generated project

---

**Happy Code Generating! 🚀**
