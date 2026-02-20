# TIG Platform Strategic Audit

**Date:** February 19, 2026
**Scope:** Full codebase — 254 source files, 74K frontend LOC, 17K Supabase LOC, 27 edge functions, 47 database tables, 87 migrations
**Context:** Pinnacle's BOSS (Kizen) handles agent CRM, marketing, enrollment tools, commissions, and contracting for 200+ carriers. This platform must pivot to **agency operations + agent enablement hub** — NOT an agent CRM.

---

## 1. Architecture Overview

### Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript 5.8 + Vite 5.4 |
| UI | TailwindCSS 3.4 + Shadcn/ui (51 Radix primitives) |
| Backend | Supabase (PostgreSQL 17, Auth, Storage, Edge Functions) |
| State | TanStack Query 5 + React Hook Form + Zod |
| Email | Resend (transactional) + Microsoft Graph (Outlook) |
| AI | Claude (doc builder), Gemini (chat), OpenAI (embeddings) |
| PDF | pdf-lib (contracting, growth plans) |

### File Structure
```
src/                          # 74,239 lines
  pages/          37 routes   # Agent shell (22) + Admin shell (13) + Auth (3)
  components/     140+ files  # ui/ (51), contracting/ (27), admin/ (17), dashboard/ (7), medicare/ (5)
  hooks/          38 hooks    # Auth (4), contracting (3), book-of-business (8), admin (3), carrier (4)
  lib/            11 modules  # sync, rtsImport, pdfGenerator, formatters, commissions
  config/         2 files     # carriers.ts, carrierImportGuides.ts
  data/           4 files     # carriersData, trainingVideos, trainingData, kentucky-plans

supabase/                     # 17,380 lines
  functions/      27 functions + _shared/
  migrations/     87 SQL files
```

### Key Architectural Patterns
- **Auth waterfall:** useAuth fetches profile, roles, downline in parallel
- **RBAC:** 5-level (super_admin > admin > manager > internal_tig_agent > independent_agent)
- **RLS:** profile_id match for agents, has_role() for admins, service_role bypass for edge functions
- **Shell architecture:** AgentShell (22 routes) and AdminShell (13 routes) with ProtectedRoute guards
- **Code splitting:** Lazy-loaded pages (~425KB savings), dynamic XLSX import

---

## 2. Feature-by-Feature Classification

### ADMIN OPERATIONS

| Feature | Location | Classification | Reasoning |
|---------|----------|---------------|-----------|
| Admin Dashboard (search-first) | `pages/admin/AdminDashboard.tsx` | :green_circle: KEEP | Core ops tool. Caroline/Andrew search agents by name/NPN/email daily. |
| Agent Roster Management | `pages/admin/AgentsPage.tsx`, `AllAgentsTab.tsx` (950 LOC) | :green_circle: KEEP | Primary admin workflow — filter, bulk actions, Excel export, status tracking. |
| Agent Profile (admin view) | `pages/admin/AgentProfilePage.tsx` + 7 tab components | :green_circle: KEEP | Agent lifecycle management — onboarding status, certs, documents, notes. |
| User Account Management | `pages/admin/UserDetailPage.tsx` | :green_circle: KEEP | Email, roles, password reset, deactivation — essential admin tool. |
| New Agent Creation | `pages/admin/NewAgentPage.tsx` | :green_circle: KEEP | Onboarding entry point — create profile, assign manager, send setup link. |
| Contracting Queue | `pages/admin/ContractingQueuePage.tsx` | :green_circle: KEEP | Pipeline view of agents awaiting contracting approval. Critical for Caroline. |
| RTS Import | `pages/admin/RTSImportPage.tsx` + `lib/rtsImport.ts` | :green_circle: KEEP | Pinnacle certification import — creates profiles, imports certs automatically. |
| Activity Log | `pages/admin/ActivityLogPage.tsx` | :green_circle: KEEP | Audit trail for compliance and accountability. Super admin only. |
| Manager/Hierarchy Assignment | `AssignManagerModal.tsx`, `HierarchyAssignmentPanel.tsx` | :green_circle: KEEP | Agent hierarchy (GAs: Jay, Eric, Traci) is core to TIG's org model. |

### AGENT ONBOARDING & CONTRACTING

