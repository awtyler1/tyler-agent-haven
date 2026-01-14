# Tyler Insurance Group Agent Haven Platform - Comprehensive Analysis Report

**Generated:** January 14, 2026
**Purpose:** Strategic planning and AI assistant handoff document

---

## 1. PROJECT OVERVIEW

### What is This Application?
This is **Tyler Insurance Group's Agent Management & Contracting Platform** - a comprehensive web application for insurance agent onboarding, contracting, certifications, and training. The platform digitizes the entire agent lifecycle from initial application through appointment and ongoing compliance.

### Problem It Solves
- Streamlines insurance agent onboarding with a 12-step digital contracting wizard
- Centralizes document collection and verification
- Tracks carrier appointments and certifications per agent
- Manages organizational hierarchy (uplines, downlines, teams)
- Provides training and compliance resources

### Tech Stack Summary

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18.3.1, TypeScript 5.8.3, Vite 5.4.19 |
| **Styling** | TailwindCSS 3.4.17, shadcn/ui (48 components) |
| **State Management** | TanStack React Query 5.83.0, React Hook Form 7.61.1 |
| **Backend** | Supabase (PostgreSQL 17.6 + Edge Functions) |
| **Auth** | Supabase Auth (JWT-based) |
| **Storage** | Supabase Storage (documents, certificates) |
| **Email** | Resend API + Microsoft Graph API |
| **AI/Chat** | OpenAI embeddings, Lovable (Gemini 2.5 Flash) |
| **PDF** | pdf-lib, jsPDF, pdfjs-dist |
| **Deployment** | Vercel (frontend), Supabase (backend) |

### Project Structure
```
tyler-agent-haven/
├── src/
│   ├── pages/              # 33 page components
│   ├── components/         # 100+ components
│   │   ├── ui/             # 48 shadcn/ui primitives
│   │   ├── contracting/    # 30 contracting form components
│   │   ├── admin/          # 16 admin components
│   │   └── training/       # Training video components
│   ├── hooks/              # 15 custom hooks
│   ├── integrations/       # Supabase client & types
│   ├── contexts/           # Feature flags
│   └── types/              # TypeScript definitions
├── supabase/
│   ├── migrations/         # 30+ database migrations
│   └── functions/          # 18 Edge Functions
└── public/templates/       # PDF templates
```

---

## 2. DATABASE SCHEMA

### Core Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| **profiles** | User accounts & onboarding | user_id, email, full_name, onboarding_status, is_active, hierarchy_entity_id, upline_user_id |
| **user_roles** | RBAC | user_id, role (super_admin, admin, manager, internal_tig_agent, independent_agent) |
| **contracting_applications** | 60+ field contracting form | user_id, status, current_step, personal info, addresses, licensing, banking, documents, signatures |
| **carriers** | Insurance carrier registry | code, name, is_active, product_tags[], state_availability[], requires_corporate_resolution |
| **carrier_statuses** | Per-agent per-carrier status | user_id, carrier_id, contracting_status, contracted_at |
| **ahip_certifications** | Annual AHIP cert tracking | user_id, certification_year, status, certificate_url |
| **carrier_certifications** | Per-carrier cert tracking | user_id, carrier_id, certification_year, status |
| **hierarchy_entities** | Teams, MGAs, GAs | name, entity_type, parent_entity_id, is_active |
| **document_chunks** | AI document search | document_name, chunk_text, embedding (vector[1536]) |

### Key Relationships
```
auth.users
  ├─ profiles (1:1)
  ├─ user_roles (1:many)
  ├─ contracting_applications (1:many)
  ├─ ahip_certifications (1:many)
  └─ carrier_certifications (1:many)

carriers
  ├─ carrier_statuses (1:many)
  ├─ carrier_certifications (1:many)
  └─ certification_windows (1:many)
```

### RLS Policies
All tables have Row Level Security enabled:
- Users can only access their own data
- Admins can access all data
- Managers can view their downline's data
- Security definer functions (`has_role`, `get_user_role`) prevent RLS recursion

### Key Database Functions
- `search_documents()` - Vector similarity search for AI chat
- `has_role(user_id, role)` - Role checking
- `update_updated_at_column()` - Auto-timestamp trigger

### Enums
```sql
app_role: 'super_admin', 'admin', 'manager', 'independent_agent', 'internal_tig_agent'
onboarding_status: 'CONTRACTING_REQUIRED', 'CONTRACTING_SUBMITTED', 'APPOINTED', 'SUSPENDED'
```

---

## 3. FEATURE INVENTORY

