# TIG Platform - Development Context for AI Assistants

> **Last Updated:** January 16, 2026
> **Owner:** Austin (Producer at AmeriLife, Co-owner Tyler Insurance Group)
> **Strategic Advisor:** Claude (Anthropic) - for business/product decisions, paste updates in claude.ai

---

## WHAT THIS PROJECT IS

Tyler Insurance Group Agent Management Platform - a comprehensive web application for insurance agent onboarding, contracting, certifications, and training for a Medicare FMO (Field Marketing Organization).

### The Vision
1. **Phase 1 (NOW):** Internal tool for TIG's 300 agents
2. **Phase 2 (6-8 weeks):** Multi-tenant platform supporting partner agencies with their own branding
3. **Phase 3 (Future):** Licensable platform for external FMOs

### Why It Matters
- Differentiator in commoditized FMO market
- Recruiting and retention advantage for 1099 brokers
- Foundation for national FMO expansion

---

## CURRENT SPRINT (30 Days Starting Jan 14, 2026)

### Week 1: Stability ✅ COMPLETE
- [x] Sentry error tracking integration
- [x] Remove console.log statements (113 found, cleaned up debug leftovers)
- [x] Fix TypeScript issues in useContractingApplication.ts
- [x] Add .catch() to promises in useProfile.ts
- [x] Test full contracting flow
- [x] Fix scroll bug in form wizard (bonus)

### Week 2: Agent Data + Hierarchy ✅ COMPLETE
- [x] Create agent_certifications table
- [x] Build RTS spreadsheet import (Caroline uploads Pinnacle report)
- [x] Import logging (tracks last upload, results)
- [x] Fix RLS policies (agent_certifications, carriers, carrier_statuses)
- [x] Wire Send to Pinnacle → create carrier_statuses
- [x] Fix carrier code case matching
- [x] My Carriers page - agents see RTS + contracting status
- [x] UI redesign - combined view with AHIP banner, grouped by status
- [x] RTS import updates carrier_statuses (marks as contracted)
- [x] Dynamic year logic in RTS import (no hardcoded years)
- [ ] Add reports_to_id column to profiles table
- [ ] Build hierarchy admin UI (Caroline assigns who reports to whom)
- [ ] Build "My Team" view for agents with downline
- [ ] Build "My Upline" view (agent sees their full chain up to TIG)

### Week 3: Test Rollout ⬅️ CURRENT FOCUS (Day 1 Complete)
- [x] Merged Contracting & Carriers page (ContractingHubPage.tsx rebuilt)
- [x] Compact header layout with progress bar, AHIP status, Resources dropdown
- [x] Added 2026/2027 certification year columns
- [x] License states bar showing resident + non-resident states
- [x] Navigation cleanup (accessed via user dropdown "My Carrier Status")
- [x] Deleted MyCarriersPage.tsx, cleaned up routes
- [ ] Populate KY + Nevada certification data
- [ ] Onboard Andrew's team (5 agents) as test group
- [ ] Fix bugs from real usage

### Week 4: Multi-Org Foundation
- [ ] Create organizations table with parent/child relationships
- [ ] Add organization_id to profiles
- [ ] Update RLS policies for org scoping

---

## RULES FOR AI ASSISTANTS

### DO:
- Help with tasks in the current sprint
- Keep solutions simple and production-ready
- Suggest error handling and edge cases
- Ask clarifying questions before major changes

### DO NOT:
- Build new features not in the current sprint
- Suggest architectural changes without discussing tradeoffs
- Add dependencies without justification
- Create "quick hacks" - this is going to production

### IF AUSTIN ASKS TO BUILD SOMETHING NEW:
Respond with: "This isn't in your current sprint. Want me to add it to your Future Ideas list instead, or is this urgent enough to discuss with your strategic advisor first?"

---

## TECHNICAL CONTEXT

### Stack
- Frontend: React 18 + TypeScript + Vite + TailwindCSS + shadcn/ui
- Backend: Supabase (PostgreSQL + Edge Functions + Auth + Storage)
- Email: Microsoft Graph + Resend
- Deployment: Vercel (frontend) + Supabase (backend)

### Key Files
- `/src/hooks/useContractingApplication.ts` - Has TypeScript issues to fix
- `/src/hooks/useProfile.ts` - Missing .catch() on promises
- `/src/components/contracting/` - 30 components for 12-step wizard
- `/supabase/migrations/` - 30+ migrations (be careful with new ones)

### Database Tables (Core)
- `profiles` - User accounts, links to hierarchy_entity_id
- `user_roles` - RBAC (super_admin, admin, manager, internal_tig_agent, independent_agent)
- `contracting_applications` - 60+ field contracting form
- `carriers` / `carrier_statuses` - Carrier registry and per-agent status
- `hierarchy_entities` - Teams, MGAs, GAs structure

### Current Gaps (DO NOT FIX UNLESS IN SPRINT)
- No error tracking (Week 1 task)
- No activity logging (Week 2 task)
- Certifications only complete for KY (Week 3 task)
- No multi-org/white-label support (Week 4+ task)

---

## STATES TO SUPPORT
Primary: Kentucky, Nevada
(Only populate certification data for these states for now)

---

## CONTACT FOR STRATEGIC DECISIONS

If a decision involves:
- Architecture changes
- New features
- Business logic questions
- "Should we..." questions

--> Tell Austin to discuss with his strategic advisor in claude.ai first.

---

## FUTURE IDEAS (Parking Lot)
*Add ideas here instead of building them*

