# TIG Platform Audit
**Date:** January 7, 2026
**Audit Scope:** Complete platform analysis for MVP cleanup

---

## Executive Summary

Tyler Insurance Group Agent Platform is a React + Supabase application for agent onboarding, contracting, certifications, and carrier management. The platform has approximately **43 pages** and **100+ components**, but many features are incomplete, placeholder, or unused.

**Key Findings:**
- Core contracting flow is **MVP-ready**
- Agent-facing resource pages are **mostly static/hardcoded**
- Admin tools are **functional** but have verbose debug logging
- Multiple **unused files** and **test-mode components** should be removed for production
- **No database migrations** exist for new queue columns

---

## 1. Route/Page Inventory

### Authentication Routes (3)
| Path | Component | Status | Notes |
|------|-----------|--------|-------|
| `/auth` | AuthPage | Working | Login/signup with agent inquiry form |
| `/auth/set-password` | SetPasswordPage | Working | Password recovery flow |
| `/auth/forgot-password` | ForgotPasswordPage | Working | Reset email trigger |

### Agent Routes (16)
| Path | Component | Status | Notes |
|------|-----------|--------|-------|
| `/` | Index | Working | Main dashboard with hardcoded content |
| `/start-here` | StartHerePage | Working | Onboarding roadmap (static) |
| `/contracting` | ContractingPage | **MVP-Ready** | 12-step wizard, PDF generation |
| `/contracting-hub` | ContractingHubPage | Working | Links to contracting resources |
| `/certifications` | CertificationsPage | Incomplete | Only 2026 KY data populated |
| `/sales-training` | SalesTrainingPage | **Broken** | All modules are placeholders |
| `/sales-training-module` | SalesTrainingModulePage | **Broken** | No real content |
| `/medicare-fundamentals` | MedicareFundamentalsPage | Incomplete | Partial content |
| `/training-library` | TrainingLibraryPage | **Broken** | Lorem ipsum placeholders |
| `/compliance` | CompliancePage | Incomplete | Some links are "#" placeholders |
| `/carrier-resources` | CarrierResourcesPage | Working | Dynamic carrier/state selection |
| `/carrier-resources/plans` | CarrierPlansPage | Working | Plan documents |
| `/agent-tools` | AgentToolsPage | Working | Carrier portals, tools links |
| `/carrier-portals` | CarrierPortalsPage | Working | State-filtered portal links |
| `/forms-library` | FormsLibraryPage | Incomplete | Only 4 PDFs available |
| `/industry-updates` | IndustryUpdatesPage | Unknown | Not audited in detail |
| `/contact` | ContactPage | Working | Contact information |
| `/about` | AboutPage | Working | About TIG |

### Admin Routes (13)
| Path | Component | Status | Access |
|------|-----------|--------|--------|
| `/admin` | AdminDashboard | Working | Admin+ |
| `/admin/agents` | AgentsPage | Working | Admin+ |
| `/admin/agents/new` | NewAgentPage | Working | Admin+ |
| `/admin/users/:userId` | UserDetailPage | Working | Admin+ |
| `/admin/managers` | ManagersPage | Working | Super Admin |
| `/admin/managers/new` | NewManagerPage | Working | Super Admin |
| `/admin/contracting` | ContractingQueuePage | **MVP-Ready** | Admin+ |
| `/admin/hierarchy` | HierarchyManagementPage | Working | Admin+ |
| `/admin/settings` | AdminSettingsPage | Working | Super Admin |
| `/admin/documents` | DocumentManagementPage | Working | Admin+ |
| `/admin/platform-map` | PlatformMapPage | Working | Admin+ |
| `/admin/pdf-extractor` | PdfFieldExtractorPage | Dev Tool | Super Admin |
| `/admin/pdf-mapper` | PdfFieldMapperPage | Dev Tool | Admin+ |
| `/admin/pdf-audit` | PdfFieldAuditPage | Dev Tool | Admin+ |

