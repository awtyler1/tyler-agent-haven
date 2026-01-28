# TIG Platform: Comprehensive Analysis

**Prepared for:** Austin Tyler
**Date:** January 27, 2026
**Platform:** TIG Agent Portal (React + TypeScript + Supabase)

---

## Executive Summary

The TIG Platform is a functional Medicare FMO operating system with strong foundations in **agent onboarding** and **certification tracking**. The platform handles the critical pre-AEP workflow well but has significant gaps in **during-AEP** and **post-AEP** agent support. The database architecture is mature (36 tables, 67 migrations) with proper RLS security, but several tables (clients, policies, production tracking) are underutilized.

**Current State:** 70% complete for onboarding, 30% complete for production lifecycle
**Biggest Gap:** No client/lead management during AEP when agents need it most
**Biggest Opportunity:** AI-powered enrollment assistance using existing RAG infrastructure

---

## PART 1: Current State Inventory

### 1.1 Major Features/Modules

| Module | Status | Key Files | Description |
|--------|--------|-----------|-------------|
| **Authentication** | ✅ Complete | `src/hooks/useAuth.ts`, `src/pages/AuthPage.tsx` | Email/password auth, password reset, invite flow, account deactivation |
| **5-Level RBAC** | ✅ Complete | `src/components/ProtectedRoute.tsx` | super_admin → admin → manager → internal_tig_agent → independent_agent |
| **Contracting Wizard** | ✅ Complete | `src/hooks/useContractingApplication.ts` | 8-step form with auto-save, PDF generation, e-signatures |
| **Contracting Hub** | ✅ Complete | `src/pages/ContractingHubPage.tsx` | Per-carrier status tracking, AHIP upload, Ready-to-Sell % |
| **RTS Import** | ✅ Complete | `src/lib/rtsImport.ts`, `src/pages/admin/RTSImportPage.tsx` | Pinnacle Excel → profiles + certifications |
| **Carrier Resources** | ✅ Complete | `src/pages/CarrierResourcesPage.tsx` | Contacts, portals, documents filtered by agent certs |
| **Forms Library** | ✅ Complete | `src/pages/FormsLibraryPage.tsx` | SOA, enrollment, compliance forms |
| **Training Library** | ✅ Complete | `src/pages/TrainingPage.tsx` | Video library with progress tracking |
| **Book of Business** | ⚠️ Partial | `src/pages/BookOfBusinessPage.tsx` | Production upload exists, but dashboard underbuilt |
| **Admin Dashboard** | ✅ Complete | `src/pages/admin/AdminDashboard.tsx` | Search-first design, agent management, queue |
| **Activity Logging** | ✅ Complete | `src/pages/admin/ActivityLogPage.tsx` | Audit trail (super_admin only) |
| **AI Chat (RAG)** | ⚠️ Partial | `supabase/functions/agent-chat-rag/` | Document embeddings exist, UI incomplete |
| **Microsoft Outlook** | ⚠️ Partial | `supabase/functions/microsoft-*` | OAuth working, but limited UI integration |

### 1.2 Database Schema Summary

**36 Tables organized into 6 domains:**

#### Core Identity (5 tables)
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `profiles` | User accounts | user_id, email, full_name, npn, manager_id, onboarding_status, is_active |
| `user_roles` | Role assignments | user_id, role (enum: 5 levels) |
| `activity_logs` | Audit trail | user_id, action_type, entity_type, entity_id, metadata (JSONB) |
| `feature_flags` | Feature toggles | flag_key, flag_value |
| `system_config` | Global config | config_key, config_value (JSONB) |

#### Contracting (4 tables)
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `contracting_applications` | Wizard form data | 80+ columns: personal info, addresses, licensing, banking, legal questions, signatures |
| `carrier_statuses` | Agent-carrier appointments | profile_id, carrier_id, contracting_status, contracted_at |
| `contracting_communications` | Email tracking | agent_id, communication_type, subject, body_html, sent_at |
| `agent_documents` | Uploaded files | profile_id, file_path, document_type, category, expires_at |

#### Certifications (4 tables)
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `agent_certifications` | RTS cert records | profile_id, carrier_name, product_type (MA/PDP/MEDIGAP/MAPD), certification_year |
| `ahip_certifications` | AHIP tracking | user_id, certification_year, status, certificate_url |
| `carrier_certifications` | Per-carrier certs | user_id, carrier_id, certification_year, status |
| `certification_windows` | Open/close dates | carrier_id, certification_year, opens_at, closes_at |

