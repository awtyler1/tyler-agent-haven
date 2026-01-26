# Developer Onboarding Guide

Welcome to the Agent Platform team! This guide will help you get up and running quickly.

**Estimated Setup Time:** 30-45 minutes

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Project Overview](#project-overview)
4. [Development Workflow](#development-workflow)
5. [Codebase Tour](#codebase-tour)
6. [Key Patterns](#key-patterns)
7. [First Tasks](#first-tasks)
8. [Troubleshooting](#troubleshooting)
9. [Resources](#resources)

---

## Prerequisites

### Required Software

| Tool | Version | Purpose | Installation |
|------|---------|---------|--------------|
| **Node.js** | 20.x LTS | JavaScript runtime | [nodejs.org](https://nodejs.org) |
| **npm** | 10.x+ | Package manager | Comes with Node.js |
| **Git** | 2.40+ | Version control | [git-scm.com](https://git-scm.com) |
| **VS Code** | Latest | IDE (recommended) | [code.visualstudio.com](https://code.visualstudio.com) |
| **Supabase CLI** | 1.150+ | Database management | `npm install -g supabase` |

### Recommended VS Code Extensions

```
# Install all at once via command palette (Ctrl+Shift+P):
# "Extensions: Install from VSIX" or search each

- ESLint (dbaeumer.vscode-eslint)
- Tailwind CSS IntelliSense (bradlc.vscode-tailwindcss)
- Prettier (esbenp.prettier-vscode)
- TypeScript Importer (pmneo.tsimporter)
- GitLens (eamodio.gitlens)
- Error Lens (usernamehw.errorlens)
```

### Access Requirements

Before starting, ensure you have access to:

- [ ] GitHub repository (request from team lead)
- [ ] Supabase project dashboard (view-only initially)
- [ ] Vercel dashboard (for deployment logs)
- [ ] Sentry (for error monitoring)

---

## Environment Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-org/tyler-agent-haven.git
cd tyler-agent-haven
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment Variables

Create a `.env.local` file by copying the template:

```bash
cp .env .env.local
```

The `.env` file contains public keys that are safe to commit. For local development, you may need additional secrets in `.env.local`:

```env
# .env.local - DO NOT COMMIT

# Already in .env (public):
VITE_SUPABASE_URL=https://mgczpsrtkdkkjzmztpyd.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon-key>
VITE_GOOGLE_PLACES_API_KEY=<places-key>
VITE_SENTRY_DSN=<sentry-dsn>

# For edge function development (ask team lead):
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
TOKEN_ENCRYPTION_KEY=<encryption-key>
MICROSOFT_CLIENT_ID=<oauth-client-id>
MICROSOFT_CLIENT_SECRET=<oauth-secret>
MICROSOFT_TENANT_ID=<oauth-tenant>
```

### Step 4: Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Step 5: Verify Setup

1. Open `http://localhost:5173` in your browser
2. You should see the login page
3. Check the browser console for any errors
4. Check the terminal for build warnings

### Environment Validation Checklist

- [ ] `npm run dev` starts without errors
- [ ] Login page loads in browser
- [ ] No TypeScript errors in terminal
- [ ] VS Code shows no red squiggles in open files

---

## Project Overview

### What We're Building

**Agent Platform** is an operating system for Medicare insurance agents. It handles:

- **Onboarding:** New agent contracting workflow with PDF generation
- **Certifications:** Track AHIP, carrier appointments, state licenses
- **Resources:** Carrier contacts, plan documents, training videos
- **Production:** Book of business tracking with milestone achievements
- **Admin:** Agent management, contracting queue, activity logging

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 + TypeScript 5.8 + Vite 5.4 |
| **Styling** | TailwindCSS 3.4 + Shadcn/ui (Radix primitives) |
| **Backend** | Supabase (PostgreSQL 17, Auth, Storage, Edge Functions) |
| **State** | TanStack Query 5 + React Hook Form + Zod |
| **Email** | Microsoft Graph API (Outlook integration) |
| **Monitoring** | Sentry |

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Vercel)                     │
│  React + TypeScript + TailwindCSS + Shadcn/ui               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase Platform                       │
├─────────────┬─────────────┬─────────────┬──────────────────┤
│  PostgreSQL │    Auth     │   Storage   │  Edge Functions  │
│  (Database) │   (Users)   │   (Files)   │  (Deno Runtime)  │
└─────────────┴─────────────┴─────────────┴──────────────────┘
```

### User Roles

| Role | Access Level |
|------|--------------|
| `super_admin` | Full access + activity logs + create admins |
| `admin` | Agent management + contracting queue |
| `manager` | View downline agents |
| `internal_tig_agent` | Full agent features |
| `independent_agent` | Full agent features |

---

## Development Workflow

### Branch Strategy

```
main          ← Production (auto-deploys to Vercel)
  └── feature/ABC-123-description  ← Feature branches
```

**Workflow:**

1. Create feature branch from `main`
2. Make changes with small, focused commits
3. Push and create Pull Request
4. Get code review approval
5. Merge to `main` (auto-deploys)

### Commit Message Format

```
type: short description

Longer description if needed.

Co-Authored-By: Your Name <your.email@example.com>
```

**Types:** `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`

### Running Commands

```bash
# Development
npm run dev              # Start dev server (localhost:5173)
npm run build            # Production build
npm run lint             # Run ESLint
npm run preview          # Preview production build

# Supabase Edge Functions
npm run deploy:functions # Deploy all functions to Supabase

# Data Scripts
npm run import:agents    # Import agents from Excel
npm run assign:hierarchy # Assign manager hierarchy
```

### Code Quality Checks

Before committing:

```bash
npm run lint             # Fix any ESLint errors
npm run build            # Ensure production build works
```

---

## Codebase Tour

### Directory Structure

```
tyler-agent-haven/
├── src/
│   ├── pages/              # Route components
│   │   ├── Index.tsx       # Agent dashboard (/)
│   │   ├── admin/          # Admin pages (/admin/*)
│   │   └── Auth/           # Authentication pages
│   │
│   ├── components/
│   │   ├── ui/             # Shadcn/ui primitives
│   │   ├── admin/          # Admin-specific components
│   │   ├── contracting/    # Contracting wizard components
│   │   └── layout/         # Layout wrappers
│   │
│   ├── hooks/              # Custom React hooks
│   │   ├── useAuth.ts      # Authentication + roles
│   │   ├── useProfile.ts   # User profile data
│   │   └── useRole.ts      # Role checking utilities
│   │
│   ├── lib/                # Business logic
│   │   ├── sync.ts         # Production data sync
│   │   └── rtsImport.ts    # RTS Excel parsing
│   │
│   ├── integrations/
│   │   └── supabase/       # Supabase client + types
│   │
│   └── data/               # Static data
│       └── carriersData.ts # Carrier definitions
│
├── supabase/
│   ├── functions/          # Edge Functions (Deno)
│   │   ├── _shared/        # Shared utilities
│   │   ├── create-agent/   # Agent creation
│   │   ├── send-setup-link/# Email invitations
│   │   └── ...             # 21 total functions
│   │
│   └── migrations/         # Database schema (67 migrations)
│
├── docs/                   # Documentation (26 files)
├── public/                 # Static assets
└── scripts/                # CLI utilities
```

### Key Files to Understand First

| File | Purpose |
|------|---------|
| `src/App.tsx` | Router configuration, all routes defined here |
| `src/hooks/useAuth.ts` | Core auth hook, role checking, profile loading |
| `src/components/ProtectedRoute.tsx` | Route guards for auth/roles |
| `src/integrations/supabase/client.ts` | Supabase client initialization |
| `CLAUDE.md` | Project context (keep updated!) |
| `DESIGN_SYSTEM.md` | UI patterns and tokens |

### Database Schema (Key Tables)

```sql
-- Users and roles
profiles         -- User data (name, email, NPN, manager_id)
user_roles       -- Role assignments

-- Contracting
contracting_applications  -- Wizard data (JSONB fields)
carrier_statuses          -- Agent-carrier appointment status

-- Carriers
carriers              -- Carrier definitions
agent_certifications  -- RTS certifications by year

-- Activity
activity_logs    -- Audit trail
```

---

## Key Patterns

### 1. Authentication Hook

```tsx
// The main auth hook combines profile + role checking
const {
  user,           // Supabase auth user
  profile,        // Profile from profiles table
  loading,        // Auth state loading
  isAdmin,        // () => boolean - has admin or super_admin role
  isSuperAdmin,   // () => boolean - has super_admin role
  canAccessAdmin, // () => boolean - can view admin dashboard
} = useAuth();

// Usage in components
if (loading) return <Spinner />;
if (!isAdmin()) return <Navigate to="/" />;
```

### 2. Protected Routes

```tsx
// In App.tsx router configuration
<Route
  path="/admin"
  element={
    <ProtectedRoute requireAdmin>
      <AdminDashboard />
    </ProtectedRoute>
  }
/>

// Route guard options:
// requireAdmin       - admin or super_admin only
// requireSuperAdmin  - super_admin only
// allowContractingOnly - agents in CONTRACTING_REQUIRED status
```

### 3. Data Fetching with TanStack Query

```tsx
// Queries with automatic caching and refetching
const { data: agents, isLoading } = useQuery({
  queryKey: ['agents', { managerId }],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('manager_id', managerId);
    if (error) throw error;
    return data;
  },
});
```

### 4. Form Handling with React Hook Form + Zod

```tsx
// Define schema
const formSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
});

// Use in component
const form = useForm<z.infer<typeof formSchema>>({
  resolver: zodResolver(formSchema),
});
```

### 5. Supabase Edge Function Calls

```tsx
// From frontend
const { data, error } = await supabase.functions.invoke('create-agent', {
  body: { email, fullName, managerId },
});

// Edge function structure (Deno)
// supabase/functions/create-agent/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  // Handle CORS, auth, business logic
  return new Response(JSON.stringify({ success: true }));
});
```

### 6. Component Styling Pattern

```tsx
// Use Tailwind + cn() for conditional classes
import { cn } from '@/lib/utils';

<div className={cn(
  "rounded-xl border border-[#e8e4dd] bg-white p-4",
  isActive && "border-blue-500 bg-blue-50",
  className
)}>
```

---

## First Tasks

### Week 1: Environment & Orientation

- [ ] Complete environment setup (this guide)
- [ ] Read `CLAUDE.md` and `DESIGN_SYSTEM.md`
- [ ] Explore the app as an agent (create test account)
- [ ] Explore the app as an admin (ask for test admin access)
- [ ] Review `src/App.tsx` to understand routing
- [ ] Run through the contracting wizard flow

### Week 2: First Contributions

**Good First Issues:**

1. **UI Polish** - Find a component that doesn't match the design system
2. **Error Handling** - Add toast notifications to an API call
3. **Accessibility** - Add missing aria labels to buttons
4. **Documentation** - Update outdated docs

**Starter Tasks:**

```bash
# Find TODO comments in codebase
grep -r "TODO" src/ --include="*.tsx" --include="*.ts"

# Find console.log statements to remove
grep -r "console.log" src/ --include="*.tsx" --include="*.ts"
```

### Week 3-4: Feature Work

- Pick up a small feature from the backlog
- Pair with a senior developer on implementation
- Submit your first PR
- Learn the review process

---

## Troubleshooting

### Common Issues

#### "Module not found" errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### TypeScript errors after pulling

```bash
# Regenerate Supabase types
npx supabase gen types typescript --project-id mgczpsrtkdkkjzmztpyd > src/integrations/supabase/types.ts
```

#### Supabase connection issues

1. Check `.env.local` has correct `VITE_SUPABASE_URL`
2. Verify you're not behind a VPN blocking Supabase
3. Check Supabase dashboard for service status

#### Edge function deployment fails

```bash
# Make sure you're logged in
supabase login

# Deploy specific function
supabase functions deploy function-name --project-ref mgczpsrtkdkkjzmztpyd
```

#### Vite HMR not working

1. Check for syntax errors in recently changed files
2. Restart dev server: `Ctrl+C` then `npm run dev`
3. Clear browser cache and hard refresh

### Getting Help

1. **Search existing docs** in `/docs` folder
2. **Check CLAUDE.md** for patterns and conventions
3. **Ask in team chat** with specific error messages
4. **Create detailed bug report** if you find a new issue

---

## Resources

### Project Documentation

| Document | Purpose |
|----------|---------|
| `CLAUDE.md` | Project context for AI assistants |
| `DESIGN_SYSTEM.md` | UI patterns, colors, components |
| `docs/ARCHITECTURE.md` | System architecture deep dive |
| `docs/CODEBASE_SUMMARY.md` | Feature inventory |
| `docs/ADMIN_STYLE_GUIDE.md` | Admin UI standards |

### External Resources

| Resource | Link |
|----------|------|
| React Docs | [react.dev](https://react.dev) |
| TypeScript Handbook | [typescriptlang.org](https://www.typescriptlang.org/docs/) |
| TailwindCSS | [tailwindcss.com](https://tailwindcss.com/docs) |
| Shadcn/ui | [ui.shadcn.com](https://ui.shadcn.com) |
| Supabase Docs | [supabase.com/docs](https://supabase.com/docs) |
| TanStack Query | [tanstack.com/query](https://tanstack.com/query/latest) |
| React Hook Form | [react-hook-form.com](https://react-hook-form.com) |
| Zod | [zod.dev](https://zod.dev) |

### Quick Reference

```bash
# Start development
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Deploy edge functions
npm run deploy:functions

# View Supabase dashboard
open https://supabase.com/dashboard/project/mgczpsrtkdkkjzmztpyd
```

---

## Onboarding Checklist

Print this and check off as you go:

```
Week 1
[ ] Environment setup complete
[ ] Dev server runs without errors
[ ] Read CLAUDE.md and DESIGN_SYSTEM.md
[ ] Explored app as agent role
[ ] Explored app as admin role
[ ] Understand routing in App.tsx
[ ] Met with team lead for intro

Week 2
[ ] Completed first code contribution
[ ] Submitted first PR
[ ] Received code review feedback
[ ] Merged first PR to main

Week 3-4
[ ] Working on first feature
[ ] Comfortable with codebase patterns
[ ] Can deploy edge functions
[ ] Can debug common issues
```

---

**Questions?** Reach out to the team lead or post in the team chat.

**Found an issue with this guide?** Submit a PR to update it!