### Developer Routes (8)
| Path | Component | Status | Notes |
|------|-----------|--------|-------|
| `/developer` | DeveloperDashboard | Working | Dev overview |
| `/developer/feature-flags` | FeatureFlagsPage | Working | Toggle flags |
| `/developer/system-health` | SystemHealthPage | Working | System monitoring |
| `/developer/test-seeder` | TestDataSeederPage | Working | Create test agents |
| `/developer/experience-map` | PlatformExperienceMapPage | Working | UX flow diagram |
| `/developer/view-as` | ViewAsPage | Working | Impersonate users |
| `/developer/pdf-extractor` | PdfFieldExtractorPage | Dev Tool | Same as admin |
| `/developer/pdf-mapper` | PdfFieldMapperPage | Dev Tool | Same as admin |
| `/developer/pdf-audit` | PdfFieldAuditPage | Dev Tool | Same as admin |
| `/developer/platform-map` | PlatformMapPage | Dev Tool | Same as admin |

### Unused Pages (1)
| File | Notes |
|------|-------|
| `SuperAdminDashboard.tsx` | Exists but not routed in App.tsx |

---

## 2. Navigation Structure

### Main Navigation (Agent View)
```
Dashboard | Onboarding | Contracting Hub | Certifications | Training Hub | Agent Tools | Compliance | Support
```

### Conditional Links
- **Admin Link**: Shows for admin/super_admin roles (not in agent view mode)
- **Developer Link**: Shows only for users with developer_access flag
- **Profile Dropdown**: Agent profile menu with logout

### Admin Sidebar (implied from dashboard)
- Dashboard
- Agents
- Managers (Super Admin only)
- Contracting Queue
- Hierarchy
- Settings (Super Admin only)

---

## 3. Database Tables

### Core Tables (14)
| Table | Purpose | Status |
|-------|---------|--------|
| `profiles` | User profile data, onboarding status | Active |
| `user_roles` | Role assignments (super_admin, admin, manager, agent) | Active |
| `contracting_applications` | Agent contracting form data | Active |
| `carriers` | Carrier master list | Active |
| `carrier_statuses` | Per-user carrier contracting status | Active |
| `carrier_certifications` | Certification tracking per carrier | Active |
| `ahip_certifications` | AHIP certification tracking | Active |
| `certification_windows` | Carrier cert open/close dates | Active |
| `state_carriers` | Carrier availability by state | Active |
| `hierarchy_entities` | Agency/team hierarchy | Active |
| `entity_owners` | Hierarchy ownership mapping | Active |
| `feature_flags` | Feature toggle system | Active |
| `system_config` | System-wide configuration | Active |
| `document_chunks` | RAG embeddings for chat | Active |
| `processing_jobs` | Document processing queue | Active |

### Missing Columns (Need Migration)
The contracting queue feature requires these columns on `contracting_applications`:
```sql
ALTER TABLE contracting_applications
ADD COLUMN IF NOT EXISTS queue_status TEXT DEFAULT 'needs_action',
ADD COLUMN IF NOT EXISTS sent_to_pinnacle_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS requested_carriers TEXT[];
```

### Enums
- `app_role`: super_admin, admin, manager, independent_agent, internal_tig_agent
- `onboarding_status`: CONTRACTING_REQUIRED, CONTRACTING_SUBMITTED, APPOINTED, SUSPENDED

---

## 4. Components Inventory

### Core Components (10)
| Component | Location | Status |
|-----------|----------|--------|
| Navigation | `src/components/Navigation.tsx` | Active |
| Footer | `src/components/Footer.tsx` | Active |
| ProtectedRoute | `src/components/ProtectedRoute.tsx` | Active |
| AgentProfileDropdown | `src/components/AgentProfileDropdown.tsx` | Active |
| AgentViewToggle | `src/components/AgentViewToggle.tsx` | Active |
| AgentChatWidget | `src/components/AgentChatWidget.tsx` | Active |
| DarkModeToggle | `src/components/DarkModeToggle.tsx` | Active |
| TestModeBanner | `src/components/TestModeBanner.tsx` | Dev Only |
| ViewModeBanner | `src/components/ViewModeBanner.tsx` | Active |
| PasswordGate | `src/components/PasswordGate.tsx` | Active |

### UI Components (45+)
All shadcn/ui components in `src/components/ui/` - standard library, keep all.

