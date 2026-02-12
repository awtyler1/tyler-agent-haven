# TIG Platform: Competitive Analysis & Strategic Audit

**Prepared for:** Austin Tyler, Tyler Insurance Group
**Date:** February 9, 2026
**Analyst:** Claude (comprehensive codebase audit + competitive landscape analysis)

---

## Executive Summary

You built a real platform. Not a prototype, not a landing page — a functional, production-deployed operating system with 36+ database tables, 67 migrations, 21 edge functions, 30+ routes, and a coherent design system. For a solo developer with no prior programming background, that's a legitimate technical achievement.

That said, here's the honest truth: **you've built an excellent onboarding and agency management tool, but not a tool that agents will open every day.** The platform serves TIG admins well (contracting, RTS import, agent management). It does not yet serve agents well enough to compete with the free tools they already have access to.

Your biggest strategic risk is not code quality or feature count — it's **daily active usage**. If agents don't log in regularly, the platform has no recruiting value and no retention value.

**Current State:** ~75% complete for admin/onboarding workflows, ~20% complete for daily agent workflows
**Kill Zone:** You're overbuilding admin tools and underbuilding agent-facing value
**Wedge Opportunity:** Smart Sync + Commission Projections + T65 Flagging — nobody does this well for the 50+ agent demographic

---

## PART 1: Complete Feature Inventory

### 1.1 Feature-by-Feature Audit

| # | Feature | Status | Key Files | Who Benefits | Actually Used? |
|---|---------|--------|-----------|--------------|----------------|
| 1 | **Authentication** | Production-ready | `useAuth.ts`, `AuthPage.tsx`, `SetPasswordPage.tsx` | Everyone | Yes |
| 2 | **5-Level RBAC** | Production-ready | `ProtectedRoute.tsx`, `useRole.ts` | Internal | Yes |
| 3 | **Contracting Wizard** | Production-ready | `ContractingForm.tsx` (19 section components), `useContractingApplication.ts` | Agents + Admins | Yes (onboarding) |
| 4 | **Contracting Hub** | Production-ready | `ContractingHubPage.tsx` | Agents | One-time use |
| 5 | **Admin Dashboard** | Production-ready | `AdminDashboard.tsx`, `useAdminDashboardData.ts` | Admins | Yes |
| 6 | **Agent Management** | Production-ready | `AgentsPage.tsx`, `AgentProfilePage.tsx`, `AllAgentsTab.tsx` | Admins | Yes |
| 7 | **RTS Import** | Production-ready | `rtsImport.ts`, `RTSImportPage.tsx` | Admins | Seasonal |
| 8 | **Agent Dashboard ("Golden Hour")** | Production-ready | `Index.tsx`, `useDashboardData.ts` | Agents | If they sync |
| 9 | **Smart Sync** | Production-ready | `SyncFlow.tsx`, `sync.ts`, `carrier-detection.ts`, `parse-production-report/` | Agents | Core loop |
| 10 | **Carrier Resources** | Production-ready | `CarrierResourcesPage.tsx`, `useCarrierDirectory.ts` | Agents | Moderate |
| 11 | **Forms Library** | Functional | `FormsLibraryPage.tsx`, `useForms.ts` | Agents | Low |
| 12 | **Training Library** | Functional | `TrainingPage.tsx`, `trainingVideos.ts` (5+ Vimeo videos) | New agents | Low |
| 13 | **Compliance Page** | Basic | `CompliancePage.tsx` | Agents | Very low |
| 14 | **Plan Finder** | Functional (KY only) | `PlanFinderPage.tsx`, `useCmsPlans.ts`, `kentucky-plans-2026.ts` (153 plans) | Admins (gated) | Experimental |
| 15 | **Commission Projections** | Scaffolding | `useCommissions.ts`, `commissions.ts`, `commission_rates` table | Agents | No UI page |
| 16 | **Roadmap Generator** | Functional | `RoadmapGeneratorPage.tsx`, `useRoadmapGenerator.ts`, `BrokerProfileForm.tsx` | Admins/Managers | Low |
| 17 | **Document Management** | Functional | `DocumentManagementPage.tsx`, `AgentDocumentsSection.tsx` | Admins | Moderate |
| 18 | **Activity Logging** | Production-ready | `ActivityLogPage.tsx` | Super Admins | Low |
| 19 | **Email Integration** | Functional | `microsoft-oauth-*`, `microsoft-send-email`, `send-setup-link` | Admins | For invites |
| 20 | **AI Chat/RAG** | Edge functions only | `agent-chat/`, `agent-chat-rag/`, `process-document/` | Nobody yet | **No UI** |
| 21 | **Industry Updates** | Placeholder | `IndustryUpdatesPage.tsx` (1 hardcoded article) | Nobody | Dead |
| 22 | **T65 Review** | Exists | `T65ReviewPage.tsx` | Agents | Unknown |
| 23 | **PDF Builder** | Functional | `PdfBuilderPage.tsx` | Super Admins | Experimental |
| 24 | **Contracting Queue** | Production-ready | `ContractingQueuePage.tsx`, `ContractingSubmissionDetail.tsx` | Admins | Yes |
| 25 | **Agent Book Admin** | Functional | `AgentsBookPage.tsx`, `AgentBookDetailPage.tsx` | Admins | Low |
| 26 | **Carrier Portals** | Functional | `CarrierPortalsPage.tsx` + Dashboard portal tiles | Agents | Moderate |
| 27 | **My Profile** | Functional | `MyProfilePage.tsx` | Agents | One-time |
| 28 | **Start Here** | Functional | `StartHerePage.tsx` | New agents | One-time |
| 29 | **Feature Flags** | Infrastructure | `FeatureFlagsContext.tsx`, `feature_flags` table | Internal | Plumbing |
| 30 | **New Agent Creation** | Production-ready | `NewAgentPage.tsx`, `create-agent/` edge function | Admins | Yes |