| Feature | Location | Classification | Reasoning |
|---------|----------|---------------|-----------|
| Contracting Wizard (8-step) | `components/contracting/` (27 files, 878 LOC form) | :green_circle: KEEP | Core onboarding — personal info, licensing, banking, background, signature. |
| Contracting PDF Generation | `generate-contracting-pdf` (1162 LOC) | :green_circle: KEEP | Fills multi-page form, maps 35+ carrier checkboxes. Essential workflow. |
| Send to Pinnacle | `send-contracting-packet` edge function | :green_circle: KEEP | Emails completed packet to caroline@ + confirmation to agent. |
| Contracting Hub (agent view) | `pages/ContractingHubPage.tsx` | :green_circle: KEEP | Agent sees their carrier status (RTS, in_progress, not_started) + certs. |
| Start Here (onboarding) | `pages/StartHerePage.tsx` | :yellow_circle: REPURPOSE | Good skeleton but too thin. Should become the 90-day onboarding playbook entry point. |
| Set Password Flow | `auth/SetPasswordPage.tsx` (477 LOC) | :green_circle: KEEP | Recovery link → password setup with strength validation. Essential. |

### AGENT RESOURCE HUB

| Feature | Location | Classification | Reasoning |
|---------|----------|---------------|-----------|
| Carrier Resources | `pages/CarrierResourcesPage.tsx` (758 LOC) | :green_circle: KEEP | Contacts, documents, portal links per carrier. High-value enablement. |
| Carrier Portals | `pages/CarrierPortalsPage.tsx` | :green_circle: KEEP | Quick-launch grid to broker portals across 7 states. |
| Forms Library | `pages/FormsLibraryPage.tsx` | :green_circle: KEEP | SOA, enrollment checklists, CMS forms. Core resource hub content. |
| Compliance Page | `pages/CompliancePage.tsx` (275 LOC) | :green_circle: KEEP | Rules, guidelines, SOA downloads, CMS resources. Compliance is non-negotiable. |
| Agent Tools (external links) | `pages/AgentToolsPage.tsx` | :green_circle: KEEP | SunFire, Connect4Insurance quick links. Simple but valuable. |
| Training Library | `pages/training/TrainingLibrary.tsx` + `TrainingPage.tsx` | :yellow_circle: REPURPOSE | Structure is solid (tracks, lessons, playbooks, progress). Needs content build-out and structured learning paths. |
| Industry Updates | `pages/IndustryUpdatesPage.tsx` | :white_circle: DORMANT | Placeholder with 1 hardcoded update. Category filter UI exists. Not hurting anything. |
| My Profile (agent self-view) | `pages/MyProfilePage.tsx` | :green_circle: KEEP | Reuses admin profile page for agent self-service. |

### BOOK OF BUSINESS / CLIENT CRM (Agent-Facing)

| Feature | Location | Classification | Reasoning |
|---------|----------|---------------|-----------|
| Client List (agent BOB) | `pages/book/ClientList.tsx` + `useBookClients` | :red_circle: CUT | **Duplicates BOSS.** Agents manage clients in Kizen, not here. |
| Growth & Income Analytics | `pages/book/GrowthIncome.tsx` + hooks | :red_circle: CUT | **Duplicates BOSS.** BOSS has production dashboards, commission reconciliation. |
| Book Import (agent upload) | `pages/book/BookImportPage.tsx` + `import-book-of-business` EF | :red_circle: CUT | **Duplicates BOSS.** Agent self-import of client data serves CRM use case. |
| Agent Dashboard (client counts) | `pages/Index.tsx` (463 LOC) | :yellow_circle: REPURPOSE | Good UI bones but hero metrics are client counts (CRM data). Repurpose as ops/enablement dashboard showing onboarding progress, training completion, compliance status. |
| Smart Sync (agent-facing) | `pages/SyncFlow.tsx` (1600+ LOC) | :yellow_circle: REPURPOSE | The upload flow itself is well-built but currently serves agents uploading to *their own* BOB. **Repurpose as admin-only tool** for Caroline to import production data for operational reporting. |
| T65 Review | `pages/T65ReviewPage.tsx` | :red_circle: CUT | Agent-facing policy review tool. BOSS handles policy management. |
| Plan Finder | `pages/PlanFinderPage.tsx` | :red_circle: CUT | Medicare plan comparison. BOSS integrates SunFire/Connecture which do this better. |
| Carrier Plans | `pages/CarrierPlansPage.tsx` | :red_circle: CUT | CMS plan benefit details. Useful data but agents use SunFire for this. |
| Client Interactions | `client_interactions` table + hooks | :red_circle: CUT | Contact logging — pure CRM. BOSS has call tracking + communication logging. |
| Client Risk Flags | `client_risk_flags` table + hooks | :red_circle: CUT | Retention risk alerts — pure CRM. Never fully built. |
| Milestone/Achievement System | `milestones` table, MilestoneBar, confetti | :red_circle: CUT | Gamification of client count growth. Irrelevant without BOB. |

### ADMIN BOOK OF BUSINESS VIEWS

