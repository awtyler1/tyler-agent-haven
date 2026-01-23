# Platform Audit Report

**Date:** 2026-01-22
**Purpose:** Comprehensive map of the Agent Platform for product transition decisions

---

## 1. Routes & Pages

### Auth Routes (Public)
| Path | Component | Purpose | Access |
|------|-----------|---------|--------|
| `/auth` | `AuthPage` | Login/signup page | Public |
| `/auth/set-password` | `SetPasswordPage` | Set password after invite | Public |
| `/auth/forgot-password` | `ForgotPasswordPage` | Password reset flow | Public |

### Admin Routes (Admin/Super Admin Only)
| Path | Component | Purpose | Access |
|------|-----------|---------|--------|
| `/admin` | `AdminDashboard` | Search-first dashboard with stats | Admin |
| `/admin/agents` | `AgentsPage` | Full agent roster with filtering | Admin |
| `/admin/agents/new` | `NewAgentPage` | Create new agent profile | Admin |
| `/admin/agents/:profileId` | `AgentProfilePage` | View/edit individual agent | Admin |
| `/admin/users/:userId` | `UserDetailPage` | Legacy user detail view | Admin |
| `/admin/contracting` | `ContractingQueuePage` | Review submitted contracting apps | Admin |
| `/admin/hierarchy` | `HierarchyManagementPage` | Manage agent hierarchy/MGAs | Admin |
| `/admin/rts-import` | `RTSImportPage` | Upload carrier RTS (Ready to Sell) data | Admin |
| `/admin/roadmaps` | `RoadmapGeneratorPage` | Generate agent growth roadmaps | Admin |
| `/admin/documents` | `DocumentManagementPage` | Manage documents (admin view) | Admin |
| `/admin/activity-log` | `ActivityLogPage` | View user activity logs | **Super Admin** |
| `/admin/labs` | `LabsPage` | Experimental features | **Super Admin** |

### Agent Routes (Authenticated)
| Path | Component | Purpose | Access |
|------|-----------|---------|--------|
| `/` | `Index` | Agent dashboard/home with tools grid | All authenticated |
| `/contracting` | `ContractingPage` | Multi-step contracting form | Agents (contracting required) |
| `/contracting-hub` | `ContractingHubPage` | View carrier status, request contracting | All authenticated |
| `/my-profile` | `MyProfilePage` | View/edit own profile | All authenticated |
| `/my-certifications` | `MyCertificationsPage` | View own certifications | All authenticated |
| `/book-of-business` | `BookOfBusinessPage` | Production tracking (new feature) | All authenticated |

### Resource Routes (Authenticated)
| Path | Component | Purpose | Access |
|------|-----------|---------|--------|
| `/start-here` | `StartHerePage` | Onboarding guide | All authenticated |
| `/training` | `TrainingPage` | Video training library | All authenticated |
| `/training/:videoId` | `TrainingPage` | Specific video | All authenticated |
| `/certifications` | `CertificationsPage` | AHIP/carrier cert links | All authenticated |
| `/agent-tools` | `AgentToolsPage` | Quoting, CRM, enrollment links | All authenticated |
| `/carrier-resources` | `CarrierResourcesPage` | Carrier contacts, downloads | All authenticated |
| `/carrier-resources/plans` | `CarrierPlansPage` | Plan documents by carrier | All authenticated |
| `/carrier-portals` | `CarrierPortalsPage` | Direct carrier portal links | All authenticated |
| `/forms-library` | `FormsLibraryPage` | SOA, apps, compliance forms | All authenticated |
| `/compliance` | `CompliancePage` | Compliance resources | All authenticated |
| `/industry-updates` | `IndustryUpdatesPage` | Industry news | All authenticated |
| `/about` | `AboutPage` | About the FMO (TIG-specific) | All authenticated |
| `/contact` | `ContactPage` | Contact info (TIG-specific) | All authenticated |

---

## 2. Roles & Permissions

### Role Definitions
| Role | Level | Purpose |
|------|-------|---------|
| `super_admin` | Highest | Platform owner - full access + Labs, Activity Log, Create Admin |
| `admin` | High | Operations staff - agent management, contracting, hierarchy |
| `manager` | Mid | Team lead - can view downline (not currently used much) |
| `internal_tig_agent` | Agent | W-2 employee agents (TIG-branded) |
| `independent_agent` | Agent | 1099 contracted agents |