### 1.2 Database Schema (36+ tables)

**Production-ready tables (actively used):**
- `profiles`, `user_roles`, `contracting_applications`, `carriers`, `carrier_statuses`, `agent_certifications`, `rts_import_logs`, `activity_logs`, `monthly_syncs`, `sync_carrier_uploads`, `production_uploads`, `milestones`, `agent_carriers`, `feature_flags`

**Functional but underutilized:**
- `clients`, `policies` (populated by sync but no agent-facing CRUD UI)
- `cms_plans`, `cms_service_areas` (153 KY plans, admin-only access)
- `carrier_contacts`, `carrier_links`, `carrier_documents` (good data, read-only)
- `commission_rates` (exists but probably lightly seeded)
- `broker_roadmaps` (roadmap generator data)
- `forms` (forms library)
- `admin_notes` (agent profile notes)
- `agent_documents` (document uploads)

**Scaffolding/underused:**
- `document_chunks` (RAG embeddings — AI feature not shipped)
- `processing_jobs` (document processing pipeline, likely unused)
- `ahip_certifications`, `carrier_certifications`, `certification_windows` (exist but overlapping with `agent_certifications`)
- `hierarchy_entities`, `entity_owners` (org hierarchy — partially implemented)
- `contracting_communications` (email tracking)
- `microsoft_oauth_tokens` (Outlook integration tokens — noted as unencrypted)
- `state_carriers` (multi-state support — KY only currently)
- `plan_documents` (CMS plan documents — schema exists, probably empty)
- `sync_history` (older sync tracking, superseded by `monthly_syncs`)

### 1.3 What's NOT Built

| Feature | Status | Notes |
|---------|--------|-------|
| **Client CRM** | Not built | `clients` table exists but no agent-facing CRUD, search, or management UI |
| **Quoting/Enrollment** | Not built | Plan Finder is read-only comparison, no enrollment workflow |
| **Lead Management** | Not built | No leads table, no pipeline, no vendor integrations |
| **Marketing Automation** | Not built | No drip campaigns, no email templates for agents, no funnels |
| **Call Recording** | Not built | Not applicable for a web platform |
| **SOA E-Signing** | Not built | Compliance page has rules but no digital SOA capture |
| **Commission Reconciliation** | Not built | Projection exists, but no actual-vs-expected reconciliation |
| **Calendar/Events** | Not built | No scheduling, no appointment tracking |
| **SMS/Text** | Not built | No messaging integration |
| **Mobile App** | Not built | Responsive web only |
| **Recruiting Pipeline** | Not built | No prospect tracking, no recruitment funnel |
| **Client Communication** | Not built | No email/text to clients from within platform |
| **Policy Renewal Management** | Not built | T65 flagging exists but no full renewal workflow |
| **Drug/Formulary Lookup** | Not built | Plan data has drug tiers but no formulary search |