#### Carriers & Resources (5 tables)
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `carriers` | Master carrier list | code, name, rts_aliases, product_tags, state_availability |
| `carrier_contacts` | Broker managers | carrier_id, state_code, contact_type, name, email, phone |
| `carrier_links` | Portal URLs | carrier_id, state_code, link_type, url |
| `carrier_documents` | Guides/forms | carrier_id, state_code, document_type, file_path, year |
| `state_carriers` | State availability | carrier_id, state_code, is_available, is_default |

#### Production Tracking (8 tables)
| Table | Purpose | Key Columns | **Usage Status** |
|-------|---------|-------------|------------------|
| `clients` | Enrolled members | profile_id, medicare_number, first_name, last_name, dob, phone, address | ⚠️ Underutilized |
| `policies` | Policy records | client_id, carrier_id, plan_name, effective_date, term_date, status | ⚠️ Underutilized |
| `production_uploads` | File upload tracking | profile_id, carrier_id, status, imported_count, error_message | ⚠️ Underutilized |
| `monthly_syncs` | Monthly sync records | profile_id, month, status, total_clients | ⚠️ Underutilized |
| `sync_carrier_uploads` | Per-carrier uploads | sync_id, carrier_id, client_count | ⚠️ Underutilized |
| `agent_carriers` | Tracked carriers | profile_id, carrier_id | Active |
| `milestones` | Achievements | profile_id, milestone_type, milestone_value, achieved_at | Active |
| `broker_roadmaps` | Growth plans | profile_id, book_size, monthly_goal, activity_targets (JSONB) | Active |

#### AI & Documents (3 tables)
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `document_chunks` | RAG embeddings | document_name, chunk_text, embedding (vector[1536]), metadata |
| `processing_jobs` | Doc processing status | status, total_documents, processed_documents, current_document |
| `forms` | Forms library | category, name, file_path, year, is_active |

### 1.3 User Roles & Permissions

| Role | Count Access | Admin Panel | Agent Features | Special Access |
|------|--------------|-------------|----------------|----------------|
| **super_admin** | All profiles | Full | Full | Activity logs, Labs, PDF tools, Feature flags |
| **admin** | All profiles | Full (except logs) | Full | RTS import, Contracting queue |
| **manager** | Downline only | Limited | Full | Team view |
| **internal_tig_agent** | Self only | None | Full | — |
| **independent_agent** | Self only | None | Full | — |

**Dual-Role Support:** Users with both admin+agent roles can switch views via `ViewModeContext`.

### 1.4 External Integrations

| Service | Purpose | Edge Functions | Status |
|---------|---------|----------------|--------|
| **Supabase** | Database, Auth, Storage | All | ✅ Active |
| **Resend** | Transactional email | `send-setup-link`, `send-contracting-packet`, `send-agent-inquiry` | ✅ Active |
| **Microsoft Graph** | Outlook integration | `microsoft-oauth-*`, `microsoft-send-email` | ⚠️ Partial (tokens stored) |
| **OpenAI** | Embeddings for RAG | `process-document`, `agent-chat-rag` | ⚠️ Partial (infra exists) |
| **Lovable AI Gateway** | Chat completions | `agent-chat`, `agent-chat-rag` | ⚠️ Partial |
| **Pinnacle (RTS)** | Certification data | Manual Excel import | ✅ Active |

### 1.5 Workflows: Automated vs Manual

| Workflow | Automation Level | What's Automated | What's Manual |
|----------|------------------|------------------|---------------|
| **Agent Onboarding** | 80% | Invite link, password setup, wizard auto-save, PDF generation | Final Pinnacle submission |
| **Certification Tracking** | 70% | RTS import, status updates | AHIP certificate upload |
| **Contracting Queue** | 60% | Queue status, email notifications | Review, approval, carrier submission |
| **Production Sync** | 40% | File upload, parsing, client creation | Carrier report download, file selection |
| **Commission Tracking** | 0% | — | Everything (currently not built) |
| **Lead Management** | 0% | — | Everything (currently not built) |
| **Client Retention** | 0% | — | Everything (currently not built) |

---

## PART 2: Value Assessment (Medicare Broker Perspective)

