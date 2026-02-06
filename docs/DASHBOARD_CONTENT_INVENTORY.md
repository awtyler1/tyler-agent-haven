# Agent Dashboard — Content Inventory & Spatial Analysis

**Source File:** `src/pages/Index.tsx`
**Generated:** February 5, 2026
**Purpose:** Pre-redesign reference document. No code changes.

---

## TABLE OF CONTENTS

1. [Complete Content Inventory](#part-1-complete-content-inventory)
2. [Information Hierarchy Analysis](#part-2-information-hierarchy-analysis)
3. [Interaction Map](#part-3-interaction-map)
4. [Spatial Analysis](#part-4-spatial-analysis)
5. [Component Dependencies](#part-5-component-dependencies)
6. [Responsive Behavior](#part-6-current-responsive-behavior)

---

## PART 1: COMPLETE CONTENT INVENTORY

### State Machine

The dashboard has three mutually exclusive states that affect what renders:

| State | Condition | Affected Areas |
|-------|-----------|----------------|
| **Empty** | `totalClients === 0` | Greeting text, Beacon card body (shows EmptyStateCTA), Actions panel (Sync promoted, Quick Quote hidden) |
| **Stale** | `syncStatus === 'stale'` and NOT empty | Stale banner appears, stale warning in Beacon, Sync promoted in Actions, Quick Quote hidden |
| **Normal** | Has data, sync is current | Full Beacon with carriers + milestone, all Actions visible |

---

### 1. HEADER AREA

**Container:** `<header>` — `flex items-center justify-between mb-5`

| # | Element | Type | Content/Label | Tailwind Size | Data Source | Visual Weight |
|---|---------|------|---------------|---------------|-------------|---------------|
| 1.1 | Logo container | `<div>` | White square with "T" | `w-10 h-10 rounded-xl` | Static | Secondary |
| 1.2 | "T" lettermark | `<span>` | "T" | `font-bold text-blue-600 text-lg` | Static | Secondary |
| 1.3 | Platform label | `<p>` | "TIG PLATFORM" | `text-[11px] text-slate-400 font-medium tracking-wide` | Static | Subtle/Decorative |
| 1.4 | Portal title | `<p>` | "Agent Portal" | `font-semibold text-slate-800 -mt-0.5` | Static | Secondary |
| 1.5 | Sync Status Pill | `<SyncStatusPill>` | Dynamic label (see below) | Pill: `px-3 py-1.5 rounded-full text-xs`; Dropdown: `w-72 rounded-2xl` | Computed from `lastSyncAt` via 7th-of-month rule | Secondary |
| 1.6 | User Avatar | `<UserAvatarDropdown>` | User initials (2 chars) | `w-9 h-9 rounded-full bg-[#b8860b]` | `profile.full_name` (Supabase) | Secondary |

**Sync Status Pill — Three Visual States:**

| Status | Dot Color | Background | Text | Label |
|--------|-----------|------------|------|-------|
| `synced` | `bg-emerald-400` | `bg-white/80` | `text-slate-500` | "Synced {Mon DD}" |
| `stale` | `bg-amber-400` | `bg-amber-50` | `text-amber-700` | "Sync needed" |
| `never` | `bg-blue-400 animate-pulse` | `bg-blue-50` | `text-blue-600` | "Sync to start" |

**Sync Status Pill Dropdown Contents (on click):**

| # | Element | Content |
|---|---------|---------|
| 1.5a | Status icon | CheckCircle2 (synced) or RefreshCw (stale/never) in colored bg |
| 1.5b | Status title | "Book is current" / "Sync recommended" / "No data yet" |
| 1.5c | Last sync date | "Last synced {Month DD, YYYY}" or "Never synced" |
| 1.5d | Quick stats grid | 3 columns: Clients count, Net Change (+/-), Carriers count — only shown if `status !== 'never' && totalClients > 0` |
| 1.5e | Sync action link | "Start Sync" or "Sync Now" — links to `/sync` |
| 1.5f | Next reminder | "Next recommended sync: {date}" — computed via `getNextSyncDate()` |

**User Avatar Dropdown Contents (on click):**

| # | Element | Content | Condition |
|---|---------|---------|-----------|
| 1.6a | Full name | `profile.full_name` | Always |
| 1.6b | Email | `profile.email` | Always |
| 1.6c | Role badge | "Super Admin" / "Admin" / "Manager" / "Agent" / "TIG Agent" | Always |
| 1.6d | View Mode toggle | Agent / Admin toggle buttons | Only if `isDualRole` |
| 1.6e | "Agent" section header | Uppercase label | Always |
| 1.6f | My Profile | Links to `/my-profile` | Always |
| 1.6g | Certifications | Links to `/contracting-hub` | Always |
| 1.6h | BOSS CRM | External link to `fmo.kizen.com/login` | Always |
| 1.6i | "Admin" section header | Uppercase label | Admin+ in admin mode |
| 1.6j | Admin Dashboard | Links to `/admin` | `canAccessAdmin()` |
| 1.6k | Connect Outlook | Triggers OAuth flow | Admin+ |
| 1.6l | Create Admin | Opens `CreateAdminDialog` | Super Admin only |
| 1.6m | Activity Log | Links to `/admin/activity-log` | Super Admin only |
| 1.6n | Labs | Links to `/admin/labs` | Super Admin only |
| 1.6o | Dark Mode toggle | Switch component | Always |
| 1.6p | Sign Out | Logs out, redirects to `/auth` | Always |

---

### 2. STALE STATE BANNER (Conditional)

**Condition:** `isStale && !isEmpty`
**Container:** `mb-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4`

| # | Element | Type | Content | Size | Data Source | Visual Weight |
|---|---------|------|---------|------|-------------|---------------|
| 2.1 | Calendar icon container | `<div>` | Calendar icon | `w-10 h-10 bg-amber-100 rounded-xl` | Static | Secondary |
| 2.2 | Calendar icon | `<Calendar>` | — | `w-5 h-5 text-amber-600` | Static | Secondary |
| 2.3 | Banner title | `<p>` | "Time to sync your {Month} reports" | `font-medium text-slate-800` | Computed (`currentMonth`) | Primary |
| 2.4 | Last sync text | `<p>` | "Last synced {Mon DD}" or "No sync yet" + " • Recommended by the 7th each month" | `text-sm text-slate-500` | `data.lastSyncAt` | Tertiary |
| 2.5 | Sync Now button | `<button>` | Upload icon + "Sync Now" | `px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl shadow-lg shadow-amber-500/25` | Static (navigates to `/sync`) | Primary |

---

### 3. GREETING SECTION

**Container:** Direct children of `max-w-5xl` wrapper

| # | Element | Type | Content | Size | Data Source | Visual Weight |
|---|---------|------|---------|------|-------------|---------------|
| 3.1 | Current month | `<p>` | "{Month Year}" (e.g., "February 2026") | `text-slate-400 text-sm mb-1` | Computed (JS `Date`) | Subtle |
| 3.2 | Greeting heading | `<h1>` | Dynamic (see table below) | `text-2xl font-semibold text-slate-800 mb-5` | Computed from `data.firstName`, `growthStreak`, `netChange`, `isEmpty` | Primary |

**Greeting Text Logic:**

| Condition | Text |
|-----------|------|
| `isEmpty` | "Let's build your book, {firstName}." |
| `growthStreak >= 3` | "You're on fire, {firstName}." |
| `netChange > 0` | "Momentum building, {firstName}." |
| Default | "Welcome back, {firstName}." |

---

### 4. BEACON CARD (Main Left Card)

**Container:** `w-full lg:flex-[2] bg-white rounded-[2rem] p-8 shadow-2xl shadow-slate-200/60 border border-slate-100 relative overflow-hidden`

#### 4A. Background Glow (Decorative)

| # | Element | Type | Content | Size | Visual Weight |
|---|---------|------|---------|------|---------------|
| 4A.1 | Radial gradient glow | `<div>` absolute | Blue/indigo radial gradient | `top: -5%, left: -5%, width: 65%, height: 65%` | Decorative |
| — | — | — | Opacity: `0.08/0.04` (normal) or `0.04/0.02` (empty) | — | — |

#### 4B. Net Change Badge (Conditional: `!isEmpty && (newThisMonth > 0 || termedThisMonth > 0)`)

| # | Element | Type | Content | Size | Data Source | Visual Weight |
|---|---------|------|---------|------|-------------|---------------|
| 4B.1 | Net change pill | `<div>` | — | `px-4 py-2 rounded-full text-white shadow-lg` | — | Primary |
| — | Background | — | Green if net > 0, amber if net < 0, slate if net = 0 | `bg-emerald-500` / `bg-amber-500` / `bg-slate-500` | `data.netChange` | — |
| 4B.2 | Trend icon | `<TrendingUp>` | Rotated 180deg if negative | `w-4 h-4` | `data.netChange` | — |
| 4B.3 | Net change text | `<span>` | "net +{N} this month" or "net {N} this month" | `font-bold` | `data.netChange` | Primary |
| 4B.4 | Breakdown text | `<span>` | "(+{new} / -{termed})" or "(+{new})" | `text-sm opacity-75` | `data.newThisMonth`, `data.termedThisMonth` | Tertiary |

#### 4C. Growth Streak Badge (Conditional: `!isEmpty && growthStreak >= 2`)

| # | Element | Type | Content | Size | Data Source | Visual Weight |
|---|---------|------|---------|------|-------------|---------------|
| 4C.1 | Streak pill | `<div>` | — | `px-3 py-2 rounded-full bg-orange-50 border border-orange-100` | — | Secondary |
| 4C.2 | Flame icon | `<Flame>` | — | `w-4 h-4 text-orange-500` | — | — |
| 4C.3 | Streak text | `<span>` | "{N} mo streak" | `font-semibold text-orange-700` | `data.growthStreak` | Secondary |

#### 4D. THE NUMBER (Always visible)

| # | Element | Type | Content | Size | Data Source | Visual Weight |
|---|---------|------|---------|------|-------------|---------------|
| 4D.1 | Client count | `<span>` | `{totalClients}` | `text-[5rem] sm:text-[7rem] lg:text-[10rem] font-bold tracking-tighter leading-[0.75]` | `data.totalClients` | **DOMINANT** — largest element on screen |
| — | Color | — | `text-slate-900` (normal) or `text-slate-200` (empty) | — | `isEmpty` | — |
| — | Font feature | — | `fontFeatureSettings: '"tnum"'` (tabular numbers) | — | — | — |
| 4D.2 | Subtitle | `<p>` | "{N} client(s) in your book" | `text-xl text-slate-400 mt-3` | Computed (singular/plural) | Tertiary |
| 4D.3 | Stale warning | `<p>` | AlertCircle icon + "Data may be outdated • Sync to update" | `text-sm text-amber-600 mt-2` | Conditional: `isStale && !isEmpty` | Secondary |

#### 4E. EMPTY STATE CTA (Conditional: `isEmpty`)

Replaces carriers row + milestone section when `totalClients === 0`.

**Container:** `bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100/50`

| # | Element | Type | Content | Size | Data Source | Visual Weight |
|---|---------|------|---------|------|-------------|---------------|
| 4E.1 | Spreadsheet icon | `<FileSpreadsheet>` in gradient container | — | Icon container: `w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl`; Icon: `w-7 h-7 text-white` | Static | Secondary |
| 4E.2 | Title | `<h3>` | "Import your production reports" | `text-lg font-semibold text-slate-800 mb-1` | Static | Primary |
| 4E.3 | Description | `<p>` | "Upload carrier reports to see your complete book of business. We'll organize everything for you." | `text-slate-500 mb-4` | Static | Tertiary |
| 4E.4 | Start Sync button | `<button>` | Upload icon + "Start Sync" + ArrowRight icon | `px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25` | Static (navigates to `/sync`) | Primary |
| 4E.5 | "After syncing" label | `<p>` | "After syncing, you'll see" | `text-xs text-slate-500 uppercase tracking-wide mb-3` | Static | Subtle |
| 4E.6 | Feature previews | 4x `<div>` | Emoji + label: "Total clients", "By carrier", "Growth trends", "Milestones" | `text-sm text-slate-600` with emoji icons | Static | Tertiary |

#### 4F. CARRIERS ROW (Conditional: `!isEmpty && carriers.length > 0`)

**Container:** `flex items-center gap-3 mb-5 pb-5 border-b border-slate-100 flex-wrap` — dimmed to `opacity-75` when stale

| # | Element | Type | Content | Size | Data Source | Visual Weight |
|---|---------|------|---------|------|-------------|---------------|
| 4F.1 | Carrier chip (per carrier) | `<div>` | Color dot + carrier name + client count | `px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-100` | `data.carriers[]` (Supabase: `sync_carrier_uploads` joined with `carriers`) | Secondary |
| 4F.1a | — Color dot | `<div>` | — | `w-3 h-3 rounded-full` + dynamic color class | `getCarrierColor(carrier.code)` | — |
| 4F.1b | — Carrier name | `<span>` | e.g., "Humana", "Aetna" | `text-sm font-medium text-slate-600` | `carrier.name` | — |
| 4F.1c | — Client count | `<span>` | e.g., "142" | `text-lg font-bold text-slate-800` | `carrier.count` | Secondary |

**Carrier Color Map:**

| Code | Tailwind Class |
|------|---------------|
| humana | `bg-emerald-500` |
| aetna | `bg-purple-500` |
| anthem | `bg-blue-500` |
| wellcare | `bg-amber-500` |
| cigna | `bg-red-500` |
| uhc / unitedhealthcare | `bg-sky-500` |
| centene | `bg-orange-500` |
| (fallback) | `bg-slate-500` |

#### 4G. GOAL PROGRESS SECTION (Conditional: `!isEmpty`)

**Container:** `bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl p-5 border border-violet-100/50`

| # | Element | Type | Content | Size | Data Source | Visual Weight |
|---|---------|------|---------|------|-------------|---------------|
| 4G.1 | Target icon container | `<div>` | Target icon | `w-11 h-11 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg shadow-violet-500/25`; Icon: `w-5 h-5 text-white` | Static | Secondary |
| 4G.2 | "Next milestone" label | `<p>` | "Next milestone" | `text-sm text-slate-500` | Static | Subtle |
| 4G.3 | Milestone target | `<p>` | "{N} clients" | `text-2xl font-bold text-slate-800` | `data.nextMilestone` (from MILESTONES array) | Secondary |
| 4G.4 | To-go count | `<p>` | "{N}" | `text-4xl font-bold text-violet-600` | Computed: `nextMilestone - totalClients` | Primary |
| 4G.5 | To-go label | `<p>` | "to go" or "reached!" | `text-sm text-slate-500` | Computed | Subtle |
| 4G.6 | Progress bar track | `<div>` | — | `h-3 bg-white rounded-full shadow-inner` | — | — |
| 4G.7 | Progress bar fill | `<div>` | — | `h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-1000` | Computed: `((totalClients - lastMilestone) / (nextMilestone - lastMilestone)) * 100` | Secondary |

**MILESTONES Array:** `[10, 25, 50, 100, 150, 200, 250, 300, 400, 500, 750, 1000]`

---

### 5. ACTIONS PANEL (Right Panel)

**Container:** `w-full lg:flex-[1] bg-slate-900 rounded-[2rem] p-6 flex flex-col shadow-2xl shadow-slate-400/20`

| # | Element | Type | Content | Size | Data Source | Visual Weight |
|---|---------|------|---------|------|-------------|---------------|
| 5.0 | Section label | `<p>` | "Quick Actions" | `text-xs font-semibold text-slate-500 uppercase tracking-wider mb-5` | Static | Subtle |

**Action Buttons — In Order of Appearance:**

Each standard `ActionButton` has: gradient icon container (`w-11 h-11 rounded-xl`), label (`text-sm font-semibold text-white`), description (`text-xs text-slate-500`), chevron right (`w-5 h-5`). Full row is `p-4 rounded-xl` with hover state.

| # | Icon | Label | Description | Gradient | Destination | Condition | Highlighted? |
|---|------|-------|-------------|----------|-------------|-----------|-------------|
| 5.1 | RefreshCw | "Sync Book" (empty) or "Sync Now" (stale) | "Import your data" (empty) or "Update your data" (stale) | `from-amber-500 to-orange-500` | `/sync` | `isStale \|\| isEmpty` | Yes — amber glow background |
| 5.2 | Building2 | "Carrier Resources" | "Contacts & portals" | `from-blue-500 to-blue-600` | `/carrier-resources` (click); flyout on hover | Always | No |
| 5.3 | Search | "Plan Finder" | "Search Medicare plans" | `from-emerald-500 to-teal-600` | `/plan-finder` | Always | No |
| 5.4 | FileText | "Forms Library" | "SOA & enrollment" | `from-slate-500 to-slate-600` | `/forms-library` | Always | No |
| 5.5 | Zap | "Quick Quote" | "SunFire & C4M" | `from-orange-500 to-orange-600` | Hover flyout (see below) | `!isStale && !isEmpty` | No |
| 5.6 | Award | "Certifications" | "Ready to sell" | `from-emerald-500 to-emerald-600` | `/contracting-hub` | Always | No |
| 5.7 | GraduationCap | "Training Library" | "Videos & tutorials" | `from-purple-500 to-violet-600` | `/training` | Always | No |

**5.2 Carrier Resources Flyout (HoverCard, side="left"):**

| # | Element | Content | Behavior |
|---|---------|---------|----------|
| 5.2a | Header | "Portal Quick Links" | Static label |
| 5.2b | Aetna link | Dot (#7B2D8E) + "Aetna" + ExternalLink icon | Opens `aetna.com/producer_public/login.fcc` in new tab |
| 5.2c | Anthem link | Dot (#0072CE) + "Anthem" + ExternalLink icon | Opens `brokerportal.anthem.com/.../login` in new tab |
| 5.2d | Devoted link | Dot (#F97316) + "Devoted" + ExternalLink icon | Opens `agent.devoted.com` in new tab |
| 5.2e | Humana link | Dot (#4B9B4B) + "Humana" + ExternalLink icon | Opens `account.humana.com` in new tab |
| 5.2f | UHC link | Dot (#002677) + "UHC" + ExternalLink icon | Opens `uhcagent.com` in new tab |
| 5.2g | Wellcare link | Dot (#00A79D) + "Wellcare" + ExternalLink icon | Opens `wellcare.com/.../broker-resources` in new tab |
| 5.2h | Footer link | "View all resources" + ChevronRight | Navigates to `/carrier-resources` |

**5.5 Quick Quote Flyout (HoverCard, side="left"):**

| # | Element | Content | Behavior |
|---|---------|---------|----------|
| 5.5a | SunFire link | "SunFire" + ExternalLink icon | Opens `sunfirematrix.com/.../pfs` in new tab |
| 5.5b | Connecture link | "Connecture (C4M)" + ExternalLink icon | Opens `pinnacle7.destinationrx.com/.../Login` in new tab |

---

## PART 2: INFORMATION HIERARCHY ANALYSIS

### CRITICAL — Agent needs every session

| Element | Why |
|---------|-----|
| 4D.1 — Total client count (THE NUMBER) | Core KPI. The entire dashboard is built around this number. |
| 4F — Carrier chips with counts | Agents need to see their book breakdown by carrier for daily work. |
| 4B — Net change badge | Shows if book is growing or shrinking — drives daily urgency. |
| 1.5 — Sync Status Pill | Tells agent if their data is current and actionable. |
| 5.2 — Carrier Resources (portal links) | Agents access carrier portals multiple times daily. |
| 5.3 — Plan Finder | Used for every client interaction during AEP and daily quoting. |
| 5.5 — Quick Quote (SunFire / C4M) | Used during live client calls for quoting. |

### USEFUL — Frequent but not every session

| Element | Why |
|---------|-----|
| 2 — Stale State Banner | Important when data is outdated but only appears conditionally. |
| 4G — Goal Progress / Milestone | Motivational, agents check progress periodically. |
| 5.4 — Forms Library | Needed when processing enrollment, not every visit. |
| 5.6 — Certifications | Checked when onboarding or during annual cert renewal. |
| 5.7 — Training Library | Used during onboarding and continuing education. |
| 5.1 — Sync button (conditional) | Only needed monthly around the 7th. |
| 4C — Growth streak badge | Motivational feedback, reinforces positive behavior. |
| 1.6 — User Avatar / Profile menu | Accessed occasionally for profile, settings, admin. |

### NICE-TO-HAVE — Context without function

| Element | Why |
|---------|-----|
| 3.2 — Personalized greeting | Adds warmth but no functional value. |
| 3.1 — Current month | Date orientation. |
| 4D.2 — "clients in your book" subtitle | Labeling for THE NUMBER — redundant once familiar. |
| 4G.4/5 — "N to go" count | Nice motivation, but not actionable. |
| 4E.6 — "After syncing, you'll see" previews | Onboarding only — seen once. |

### DECORATIVE — Visual only

| Element | Why |
|---------|-----|
| 4A — Background glow gradient | Purely aesthetic. |
| 1.1/1.2 — "T" logo mark | Brand decoration. |
| 1.3 — "TIG PLATFORM" label | Branding. |
| Shadow classes throughout | Visual polish. |

---

## PART 3: INTERACTION MAP

### Direct Navigation (Click → Route Change)

| # | Trigger Element | Event | Destination | Type |
|---|-----------------|-------|-------------|------|
| I1 | Stale Banner "Sync Now" button | Click | `/sync` | `navigate()` |
| I2 | Empty State "Start Sync" button | Click | `/sync` | `navigate()` |
| I3 | Actions: Sync Book / Sync Now | Click | `/sync` | `<Link>` |
| I4 | Actions: Carrier Resources | Click | `/carrier-resources` | `navigate()` |
| I5 | Actions: Plan Finder | Click | `/plan-finder` | `<Link>` |
| I6 | Actions: Forms Library | Click | `/forms-library` | `<Link>` |
| I7 | Actions: Certifications | Click | `/contracting-hub` | `<Link>` |
| I8 | Actions: Training Library | Click | `/training` | `<Link>` |
| I9 | Sync Pill dropdown → Sync link | Click | `/sync` | `<Link>` |
| I10 | Avatar → My Profile | Click | `/my-profile` | `navigate()` |
| I11 | Avatar → Certifications | Click | `/contracting-hub` | `navigate()` |
| I12 | Avatar → Admin Dashboard | Click | `/admin` | `navigate()` |
| I13 | Avatar → Activity Log | Click | `/admin/activity-log` | `navigate()` |
| I14 | Avatar → Labs | Click | `/admin/labs` | `navigate()` |
| I15 | Carrier flyout → "View all resources" | Click | `/carrier-resources` | `<Link>` |

### External Links (Click → New Tab)

| # | Trigger Element | Event | Destination URL |
|---|-----------------|-------|-----------------|
| E1 | Carrier flyout → Aetna | Click | `https://www.aetna.com/producer_public/login.fcc` |
| E2 | Carrier flyout → Anthem | Click | `https://brokerportal.anthem.com/apps/ptb/login` |
| E3 | Carrier flyout → Devoted | Click | `https://agent.devoted.com/` |
| E4 | Carrier flyout → Humana | Click | `https://account.humana.com/` |
| E5 | Carrier flyout → UHC | Click | `https://www.uhcagent.com` |
| E6 | Carrier flyout → Wellcare | Click | `https://www.wellcare.com/en/broker-resources/broker-resources` |
| E7 | Quick Quote → SunFire | Click | `https://www.sunfirematrix.com/app/agent/pfs` |
| E8 | Quick Quote → Connecture | Click | `https://pinnacle7.destinationrx.com/PC/Agent/Account/Login` |
| E9 | Avatar → BOSS CRM | Click | `https://fmo.kizen.com/login` |

### Hover Interactions (Flyouts)

| # | Trigger Element | Event | Result | Close Behavior |
|---|-----------------|-------|--------|----------------|
| H1 | Carrier Resources button | Hover (0ms delay) | HoverCard flyout appears to the LEFT with 6 carrier portal links + footer link | Closes on mouse leave (150ms delay) |
| H2 | Quick Quote button | Hover (0ms delay) | HoverCard flyout appears to the LEFT with 2 quoting tool links | Closes on mouse leave (150ms delay) |
| H3 | All ActionButtons | Hover | Background lightens (`bg-white/[0.03]` → `bg-white/[0.08]`), border brightens, chevron shifts right 0.5 unit | CSS transition only |

### Toggle/Expand Interactions

| # | Trigger Element | Event | Result |
|---|-----------------|-------|--------|
| T1 | Sync Status Pill | Click | Dropdown toggles open/closed (state: `isOpen`). Closes on outside click. |
| T2 | User Avatar | Click | Radix DropdownMenu opens. Closes on outside click or item select. |
| T3 | Avatar → Dark Mode switch | Toggle | Calls `toggleDarkMode()` from `useDarkMode` hook |
| T4 | Avatar → View Mode toggle | Click | Switches between 'agent' and 'admin' view modes |
| T5 | Avatar → Connect Outlook | Click | Invokes Supabase Edge Function, redirects to Microsoft OAuth |
| T6 | Avatar → Create Admin | Click | Opens `CreateAdminDialog` modal |
| T7 | Avatar → Sign Out | Click | Signs out, clears localStorage, redirects to `/auth` |

---

## PART 4: SPATIAL ANALYSIS

### Layout Architecture at 1440px

```
┌─────────────────────────────────── 1440px viewport ──────────────────────────────────┐
│  p-6 (24px padding all sides)                                                        │
│  ┌──────────────────────────── max-w-5xl (1024px) centered ────────────────────────┐  │
│  │                                                                                 │  │
│  │  HEADER  [T logo + "TIG PLATFORM / Agent Portal"]  ···gap···  [Pill] [Avatar]   │  │
│  │  h ≈ 40px                                                            mb-5       │  │
│  │                                                                                 │  │
│  │  ┌─ STALE BANNER (conditional) ──────────────────────────────────────────────┐   │  │
│  │  │  [📅 icon]  "Time to sync your Feb reports"        [🔄 Sync Now button]  │   │  │
│  │  │             "Last synced Jan 5 • Recommended..."                          │   │  │
│  │  │  h ≈ 72px                                                         mb-5   │   │  │
│  │  └───────────────────────────────────────────────────────────────────────────┘   │  │
│  │                                                                                 │  │
│  │  February 2026                                                    (text-sm)     │  │
│  │  Welcome back, Austin.                                            (text-2xl)    │  │
│  │  h ≈ 52px                                                         mb-5          │  │
│  │                                                                                 │  │
│  │  ┌── flex-row gap-5 ──────────────────────────────────────────────────────────┐  │  │
│  │  │                                                                            │  │  │
│  │  │  ┌── BEACON (flex-[2]) ──────────────┐  ┌── ACTIONS (flex-[1]) ─────────┐  │  │  │
│  │  │  │  rounded-[2rem] p-8 bg-white      │  │  rounded-[2rem] p-6 bg-900    │  │  │  │
│  │  │  │                                   │  │                               │  │  │  │
│  │  │  │  [net +5 this month] [🔥 3 mo]    │  │  QUICK ACTIONS (label)        │  │  │  │
│  │  │  │                                   │  │                               │  │  │  │
│  │  │  │       ███                         │  │  ┌─ Sync Now ──── ▸ ─────┐   │  │  │  │
│  │  │  │      █   █                        │  │  │  (highlighted amber)   │   │  │  │  │
│  │  │  │          █                        │  │  └────────────────────────┘   │  │  │  │
│  │  │  │        ██                         │  │  ┌─ Carrier Resources ─ ▸ ─┐  │  │  │  │
│  │  │  │       █                           │  │  └────────────────────────┘   │  │  │  │
│  │  │  │      █████  (text-[10rem])        │  │  ┌─ Plan Finder ──── ▸ ─┐    │  │  │  │
│  │  │  │                                   │  │  └────────────────────────┘   │  │  │  │
│  │  │  │  clients in your book             │  │  ┌─ Forms Library ─── ▸ ─┐   │  │  │  │
│  │  │  │                                   │  │  └────────────────────────┘   │  │  │  │
│  │  │  │  ┌─ Carrier Chips ──────────┐     │  │  ┌─ Quick Quote ──── ▸ ─┐    │  │  │  │
│  │  │  │  │ 🟢 Humana 142 │ 🟣 Aetna│     │  │  └────────────────────────┘   │  │  │  │
│  │  │  │  │  87  │ 🔵 Anthem 63 │   │     │  │  ┌─ Certifications ── ▸ ─┐   │  │  │  │
│  │  │  │  └──────────────────────────┘     │  │  └────────────────────────┘   │  │  │  │
│  │  │  │  ──────────── border ─────────    │  │  ┌─ Training Library ─ ▸ ─┐  │  │  │  │
│  │  │  │  ┌─ Goal Progress ──────────┐     │  │  └────────────────────────┘   │  │  │  │
│  │  │  │  │ 🎯 Next milestone    8   │     │  │                               │  │  │  │
│  │  │  │  │    300 clients    to go   │     │  │                               │  │  │  │
│  │  │  │  │ [██████████████░░░░░░░░]  │     │  │                               │  │  │  │
│  │  │  │  └──────────────────────────┘     │  │                               │  │  │  │
│  │  │  │                                   │  │                               │  │  │  │
│  │  │  └───────────────────────────────┘  └───────────────────────────────┘  │  │  │
│  │  │    ≈ 673px wide                        ≈ 331px wide                    │  │  │
│  │  └────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                              │  │
│  └──────────────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

### Approximate Pixel Dimensions (1440px Viewport)

| Section | Width | Height (approx) | Notes |
|---------|-------|------------------|-------|
| **Viewport** | 1440px | Variable | — |
| **Page padding** | 24px each side | — | `p-6` |
| **Content area** (`max-w-5xl`) | 1024px | — | Centered, 208px margin each side |
| **Header row** | 1024px | ~40px | Flex between logo and controls |
| **Stale Banner** | 1024px | ~72px | Conditional, `rounded-2xl p-4` |
| **Greeting section** | 1024px | ~52px | Date line + h1 |
| **Beacon Card** | ~673px | ~480-580px | `flex-[2]` of 1024px minus 20px gap. Height varies by carrier count |
| — THE NUMBER area | ~609px (673 - 64 padding) | ~160px | `text-[10rem]` at `leading-[0.75]` = ~120px tall glyphs + subtitle |
| — Badges row | ~609px | ~40px | Conditional |
| — Carrier chips | ~609px | ~50px per row | Wraps based on carrier count |
| — Goal progress | ~609px | ~100px | `p-5` with progress bar |
| **Actions Panel** | ~331px | ~480-580px | `flex-[1]` of 1024px minus 20px gap. Matches Beacon height via `flex-col` |
| — Each action row | ~283px (331 - 48 padding) | ~59px | `p-4` + icon (44px) + text |
| **Total page height** | — | ~680-780px | Varies by state |

### Content Density Analysis

| Section | Usable Area | Content Area | Density | Notes |
|---------|-------------|--------------|---------|-------|
| **Beacon Card** | ~609 x ~500px = ~304,500 sq px | THE NUMBER ≈ 55%, carriers ≈ 12%, goal ≈ 18%, badges ≈ 5% | ~90% | Efficient — THE NUMBER dominates intentionally |
| **Actions Panel** | ~283 x ~460px = ~130,180 sq px | 7 buttons x ~59px = ~413px content | ~90% | Dense — vertical stack fills well |
| **Header** | ~1024 x 40px = ~40,960 sq px | Logo ~160px + Pill ~120px + Avatar ~36px = ~316px | ~31% | Mostly empty — space between is intentional |
| **Greeting** | ~1024 x 52px = ~53,248 sq px | Date + heading ≈ 300px wide | ~29% | Left-aligned, right side is breathing room |
| **Stale Banner** | ~1024 x 72px = ~73,728 sq px | Icon + text + button ≈ 850px | ~82% | Efficient — horizontal layout fills well |

### Dead Space Identification

| Location | Size (approx) | Nature |
|----------|---------------|--------|
| Side margins (viewport - max-w-5xl) | 208px x full height x 2 sides | Intentional whitespace for readability |
| Header gap between logo and controls | ~700px | Intentional — flex justify-between |
| Below Actions panel (when fewer items) | Variable, up to ~100px | Empty dark space when Sync and Quick Quote are hidden |
| Right of greeting text | ~700px | Unused — potential for additional info |
| Right of carrier chips (if few carriers) | Variable | Flexwrap means unused space until next row |

### Visual Flow (Eye Tracking Path)

```
1. THE NUMBER (4D.1)    ──► Massive font size dominates immediately
       │
       ▼
2. Net Change Badge      ──► Color contrast (green/amber) on white draws attention
       │
       ▼
3. Greeting (h1)         ──► Top-left, natural reading position
       │
       ▼
4. Actions Panel         ──► Dark bg-slate-900 creates strong contrast with white Beacon
       │
       ▼
5. Carrier Chips         ──► Small colored dots + numbers in the middle zone
       │
       ▼
6. Goal Progress         ──► Purple gradient draws eye last in the card
       │
       ▼
7. Header / Sync Pill    ──► Small, subtle — noticed last
```

---

## PART 5: COMPONENT DEPENDENCIES

### React / Router

| Import | Source | Usage |
|--------|-------|-------|
| `React` | `react` | JSX runtime |
| `Link` | `react-router-dom` | ActionButton navigation |
| `useNavigate` | `react-router-dom` | Programmatic navigation (sync, carrier resources) |

### Lucide Icons (21 imported, not all always rendered)

| Icon | Used In | Condition |
|------|---------|-----------|
| `Building2` | CarrierResourcesHoverButton | Always |
| `FileText` | Forms Library action | Always |
| `Award` | Certifications action | Always |
| `TrendingUp` | Net change badge | `!isEmpty && (newThisMonth > 0 \|\| termedThisMonth > 0)` |
| `Zap` | Quick Quote action | `!isStale && !isEmpty` |
| `Target` | Goal progress section | `!isEmpty` |
| `Flame` | Growth streak badge | `!isEmpty && growthStreak >= 2` |
| `ChevronRight` | All ActionButtons, flyout footer | Always |
| `Loader2` | (imported but NOT used in Index.tsx) | — |
| `Upload` | Stale banner button, Empty state button | `isStale \|\| isEmpty` |
| `FileSpreadsheet` | Empty state CTA | `isEmpty` |
| `ArrowRight` | Empty state "Start Sync" button | `isEmpty` |
| `Calendar` | Stale state banner | `isStale && !isEmpty` |
| `RefreshCw` | Conditional Sync action | `isStale \|\| isEmpty` |
| `AlertCircle` | Stale data warning under THE NUMBER | `isStale && !isEmpty` |
| `Search` | Plan Finder action | Always |
| `GraduationCap` | Training Library action | Always |
| `ExternalLink` | HoverCard flyout links | On hover |

### Custom Components

| Component | Source | Purpose |
|-----------|--------|---------|
| `SyncStatusPill` | `@/components/dashboard/SyncStatusPill` | Header sync status indicator + dropdown |
| `UserAvatarDropdown` | `@/components/UserAvatarDropdown` | Header user menu with role-based items |
| `PageLoader` | `@/components/ui/PageLoader` | Full-screen loading state with shimmer animation |
| `HoverCard` | `@/components/ui/hover-card` (Radix) | Flyout container for Carrier Resources & Quick Quote |
| `HoverCardTrigger` | `@/components/ui/hover-card` (Radix) | Hover trigger wrapper |
| `HoverCardContent` | `@/components/ui/hover-card` (Radix) | Flyout content panel |

### Sub-Components (Defined in Index.tsx)

| Component | Props | Purpose |
|-----------|-------|---------|
| `EmptyStateCTA` | `{ onStartSync: () => void }` | Empty state call-to-action card |
| `ActionButton` | `{ icon, label, desc, color, to, highlighted? }` | Standard navigation button in Actions panel |
| `HoverActionButton` | `{ icon, label, desc, color, links[] }` | Button with hover flyout for external links |
| `CarrierResourcesHoverButton` | (none) | Specialized hover button with carrier portal links |

### Data Hooks

| Hook | Source | Data Provided |
|------|--------|---------------|
| `useDashboardData` | `@/hooks/useDashboardData` | Returns `{ data: DashboardData, isLoading, error }` |
| └─ `useProfile` | `@/hooks/useProfile` | Provides `profile.id` and `profile.full_name` to enable the query |
| └─ `useQuery` | `@tanstack/react-query` | Caching layer — 5-min stale time, no refetch on tab switch |

### Supabase Queries (inside `useDashboardData`)

| Query | Table(s) | Purpose |
|-------|----------|---------|
| Query 1 | `monthly_syncs` (WHERE `profile_id = ?` AND `status = 'complete'`, ORDER BY `month` ASC) | Fetches all completed syncs for history, metrics, streaks |
| Query 2 | `monthly_syncs` → `sync_carrier_uploads` → `carriers` (latest 1, JOIN) | Fetches carrier breakdown from most recent sync |

### Static Data

| Constant | Source | Content |
|----------|--------|---------|
| `CARRIER_COLORS` | `useDashboardData.ts` | Map of carrier codes → Tailwind bg classes |
| `CARRIER_PORTALS` | `Index.tsx` (line 443-450) | 6 carrier portal URLs with brand hex colors |
| `MILESTONES` | `@/components/dashboard/NextGoalCard` | `[10, 25, 50, 100, 150, 200, 250, 300, 400, 500, 750, 1000]` |

### Context Providers Consumed (via UserAvatarDropdown)

| Provider/Hook | Source | Data |
|---------------|--------|------|
| `useAuth` | `@/hooks/useAuth` | `profile`, `primaryRole`, `canAccessAdmin()`, `isSuperAdmin()`, `isAdmin()` |
| `useDarkMode` | `@/hooks/useDarkMode` | `isDark`, `toggle` |
| `useNavigationContext` | `@/hooks/useNavigationContext` | `isDualRole`, `viewMode`, `switchMode` |

### Utility Functions

| Function | Source | Purpose |
|----------|--------|---------|
| `getNextSyncDate()` | `@/lib/sync` | Computes next recommended sync date (7th of current/next month) |
| `determineSyncStatus()` | `useDashboardData.ts` | Determines 'synced'/'stale'/'never' from last sync date |
| `getCarrierColor()` | `useDashboardData.ts` | Maps carrier code to Tailwind bg color class |

---

## PART 6: CURRENT RESPONSIVE BEHAVIOR

### Tailwind Breakpoints (Default — No Custom Overrides)

| Breakpoint | Min-Width | Prefix |
|------------|-----------|--------|
| (base) | 0px | — |
| sm | 640px | `sm:` |
| md | 768px | `md:` |
| lg | 1024px | `lg:` |
| xl | 1280px | `xl:` |
| 2xl | 1536px | `2xl:` |

### Responsive Classes Used in Index.tsx

| Element | Base | sm (640px+) | lg (1024px+) |
|---------|------|-------------|--------------|
| THE NUMBER font size | `text-[5rem]` (80px) | `text-[7rem]` (112px) | `text-[10rem]` (160px) |
| Main layout direction | `flex-col` | — | `flex-row` |
| Beacon card width | `w-full` | — | `flex-[2]` |
| Actions panel width | `w-full` | — | `flex-[1]` |

Only **3 responsive modifiers** are used across the entire page.

---

### Behavior at Each Breakpoint

#### 1920px (Large Desktop)

```
┌──────────────────────────────── 1920px ─────────────────────────────────┐
│                    448px margin │ 1024px content │ 448px margin          │
│                                                                         │
│  Layout: Side-by-side (lg: active)                                      │
│  THE NUMBER: 10rem (160px) — very large, properly dramatic              │
│  Beacon: ~673px wide │ Actions: ~331px wide                             │
│  Flyouts: Plenty of room to open left of Actions panel                  │
│  Dead space: Very large side margins (448px each)                       │
│  Content density: Low — 53% of viewport is empty margin                 │
│                                                                         │
│  ISSUES: Content feels small relative to viewport. max-w-5xl            │
│  constrains to 1024px leaving nearly half the screen empty.             │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 1440px (Large Laptop)

```
┌─────────────────────────── 1440px ──────────────────────────────┐
│               208px margin │ 1024px content │ 208px margin       │
│                                                                  │
│  Layout: Side-by-side (lg: active)                               │
│  THE NUMBER: 10rem (160px) — dramatic, fills Beacon well         │
│  Beacon: ~673px wide │ Actions: ~331px wide                      │
│  Flyouts: Adequate room left of Actions panel                    │
│  Dead space: Moderate side margins (208px each)                  │
│  Content density: Moderate — 71% of viewport is content area     │
│                                                                  │
│  IDEAL VIEWPORT for current design. Layout proportions work.     │
└──────────────────────────────────────────────────────────────────┘
```

#### 1366px (Standard Laptop — Most Common for Agents)

```
┌────────────────────────── 1366px ─────────────────────────────┐
│             171px margin │ 1024px content │ 171px margin       │
│                                                                │
│  Layout: Side-by-side (lg: active)                             │
│  THE NUMBER: 10rem (160px) — still fits but tighter            │
│  Beacon: ~673px wide │ Actions: ~331px wide                    │
│  Flyouts: ~171px available left of Actions panel edge          │
│                                                                │
│  POTENTIAL ISSUE: HoverCard flyouts (min-w-[220px] for         │
│  Carrier Resources) may overflow the left viewport edge.       │
│  The flyout opens side="left" with sideOffset=12, so it        │
│  needs ~232px of space. Only ~171px available, so              │
│  collisionPadding=16 will force repositioning.                 │
│                                                                │
│  Content density: Good — 75% of viewport is content area       │
└────────────────────────────────────────────────────────────────┘
```

#### 1024px (Breakpoint — lg Exactly)

```
┌──────────────── 1024px ─────────────────┐
│  24px │ 976px usable │ 24px              │
│  (max-w-5xl = 1024, so no side margin)   │
│                                          │
│  Layout: Side-by-side (lg: just active)  │
│  THE NUMBER: 10rem (160px)               │
│  Beacon: ~645px │ Actions: ~311px        │
│                                          │
│  ISSUE: Flyouts have ZERO room to the    │
│  left of the panel. They will reposition │
│  via Radix collision detection, likely    │
│  appearing below or above instead.       │
│                                          │
│  ISSUE: Actions panel at ~311px minus    │
│  p-6 (48px) = 263px usable. Button text  │
│  starts to feel cramped.                 │
│                                          │
│  Content density: Very high — edge-to-   │
│  edge content with minimal breathing     │
│  room                                    │
└──────────────────────────────────────────┘
```

#### 1023px (Just Below lg — Columns Stack)

```
┌──────────────── 1023px ─────────────────┐
│  24px │ 975px usable │ 24px              │
│                                          │
│  Layout: STACKED (flex-col)              │
│  THE NUMBER: sm:text-[7rem] (112px)      │
│  Beacon: FULL WIDTH (~975px)             │
│  Actions: FULL WIDTH (~975px) below      │
│                                          │
│  ISSUE: At this width the number jumps   │
│  from 10rem to 7rem — a jarring 48px     │
│  reduction. md: breakpoint is skipped.   │
│                                          │
│  Beacon card is now very wide for its    │
│  content — carrier chips and goal        │
│  progress have excessive horizontal      │
│  space. Looks stretched.                 │
│                                          │
│  Actions panel becomes a wide horizontal │
│  strip — each button is ~927px wide      │
│  (much wider than needed), creating      │
│  dead space in each row.                 │
│                                          │
│  Page height increases dramatically:     │
│  Beacon (~500px) + Actions (~500px) =    │
│  ~1000px of cards + header/greeting      │
│  requires scrolling.                     │
└──────────────────────────────────────────┘
```

#### 768px (Tablet)

```
┌─────────── 768px ────────────┐
│  24px │ 720px usable │ 24px   │
│                               │
│  Layout: STACKED              │
│  THE NUMBER: sm:text-[7rem]   │
│  (sm breakpoint still active) │
│                               │
│  Beacon: 720px wide           │
│  Actions: 720px wide below    │
│                               │
│  Carrier chips may wrap to    │
│  2 rows depending on carrier  │
│  count and name lengths.      │
│                               │
│  Action buttons still have    │
│  excessive width.             │
│                               │
│  Stale banner wraps: icon +   │
│  text on first line, "Sync    │
│  Now" button wraps to second  │
│  line (flex-wrap on parent).  │
│                               │
│  Overall vertical scroll:     │
│  ~1100-1200px of content.     │
└───────────────────────────────┘
```

#### Below 640px (Mobile — Below sm Breakpoint)

```
┌──── <640px ─────┐
│  24px │ var │ 24px│
│                   │
│  THE NUMBER:      │
│  text-[5rem]      │
│  (80px) — base    │
│                   │
│  Stacked layout   │
│  All full-width   │
│                   │
│  Beacon card p-8  │
│  uses 64px of     │
│  horizontal space │
│  on a 375px phone │
│  = only 287px for │
│  content.         │
│                   │
│  Significant      │
│  vertical scroll  │
│  required.        │
└───────────────────┘
```

---

### Summary of Responsive Issues

| Issue | Severity | Breakpoint |
|-------|----------|------------|
| Flyout overflow on standard laptops (1366px) | Medium | 1024-1366px |
| Jarring font size jump (10rem → 7rem) at 1024px | Medium | 1024px |
| No `md:` breakpoint used — nothing adapts between 640px and 1024px | Medium | 640-1024px |
| Stacked layout creates excessive button widths | Low | <1024px |
| Large side margins waste space on 1920px+ displays | Low | 1920px+ |
| `max-w-5xl` (1024px) is quite narrow for modern displays | Low | >1280px |
| Beacon card `p-8` (32px each side) eats significant space on mobile | Low | <640px |
| `rounded-[2rem]` (32px) is very large border-radius on small screens | Low | <640px |

---

### ASCII Layout Comparison: 1440px vs 1024px (Stacked)

**1440px — Side by Side:**
```
┌───────────────────────────── 1024px content ─────────────────────────────┐
│ [Logo]  TIG PLATFORM / Agent Portal          [Synced Jan 5 ▾]  [AT]    │
│                                                                         │
│ February 2026                                                           │
│ Welcome back, Austin.                                                   │
│                                                                         │
│ ┌──────────────── 66% ──────────────┐ ┌──────── 33% ────────┐          │
│ │  BEACON CARD                      │ │  ACTIONS PANEL       │          │
│ │                                   │ │  ┌────────────────┐  │          │
│ │  [net +5 this month] [🔥 3 mo]    │ │  │ Sync Now       │  │          │
│ │                                   │ │  ├────────────────┤  │          │
│ │    292                            │ │  │ Carrier Res.   │  │          │
│ │    clients in your book           │ │  ├────────────────┤  │          │
│ │                                   │ │  │ Plan Finder    │  │          │
│ │  [🟢 Humana 142] [🟣 Aetna 87]   │ │  ├────────────────┤  │          │
│ │  [🔵 Anthem 63]                   │ │  │ Forms Library  │  │          │
│ │  ─────────────────────            │ │  ├────────────────┤  │          │
│ │  ┌─ 🎯 Next milestone ─────┐     │ │  │ Quick Quote    │  │          │
│ │  │   300 clients      8    │     │ │  ├────────────────┤  │          │
│ │  │             to go       │     │ │  │ Certifications │  │          │
│ │  │ [████████████████░░░░]  │     │ │  ├────────────────┤  │          │
│ │  └─────────────────────────┘     │ │  │ Training       │  │          │
│ │                                   │ │  └────────────────┘  │          │
│ └───────────────────────────────────┘ └──────────────────────┘          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Below 1024px — Stacked:**
```
┌──────────────────────── full width ────────────────────────────┐
│ [Logo]  TIG PLATFORM / Agent Portal   [Synced Jan 5 ▾]  [AT] │
│                                                                │
│ February 2026                                                  │
│ Welcome back, Austin.                                          │
│                                                                │
│ ┌────────────────────── 100% ────────────────────────────────┐ │
│ │  BEACON CARD                                               │ │
│ │                                                            │ │
│ │  [net +5 this month] [🔥 3 mo]                             │ │
│ │                                                            │ │
│ │    292                                                     │ │
│ │    clients in your book                                    │ │
│ │                                                            │ │
│ │  [🟢 Humana 142] [🟣 Aetna 87] [🔵 Anthem 63]             │ │
│ │  ───────────────────────────────────                        │ │
│ │  ┌─ 🎯 Next milestone ──────────────────────────────┐      │ │
│ │  │   300 clients                              8     │      │ │
│ │  │                                       to go      │      │ │
│ │  │ [██████████████████████████████░░░░░░░░░░░░░░░]   │      │ │
│ │  └──────────────────────────────────────────────────┘      │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                │
│ ┌────────────────────── 100% ────────────────────────────────┐ │
│ │  ACTIONS PANEL                                             │ │
│ │  ┌─────────────────────────────────────────────────────┐   │ │
│ │  │ 🔄  Sync Now            Update your data         ▸ │   │ │
│ │  ├─────────────────────────────────────────────────────┤   │ │
│ │  │ 🏢  Carrier Resources   Contacts & portals       ▸ │   │ │
│ │  ├─────────────────────────────────────────────────────┤   │ │
│ │  │ 🔍  Plan Finder         Search Medicare plans     ▸ │   │ │
│ │  ├─────────────────────────────────────────────────────┤   │ │
│ │  │ 📄  Forms Library       SOA & enrollment          ▸ │   │ │
│ │  ├─────────────────────────────────────────────────────┤   │ │
│ │  │ ⚡  Quick Quote          SunFire & C4M            ▸ │   │ │
│ │  ├─────────────────────────────────────────────────────┤   │ │
│ │  │ 🏆  Certifications      Ready to sell             ▸ │   │ │
│ │  ├─────────────────────────────────────────────────────┤   │ │
│ │  │ 🎓  Training Library    Videos & tutorials        ▸ │   │ │
│ │  └─────────────────────────────────────────────────────┘   │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                │
│  (requires scrolling — total height ~1100px)                   │
└────────────────────────────────────────────────────────────────┘
```

---

## APPENDIX: UNUSED DASHBOARD COMPONENTS

The following files exist in `src/components/dashboard/` but are **NOT imported by Index.tsx**:

| File | Purpose | Status |
|------|---------|--------|
| `AgentDashboard.tsx` | Unknown — possibly an older dashboard version | Unused |
| `DashboardHeader.tsx` | Extracted header component | Unused (header is inline in Index.tsx) |
| `DashboardGreeting.tsx` | Extracted greeting component | Unused (greeting is inline) |
| `Sparkline.tsx` | Mini chart for monthly history | Unused (data exists in hook: `monthlyHistory`) |
| `NextGoalCard.tsx` | Standalone milestone card | Unused (only MILESTONES constant is imported by hook) |
| `MilestoneJourneyCard.tsx` | Milestone journey visualization | Unused |
| `QuickActions.tsx` | Extracted quick actions panel | Unused (actions are inline) |
| `GrowthStreakCard.tsx` | Standalone growth streak card | Unused |
| `HeroCard.tsx` | Unknown — possibly an earlier Beacon design | Unused |

These represent extracted or previous-generation components that the current monolithic `Index.tsx` does not use. The `useDashboardData` hook computes data for several of these (e.g., `monthlyHistory`, `projectedDate`, `avgNewPerMonth`, `bestMonth`) that is **never displayed** in the current dashboard.

### Computed But Unused Data Fields

| Field | Computed In | Purpose | Displayed? |
|-------|-------------|---------|------------|
| `monthlyHistory` | `useDashboardData` | Array of last 6 monthly client totals for sparkline | **No** — Sparkline component exists but is not imported |
| `projectedDate` | `useDashboardData` | Estimated date to reach next milestone | **No** |
| `avgNewPerMonth` | `useDashboardData` | Average new clients per growth month | **No** |
| `bestMonth` | `useDashboardData` | Best growth month (name + count) | **No** |
| `milestonesHit` | `useDashboardData` | Array of milestones already achieved | **No** — only used internally to compute `lastMilestone` |
| `fullName` | `useDashboardData` | Full name string | **No** — only `firstName` and `initials` are used |
| `profileId` | `useDashboardData` | Supabase profile UUID | **No** — not displayed |

---

*End of document. This inventory reflects the codebase as of February 5, 2026.*
