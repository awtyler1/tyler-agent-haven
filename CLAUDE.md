# Agent Platform

**One-liner:** Operating system for Medicare agents — onboarding, certifications, resources, and production tracking.

**Last Updated:** January 26, 2026

> **Rule:** Before building any new page, component, or UI feature, read `HOMESTEAD.md` first. It is the single source of truth for colors, typography, spacing, components, animation, and layout patterns.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript 5.8 + Vite 5.4 |
| UI | TailwindCSS 3.4 + Shadcn/ui (Radix) |
| Backend | Supabase (PostgreSQL 17, Auth, Storage, Edge Functions) |
| State | TanStack Query 5 + React Hook Form + Zod |
| Email | Resend (transactional) + Microsoft Graph (Outlook) |
| Monitoring | Sentry |

---

## Commands

```bash
npm run dev              # Start dev server
npm run build            # Build for production
npm run lint             # Run ESLint
npm run deploy:functions # Deploy edge functions to Supabase
```

---

## Project Structure

```
src/
├── pages/           # Route components (Index, Admin/*, Auth/*)
├── components/      # Feature-organized (admin/, contracting/, ui/)
├── hooks/           # Custom hooks (useAuth, useProfile, useRole)
├── lib/             # Business logic (sync.ts, rtsImport.ts)
├── integrations/    # Supabase client + types
└── data/            # Static data (carriersData.ts)

supabase/
├── functions/       # 21 Edge Functions (Deno)
└── migrations/      # 67 database migrations

docs/                # 32 active + 6 archived documentation files
```

---

## Key Features (Working)

| Feature | Status |
|---------|--------|
| **Authentication** | Login, signup, password reset, invite flow |
| **Roles** | 5-level RBAC (super_admin → independent_agent) |
| **Contracting Wizard** | 8-step form with PDF generation |
| **Contracting Hub** | Per-carrier status tracking |
| **RTS Import** | Upload Pinnacle Excel → auto-create profiles + certs |
| **Book of Business** | Admin Smart Sync + parsing pipeline functional. Agent-facing BOB view not yet built. |
| **Carrier Resources** | Contacts, portals, documents (filtered by agent certs) |
| **Forms Library** | SOA, enrollment, compliance forms |
| **Training** | Video library with progress tracking |
| **Admin Dashboard** | Search-first design, agent management, queue |
| **Activity Logging** | Audit trail for super admins |

---

## Database

### Core Tables
- `profiles` — User data (name, email, NPN, manager_id, onboarding_status)
- `user_roles` — Role assignments (super_admin, admin, manager, agent)
- `contracting_applications` — Multi-step wizard data (JSONB fields)
- `carriers` — Carrier definitions with RTS aliases
- `carrier_statuses` — Agent-carrier appointment status
- `agent_certifications` — RTS certifications by year

### Production Tracking
- `monthly_syncs` — Monthly sync records
- `sync_carrier_uploads` — Per-carrier upload data
- `agent_carriers` — Selected carriers to track
- `milestones` — Achievement records

### Supporting
- `activity_logs` — Audit trail
- `agent_documents` — Uploaded files
- `forms` — Form templates
- `feature_flags` — Feature toggles

---

## Edge Functions (21 deployed)

**Agent Lifecycle:** create-agent, send-setup-link, validate-password
**Admin:** create-admin, delete-user, reset-user-password
**Contracting:** generate-contracting-pdf, send-contracting-packet
**Production:** parse-production-report
**Email:** microsoft-oauth-*, microsoft-send-email
**AI:** agent-chat, agent-chat-rag, process-document

---

## Design System

See `HOMESTEAD.md` for full patterns (replaces `DESIGN_SYSTEM.md`, now archived in `docs/archived/`). Key tokens:

| Element | Pattern |
|---------|---------|
| Page background | `bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]` |
| Cards | `rounded-xl border border-[#e8e4dd] bg-white` |
| Headers | `TIG \| Agent Portal` with sticky blur |
| Footers | `Powered by Tyler Insurance Group` |
| Primary action | Blue (`bg-blue-600 hover:bg-blue-700`) |
| Status dots | `w-2 h-2 rounded-full` (green/amber/red) |

---

## Key Patterns

### State Management
Hook composition instead of Redux:
```tsx
const { user, profile, isAdmin, canAccessAdmin } = useAuth();
// useAuth = useProfile + useRole combined
```