### Role Storage
- Roles stored in `user_roles` table (user_id, role)
- Users can have multiple roles (hierarchy check finds highest)
- Role hierarchy: super_admin > admin > manager > internal_tig_agent > independent_agent

### Permission Checks (from `useRole.ts`)
| Function | Logic |
|----------|-------|
| `isAdmin()` | Has super_admin OR admin role |
| `isSuperAdmin()` | Has super_admin role |
| `isAgent()` | Has independent_agent OR internal_tig_agent |
| `hasDownline()` | RPC check if user has agents reporting to them |
| `canAccessAdmin()` | Same as isAdmin() |
| `canManageAgents()` | Same as isAdmin() |
| `canViewTeam()` | hasDownline() OR isAdmin() |

### Route Protection (`ProtectedRoute.tsx`)
| Flag | Behavior |
|------|----------|
| Default | Requires authentication, redirects to `/auth` if not |
| `requireAdmin` | Requires admin or super_admin role |
| `requireSuperAdmin` | Requires super_admin role only |
| `requireAgent` | Requires agent role |
| `allowContractingOnly` | For `/contracting` - agents with `CONTRACTING_REQUIRED` status |

### Onboarding Status Enum
| Status | Meaning |
|--------|---------|
| `CONTRACTING_REQUIRED` | Agent needs to complete contracting form |
| `CONTRACTING_SUBMITTED` | Agent submitted, awaiting review |
| `APPOINTED` | Agent is active and contracted |

---

## 3. Navigation Structure

### Agent Navigation (Navigation.tsx)
Top nav links for authenticated agents:
- Dashboard (/)
- Tools (/agent-tools)
- Training (/training)

### User Avatar Dropdown (UserAvatarDropdown.tsx)
| Item | Condition | Route |
|------|-----------|-------|
| My Dashboard | Admin/Super Admin only | `/` |
| My Profile | All users | `/my-profile` |
| My Carrier Status | All users | `/contracting-hub` |
| Admin Dashboard | canAccessAdmin() | `/admin` |
| Connect Outlook | isAdmin() | OAuth flow |
| Create Admin | isSuperAdmin() | Dialog |
| Activity Log | isSuperAdmin() | `/admin/activity-log` |
| Labs | isSuperAdmin() | `/admin/labs` |
| Dark Mode Toggle | All users | - |
| Sign Out | All users | - |

### Admin Layout
- No separate admin layout component
- Admin pages use custom header with logo + UserAvatarDropdown
- 2x2 card grid on Admin Dashboard for quick navigation

---

## 4. Features by Area

### Agent-Facing Features

#### Contracting Hub (`/contracting-hub`)
- View carrier appointment status
- Request contracting for new carriers
- Track contracting progress per carrier
- State-based carrier availability

#### Contracting Form (`/contracting`)
- Multi-step wizard (7+ sections)
- Personal info, licensing, E&O, banking
- Legal questions, background check
- Signature capture
- Document upload
- Generates PDF for processing

#### Certifications (`/certifications`, `/my-certifications`)
- AHIP certification tracking (by year)
- Carrier certification links
- State-specific certification requirements
- PDF export of certification status

#### Agent Tools (`/agent-tools`)
- External tool links (SunFire, Connecture, etc.)
- Quoting platforms
- CRM links (BOSS CRM)
- Enrollment platforms

#### Training (`/training`)
- Video training library
- Medicare fundamentals
- Sales training (placeholder)

#### Carrier Resources (`/carrier-resources`, `/carrier-portals`)
- Carrier contact information
- Portal login links
- Plan documents
- State-specific data

#### Forms Library (`/forms-library`)
- SOA forms
- Enrollment applications
- Compliance documents
- Downloadable PDFs

#### Book of Business (`/book-of-business`) - NEW
- Production tracking per carrier
- Upload production reports
- Sync flow for new agents
- Dashboard with carrier cards

### Admin-Facing Features

#### Agent Search & Management
- Global search (name, NPN, email)
- Agent roster with filtering
- Status badges (Appointed, Submitted, Pending)
- Manager assignment
- Role management

#### Agent Profile (`/admin/agents/:profileId`)
- View/edit agent details
- Contracting history
- Carrier status panel
- Documents section
- Send setup link
- Role assignment

#### Contracting Queue (`/admin/contracting`)
- Submitted applications list
- Review contracting data
- Assign carriers
- Send to Pinnacle (downstream)
- Status workflow