| Feature | Location | Classification | Reasoning |
|---------|----------|---------------|-----------|
| Agents Book Overview | `pages/admin/AgentsBookPage.tsx` | :yellow_circle: REPURPOSE | Shows which agents are syncing and who's stale. **Repurpose as agent engagement/activity dashboard** — who's active on the platform, who's completing training, etc. |
| Agent Book Detail | `pages/admin/AgentBookDetailPage.tsx` | :red_circle: CUT | Carrier breakdown of individual agent's policies. Admin can see this in BOSS/Pinnacle reports. |

### AI & EXPERIMENTAL

| Feature | Location | Classification | Reasoning |
|---------|----------|---------------|-----------|
| PDF Builder (AI doc creation) | `pages/admin/PdfBuilderPage.tsx` + `generate-pdf-structure` EF | :white_circle: DORMANT | Interesting experiment. Uses Claude for conversational doc building. Not strategic. |
| Agent Chat (no RAG) | `agent-chat` edge function | :white_circle: DORMANT | Simple chat using Gemini. Low usage, low value. |
| Agent Chat RAG | `agent-chat-rag` edge function + `process-document` | :white_circle: DORMANT | Document-grounded chat. Could serve enablement hub eventually but needs content. |
| Growth Plan PDF Generator | `generate-growth-plan-pdf` (1788 LOC) | :yellow_circle: REPURPOSE | Sophisticated business roadmap with 5-year projections. **Repurpose for admin use** — managers create growth plans for agents as part of development tracking. |
| Roadmap Generator Page | `pages/admin/RoadmapGeneratorPage.tsx` | :yellow_circle: REPURPOSE | UI for growth plan creation. Already admin-only. Refocus as agent development tool. |
| Growth Plan V8 | `generate-growth-plan-pdf-v8` | :white_circle: DORMANT | Half-built. Income-first approach not deployed. |
| Labs Page | `pages/admin/LabsPage.tsx` | :white_circle: DORMANT | Feature experiment hub. Fine to keep. |

### INFRASTRUCTURE & AUTH

| Feature | Location | Classification | Reasoning |
|---------|----------|---------------|-----------|
| Supabase Auth + RBAC | `useAuth`, `useProfile`, `useRole`, `ProtectedRoute` | :green_circle: KEEP | Foundation of the platform. 5-level RBAC is essential. |
| Microsoft OAuth + Outlook | `microsoft-oauth-*` + `microsoft-send-email` | :green_circle: KEEP | Admin email from Outlook. Used for contracting comms. |
| Edge function auth (_shared) | `_shared/auth.ts`, `_shared/cors.ts` | :green_circle: KEEP | Shared infrastructure for all edge functions. |
| Document Management | `pages/admin/DocumentManagementPage.tsx` | :white_circle: DORMANT | PDF processing utility. Niche admin tool. |

---

## 3. Database Audit

### 47 Tables Classified

#### :green_circle: KEEP — Core Operations (18 tables)

| Table | Purpose | Notes |
|-------|---------|-------|
| `profiles` | Agent roster — name, email, NPN, manager, onboarding status | Central to everything |
| `user_roles` | RBAC assignments (5 levels) | Security foundation |
| `contracting_applications` | 8-step wizard data (40+ JSONB fields) | Core onboarding |
| `contracting_communications` | Contracting email audit trail | Compliance record |
| `carriers` | Carrier master records with RTS aliases | Reference data |
| `carrier_statuses` | Per-agent per-carrier appointment status | Contracting tracking |
| `carrier_contacts` | Broker managers, support contacts | Resource hub |
| `carrier_links` | Portal URLs, cert links per carrier/state | Resource hub |
| `carrier_documents` | Downloadable guides, forms per carrier | Resource hub |
| `agent_certifications` | RTS certs by carrier/product/year | Admin visibility |
| `agent_documents` | Agent-uploaded licenses, certs, E&O | Compliance |
| `activity_logs` | Immutable audit trail | Compliance |
| `admin_notes` | Admin notes on agent profiles | Ops context |
| `rts_import_logs` | Pinnacle import audit trail | Admin ops |
| `forms` | Form templates (SOA, enrollment) | Resource hub |
| `training_tracks` | 4 learning tracks | Training system |
| `training_lessons` | 27 lessons across tracks | Training system |
| `training_lesson_progress` | Agent progress per lesson | Training system |
| `training_playbooks` | 5 downloadable playbooks | Training system |

#### :yellow_circle: REPURPOSE (5 tables)

| Table | Current Purpose | New Purpose |
|-------|----------------|-------------|
| `monthly_syncs` | Agent production sync sessions | Admin-only production tracking for operational reporting |
| `sync_carrier_uploads` | Per-carrier upload data in sync | Admin-only, paired with monthly_syncs |
| `production_uploads` | Track file uploads + processing | Admin-only upload tracking |
| `broker_roadmaps` | Growth plan data | Agent development plans (manager-created) |
| `state_carriers` | State-level carrier availability | Keep for multi-state expansion |

