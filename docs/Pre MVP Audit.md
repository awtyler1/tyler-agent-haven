# Pre-MVP Project Audit

**Project:** Tyler Agent Haven (TIG Agent Hub)
**Audit Date:** January 12, 2026
**Purpose:** Comprehensive technical audit before MVP release

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Feature Inventory](#2-feature-inventory)
3. [Database Schema](#3-database-schema)
4. [Edge Functions](#4-edge-functions)
5. [User Roles & Flows](#5-user-roles--flows)
6. [Dead Code](#6-dead-code)
7. [External Integrations](#7-external-integrations)

---

## 1. Architecture Overview

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  React 18 + TypeScript + Vite                                        │   │
│  │  ├── src/pages/        (32 page components)                          │   │
│  │  ├── src/components/   (100+ components, shadcn/ui)                  │   │
│  │  ├── src/hooks/        (14 custom hooks)                             │   │
│  │  └── src/contexts/     (Feature flags)                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                            React Router v6                                   │
│                                    │                                         │
└────────────────────────────────────┼─────────────────────────────────────────┘
                                     │
                         ┌───────────┴───────────┐
                         │   Supabase Client     │
                         │   @supabase/supabase-js│
                         └───────────┬───────────┘
                                     │
┌────────────────────────────────────┼─────────────────────────────────────────┐
│                              SUPABASE                                        │
│  ┌─────────────────────────────────┴─────────────────────────────────────┐  │
│  │                         Edge Functions (19)                            │  │
│  │  Auth: create-agent, create-admin, delete-user, reset-user-password   │  │
│  │  Email: send-setup-link, send-contracting-packet, send-agent-inquiry  │  │
│  │  PDF: generate-contracting-pdf, extract-pdf-fields, pdf-field-audit   │  │
│  │  AI: agent-chat, agent-chat-rag, process-document                     │  │
│  │  OAuth: microsoft-oauth-start, microsoft-oauth-callback, send-email   │  │
│  │  Util: validate-password, reset-contracting-status, fetch-edge-logs   │  │
│  └─────────────────────────────────┬─────────────────────────────────────┘  │
│                                    │                                         │
│  ┌─────────────────────────────────┴─────────────────────────────────────┐  │
│  │                         PostgreSQL Database                            │  │
│  │  Tables: profiles, user_roles, carriers, contracting_applications,    │  │
│  │          carrier_statuses, certifications, hierarchy_entities, etc.   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                    │                                         │
│  ┌─────────────────────────────────┴─────────────────────────────────────┐  │
│  │                         Supabase Storage                               │  │
│  │  Buckets: contracting-documents, certificates                         │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
                                     │
┌────────────────────────────────────┼─────────────────────────────────────────┐
│                        EXTERNAL SERVICES                                     │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │   Resend     │ │  Microsoft   │ │   Google     │ │   OpenAI     │        │
│  │   (Email)    │ │  Graph API   │ │   Places     │ │ (Embeddings) │        │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘        │
│  ┌──────────────┐ ┌──────────────┐                                          │
│  │   Lovable    │ │   Vercel     │                                          │
│  │  (AI Chat)   │ │  (Hosting)   │                                          │
│  └──────────────┘ └──────────────┘                                          │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend Framework | React | 18.3.1 |
| Language | TypeScript | 5.8.3 |
| Build Tool | Vite | 5.4.19 |
| Styling | Tailwind CSS | 3.4.17 |
| UI Components | shadcn/ui (Radix primitives) | Latest |
| Routing | React Router | 6.30.1 |
| State Management | React Context + React Query | 5.83.0 |
| Forms | React Hook Form + Zod | 7.61.1 / 3.25.76 |
| Backend | Supabase | 2.86.0 |
| Hosting | Vercel | - |

### Major Dependencies

| Package | Purpose |
|---------|---------|
| `@supabase/supabase-js` | Database, auth, storage, real-time |
| `@tanstack/react-query` | Server state caching and sync |
| `react-hook-form` | Form state management |
| `zod` | Schema validation |
| `jspdf` + `pdf-lib` | PDF generation and manipulation |
| `lucide-react` | Icon library (462+ icons) |
| `recharts` | Charts and data visualization |
| `sonner` | Toast notifications |
| `date-fns` | Date manipulation |
| `use-places-autocomplete` | Google Places integration |
| `react-signature-canvas` | Signature capture |

---

## 2. Feature Inventory

### Pages Overview (32 Total)

#### Authentication Pages (4)
| Page | Path | Status | Notes |
|------|------|--------|-------|
| AuthPage | `/auth` | Working | Login + agent inquiry form |
| SetPasswordPage | `/auth/set-password` | Working | Password setup via recovery token |
| ForgotPasswordPage | `/auth/forgot-password` | Working | Password recovery request |
| NotFound | `*` | Working | 404 page |

#### Agent Dashboard Pages (14)
| Page | Path | Status | Notes |
|------|------|--------|-------|
| Index (Dashboard) | `/` | Working | Control center with tiles, leadership bios |
| StartHerePage | `/start-here` | Working | Onboarding orientation |
| ContractingPage | `/contracting` | Working | Multi-step contracting form |
| ContractingHubPage | `/contracting-hub` | Working | Status tracking, submitted docs |
| CarrierResourcesPage | `/carrier-resources` | Working | Carrier documentation |
| CarrierPlansPage | `/carrier-resources/plans` | Working | Plan information |
| CarrierPortalsPage | `/carrier-portals` | Working | Links to carrier portals |
| AgentToolsPage | `/agent-tools` | Working | Quoting tools, CRM access |
| CertificationsPage | `/certifications` | Working | AHIP and carrier recert links |
| CompliancePage | `/compliance` | Working | Compliance documentation |
| FormsLibraryPage | `/forms-library` | Working | SOA, HIPAA, enrollment forms |
| IndustryUpdatesPage | `/industry-updates` | Working | News and updates |
| DocumentManagementPage | `/documents` | Working | Document storage |
| ContactPage | `/contact` | Working | Support contact |
| AboutPage | `/about` | Working | About TIG |

#### Admin Pages (14)
| Page | Path | Status | Notes |
|------|------|--------|-------|
| AdminDashboard | `/admin` | Working | Stats, recent activity, alerts |
| AgentsPage | `/admin/agents` | Working | Agent list and management |
| NewAgentPage | `/admin/agents/new` | Working | Create new agent |
| ManagersPage | `/admin/managers` | Working | Manager list (super admin only) |
| NewManagerPage | `/admin/managers/new` | Working | Create manager (super admin only) |
| UserDetailPage | `/admin/users/:userId` | Working | User profile detail view |
| ContractingQueuePage | `/admin/contracting` | Working | Contracting application queue |
| HierarchyManagementPage | `/admin/hierarchy` | Working | Team hierarchy management |
| AdminSettingsPage | `/admin/settings` | Working | System settings (super admin) |
| PlatformMapPage | `/admin/platform-map` | Working | Territory map view |
| PdfFieldExtractorPage | `/admin/pdf-extractor` | Working | Extract PDF fields (super admin) |
| PdfFieldMapperPage | `/admin/pdf-mapper` | Working | Map PDF fields to data |
| PdfFieldAuditPage | `/admin/pdf-audit` | Working | Audit PDF field mappings |

#### Commented Out / MVP Deferred (4)
| Page | Path | Status | Notes |
|------|------|--------|-------|
| SalesTrainingPage | `/sales-training` | Deferred | Training hub - placeholder content |
| SalesTrainingModulePage | `/sales-training-module` | Deferred | Individual training modules |
| TrainingLibraryPage | `/training-library` | Deferred | Training video library |
| MedicareFundamentalsPage | `/medicare-fundamentals` | Deferred | Medicare 101 content |

### Components Overview (100+)

#### Core Components (8)
- `Navigation.tsx` - Main navbar with role-based menu
- `Footer.tsx` - Site footer
- `ProtectedRoute.tsx` - Role-based route protection
- `AgentProfileDropdown.tsx` - User profile menu
- `AgentChatWidget.tsx` - AI chat assistant widget
- `DarkModeToggle.tsx` - Theme switcher
- `PasswordGate.tsx` - Password protection
- `NavLink.tsx` - Navigation link component

#### Contracting Components (30)
**Main Form Components:**
- `ContractingForm.tsx` - Multi-step form orchestrator
- `SectionNav.tsx` - Step navigation
- `ValidationBanner.tsx` - Error display
- `SuccessModal.tsx` - Submission success
- `SignaturePad.tsx` - Signature capture
- `InitialsPad.tsx` - Initials capture
- `FileDropZone.tsx` - Document upload

**Form Sections (17):**
1. `PersonalInfoSection.tsx` - Name, contact, SSN
2. `AddressSection.tsx` - Address entry
3. `HomeAddressSection.tsx` - Home address with autocomplete
4. `MailingShippingSection.tsx` - Mailing/shipping addresses
5. `LicensingSection.tsx` - NPN, license info
6. `AdditionalLicensesSection.tsx` - Non-resident licenses
7. `BackgroundQuestionsSection1.tsx` - Background questions pt 1
8. `BackgroundQuestionsSection2.tsx` - Background questions pt 2
9. `BackgroundSignatureSection.tsx` - Background acknowledgment
10. `LegalQuestionsSection.tsx` - Legal compliance
11. `BankingSection.tsx` - Banking and beneficiary
12. `TrainingSection.tsx` - E&O, FINRA, AML, LTC
13. `DocumentsSection.tsx` - Document uploads
14. `MarketingConsentSection.tsx` - Marketing preferences
15. `AgreementsSection.tsx` - Terms and compliance
16. `SignatureSection.tsx` - Final signature
17. `InitialsEntrySection.tsx` - Initials acknowledgment

#### Admin Components (16)
- `UserManagementTable.tsx` - User list with actions
- `CreateUserDialog.tsx` - Create user modal
- `CreateAdminDialog.tsx` - Create admin modal
- `AgentDocumentsCard.tsx` - Agent documents display
- `ContractingSubmissionDetail.tsx` - Submission detail view
- `CarrierManagement.tsx` - Carrier configuration
- `CarrierStatusPanel.tsx` - Carrier status display
- `HierarchyManagement.tsx` - Hierarchy editor
- `HierarchyAssignmentPanel.tsx` - Agent assignment
- `StateDefaultsManagement.tsx` - State defaults config
- `SystemStatusCard.tsx` - System health display
- `DevOpsDocumentation.tsx` - DevOps docs
- `TestEmailButton.tsx` - Email testing
- `OutlookConnectButton.tsx` - Microsoft OAuth connect
- `queue/AgentList.tsx` - Queue agent list
- `queue/AgentPanel.tsx` - Queue agent detail

#### UI Components (50+ shadcn/ui)
Full shadcn/ui component library including: accordion, alert, avatar, badge, button, card, carousel, checkbox, dialog, dropdown-menu, form, input, label, popover, select, slider, switch, table, tabs, textarea, toast, tooltip, etc.

### Custom Hooks (14)

| Hook | Purpose | Status |
|------|---------|--------|
| `useAuth` | Combined auth, profile, role, routing | Working |
| `useRole` | Role detection and permissions | Working |
| `useProfile` | User profile and onboarding status | Working |
| `useContractingApplication` | Application lifecycle management | Working |
| `useContractingValidation` | Form validation rules | Exported but unused |
| `useContractingPdf` | PDF generation | Working |
| `useAgentProfile` | Agent-specific profile data | Working |
| `useDarkMode` | Theme toggle persistence | Working |
| `useMobile` | Responsive viewport detection | Working |
| `useToast` | Toast notifications | Working |
| `useSystemStatus` | System health monitoring | Working |
| `useSendEmail` | Microsoft Graph email sending | Working |
| `useUserManagement` | User CRUD operations | Working |
| `useFormValidation` | Generic form validation | Working |

---

## 3. Database Schema

### Tables Overview (15)

| Table | Purpose | Status |
|-------|---------|--------|
| `profiles` | Core user profiles | Active |
| `user_roles` | Role-based access control | Active |
| `carriers` | Insurance carriers (77 seeded) | Active |
| `contracting_applications` | Contracting form data | Active |
| `carrier_statuses` | Per-agent carrier progress | Active |
| `ahip_certifications` | Annual AHIP cert tracking | Active |
| `carrier_certifications` | Per-carrier cert tracking | Active |
| `certification_windows` | Cert open/close dates | Active |
| `state_carriers` | State-carrier availability | Active |
| `hierarchy_entities` | Org structure (MGA, GA, teams) | Active |
| `entity_owners` | Entity ownership mapping | Active |
| `feature_flags` | Feature toggles | Active |
| `system_config` | System configuration KV store | Active |
| `document_chunks` | RAG document embeddings | Active |
| `processing_jobs` | Document processing queue | Active |

### Table Details

#### profiles
Core user data linking auth.users to application-specific profile.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK to auth.users |
| email | TEXT | User email |
| full_name | TEXT | Display name |
| onboarding_status | ENUM | CONTRACTING_REQUIRED, CONTRACTING_SUBMITTED, APPOINTED, SUSPENDED |
| is_active | BOOLEAN | Account status |
| manager_id | UUID | FK to profiles (supervisor) |
| hierarchy_type | TEXT | direct, team, mga, ga, loa, downline |
| assigned_carriers | UUID[] | Admin-assigned carriers |
| excluded_carriers | UUID[] | User-excluded carriers |
| developer_access | BOOLEAN | Feature flag management |

#### contracting_applications
Multi-step contracting form storage.

| Section | Fields |
|---------|--------|
| Personal | full_legal_name, gender, birth_date, birth_city, birth_state |
| Contact | email_address, phone_mobile, phone_business, phone_home, fax |
| License | npn_number, resident_license_number, resident_state, non_resident_states |
| Address | home_address (JSONB), mailing_address (JSONB), ups_address |
| Legal | legal_questions (JSONB), disciplinary_entries (JSONB) |
| Banking | bank_routing_number, bank_account_number, beneficiary_* |
| Training | has_aml_course, aml_*, has_ltc_certification, eo_* |
| Carrier | selected_carriers (JSONB), is_corporation, contract_level |
| Status | status, current_step, completed_steps[], queue_status |
| Signature | signature_name, signature_initials, signature_date |

#### carriers
77 insurance carriers seeded (Aetna, Anthem, Humana, UHC, WellCare, Cigna, Molina, etc.)

| Column | Type | Description |
|--------|------|-------------|
| code | TEXT | Short code (e.g., 'aetna') |
| name | TEXT | Legal name |
| display_name | TEXT | UI display name |
| product_tags | TEXT[] | medicare_advantage, pdp, aca, life, etc. |
| requires_corporate_resolution | BOOLEAN | Needs corp docs |
| requires_non_resident_states | BOOLEAN | Needs NR license states |
| state_availability | TEXT[] | Available state codes |

### Enums

```sql
app_role: super_admin | admin | manager | independent_agent | internal_tig_agent
onboarding_status: CONTRACTING_REQUIRED | CONTRACTING_SUBMITTED | APPOINTED | SUSPENDED
```

### Storage Buckets

| Bucket | Purpose |
|--------|---------|
| `contracting-documents` | User-uploaded contracting docs |
| `certificates` | AHIP and carrier certifications |

### Key Relationships

```
auth.users (Supabase Auth)
  ├── profiles (1:1)
  ├── user_roles (1:N)
  ├── contracting_applications (1:N)
  ├── carrier_statuses (1:N)
  ├── ahip_certifications (1:N)
  └── carrier_certifications (1:N)

carriers
  ├── carrier_statuses (1:N)
  ├── carrier_certifications (1:N)
  └── state_carriers (1:N)

hierarchy_entities (self-referential)
  └── entity_owners (1:N)
```

---

## 4. Edge Functions

### Functions Overview (19)

| Function | Purpose | Status |
|----------|---------|--------|
| `agent-chat` | AI chatbot (Gemini 2.5) | Complete |
| `agent-chat-rag` | RAG chatbot with doc context | Complete |
| `create-admin` | Admin user creation | Complete |
| `create-agent` | Agent user creation with hierarchy | Complete |
| `delete-user` | Cascading user deletion | Complete |
| `extract-pdf-fields` | Extract PDF form fields | Complete |
| `fetch-edge-logs` | Log retrieval | Stubbed |
| `generate-contracting-pdf` | Fill contracting PDF (150+ fields) | Complete |
| `microsoft-oauth-callback` | OAuth callback handler | Complete |
| `microsoft-oauth-start` | OAuth flow initiation | Complete |
| `microsoft-send-email` | Send via Microsoft Graph | Complete |
| `pdf-field-audit` | PDF field position audit | Complete |
| `process-document` | Document chunking + embeddings | Complete |
| `reset-contracting-status` | Reset agent to initial state | Complete |
| `reset-user-password` | Admin password reset | Complete |
| `send-agent-inquiry` | Handle inquiry form | Complete |
| `send-contracting-packet` | Email packet to team | Complete |
| `send-setup-link` | Send activation email | Complete |
| `validate-password` | Site password with rate limiting | Complete |

### Function Details

#### agent-chat
AI chatbot for Medicare insurance agents.
- **Model:** Google Gemini 2.5 Flash via Lovable Gateway
- **Features:** Streaming responses, rate limit handling
- **Expertise:** Medicare products, platform navigation, sales guidance

#### create-agent
Agent user creation with full hierarchy support.
- **Auth Required:** Admin or Super Admin
- **Features:**
  - Team and downline hierarchy types
  - Different onboarding flows for new vs existing agents
  - Sends setup email via Resend
  - Extensive logging

#### generate-contracting-pdf
Most complex function (1145 lines, 150+ field mappings).
- **Features:**
  - Personal info, addresses, contacts
  - Legal questions (19 categories, 40+ yes/no)
  - Banking and beneficiary info
  - Signature image embedding
  - Central Time timezone handling
  - Optional storage to Supabase
  - Detailed mapping report

#### microsoft-send-email
Send emails via user's Outlook account.
- **Features:**
  - OAuth token refresh
  - File attachments (base64)
  - Save to Sent folder
  - Communication logging

### Security Notes
- All functions use CORS allowlisting
- Admin functions require role verification
- Rate limiting on public endpoints
- Microsoft OAuth tokens stored (encryption TODO)

---

## 5. User Roles & Flows

### Role Hierarchy

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SUPER_ADMIN                                  │
│  • Full platform access                                              │
│  • Create/manage all users including admins                          │
│  • System settings and configuration                                 │
│  • PDF field extraction tools                                        │
└─────────────────────┬───────────────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────────────┐
│                            ADMIN                                     │
│  • Admin dashboard access                                            │
│  • Create/manage agents and managers                                 │
│  • Contracting queue management                                      │
│  • PDF mapping and audit                                             │
└─────────────────────┬───────────────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────────────┐
│                           MANAGER                                    │
│  • View team members                                                 │
│  • Team performance visibility                                       │
│  • Limited admin features                                            │
└─────────────────────┬───────────────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────────────┐
│              INTERNAL_TIG_AGENT / INDEPENDENT_AGENT                  │
│  • Dashboard access                                                  │
│  • Contracting form (if required)                                    │
│  • Carrier resources and portals                                     │
│  • Certifications                                                    │
│  • Forms library                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### User Journeys

#### New Agent Flow
```
1. Admin creates agent account (NewAgentPage)
   └── Edge function: create-agent
       └── Profile created with onboarding_status: CONTRACTING_REQUIRED
       └── Setup email sent via Resend

2. Agent receives setup email
   └── Clicks link with recovery token
   └── Lands on SetPasswordPage
   └── Sets password (12+ chars, complexity requirements)

3. Agent logs in (AuthPage)
   └── System detects CONTRACTING_REQUIRED status
   └── Redirected to /contracting

4. Agent completes contracting form
   └── 17-section multi-step form
   └── Auto-save with 800ms debounce
   └── Document uploads (E&O, licenses)
   └── Signature capture
   └── Submit → status: CONTRACTING_SUBMITTED

5. Admin reviews submission (ContractingQueuePage)
   └── View details
   └── Generate PDF (generate-contracting-pdf)
   └── Send to Pinnacle (send-contracting-packet)
   └── Update status → APPOINTED

6. Agent gains full platform access
   └── Dashboard, resources, tools
```

#### Existing Agent Flow (Appointed)
```
1. Admin creates account with "existing agent" flag
   └── Profile created with onboarding_status: APPOINTED
   └── Skips contracting requirement

2. Agent sets password and logs in
   └── Full platform access immediately
```

#### Admin User Creation
```
1. Super Admin creates admin (CreateAdminDialog)
   └── Edge function: create-admin
   └── Profile with onboarding_status: APPOINTED
   └── Role assigned: admin or super_admin
   └── Setup email sent

2. Admin sets password and gains access
   └── /admin dashboard
   └── User management
   └── Contracting queue
```

### Permission Matrix

| Feature | Super Admin | Admin | Manager | Agent |
|---------|-------------|-------|---------|-------|
| Admin Dashboard | Yes | Yes | No | No |
| Create Users | All roles | Agents, Managers | No | No |
| View All Users | Yes | Yes | Team only | No |
| System Settings | Yes | No | No | No |
| Contracting Queue | Yes | Yes | No | No |
| PDF Tools | Yes | Yes | No | No |
| Agent Dashboard | Yes | Yes | Yes | Yes |
| Contracting Form | No | No | No | If required |
| Carrier Resources | Yes | Yes | Yes | Yes |

---

## 6. Dead Code

### TODO/FIXME Comments
**Status:** None found in codebase.

### Commented-Out Code Blocks

#### App.tsx (Routes and Imports)
```typescript
// Lines 19-22: Training page imports (MVP deferred)
// import SalesTrainingPage from "./pages/SalesTrainingPage";
// import SalesTrainingModulePage from "./pages/SalesTrainingModulePage";
// import TrainingLibraryPage from "./pages/TrainingLibraryPage";
// import MedicareFundamentalsPage from "./pages/MedicareFundamentalsPage";

// Lines 217-222: Training routes (MVP deferred)
/* MVP: Training routes removed (placeholder content)
<Route path="/sales-training" element={<ProtectedRoute><SalesTrainingPage /></ProtectedRoute>} />
...
*/
```

#### Navigation.tsx
```typescript
// Line 17: Training Hub link
// { name: "Training Hub", href: "/sales-training" },
```

### Console Statements

| Type | Count | Action Needed |
|------|-------|---------------|
| console.log (debug) | 4 | Remove before production |
| console.error (error handling) | 51 | Acceptable |
| console.warn | 3 | Acceptable |

**Debug logs to remove:**
- `TestEmailButton.tsx:37` - Email response logging
- `AgentProfileDropdown.tsx:16` - Logout error
- `Navigation.tsx:36` - Logout error
- `ContractingForm.tsx:178` - Logout error

### Unused Exports

#### src/lib/formatters.ts
| Export | Status |
|--------|--------|
| formatNPN | Unused |
| maskSSN | Unused |
| maskEIN | Unused |
| formatEIN | Unused |
| getDigitsOnly | Unused |
| formatZipCode | Unused |
| isValidZipCode | Unused |

#### src/hooks/useContractingValidation.ts
| Export | Status |
|--------|--------|
| validatePersonalInfo | Exported but not used |
| validateLicensing | Exported but not used |
| VALIDATION_MESSAGES | Exported but not used |
| ValidationResult | Exported but not used |

**Recommendation:** These validation functions appear designed for use but not yet integrated into the form validation flow.

---

## 7. External Integrations

### Active Integrations

#### Supabase (Core Backend)
- **Purpose:** Database, authentication, storage, edge functions
- **Configuration:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
- **Status:** Complete - Core to entire application

#### Resend (Transactional Email)
- **Purpose:** Setup emails, inquiry confirmations, contracting packets
- **Configuration:** `RESEND_API_KEY` (edge functions)
- **Endpoints:** send-setup-link, send-agent-inquiry, send-contracting-packet
- **Status:** Complete

#### Microsoft OAuth & Graph API
- **Purpose:** Outlook email integration
- **Configuration:** `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_TENANT_ID`
- **Endpoints:** microsoft-oauth-start, microsoft-oauth-callback, microsoft-send-email
- **Status:** Complete (token encryption TODO)

#### Google Places API
- **Purpose:** Address autocomplete in contracting forms
- **Configuration:** `VITE_GOOGLE_PLACES_API_KEY`
- **Usage:** AddressAutocomplete.tsx
- **Status:** Complete

#### OpenAI (Embeddings)
- **Purpose:** Document embeddings for RAG search
- **Configuration:** `OPENAI_API_KEY` (edge functions)
- **Model:** text-embedding-3-small
- **Status:** Complete

#### Lovable AI Gateway
- **Purpose:** AI chatbot (agent-chat function)
- **Configuration:** `LOVABLE_API_KEY`
- **Model:** google/gemini-2.5-flash
- **Status:** Complete

#### Vercel (Deployment)
- **Purpose:** Frontend hosting and deployment
- **Configuration:** `VERCEL_OIDC_TOKEN`
- **Domain:** tigagenthub.com
- **Status:** Complete

### Integration Status Summary

| Service | Purpose | Status |
|---------|---------|--------|
| Supabase | Backend | Complete |
| Resend | Email | Complete |
| Microsoft Graph | Outlook Email | Complete (encryption TODO) |
| Google Places | Address Autocomplete | Complete |
| OpenAI | RAG Embeddings | Complete |
| Lovable AI | Chat Agent | Complete |
| Vercel | Hosting | Complete |

### Environment Variables Required

**Frontend (.env):**
```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_GOOGLE_PLACES_API_KEY
```

**Edge Functions (Supabase Secrets):**
```
RESEND_API_KEY
OPENAI_API_KEY
LOVABLE_API_KEY
MICROSOFT_CLIENT_ID
MICROSOFT_CLIENT_SECRET
MICROSOFT_TENANT_ID
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_ANON_KEY
FRONTEND_URL
SITE_URL
```

---

## Summary

### Project Health

| Category | Status | Notes |
|----------|--------|-------|
| Core Architecture | Healthy | Well-structured React + Supabase app |
| Feature Completeness | ~90% | Training features deferred |
| Database Schema | Complete | 15 tables with RLS |
| Edge Functions | 18/19 Complete | fetch-edge-logs stubbed |
| Authentication | Complete | Full RBAC implementation |
| External Integrations | Complete | All 7 services integrated |
| Code Quality | Good | Minimal dead code, 4 debug logs to remove |

### Pre-MVP Checklist

- [ ] Remove 4 debug console.log statements
- [ ] Implement Microsoft OAuth token encryption
- [ ] Remove or document unused formatter functions
- [ ] Integrate useContractingValidation hooks or remove
- [ ] Consider implementing fetch-edge-logs or removing
- [ ] Review training features for post-MVP roadmap

### Architecture Strengths

1. **Clean separation of concerns** - Custom hooks for domain logic
2. **Type safety** - Full TypeScript with Zod validation
3. **Security** - RLS on all tables, role-based access
4. **Scalability** - Edge functions for compute-intensive operations
5. **Modern stack** - React 18, Vite, shadcn/ui

### Technical Debt

1. Microsoft OAuth token encryption not implemented
2. Unused validation hook exports
3. Unused formatter functions
4. Stubbed edge function (fetch-edge-logs)
5. Training feature code commented out

---

*This document serves as the source of truth for the Tyler Agent Haven project state as of the Pre-MVP audit date.*