### 1.4 Code Quality Assessment

| Dimension | Rating | Notes |
|-----------|--------|-------|
| **TypeScript Usage** | Good | Types generated from Supabase schema, consistent interfaces in hooks |
| **Component Patterns** | Good | Design system is documented and followed, Shadcn/ui base |
| **State Management** | Clean | TanStack Query for server state, custom hooks for composition, no prop drilling |
| **Route Architecture** | Good | Lazy loading for all non-critical routes, proper code splitting |
| **Error Handling** | Adequate | Sentry ErrorBoundary, `errors.ts` utilities, most hooks handle errors |
| **Test Coverage** | **Zero** | No test files exist anywhere in the codebase |
| **RLS/Security** | Good | Proper RLS policies, role-based route guards, edge function auth |
| **Performance** | Good | Lazy loading, parallel auth fetches, staleTime/gcTime configured |
| **Mobile Responsive** | Partial | `use-mobile.tsx` hook exists, some pages responsive, dashboard is adaptive |
| **Dead Code** | Some | `Index.old.tsx`, `UserDetailPage.tsx` (legacy), unused Shadcn components |
| **Bundle** | Optimized | Dynamic xlsx imports, webp logos, route splitting |
| **Documentation** | Extensive | 55+ doc files — possibly over-documented relative to code written |

**Key concern:** Zero tests means every deploy is a manual QA exercise. For a production platform with 300 potential users, this is a real risk.

---

## PART 2: Competitive Comparison Matrix

### 2A: Feature-by-Feature Ratings

| Feature Category | TIG Platform | BOSS (Pinnacle) | MedicareCENTER | AgencyBloc | MedicarePRO | What Agents Actually Need |
|---|---|---|---|---|---|---|
| **Agent Onboarding & Contracting** | **Strong** | Functional | Basic | Not Built | Not Built | Critical for FMOs. TIG's best feature. |
| **Client/Book Management (CRM)** | **Not Built** | Functional | Functional | Strong | Strong | Table stakes. Agents need this daily. |
| **Quoting & Enrollment** | Not Built | Not Built (use C4I) | Best-in-Class | Not Built (use Connecture) | Functional (Sunfire) | Must integrate, never build. |
| **Commission Tracking** | Basic (scaffolding) | Basic | Basic | **Best-in-Class** | Functional | High-value. AgencyBloc wins here. |
| **Compliance (SOA, Recording)** | Basic (static) | Functional | **Strong** | Functional | Functional | SOA tracking is table stakes for CMS audits. |
| **Marketing Automation** | Not Built | Functional | Basic | Basic | Not Built | Agent CRM (GoHighLevel) dominates here. |
| **Production Reporting** | **Functional** | Functional | Functional | Strong | Basic | Smart Sync is genuinely differentiated. |
| **Document Management** | Functional | Not Built | Basic | Basic | Not Built | Nice to have, not a differentiator. |
| **Training & Education** | Functional | Basic | **Strong** (LearningCENTER) | Not Built | Not Built | Valuable for new agents, not retention. |
| **Mobile Experience** | Basic (responsive) | Basic | **Functional** (native app) | Basic | Basic | Agents work in the field. Mobile matters. |
| **Agent Recruiting Tools** | Not Built | Not Built | Not Built | Not Built | Not Built | Gap in ALL platforms. Opportunity. |
| **Admin/GA Management** | **Strong** | Functional | Basic | Functional | Not Built | TIG's second-best area. |
| **Data Portability** | Strong (Supabase) | Poor (locked) | Poor (locked) | Functional | Basic | Big FMO pain point. |

**Legend:** Not Built = doesn't exist | Basic = minimal/placeholder | Functional = works but not polished | Strong = well-built, solves the problem | Best-in-Class = industry-leading

---

## PART 3: The Analysis

### 3B: What You've Built That's Valuable

**1. Smart Sync (Genuinely Differentiated)**

The `SyncFlow.tsx` + `carrier-detection.ts` + `parse-production-report` pipeline is your most unique feature. Nobody else does automated carrier report parsing with auto-detection, client deduplication, and monthly trending for a small FMO. BOSS and MedicareCENTER provide production reports, but agents have to read PDFs or spreadsheets manually. Your system *ingests* the data and turns it into actionable intelligence.