### Admin Components (12)
| Component | Status | Notes |
|-----------|--------|-------|
| UserManagementTable | Active | User CRUD |
| CreateUserDialog | Active | Add user modal |
| CreateAdminDialog | Active | Add admin modal |
| SystemStatusCard | Active | System overview |
| CarrierStatusPanel | Active | Carrier status management |
| CarrierManagement | Active | Carrier settings |
| AgentDocumentsCard | Active | Document viewer |
| ContractingSubmissionDetail | Active | Review submissions |
| HierarchyManagement | Active | Hierarchy CRUD |
| HierarchyAssignmentPanel | Active | Assign users to hierarchy |
| StateDefaultsManagement | Active | State carrier defaults |
| DevOpsDocumentation | Active | Dev docs viewer |

### Contracting Components (20+)
| Component | Status | Notes |
|-----------|--------|-------|
| ContractingForm | Active | Main wizard |
| SectionNav | Active | Step navigation |
| SignaturePad | Active | Signature capture |
| InitialsPad | Active | Initials capture |
| FileDropZone | Active | Document upload |
| SuccessModal | Active | Completion modal |
| All section components | Active | Form sections |
| TestMode* components (8) | **Dev Only** | Debug panels |

### Queue Components (4)
| Component | Status | Notes |
|-----------|--------|-------|
| `admin/queue/AgentList` | Active | Queue list |
| `admin/queue/AgentPanel` | Active | Queue detail panel |
| `contracting/SendToPinnacleModal` | Active | Email composition |
| `contracting/AgentPanel` | **UNUSED** | Duplicate, not imported |

---

## 5. Features Audit

### MVP-Ready Features
| Feature | Status | Notes |
|---------|--------|-------|
| User Authentication | Working | Supabase Auth |
| Agent Contracting Wizard | Working | 12-step form |
| PDF Generation | Working | Edge function |
| Contracting Queue | Working | List + send to Pinnacle |
| Email via Microsoft Graph | Working | Edge function |
| User Management | Working | CRUD operations |
| Role-Based Access | Working | Admin/Super Admin/Agent |
| Feature Flags | Working | Toggle features |
| Dark Mode | Working | Theme toggle |

### Incomplete Features
| Feature | Status | Missing |
|---------|--------|---------|
| Certifications Page | Partial | Only 2026 KY data |
| Compliance Page | Partial | CMS links are placeholders |
| Forms Library | Partial | Only 4 PDFs |
| Agent Chat (RAG) | Partial | Embeddings may be stale |

### Broken/Placeholder Features
| Feature | Status | Notes |
|---------|--------|-------|
| Sales Training | Broken | All modules placeholder |
| Training Library | Broken | Lorem ipsum content |
| Medicare Fundamentals | Broken | No real content |
| Industry Updates | Unknown | Needs review |

---

## 6. Test/Dummy Data

### Sample Data Files
| File | Purpose | Action |
|------|---------|--------|
| `src/data/sampleContractingPayload.ts` | PDF testing | Keep for dev |

### Test Mode Features
| Component/Flag | Purpose | Production Action |
|----------------|---------|-------------------|
| `test_mode` feature flag | Enables test panels | Disable |
| `TestModeBanner` | Shows test mode indicator | Hide |
| `TestMode*` components (8) | Debug panels in contracting | Hide via flag |
| `is_test` field on profiles | Marks test users | Filter in UI |
| `is_test` field on contracting_applications | Marks test submissions | Filter in UI |

### Hardcoded Test Values
- `generateTestInitialsImage()` in ContractingForm.tsx - generates test images
- `generateTestSignatureImage()` in ContractingForm.tsx - generates test images

---

## 7. Console.logs and Debug Code

### Files with Console Statements (40+)
Heavy logging found in:
- `useContractingPdf.ts` - 30+ log statements for PDF debugging
- `NewAgentPage.tsx` - 15+ log statements
- `OutlookConnectButton.tsx` - 10+ log statements
- `ContractingForm.tsx` - Debug submission logging
- Most error handlers use `console.error` (acceptable)

### Recommended Cleanup
```
High Priority (verbose debug logs):
- useContractingPdf.ts - Remove session/token debug logs
- NewAgentPage.tsx - Remove request/response logs
- OutlookConnectButton.tsx - Remove OAuth flow logs
- ContractingForm.tsx - Remove submission debug logs

Keep (error handling):
- console.error statements in catch blocks
- console.warn for non-critical issues
```

---

## 8. Unused Code

### Unused Files
| File | Reason | Action |
|------|--------|--------|
| `src/pages/admin/SuperAdminDashboard.tsx` | Not routed | Remove |
| `src/components/contracting/AgentPanel.tsx` | Duplicate, not imported | Remove |

