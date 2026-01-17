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

## January 16, 2026 - Merged Contracting & Carriers Page

### What I worked on:
- Combined ContractingHubPage + MyCarriersPage into single unified view
- Fixed RTS import pipeline to update carrier_statuses
- Cleaned up navigation and routes

### Merged Contracting & Carriers Page
- Agents now see contracting status AND certification status in one table
- Hero progress bar shows "X of Y Ready to Sell"
- AHIP and Resources moved to compact header bar
- License states bar shows resident + non-resident states
- Compact above-the-fold layout (no scrolling for typical agent)

### Fixed RTS Import Pipeline
- Import now updates carrier_statuses table (was only updating agent_certifications)
- Carrier name matching uses rts_aliases for fuzzy matching (WellCare vs Wellcare)
- Dynamic year calculation: Oct-Dec = next year, Jan-Sept = current year
- No more hardcoded years - automatically handles 2026 → 2027 transition

### What I learned:
- **carrier_statuses vs agent_certifications**: Two different concepts!
  - `carrier_statuses` = contracting status (one-time: not_started → in_progress → contracted)
  - `agent_certifications` = certification status (annual: certification_year per carrier/product)
  - RTS = contracted + certified for current year (per carrier)

- **Dynamic year calculation**: Medicare AEP runs Oct 15 - Dec 7, so in Oct-Dec agents are certifying for NEXT year. Formula: `month >= 9 ? year + 1 : year`

- **Carrier name normalization**: RTS reports use different names than our carriers table. Solution: `rts_aliases` column stores alternate names, import matches against both name and aliases.

### Files Changed
- `ContractingHubPage.tsx` - Complete rebuild with compact layout
- `rtsImport.ts` - Fixed to update carrier_statuses + dynamic years
- `Navigation.tsx` - Removed Contracting and My Carriers links
- `AgentProfileDropdown.tsx` - Changed label to "My Carrier Status"
- `App.tsx` - Removed /my-carriers route
- `MyCarriersPage.tsx` - DELETED (merged into ContractingHubPage)

### Commands/patterns to remember:
- Date-based year logic: `new Date().getMonth() >= 9 ? year + 1 : year`
- Supabase alias matching: Store aliases in text[] column, match with `.toLowerCase()`
- Click-outside dropdown: `useEffect` with `mousedown` listener + ref check

---

## January 17, 2026 - V6 Roadmap Generator Complete

### What I worked on:
- Completed all 7 pages of Strategic Growth Roadmap PDF generator
- Added personalization throughout based on agent profile
- Fixed logic bugs before MVP launch
- Created comprehensive documentation for business partner handoff

### Page-by-Page Enhancements:
- **Page 1**: Tier 2 channels (Lead Star, MIRA, Seminars) get gray backgrounds for visual distinction. Expected Sales column now calculated for all channels.
- **Page 2**: Added PRIMARY FOCUS badge for priority channel. Scripts now in gold/cream boxes with quotation marks.
- **Page 3**: Extended economics from 3 years to 5 years. Added bar chart visualization and emotional payoff callout.
- **Page 5**: First Week Checklist personalized based on book_size and lead_star_leads. Weekly Rhythm shows actual attempt numbers.
- **Page 6**: Redesigned activity tracker with larger cells and targets. Added "Behind Pace?" recovery section. Replaced "My Commitment" with "My Numbers" reflection.
- **Page 7**: Added Referral Engine math breakdown. Added "When Stuck" troubleshooting section.

### Logic Fixes:
- **COI cap at 50%**: Circle of Influence expected sales was showing 100% of goal (unrealistic). Now capped at 50%.
- **Unified referral formula**: Two different formulas were calculating weekly referral asks. Unified to use same REFERRAL constants everywhere.
- **New agent advice**: "Behind Pace" and "When Stuck" sections now show COI-based advice for agents with small books instead of assuming they have clients.

### What I learned:
- **pdf-lib patterns**: `drawRect()` for backgrounds, `drawText()` for content, `drawLine()` for borders. Colors use `rgb(r, g, b)` with 0-1 values not 0-255.

- **Conditional PDF content**: Build arrays/objects first, then iterate to render. Makes conditional logic cleaner than inline ternaries in draw calls.

- **Supabase Edge Function config**: `verify_jwt = false` in config.toml is needed when gateway JWT verification fails (ECC key incompatibility). Function can still do internal auth if needed.

- **Business logic documentation**: When sharing code with non-technical partners, explain the "why" behind constants. Why 85% retention? Why 15% Lead Star close rate? Industry benchmarks matter.

- **Personalization hierarchy**: The most valuable personalization is advice that changes based on agent situation. Showing different numbers is table stakes; showing different *guidance* is what makes it useful.

### Commands/patterns to remember:
- `npx supabase functions deploy <name> --project-ref <id>` - deploy edge function
- PowerShell heredoc: `$body = @' ... '@` for multi-line JSON
- pdf-lib text: `font.widthOfTextAtSize(text, size)` for right-alignment calculations
- Supabase function invoke: `supabase.functions.invoke('name', { body: {...} })`

### Key decisions made:
- COI capped at 50% of goal (prevents over-reliance on one channel)
- New agents get COI-based advice, experienced agents get client-based advice
- Documentation created as markdown for easy sharing/editing
- Referral constants centralized (TENURE_ELIGIBLE_PERCENT, YIELD_RATE, etc.)

### Files created/modified:
- `supabase/functions/generate-roadmap-pdf/index.ts` - Complete V6 rewrite (~1650 lines)
- `src/types/roadmap.ts` - Added expected_display, priority, referral metrics
- `supabase/config.toml` - Added verify_jwt = false for roadmap function
- `ROADMAP_GENERATOR_COMPLETE_DOCUMENTATION.md` - Full documentation for partner

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
