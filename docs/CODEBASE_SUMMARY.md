# Codebase Summary - Agent Platform

**Generated:** 2026-01-25
**Purpose:** Sprint planning context for another Claude instance

---

## 1. Project Structure

| Directory | Description |
|-----------|-------------|
| `src/components/` | React components organized by feature area |
| `src/components/admin/` | Admin dashboard, agent management, hierarchy tools |
| `src/components/book-of-business/` | Production tracking feature (12 components) |
| `src/components/contracting/` | Multi-step contracting form with 19 section components |
| `src/components/layout/` | Page layout wrappers |
| `src/components/roadmap/` | Agent growth roadmap generator |
| `src/components/training/` | Video training library components |
| `src/components/ui/` | Shadcn UI primitives (buttons, dialogs, inputs, etc.) |
| `src/contexts/` | React contexts (FeatureFlagsContext) |
| `src/data/` | Static data (carriersData.ts, trainingVideos.ts) |
| `src/hooks/` | Custom hooks (auth, contracting, validation, roles) |
| `src/integrations/supabase/` | Supabase client config and generated types |
| `src/lib/` | Utilities (formatters, RTS import, sync logic, errors) |
| `src/pages/` | Route page components |
| `src/pages/admin/` | Admin-only pages |
| `src/pages/auth/` | Authentication pages |
| `src/types/` | TypeScript type definitions (contracting, roadmap) |
| `src/utils/` | Activity logging utilities |
| `supabase/functions/` | 21 Edge Functions for server-side logic |
| `supabase/migrations/` | 67 database migration files |
| `scripts/` | CLI scripts for data import and integrity checks |
| `docs/` | 23 documentation/audit files |

---

## 2. Main Pages/Views

### Auth Pages
| File | Purpose | Status |
|------|---------|--------|
| `AuthPage.tsx` | Login/signup | Complete |
| `auth/SetPasswordPage.tsx` | Set password after invite | Complete |
| `auth/ForgotPasswordPage.tsx` | Password reset flow | Complete |

### Admin Pages
| File | Purpose | Status |
|------|---------|--------|
| `admin/AdminDashboard.tsx` | Search-first dashboard with stats cards | Complete |
| `admin/AgentsPage.tsx` | Full agent roster with filtering | Complete |
| `admin/AgentProfilePage.tsx` | View/edit individual agent | Complete |
| `admin/NewAgentPage.tsx` | Create new agent profile | Complete |
| `admin/ContractingQueuePage.tsx` | Review submitted contracting apps | Complete |
| `admin/HierarchyManagementPage.tsx` | Manager assignment panel | Complete |
| `admin/RTSImportPage.tsx` | Upload carrier RTS spreadsheets | Complete |
| `admin/RoadmapGeneratorPage.tsx` | Generate agent growth PDFs | Complete |
| `admin/ActivityLogPage.tsx` | User activity audit trail | Complete |
| `admin/LabsPage.tsx` | Experimental features | Complete |
| `admin/UserDetailPage.tsx` | Legacy user detail view | Legacy/Unused |
| `DocumentManagementPage.tsx` | Admin document management | Complete |

### Agent Pages
| File | Purpose | Status |
|------|---------|--------|
| `Index.tsx` (/) | Agent dashboard with tools grid | Complete |
| `ContractingPage.tsx` | Multi-step contracting wizard | Complete |
| `ContractingHubPage.tsx` | View carrier status, request contracting | Complete |
| `MyProfilePage.tsx` | View/edit own profile | Complete |
| `MyCertificationsPage.tsx` | View own certifications | Complete |
| `BookOfBusinessPage.tsx` | Production tracking dashboard | Complete |

### Resource Pages
| File | Purpose | Status |
|------|---------|--------|
| `StartHerePage.tsx` | Onboarding guide | Complete |
| `TrainingPage.tsx` | Video training library | Complete |
| `CertificationsPage.tsx` | AHIP/carrier cert links | Complete |
| `AgentToolsPage.tsx` | External tool links (SunFire, CRM) | Complete |
| `CarrierResourcesPage.tsx` | Carrier contacts, downloads | Complete |
| `CarrierPlansPage.tsx` | Plan documents by carrier | Complete |
| `CarrierPortalsPage.tsx` | Direct carrier portal links | Complete |
| `FormsLibraryPage.tsx` | SOA, apps, compliance forms | Complete |
| `CompliancePage.tsx` | Compliance resources | Complete |
| `IndustryUpdatesPage.tsx` | Industry news | Placeholder |
| `NotFound.tsx` | 404 page | Complete |

---

## 3. Key Features Built

### Working Today
- **Authentication:** Email/password login, invite flow, password reset
- **Role-based Access:** 5 roles (super_admin, admin, manager, internal_tig_agent, independent_agent)
- **Contracting Form:** 7+ step wizard with signature capture, PDF generation
- **Contracting Hub:** Per-carrier status tracking, contracting requests
- **Agent Management:** Search, filter, create, edit agent profiles
- **RTS Import:** Upload carrier spreadsheets, match by NPN, auto-create profiles
- **Certifications:** AHIP tracking, carrier cert links by year
- **Hierarchy Management:** Assign managers to agents
- **Roadmap Generator:** Growth plan PDF generation
- **Document Management:** Upload/download agent documents
- **Activity Logging:** Audit trail for super admins
- **Book of Business:** Production tracking with carrier cards and upload flow