- Commission tracking
- Production reporting
- Agent performance dashboards
- Org chart visualization
- Automated carrier appointment status checks
- NPN lookup integration (validate NPN against NIPR database)
- Bank routing number validation

### Feature Idea: Recertification Season UI

**Location:** Contracting page (merged page with carrier status)

**Concept:** Show agents when AHIP and carrier certifications open during recert season (Aug-Oct), so they're not asking "when can I certify with Aetna?"

**Seasonal Banner (Aug-Oct)**
Add a dismissible banner at the top of the Contracting page:
```
🗓️ 2027 Recertification Season
AHIP opens Aug 1 · Most carriers open Sept 1-15
[View Full Schedule]
```

**Carrier Table Enhancement**
Add release date info to carriers that aren't yet open for certification:

| Carrier | Products | Contracting | Certified | Status |
|---------|----------|-------------|-----------|--------|
| Aetna | MA, PDP | Contracted | ○ | Opens Sept 12 |
| Humana | MAPD | Contracted | ○ | Certification Guide → |

- If cert not yet open → "Opens [date]"
- If cert is open but not complete → "Certification Guide →"
- If cert complete → "Ready to Sell"

**Data Needed**
- `certification_open_date` field per carrier (or a separate recert_schedule table)
- Could be as simple as a JSON config file updated annually

**MVP for Now**
Just add a "2026 Recert Schedule" PDF link in the Resources section. Build the smart UI in July before AEP prep.

**Timeline**
- **Now:** PDF in Resources ✓
- **July 2026:** Build banner + "Opens [date]" logic
- **Aug 2026:** Flip the switch for recert season

**Related**
- AHIP section could also show "Opens Aug 1" before it's available
- Consider email/notification when a carrier's cert opens

---

## PROGRESS LOG

### January 14, 2026
- Created development context document
- Completed Week 1: Stability sprint
  - Sentry error monitoring integrated
  - Console statements cleaned up (113 found, debug leftovers removed)
  - TypeScript anti-patterns fixed in useContractingApplication.ts
  - Promise error handling added to useProfile.ts
  - Scroll bug fixed in contracting form wizard
- Starting Week 2: Activity Tracking

### January 14, 2026 (Session 2)
- Completed Week 2: Activity Tracking
  - Created activity_logs table with indexes
  - Added RLS policy (super_admin only can view)
  - Built logActivity() utility with type-safe constants
  - Wired up logging for: login, logout, contracting submission
  - Added admin action logging: queue status changes, send to Pinnacle
  - Built admin Activity Log viewer page at /admin/activity-log
  - Added nav link to Admin Dashboard
- Added QUEUE_STATUS_CHANGED to ActivityAction constants
- Fixed migration history sync issue (marked 38 existing migrations as applied)

### January 15, 2026 (Session 2)
- Built RTS certification import system
  - agent_certifications table with RLS
  - Admin upload page at /admin/rts-import
  - Import logging (rts_import_logs table)
  - Tested with real Pinnacle report: 2 agents matched, 102 certs imported
- Wired Send to Pinnacle → carrier_statuses creation
  - Fixed carrier code case mismatch (lowercase vs uppercase)
  - Fixed carriers table RLS (added public read policy)
  - Fixed carrier_statuses unique constraint
  - Fixed carrier_statuses RLS for admin INSERT and user SELECT
- Redesigned My Carriers page
  - Combined certifications + contracting status
  - Dynamic year detection (2026 → 2027 automatic)
  - AHIP status derived from certifications
  - Sections: Ready to Sell, Needs Recert, Contracting In Progress, Action Needed
- Remaining: Hierarchy (reports_to_id), Team views, State tracking, Agent invites

### January 16, 2026 (Week 3 - Day 1)
- Merged Contracting & Carriers page (ContractingHubPage.tsx rebuilt)
  - Compact above-the-fold layout
  - Horizontal header bar: progress + AHIP + Resources dropdown
  - Gold left border accent for brand warmth
  - License states bar showing resident + non-resident states
  - Standard Navigation and Footer components
- Fixed RTS import to update both agent_certifications AND carrier_statuses
  - Dynamic year calculation (Oct-Dec = next year for AEP)
  - Accepts certifications for current year ± 1
  - Marks carriers as "contracted" for current year certs
- Added 2026/2027 certification year columns to carrier table
- Navigation cleanup
  - Removed "Contracting" from main nav
  - Updated profile dropdown: "My Carrier Status" → /contracting-hub
  - Deleted MyCarriersPage.tsx (merged into ContractingHubPage)
  - Removed /my-carriers route
- Ready for testing: Contracting & Carriers page fully functional

### Next Priorities
1. Hierarchy system (reports_to_id for agent uplines)
2. Dashboard status card
3. Test rollout with 5 agents (Andrew's team)

---

## KEY ROUTES

### Agent Routes
- `/` - Dashboard
- `/contracting-hub` - Unified Contracting & Carriers page (agent's carrier status, certifications, AHIP)
- `/agent-tools` - Agent tools
- `/training` - Training library

### Admin Routes
- `/admin` - Admin dashboard
- `/admin/contracting` - Contracting queue
- `/admin/rts-import` - RTS certification import
- `/admin/activity-log` - Activity log viewer

### Navigation
- **Main nav:** Dashboard, Tools, Training
- **User dropdown:** My Carrier Status → /contracting-hub
- **Admin link:** Shows for admin/super_admin users

### Removed Routes
- `/my-carriers` - Merged into /contracting-hub
