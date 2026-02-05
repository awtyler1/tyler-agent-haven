# Admin Pages Design Audit — Apple-Inspired Alignment

**Date:** February 5, 2026
**Scope:** Contracting Queue, New Agent, RTS Import
**Reference:** `DESIGN_SYSTEM.md` tokens + `AdminLayout` warm palette

---

## Overall Status

| Page | File | Lines | AdminLayout | Compliance | Priority |
|------|------|-------|-------------|------------|----------|
| **Contracting Queue** | `src/pages/admin/ContractingQueuePage.tsx` | 963 | Yes | ~60% | HIGH |
| **New Agent** | `src/pages/admin/NewAgentPage.tsx` | 360 | Yes | ~65% | MEDIUM |
| **RTS Import** | `src/pages/admin/RTSImportPage.tsx` | 275 | Yes | ~80% | LOW |

All three pages use `AdminLayout`, which already provides:
- Warm gradient: `bg-gradient-to-br from-amber-50/80 via-orange-50/40 to-stone-100`
- Glass header: `bg-white/60 backdrop-blur-xl border-b border-white/80`
- Stone text nav: `text-stone-500 hover:text-stone-900`

---

## Target Design Tokens (from DESIGN_SYSTEM.md + ContractingTab reference)

| Element | Target |
|---------|--------|
| Card container | `bg-white rounded-xl shadow-sm border border-stone-200/50` |
| Card header border | `border-b border-stone-100` |
| Primary text | `text-stone-900` |
| Secondary text | `text-stone-500` |
| Tertiary text | `text-stone-400` |
| Primary button | `bg-stone-900 hover:bg-stone-800 text-white` OR gold variant |
| Brand accent | `text-amber-700`, `bg-amber-50`, `hover:bg-amber-100` |
| Interactive hover | `hover:bg-stone-50/50` |
| Borders (card) | `border-stone-200/50` or `border-white/60` |
| Borders (separator) | `border-stone-100` |
| Focus ring | Use component default ring pattern (not inline `focus:border-*`) |

**Gold standard reference:** `ContractingTab.tsx` — already 100% aligned.

---

## 1. CONTRACTING QUEUE PAGE

**File:** `src/pages/admin/ContractingQueuePage.tsx` (963 lines)
**Child components:**
- `src/components/admin/ContractingSubmissionDetail.tsx` (408 lines)
- `src/components/admin/CarrierStatusPanel.tsx` (349 lines)
- `src/components/admin/HierarchyAssignmentPanel.tsx` (168 lines)

### Quick Wins

| # | Element | Line(s) | Current | Target | Effort |
|---|---------|---------|---------|--------|--------|
| 1 | Stat cards border | 787, 791 | `border border-border` | `border border-stone-200/50` | 1 min |
| 2 | Empty state card | 811 | `border border-border` | `border border-stone-200/50` | 1 min |
| 3 | Ready to Send card | 823 | `border border-border` | `border border-stone-200/50` | 1 min |
| 4 | Completed card | 862 | `border border-border` | `border border-stone-200/50` | 1 min |
| 5 | Detail panel border | 161 | `border-l border-border` | `border-l border-stone-200` | 1 min |
| 6 | Detail header border | 163 | `border-b border-border` | `border-b border-stone-100` | 1 min |
| 7 | Contact border | 178 | `border-b border-border` | `border-b border-stone-100` | 1 min |
| 8 | CarrierStatusPanel gray text | 54 | `text-gray-400` | `text-stone-400` | 1 min |

### Medium Refactors

