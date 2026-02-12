# Dashboard Audit
> Consolidated from DASHBOARD_ANALYSIS.md, DASHBOARD_CONTENT_INVENTORY.md, DASHBOARD_RESPONSIVE_AUDIT.md — February 2026

---

## Table of Contents

1. [Current State](#1-current-state)
2. [Content Inventory](#2-content-inventory)
3. [UX Issues & Findings](#3-ux-issues--findings)
4. [Responsive Issues](#4-responsive-issues)
5. [Redesign Proposals](#5-redesign-proposals)
6. [Open Action Items](#6-open-action-items)

---

## 1. Current State

The agent dashboard is a two-panel layout built in `src/pages/Index.tsx`. It replaced the earlier dual-dashboard architecture (a navigation-only Index page + a separate BookOfBusinessPage) with a unified experience that puts the Book of Business front and center.

### Layout at a Glance

```
┌─────────────────────────── max-w-5xl (1024px) ───────────────────────────┐
│  HEADER  [T logo + TIG PLATFORM / Agent Portal]   [SyncPill] [Avatar]   │
│                                                                          │
│  [Stale Banner — conditional]                                            │
│  {Month Year}                                                            │
│  {Dynamic greeting}, {firstName}.                                        │
│                                                                          │
│  ┌──────── BEACON CARD (flex-[2]) ─────────┐ ┌── ACTIONS (flex-[1]) ──┐ │
│  │  [Net change badge]  [Growth streak]    │ │  Quick Actions         │ │
│  │                                         │ │  ┌─ Sync Now ────────┐ │ │
│  │    292                                  │ │  ├─ Carrier Resources─┤ │ │
│  │    clients in your book                 │ │  ├─ Plan Finder ─────┤ │ │
│  │                                         │ │  ├─ Forms Library ───┤ │ │
│  │  [Carrier chips with counts]            │ │  ├─ Quick Quote ─────┤ │ │
│  │  ─────────────────────────              │ │  ├─ Certifications ──┤ │ │
│  │  [Goal progress + milestone bar]        │ │  └─ Training Library ┘ │ │
│  └─────────────────────────────────────────┘ └────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

### State Machine

The dashboard renders one of three mutually exclusive states:

| State | Condition | Effect |
|-------|-----------|--------|
| **Empty** | `totalClients === 0` | Greeting changes, Beacon shows EmptyStateCTA, Sync promoted in Actions, Quick Quote hidden |
| **Stale** | `syncStatus === 'stale'` and NOT empty | Amber stale banner appears, stale warning under THE NUMBER, Sync promoted, Quick Quote hidden |
| **Normal** | Has data, sync current | Full Beacon with carriers + milestone, all Actions visible |

### Key Files

| File | Purpose |
|------|---------|
| `src/pages/Index.tsx` | Main agent dashboard (single file, ~549 lines) |
| `src/hooks/useDashboardData.ts` | Data fetching hook (queries `monthly_syncs`, `sync_carrier_uploads`, `carriers`) |
| `src/components/dashboard/SyncStatusPill.tsx` | Header sync indicator + dropdown |
| `src/components/UserAvatarDropdown.tsx` | User menu with role-based items |
| `src/pages/BookOfBusinessPage.tsx` | Legacy BoB page (separate dark-mode experience, still routable) |
| `src/components/book-of-business/BookDashboard.tsx` | Legacy BoB display component |

---

## 2. Content Inventory

### 2.1 Header Area

| # | Element | Content | Data Source |
|---|---------|---------|-------------|
| 1.1 | Logo + platform label | "T" lettermark + "TIG PLATFORM" / "Agent Portal" | Static |
| 1.5 | SyncStatusPill | Dynamic label + dropdown with stats | Computed from `lastSyncAt` via 7th-of-month rule |
| 1.6 | UserAvatarDropdown | Initials avatar, dropdown with profile/admin links | `profile.full_name`, role checks |

**SyncStatusPill — Three Visual States:**

| Status | Label | Dot Color |
|--------|-------|-----------|
| `synced` | "Synced {Mon DD}" | Emerald |
| `stale` | "Sync needed" | Amber |
| `never` | "Sync to start" | Blue (pulsing) |

**SyncStatusPill Dropdown Contents:** Status icon, status title, last sync date, quick stats grid (Clients / Net Change / Carriers — hidden when `status === 'never'`), sync action link, next reminder date.

**UserAvatarDropdown Contents:** Full name, email, role badge, view mode toggle (dual role only), My Profile, Certifications, BOSS CRM (external), Admin section (admin+), Dark Mode, Sign Out.

### 2.2 Stale State Banner (Conditional: `isStale && !isEmpty`)

| # | Element | Content |
|---|---------|---------|
| 2.1-2.2 | Calendar icon | Amber container |
| 2.3 | Title | "Time to sync your {Month} reports" |
| 2.4 | Subtitle | "Last synced {Mon DD}" + "Recommended by the 7th each month" |
| 2.5 | CTA button | "Sync Now" — navigates to `/sync` |

### 2.3 Greeting Section

| # | Element | Content |
|---|---------|---------|
| 3.1 | Current month | "{Month Year}" (e.g., "February 2026") |
| 3.2 | Dynamic heading | Varies by state (see below) |

**Greeting Logic:**

| Condition | Text |
|-----------|------|
| `isEmpty` | "Let's build your book, {firstName}." |
| `growthStreak >= 3` | "You're on fire, {firstName}." |
| `netChange > 0` | "Momentum building, {firstName}." |
| Default | "Welcome back, {firstName}." |

### 2.4 Beacon Card (Main Left Panel)

| # | Element | Content | Condition |
|---|---------|---------|-----------|
| 4A | Background glow | Blue/indigo radial gradient (decorative) | Always (dimmed when empty) |
| 4B | Net change badge | Green/amber/slate pill: "net +{N} this month (+{new} / -{termed})" | `!isEmpty && (newThisMonth > 0 \|\| termedThisMonth > 0)` |
| 4C | Growth streak badge | "{N} mo streak" with flame icon | `!isEmpty && growthStreak >= 2` |
| 4D.1 | **THE NUMBER** | `{totalClients}` — dominant element | Always. Grey when empty, dark when populated |
| 4D.2 | Subtitle | "{N} client(s) in your book" | Always |
| 4D.3 | Stale warning | "Data may be outdated - Sync to update" | `isStale && !isEmpty` |
| 4E | Empty state CTA | "Import your production reports" card with Start Sync button + feature previews | `isEmpty` |
| 4F | Carrier chips | Color dot + carrier name + client count per carrier | `!isEmpty && carriers.length > 0` |
| 4G | Goal progress | Target icon, next milestone label, "{N} to go" count, progress bar | `!isEmpty` |

**Carrier Color Map:**

| Code | Color |
|------|-------|
| humana | Emerald |
| aetna | Purple |
| anthem | Blue |
| wellcare | Amber |
| cigna | Red |
| uhc / unitedhealthcare | Sky |
| centene | Orange |
| (fallback) | Slate |

**Milestones Array:** `[10, 25, 50, 100, 150, 200, 250, 300, 400, 500, 750, 1000]`

### 2.5 Actions Panel (Right Panel)

Each `ActionButton` renders: gradient icon container, label, description, chevron right.

| # | Label | Description | Destination | Condition |
|---|-------|-------------|-------------|-----------|
| 5.1 | "Sync Book" / "Sync Now" | "Import your data" / "Update your data" | `/sync` | `isStale \|\| isEmpty` — highlighted amber |
| 5.2 | "Carrier Resources" | "Contacts & portals" | `/carrier-resources` + hover flyout | Always |
| 5.3 | "Plan Finder" | "Search Medicare plans" | `/plan-finder` | Always |
| 5.4 | "Forms Library" | "SOA & enrollment" | `/forms-library` | Always |
| 5.5 | "Quick Quote" | "SunFire & C4M" | Hover flyout only | `!isStale && !isEmpty` |
| 5.6 | "Certifications" | "Ready to sell" | `/contracting-hub` | Always |
| 5.7 | "Training Library" | "Videos & tutorials" | `/training` | Always |

**Carrier Resources Flyout (hover):** 6 carrier portal links (Aetna, Anthem, Devoted, Humana, UHC, Wellcare) + "View all resources" footer link.

**Quick Quote Flyout (hover):** SunFire + Connecture (C4M) external links.

### 2.6 Information Hierarchy

**Critical — agent needs every session:**

| Element | Why |
|---------|-----|
| THE NUMBER (4D.1) | Core KPI — entire dashboard built around it |
| Carrier chips (4F) | Book breakdown by carrier for daily work |
| Net change badge (4B) | Growth/shrink indicator drives urgency |
| SyncStatusPill (1.5) | Data freshness awareness |
| Carrier Resources (5.2) | Portal links used multiple times daily |
| Plan Finder (5.3) | Used for every client interaction during AEP |
| Quick Quote (5.5) | Used during live client calls |

**Useful — frequent but not every session:**

| Element | Why |
|---------|-----|
| Stale Banner (2) | Important when data is outdated, conditional |
| Goal Progress (4G) | Motivational, checked periodically |
| Forms Library (5.4) | Needed when processing enrollment |
| Certifications (5.6) | Onboarding and annual renewal |
| Training Library (5.7) | Onboarding and continuing education |
| Growth streak (4C) | Motivational feedback |

**Nice-to-have:** Personalized greeting, month label, "clients in your book" subtitle, "N to go" count, empty state feature previews.

**Decorative:** Background glow gradient, logo mark, "TIG PLATFORM" label, shadow classes.

### 2.7 Interaction Map

**Direct Navigation (click):**

| Trigger | Destination |
|---------|-------------|
| Stale Banner "Sync Now" | `/sync` |
| Empty State "Start Sync" | `/sync` |
| Actions: Sync Book / Sync Now | `/sync` |
| Actions: Carrier Resources | `/carrier-resources` |
| Actions: Plan Finder | `/plan-finder` |
| Actions: Forms Library | `/forms-library` |
| Actions: Certifications | `/contracting-hub` |
| Actions: Training Library | `/training` |
| SyncPill dropdown sync link | `/sync` |
| Avatar: My Profile | `/my-profile` |
| Avatar: Admin Dashboard | `/admin` |

**External Links (new tab):**

| Trigger | URL |
|---------|-----|
| Carrier flyout: Aetna | `aetna.com/producer_public/login.fcc` |
| Carrier flyout: Anthem | `brokerportal.anthem.com/.../login` |
| Carrier flyout: Devoted | `agent.devoted.com` |
| Carrier flyout: Humana | `account.humana.com` |
| Carrier flyout: UHC | `uhcagent.com` |
| Carrier flyout: Wellcare | `wellcare.com/.../broker-resources` |
| Quick Quote: SunFire | `sunfirematrix.com/.../pfs` |
| Quick Quote: Connecture | `pinnacle7.destinationrx.com/.../Login` |
| Avatar: BOSS CRM | `fmo.kizen.com/login` |

**Hover Interactions:**

| Trigger | Behavior |
|---------|----------|
| Carrier Resources button | Flyout opens RIGHT with 6 carrier portal links (0ms open, 150ms close delay) |
| Quick Quote button | Flyout opens RIGHT with 2 quoting links (same timing) |
| All ActionButtons | Background lightens, border brightens, chevron shifts right |

### 2.8 Computed But Unused Data Fields

The `useDashboardData` hook computes data that is never rendered in the current dashboard:

| Field | Purpose |
|-------|---------|
| `monthlyHistory` | Array of last 6 monthly client totals (Sparkline component exists but is not imported) |
| `projectedDate` | Estimated date to reach next milestone |
| `avgNewPerMonth` | Average new clients per growth month |
| `bestMonth` | Best growth month (name + count) |
| `milestonesHit` | Array of milestones already achieved (only used internally) |
| `fullName` | Full name string (only `firstName` and `initials` are used) |

### 2.9 Unused Dashboard Components

Files in `src/components/dashboard/` that are NOT imported by Index.tsx:

| File | Purpose |
|------|---------|
| `AgentDashboard.tsx` | Possibly older dashboard version |
| `DashboardHeader.tsx` | Extracted header component |
| `DashboardGreeting.tsx` | Extracted greeting component |
| `Sparkline.tsx` | Mini chart for monthly history |
| `NextGoalCard.tsx` | Standalone milestone card (only MILESTONES constant is imported by hook) |
| `MilestoneJourneyCard.tsx` | Milestone journey visualization |
| `QuickActions.tsx` | Extracted quick actions panel |
| `GrowthStreakCard.tsx` | Standalone growth streak card |
| `HeroCard.tsx` | Possibly earlier Beacon design |

---

## 3. UX Issues & Findings

### 3.1 Information Hierarchy

The dashboard now leads with business metrics (THE NUMBER is dominant), but the legacy BookOfBusinessPage still exists as a separate route with its own dark-mode premium experience. This creates:

- **Context switching:** Moving from the warm/light dashboard to the premium/dark BookOfBusiness page creates a jarring visual transition.
- **Duplicated functionality:** Two places to see book of business data with different presentations.

### 3.2 "First 3 Seconds" Analysis

The current dashboard resolves the original problem (agents see metrics immediately on login), but conditional states change the experience significantly:

| State | First 3 Seconds |
|-------|-----------------|
| **Normal** | Client count dominates, trend badge visible, carrier breakdown glanceable |
| **Stale** | Amber banner competes with THE NUMBER for attention, stale warning under count adds anxiety |
| **Empty** | THE NUMBER shows "0" in grey, empty state CTA takes over Beacon card |

### 3.3 Cognitive Load

| Panel | Decision Points | Data Density |
|-------|----------------|--------------|
| Beacon card | 0 (display only) | High but well-organized (hero + supporting) |
| Actions panel | 5-7 clickable items | Low (navigation labels only) |

### 3.4 Progressive Disclosure Gaps

- **No expandable sections:** Everything is visible at once or hidden entirely. There is no "tap to see more" pattern.
- **Earnings data missing from dashboard:** Monthly earnings and annual projection live only on the legacy BookOfBusiness page.
- **No inline sync:** Agent must navigate to `/sync` to update data.

### 3.5 Visual Flow (Eye Tracking Path)

```
1. THE NUMBER (4D.1)    --> Massive font size dominates immediately
       |
       v
2. Net Change Badge      --> Color contrast (green/amber) on white draws attention
       |
       v
3. Greeting (h1)         --> Top-left, natural reading position
       |
       v
4. Actions Panel         --> Dark bg-slate-900 creates strong contrast with white Beacon
       |
       v
5. Carrier Chips         --> Small colored dots + numbers in the middle zone
       |
       v
6. Goal Progress         --> Purple gradient draws eye last in the card
       |
       v
7. Header / Sync Pill    --> Small, subtle -- noticed last
```

### 3.6 Design System Deviations

| Pattern | Design System Spec | Dashboard Implementation |
|---------|-------------------|--------------------------|
| Card radius | `rounded-xl` | `rounded-[2rem]` (larger) |
| Card shadow | `shadow-sm` | `shadow-2xl` (heavier) |
| Card border | `border-border/50` | `border-slate-100` |
| Background | `bg-gradient-to-br from-[#FEFDFB]...` | `bg-[#f9fafb]` (different) |
| Header spacing | `px-5 py-4` | Custom `flex items-center justify-between mb-5` |

These are intentional "beacon" design choices (heavier shadows, larger radii for the hero card), but they diverge from the documented system.

### 3.7 Missing from Design System

The design system (`HOMESTEAD.md`) has no documented responsive patterns:
- No breakpoint standards
- No mobile-first guidelines
- No component responsive variants

---

## 4. Responsive Issues

### 4.1 P0 — Flyout Overflow Bug (Critical)

**Files:** `src/pages/Index.tsx` lines 463-548 (`CarrierResourcesHoverButton`), lines 387-451 (`HoverActionButton`)

The Carrier Resources and Quick Quote flyouts use custom absolute positioning that opens to the RIGHT (`left-full`). On viewports narrower than ~1600px, the flyout extends past the viewport edge, making items inaccessible.

```
1920px Desktop — flyout visible:
┌─────────────────────────────────────────────────────────┐
│ ┌──────────────────────┐  ┌────────────┐ ┌──────────┐  │
│ │   Main Card (66%)    │  │ Actions    │ │ Flyout   │  │
│ │                      │  │ Panel      │ │ (220px)  │  │
│ │                      │  │ (33%)      │ │ VISIBLE  │  │
│ └──────────────────────┘  └────────────┘ └──────────┘  │
└─────────────────────────────────────────────────────────┘

1366px Laptop — flyout clipped:
┌────────────────────────────────────────┐
│ ┌─────────────────┐ ┌─────────┐       │
│ │  Main Card      │ │ Actions │ ┌─────┼──────┐
│ │  (66%)          │ │ Panel   │ │Flyou│t OFF │
│ │                 │ │ (33%)   │ │SCREE│N     │
│ └─────────────────┘ └─────────┘ └─────┼──────┘
└────────────────────────────────────────┘
```

**Root cause:** `absolute left-full top-0` positioning with `min-w-[220px]`. No collision detection. No viewport-aware repositioning.

**Missing features:**
1. No collision detection (doesn't check if flyout will overflow viewport)
2. No side preference (always opens right, never left)
3. No viewport-aware positioning (unlike Radix Popover, which is already in the codebase)

**Correct pattern in codebase:** `SyncStatusPill.tsx` opens its dropdown below and aligns to the right edge, staying within viewport bounds.

**Recommended fix:** Replace custom positioning with Radix HoverCard (`side="right"` with `collisionPadding={16}`), which automatically handles collision detection and flips sides when needed:

```tsx
<HoverCard openDelay={0} closeDelay={150}>
  <HoverCardTrigger asChild>
    <button>Carrier Resources</button>
  </HoverCardTrigger>
  <HoverCardContent side="right" sideOffset={12} collisionPadding={16}>
    {/* Flyout content */}
  </HoverCardContent>
</HoverCard>
```

### 4.2 Breakpoint Usage

Only **3 responsive modifiers** are used across the entire page:

| Element | Base | sm (640px+) | lg (1024px+) |
|---------|------|-------------|--------------|
| THE NUMBER font size | `text-[5rem]` (80px) | `text-[7rem]` (112px) | `text-[10rem]` (160px) |
| Main layout direction | `flex-col` | -- | `flex-row` |
| Beacon width | `w-full` | -- | `flex-[2]` |
| Actions width | `w-full` | -- | `flex-[1]` |

No `md:` breakpoint is used anywhere on the dashboard. Nothing adapts between 640px and 1024px.

### 4.3 Hardcoded Dimensions

| Element | Value | Line | Risk |
|---------|-------|------|------|
| Main card | `rounded-[2rem]` | 131 | Fixed 32px radius on all viewports |
| Actions panel | `rounded-[2rem]` | 235 | Fixed 32px radius |
| Client number | `text-[10rem]` at lg | 166 | Jumps from 7rem to 10rem at 1024px (48px jump) |
| Card padding | `p-8` | 131 | Fixed 32px — eats 64px on a 375px phone (only 287px left for content) |
| Panel padding | `p-6` | 235 | Fixed 24px |
| Icon containers | `w-11 h-11` | various | Fixed 44px |

### 4.4 Behavior at Key Viewports

**1920px (Large Desktop):** Content feels small relative to viewport. `max-w-5xl` constrains to 1024px, leaving 53% of the screen as empty margin. Flyouts work fine.

**1440px (Large Laptop):** Ideal viewport. Layout proportions work. 208px margins each side. Flyouts have adequate room.

**1366px (Standard Laptop — most common for agents):** Flyout overflow bug. Only ~171px available to the right of the Actions panel, but the flyout needs ~232px (220px + 12px offset).

**1024px (lg breakpoint exactly):** Side-by-side layout just barely active. Flyouts have ZERO room to the right. Actions panel at ~311px minus p-6 = 263px usable — button text starts to feel cramped.

**1023px (just below lg):** Columns stack. THE NUMBER jumps from 10rem (160px) to 7rem (112px) — a jarring 48px reduction at this exact pixel. Beacon card becomes very wide (~975px) for its content. Action buttons become ~927px wide (much wider than needed). Page height jumps to ~1000px+ requiring scroll.

**768px (Tablet):** Stacked layout. Carrier chips may wrap to 2 rows. Action buttons have excessive width. Stale banner wraps (flex-wrap). Total scroll ~1100-1200px.

**Below 640px (Mobile):** THE NUMBER at 80px (base). Beacon card `p-8` uses 64px of horizontal space on a 375px phone = only 287px for content.

### 4.5 Responsive Issues Summary

| Issue | Severity | Viewport Range |
|-------|----------|----------------|
| Flyout overflow off-screen | **P0 Critical** | 1024-1600px |
| Jarring font size jump (10rem to 7rem) at lg breakpoint | P1 High | 1024px exactly |
| No `md:` breakpoint — nothing adapts between sm and lg | P1 High | 640-1024px |
| Stacked layout creates excessive button widths | P2 Medium | < 1024px |
| Large side margins waste space on 1920px+ | P3 Low | 1920px+ |
| `max-w-5xl` (1024px) is narrow for modern displays | P3 Low | > 1280px |
| Beacon `p-8` eats significant space on mobile | P3 Low | < 640px |
| `rounded-[2rem]` is very large radius on small screens | P3 Low | < 640px |

### 4.6 CarrierResourcesPage.tsx Issues

| Issue | Location | Fix |
|-------|----------|-----|
| Fixed 2-column grid, no responsive | `CarrierResourcesPage.tsx:147` | Add `grid-cols-1 md:grid-cols-2` |
| Carrier pills horizontal overflow | `CarrierResourcesPage.tsx:67` | Add `overflow-x-auto` or wrap with scroll |

---

## 5. Redesign Proposals

Three options from the original analysis, preserved in full. These were written before the dual-dashboard merge and reference the earlier architecture, but the design concepts remain applicable.

### Option A: Minimal Intervention

**Philosophy:** Add a Book of Business summary widget to the landing page. Preserve navigation cards.

```
┌─────────────────────────────────────────────────────────────┐
│  Header                                                     │
├─────────────────────────────────────────────────────────────┤
│  Welcome back, {FirstName}                                  │
│                                                             │
│  [AHIP Alert if applicable]                                 │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  YOUR BOOK                                View all -> │  │  BoB Summary
│  │  ┌─────────────┐  ┌─────────────┐  ┌───────────────┐ │  │  Card (compact)
│  │  │    247      │  │  +12 up     │  │   $2,450     │ │  │
│  │  │   clients   │  │ this month  │  │  Jan earnings │ │  │
│  │  └─────────────┘  └─────────────┘  └───────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  [Carrier Resources]  [Forms Library]                       │  Existing cards
│  [Quick Quote] [Your Business]                              │
└─────────────────────────────────────────────────────────────┘
```

**New component:** `BookOfBusinessSummary.tsx` (~100 LOC). Shows client count, delta, current month earnings. Click navigates to full BoB page.

| Pros | Cons |
|------|------|
| Minimal code changes | Still navigation-heavy |
| No user workflow disruption | BoB feels "bolted on" |
| Preserves existing mental model | Doesn't solve hierarchy issue |
| Low risk | Misses opportunity for elevation |

**Implementation time:** 2-4 hours. **Risk:** Low.

---

### Option B: Moderate Restructure

**Philosophy:** Rebalance information hierarchy with Book of Business as the primary landing element. Navigation becomes secondary.

```
┌─────────────────────────────────────────────────────────────┐
│  Header                                                     │
├─────────────────────────────────────────────────────────────┤
│  Welcome back, {FirstName}                                  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                 YOUR BOOK OF BUSINESS                 │  │  HERO SECTION
│  │  ┌─────────────────────────────────────────────────┐  │  │  Full-width
│  │  │         247                    [sparkline]      │  │  │  premium card
│  │  │        clients    up +12                        │  │  │
│  │  │  Humana 89  Aetna 72  Anthem 54                 │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │  ┌──────────────────────┐  ┌──────────────────────┐   │  │  Milestone + Earnings
│  │  │  23 to 250           │  │  $2,450 this month   │   │  │
│  │  │  [progress bar]      │  │  $29.4K projected    │   │  │
│  │  └──────────────────────┘  └──────────────────────┘   │  │
│  │                                      [Sync Now ->]    │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  TOOLS                                                      │
│  [Carriers]  [Forms]  [Quote]                               │  Compact 1/3 cards
│                                                             │
│  YOUR ACCOUNT                                               │
│  [Certs]  [Training]  [Profile]                             │
└─────────────────────────────────────────────────────────────┘
```

**Information hierarchy:**

| Priority | Content | Treatment |
|----------|---------|-----------|
| P0 | Client count, trend, earnings | Hero metrics, large typography |
| P1 | Milestone progress | Visible but secondary |
| P2 | Carrier breakdown | Pills, glanceable |
| P3 | Tools navigation | Compact row |
| P4 | Account navigation | Compact row |

**New components:** `BookOfBusinessHero.tsx` (~200 LOC), `CompactToolsRow.tsx` (~80 LOC). Major refactor of Index.tsx.

**Risk:** Medium. **Implementation time:** 1-2 days.

---

### Option C: Full Reimagining

**Philosophy:** Apple Health meets Robinhood portfolio. One number dominates, progressive disclosure via expandable cards, contextual actions, no separate pages.

```
┌─────────────────────────────────────────────────────────────┐
│  Header (minimal)                            [Avatar]       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                         247                           │  │  HERO NUMBER
│  │                        clients                        │  │  (dominant)
│  │       up +12 this month        [6-mo trend chart]     │  │
│  │  Humana 89  Aetna 72  Anthem 54  Wellcare 32         │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────┐  ┌─────────────────────────┐   │
│  │  EARNINGS               │  │  GOAL                   │   │  Expandable cards
│  │  $2,450   >             │  │  250 clients  >         │   │  (tap to expand)
│  │  January                │  │  23 to go               │   │
│  └─────────────────────────┘  └─────────────────────────┘   │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Sync needed                           [Sync Now ->] │  │  Contextual
│  └───────────────────────────────────────────────────────┘  │  (hidden if fresh)
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  QUICK ACTIONS                                          ││  Floating dock
│  │  [Carriers] [Forms] [Quote] [Certs] [Training]          ││  (iOS-style)
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**Expanded Earnings Card (tap):**
```
┌───────────────────────────────────────────────────────────┐
│  EARNINGS                                           [-]   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │   $1,200    │  │    $750     │  │    $500     │       │
│  │  Renewals   │  │   T65       │  │  Changes    │       │
│  └─────────────┘  └─────────────┘  └─────────────┘       │
│  2026 Projection: $29,400                                 │
│  [progress bar]                                           │
│  [View Full Breakdown ->]                                 │
└───────────────────────────────────────────────────────────┘
```

**Milestone Celebration (Inline):**
```
┌───────────────────────────────────────────────────────────┐
│  You hit 250 clients!                                     │
│  Amazing work. Your next goal: 300 clients                │
│  [Share Achievement]  [Continue]                          │
└───────────────────────────────────────────────────────────┘
```

**Core differences from current:**

| Aspect | Current | Reimagined |
|--------|---------|------------|
| Primary content | Business metrics + navigation | Business metrics only |
| Progressive disclosure | None (all visible or hidden) | Card expansion |
| Celebrations | Separate screens | Inline moments |
| Actions | Vertical list | Floating dock |
| Sync prompts | Separate flow at `/sync` | Inline contextual |
| Mobile experience | Vertical scroll | Swipe between cards |

**New components required:** `DashboardHero.tsx`, `ExpandableCard.tsx`, `FloatingDock.tsx`, `InlineMilestone.tsx`, `InlineSync.tsx`, `EarningsExpanded.tsx`, `GoalExpanded.tsx`. Complete rewrite of Index.tsx. BookOfBusinessPage potentially deprecated.

**New patterns required:** Card expansion animations (Framer Motion recommended), gesture handling for mobile, state management for expanded/collapsed cards.

**Risk:** High (but highest reward). **Implementation time:** 1-2 weeks.

### Wireframe Comparison

```
Current:
┌────────────────────────────────┐
│  HERO DATA  |  NAV NAV NAV    │  <-- Side-by-side
└────────────────────────────────┘

Option A:
┌────────────────────────────────┐
│  [BoB Summary]                 │  <-- Small addition
│  NAV  NAV  NAV  NAV  NAV  NAV │
└────────────────────────────────┘

Option B:
┌────────────────────────────────┐
│                                │
│    B O O K   O F   B U S      │  <-- Dominant
│                                │
│  nav  nav  nav  |  nav  nav   │  <-- Subordinate
└────────────────────────────────┘

Option C:
┌────────────────────────────────┐
│                                │
│           2 4 7                │  <-- Hero number
│          clients               │
│                                │
│  [Earnings >]  [Goals >]      │  <-- Expandable
│                                │
│  [o] [o] [o] [o] [o]  (dock) │  <-- Floating nav
└────────────────────────────────┘
```

### Recommended Path

**Phase 1 (Option B):** Implement hero BoB on Index.tsx, consolidate navigation, test with users, gather feedback.

**Phase 2 (Iteration):** Add expandable cards based on feedback, implement inline sync if users request, consider floating dock for mobile.

**Phase 3 (Option C elements):** Progressive disclosure patterns, celebration moments inline, full mobile optimization.

---

## 6. Open Action Items

### P0 — Critical

| # | Item | File:Line | Notes |
|---|------|-----------|-------|
| 1 | **Fix flyout overflow** — Carrier Resources and Quick Quote flyouts clip off-screen on 1366px laptops | `src/pages/Index.tsx:463-548` (CarrierResourcesHoverButton), `src/pages/Index.tsx:387-451` (HoverActionButton) | Replace custom absolute positioning with Radix HoverCard (already in codebase at `src/components/ui/hover-card.tsx`) using `side="right"` with `collisionPadding={16}` |

### P1 — High

| # | Item | File:Line | Notes |
|---|------|-----------|-------|
| 2 | **Add `md:` breakpoint** — nothing adapts between 640px and 1024px | `src/pages/Index.tsx:129` | The two-column layout already uses `flex-col lg:flex-row` but needs intermediate states |
| 3 | **Smooth the font size jump** at lg breakpoint | `src/pages/Index.tsx:166` | Currently jumps from 7rem to 10rem at 1024px. Add `md:text-[8rem]` for a smoother transition |
| 4 | **Surface earnings data on dashboard** | `src/pages/Index.tsx` | Monthly earnings and annual projection are only on the legacy BookOfBusiness page. The `useCommissions` hook exists |
| 5 | **Decide on BookOfBusinessPage.tsx** | `src/pages/BookOfBusinessPage.tsx` | The legacy dark-mode BoB page is still routable. Deprecate or redirect? |

### P2 — Medium

| # | Item | File:Line | Notes |
|---|------|-----------|-------|
| 6 | **Fix CarrierResourcesPage responsive grid** | `src/pages/CarrierResourcesPage.tsx:147` | Fixed 2-column grid, should be `grid-cols-1 md:grid-cols-2` |
| 7 | **Fix carrier pills overflow on CarrierResourcesPage** | `src/pages/CarrierResourcesPage.tsx:67` | Add `overflow-x-auto` or wrap logic |
| 8 | **Add responsive patterns to HOMESTEAD.md** | `HOMESTEAD.md` | No breakpoint standards, mobile-first guidelines, or component responsive variants documented |
| 9 | **Stale banner doesn't wrap gracefully** | `src/pages/Index.tsx:98` | Uses `flex items-center justify-between` with no responsive flex direction |
| 10 | **Clean up unused dashboard components** | `src/components/dashboard/` | 9 unused component files: AgentDashboard, DashboardHeader, DashboardGreeting, Sparkline, NextGoalCard, MilestoneJourneyCard, QuickActions, GrowthStreakCard, HeroCard |
| 11 | **Use computed but unused data fields** | `src/hooks/useDashboardData.ts` | `monthlyHistory`, `projectedDate`, `avgNewPerMonth`, `bestMonth` are all computed but never rendered |

### P3 — Low

| # | Item | File:Line | Notes |
|---|------|-----------|-------|
| 12 | Reduce Beacon card `p-8` padding on mobile | `src/pages/Index.tsx:131` | Eats 64px on a 375px phone |
| 13 | Reduce `rounded-[2rem]` on small screens | `src/pages/Index.tsx:131, 235` | 32px radius is very large on mobile |
| 14 | Large side margins waste space on 1920px+ | `src/pages/Index.tsx` | `max-w-5xl` leaves 53% of viewport empty at 1920px |
| 15 | Stacked action buttons too wide below 1024px | `src/pages/Index.tsx:235` | Each button becomes ~927px wide when stacked |

### Testing Checklist (After Responsive Fixes)

- [ ] 1920px — Desktop (current design)
- [ ] 1440px — Large laptop
- [ ] 1366px — Standard laptop (most common for agents, flyout bug viewport)
- [ ] 1280px — Small laptop
- [ ] 1024px — Tablet landscape / lg breakpoint exactly
- [ ] 768px — Tablet portrait
- [ ] 375px — Mobile (if supporting)

---

## Appendix: Component & Hook Reference

### Sub-Components Defined in Index.tsx

| Component | Props | Purpose |
|-----------|-------|---------|
| `EmptyStateCTA` | `{ onStartSync: () => void }` | Empty state call-to-action card |
| `ActionButton` | `{ icon, label, desc, color, to, highlighted? }` | Standard navigation button in Actions panel |
| `HoverActionButton` | `{ icon, label, desc, color, links[] }` | Button with hover flyout for external links |
| `CarrierResourcesHoverButton` | (none) | Specialized hover button with carrier portal links |

### Data Hooks

| Hook | Source | Data Provided |
|------|--------|---------------|
| `useDashboardData` | `@/hooks/useDashboardData` | `{ data: DashboardData, isLoading, error }` |
| `useProfile` | `@/hooks/useProfile` | `profile.id`, `profile.full_name` |
| `useCommissions` | `@/hooks/useCommissions` | Monthly + annual earnings (used by legacy BoB only) |

### Supabase Queries (inside useDashboardData)

| Query | Table(s) | Purpose |
|-------|----------|---------|
| 1 | `monthly_syncs` (WHERE profile_id, status=complete, ORDER BY month ASC) | All completed syncs for history, metrics, streaks |
| 2 | `monthly_syncs` -> `sync_carrier_uploads` -> `carriers` (latest 1, JOIN) | Carrier breakdown from most recent sync |

### Utility Functions

| Function | Source | Purpose |
|----------|--------|---------|
| `getNextSyncDate()` | `@/lib/sync` | Next recommended sync date (7th of current/next month) |
| `determineSyncStatus()` | `useDashboardData.ts` | 'synced' / 'stale' / 'never' from last sync date |
| `getCarrierColor()` | `useDashboardData.ts` | Maps carrier code to Tailwind bg color class |

### Legacy Book of Business Components (Still Routable)

| File | Lines | Purpose |
|------|-------|---------|
| `src/pages/BookOfBusinessPage.tsx` | ~107 | BoB page wrapper with state machine |
| `src/components/book-of-business/BookDashboard.tsx` | ~376 | Core BoB display (dark theme) |
| `src/components/book-of-business/BookSparkline.tsx` | ~144 | 6-month SVG area chart |
| `src/components/book-of-business/MilestoneCard.tsx` | ~74 | Floating progress card |
| `src/components/book-of-business/CarrierPills.tsx` | ~178 | Color-coded carrier breakdown |
| `src/components/book-of-business/SyncFlow.tsx` | ~263 | Upload wizard |
| `src/components/book-of-business/SyncCarrierGrid.tsx` | ~349 | Upload grid |
| `src/components/book-of-business/SyncReveal.tsx` | ~152 | Completion screen |
| `src/components/book-of-business/SyncMilestone.tsx` | ~103 | Celebration screen |

---

*End of consolidated audit. Source documents: DASHBOARD_ANALYSIS.md (Jan 28, 2026), DASHBOARD_CONTENT_INVENTORY.md (Feb 5, 2026), DASHBOARD_RESPONSIVE_AUDIT.md (Feb 5, 2026).*