### Edge Functions (21 deployed)
- `create-admin`, `create-agent`, `delete-user` - User management
- `generate-contracting-pdf`, `send-contracting-packet` - Contracting workflow
- `generate-growth-plan-pdf` - Roadmap generation
- `microsoft-oauth-*`, `microsoft-send-email` - Outlook integration
- `parse-production-report` - Book of Business parsing
- `send-setup-link`, `reset-user-password` - Account management
- `agent-chat`, `agent-chat-rag`, `process-document` - AI features

---

## 4. Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | React 18 + Vite |
| **Language** | TypeScript 5.8 |
| **Routing** | React Router DOM 6 |
| **State/Data** | TanStack React Query 5 |
| **Styling** | Tailwind CSS 3.4 + tailwindcss-animate |
| **UI Components** | Shadcn/ui (Radix primitives) |
| **Forms** | React Hook Form + Zod validation |
| **Backend** | Supabase (PostgreSQL + Auth + Storage + Edge Functions) |
| **Email** | Resend (transactional), Microsoft Graph (Outlook) |
| **PDF** | jsPDF, pdfjs-dist |
| **Charts** | Recharts |
| **Error Tracking** | Sentry |
| **Spreadsheets** | xlsx (SheetJS) |

---

## 5. Existing Documentation

| File | Summary |
|------|---------|
| `docs/PLATFORM_AUDIT.md` | Comprehensive map of routes, roles, features, tables, and keep/kill recommendations |
| `docs/MVP_ANALYSIS.md` | MVP scope analysis for product decisions |
| `docs/ADMIN_STYLE_GUIDE.md` | Admin UI patterns and component standards |
| `docs/DESIGN_AUDIT.md` | UI/UX audit findings |
| `docs/CARRIER_HUB_ANALYSIS.md` | Contracting hub feature analysis |
| `docs/AGENTS_PAGE_REDESIGN.md` | Agent roster redesign plan |
| `docs/AGENT_IMPORT_*.md` | Agent import workflow documentation |
| `docs/BRANDING_WORKFLOW_AUDIT.md` | TIG branding + workflow audit |
| `docs/ARCHITECTURE.md` | Full C4 architecture documentation |
| `docs/rts-import-flow-analysis.md` | RTS import process documentation |
| `docs/document-storage-analysis.md` | Document storage architecture |
| `README.md` | Project quick start |
| `docs/INDEX.md` | Documentation index and guide |

---

## 6. Database Tables (Supabase)

### Core Tables
| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (agents, admins) - name, NPN, email, status, manager_id |
| `user_roles` | Role assignments (user_id, role enum) |
| `contracting_applications` | Multi-step form data (50+ fields) |
| `carriers` | Carrier master list with RTS aliases |
| `carrier_statuses` | Per-agent carrier appointment status |

### Certification Tables
| Table | Purpose |
|-------|---------|
| `agent_certifications` | Carrier certs per agent by year |
| `ahip_certifications` | AHIP cert tracking |
| `carrier_certifications` | Additional carrier certs |
| `certification_windows` | Cert deadline windows |

### Supporting Tables
| Table | Purpose |
|-------|---------|
| `activity_logs` | User activity audit trail |
| `agent_documents` | Uploaded documents per agent |
| `broker_roadmaps` | Growth plan data |
| `contracting_communications` | Email history |
| `state_carriers` | State-specific carrier availability |
| `feature_flags` | Feature toggles |
| `hierarchy_entities` | Org hierarchy structure |
| `rts_import_logs` | RTS import history |
| `microsoft_oauth_tokens` | Outlook integration tokens |
| `production_records`, `production_sync_state` | Book of Business data |

### Key Enums
- `app_role`: super_admin, admin, manager, internal_tig_agent, independent_agent
- `onboarding_status`: CONTRACTING_REQUIRED, CONTRACTING_SUBMITTED, APPOINTED

---

## 7. Unfinished / Known Issues

### Incomplete Features
- **Industry Updates Page:** Placeholder content only
- **Training Library:** Videos exist but limited content
- **AI Chat:** Edge functions exist but feature not fully integrated in UI

### TIG-Specific Items to Remove
- About page (TIG leadership)
- Contact page (TIG staff)
- "Direct to TIG" labels throughout
- `internal_tig_agent` role naming
- `ownership_group: a_and_a` references

### Technical Debt
- `admin/UserDetailPage.tsx` - Legacy, possibly unused
- Some carrier data is Kentucky-specific
- Forms Library has carrier-specific content that may not be portable

### Needs Decision
- Book of Business: Complete integration or simplify?
- Training Library: Generic content or remove?
- Forms Library: Make configurable or remove carrier-specific forms?

---

## 8. Quick Stats

| Metric | Count |
|--------|-------|
| Total Routes | 30 |
| React Pages | 31 |
| Components (non-UI) | ~60 |
| Custom Hooks | 17 |
| Edge Functions | 21 |
| Database Tables | 21+ |
| Migrations | 67 |
| Doc Files | 22 |