This is your wedge.

**2. Agent Dashboard ("Golden Hour")**

The `Index.tsx` dashboard is genuinely beautiful. The "beacon" concept (giant client count, carrier bars, milestone progress, growth streak) is more visually compelling than anything in BOSS or MedicareCENTER. It's designed for the emotional reality of being an agent — seeing your number grow is motivating. This is Apple-level design sensibility applied to a deeply unsexy industry.

But it only works if agents sync. Which brings us to the chicken-and-egg problem.

**3. Contracting Wizard + Queue**

The 19-section, 8-step contracting form with auto-save, PDF generation, and admin queue processing is production-ready and solves a real pain point. Most FMOs still do contracting via email attachments and manual tracking. This is a legitimate workflow improvement.

**4. RTS Import**

Parsing Pinnacle Excel files and auto-creating profiles + certifications saves hours of manual data entry. This is a high-leverage admin tool.

**5. Carrier Resources (Cert-Filtered)**

Showing agents only the carriers they're certified with is smarter than BOSS's "here's everything" approach. The `agent_certifications → carrier filtering` pattern is well-implemented.

**6. Data Portability**

Your agents own their data in a Supabase database you control. MedicareCENTER's biggest criticism is "what happens to my data if I leave my FMO?" You can truthfully say: "Your data stays with you."

### 3C: What You've Built That's Wasted Effort

**1. Industry Updates Page** (`IndustryUpdatesPage.tsx`)
One hardcoded article from November 2025. Uses the old design system (not Golden Hour). Nobody will ever visit this page. It actively makes the platform look unfinished if anyone finds it.
**Verdict: Kill it.** Remove from nav, delete the route.

**2. Compliance Page** (`CompliancePage.tsx`)
Static hardcoded rules that every agent already knows. SOA download links where 4 of 5 have `url: null`. CMS links that are one Google search away.
**Verdict: Kill it or merge it.** The SOA rules could be a collapsible section in Forms Library. The broken download links are embarrassing.

**3. AI Chat/RAG Infrastructure** (`agent-chat/`, `agent-chat-rag/`, `process-document/`, `document_chunks` table)
Three edge functions deployed, embeddings table created, but zero UI integration anywhere in the platform. This is invisible to every user.
**Verdict: Deprioritize.** The infrastructure isn't wasted — it's just premature. Come back to this after the core value loop works.

**4. PDF Builder** (`PdfBuilderPage.tsx`)
Super-admin-only experimental tool. Unless Caroline, Andrew, or Jeremy are generating PDFs through it, nobody uses this.
**Verdict: Fine as a Labs feature, but don't invest more time.**

**5. Roadmap Generator** (`RoadmapGeneratorPage.tsx`)
Admin tool to generate agent business plans. Valuable in concept, but how many times has it been used? If the answer is fewer than 5 times, the time spent building it could have gone toward features agents use daily.
**Verdict: Keep but don't invest more.**

**6. Activity Logging** (`ActivityLogPage.tsx`)
Super-admin audit trail. Important for compliance, but you're the only super admin. This was a good engineering decision (audit trails matter), but it shouldn't have been a priority over agent-facing features.
**Verdict: Keep as-is, never touch again.**

**7. Over-Documentation**
55+ doc files, many of which are single-use audit/analysis documents (ADMIN_DASHBOARD_REVAMP_AUDIT, ADMIN_DESIGN_AUDIT, ADMIN_LOGIN_ONBOARDING_AUDIT, etc.). You've spent significant time documenting and auditing rather than shipping. Documentation is good, but the ratio of docs-to-features suggests a planning habit that may be slowing execution.
**Verdict: Stop writing audit docs. Ship features. Read this analysis and then don't commission another one for 90 days.**

### 3D: What's Missing That You MUST Have

#### Tier 1: Table Stakes (Without These, Agents Won't Log In)

**1. Client List / Simple CRM**
You have a `clients` table with name, phone, email, Medicare number, DOB, address. You have a `policies` table linking clients to carriers. The data is THERE from Smart Sync imports. But agents have no way to view, search, edit, or manage their clients.