#### :red_circle: CUT — CRM / Agent-Facing BOB (12 tables)

| Table | Purpose | Why Cut |
|-------|---------|---------|
| `clients` | Medicare beneficiary records | **Core CRM table.** BOSS manages clients. |
| `policies` | Policy/enrollment records per client | **CRM data.** BOSS has enrollment tracking. |
| `client_interactions` | Call/email/meeting logging | **Pure CRM.** BOSS has call tracking. |
| `client_risk_flags` | Retention risk alerts | **CRM.** Never fully built. |
| `book_import_batches` | Agent self-import sessions | **CRM import pipeline.** |
| `book_import_staged_records` | Staged import records | **CRM import staging.** |
| `milestones` | Client count achievements | **Gamifies CRM growth.** |
| `agent_carriers` | Carriers selected by agent for tracking | **CRM preference.** |
| `cms_plans` | CMS benefit plan data (40+ columns) | **Plan comparison data.** SunFire handles this. |
| `cms_service_areas` | Geographic plan availability | **Paired with cms_plans.** |
| `plan_documents` | Plan benefit documents | **Paired with cms_plans.** |
| `commission_rates` | Commission rate lookups | **BOSS handles commissions.** |

#### :white_circle: DORMANT (12 tables)

| Table | Purpose | Notes |
|-------|---------|-------|
| `document_chunks` | Vector embeddings for RAG | AI experiment, not hurting anything |
| `processing_jobs` | Document processing tracker | Paired with RAG |
| `feature_flags` | Feature toggles | Infrastructure, keep |
| `system_config` | System-wide config | Infrastructure, keep |
| `hierarchy_entities` | Org hierarchy tree | Half-built, could serve future org chart |
| `entity_owners` | Entity ownership mapping | Unused |
| `microsoft_oauth_tokens` | Outlook OAuth tokens | Infrastructure for email, keep |
| `ahip_certifications` | Legacy AHIP tracking | Deprecated, superseded by agent_certifications |
| `carrier_certifications` | Legacy carrier certs | Deprecated, superseded by agent_certifications |
| `certification_windows` | Cert window periods | Not populated |
| `sync_history` | Legacy sync audit | Superseded by monthly_syncs |
| `kentucky_plans_2026` | (if table exists) Static plan data | Paired with cms_plans |

---

## 4. Edge Function Audit

### 27 Functions Classified

#### :green_circle: KEEP — Admin Ops & Infrastructure (16)

| Function | Lines | Purpose | Category |
|----------|-------|---------|----------|
| `create-agent` | 287 | Create agent account + send setup email | Onboarding |
| `create-admin` | 228 | Create admin/super_admin accounts | User mgmt |
| `send-setup-link` | 204 | Generate + email password recovery link | Onboarding |
| `get-invite-link` | 142 | Generate recovery link (no email) | Onboarding |
| `validate-password` | 137 | Site access password with rate limiting | Auth |
| `reset-user-password` | 83 | Admin password reset | User mgmt |
| `promote-to-admin` | 170 | Role promotion with logging | User mgmt |
| `delete-user` | 215 | Cascading user deletion | User mgmt |
| `reset-contracting-status` | 218 | Reset wizard + storage + statuses | Contracting |
| `generate-contracting-pdf` | 1162 | Fill multi-page contracting form | Contracting |
| `send-contracting-packet` | 238 | Email packet to admin + agent | Contracting |
| `delete-contracting-application` | 110 | Delete single application | Contracting |
| `send-agent-inquiry` | 180 | Prospective agent inquiry form | Public |
| `microsoft-oauth-start` | 89 | Initiate OAuth flow | Email infra |
| `microsoft-oauth-callback` | 171 | Handle OAuth redirect + token exchange | Email infra |
| `microsoft-send-email` | 272 | Send via Outlook with token refresh | Email infra |

#### :yellow_circle: REPURPOSE (2)

| Function | Lines | Current Use | New Use |
|----------|-------|------------|---------|
| `parse-production-report` | 500+ | Agent self-upload parsing | **Admin-only** production import for operational reporting |
| `generate-growth-plan-pdf` | 1788 | Super admin roadmap tool | **Manager-created** agent development plans |

#### :red_circle: CUT (2)

| Function | Lines | Why |
|----------|-------|-----|
| `import-book-of-business` | 500+ | Agent self-import of client data. BOSS handles this. |
| `pdf-field-audit` | 193 | Diagnostic utility for PDF template inspection. One-time use, keep but don't maintain. |

#### :white_circle: DORMANT (5)