#### Hierarchy Management (`/admin/hierarchy`)
- Assign managers to agents
- View org structure
- "Direct to TIG" agents

#### RTS Import (`/admin/rts-import`)
- Upload carrier RTS spreadsheets
- Match agents by NPN
- Auto-create profiles for unmatched NPNs
- Import certification data

#### Roadmap Generator (`/admin/roadmaps`)
- Generate agent growth plans
- PDF generation
- Goal setting

#### Activity Log (`/admin/activity-log`) - Super Admin
- User activity tracking
- Login/logout events
- Action audit trail

#### Labs (`/admin/labs`) - Super Admin
- Experimental features
- Feature flags testing

---

## 5. Database Tables

| Table | Purpose | Used By |
|-------|---------|---------|
| `profiles` | Core user profiles (agents, admins) | All features |
| `user_roles` | Role assignments per user | Auth, permissions |
| `contracting_applications` | Multi-step contracting form data | Contracting flow |
| `carriers` | Carrier master list | Contracting, resources |
| `carrier_statuses` | Per-agent carrier appointment status | Contracting Hub |
| `agent_certifications` | Carrier certifications per agent | Certifications |
| `ahip_certifications` | AHIP cert tracking | Certifications |
| `carrier_certifications` | Additional carrier certs | Certifications |
| `activity_logs` | User activity audit trail | Activity Log |
| `agent_documents` | Uploaded documents per agent | Document management |
| `broker_roadmaps` | Growth plan data | Roadmap Generator |
| `certification_windows` | Cert deadline windows | Certifications |
| `contracting_communications` | Email history | Contracting |
| `state_carriers` | State-specific carrier availability | Contracting |
| `feature_flags` | Feature flag configuration | Feature toggles |
| `hierarchy_entities` | Org hierarchy structure | Hierarchy management |
| `entity_owners` | Entity ownership mapping | Hierarchy |
| `microsoft_oauth_tokens` | Outlook integration tokens | Email sending |
| `rts_import_logs` | RTS import history | RTS Import |
| `document_chunks` | RAG document chunks for AI | AI Chat |
| `processing_jobs` | Background job status | Document processing |
| `system_config` | System configuration | Various |

### Database Enums
| Enum | Values |
|------|--------|
| `app_role` | super_admin, admin, manager, internal_tig_agent, independent_agent |
| `onboarding_status` | CONTRACTING_REQUIRED, CONTRACTING_SUBMITTED, APPOINTED |

### Database Functions (RPCs)
| Function | Purpose |
|----------|---------|
| `current_user_has_downline` | Check if user has agents reporting to them |
| `get_my_profile_id` | Get current user's profile ID |
| `get_user_role` | Get user's primary role |
| `has_downline` | Check if specific profile has downline |
| `has_role` | Check if user has specific role |
| `is_admin` | Check if current user is admin |

---

## 6. External Integrations

### Supabase
- **Auth:** Email/password authentication
- **Database:** PostgreSQL via Supabase client
- **Storage:** Document uploads (agent-documents bucket)
- **Edge Functions:** 21 serverless functions

### Supabase Edge Functions
| Function | Purpose |
|----------|---------|
| `agent-chat` | AI chat for agents |
| `agent-chat-rag` | AI chat with document retrieval |
| `create-admin` | Create admin user + send email |
| `create-agent` | Create agent profile + send welcome email |
| `delete-user` | Delete user account |
| `extract-pdf-fields` | Extract form fields from PDF |
| `fetch-edge-logs` | Fetch function logs |
| `generate-contracting-pdf` | Generate contracting packet PDF |
| `generate-growth-plan-pdf` | Generate roadmap PDF |
| `microsoft-oauth-start` | Start Outlook OAuth flow |
| `microsoft-oauth-callback` | Handle OAuth callback |
| `microsoft-send-email` | Send email via Outlook |
| `parse-production-report` | Parse uploaded production data |
| `pdf-field-audit` | Audit PDF form fields |
| `process-document` | Process documents for RAG |
| `reset-contracting-status` | Reset agent contracting status |
| `reset-user-password` | Admin password reset |
| `send-agent-inquiry` | Send lead inquiry email |
| `send-contracting-packet` | Send contracting to Pinnacle + agent |
| `send-setup-link` | Send account setup email |
| `validate-password` | Password validation |

### Email Provider
- **Resend:** Transactional email sending
- **Microsoft Graph:** Outlook integration for admins