This is the #1 gap. Every competitor has this. BOSS has it (poorly), MedicareCENTER has it, every paid CRM has it. Without it, agents open your platform to sync, see their number, and leave. With it, they open your platform to look up client info, make calls, and manage their book.

**What to build:** A `/my-clients` page showing all clients from the `clients` table, searchable by name/Medicare number, with expandable rows showing policy details, contact info, and T65 status. This is not a full CRM — it's a client directory powered by data you already have.

**2. Commission Visibility**
You have `commission_rates`, `useCommissions.ts`, and `commissions.ts`. The math works. But there's no page showing agents their projected earnings. This is the one thing that makes agents feel the platform is "for them" rather than "for admin."

AgencyBloc's whole value prop is commission tracking. You can't match their reconciliation features, but you CAN show: "Based on your current book, you're earning ~$X/month in commissions."

**What to build:** A commission card on the dashboard or a `/my-earnings` page using the existing hook.

#### Tier 2: Differentiators (This Is Where You Beat Free Tools)

**3. T65 Client Alerts / Proactive Risk Flagging**
You mentioned nobody does proactive client risk flagging well. You have DOB data on clients. You have effective_date on policies. You can compute T65 transitions (clients turning 65 → aging into Medicare). You can flag policies approaching renewal.

This is your competitive moat. BOSS doesn't do this. MedicareCENTER doesn't do this well. If your platform tells an agent "3 of your clients turn 65 in the next 60 days — here they are, with contact info" — that agent will log in every week.

**4. Sync Reminders / Engagement Loop**
Your `sync_reminder_sent_at` field exists but there's no visible reminder system. The stale banner on the dashboard is good, but agents need email/push nudges. "Your January book hasn't been synced. Upload now to keep your data current."

Without this, the sync-view-repeat loop breaks. Agents forget to sync, dashboard goes stale, they stop visiting.

#### Tier 3: Nice to Have

**5. Agent-Facing Plan Comparison**
You built a good Plan Finder but gated it to admin-only. Opening it to agents (even KY-only) would add daily utility during AEP/OEP. Agents sitting with clients need quick plan comparisons.

**6. SOA Digital Capture**
A simple "generate and email SOA" feature would be more valuable than the entire Compliance page.

### 3E: Where Is Your Strategic Advantage?

Your advantages, in order of importance:

**1. Speed of iteration.** You can ship a feature in a day. Pinnacle's BOSS team has to go through Kizen's product roadmap. MedicareCENTER serves 100K+ agents and can't customize for your 300. You can build exactly what your agents need, this week.

**2. Simplicity.** Your agents are 50+ and overwhelmed by MedicareCENTER. They don't need 47 tabs — they need 4 screens that work perfectly. Your Golden Hour dashboard is already simpler and more beautiful than anything they've seen.

**3. Smart Sync pipeline.** Nobody else auto-ingests carrier production reports, deduplicates clients, and builds a living book of business. This is genuinely novel for the small FMO space.

**4. Data you control.** When an agent asks "what happens to my data if I leave Pinnacle?" — their data in your system stays with them. That's a recruiting talking point.

**5. Personal relationship.** You know these agents. You can watch them use the platform and fix friction in real time. National platforms can't.

**The Wedge Feature:** Smart Sync → Client Directory → Commission Projections → T65 Alerts. If an agent syncs their reports monthly and gets: (a) their total book count, (b) a searchable client list, (c) their projected commissions, and (d) alerts about upcoming T65 transitions — they will log in weekly. That's the daily value loop that BOSS and MedicareCENTER don't provide.

### 3F: Build vs. Integrate vs. Ignore

