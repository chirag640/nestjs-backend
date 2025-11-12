# Project Setup Wizard

## Overview

A multi-step wizard application for configuring and scaffolding new software projects. Built with React, TypeScript, and Express, this wizard guides users through 6 steps of project configuration: project setup, database configuration, model definition, authentication setup, feature selection, and final review. The application features a dark-mode interface inspired by Linear, Vercel, and Raycast, with state persistence using Zustand and localStorage.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Routing**
- React 18+ with TypeScript for type safety
- Wouter for lightweight client-side routing
- Single-page application (SPA) with step-based navigation
- All 6 wizard steps are separate components loaded based on current step state

**State Management**
- Zustand for global state management with localStorage persistence
- Client-side only state (no backend database required)
- Reactive updates across wizard steps
- Validation state tracked per step

**UI Component System**
- Shadcn/ui component library (New York style variant)
- Radix UI primitives for accessible components
- TailwindCSS for styling with custom design tokens
- Dark mode enforced by default with theme provider
- Inter font for UI text, JetBrains Mono for code snippets

**Key Design Patterns**
- Progressive disclosure: Only show relevant fields per step
- Live validation with immediate error feedback
- Keyboard shortcuts (Enter to advance, Ctrl+Backspace to go back)
- Drag-and-drop model builder using @dnd-kit
- Visual data flow diagrams using ReactFlow

### Backend Architecture

**Server Framework**
- Express.js with TypeScript
- Vite dev server in development mode with HMR
- Minimal backend - primarily serves frontend assets
- No authentication or session management required
- No API routes currently implemented (placeholder exists)

**Storage Strategy**
- No database required
- All configuration stored client-side in Zustand + localStorage
- Future extensibility planned for sharing configurations via links

**Build & Deployment**
- Vite for frontend bundling
- esbuild for backend bundling
- Production build outputs to `dist/` directory
- Static assets served from `dist/public`

### Data Schema & Validation

**Validation Library**
- Zod schemas for runtime type validation
- Form validation using React Hook Form + @hookform/resolvers
- Step-specific schemas for each wizard page

**Data Models**
- ProjectSetup: Basic project metadata (name, description, author, license)
- DatabaseConfig: Database type, provider, connection string, migration strategy
- ModelDefinition: Entity models with fields, relationships, and constraints
- AuthConfig: Authentication provider, roles, permissions matrix
- FeatureSelection: Optional features like email, file upload, search
- WizardConfig: Complete configuration combining all steps

**Field Types Supported**
- UUID, String, Boolean, Int, Float, DateTime
- Field constraints: required, unique, primaryKey
- Relationship types: one-to-many, many-to-many

### UI/UX Architecture

**Design System**
- Dark mode only with neutral color palette
- CSS custom properties for theming
- Consistent spacing scale (4px base unit)
- Shadow system for depth (shadow-xs, shadow-sm, shadow-md, shadow-lg)
- Border radius: lg (9px), md (6px), sm (3px)

**Wizard Flow**
1. Project Setup - Basic metadata and package manager selection
2. Database Configuration - DB type, provider, connection details
3. Model Builder - Visual model/field editor with drag-drop and ERD preview
4. Auth Setup - Provider selection, RBAC configuration
5. Feature Selection - Optional features (email, upload, search, analytics)
6. Review & Generate - Configuration summary and code export

**Responsive Design**
- Mobile-first approach with breakpoints at 768px
- Adaptive layouts using CSS Grid and Flexbox
- Touch-friendly interactions on mobile

## External Dependencies

**Database**
- Drizzle ORM configured for PostgreSQL (via drizzle-kit)
- Neon Database serverless driver (@neondatabase/serverless)
- Note: Database setup is for future extensibility; current wizard doesn't require active DB

**UI Libraries**
- Radix UI primitives (dialogs, dropdowns, popovers, etc.)
- Lucide React for icons
- Framer Motion for animations (step transitions)
- ReactFlow for visual diagrams
- @dnd-kit for drag-and-drop functionality
- React Syntax Highlighter for code display

**State & Forms**
- Zustand for state management with persistence middleware
- React Hook Form for form handling
- @hookform/resolvers for Zod integration
- TanStack Query for future API integration

**Development Tools**
- Vite with React plugin and runtime error overlay
- Replit-specific plugins (cartographer, dev banner) in development
- TypeScript for type checking
- PostCSS with Tailwind and Autoprefixer

**Styling**
- TailwindCSS with custom configuration
- class-variance-authority (CVA) for component variants
- clsx + tailwind-merge via cn() utility
- Google Fonts CDN for Inter and JetBrains Mono