| # | Element | Line(s) | Current | Target | Effort |
|---|---------|---------|---------|--------|--------|
| 9 | "Send to Pinnacle" button | 297-302 | Default `Button` (blue primary) | `bg-stone-900 hover:bg-stone-800 text-white` or gold | 3 min |
| 10 | "KY Default" carrier link | 242-251 | `text-primary hover:bg-primary/10` | `text-amber-700 hover:bg-amber-50` | 3 min |
| 11 | Document button hover | 216 | `hover:border-primary hover:bg-primary/5` | `hover:border-amber-600 hover:bg-amber-50` | 3 min |
| 12 | Loader color | 219 | `text-primary` | `text-amber-600` or `text-stone-500` | 1 min |
| 13 | Carrier name hover | 261 | `group-hover:text-primary` | `group-hover:text-amber-700` | 1 min |
| 14 | Doc icon hover (Detail) | 267 (Detail file) | `group-hover:text-primary` | `group-hover:text-amber-600` | 1 min |
| 15 | CarrierStatusPanel card | 233, 245 | `border border-border rounded-lg bg-card` | `border border-stone-200/50 rounded-xl` | 3 min |
| 16 | CarrierStatusPanel bg | 268 | `bg-muted/30` | `bg-stone-50/50` | 1 min |
| 17 | HierarchyAssignmentPanel | 103, 113 | `border border-border rounded-lg bg-card` | `border border-stone-200/50 rounded-xl` | 3 min |

### Larger Refactors

| # | Element | Line(s) | Current | Target | Effort |
|---|---------|---------|---------|--------|--------|
| 18 | Detail panel glass effect | 161 | `bg-white shadow-xl` | `bg-white/90 backdrop-blur-md shadow-xl` | 5 min |
| 19 | All `border-border` → warm | Multiple | Theme default (cool) | `border-stone-200/50` consistently | 10 min |
| 20 | All `text-primary` hover → amber | Multiple | Blue primary | `text-amber-700` / `text-amber-600` | 10 min |

---

## 2. NEW AGENT PAGE

**File:** `src/pages/admin/NewAgentPage.tsx` (360 lines)
**No external child components** (all inline)

### Quick Wins

| # | Element | Line(s) | Current | Target | Effort |
|---|---------|---------|---------|--------|--------|
| 1 | Form card radius | 190 | `rounded-lg` | `rounded-xl` | 1 min |
| 2 | Form card border | 190 | `border-border` | `border-border/50` | 1 min |
| 3 | Form card padding | 190 | `p-4` | `px-5 py-4` | 1 min |
| 4 | Card header border | 192 | `border-border` | `border-border/50` | 1 min |
| 5 | Outline button class | 333 | Redundant `border-border` | Remove override | 1 min |
| 6 | Agent list container radius | 291 | `rounded-md` | `rounded-lg` | 1 min |
| 7 | Agent list border | 291 | `border-border` | `border-border/50` | 1 min |

### Medium Refactors

| # | Element | Line(s) | Current | Target | Effort |
|---|---------|---------|---------|--------|--------|
| 8 | Input focus states | 213, 225, 287 | `focus:border-gold` (custom) | Remove; let Input component default ring handle it | 3 min |
| 9 | Primary button override | 340 | `bg-gold hover:bg-gold/90 text-white` (flat) | Remove className; use Button default variant (has gradient + shadow) | 3 min |
| 10 | Manager pill borders | 243, 254, 269 | `border-border` inactive | `border-border/50` | 3 min |
| 11 | Manager pill spacing | 240, 251, 266 | `px-2.5 py-1` | `px-3 py-1.5` | 2 min |
| 12 | Agent list item spacing | 310 | `px-2.5 py-2` | `px-4 py-3` | 2 min |
| 13 | Agent list item borders | 310 | Implicit `border-b` | `border-b border-border/30` | 2 min |
| 14 | Search input height | 287 | `h-9` | `h-10` | 1 min |

### Larger Refactors

| # | Element | Line(s) | Current | Target | Effort |
|---|---------|---------|---------|--------|--------|
| 15 | All `border-border` → `/50` | Multiple (~8 occurrences) | Full opacity | Half opacity for softer feel | 5 min |

---

## 3. RTS IMPORT PAGE

**File:** `src/pages/admin/RTSImportPage.tsx` (275 lines)
**Inline component:** CalendarWidget (lines 231-274)

### Quick Wins