### 2.1 Feature-by-Feature Analysis

| Feature | Pain Point Solved | Alternative Without It | Time Savings | Value Category |
|---------|-------------------|------------------------|--------------|----------------|
| **Contracting Wizard** | Paper forms, fax machines, lost documents | Print PDF, fill by hand, scan, email | 2-3 hours → 30 min | SAVE TIME |
| **Auto-save (800ms debounce)** | Lost work, browser crashes | Start over from scratch | Frustration elimination | REDUCE RISK |
| **Digital Signatures** | Wet signature logistics, notary trips | In-person signing, mail | Days → Minutes | SAVE TIME |
| **Contracting Hub** | "Am I ready to sell?" anxiety | Call upline, check emails | Unknown → Instant clarity | REDUCE RISK |
| **RTS Import** | Manual cert entry, typos, missed certs | Excel tracking, phone calls to carriers | Hours of admin → 2 min upload | SAVE TIME |
| **Carrier Resources** | Hunting for broker manager contacts | Google, old emails, call carrier 800# | 15-30 min → Instant | SAVE TIME |
| **Forms Library** | SOA version confusion, compliance risk | Download from CMS, hope it's current | Compliance confidence | REDUCE RISK |
| **Training Library** | Scattered training resources | YouTube, carrier sites, email links | Organization + progress tracking | REDUCE RISK |
| **AHIP Tracking** | "Did I do AHIP this year?" | Check email for certificate | Instant visibility | REDUCE RISK |
| **Production Upload** | No visibility into book of business | Excel, carrier portals (each different) | Centralized view | MAKE MONEY |
| **Milestones** | No recognition for growth | Nothing (or upline mentions it) | Motivation, gamification | MAKE MONEY |

### 2.2 Value Distribution

```
SAVE TIME (Efficiency)
├── Contracting Wizard: ████████████████████ (High)
├── RTS Import: ████████████████████ (High)
├── Carrier Resources: ████████████████ (High)
├── Forms Library: ████████████ (Medium)
└── Digital Signatures: ████████████████████ (High)

REDUCE RISK (Compliance/Confidence)
├── Contracting Hub: ████████████████████ (High)
├── AHIP Tracking: ████████████████ (High)
├── Forms Library: ████████████████ (High)
├── Training Library: ████████████ (Medium)
└── Auto-save: ████████████ (Medium)

MAKE MONEY (Revenue Enablement)
├── Production Tracking: ████████ (Low - underbuilt)
├── Milestones: ████ (Low - motivational only)
└── [GAP: No lead management]
└── [GAP: No commission tracking]
└── [GAP: No client retention tools]
```

### 2.3 Current Value Score by Business Cycle

| Business Cycle | Coverage | Notes |
|----------------|----------|-------|
| **Pre-AEP** (Certs, appointments, training) | ⭐⭐⭐⭐ 80% | Strong - this is the core focus |
| **During AEP** (Client mgmt, enrollments) | ⭐ 20% | Weak - no CRM, no enrollment tracking |
| **Post-AEP** (Commissions, retention, T65) | ⭐ 10% | Minimal - production upload exists but unused |
| **Year-Round** (Leads, marketing, Med Supps) | ⭐ 10% | Almost nothing |

---

## PART 3: Gap Analysis - Agent Must-Haves

### 3.1 Pre-AEP Gaps

| Gap | Severity | Description | Current Workaround |
|-----|----------|-------------|---------------------|
| **Certification Deadline Alerts** | Medium | No push notifications when cert windows open/close | Manual calendar reminders |
| **Missing Carrier Appointments** | Medium | No proactive "you're not appointed with X" alerts | Agent discovers when trying to sell |
| **Training Completion Requirements** | Low | No enforcement of required training before AEP | Manager follow-up |

### 3.2 During-AEP Gaps (CRITICAL)

| Gap | Severity | Description | Current Workaround |
|-----|----------|-------------|---------------------|
| **Client/Lead Management** | 🔴 Critical | No CRM functionality - agents can't track prospects | Excel, paper, external CRM ($$$) |
| **Enrollment Tracking** | 🔴 Critical | No way to track submitted apps, pending apps, enrolled clients | Carrier portal hopping (6+ systems) |
| **T65 Pipeline** | 🔴 Critical | No birthday tracking for Medicare eligibles | Manual lists, purchased leads |
| **Appointment Scheduler** | High | No way to schedule client meetings | Google Calendar, Calendly |
| **SOA Tracker** | High | No digital SOA with signature capture | Paper SOAs, compliance risk |
| **Plan Comparison Tool** | High | No side-by-side plan comparison | SunFire/Connecture (external) |
| **Enrollment Status Dashboard** | High | "How many have I enrolled this AEP?" | Carrier portals, manual counting |