| Feature | Status | Key Files | Notes |
|---------|--------|-----------|-------|
| **Contracting Form** | Complete | `ContractingForm.tsx`, 18 section components | 12-step wizard with autosave |
| **Admin Dashboard** | Complete | `AdminDashboard.tsx`, `AgentsPage.tsx` | Stats, user management |
| **Contracting Queue** | Complete | `ContractingQueuePage.tsx` (1000+ lines) | Document review, Pinnacle integration |
| **Certifications** | Complete | `CertificationsPage.tsx` | AHIP + carrier certs, PDF checklist |
| **Training Library** | Complete | `TrainingPage.tsx`, 16 Vimeo videos | 6 modules, video progression |
| **Forms Library** | Complete | `FormsLibraryPage.tsx` | 30+ searchable forms |
| **AI Chat Assistant** | Partial | `AgentChatWidget.tsx` | Frontend complete, RAG in edge functions |
| **Email Integration** | Complete | `useSendEmail.ts`, edge functions | Microsoft Graph + Resend |
| **PDF Generation** | Partial | `useContractingPdf.ts` | Client validation, server generation |
| **Hierarchy Management** | Complete | `HierarchyManagementPage.tsx` | CRUD for teams/MGAs/GAs |

### Known Limitations
- Certifications: Only Kentucky 2026 fully populated; other states show empty
- AI Chat: No message persistence across sessions
- PDF: Template must use `/Sig` type signature fields
- Hierarchy: No org chart visualization

### Contracting Form Sections (12 Steps)
1. **Get Started** - Initials entry and overview
2. **Personal & Contact Info** - Name, email, phone, tax ID, birth info
3. **Home Address** - Primary residence
4. **Mailing & Shipping** - Alternative addresses
5. **Licensing** - NPN, resident license, driver's license
6. **Additional Licenses** - Non-resident states
7. **Background Questions Part 1** - Criminal/fraud history
8. **Background Questions Part 2** - Regulatory/disciplinary
9. **Banking & Direct Deposit** - Bank details, beneficiary, commission advancing
10. **Documents** - Upload required documents
11. **Agreements** - Terms acceptance
12. **Sign & Submit** - Final signature

---

## 4. AUTHENTICATION & AUTHORIZATION

### Auth Flow
1. Supabase Auth with JWT tokens
2. Session stored in localStorage with auto-refresh
3. Profile and roles fetched on auth state change
4. Inactive accounts blocked at login

### User Roles (Highest to Lowest)
| Role | Access Level |
|------|--------------|
| **super_admin** | Full system access, can manage admins |
| **admin** | Can manage agents, access admin features |
| **manager** | Can manage their team of agents |
| **internal_tig_agent** | TIG employee agents |
| **independent_agent** | Independent contractor agents |

### Permission Enforcement
- **UI Level**: `ProtectedRoute` component with `requireAdmin`, `requireSuperAdmin`, `requireAgent` props
- **Database Level**: RLS policies on all tables
- **Edge Functions**: `requireAdmin()`, `requireAuthenticated()` helpers

### Key Permission Methods
```typescript
useAuth(): {
  isAdmin(): boolean;
  isSuperAdmin(): boolean;
  isManager(): boolean;
  canAccessAdmin(): boolean;
  canManageAgents(): boolean;
  canViewTeam(): boolean;
}
```

### Route Protection
```
/admin                    → requireAdmin
/admin/pdf-extractor     → requireSuperAdmin
/admin/managers/*        → requireSuperAdmin
/contracting             → requireAgent + allowContractingOnly
```

---

## 5. INTEGRATIONS

| Service | Purpose | Auth Method |
|---------|---------|-------------|
| **Supabase** | Database, Auth, Storage, Edge Functions | Anon key (client), Service role key (server) |
| **Microsoft Graph** | Send emails via Outlook | OAuth 2.0 with refresh tokens |
| **Resend** | Transactional emails | API key |
| **OpenAI** | Document embeddings for RAG | API key |
| **Lovable** | AI chatbot (Gemini 2.5 Flash) | API key |
| **Google Places** | Address autocomplete | API key |
| **Vercel** | Frontend deployment | OIDC token |

### Edge Functions (18 total)

| Function | Purpose | Auth |
|----------|---------|------|
| `create-agent` | Create user accounts | Admin |
| `create-admin` | Create admin accounts | Admin |
| `send-setup-link` | Password setup emails | Admin |
| `generate-contracting-pdf` | Fill PDF templates | User |
| `send-contracting-packet` | Email contracting docs | User |
| `agent-chat` | AI chatbot | Public |
| `agent-chat-rag` | AI chat with document search | JWT |
| `process-document` | PDF to embeddings | Admin |
| `microsoft-oauth-start` | OAuth flow initiation | User |
| `microsoft-oauth-callback` | OAuth redirect handler | Public |
| `microsoft-send-email` | Outlook integration | User |
| `extract-pdf-fields` | PDF field extraction | Developer |
| `pdf-field-audit` | PDF field inspection | Developer |
| `fetch-edge-logs` | Log retrieval | Developer |
| `send-agent-inquiry` | Public inquiry form | Public |
| `delete-user` | User deletion | Super Admin |
| `reset-user-password` | Password reset | Admin |
| `reset-contracting-status` | Reset onboarding | Admin |
| `validate-password` | Password strength check | Public |

