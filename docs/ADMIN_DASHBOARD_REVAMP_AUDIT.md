# Admin Dashboard Design Revamp Audit

**File:** `src/pages/admin/AdminDashboard.tsx` (395 lines)
**Date:** February 5, 2026
**Goal:** Elevate to match AgentProfilePage Apple-inspired aesthetic

---

## 1. Current Structure

### Component Hierarchy

```
AdminDashboard.tsx
├── Imports
│   ├── React: useState, useEffect, useRef, useCallback
│   ├── Router: Link, useNavigate
│   ├── Supabase: client
│   ├── Hooks: useAuth, useNavigationContext
│   ├── UI: Card (shadcn)
│   ├── UserAvatarDropdown (custom)
│   └── Icons: Search, ClipboardList, FileText, Plus, Upload, Loader2
├── State
│   ├── stats: { totalAgents: number }
│   ├── pendingCount: number
│   ├── loading: boolean
│   ├── searchQuery: string
│   ├── searchResults: SearchResult[]
│   ├── isSearching: boolean
│   └── showResults: boolean
├── Effects
│   ├── fetchDashboardData() — parallel fetch of roles, profiles, contracting
│   └── click-outside listener for search dropdown
└── Render
    ├── Header (sticky)
    ├── Main (centered column)
    │   ├── Title + subtitle
    │   ├── Search input + dropdown
    │   ├── Stats whisper line
    │   └── 2×2 card grid
    └── (no footer)
```

### Layout Grid

- **Header:** `max-w-5xl mx-auto`, flex row, sticky top
- **Main content:** `flex flex-col items-center`, `px-6 py-12`
- **Search + Cards:** `max-w-xl` (constrained to ~576px)
- **Card grid:** `grid grid-cols-2 gap-4` (no responsive breakpoints)

---

## 2. Visual Audit

### ASCII Layout (Current State)

