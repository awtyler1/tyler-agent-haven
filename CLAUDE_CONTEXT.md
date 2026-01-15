# TIG Platform - Development Context for AI Assistants

> **Last Updated:** January 14, 2026
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

### Week 2: Activity Tracking ✅ COMPLETE
- [x] Create activity_logs table
- [x] Add RLS policy (super_admin only can view)
- [x] Create logActivity() utility function
- [x] Log: login, logout, contracting submission
- [x] Log: admin actions (queue status changes, send to Pinnacle)
- [x] Build admin activity log viewer

### Week 3: Test Rollout ⬅️ CURRENT FOCUS
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