### Environment Variables Required

**Client-Side (.env):**
```
VITE_SUPABASE_URL=https://mgczpsrtkdkkjzmztpyd.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon_key>
VITE_GOOGLE_PLACES_API_KEY=<google_api_key>
```

**Server-Side (Edge Functions):**
```
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
MICROSOFT_CLIENT_ID
MICROSOFT_CLIENT_SECRET
MICROSOFT_TENANT_ID
RESEND_API_KEY
OPENAI_API_KEY
LOVABLE_API_KEY
SITE_URL (default: https://www.tigagenthub.com)
FRONTEND_URL (default: https://tyler-agent-haven.vercel.app)
```

---

## 6. TECHNICAL DEBT & CONCERNS

### High Priority Issues

| Issue | Location | Severity |
|-------|----------|----------|
| Double type casting `as unknown as` | `useContractingApplication.ts:66,83` | Medium |
| Missing `.catch()` on promises | `useProfile.ts:45-52` | Medium |
| 35+ console.log/error statements | Throughout codebase | Low-Medium |
| TODO: Error tracking service | `ErrorBoundary.tsx:30` | High |
| LocalStorage manipulation for auth | Multiple files | Medium |

### Security Concerns
- Google Places API key exposed in client code (acceptable for restricted keys)
- `dangerouslySetInnerHTML` in chart component (controlled content)
- Client-side rate limiting easily bypassed (`AuthPage.tsx:92-94`)

### Hardcoded Values Needing Configuration
| Value | Location | Current |
|-------|----------|---------|
| Debounce delay | `useContractingApplication.ts:11` | 800ms |
| Total form steps | `ContractingForm.tsx:55` | 12 |
| Rate limit cooldown | `AuthPage.tsx:93` | 10 minutes |
| Password min length | `UserManagementTable.tsx:23` | 12 |

### Code Quality Issues
- 50+ `Math.random()` calls in `PdfFieldMapperPage.tsx` (test data generators)
- Inconsistent import paths (mix of `@/` alias and relative)
- Navigation menu logic could be abstracted into reusable component
- Some TypeScript `any` usage that could be better typed

### Technical Debt Summary

| Category | Count | Severity |
|----------|-------|----------|
| Security Vulnerabilities | 8 | High |
| Code Quality Issues | 12 | Medium |
| Missing Error Handling | 6 | Medium |
| Debug/Console Code | 35+ | Low-Medium |
| Hardcoded Values | 8 | Medium |
| TODO/FIXME | 2 | High |
| Type Safety Issues | 8 | Medium |

---

## 7. DEPLOYMENT & ENVIRONMENT

### Deployment Platform
- **Frontend**: Vercel (auto-deploy on push to main)
- **Backend**: Supabase Edge Functions
- **Project ID**: `prj_D5t9CF3rCx82fij0B26o5ernvzwQ`
- **Supabase Project**: `mgczpsrtkdkkjzmztpyd`

### Build Commands
```bash
npm run dev              # Development server (port 8080)
npm run build            # Production build
npm run build:dev        # Development mode build
npm run lint             # ESLint validation
npm run preview          # Preview production build
npm run deploy:functions # Deploy Supabase edge functions
```

### Vercel Configuration (`vercel.json`)
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Build Configuration
- **Vite**: Server runs on port 8080, React SWC plugin
- **TypeScript**: ES2020 target, strict mode disabled
- **Path Alias**: `@/` resolves to `./src`

### No CI/CD Pipeline
Currently relies on:
- Lovable platform auto-commits
- Vercel auto-deploy on git push
- Manual Supabase function deployment via `scripts/deploy-functions.sh`

### Deployment Checklist
- [ ] Environment variables configured in Vercel
- [ ] Google Places API key valid
- [ ] Supabase functions deployed
- [ ] Build succeeds: `npm run build`
- [ ] Linting passes: `npm run lint`

---

## 8. BUSINESS LOGIC SUMMARY

### Agent Onboarding Workflow
```
Account Created (CONTRACTING_REQUIRED)
         ↓
Complete 12-Step Wizard
         ↓
Submit (CONTRACTING_SUBMITTED)
         ↓
Admin Review in Queue (needs_action → in_progress)
         ↓
Send to Pinnacle (sent_to_pinnacle)
         ↓
Process Complete (completed)
         ↓
Agent Appointed (APPOINTED)
```

### Contracting Queue Workflow
1. Agent submits → appears in queue with `needs_action`
2. Admin reviews documents, updates to `in_progress`
3. Admin selects carriers, clicks "Send to Pinnacle"
4. System emails docs with NPN-prefixed filenames to `pfslicensing@pfsinsurance.com`
5. Admin marks `completed`, changes onboarding status to `APPOINTED`