```
┌──────────────────────────────────────────────────────────┐
│  TIG | Admin Dashboard  [Switch to Agent View]  [Avatar] │  ← sticky header
├──────────────────────────────────────────────────────────┤
│                                                          │
│                                                          │
│                    Find an Agent                         │  ← h1, serif
│              Search by name, NPN, or email               │  ← muted subtitle
│                                                          │
│              ┌──────────────────────────┐                │
│              │ 🔍 Start typing...       │                │  ← h-12 input
│              └──────────────────────────┘                │
│                                                          │
│                 127 agents · 3 pending review            │  ← whisper stats
│                                                          │
│              ┌───────────┐ ┌───────────┐                │
│              │ [🟠] All  │ │ [🔵] Con- │ ← badge "3"   │
│              │   Agents  │ │  tracting │                │
│              │ View and  │ │ Review    │                │
│              │ manage    │ │ applica-  │                │
│              │ roster    │ │ tions     │                │
│              ├───────────┤ ├───────────┤                │
│              │ [🟡] New  │ │ [🟢] RTS  │                │
│              │   Agent   │ │  Import   │                │
│              │ Start     │ │ Upload    │                │
│              │ contract- │ │ carrier   │                │
│              │ ing       │ │ data      │                │
│              └───────────┘ └───────────┘                │
│                                                          │
│                       (empty space)                      │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Colors Currently Used

| Element | Current Classes | Notes |
|---------|----------------|-------|
| Page background | `bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]` | ✅ Matches design system |
| Header bg | `bg-white/70 backdrop-blur-xl` | ✅ Matches |
| Header border | `border-gray-200/50` | ⚠️ Should be `border-border` or `border-stone-200/50` |
| TIG text | `text-[#292524]` (hardcoded) | ⚠️ Should use `text-stone-900` |
| Subtitle text | `text-[#5c5552]` (hardcoded) | ⚠️ Should use `text-stone-500` |
| Divider pipe | `text-[#e8e4dd]` (hardcoded) | ⚠️ Should use design token |
| Card bg | `bg-white` | ✅ Matches |
| Card border | `border border-border rounded-lg` | ⚠️ Should be `rounded-xl` per design system |
| Card hover | `hover:border-primary/30 hover:shadow-lg` | OK but inconsistent with profile cards |
| Search avatar | `bg-primary/10 text-primary` | ❌ Profile uses amber/orange gradient |
| Icon bg (agents) | `bg-amber-100 text-amber-600` | OK |
| Icon bg (contract) | `bg-blue-100 text-blue-600` | OK |
| Icon bg (new) | `bg-gold/10 text-gold` | ✅ Gold accent |
| Icon bg (import) | `bg-emerald-100 text-emerald-600` | OK |
| Badge (pending) | `bg-red-500 text-white` | OK |
| Stats link | `text-gold hover:text-gold/80` | ✅ Gold accent |
| Mode toggle | `text-blue-600 hover:bg-blue-50` | OK |

### Typography

| Element | Current | AgentProfilePage Equivalent |
|---------|---------|----------------------------|
| Page title | `text-2xl font-serif font-medium text-foreground` | Same ✅ |
| Subtitle | `text-muted-foreground` (no size) | Should have `text-sm` |
| Card title | `font-semibold text-foreground` (no size) | Should have `text-sm` for consistency |
| Card description | `text-sm text-muted-foreground` | ✅ Matches |
| Stats line | `text-sm text-muted-foreground` | ✅ Matches |
| Search input | `text-base` | OK |

### Card Styles Comparison

| Property | Dashboard Cards | AgentProfile Cards |
|----------|----------------|-------------------|
| Border radius | `rounded-lg` (8px) | `rounded-xl` (16px) ❌ |
| Border | `border border-border` | `border border-stone-200/50` |
| Shadow | None (only on hover) | `shadow-sm` always |
| Padding | `p-5` | `p-5` ✅ |
| Hover | `hover:shadow-lg` | No hover (detail cards) |
| Icon container | `w-10 h-10 rounded-lg` | `w-8 h-8 rounded-full` (compliance) |

---

## 3. Data Displayed

### Metrics/KPIs

| Metric | Source | Display |
|--------|--------|---------|
| Total active agents | `profiles` table (excluding admins, test, inactive) | Whisper line: "127 agents" |
| Pending contracting | `contracting_applications` (status=submitted, not completed) | Whisper line + red badge on card |

**Missing KPIs that a dashboard should have:**
- New agents this week/month
- Contracting completion rate
- Agents by onboarding status breakdown
- Agents by state
- Recent activity feed
- Compliance alerts (expiring certs)

### Time Periods
- None — all metrics are "all-time" snapshots
- No time filtering or date range selection

### Charts/Visualizations
- **None** — purely text and cards
- No chart library in use on this page

### Quick Actions (via card grid)
1. **All Agents** → `/admin/agents` (agent roster)
2. **Contracting** → `/admin/contracting` (contracting queue)
3. **New Agent** → `/admin/agents/new` (create agent)
4. **RTS Import** → `/admin/rts-import` (upload carrier data)

---

## 4. Component Inventory

### Custom Components Used
| Component | Type | Path |
|-----------|------|------|
| `UserAvatarDropdown` | Custom | `src/components/UserAvatarDropdown.tsx` |

### Third-Party Components Used
| Component | Library | Usage |
|-----------|---------|-------|
| `Card` | shadcn/ui | 2×2 navigation grid |
| `Search` | lucide-react | Search input icon |
| `ClipboardList` | lucide-react | All Agents card icon |
| `FileText` | lucide-react | Contracting card icon |
| `Plus` | lucide-react | New Agent card icon |
| `Upload` | lucide-react | RTS Import card icon |
| `Loader2` | lucide-react | Search spinner |

### Components NOT Used (that AgentProfilePage uses)
- No `Button` component (raw `<button>` for mode toggle)
- No section header pattern (`text-xs uppercase tracking-wide`)
- No status dot pattern (`w-2 h-2 rounded-full`)
- No `DropdownMenu` (beyond the avatar)
- No serif typography in card titles

---

## 5. Pain Points & Gap Analysis

### What Looks Dated or Inconsistent

1. **Cards use `rounded-lg` instead of `rounded-xl`**
   - Every card on AgentProfilePage uses `rounded-xl`
   - Dashboard cards feel sharper/more utilitarian

2. **No persistent shadows on cards**
   - Profile cards have `shadow-sm` always
   - Dashboard cards only shadow on hover → feels flat

3. **Hardcoded color values in header**
   - `text-[#292524]`, `text-[#5c5552]`, `text-[#e8e4dd]`
   - Should use `text-stone-900`, `text-stone-500`, design tokens
   - `border-gray-200/50` should be `border-stone-200/50`

4. **Search result avatars use blue (`bg-primary/10`)**
   - AgentProfilePage uses warm amber gradient (`from-amber-500 to-orange-600`)
   - Inconsistent identity across admin pages

5. **Icon containers use `rounded-lg` (square-ish)**
   - Profile page uses `rounded-2xl` for avatar, `rounded-full` for status circles
   - Mixing corner radius styles

6. **No `font-serif` on card titles**
   - Profile uses serif for the agent name (Apple-inspired elegance)
   - Dashboard card titles are plain sans-serif

7. **Mode toggle button is raw `<button>`**
   - Not using shadcn `Button` component
   - Inconsistent with rest of admin UI

### What's Cluttered or Hard to Scan

8. **Very sparse — actually under-utilizing space**
   - Only 2 real data points (agent count, pending count)
   - The 2×2 grid is purely navigational, not informational
   - For a "dashboard," it's more of a launcher/home screen
   - No at-a-glance status of the agency's health

9. **Stats whisper line is easy to miss**
   - The only real data (agent count + pending) is in tiny muted text
   - Should be elevated into proper stat cards or a hero metric

10. **Search dropdown lacks visual polish**
    - Plain white dropdown with basic borders
    - No warm accent on selected/highlighted result
    - "View all agents" link at bottom feels tacked on

### What Doesn't Match AgentProfilePage Aesthetic

11. **No section labels with uppercase tracking**
    - Profile uses `text-xs text-stone-500 uppercase tracking-wide font-medium`
    - Dashboard has no section organization

12. **No warm gold accent on interactive elements**
    - Profile's edit inputs glow amber: `border-amber-300 bg-amber-50 focus:ring-amber-500/30`
    - Dashboard search focuses blue: `focus:ring-primary/20`

13. **Card grid gap is tight (`gap-4`)**
    - Profile sections use `space-y-4` with more breathing room
    - Dashboard cards feel cramped next to each other

14. **No card header/body separation**
    - Profile cards have distinct header sections with borders
    - Dashboard cards are single flat blocks

15. **Missing warm shadow on avatar/brand elements**
    - Profile avatar: `shadow-lg shadow-amber-500/20`
    - Dashboard has no warm shadows anywhere

---

## 6. Specific Elements to Update

### Priority 1: Visual Consistency (Quick Wins)

| # | Element | Current | Target | File:Line |
|---|---------|---------|--------|-----------|
| 1 | Card border radius | `rounded-lg` | `rounded-xl` | :325, :341, :362, :378 |
| 2 | Card shadow | (none) | `shadow-sm` | :325, :341, :362, :378 |
| 3 | Card border color | `border-border` | `border-stone-200/50` | :325, :341, :362, :378 |
| 4 | Header border | `border-gray-200/50` | `border-stone-200/50` | :192 |
| 5 | TIG text color | `text-[#292524]` | `text-stone-900` | :196 |
| 6 | Subtitle color | `text-[#5c5552]` | `text-stone-500` | :198 |
| 7 | Divider color | `text-[#e8e4dd]` | `text-stone-300` | :197 |
| 8 | Search result avatar | `bg-primary/10 text-primary rounded-full` | `bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl` | :261 |
| 9 | Mode toggle | raw `<button>` | `<Button variant="ghost" size="sm">` | :202-207 |
| 10 | Search focus ring | `focus:ring-primary/20` | `focus:ring-amber-500/20 focus:border-amber-300` | :236 |
| 11 | Icon containers | `rounded-lg` | `rounded-xl` | :330, :351, :367, :383 |

### Priority 2: Elevate the Dashboard Content

| # | Element | Current | Target |
|---|---------|---------|--------|
| 12 | Stats display | Tiny whisper text line | Hero stat cards (Total Agents, Pending, Compliance Alerts) with large numbers |
| 13 | Time context | None | "Good morning, {name}" greeting with date |
| 14 | Activity section | None | Recent activity feed (last 5 agent events) |
| 15 | Compliance alerts | None | Expiring certs/E&O count as amber warning card |
| 16 | Section labels | None | `text-xs text-stone-500 uppercase tracking-wide font-medium` headers |

### Priority 3: Layout & Spacing Refinements

| # | Element | Current | Target |
|---|---------|---------|--------|
| 17 | Card grid gap | `gap-4` | `gap-5` for more breathing room |
| 18 | Content max-width | `max-w-xl` (~576px) | `max-w-3xl` (~768px) to allow stat cards + grid side by side |
| 19 | Card hover effect | `hover:shadow-lg` (generic) | `hover:shadow-md hover:border-amber-200/50` (warm accent) |
| 20 | Search dropdown | `rounded-lg shadow-lg` | `rounded-xl shadow-xl border-stone-200/50` |
| 21 | Search result hover | `hover:bg-muted/50` | `hover:bg-amber-50/50` (warm hover) |
| 22 | Empty state in search | Plain text | Add Search icon + styled empty state |

### Priority 4: Component Architecture

| # | Element | Current | Target |
|---|---------|---------|--------|
| 23 | Header | Custom inline header | Use shared `AdminLayout` wrapper for consistency |
| 24 | Card grid items | Inline JSX | Extract to `DashboardNavCard` component |
| 25 | Stats section | Inline whisper | Extract to `DashboardStats` component |
| 26 | Search | Inline with 60+ lines | Extract to `DashboardSearch` component |

---

## 7. AgentProfilePage Patterns to Adopt

### Design Tokens Reference (from AgentProfilePage)

```tsx
// Page wrapper (already matching)
"min-h-screen bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]"

// Card (update to match)
"bg-white rounded-xl shadow-sm border border-stone-200/50"

// Section header
"text-xs text-stone-500 uppercase tracking-wide font-medium mb-4"

// Avatar (warm gradient)
"w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20"

// Status pill
"px-2.5 py-0.5 text-xs font-medium rounded-full"

// Tab bar (could use for stat period selector)
"flex gap-1 p-1 bg-stone-200/60 rounded-xl w-fit"

// Active tab
"bg-white text-stone-900 shadow-sm"

// Edit input glow
"border-amber-300 bg-amber-50 focus:ring-2 focus:ring-amber-500/30"

// Compliance status circle
"w-8 h-8 rounded-full bg-green-100 text-green-600"

// Status dot
"w-2 h-2 rounded-full bg-green-500"

// Hover reveal
"opacity-0 group-hover:opacity-100 transition-opacity"

// Card row
"flex justify-between items-center hover:bg-stone-50/50 transition-colors"
```

---

## 8. Recommended New Layout

```
┌──────────────────────────────────────────────────────────────┐
│  TIG | Admin Dashboard                              [Avatar] │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Good morning, Austin                                        │  ← serif, warm greeting
│  Here's your agency at a glance                              │  ← muted subtitle
│                                                              │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐               │
│  │   127      │ │    3       │ │    2        │               │  ← hero stat cards
│  │ Agents     │ │ Pending    │ │ Expiring    │               │
│  │ Active     │ │ Review     │ │ This Month  │               │
│  └────────────┘ └────────────┘ └────────────┘               │
│                                                              │
│  ──── SEARCH ────────────────────────────────────────────    │
│  ┌──────────────────────────────────────────────────┐        │
│  │ 🔍  Search agents by name, NPN, or email...      │        │  ← full width search
│  └──────────────────────────────────────────────────┘        │
│                                                              │
│  ──── QUICK ACTIONS ─────────────────────────────────────    │  ← section label
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────┐   │
│  │ 📋 All      │ │ 📄 Contract │ │ ➕ New      │ │ ⬆️ RTS│   │  ← 4-col grid
│  │  Agents     │ │   -ing  [3] │ │  Agent     │ │Import│   │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────┘   │
│                                                              │
│  ──── RECENT ACTIVITY ───────────────────────────────────    │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  🟢 Jane Smith appointed          · 2 hours ago     │    │
│  │  🟡 Bob Jones submitted docs      · 5 hours ago     │    │
│  │  🔵 Setup link sent to Kim Lee    · yesterday       │    │
│  │                    View all activity →                │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Summary

The current AdminDashboard is functionally a **launcher page** rather than a true dashboard. It has:
- ✅ Clean, minimal layout
- ✅ Working search with debounce
- ✅ Correct warm page gradient
- ❌ Inconsistent card styling vs AgentProfilePage (`rounded-lg` vs `rounded-xl`, no shadows)
- ❌ Hardcoded colors instead of design tokens
- ❌ Blue search avatars instead of warm amber
- ❌ No real dashboard metrics or at-a-glance data
- ❌ No section organization with uppercase labels
- ❌ Missing warm gold focus states on search
- ❌ No activity feed or compliance awareness

The revamp should focus on (1) visual token alignment with AgentProfilePage, (2) elevating stats into hero cards, (3) adding section organization, and (4) optionally introducing a recent activity feed for true dashboard value.