| Feature Category | Recommendation | Rationale |
|---|---|---|
| **Agent Onboarding/Contracting** | BUILD (own it) | Already your strongest feature. Keep iterating. |
| **Client Directory/Simple CRM** | BUILD (high priority) | Data already exists from sync. Build the UI. |
| **Commission Projections** | BUILD (medium priority) | Hook exists. Build the display. |
| **T65/Risk Alerts** | BUILD (high priority) | Unique differentiator. Nobody does this well. |
| **Quoting & Enrollment** | INTEGRATE (Sunfire/C4I links) | Never build a quoting engine. Link to what agents already use. |
| **Full Commission Reconciliation** | IGNORE | AgencyBloc does this better than you ever will. Don't compete. |
| **Marketing Automation** | IGNORE | GoHighLevel/Agent CRM space. Not your fight. |
| **Call Recording** | IGNORE | MedicareCENTER handles this. Regulatory complexity too high. |
| **Lead Management** | IGNORE (for now) | Only build this if your agents are actually buying leads through TIG. |
| **Training Library** | BUILD (maintain) | Good for new agent onboarding. Keep current, don't over-invest. |
| **Forms Library** | BUILD (maintain) | Useful utility. Keep current. |
| **Carrier Resources** | BUILD (maintain) | Good feature. Keep data current. |
| **Document Management** | BUILD (maintain) | Useful for admin. Keep as-is. |
| **Industry Updates** | DEPRECATE | Kill the page. Nobody uses it. |
| **Compliance Page** | DEPRECATE (merge into Forms) | Merge SOA content into Forms Library, kill standalone page. |
| **AI Chat** | DEPRIORITIZE | Infrastructure exists. Come back after core loop works. |
| **Plan Finder (agent-facing)** | BUILD (when ready) | Open to agents once you expand beyond KY. |
| **Mobile App** | IGNORE (for now) | Responsive web is sufficient for 300 agents. |
| **SOA Digital Capture** | BUILD (future) | Real value, but not in the first 90 days. |

### 3G: The Honest Assessment

**1. If you were a Medicare agent in Kentucky with access to BOSS (free), MedicareCENTER (free), and TIG Platform — why would you log into TIG Platform?**

Right now? To see my client count and feel good about my number growing. That's about it. The dashboard is beautiful but the utility is thin. I can't look up a client's phone number. I can't see my projected commissions. I can't get an alert that Mrs. Johnson turns 65 next month. I sync once, admire the dashboard, and then go to BOSS or MedicareCENTER for my actual work.

After you build the client directory and commission projections? I'd log in to look up client info before calls, check my earnings, and see my T65 pipeline. That's a weekly habit.

**2. If you were an agent considering joining TIG vs another FMO, does this platform tip the scales?**

Today: No. It's a nice-looking portal, but it doesn't do anything I can't get from other FMOs for free. The contracting wizard is smoother than average, but that's a one-time experience.

After the client directory + commissions + T65 alerts: Maybe. If TIG can say "we built a platform that automatically tracks your book, projects your commissions, and alerts you to T65 transitions — no other FMO in Kentucky does this" — that's a genuine differentiator for tech-forward agents.

**3. What would need to be true about the TIG Platform for it to be a genuine recruiting advantage?**

Three things:
1. Agents must be logging in weekly (proving daily value, not just onboarding value)
2. At least one feature must be demonstrably better than the free alternatives (Smart Sync + client directory is the candidate)
3. You must be able to show agent testimonials or usage data ("our agents sync their books monthly and have 40% better retention tracking than FMOs using BOSS alone")

**4. Am I trying to build too many things? Should I kill features to focus?**

Yes, you are spread too wide. You have 30+ routes, 21 edge functions, 55+ doc files, and zero tests. Several features exist as stubs (Industry Updates, AI Chat, Compliance downloads with null URLs).

Kill: Industry Updates page, standalone Compliance page
Stop investing: AI Chat, PDF Builder, Roadmap Generator, Activity Log
Focus everything: Client Directory, Commission Display, T65 Alerts, Sync Engagement Loop

**5. Based on code quality and completeness, how many of our features are actually "demo-ready" for stakeholder presentations?**

**Confidently demo-ready (show these):**
- Agent Dashboard (Golden Hour) — visually impressive, data-driven
- Smart Sync flow — the multi-step upload is polished
- Contracting Wizard — complete workflow, professional
- Admin Dashboard — search-first, clean
- Agent Profile (admin view) — comprehensive
- Carrier Resources — practical, well-organized
- Training Library — content exists, navigation works

**Demo with caveats (show carefully):**
- Contracting Hub — good but one-time use
- Forms Library — works but content may be sparse
- Plan Finder — good but KY-only, admin-gated

**Do NOT demo:**
- Industry Updates — embarrassing placeholder
- Compliance Page — broken download links
- AI Chat features — no UI exists
- Any page with the old design system (old Navigation/Footer patterns vs Golden Hour)

---

## PART 4: 90-Day Strategic Roadmap

### Phase 1: STOP (Immediately)