### 3.3 Post-AEP Gaps

| Gap | Severity | Description | Current Workaround |
|-----|----------|-------------|---------------------|
| **Commission Tracking** | 🔴 Critical | No commission statements, no reconciliation | Excel, hope carrier pays correctly |
| **Commission Discrepancy Alerts** | High | No automatic detection of missing/wrong payments | Manual review (rarely done) |
| **Client Retention Dashboard** | High | No visibility into who's leaving | Find out when commission stops |
| **Annual Review Reminders** | High | No "contact these clients for AEP" automation | Manual outreach lists |
| **Renewal Tracking** | Medium | No visibility into term dates, auto-renewal status | Carrier portals |

### 3.4 Year-Round Gaps

| Gap | Severity | Description | Current Workaround |
|-----|----------|-------------|---------------------|
| **Lead Vendor Integration** | High | No connection to LeadStar, LeadHeroes, etc. | Manual lead download, re-entry |
| **Marketing Materials** | Medium | No co-branded marketing assets | Request from upline, use carrier materials |
| **Med Supp Quoting** | Medium | No integrated Med Supp quotes | CSG Actuarial, external tools |
| **Seminar Management** | Low | No event tracking, RSVP management | Eventbrite, paper sign-ups |
| **Referral Tracking** | Low | No way to track where clients came from | Memory, notes |

---

## PART 4: Gap Analysis - Agency/FMO Operations

### 4.1 Agent Recruiting & Onboarding

| Gap | Severity | Impact on Caroline's Team |
|-----|----------|---------------------------|
| **Agent Inquiry → Contracting Pipeline** | High | Manual tracking of inbound interest |
| **Onboarding Checklist Tracking** | Medium | No visibility into "where is this agent stuck?" |
| **Manager Assignment Automation** | Low | Manual assignment (quick picks exist but manual) |

### 4.2 Production Visibility & Forecasting

| Gap | Severity | Impact on TIG |
|-----|----------|---------------|
| **Real-Time Production Dashboard** | 🔴 Critical | No visibility into AEP production as it happens |
| **Agent Production Ranking** | High | Can't identify top/bottom performers quickly |
| **Carrier Mix Analysis** | High | Don't know which carriers agents are selling |
| **Forecasting/Projections** | High | No predictive analytics for revenue |
| **Commission Override Tracking** | Medium | No visibility into override earnings |

### 4.3 Agent Retention & Engagement

| Gap | Severity | Impact on TIG |
|-----|----------|---------------|
| **Agent Health Score** | High | No early warning for agents at risk of leaving |
| **Engagement Tracking** | Medium | Don't know if agents are using the platform |
| **Agent Communication Hub** | Medium | No broadcast messaging to all agents |
| **Agent Satisfaction Surveys** | Low | No feedback mechanism |

### 4.4 Compliance Management at Scale

| Gap | Severity | Impact on TIG |
|-----|----------|---------------|
| **SOA Audit Trail** | High | No centralized SOA storage for compliance audits |
| **E&O Expiration Tracking** | High | No alerts when agent E&O is expiring |
| **License Expiration Tracking** | High | No alerts for license renewals |
| **Compliance Training Enforcement** | Medium | No "you must complete X before Y" gates |
| **Call Recording Storage** | Low | No integration with call recording systems |

### 4.5 Reducing Operational Overhead

| Gap | Severity | Current Manual Work |
|-----|----------|---------------------|
| **Contracting Status Updates** | High | Caroline manually updates agents on status |
| **Commission Inquiry Handling** | High | "Where's my check?" emails require manual research |
| **Carrier Contact Updates** | Medium | Broker managers change, contacts go stale |
| **Document Expiration Alerts** | Medium | Manually tracking E&O, licenses, AHIP |

---

## PART 5: Innovation Opportunities

### 5.1 AI-Powered Features (Leveraging Existing Infrastructure)

The platform already has RAG infrastructure (`document_chunks` table with vector embeddings, `agent-chat-rag` edge function). These features could be built quickly:

| Feature | Description | Complexity | Differentiation |
|---------|-------------|------------|-----------------|
| **AI Plan Advisor** | "What plan is best for client with diabetes and $200 drug budget?" | Medium | 🔥 High - no FMO offers this |
| **AI Enrollment Assistant** | Step-by-step enrollment guidance with compliance checks | Medium | 🔥 High |
| **AI Commission Calculator** | "What will I earn if I enroll this client in Humana MAPD?" | Low | Medium |
| **AI Contracting Helper** | Answer questions during contracting ("What's my NPN?") | Low | Medium |
| **AI Training Recommendations** | Personalized training based on certification gaps | Low | Medium |

### 5.2 Automation Opportunities

| Feature | Description | Complexity | ROI |
|---------|-------------|------------|-----|
| **Carrier Portal Scraping** | Auto-pull production data from carrier portals | High | 🔥 Eliminates manual downloads |
| **Commission Auto-Reconciliation** | Match expected vs actual commissions automatically | High | 🔥 Huge time saver |
| **Certification Deadline Automation** | Auto-email agents when certs open, remind before close | Low | High compliance value |
| **E&O/License Expiration Alerts** | 30/60/90 day warnings via email | Low | High compliance value |
| **AEP Countdown Dashboard** | Days until AEP, percent ready, tasks remaining | Low | Engagement driver |

### 5.3 Data Insights (Unique to FMOs)

| Feature | Description | Value |
|---------|-------------|-------|
| **Agent Production Leaderboard** | Gamified ranking (opt-in) | Motivation, retention |
| **Carrier Performance Analytics** | Which carriers are easiest to sell, fastest to pay | Strategic intelligence |
| **Geographic Heatmaps** | Where are your agents selling? | Territory planning |
| **Client Demographics Dashboard** | Age distribution, plan mix, retention rates | Business intelligence |
| **Attrition Predictor** | Which agents are at risk of leaving? | Proactive retention |

### 5.4 Community/Collaboration Features

| Feature | Description | Complexity |
|---------|-------------|------------|
| **Agent Discussion Forum** | Q&A between agents (moderated) | Medium |
| **Office Hours Scheduling** | Book time with upline for questions | Low |
| **Success Stories** | Highlight top performers, share strategies | Low |
| **Peer Mentorship Matching** | Connect new agents with experienced ones | Medium |

### 5.5 Mobile-First Experiences

| Feature | Description | Why It Matters |
|---------|-------------|----------------|
| **Mobile Client Lookup** | Quick client search in the field | Agents are rarely at desks |
| **Mobile SOA Capture** | Digital SOA with signature on phone | Compliance in the field |
| **Mobile Plan Comparison** | Pull up plan details at kitchen table | Sales tool |
| **Mobile Commission Check** | "How much did I make this month?" | Motivation |

### 5.6 Integration Opportunities

| Integration | Value | Complexity |
|-------------|-------|------------|
| **SunFire/Connecture** | SSO into quoting tools | Medium |
| **LeadStar** | Auto-import leads | Medium |
| **AgencyBloc/Radiusbob** | CRM sync | High |
| **DocuSign** | Enterprise e-signatures | Medium |
| **Twilio** | SMS reminders, appointment confirmations | Low |
| **Calendly** | Appointment scheduling | Low |

### 5.7 Revenue Opportunities

| Feature | Revenue Model | For Whom |
|---------|--------------|----------|
| **Lead Marketplace** | Commission on lead purchases | TIG earns override |
| **Premium Training Content** | Paid advanced courses | TIG or partners |
| **Co-Branded Marketing** | Pay-per-use marketing materials | TIG earns on fulfillment |
| **Referral Bonuses** | Agent-to-agent referral tracking | Agent acquisition |

---

## PART 6: Prioritization Framework

### 6.1 Scoring Matrix