### Form Auto-Save
800ms debounced save with optimistic updates:
```tsx
const { application, updateField } = useContractingApplication();
// Changes auto-persist to contracting_applications table
```

### Agent Carrier Filtering
Agents only see carriers they're certified with:
```tsx
const { carriers, loading } = useAgentCarriers();
// Queries agent_certifications, maps RTS names to carrier codes
```

### Role-Based Routes
```tsx
<ProtectedRoute requireAdmin>     {/* Admin or Super Admin */}
<ProtectedRoute requireSuperAdmin> {/* Super Admin only */}
<ProtectedRoute allowContractingOnly> {/* Agents in CONTRACTING_REQUIRED */}
```

---

## Known Issues

- Microsoft OAuth tokens stored unencrypted
- Industry Updates page is placeholder
- Some carrier data is Kentucky-specific

## Recent Optimizations (Jan 26, 2026)

- **Auth waterfall fix:** useAuth now fetches profile, roles, downline in parallel
- **Dynamic xlsx imports:** Saves ~425KB from initial bundle (loads on-demand)
- **Logo optimization:** tyler-logo.png (769KB) → tyler-logo.webp (17KB)
- **Pre-launch audit fixes:** Navigation, error handling, number formatting

---

## Branding Context

Platform has TIG branding throughout (see `docs/BRANDING_WORKFLOW_AUDIT.md`):
- Footer text: "Powered by Tyler Insurance Group"
- Email senders: @tylerinsurancegroup.com domain
- Headers: "TIG | Agent Portal"
- Legal text in contracting sections

White-label pivot in progress — audit completed, changes pending.

---

## Writing Standards — Articles & Consumer/Agent Copy

> **Rule:** Before writing or editing ANY article (`src/data/articles.ts`), knowledge post, email, or other reader-facing copy, hold it to this standard. Reputation *is* the quality of the work we put out. Do not ship writing that fails these bars.

**Two audiences, one set of bars.** The three bars below are shared DNA and apply to everything we publish. But *who* the piece is for changes how you execute:
- **Consumer / newer-agent pieces** (education, plain-language explainers): default to the guidance in this section. Explain the mechanics simply. Clarity wins.
- **Insider / professional pieces** (market analysis, carrier and product breakdowns, selling-season strategy, regulatory reads for people who sell every day): also follow the **Insider / Professional Writing** section further down. Do not explain the basics to this reader.

When you start a piece, decide which audience it serves and apply the matching layer.

**Every piece must clear three bars:**

| Bar | Means |
|-----|-------|
| **True** | Accurate and sourced. If a fact isn't verified, don't write it. Research first, claim second. |
| **Useful / actionable** | The reader can *do* something with it. Always answer "so what, for me?" |
| **Clear** | Simple and easy to understand. **High signal, low noise.** Cut anything not pulling its weight. |

**Keep the lens on the reader.** Write for what *they* need, not what we want to say. Prime them early. In the first lines, make it obvious why this is worth their time.

**Ask these questions every time, before writing and again after:**
1. What do people need right now?
2. What are people asking for?
3. How can we make this incredibly useful?
4. How can we make it more actionable?
5. How can we make it easier to understand and simpler?
6. How are we priming the reader for high-quality, useful, clear work?

If a draft can't answer these, it isn't done.

**Style rules:**
- **No em dashes (—).** Use a period, a comma, a colon, or parentheses instead. Rework the sentence rather than reaching for a dash.

---

## Insider / Professional Writing

> **Rule:** Applies when the audience is the industry itself: brokers, agents, FMO/IMO partners, carrier contacts, and other experts. This layer sits on top of the three bars above (True / Useful / Clear), it does not replace them. The style rules above still hold, including **no em dashes**.

**Mission.** Two jobs, and only these two: make it genuinely valuable to someone who already knows this industry, and make it engaging enough that a busy professional reads to the end. For this reader those are the same goal. Both come from respecting their time and their intelligence.

**The bar.** A seasoned broker should finish and think "I didn't know that," or "I've never framed it that way," or "I'm forwarding this to my team." Anything less is filler.

**Who you're writing for.** Insiders who sell Medicare Advantage, Med Supp, and Part D every day. They know the vocabulary, so do not explain what a formulary, star rating, MOOP, AEP, or MLR is. They read a lot of industry content and have low tolerance for the generic version of it. They are time-poor and skeptical. Write to them as a peer who has done the homework, not as a vendor and not as a teacher.