| Action | Effort | Agent Impact | Recruiting Impact | Rationale |
|--------|--------|-------------|-------------------|-----------|
| Remove Industry Updates from navigation | Small | None | Low (stops embarrassment) | Placeholder page makes platform look unfinished |
| Remove or merge Compliance page | Small | None | Low | Merge SOA content into Forms, kill broken downloads |
| Stop writing audit/planning docs | Zero | None | None | You have 55+ docs. Ship code instead. |
| Stop investing in AI Chat, PDF Builder, Roadmap Generator | Zero | None | None | Come back after core loop works |

### Phase 2: FIX (Weeks 1-3)

| Action | Effort | Agent Impact | Recruiting Impact | Your Book Impact | Rationale |
|--------|--------|-------------|-------------------|-----------------|-----------|
| **Build `/my-clients` page** | Medium | **High** | Medium | **High** | You HAVE the data from sync. Build a searchable client directory showing name, phone, email, carrier, plan, effective date, T65 status. This is the #1 thing that makes agents log in more than once a month. |
| **Add commission card to dashboard** | Small | **High** | Medium | **High** | Use existing `useCommissions` hook. Show projected monthly and annual earnings on the dashboard or a dedicated `/my-earnings` section. |
| **Fix Compliance download links** | Small | Low | Low | None | 4 of 5 downloads have `url: null`. Either add real files or remove the entries. |
| **Ensure all agent pages use Golden Hour design** | Small | Low | Medium | None | Industry Updates and Compliance use the old design system. Inconsistency looks unprofessional in demos. |

### Phase 3: BUILD (Weeks 3-8)

| Action | Effort | Agent Impact | Recruiting Impact | Your Book Impact | Rationale |
|--------|--------|-------------|-------------------|-----------------|-----------|
| **T65 alert system** | Medium | **High** | **High** | **High** | Flag clients approaching 65 or with policies nearing renewal. Show on dashboard + client directory. This is your biggest differentiator. |
| **Sync reminder emails** | Small | Medium | Low | Medium | Use existing `sync_reminder_sent_at` field. Send email when sync is stale. Keeps agents in the platform. |
| **Open Plan Finder to agents** | Small | Medium | Medium | Medium | Remove admin gate. Agents need quick plan lookups during appointments. |
| **Client contact quick-actions** | Small | Medium | Low | **High** | Click-to-call, click-to-email from client directory. Agents in the field need this. |

### Phase 4: DEMO (Show Stakeholders NOW)

**For Caroline, Andrew, and Jeremy — here's the demo script:**

1. **Start with the Agent Dashboard.** Show an agent with a real book. The big number, carrier bars, milestone progress, growth streak. This is visually impressive and emotionally resonant. "This is what your agents see when they log in."

2. **Run a Smart Sync.** Upload a carrier report. Show the auto-detection, the parsing, the client count updating in real time. "No other FMO platform in Kentucky does this."

3. **Walk through Contracting.** Show a new agent flowing through the wizard, the auto-save, the signature capture. Then switch to admin view and show the queue. "End-to-end contracting, no email attachments."

4. **Show Admin Dashboard.** Search for an agent, click into their profile, show certifications, carrier status, documents, admin notes. "Complete agency management."

5. **Show Carrier Resources.** "Agents only see carriers they're certified with. No information overload."

6. **Show the Roadmap.** "Here's what's next: client directory, commission projections, T65 alerts. We're building the features agents actually need, not another bloated CRM."

**Do NOT show:** Industry Updates, Compliance page, AI Chat, PDF Builder, any page with broken links.

---

## Final Word

Austin, you've accomplished something impressive. You went from zero programming experience to a production-deployed SaaS platform with 36+ database tables, 21 edge functions, a coherent design system, and real users. Most people with your background would have given up after the login page.

But the platform is at a crossroads. Right now it's a beautiful onboarding tool with a motivational dashboard. It needs to become a **daily utility** — the place agents go to look up clients, check earnings, and see what needs attention.

The good news: the hardest infrastructure is built. The database schema supports everything you need. The auth, roles, and data pipeline work. You're not starting from scratch — you're three features away from a genuinely valuable product.

Build the client directory. Show commissions. Flag T65s. Then stop building new features and start getting agents to use what you've built.

The code won't save the company. Agent adoption will.