### Unused Imports (Spot Check)
Most files have clean imports. Run `npm run lint` for comprehensive check.

### Dead Routes
None found - all routes in App.tsx have corresponding pages.

---

## 9. Action Items for MVP Cleanup

### Critical (Before Launch)
- [ ] Run SQL migration to add queue columns to `contracting_applications`
- [ ] Disable `test_mode` feature flag in production
- [ ] Remove or guard TestMode* components from contracting form
- [ ] Filter `is_test=true` records from production queries

### High Priority
- [ ] Remove verbose console.log statements from:
  - `useContractingPdf.ts`
  - `NewAgentPage.tsx`
  - `OutlookConnectButton.tsx`
  - `ContractingForm.tsx`
- [ ] Delete unused files:
  - `src/pages/admin/SuperAdminDashboard.tsx`
  - `src/components/contracting/AgentPanel.tsx`
- [ ] Fix or hide broken pages:
  - Hide "Training Hub" from nav or show "Coming Soon"
  - Hide "Training Library" link
  - Mark incomplete resources as "Coming Soon"

### Medium Priority
- [ ] Complete Certifications page data for all states
- [ ] Add remaining forms to Forms Library
- [ ] Fix placeholder CMS links in Compliance page
- [ ] Review and update Industry Updates page

### Low Priority
- [ ] Add document preview to contracting queue
- [ ] Add bulk actions to queue
- [ ] Add communication history to agent detail
- [ ] Implement real content for Sales Training

---

## 10. Edge Functions Inventory

### Active Functions (19)
| Function | Purpose | Status |
|----------|---------|--------|
| `agent-chat` | AI chat (non-RAG) | Active |
| `agent-chat-rag` | AI chat with embeddings | Active |
| `create-admin` | Create admin users | Active |
| `create-agent` | Create agent users | Active |
| `delete-user` | Delete users | Active |
| `extract-pdf-fields` | PDF field extraction | Dev Tool |
| `fetch-edge-logs` | Get edge function logs | Dev Tool |
| `generate-contracting-pdf` | Fill contracting PDF | Active |
| `microsoft-oauth-start` | Start OAuth flow | Active |
| `microsoft-oauth-callback` | OAuth callback | Active |
| `microsoft-send-email` | Send email via Graph | Active |
| `pdf-field-audit` | Audit PDF mappings | Dev Tool |
| `process-document` | Process docs for RAG | Active |
| `reset-contracting-status` | Reset agent status | Active |
| `reset-user-password` | Password reset | Active |
| `send-agent-inquiry` | New agent inquiry | Active |
| `send-contracting-packet` | (Legacy?) | Review |
| `send-setup-link` | Send onboarding email | Active |
| `validate-password` | Password validation | Active |

---

## 11. Hooks Inventory

| Hook | Purpose | Status |
|------|---------|--------|
| `useAuth` | Authentication state | Active |
| `useRole` | Role checking | Active |
| `useProfile` | User profile data | Active |
| `useAgentProfile` | Agent-specific profile | Active |
| `useContractingApplication` | Contracting form state | Active |
| `useContractingPdf` | PDF generation | Active |
| `useContractingValidation` | Form validation | Active |
| `useFormValidation` | Generic validation | Active |
| `useSendEmail` | Email via MS Graph | Active |
| `useUserManagement` | User CRUD | Active |
| `useSystemStatus` | System health | Active |
| `useDarkMode` | Theme state | Active |
| `useDeveloperAccess` | Dev mode check | Active |
| `use-toast` | Toast notifications | Active |

---

## 12. Summary

### What's Working
- Full authentication flow
- Agent contracting wizard (12 steps)
- PDF generation and signing
- Contracting queue with email to Pinnacle
- Admin user management
- Role-based access control
- Feature flag system

### What Needs Work
- Training content is placeholder
- Certifications data incomplete
- Some compliance links broken
- Verbose debug logging

### What to Remove
- Unused SuperAdminDashboard page
- Duplicate AgentPanel component
- Console.log spam in production

### MVP Recommendation
The platform is **MVP-ready for contracting workflow**. Focus cleanup on:
1. Running the database migration
2. Disabling test mode
3. Removing debug logs
4. Hiding incomplete features with "Coming Soon" indicators