| # | Element | Line(s) | Current | Target | Effort |
|---|---------|---------|---------|--------|--------|
| 1 | Upload button radius | 188 | `rounded-xl` | `rounded-2xl` | 1 min |
| 2 | Success card radius | 165 | `rounded-xl` | `rounded-2xl` | 1 min |
| 3 | Success card bg opacity | 165 | `bg-green-50 border-green-200` | `bg-green-50/40 border-green-200/60` | 1 min |
| 4 | Success icon bg | 166 | `bg-green-100` | `bg-green-100/50` | 1 min |
| 5 | Error card radius | 221 | `rounded-xl` | `rounded-2xl` | 1 min |
| 6 | Error card bg opacity | 221 | `bg-red-50 border-red-200` | `bg-red-50/40 border-red-200/60` | 1 min |

### Medium Refactors

| # | Element | Line(s) | Current | Target | Effort |
|---|---------|---------|---------|--------|--------|
| 7 | Calendar header label | 246 | `text-white text-center py-2` | Add `font-medium uppercase tracking-wide text-sm` | 3 min |
| 8 | Calendar default border | 239 | `border-border` | `border-stone-200` (softer) | 2 min |
| 9 | Stale date text | 264 | `text-amber-600` | `text-amber-500` (brighter) | 1 min |

### Notes

- Page title uses `font-serif font-medium` (line 140) — acceptable, but `font-semibold` would match other admin pages better
- Loading skeleton already uses `rounded-2xl` and `animate-pulse` — compliant
- Helper text colors use `text-muted-foreground` consistently — compliant
- Upload button uses gold color — correct for brand CTA

---

## Cross-Page Patterns to Fix

These issues appear across multiple pages and should be addressed systematically:

### 1. `border-border` → warm borders
All three pages use `border-border` which resolves to a neutral gray. Target: `border-stone-200/50` or `border-border/50`.

**Files affected:**
- `ContractingQueuePage.tsx` (~10 instances)
- `NewAgentPage.tsx` (~8 instances)
- `RTSImportPage.tsx` (~2 instances)
- `CarrierStatusPanel.tsx` (~3 instances)
- `HierarchyAssignmentPanel.tsx` (~2 instances)

### 2. Blue `text-primary` / `bg-primary` → warm
Any blue-tinted interactive element should shift to amber/stone.

**Files affected:**
- `ContractingQueuePage.tsx` (~5 instances)
- `ContractingSubmissionDetail.tsx` (~1 instance)

### 3. `rounded-lg` → `rounded-xl`
Cards and containers should use larger border radius.

**Files affected:**
- `NewAgentPage.tsx` (form card, dropdown)
- `CarrierStatusPanel.tsx` (panels)
- `HierarchyAssignmentPanel.tsx` (panels)

### 4. `gray-*` → `stone-*`
Any Tailwind gray should be converted to stone for warmth.

**Files affected:**
- `CarrierStatusPanel.tsx` (`text-gray-400` on line 54)

---

## Implementation Order (Recommended)

### Phase 1: Quick Wins (15 min)
All border, radius, and opacity changes across all three pages. No logic changes, purely class string updates.

**Estimated changes:** ~30 class string updates

### Phase 2: Button & Interactive Colors (15 min)
Convert blue primary buttons/links to stone-900 or amber variants. Fix hover states.

**Estimated changes:** ~10 interactive elements

### Phase 3: Component Panel Consistency (10 min)
Update `CarrierStatusPanel`, `HierarchyAssignmentPanel`, and `ContractingSubmissionDetail` child components to match warm palette.

**Estimated changes:** ~8 component-level updates

### Phase 4: Input & Focus States (5 min)
Remove custom focus overrides in NewAgentPage; let component defaults handle focus rings.

**Estimated changes:** ~3 input elements

---

## Reference: Already-Compliant Components

These components are fully aligned and serve as implementation references:

| Component | File | Why It's Good |
|-----------|------|---------------|
| `ContractingTab` | `src/components/admin/agent-profile/tabs/ContractingTab.tsx` | Stone-900 text, stone-200/50 borders, amber-700 accent, stone-50 hover |
| `AdminLayout` | `src/components/layout/AdminLayout.tsx` | Warm gradient, glass header, stone nav text |
| `AllAgentsPage` | `src/pages/admin/AllAgentsPage.tsx` | Recently redesigned with Apple-inspired tokens |
