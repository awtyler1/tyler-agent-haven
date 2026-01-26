# Agent Platform

**One-liner:** Operating system for Medicare agents — onboarding, certifications, resources, and production tracking.

**Last Updated:** January 25, 2026

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript 5.8 + Vite 5.4 |
| UI | TailwindCSS 3.4 + Shadcn/ui (Radix) |
| Backend | Supabase (PostgreSQL 17, Auth, Storage, Edge Functions) |
| State | TanStack Query 5 + React Hook Form + Zod |
| Email | Resend (transactional) + Microsoft Graph (Outlook) |
| Monitoring | Sentry |

---

## Commands

```bash
npm run dev              # Start dev server
npm run build            # Build for production
npm run lint             # Run ESLint
npm run deploy:functions # Deploy edge functions to Supabase
```

---

## Project Structure

```
src/
├── pages/           # Route components (Index, Admin/*, Auth/*)
├── components/      # Feature-organized (admin/, contracting/, ui/)
├── hooks/           # Custom hooks (useAuth, useProfile, useRole)
├── lib/             # Business logic (sync.ts, rtsImport.ts)
├── integrations/    # Supabase client + types
└── data/            # Static data (carriersData.ts)

supabase/
├── functions/       # 21 Edge Functions (Deno)
└── migrations/      # 67 database migrations

docs/                # 26 documentation files
```

---

## Key Features (Working)

| Feature | Status |
|---------|--------|
| **Authentication** | Login, signup, password reset, invite flow |
| **Roles** | 5-level RBAC (super_admin → independent_agent) |
| **Contracting Wizard** | 8-step form with PDF generation |
| **Contracting Hub** | Per-carrier status tracking |
| **RTS Import** | Upload Pinnacle Excel → auto-create profiles + certs |
| **Book of Business** | Production tracking with milestone achievements |
| **Carrier Resources** | Contacts, portals, documents (filtered by agent certs) |
| **Forms Library** | SOA, enrollment, compliance forms |
| **Training** | Video library with progress tracking |
| **Admin Dashboard** | Search-first design, agent management, queue |
| **Activity Logging** | Audit trail for super admins |

---

## Database

### Core Tables
- `profiles` — User data (name, email, NPN, manager_id, onboarding_status)
- `user_roles` — Role assignments (super_admin, admin, manager, agent)
- `contracting_applications` — Multi-step wizard data (JSONB fields)
- `carriers` — Carrier definitions with RTS aliases
- `carrier_statuses` — Agent-carrier appointment status
- `agent_certifications` — RTS certifications by year

### Production Tracking
- `monthly_syncs` — Monthly sync records
- `sync_carrier_uploads` — Per-carrier upload data
- `agent_carriers` — Selected carriers to track
- `milestones` — Achievement records

### Supporting
- `activity_logs` — Audit trail
- `agent_documents` — Uploaded files
- `forms` — Form templates
- `feature_flags` — Feature toggles

---

## Edge Functions (21 deployed)

**Agent Lifecycle:** create-agent, send-setup-link, validate-password
**Admin:** create-admin, delete-user, reset-user-password
**Contracting:** generate-contracting-pdf, send-contracting-packet
**Production:** parse-production-report
**Email:** microsoft-oauth-*, microsoft-send-email
**AI:** agent-chat, agent-chat-rag, process-document

---

## Design System

See `DESIGN_SYSTEM.md` for full patterns. Key tokens:

| Element | Pattern |
|---------|---------|
| Page background | `bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]` |
| Cards | `rounded-xl border border-[#e8e4dd] bg-white` |
| Headers | `TIG \| Agent Portal` with sticky blur |
| Footers | `Powered by Tyler Insurance Group` |
| Primary action | Blue (`bg-blue-600 hover:bg-blue-700`) |
| Status dots | `w-2 h-2 rounded-full` (green/amber/red) |

---

## Key Patterns

### State Management
Hook composition instead of Redux:
```tsx
const { user, profile, isAdmin, canAccessAdmin } = useAuth();
// useAuth = useProfile + useRole combined
```

### Form Auto-Save
800ms debounced save with optimistic updates:
```tsx
const { application, updateField } = useContractingApplication();
// Changes auto-persist to contracting_applications table
```

### Agent Carrier Filtering
Agents only see carriers they're certified with:
```tsx
const { carriers, loading } = useAgentCarriers();
// Queries agent_certifications, maps RTS names to carrier codes
```

### Role-Based Routes
```tsx
<ProtectedRoute requireAdmin>     {/* Admin or Super Admin */}
<ProtectedRoute requireSuperAdmin> {/* Super Admin only */}
<ProtectedRoute allowContractingOnly> {/* Agents in CONTRACTING_REQUIRED */}
```

---

## Known Issues

- Microsoft OAuth tokens stored unencrypted
- Industry Updates page is placeholder
- Some carrier data is Kentucky-specific
- Large bundle size (~2.3MB, needs code splitting)

---

## Branding Context

Platform has TIG branding throughout (see `docs/BRANDING_WORKFLOW_AUDIT.md`):
- Footer text: "Powered by Tyler Insurance Group"
- Email senders: @tylerinsurancegroup.com domain
- Headers: "TIG | Agent Portal"
- Legal text in contracting sections

White-label pivot in progress — audit completed, changes pending.

---

## Documentation Index

| File | Purpose |
|------|---------|
| `DESIGN_SYSTEM.md` | UI patterns and design tokens |
| `docs/ARCHITECTURE.md` | Full architecture documentation with C4 diagrams |
| `docs/CODEBASE_SUMMARY.md` | Sprint planning context |
| `docs/BRANDING_WORKFLOW_AUDIT.md` | TIG branding removal checklist |
| `docs/ADMIN_STYLE_GUIDE.md` | Admin UI component standards |

---

## Quick Reference

**Supabase Project:** mgczpsrtkdkkjzmztpyd
**Production URL:** https://www.tigagenthub.com
**Vercel:** Auto-deploys from main branch