| Function | Lines | Notes |
|----------|-------|-------|
| `agent-chat` | 107 | Simple Gemini chat. Low value. |
| `agent-chat-rag` | 181 | RAG chat with embeddings. Could serve enablement hub later. |
| `process-document` | 142 | Chunk + embed documents. Paired with RAG. |
| `generate-pdf-structure` | 177 | Claude-powered doc builder. Interesting experiment. |
| `generate-growth-plan-pdf-v8` | ~100 (incomplete) | Half-built V8 of growth plan. |
| `extract-pdf-fields` | 138 | PDF field extraction utility. Niche. |
| `fetch-edge-logs` | 76 | Stub — doesn't actually fetch logs. |

---

## 5. Page/Route Audit

### 37 Routes Classified

#### :green_circle: KEEP (20 routes)

**Admin Shell (11):**
| Route | Page | Purpose |
|-------|------|---------|
| `/admin` | AdminDashboard | Search-first agent lookup + stats |
| `/admin/agents` | AgentsPage | Full agent roster with filters + bulk actions |
| `/admin/agents/new` | NewAgentPage | Create agent + assign manager |
| `/admin/agents/:profileId` | AgentProfilePage | Agent detail (tabs: overview, contracting, docs, admin) |
| `/admin/users/:userId` | UserDetailPage | User account management |
| `/admin/contracting` | ContractingQueuePage | Contracting submission pipeline |
| `/admin/rts-import` | RTSImportPage | Pinnacle certification import |
| `/admin/activity-log` | ActivityLogPage | Audit trail |
| `/admin/roadmaps` | RoadmapGeneratorPage | Growth plan generator (repurpose) |
| `/admin/labs` | LabsPage | Experimental features hub |
| `/admin/documents` | DocumentManagementPage | PDF processing (dormant but harmless) |

**Agent Shell (9):**
| Route | Page | Purpose |
|-------|------|---------|
| `/contracting` | ContractingPage | 8-step wizard |
| `/contracting-hub` | ContractingHubPage | Carrier status + certs |
| `/carrier-resources` | CarrierResourcesPage | Contacts, docs, links |
| `/carrier-portals` | CarrierPortalsPage | Portal quick-launch grid |
| `/forms-library` | FormsLibraryPage | SOA, enrollment, CMS forms |
| `/compliance` | CompliancePage | Rules, guidelines, downloads |
| `/agent-tools` | AgentToolsPage | SunFire, Connect4Insurance links |
| `/my-profile` | MyProfilePage | Agent self-service profile |
| `/auth/*` | Auth pages (3) | Login, set password, forgot password |

#### :yellow_circle: REPURPOSE (5 routes)

| Route | Current | Becomes |
|-------|---------|---------|
| `/` (Index) | Agent dashboard with client counts | **Enablement dashboard** — onboarding checklist, training progress, compliance status, announcements |
| `/start-here` | Thin onboarding guide (3 tiles) | **90-day onboarding playbook** entry point with structured milestones |
| `/training` + `/training/:id` | Training library with tracks | **Structured learning paths** with completion tracking and admin visibility |
| `/admin/agents/book` | Admin book overview (sync status) | **Agent engagement dashboard** — platform activity, training completion, compliance |
| `/sync` or `/import` | Agent self-upload to BOB | **Admin-only production import** tool for Caroline |

#### :red_circle: CUT (8 routes)

| Route | Page | Why |
|-------|------|-----|
| `/book` | ClientList (agent BOB) | BOSS handles client management |
| `/book/growth` | GrowthIncome (analytics) | BOSS has production dashboards |
| `/import` | BookImportPage (agent upload) | BOSS handles client import |
| `/my-clients` | Redirect to /book | Remove with /book |
| `/t65-review` | T65ReviewPage | BOSS handles policy management |
| `/plan-finder` | PlanFinderPage | SunFire/Connecture do this better |
| `/carrier-resources/plans` | CarrierPlansPage | CMS plan data — SunFire handles this |
| `/admin/agents/:agentId/book` | AgentBookDetailPage | Admin can see this in BOSS/Pinnacle |

#### :white_circle: DORMANT (3 routes)

| Route | Page | Notes |
|-------|------|-------|
| `/industry-updates` | IndustryUpdatesPage | Placeholder with 1 hardcoded update |
| `/admin/pdf-builder` | PdfBuilderPage | AI experiment |
| `*` (404) | NotFound | Keep obviously |

### Suggested Navigation (Post-Refocus)

**Agent Shell:**
```
Dashboard (/)           → Onboarding progress, training, compliance, announcements
Start Here (/start)     → 90-day onboarding playbook
Contracting (/contract) → Wizard + status hub
Training (/training)    → Structured learning paths
Resources (/resources)  → Carrier contacts, portals, forms, compliance, tools
My Profile (/profile)   → Self-service profile view
```