### Hierarchy Management
- **Hierarchy Types**: direct, team, mga, ga, loa, downline
- **Entities**: Teams, MGAs, GAs can be nested via `parent_entity_id`
- **Relationships**: Agents linked via `hierarchy_entity_id` and `upline_user_id`

### Certification Rules
1. AHIP certification must be completed first each year
2. Then carrier-specific certifications become available
3. Certification windows define open/close dates
4. Certificates uploaded to dedicated storage bucket

### Required Documents for Contracting

**Core Required (3):**
1. Resident License
2. E&O Insurance Certificate
3. Voided Check

**Conditional:**
- Corporate Resolution (if corporation AND carrier requires)
- Non-resident licenses (one per non-resident state)
- AML/CE/LTC certificates (if claimed)

### Key Validation Rules
- NPN number required for licensing
- Tax ID must be 9 digits
- Phone must be 10 digits (US format)
- All 19 legal questions must be answered
- "Yes" answers require written explanation
- Section acknowledgments require initials
- Final signature required for submission

### Carrier Status Tracking
Each agent has independent status per carrier:
- `not_started` - Initial state
- `in_progress` - Contracting in progress
- `contracted` - Fully appointed
- `issue` - Problem encountered (requires description)

---

## 9. KEY FILE LOCATIONS

### Core Application
| File | Purpose |
|------|---------|
| `src/App.tsx` | Main routing and layout |
| `src/components/ProtectedRoute.tsx` | Auth wrapper |
| `src/hooks/useAuth.ts` | Combined auth state |
| `src/hooks/useProfile.ts` | User profile data |
| `src/hooks/useRole.ts` | Role-based access |
| `src/integrations/supabase/client.ts` | Supabase client |
| `src/integrations/supabase/types.ts` | Database types |

### Contracting System
| File | Purpose |
|------|---------|
| `src/pages/ContractingPage.tsx` | Contracting page wrapper |
| `src/components/contracting/ContractingForm.tsx` | Main form orchestrator |
| `src/components/contracting/sections/*.tsx` | 18 form sections |
| `src/hooks/useContractingApplication.ts` | Form data & autosave |
| `src/hooks/useContractingValidation.ts` | Multi-section validation |
| `src/hooks/useContractingPdf.ts` | PDF generation |
| `src/types/contracting.ts` | Contracting types |

### Admin System
| File | Purpose |
|------|---------|
| `src/pages/admin/AdminDashboard.tsx` | Admin home |
| `src/pages/admin/ContractingQueuePage.tsx` | Queue management |
| `src/pages/admin/AgentsPage.tsx` | Agent management |
| `src/pages/admin/HierarchyManagementPage.tsx` | Hierarchy CRUD |
| `src/components/admin/UserManagementTable.tsx` | User table |
| `src/hooks/useUserManagement.ts` | User CRUD operations |

### Edge Functions
| Function | Purpose |
|----------|---------|
| `supabase/functions/create-agent/` | User creation |
| `supabase/functions/generate-contracting-pdf/` | PDF generation |
| `supabase/functions/send-contracting-packet/` | Email docs |
| `supabase/functions/agent-chat-rag/` | AI chat with RAG |
| `supabase/functions/microsoft-send-email/` | Outlook integration |

---

## 10. SUMMARY FOR STRATEGIC PLANNING

### Strengths
- Comprehensive feature set for agent lifecycle management
- Well-structured React/TypeScript codebase
- Robust Supabase backend with RLS security
- Multiple integration points (email, AI, PDF)
- 12-step contracting wizard with autosave
- Role-based access control at UI and database levels

### Areas Needing Attention
1. Error tracking service not implemented (Sentry recommended)
2. Certifications data incomplete for non-KY states
3. No CI/CD pipeline for automated testing
4. Some TypeScript type safety issues (double casting)
5. Console statements should be removed/replaced with proper logging
6. No org chart visualization for hierarchy

### Recommended Next Steps
1. **Implement Sentry** or similar error tracking
2. **Add automated testing** (Jest/Vitest + Playwright)
3. **Fix type casting anti-patterns** in `useContractingApplication.ts`
4. **Complete certification data** for all states
5. **Add org chart visualization** for hierarchy management
6. **Create configuration file** for hardcoded values
7. **Remove console statements** or implement environment-based logging
8. **Add CI/CD pipeline** with GitHub Actions

### Production URLs
- **Frontend**: Deployed via Vercel
- **Backend**: `https://mgczpsrtkdkkjzmztpyd.supabase.co`
- **Site URL**: `https://www.tigagenthub.com`

---

*This document was generated for strategic planning purposes and AI assistant handoff. Last updated: January 14, 2026.*