### Error Tracking
- **Sentry:** Error monitoring and reporting

### External Links (Agent Tools)
- SunFire Matrix (quoting)
- Connecture (quoting)
- BOSS CRM
- Medicare.gov
- Carrier portals (Aetna, Anthem, Devoted, Humana, UHC, Wellcare)

---

## 7. Book of Business Status

### Components (`src/components/book-of-business/`)
| Component | Purpose | Status |
|-----------|---------|--------|
| `BookOfBusinessPage.tsx` | Main page orchestrator | Working |
| `DashboardView.tsx` | Production dashboard | Working |
| `CarrierCard.tsx` | Individual carrier stats | Working |
| `UploadModal.tsx` | Production report upload | Working |
| `ProductionUpload.tsx` | Upload logic | Working |
| `NudgeBanner.tsx` | Prompt to upload data | Working |
| `SyncFlow.tsx` | Initial sync wizard | Working |
| `SyncCarrierCard.tsx` | Carrier selection card | Working |
| `SyncReveal.tsx` | Sync animation/reveal | Working |
| `SyncMilestone.tsx` | Progress milestone | Working |
| `NewAgentSetup.tsx` | First-time setup flow | Working |
| `EmptyState.tsx` | No data state | Working |

### Flow
1. **New Agent:** Shows `NewAgentSetup` to select carriers
2. **Sync Required:** Shows `SyncFlow` for initial data sync
3. **Dashboard:** Shows `DashboardView` with carrier production cards

### Edge Function
- `parse-production-report` - Parses uploaded production reports

### Current State
- **UI Complete:** Full flow implemented
- **Backend:** Edge function for parsing exists
- **Database:** Uses existing tables (profiles, agent_certifications)
- **Missing:** Dedicated production_data table? (needs verification)

---

## 8. Feature Flags

From `feature_flags` table and `FeatureFlagsContext`:
- Feature flags stored in database
- Loaded on app init
- Used for progressive rollout

---

## 9. Keep / Kill / Hide Recommendations

### KEEP (Core Product Value)
| Feature | Reason |
|---------|--------|
| Contracting Flow | Core workflow - agent onboarding |
| Contracting Hub | Carrier status tracking |
| Agent Management | Essential admin tool |
| Certifications | Compliance tracking |
| Agent Search | Primary admin workflow |
| RTS Import | Critical data flow |
| Role System | Access control |

### KILL (TIG-Specific, Remove)
| Feature | Reason |
|---------|--------|
| About Page | TIG leadership/mission |
| Contact Page | TIG staff contacts |
| "Direct to TIG" labels | TIG branding |
| `internal_tig_agent` role | TIG-specific naming |
| `ownership_group: a_and_a` | Austin & Andrew team |

### HIDE (Keep But Make Optional/Configurable)
| Feature | Reason |
|---------|--------|
| Roadmap Generator | Nice-to-have, not core |
| AI Chat | Experimental feature |
| Industry Updates | Content-dependent |
| Labs Page | Dev-only |

### NEEDS DECISION
| Feature | Question |
|---------|----------|
| Book of Business | Complete it or remove? |
| Training Library | Generic or remove? |
| Forms Library | Carrier-specific forms - portable? |
| Carrier Data | Kentucky-first - expandable? |

---

## 10. Architecture Notes

### File Structure
```
src/
├── components/
│   ├── admin/           # Admin-only components
│   ├── book-of-business/ # BoB feature
│   ├── contracting/     # Contracting form sections
│   ├── training/        # Training components
│   └── ui/              # Shadcn UI components
├── hooks/
│   ├── useAuth.ts       # Auth hook
│   ├── useRole.ts       # Role management
│   └── useProfile.ts    # Profile hook
├── pages/
│   ├── admin/           # Admin pages
│   └── auth/            # Auth pages
├── integrations/
│   └── supabase/        # Supabase client + types
└── contexts/
    └── FeatureFlagsContext.tsx
```

### Key Patterns
- React Query for data fetching
- Shadcn UI component library
- Supabase client for DB access
- Edge functions for server-side logic
- Row Level Security (RLS) for data access

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Total Routes | 30 |
| Admin Routes | 12 |
| Agent Routes | 7 |
| Resource Routes | 11 |
| Database Tables | 21 |
| Edge Functions | 21 |
| User Roles | 5 |
| BoB Components | 11 |