**What "high value" means here.** Value for an expert is the *delta*: what you add to what they already know. Measure every piece against that.
- **Lead with insight, not recap.** Assume they saw the headline. Your value starts where the headline stops, in the implications.
- **Have a thesis.** Take a defensible position and back it. Do not hedge into mush.
- **Think in second-order effects.** Not "Carrier X cut commissions," but what that signals about their MA margins and how it reshapes broker behavior next season. Always push to what it means downstream.
- **Be specific, and be right.** Named dynamics, real numbers, actual mechanics. Precision is non-negotiable. An expert stops reading the instant they catch you bluffing. When you are not certain of a figure or a claim, verify it or frame it honestly as a read rather than a fact.
- **Synthesize across sources.** The freshest takes come from connecting things others treat separately: an enrollment trend against a demographic shift, a carrier's move against a broader incentive structure. Original synthesis is the highest-value thing you can offer.

If a paragraph does not teach, sharpen, or reframe something, cut it.

**What "engaging" means here.** Momentum plus credibility, not entertainment.
- **Open with a hook that signals payoff.** A specific claim, a surprising number, a sharp question, a counterintuitive read. Skip the throat-clearing.
- **Earn every next paragraph.** Each one advances the argument or adds a new angle. No treading water.
- **Write with plainspoken authority.** Say the thing directly. Confidence backed by substance is what keeps a skeptical reader.
- **Use concrete detail** and the occasional well-chosen analogy to make a complex dynamic click, never at the cost of precision and never analogies aimed at beginners.
- **Find the tension.** The most engaging industry writing sits on a real friction: a strategy working now that will not last, an incentive misalignment, a bet the market has not priced in. Name it.
- **Respect the scan.** Tight paragraphs, meaningful headers. But keep prose as the engine. This reader wants an argument, not a slide deck rendered as bullets.

**What to avoid.**
- Explaining the basics. The fastest way to lose this reader.
- Empty authority signals ("In today's ever-evolving Medicare landscape..."). Cut all of it.
- Both-sides mush with no take. Concluding nothing reads as having no insight.
- Padding. If it is a 400-word idea, it is a 400-word piece. Length is never the goal.
- Overstatement you cannot back. Experts catch it instantly and it torches your credibility for the whole piece.

**Voice.** Sharp, confident, peer-to-peer. A well-informed insider talking to other insiders: direct, specific, occasionally opinionated, never puffed up. The kind of voice that earns a forward and a "you seen this?"

**Output shape.**
1. Open on the insight or the stakes, no warm-up.
2. Carry one clear argument the reader can hold onto.
3. Move through it with momentum, each section adding a distinct point.
4. Land on the "so what for you," the practical or strategic implication for someone selling in this market.

---

## Documentation Index

| File | Purpose |
|------|---------|
| `HOMESTEAD.md` | Design system (replaces DESIGN_SYSTEM.md) |
| `docs/ARCHITECTURE.md` | Full architecture docs + code health + schema appendices |
| `docs/DASHBOARD_AUDIT.md` | Dashboard UX analysis, content inventory, responsive issues |
| `docs/ADMIN_PAGES_AUDIT.md` | Admin pages visual consistency + style reference |
| `docs/AGENTS_PAGE_REDESIGN.md` | Agents page redesign spec + visual audit |
| `docs/GROWTH_PLAN_V8_AUDIT.md` | Growth Plan PDF logic + visual audit |
| `docs/AGENT_IMPORT.md` | Agent import flow, schema, planned improvements |
| `docs/BRANDING_WORKFLOW_AUDIT.md` | TIG branding removal checklist |
| `docs/DEVELOPER_ONBOARDING.md` | New developer setup guide |
| `docs/GOLDEN_HOUR_MIGRATION_AUDIT.md` | GH theme migration for 3 areas |
| `docs/SEO_GEO_RECRUITING_STRATEGY.md` | Public-site SEO/GEO + FMO recruiting-funnel strategy |
| `docs/CONTENT_WORKFLOW.md` | How to add articles + YouTube so they rank and get cited |
| `docs/MEASUREMENT.md` | SEO/GEO/recruiting measurement runbook (week-one + monthly) |

---

## Quick Reference

**Supabase Project:** mgczpsrtkdkkjzmztpyd
**Production URL:** https://www.tigagenthub.com
**Vercel:** Auto-deploys from main branch
