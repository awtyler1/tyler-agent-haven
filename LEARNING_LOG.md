# TIG Platform - Learning Log

> Personal notes on what I'm learning as I build this platform.
> Updated after each working session.

---

## January 14, 2025 - Project Setup & Planning

### What I worked on:
- Created CLAUDE_CONTEXT.md for AI assistant alignment
- Created .cursorrules for Cursor-specific instructions
- Set up accountability system and 30-day sprint plan

### What I learned:
- Sentry is an error monitoring tool that catches JavaScript errors automatically and reports them to a dashboard
- The reason I need it: without it, I have no idea when users hit bugs unless they tell me (they won't)
- My platform is further along than I realized — the core features are done, I'm in "stabilization" mode now

### What I'm still fuzzy on:
- How Sentry actually integrates with React (will learn during setup)
- How RLS policies will need to change for multi-tenant orgs

### Commands/patterns to remember:
- (Will add as I learn them)

### Key decisions made:
- Week 1-4 sprint plan focused on stability before new features
- Test rollout with Andrew's team (5 agents) before wider launch
- States to support first: Kentucky and Nevada only

---

## January 14, 2026 - Week 1: Stability Sprint

### What I worked on:
- Integrated Sentry error monitoring
- Cleaned up 113 console statements (removed debug leftovers, kept intentional error handling)
- Fixed TypeScript type safety issues in useContractingApplication.ts
- Added proper error handling (.catch()) to useProfile.ts
- Tested full 12-step contracting flow
- Fixed scroll position bug when navigating between form steps

### What I learned:
- **Sentry**: Error monitoring service that catches JavaScript errors automatically. Without it, I'd never know when users hit bugs unless they told me (they won't). Key concepts: DSN (project identifier), ErrorBoundary (catches React crashes), breadcrumbs (trail of what happened before error)

- **TypeScript type safety**: Using `as unknown as Type` bypasses all type checking - it's dangerous because TypeScript can't catch mismatches. Better approach: create transformer functions that explicitly handle each field with defaults for nullable values.

- **Promise error handling**: Every async operation needs a .catch() or try/catch. Without it, errors disappear silently. "Graceful degradation" means when something fails, show the user a helpful state (error message, retry option) instead of a frozen screen.

- **console.error in catch blocks is fine**: These are intentional error logging for handled errors. Sentry captures unhandled errors automatically. The ones I removed were debug leftovers (console.log) not real error handling.

### What I'm still fuzzy on:
- How RLS policies will change for multi-tenant orgs (Week 4)
- The full Supabase type generation process

### Commands/patterns to remember:
- `window.scrollTo({ top: 0, behavior: 'smooth' })` - scroll to top on navigation
- Sentry.init() goes in main.tsx before React renders
- Type transformer pattern: function that takes DB row, applies defaults, returns typed object

### Key decisions made:
- Keep console.error in catch blocks (intentional error handling)
- Don't add NPN lookup or routing validation now (Future Ideas)
- Fix UX bugs immediately (scroll issue) - they affect every user

---

## January 14, 2026 (Session 2) - Week 2: Activity Tracking

### What I worked on:
- Built complete activity logging system from database to UI
- Created activity_logs table, RLS policies, utility functions, and admin viewer

### What I learned:
- **Activity logging / audit trails**: Recording who did what and when. Essential for compliance, support, and security. You're not watching it constantly, but when something goes wrong, it's there.

- **RLS for admin-only access**: Used has_role(auth.uid(), 'super_admin'::app_role) to restrict table access. Only super_admins can SELECT from activity_logs.

- **Metadata in JSONB**: Flexible storage for extra context that varies by action type. For "sent_to_pinnacle" we store carrier list and recipient; for "queue_status_changed" we store previous/new status.

- **Silent failure pattern**: Logging utilities should never break the main feature. Return true/false instead of throwing errors. Log failures to console.error (Sentry catches them) but don't crash the app.

- **Timing of log events**: Log "exit" events (logout) BEFORE the action that removes identity. Log "entry" events (login) AFTER successful authentication.

- **Migration repair**: When Supabase migration tracking gets out of sync, use `supabase migration repair --status applied <timestamp>` to fix it.

### Commands/patterns to remember:
- `supabase db push` - apply local migrations to remote database
- `supabase migration list` - shows which migrations are applied vs pending
- `supabase migration repair --status applied <timestamp>` - fixes tracking when out of sync
- Type-safe constants pattern: `ActivityAction.LOGIN` prevents typos, enables autocomplete

### Key decisions made:
- RLS locked to super_admin only (can loosen later if needed)
- Logs are immutable (no UPDATE/DELETE policies)
- ON DELETE CASCADE for user_id (simple for now, revisit if audit requirements get stricter)

---

## January 15, 2026 - Sprint Replanning + Hierarchy Design

### What I worked on:
- Analyzed Pinnacle RTS report (472 agents, 44 carrier/product certifications)
- Analyzed Production report to understand hierarchy levels
- Discovered Pinnacle hierarchy data is unreliable
- Designed simple hierarchy model (reports_to_id)
- Created team review documents for hierarchy model
- Replanned Week 2 to prioritize agent data over activity tracking

### What I learned:
- **RTS is per-carrier, not global.** An agent can be RTS with Humana but not UHC. RTS = AHIP + that carrier's certification.
- **AHIP is a prerequisite.** You can't do carrier certs without AHIP, so if an agent has any 2026 cert, they have AHIP.
- **Hierarchy can be simple.** One field (reports_to_id) handles unlimited depth. No need for MGA/GA flags. If people report to you, you're a team lead.
- **Don't import unreliable data.** Better to build hierarchy manually than import wrong relationships.

### Key decisions made:
- RTS report is source of truth for certifications (not agent self-reporting)
- Caroline manually assigns hierarchy (no auto-import)
- Week 2 reprioritized: RTS import + hierarchy before activity tracking
- Agents only see carriers they're contracted with

### What's next:
- Week 2: Build RTS import, hierarchy admin, certification display, My Team view

---

## Template for Future Entries

<!--
Copy this template for each new session:

## [Date] - [What I Worked On]

### What I worked on:
-

### What I learned:
-

### What I'm still fuzzy on:
-

### Commands/patterns to remember:
-

-->
