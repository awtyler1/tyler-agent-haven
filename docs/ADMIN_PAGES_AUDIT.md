# Admin Pages Audit

> Consolidated from ADMIN_DASHBOARD_REVAMP_AUDIT.md, ADMIN_DESIGN_AUDIT.md, ADMIN_STYLE_GUIDE.md — February 2026

---

## 1. Admin Dashboard — Current Issues & Recommendations

**File:** `src/pages/admin/AdminDashboard.tsx` (395 lines)

The dashboard is functionally a **launcher page** (search + 2x2 nav grid), not a true dashboard. It has two data points (agent count, pending contracting) displayed as a whisper line that is easy to miss.

### Hardcoded Colors (Should Use Tokens)

| Element | Current | Target | Line(s) |
|---------|---------|--------|---------|
| TIG text | `text-[#292524]` | `text-stone-900` | :196 |
| Subtitle | `text-[#5c5552]` | `text-stone-500` | :198 |
| Divider pipe | `text-[#e8e4dd]` | `text-stone-300` | :197 |
| Header border | `border-gray-200/50` | `border-stone-200/50` | :192 |

### Card Styling Mismatches

| Property | Dashboard | Design Target |
|----------|-----------|---------------|
| Border radius | `rounded-lg` (8px) | `rounded-xl` (16px) |
| Shadow | None (hover only) | `shadow-sm` always |
| Border color | `border-border` | `border-stone-200/50` |
| Icon containers | `rounded-lg` | `rounded-xl` |

**Affected lines:** :325, :330, :341, :351, :362, :367, :378, :383

### Search Issues

- Result avatars use `bg-primary/10 text-primary` (blue) — should be warm amber gradient (`from-amber-500 to-orange-600`) per AgentProfilePage. Line :261
- Focus ring uses `focus:ring-primary/20` — should be `focus:ring-amber-500/20 focus:border-amber-300`. Line :236
- Dropdown uses `rounded-lg shadow-lg` — should be `rounded-xl shadow-xl border-stone-200/50`
- Result hover uses `hover:bg-muted/50` — should be `hover:bg-amber-50/50`

### Component Issues

- Mode toggle button is raw `<button>` — should be `<Button variant="ghost" size="sm">`. Lines :202-207
- No section labels with `text-xs uppercase tracking-wide` pattern
- No `font-serif` on card titles (inconsistent with profile pages)

### Missing Dashboard Content

The page lacks true dashboard value. Recommended additions:

| Feature | Priority |
|---------|----------|
| Hero stat cards (Total Agents, Pending, Expiring Certs) | HIGH |
| Personalized greeting with date | MEDIUM |
| Recent activity feed (last 5 agent events) | MEDIUM |
| Compliance alerts (expiring certs/E&O) | MEDIUM |
| Time period filtering | LOW |

### Recommended Layout

Widen content from `max-w-xl` (576px) to `max-w-3xl` (768px) to accommodate:
1. Three hero stat cards in a row
2. Full-width search bar
3. 4-column quick action grid (instead of 2x2)
4. Recent activity feed card

### Architecture Recommendations

| Current | Target |
|---------|--------|
| Inline header | Consider shared `AdminLayout` wrapper |
| Inline card grid JSX | Extract `DashboardNavCard` component |
| Inline stats whisper | Extract `DashboardStats` component |
| Inline search (60+ lines) | Extract `DashboardSearch` component |

---

## 2. Admin Pages — Visual Consistency Findings

### Page Compliance Summary

| Page | File | Lines | AdminLayout | Compliance | Priority |
|------|------|-------|-------------|------------|----------|
| Contracting Queue | `src/pages/admin/ContractingQueuePage.tsx` | 963 | Yes | ~60% | HIGH |
| New Agent | `src/pages/admin/NewAgentPage.tsx` | 360 | Yes | ~65% | MEDIUM |
| RTS Import | `src/pages/admin/RTSImportPage.tsx` | 275 | Yes | ~80% | LOW |

**Gold standard references:** `ContractingTab.tsx` and `AllAgentsPage.tsx` are fully aligned.

---

### Contracting Queue Page

**File:** `src/pages/admin/ContractingQueuePage.tsx` (963 lines)
**Child components:** `ContractingSubmissionDetail.tsx` (408), `CarrierStatusPanel.tsx` (349), `HierarchyAssignmentPanel.tsx` (168)