| Feature | Agent Impact (1-5) | TIG Ops Impact (1-5) | Dev Complexity (1-5) | Differentiation (1-5) | **Total Score** |
|---------|-------------------|---------------------|---------------------|----------------------|-----------------|
| **Client/Lead Management (Basic CRM)** | 5 | 4 | 4 | 3 | **16** |
| **Commission Tracking Dashboard** | 5 | 5 | 3 | 3 | **16** |
| **Real-Time Production Dashboard** | 4 | 5 | 3 | 3 | **15** |
| **AI Plan Advisor (RAG)** | 5 | 2 | 2 | 5 | **14** |
| **E&O/License Expiration Alerts** | 3 | 5 | 1 | 2 | **11** |
| **Certification Deadline Automation** | 3 | 4 | 1 | 2 | **10** |
| **T65 Birthday Pipeline** | 5 | 3 | 2 | 3 | **13** |
| **Enrollment Status Dashboard** | 5 | 3 | 3 | 3 | **14** |
| **SOA Digital Capture** | 4 | 4 | 2 | 3 | **13** |
| **Agent Production Leaderboard** | 3 | 3 | 1 | 3 | **10** |
| **Mobile App Shell (PWA)** | 4 | 2 | 3 | 3 | **12** |
| **Carrier Portal Integration** | 4 | 5 | 5 | 4 | **18** |
| **Agent Health Score** | 2 | 5 | 2 | 4 | **13** |
| **Commission Auto-Reconciliation** | 5 | 5 | 5 | 5 | **20** |

### 6.2 Effort vs Impact Quadrant

```
                    HIGH IMPACT
                        │
     ┌──────────────────┼──────────────────┐
     │                  │                  │
     │  QUICK WINS      │  STRATEGIC BETS  │
     │                  │                  │
     │  • E&O Alerts    │  • Basic CRM     │
     │  • Cert Alerts   │  • Commission    │
     │  • Leaderboard   │    Tracking      │
     │  • AI Plan       │  • Production    │
     │    Advisor       │    Dashboard     │
     │                  │  • Carrier       │
LOW  │                  │    Integration   │  HIGH
EFFORT────────────────────────────────────────EFFORT
     │                  │                  │
     │  FILL-INS        │  AVOID (for now) │
     │                  │                  │
     │  • Agent Forum   │  • Full CRM      │
     │  • Success       │  • Commission    │
     │    Stories       │    Reconciliation│
     │                  │  • Mobile Native │
     │                  │    App           │
     │                  │                  │
     └──────────────────┼──────────────────┘
                        │
                   LOW IMPACT
```

---

## PART 7: Strategic Recommendations

### 7.1 Top 5 Quick Wins (Build in 1-2 weeks each)

| # | Feature | Why Now | Files to Modify |
|---|---------|---------|-----------------|
| 1 | **AI Plan Advisor** | RAG infra exists, just needs UI. Immediate "wow" factor for demos. | New page + `agent-chat-rag` function |
| 2 | **E&O/License Expiration Alerts** | `agent_documents.expires_at` exists. Daily cron + email. | New edge function, `send-setup-link` template |
| 3 | **Certification Deadline Automation** | `certification_windows` table exists. Just needs reminder logic. | New edge function |
| 4 | **Agent Production Leaderboard** | `monthly_syncs` has data. Gamification = engagement. | New admin page component |
| 5 | **Enrollment Status Dashboard** | `policies` table exists but unused. Surface the data. | Enhance `BookOfBusinessPage.tsx` |

### 7.2 Top 5 Strategic Investments (1-3 months each)

| # | Feature | Strategic Value | Complexity |
|---|---------|-----------------|------------|
| 1 | **Basic Client/Lead CRM** | Solves the #1 agent pain point. Stickiness driver. | 6-8 weeks |
| 2 | **Commission Tracking Dashboard** | "Where's my money?" is constant. Reduce support burden. | 4-6 weeks |
| 3 | **Real-Time Production Dashboard** | TIG needs this for forecasting, agent management. | 4-6 weeks |
| 4 | **T65 Birthday Pipeline** | Revenue generator. Every agent needs T65 leads. | 3-4 weeks |
| 5 | **Digital SOA with Signature** | Compliance differentiator. CMS audit protection. | 2-3 weeks |

### 7.3 Features to Explicitly NOT Build

| Feature | Why Not |
|---------|---------|
| **Full CRM (Salesforce-level)** | AgencyBloc, Radiusbob exist. Don't compete with mature products. |
| **Quoting Engine** | SunFire, Connecture exist. Integrate, don't rebuild. |
| **Native Mobile App** | PWA first. Native is expensive and agents have multiple devices. |
| **Commission Reconciliation (automated)** | Requires carrier integrations that don't exist. Manual dashboard first. |
| **E-Fax Integration** | Fax is dying. Don't invest in legacy tech. |
| **Carrier Appointment Automation** | Every carrier is different. Not automatable. |
| **Agent Discussion Forum** | Low engagement risk. Focus on tools, not community initially. |