**Admin Shell:**
```
Dashboard (/admin)              → Search + agent stats
Agents (/admin/agents)          → Roster management + engagement tracking
  New Agent (/admin/agents/new)
  Agent Detail (/admin/agents/:id)
Contracting (/admin/contracting) → Application queue
Onboarding (/admin/onboarding)   → NEW: 90-day playbook management
Training (/admin/training)       → NEW: Content management + completion reports
Production Import (/admin/sync)  → Caroline's upload tool (repurposed SyncFlow)
Activity Log (/admin/activity)   → Audit trail
```

---

## 6. Component Inventory

### :green_circle: KEEP Regardless (Shared Infrastructure)

| Category | Count | Examples |
|----------|-------|---------|
| Shadcn/ui primitives | 51 | button, input, dialog, tabs, table, badge, card, toast |
| Auth components | 4 | ProtectedRoute, DarkModeToggle, NavLink, UserAvatarDropdown |
| Layout shells | 2 | AgentShell, AdminShell |
| Formatters | 1 | `lib/formatters.ts` (phone, SSN, ZIP, NPN, routing#) |
| Error handling | 1 | `lib/errors.ts` |
| Utils | 1 | `lib/utils.ts` (cn, date formatting) |

### :green_circle: KEEP — Feature Components

| Feature | Components | Key Files |
|---------|-----------|-----------|
| Contracting Wizard | 27 | ContractingForm.tsx (878 LOC), 18 section components, SignaturePad, FileDropZone |
| Admin Management | 17 | AllAgentsTab.tsx (950 LOC), AgentProfileHeader, tabs (4), modals (3) |
| Carrier Resources | 2 | CarrierResourcesPage (758 LOC), CarrierPlansTab |
| Auth Pages | 3 | AuthPage (372 LOC), SetPasswordPage (477 LOC), ForgotPasswordPage |

### :red_circle: CUT — CRM Components

| Feature | Components | Key Files |
|---------|-----------|-----------|
| Dashboard (client metrics) | 7 | HeroCard, Sparkline, NextGoalCard, MilestoneJourneyCard, GrowthStreakCard |
| Book of Business | 2 | EmptyState, T65Toggle |
| Medicare Plans | 5 | PlanCard, PlanComparison, PlanDetailModal, PlanFilters, StarRating |
| Growth/Income | ~3 | GrowthChart, MonthlyActivityTable, IncomeByCarrier |

### :yellow_circle: REPURPOSE

| Component | Current Use | New Use |
|-----------|------------|---------|
| Dashboard cards (7) | Client count metrics | Onboarding/training/compliance metrics |
| Training components | Video library + tracks | Structured learning path UI |
| SyncFlow (1600 LOC) | Agent upload flow | Admin-only production import |

### Hooks Classification

| Category | Hooks | Classification |
|----------|-------|---------------|
| Auth & Core | useAuth, useProfile, useRole, useNavigationContext | :green_circle: KEEP |
| Contracting | useContractingApplication, useContractingPdf, useFormValidation | :green_circle: KEEP |
| Admin | useAdminDashboardData, useAdminAgentsBook | :green_circle: KEEP |
| Carrier/Resources | useCarrierDirectory, useAgentRTSCarriers, useAgentCertifications | :green_circle: KEEP |
| Training | useTrainingData | :green_circle: KEEP |
| Book of Business (agent) | useBookClients, useBookSummary, useClientDetail, useCreateClient, useUpdateClient, useClientInteractions | :red_circle: CUT |
| Growth/Production (agent) | useDashboardData, useMonthlyGrowth, useCarrierIncome | :red_circle: CUT |
| Import | useBookImport, useImportStatus | :red_circle: CUT |
| Misc | useSyncPreferences, useCommissions, useRoadmapGenerator | :yellow_circle: varies |

---

## 7. Strategic Summary

### Codebase Breakdown by Category

| Category | Files | Est. LOC | % of Total |
|----------|-------|----------|-----------|
| :green_circle: KEEP | ~130 | ~42,000 | **46%** |
| :yellow_circle: REPURPOSE | ~25 | ~12,000 | **13%** |
| :red_circle: CUT | ~55 | ~22,000 | **24%** |
| :white_circle: DORMANT | ~20 | ~6,000 | **7%** |
| Shared UI (neutral) | ~51 | ~8,000 | **10%** |

**Bottom line:** ~46% of the codebase directly serves the new direction. ~24% is CRM functionality that duplicates BOSS. The remaining ~30% is either repurposable, dormant, or shared infrastructure.

### The 5 Highest-Value Things Already Built

1. **Contracting Wizard + PDF Pipeline** (27 components, 1162-line PDF generator, email delivery)
   - Complete 8-step onboarding form with auto-save, validation, signature capture
   - Generates filled contracting PDF, emails to Caroline + agent
   - This is working, production-tested, and directly strategic

2. **Admin Agent Management** (AllAgentsTab 950 LOC + AgentProfilePage + queue)
   - Search, filter, bulk actions, Excel export, status tracking
   - Agent profile with tabs (overview, contracting, documents, admin)
   - Contracting queue with approval workflow
   - This IS the ops platform

3. **RBAC + Auth Infrastructure** (useAuth 286 LOC, ProtectedRoute, 5-level roles)
   - Parallel profile/role fetching, role hierarchy helpers
   - Shell architecture with admin/agent views
   - RLS policies across 23 tables
   - Foundational — everything builds on this

4. **RTS Import Pipeline** (rtsImport.ts + RTSImportPage + edge functions)
   - Parses Pinnacle Excel exports, auto-creates profiles, imports certifications
   - Admin tool that saves Caroline hours of manual data entry
   - Directly strategic for ops efficiency

5. **Carrier Resource Hub** (CarrierResourcesPage 758 LOC + carrier_contacts/links/documents tables)
   - Split-pane UI with contacts, documents, portal links per carrier
   - DB-driven content (not hardcoded)
   - Agent enablement — this is exactly what the resource hub should be

### The 5 Biggest Time Sinks to Cut First

1. **Client/Policy data pipeline** (~5,000 LOC across clients table, policies table, parse-production-report agent path, import-book-of-business, clientDedup.ts, SyncFlow agent mode)
   - This was the biggest engineering investment and it duplicates BOSS entirely
   - Dedup logic alone (Medicare# → name+DOB → name-only) was weeks of work
   - Cut the agent-facing paths; preserve admin-only production import if needed

2. **Book of Business UI** (~3,000 LOC — ClientList, GrowthIncome, BookImportPage, 8 hooks, 2 components)
   - Agent-facing client list, growth analytics, income by carrier
   - Zero adoption once agents use BOSS for this

3. **Medicare Plan Finder + CMS data** (~2,000 LOC — PlanFinderPage, CarrierPlansPage, 5 medicare components, cms_plans 40+ columns, cms_service_areas)
   - Duplicates SunFire/Connecture which BOSS integrates
   - The cms_plans table alone has 40+ benefit columns

4. **T65 Review Page** (~500 LOC)
   - Agent-facing policy review filtered by effective date
   - BOSS handles policy lifecycle management

5. **Dashboard client metrics** (~1,500 LOC — Index.tsx, 7 dashboard components, useDashboardData, milestones)
   - Currently shows animated client count, sparkline, milestone bar
   - All metrics are CRM-derived (total clients, new this month)
   - The dashboard shell and UI patterns are reusable; the data/metrics aren't

### What's MISSING (Needs to Be Built)

| Priority | Feature | Complexity | Notes |
|----------|---------|-----------|-------|
| 1 | **Admin Ops Command Center** | Medium | Repurpose admin dashboard — unified view of agent pipeline stages, contracting bottlenecks, compliance gaps, upcoming cert windows |
| 2 | **90-Day Onboarding System** | Large | Structured playbook with dual tracks (manager + agent). Milestones: Week 1 (contracting), Week 2-3 (certs), Week 4-6 (training), Week 7-12 (first sales). Progress tracking visible to admin. |
| 3 | **Training Content + Learning Paths** | Medium | Infrastructure exists (tracks, lessons, progress tables). Need: content upload/management for admins, structured sequences, completion certificates, admin reports on who's finished what. |
| 4 | **Document/Resource Hub Expansion** | Small | Forms library + carrier resources already exist. Add: marketing templates, compliance checklists, carrier-specific onboarding guides, seasonal playbooks (AEP, OEP, T65). |
| 5 | **Agent Development Tracking** | Medium | Dashboard showing each agent's journey: onboarding %, training completion, certs obtained, first sync date, production milestones. Admin can see who needs attention. |
| 6 | **Lead Distribution System** | Large | TIG distributing leads TO agents (not agents managing their own). Assignment rules, fair rotation, geographic matching, outcome tracking. |
| 7 | **Communication Hub** | Medium | Centralized TIG-to-agent messaging. Announcements, carrier updates, deadline reminders. Currently scattered across email. |
| 8 | **Marketing Template Gallery** | Small | Downloadable/customizable marketing materials. Flyers, door hangers, social media templates, event materials. |

---

## 8. Recommended Action Plan

### Phase 1: Simplify (1-2 weeks) — Reduce Complexity

**Goal:** Remove CRM routes from agent navigation, disable BOB features, clean up the agent experience.

| Action | Complexity | Impact |
|--------|-----------|--------|
| Remove `/book`, `/book/growth`, `/import`, `/my-clients`, `/t65-review`, `/plan-finder`, `/carrier-resources/plans` from router | Small | Eliminates 8 CRM routes from agent nav |
| Remove corresponding nav items from AgentShell sidebar | Small | Clean, focused agent menu |
| Repurpose agent dashboard (`/`) — replace client metrics with welcome message + quick links to contracting, training, resources | Small | Sets new tone immediately |
| Remove `/sync` agent-facing entry (keep admin path) | Small | SyncFlow becomes admin-only tool |
| Disable dashboard components that reference clients/policies (HeroCard, Sparkline, MilestoneJourneyCard) | Small | No broken data references |

**Result:** Agent sees: Dashboard, Start Here, Contracting Hub, Training, Resources (carrier resources, portals, forms, compliance, tools), My Profile. Clean, focused, enablement-oriented.

### Phase 2: Refocus (2-4 weeks) — Repurpose Existing Features

| Action | Complexity | Impact |
|--------|-----------|--------|
| **Rebuild Agent Dashboard** — onboarding progress bar, training completion %, next steps checklist, announcements area | Medium | Agent's home becomes an enablement dashboard |
| **Expand Start Here** into 90-day onboarding playbook skeleton — phases (Week 1-2, 3-4, 5-8, 9-12) with milestone checklists | Medium | Structured onboarding replaces thin guide |
| **Make Smart Sync admin-only** — move `/sync` under admin routes, restrict to admin roles | Small | Caroline's production import tool |
| **Add admin training management** — content upload, track/lesson CRUD, completion reports | Medium | Training infrastructure already exists; add admin side |
| **Repurpose AgentsBookPage** as Agent Engagement dashboard — show training completion, last login, onboarding stage instead of sync status | Medium | Admin visibility into agent activity |
| **Enhance Carrier Resources** — add marketing templates section, seasonal playbooks | Small | Quick win for resource hub |
| **Growth Plan as Agent Development tool** — managers create plans for agents, track against milestones | Small | Reframe existing feature |

### Phase 3: Build New (4-8 weeks) — Strategic Features

| Action | Complexity | Impact |
|--------|-----------|--------|
| **Admin Ops Command Center** — pipeline view: prospecting → contracting → certifying → active → producing. Bottleneck alerts. | Large | Transforms admin experience |
| **Full 90-Day Onboarding System** — manager track (assign tasks, check-ins) + agent track (complete milestones). Automated reminders. | Large | Core differentiator for TIG |
| **Structured Training Paths** — prerequisite chains, quizzes, completion certificates, deadlines for new agents | Medium | Training becomes strategic, not just a video library |
| **Communication Hub** — announcements, carrier updates, deadline reminders, read receipts | Medium | Replaces scattered email communication |
| **Lead Distribution System** — lead intake, assignment rules, geographic matching, rotation fairness, outcome tracking | Large | New capability — TIG distributing TO agents |
| **Marketing Template Gallery** — categorized templates with preview + download. Carrier-approved materials. | Small | Quick enablement win |

### Phase 4: Cleanup (Ongoing) — Technical Debt

| Action | Complexity | Notes |
|--------|-----------|-------|
| Drop CRM tables (`clients`, `policies`, `client_interactions`, `client_risk_flags`, `book_import_*`, `milestones`, `cms_plans`, `cms_service_areas`, `plan_documents`, `commission_rates`) | Medium | After confirming no admin reporting depends on them |
| Remove unused hooks (8 BOB hooks, 3 growth hooks) | Small | Dead code removal |
| Remove unused components (medicare/, book-of-business/, dashboard client metrics) | Small | Dead code removal |
| Consolidate dormant edge functions | Small | agent-chat, agent-chat-rag, process-document, generate-pdf-structure |
| Clean up deprecated tables (`ahip_certifications`, `carrier_certifications`, `sync_history`, `entity_owners`) | Small | Legacy cruft |
| Fix Microsoft OAuth token encryption (known issue) | Medium | Security improvement |

---

## Appendix: Quick Decision Matrix

For any future feature request, ask:

| Question | If Yes → | If No → |
|----------|----------|---------|
| Does BOSS already do this for agents? | Don't build it | Continue |
| Is the primary user an individual agent managing their clients? | Don't build it | Continue |
| Is the primary user TIG admin/ops team? | Build it | Evaluate |
| Does it make TIG operationally better? | Build it | Evaluate |
| Does it help agents be more prepared/enabled? | Build it (resource hub) | Evaluate |
| Is it infrastructure (auth, email, storage)? | Maintain it | Evaluate |

---

*End of Strategic Audit*