#### Quick Wins

| # | Element | Line(s) | Current | Target |
|---|---------|---------|---------|--------|
| 1 | Stat cards border | 787, 791 | `border border-border` | `border border-stone-200/50` |
| 2 | Empty state card | 811 | `border border-border` | `border border-stone-200/50` |
| 3 | Ready to Send card | 823 | `border border-border` | `border border-stone-200/50` |
| 4 | Completed card | 862 | `border border-border` | `border border-stone-200/50` |
| 5 | Detail panel border | 161 | `border-l border-border` | `border-l border-stone-200` |
| 6 | Detail header border | 163 | `border-b border-border` | `border-b border-stone-100` |
| 7 | Contact border | 178 | `border-b border-border` | `border-b border-stone-100` |
| 8 | Gray text | CarrierStatusPanel:54 | `text-gray-400` | `text-stone-400` |

#### Medium Refactors

| # | Element | Line(s) | Current | Target |
|---|---------|---------|---------|--------|
| 9 | "Send to Pinnacle" button | 297-302 | Default `Button` (blue) | `bg-stone-900 hover:bg-stone-800 text-white` or gold variant |
| 10 | "KY Default" carrier link | 242-251 | `text-primary hover:bg-primary/10` | `text-amber-700 hover:bg-amber-50` |
| 11 | Document button hover | 216 | `hover:border-primary hover:bg-primary/5` | `hover:border-amber-600 hover:bg-amber-50` |
| 12 | Loader color | 219 | `text-primary` | `text-amber-600` or `text-stone-500` |
| 13 | Carrier name hover | 261 | `group-hover:text-primary` | `group-hover:text-amber-700` |
| 14 | Doc icon hover (Detail) | 267 | `group-hover:text-primary` | `group-hover:text-amber-600` |
| 15 | CarrierStatusPanel cards | 233, 245 | `border border-border rounded-lg bg-card` | `border border-stone-200/50 rounded-xl` |
| 16 | CarrierStatusPanel bg | 268 | `bg-muted/30` | `bg-stone-50/50` |
| 17 | HierarchyAssignmentPanel | 103, 113 | `border border-border rounded-lg bg-card` | `border border-stone-200/50 rounded-xl` |

#### Larger Refactors

| # | Element | Line(s) | Current | Target |
|---|---------|---------|---------|--------|
| 18 | Detail panel glass effect | 161 | `bg-white shadow-xl` | `bg-white/90 backdrop-blur-md shadow-xl` |
| 19 | All `border-border` to warm | Multiple (~10) | Theme default (cool) | `border-stone-200/50` |
| 20 | All `text-primary` hover to amber | Multiple (~5) | Blue primary | `text-amber-700` / `text-amber-600` |

---

### New Agent Page

**File:** `src/pages/admin/NewAgentPage.tsx` (360 lines)

#### Quick Wins

| # | Element | Line(s) | Current | Target |
|---|---------|---------|---------|--------|
| 1 | Form card radius | 190 | `rounded-lg` | `rounded-xl` |
| 2 | Form card border | 190 | `border-border` | `border-border/50` |
| 3 | Form card padding | 190 | `p-4` | `px-5 py-4` |
| 4 | Card header border | 192 | `border-border` | `border-border/50` |
| 5 | Outline button class | 333 | Redundant `border-border` | Remove override |
| 6 | Agent list container | 291 | `rounded-md` | `rounded-lg` |
| 7 | Agent list border | 291 | `border-border` | `border-border/50` |

#### Medium Refactors

| # | Element | Line(s) | Current | Target |
|---|---------|---------|---------|--------|
| 8 | Input focus states | 213, 225, 287 | `focus:border-gold` (custom) | Remove; let Input component default ring handle it |
| 9 | Primary button override | 340 | `bg-gold hover:bg-gold/90 text-white` (flat) | Remove className; use Button default variant |
| 10 | Manager pill borders | 243, 254, 269 | `border-border` | `border-border/50` |
| 11 | Manager pill spacing | 240, 251, 266 | `px-2.5 py-1` | `px-3 py-1.5` |
| 12 | Agent list item spacing | 310 | `px-2.5 py-2` | `px-4 py-3` |
| 13 | Agent list item borders | 310 | Implicit `border-b` | `border-b border-border/30` |
| 14 | Search input height | 287 | `h-9` | `h-10` |