### 7.4 Suggested 6-12 Month Roadmap

#### Phase 1: Demo-Ready (Weeks 1-4)
**Goal:** Features that make demos impressive and show immediate value

- [ ] AI Plan Advisor (quick win using existing RAG)
- [ ] Certification deadline email automation
- [ ] E&O/license expiration alerts
- [ ] Enrollment Status Dashboard (surface `policies` table)
- [ ] AEP countdown widget on dashboard

#### Phase 2: Core Value (Weeks 5-12)
**Goal:** Solve the #1 agent pain point and the #1 TIG pain point

- [ ] Basic CRM (client list, notes, T65 tracking)
- [ ] Commission Tracking Dashboard (manual upload, visual display)
- [ ] Real-Time Production Dashboard (admin view)
- [ ] Agent Health Score (login frequency, completion rates)

#### Phase 3: Stickiness (Weeks 13-20)
**Goal:** Features that make agents not want to leave

- [ ] Digital SOA with signature capture
- [ ] T65 Birthday Pipeline with automated reminders
- [ ] Agent Production Leaderboard (opt-in)
- [ ] Mobile PWA shell

#### Phase 4: Scale (Weeks 21-30)
**Goal:** Features that reduce TIG operational load

- [ ] Commission discrepancy detection (expected vs actual)
- [ ] Carrier portal integration (starting with 1 carrier)
- [ ] Bulk agent communication tools
- [ ] Enhanced compliance tracking

---

## Appendix A: Database Tables Inventory

Total: **36 tables** across **67 migrations**

### Actively Used
- `profiles`, `user_roles`, `activity_logs` (auth)
- `contracting_applications`, `carrier_statuses`, `agent_documents` (contracting)
- `agent_certifications`, `carriers`, `carrier_contacts`, `carrier_links`, `carrier_documents` (carriers)
- `forms`, `document_chunks` (content)
- `broker_roadmaps` (growth plans)

### Underutilized (Opportunity)
- `clients` - Has schema for full client management, only used by production import
- `policies` - Has schema for policy tracking, rarely written to
- `monthly_syncs`, `sync_carrier_uploads`, `production_uploads` - Sync flow exists but agents don't use
- `milestones` - Achievement system exists but no UI celebration

### Not Used
- `ahip_certifications` (duplicated by profiles columns)
- `certification_windows` (data not populated)
- `hierarchy_entities`, `entity_owners` (placeholder for future org structure)

---

## Appendix B: Edge Functions Inventory

**24 Edge Functions deployed:**

| Category | Functions |
|----------|-----------|
| Agent Lifecycle | `create-agent`, `send-setup-link`, `get-invite-link`, `validate-password` |
| Admin | `create-admin`, `delete-user`, `reset-user-password` |
| Contracting | `generate-contracting-pdf`, `send-contracting-packet`, `delete-contracting-application`, `reset-contracting-status` |
| Email | `microsoft-oauth-start`, `microsoft-oauth-callback`, `microsoft-send-email` |
| AI/Documents | `agent-chat`, `agent-chat-rag`, `process-document`, `extract-pdf-fields`, `generate-pdf-structure`, `pdf-field-audit` |
| Production | `parse-production-report`, `generate-growth-plan-pdf` |
| Other | `send-agent-inquiry`, `fetch-edge-logs` |

---

## Appendix C: Key File References

| Domain | Key Files |
|--------|-----------|
| Auth | `src/hooks/useAuth.ts`, `src/components/ProtectedRoute.tsx` |
| Contracting | `src/hooks/useContractingApplication.ts`, `src/pages/ContractingPage.tsx` |
| Carriers | `src/hooks/useCarrierDirectory.ts`, `src/pages/CarrierResourcesPage.tsx` |
| Production | `src/lib/sync.ts`, `src/pages/BookOfBusinessPage.tsx` |
| Admin | `src/pages/admin/AdminDashboard.tsx`, `src/pages/admin/ContractingQueuePage.tsx` |
| RTS Import | `src/lib/rtsImport.ts`, `src/pages/admin/RTSImportPage.tsx` |

---

*Analysis generated January 27, 2026*