#### Larger Refactors

All `border-border` to `/50` opacity (~8 occurrences) for softer feel.

---

### RTS Import Page

**File:** `src/pages/admin/RTSImportPage.tsx` (275 lines)

This page is the most compliant (~80%). Remaining fixes:

| # | Element | Line(s) | Current | Target |
|---|---------|---------|---------|--------|
| 1 | Upload button radius | 188 | `rounded-xl` | `rounded-2xl` |
| 2 | Success card radius | 165 | `rounded-xl` | `rounded-2xl` |
| 3 | Success card bg | 165 | `bg-green-50 border-green-200` | `bg-green-50/40 border-green-200/60` |
| 4 | Success icon bg | 166 | `bg-green-100` | `bg-green-100/50` |
| 5 | Error card radius | 221 | `rounded-xl` | `rounded-2xl` |
| 6 | Error card bg | 221 | `bg-red-50 border-red-200` | `bg-red-50/40 border-red-200/60` |
| 7 | Calendar header | 246 | `text-white text-center py-2` | Add `font-medium uppercase tracking-wide text-sm` |
| 8 | Calendar border | 239 | `border-border` | `border-stone-200` |

**Note:** Page title uses `font-serif font-medium` (line 140) — acceptable, but `font-semibold` would match other admin pages better.

---

### Cross-Page Patterns to Fix

These issues span multiple files and should be addressed systematically:

#### `border-border` to warm borders
All pages use `border-border` (neutral gray). Target: `border-stone-200/50` or `border-border/50`.

**Files affected:**
- `ContractingQueuePage.tsx` (~10 instances)
- `NewAgentPage.tsx` (~8 instances)
- `RTSImportPage.tsx` (~2 instances)
- `CarrierStatusPanel.tsx` (~3 instances)
- `HierarchyAssignmentPanel.tsx` (~2 instances)

#### Blue `text-primary` / `bg-primary` to warm
Interactive elements using blue should shift to amber/stone.

**Files affected:**
- `ContractingQueuePage.tsx` (~5 instances)
- `ContractingSubmissionDetail.tsx` (~1 instance)

#### `rounded-lg` to `rounded-xl`
Cards and containers should use the larger border radius.

**Files affected:**
- `NewAgentPage.tsx` (form card, dropdown)
- `CarrierStatusPanel.tsx` (panels)
- `HierarchyAssignmentPanel.tsx` (panels)

#### `gray-*` to `stone-*`
Any Tailwind `gray` class should be converted to `stone` for warmth.

**Files affected:**
- `CarrierStatusPanel.tsx` (`text-gray-400` on line 54)

---

## 3. Quick Style Reference

Trimmed reference for the most useful admin page patterns. For full design tokens (colors, typography scale, brand values), see HOMESTEAD.md.

### AdminLayout

```tsx
<AdminLayout
  showBackButton
  backLabel="Dashboard"
  onBack={() => navigate('/admin')}
  maxWidth="default"  // "narrow" (768px) | "default" (1152px) | "wide" (1280px)
>
```

Dashboard does NOT use AdminLayout — it has its own header with full Tyler logo.

### Card Patterns

```tsx
// Standard card
"bg-white border border-stone-200/50 rounded-xl p-5"

// Card with header
<Card className="bg-white border border-stone-200/50 rounded-xl">
  <CardHeader className="pb-3">...</CardHeader>
  <CardContent>...</CardContent>
</Card>

// Interactive tile
"group cursor-pointer hover:border-amber-200/50 hover:shadow-md transition-all"
```

### Spacing

| Context | Pattern |
|---------|---------|
| Page content padding | `px-6 py-8` |
| Between sections | `mb-6` or `mb-8` |
| Between cards | `gap-4` (target `gap-5`) |
| Within cards | `space-y-4` or `space-y-2` |
| Form fields | `space-y-4` |
| Title to content | `mb-4` to `mb-6` |
| Section header to content | `mb-3` |

### Shadows

| Context | Pattern |
|---------|---------|
| Card resting | `shadow-sm` |
| Card hover | `hover:shadow-md` |
| Dropdown / overlay | `shadow-xl` |
| Brand avatar | `shadow-lg shadow-amber-500/20` |

### Status Indicators

```tsx
// Status dots
<span className="w-2.5 h-2.5 rounded-full bg-green-500" />   // active
<span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />   // pending
<span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/40" /> // inactive

// Status badges
"px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700"  // success
"px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700"  // warning
"px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600"    // neutral
```

### Tables

```tsx
<div className="border border-stone-200/50 rounded-xl bg-white overflow-hidden">
  <Table>
    <TableHeader className="sticky top-0 z-10">
      <TableRow className="bg-muted hover:bg-muted">
        <TableHead className="px-3 py-3 font-medium text-muted-foreground bg-muted">
          Column
        </TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow className="cursor-pointer hover:bg-muted/50">
        <TableCell className="px-3 py-3">Content</TableCell>
      </TableRow>
    </TableBody>
  </Table>
</div>
```

---

## 4. Open Action Items

### Phase 1: Quick Wins (~15 min)
All border, radius, and opacity class string updates. No logic changes.

- [ ] Replace `border-border` with `border-stone-200/50` across all admin pages (~25 instances)
- [ ] Replace `rounded-lg` with `rounded-xl` on cards across all admin pages (~8 instances)
- [ ] Add `shadow-sm` to dashboard nav cards (4 cards, lines :325, :341, :362, :378)
- [ ] Fix hardcoded hex colors in `AdminDashboard.tsx` header (4 values, lines :192-198)
- [ ] Replace `text-gray-400` with `text-stone-400` in `CarrierStatusPanel.tsx` line 54
- [ ] Soften RTS Import success/error card backgrounds to `/40` opacity (lines :165, :221)

### Phase 2: Interactive Color Alignment (~15 min)

- [ ] Convert blue `text-primary` hover states to `text-amber-700` in ContractingQueuePage (~5 instances)
- [ ] Convert blue `text-primary` in ContractingSubmissionDetail (~1 instance)
- [ ] Update "Send to Pinnacle" button to `bg-stone-900` or gold variant (lines :297-302)
- [ ] Update "KY Default" carrier link to `text-amber-700 hover:bg-amber-50` (lines :242-251)
- [ ] Fix dashboard search avatars from blue to warm amber gradient (line :261)
- [ ] Fix dashboard search focus ring to amber (line :236)
- [ ] Replace raw `<button>` mode toggle with `<Button variant="ghost">` (lines :202-207)

### Phase 3: Child Component Consistency (~10 min)

- [ ] Update `CarrierStatusPanel.tsx` — warm borders, `rounded-xl`, `bg-stone-50/50` (lines :233, :245, :268)
- [ ] Update `HierarchyAssignmentPanel.tsx` — warm borders, `rounded-xl` (lines :103, :113)
- [ ] Update `ContractingSubmissionDetail.tsx` — warm borders, amber hover states
- [ ] Add glass effect to detail panel: `bg-white/90 backdrop-blur-md` (line :161)

### Phase 4: Input & Focus States (~5 min)

- [ ] Remove custom `focus:border-gold` overrides in `NewAgentPage.tsx` (lines :213, :225, :287) — let component defaults handle focus
- [ ] Remove `bg-gold hover:bg-gold/90` override on primary button in `NewAgentPage.tsx` (line :340)
- [ ] Update search input height from `h-9` to `h-10` in `NewAgentPage.tsx` (line :287)

### Phase 5: Dashboard Content Elevation (Larger Effort)

- [ ] Extract search into `DashboardSearch` component
- [ ] Extract nav cards into `DashboardNavCard` component
- [ ] Replace stats whisper line with hero stat cards (Total Agents, Pending, Expiring Certs)
- [ ] Add personalized greeting with date context
- [ ] Widen content area from `max-w-xl` to `max-w-3xl`
- [ ] Expand nav grid from 2x2 to 4-column
- [ ] Add recent activity feed section
- [ ] Add compliance alerts (expiring certs/E&O)
- [ ] Consider migrating dashboard to use `AdminLayout`

### Already-Compliant Components (Reference Implementations)

| Component | File | Why |
|-----------|------|-----|
| ContractingTab | `src/components/admin/agent-profile/tabs/ContractingTab.tsx` | Stone-900 text, stone-200/50 borders, amber-700 accent |
| AdminLayout | `src/components/layout/AdminLayout.tsx` | Warm gradient, glass header, stone nav text |
| AllAgentsPage | `src/pages/admin/AllAgentsPage.tsx` | Recently redesigned with Apple-inspired tokens |
