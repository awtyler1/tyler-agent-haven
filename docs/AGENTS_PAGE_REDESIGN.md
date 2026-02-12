# Agents Page Redesign
> Consolidated from AGENTS_PAGE_REDESIGN.md, ALL_AGENTS_REVAMP_AUDIT.md — February 2026

---

## 1. Current Page Architecture

### Component File Map

| File | Lines | Role |
|------|-------|------|
| `src/pages/admin/AgentsPage.tsx` | 29 | Route wrapper (auth gate + redirect logic) |
| `src/components/layout/AdminLayout.tsx` | 55 | Shared header/footer/background shell |
| `src/components/admin/AllAgentsTab.tsx` | 943 | Main content (filters, table, quick view, bulk actions) |
| `src/components/admin/AssignManagerModal.tsx` | 411 | Manager assignment dialog |

### Layout Hierarchy

```
AgentsPage.tsx
└── AdminLayout (header + gradient bg + footer)
    └── AllAgentsTab
        ├── Filter Bar (search + 3 dropdowns + export btn)
        ├── Bulk Action Bar (conditional)
        ├── Main Content Area (flex row)
        │   ├── Table Container (flex-1)
        │   │   ├── Select-All Banner (conditional)
        │   │   ├── Scrollable Table
        │   │   │   ├── Sticky Header Row
        │   │   │   └── Agent Rows (25 per page)
        │   │   └── Pagination Footer
        │   └── Quick View Panel (w-80, conditional)
        │       ├── Header (name + close)
        │       ├── Contact Info (phone, email)
        │       ├── Details (NPN, state, manager, status, created)
        │       └── Quick Actions (4 buttons)
        └── AssignManagerModal (dialog)
```

### ASCII Layout Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│ ← Admin Dashboard                                      [Avatar] │  ← AdminLayout header
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ [Export] │  ← filter bar
│  │🔍 Search 127…│ │All Status│ │All Mgrs  │ │All State│          │
│  └──────────────┘ └──────────┘ └──────────┘ └────────┘          │
│                                                                  │
│  ┌─ 3 agents selected ─── [Clear] ──── [Assign Mgr] [Send] ──┐ │  ← bulk bar (conditional)
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌───────────────────────────────────────────┐ ┌──────────────┐ │
│  │ ☐ │ Name      │ Phone    │ Email  │Mgr│St│ │ Quick View   │ │
│  ├───┼───────────┼──────────┼────────┼───┼──┤ │              │ │
│  │ ☐ │ Jane Doe  │555-1234  │j@e.com │EP │🟢│ │ Jane Doe     │ │
│  │ ☐ │ Bob Smith │555-5678  │b@e.com │TO │🟡│ │ ────────     │ │
│  │ ☑ │ Kim Lee   │555-9012  │k@e.com │—  │⚪│ │ 📞 555-1234  │ │
│  │ ☐ │ ...       │...       │...     │...│..│ │ ✉️ j@e.com   │ │
│  │   │           │          │        │   │  │ │ ────────     │ │
│  │   │           │          │        │   │  │ │ NPN: 12345   │ │
│  │   │           │          │        │   │  │ │ State: KY    │ │
│  │   │           │          │        │   │  │ │ Mgr: E.Price │ │
│  │   │           │          │        │   │  │ │ 🟢 Active    │ │
│  │   │           │          │        │   │  │ │ ────────     │ │
│  │   │           │          │        │   │  │ │ [Copy Link]  │ │
│  │   │           │          │        │   │  │ │ [View Prof]  │ │
│  │   │           │          │        │   │  │ │ [Assign Mgr] │ │
│  │   │           │          │        │   │  │ │ [Send Setup] │ │
│  ├───────────────────────────────────────────┤ └──────────────┘ │
│  │ Showing 1-25 of 127        ◁ 1 2 3 … 6 ▷│                   │  ← pagination
│  └───────────────────────────────────────────┘                   │
│                                                                  │
│              Powered by Tyler Insurance Group                    │  ← footer
└──────────────────────────────────────────────────────────────────┘
```

### Current Agent Row JSX

```tsx
<TableRow
  className={`cursor-pointer hover:bg-muted/50 ${
    selectedAgent?.id === agent.id ? 'bg-primary/5' : ''
  } ${selectedIds.has(agent.id) ? 'bg-primary/5' : ''}`}
  onClick={() => handleRowClick(agent)}
>
  <TableCell className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
    <Checkbox checked={selectedIds.has(agent.id)} onCheckedChange={() => toggleSelect(agent.id)} />
  </TableCell>
  <TableCell className="px-3 py-3 font-medium text-foreground">
    {agent.full_name || '—'}
  </TableCell>
  <TableCell className="px-3 py-3 text-muted-foreground whitespace-nowrap">
    {formatPhone(agent.phone) || '—'}
  </TableCell>
  <TableCell className="px-3 py-3 text-muted-foreground">
    {agent.email || '—'}
  </TableCell>
  <TableCell className="px-3 py-3 text-muted-foreground">
    {managerName || <span className="inline-flex items-center gap-1.5
      text-muted-foreground/60 italic">
      <Building2 className="w-3.5 h-3.5" /> Direct to TIG
    </span>}
  </TableCell>
  <TableCell className="px-3 py-3 text-center">
    <StatusDot status={getAgentStatus(agent)} />
  </TableCell>
</TableRow>
```

### Interactions (All Working)

| Interaction | How It Works |
|-------------|-------------|
| Search | Debounced text filter across name/email/NPN |
| Status filter | Dropdown: All/Imported/Invited/Active |
| Manager filter | Dropdown: All/A&A/specific managers/Direct to TIG |
| State filter | Dropdown: All + dynamic state list |
| Row click | Opens quick view side panel |
| Checkbox select | Individual + select all on page + select all filtered |
| Bulk assign manager | Opens AssignManagerModal |
| Bulk send setup links | Calls edge function per agent, shows toast |
| Copy invite link | Generates signed URL, clipboard copy |
| Export | Dynamic XLSX import, downloads Excel |
| Pagination | 25/page, URL-persisted, smart ellipsis |
| View full profile | Navigates to `/admin/agents/{id}` |

All functionality is solid. The remaining work is visual styling and optional feature additions.

---

## 2. Visual Audit Findings (February 5, 2026)

Goal: Align with Apple-inspired dashboard aesthetic (warm gradients, glass morphism, gold accents).

### Tier 1: AdminLayout Shell (affects ALL admin pages)

| # | Element | Current | Target |
|---|---------|---------|--------|
| 1 | Page gradient | `from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]` | `from-amber-50/80 via-orange-50/40 to-stone-100` |
| 2 | Texture overlay | None | Add dot-grid overlay div (matching dashboard) |
| 3 | Header bg | `bg-white/70 border-gray-200/50` | `bg-white/60 border-white/80` |
| 4 | Back link | Blue text `text-blue-600` | Add logo mark + use `text-stone-600 hover:text-stone-900` |
| 5 | Footer color | `text-[#5c5552]/50` hardcoded | `text-stone-400` |

### Tier 2: Table & Container (AllAgentsTab)

| # | Element | Current | Target |
|---|---------|---------|--------|
| 6 | Table container | `rounded-lg bg-white border-border` | `rounded-2xl bg-white/80 backdrop-blur-sm border-white/60 shadow-sm` |
| 7 | Header cells bg | `bg-muted` | `bg-stone-50/80` |
| 8 | Header text | `text-muted-foreground` | `text-stone-500 text-xs uppercase tracking-wider font-medium` |
| 9 | Row hover | `hover:bg-muted/50` | `hover:bg-amber-50/30` |
| 10 | Selected row | `bg-primary/5` (blue) | `bg-amber-50/50` (warm) |
| 11 | Cell borders | `border-border` | `border-stone-100` |
| 12 | Cell text | `text-muted-foreground` | `text-stone-600` |
| 13 | Name text | `text-foreground` | `text-stone-900` |

### Tier 3: Filter Bar

| # | Element | Current | Target |
|---|---------|---------|--------|
| 14 | Search input | Plain `border-border` | Glass card wrapper: `bg-white/70 rounded-xl border-white/80` |
| 15 | Filter selects | Standard shadcn borders | `border-stone-200/50 rounded-xl` |
| 16 | Section label | None | Add `text-xs text-stone-400 uppercase tracking-wider font-medium` label above |
| 17 | Export btn | Generic outline | `text-stone-600 hover:bg-stone-100/80` |

### Tier 4: Quick View Panel

| # | Element | Current | Target |
|---|---------|---------|--------|
| 18 | Panel container | `rounded-lg bg-muted/30 border-border` | `rounded-2xl bg-white/80 backdrop-blur-sm border-white/60 shadow-lg` |
| 19 | Panel header | `bg-white` | `bg-white/90 backdrop-blur-sm` |
| 20 | Section borders | `border-border` | `border-stone-100` |
| 21 | Detail labels | `text-muted-foreground` | `text-stone-500` |
| 22 | Detail values | `text-foreground` | `text-stone-900` |
| 23 | Primary action btn | Blue | Amber/gold gradient or `bg-stone-900 text-white` |
| 24 | Contact icons | `text-muted-foreground` | `text-stone-400` |

### Tier 5: Bulk Action Bar & Pagination

| # | Element | Current | Target |
|---|---------|---------|--------|
| 25 | Bulk bar | `bg-primary/10 border-primary/20 rounded-lg` | `bg-amber-50/80 border-amber-200/50 rounded-2xl` |
| 26 | Bulk text | `text-foreground` | `text-stone-700` |
| 27 | Bulk btns | Blue primary | Stone/warm accent |
| 28 | Pagination bg | `bg-muted/50` | `bg-stone-50/50` |
| 29 | Current page btn | Blue `variant="default"` | Amber/gold accent or `bg-stone-900 text-white` |
| 30 | Pagination text | `text-muted-foreground` | `text-stone-500` |

### Tier 6: Status Dots & Badges

| # | Element | Current | Target |
|---|---------|---------|--------|
| 31 | Imported dot | `bg-muted-foreground/40` | `bg-stone-300` |
| 32 | Invited dot | `bg-yellow-400` | `bg-amber-400` |
| 33 | "Direct to TIG" | `text-muted-foreground/60 italic` | `text-stone-400 italic` |

---

## 3. Redesign Spec (Pending Items)

The original Jan 18 spec proposed a hierarchical tree table and MGA drill-down view. The actual implementation (audited Feb 5) went with a flat table + filters approach, which the audit recommends keeping. The following items from the original spec remain **relevant and pending**.

### 3.1 Stats Bar

Not yet implemented. Would add a summary row above the filter bar.

```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ 127      │ │ 5        │ │ 12       │ │ 110      │
│ Total    │ │ MGAs     │ │ GAs      │ │ Agents   │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

| Stat | Value | Icon | Color |
|------|-------|------|-------|
| Total | Count of all active profiles | Users | Gold |
| MGAs | Profiles with downline, no upline | Building2 | Gold |
| GAs | Profiles with downline AND upline | Shield | Amber |
| Agents | Profiles with no downline | User | Blue |

**Component:**
```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
  <StatCard icon={Users} value={127} label="Total" />
  <StatCard icon={Building2} value={5} label="MGAs" />
  <StatCard icon={Shield} value={12} label="GAs" />
  <StatCard icon={User} value={110} label="Agents" />
</div>
```

**Stats Calculation:**
```typescript
function calculateStats(profiles: ProfileWithRole[]) {
  const managersWithDownline = new Set<string>();
  profiles.forEach(p => {
    if (p.manager_id) managersWithDownline.add(p.manager_id);
  });
  return {
    total: profiles.length,
    mgaCount: profiles.filter(p => !p.manager_id && managersWithDownline.has(p.id)).length,
    gaCount: profiles.filter(p => p.manager_id && managersWithDownline.has(p.id)).length,
    agentCount: profiles.filter(p => !managersWithDownline.has(p.id)).length,
  };
}
```

### 3.2 View Toggle (Tree vs Flat)

The current flat list works well for roster management. An optional tree view toggle could be added to visualize hierarchy on demand.

**Proposed UX:**
- Right side of filter bar: `[ List | Tree ]` toggle
- Default: List (current behavior)
- Tree mode: expand/collapse rows grouped by MGA > GA > Agent

**Tree mode indentation:**
- MGA: 0px indent
- GA: 24px indent
- Agent under GA: 48px indent
- Agent under MGA (direct): 24px indent

**Expand/collapse behavior:**
- Initial state: All MGAs collapsed
- Click chevron to expand/collapse
- Click row body to open quick view (same as flat mode)
- Search/filter reset expansion state

This is a **nice-to-have**; the flat table with manager filter covers most use cases.

### 3.3 Mobile Responsive Improvements

Not fully audited but the original spec had responsive breakpoints:

**< 768px (mobile):**
- Stats bar: 2x2 grid
- Table columns: Name, Status only
- Upline shown as subtitle under name

**768px - 1024px (tablet):**
- Stats bar: 4 columns
- Table columns: Name, Type, Status, Actions

**> 1024px (desktop):**
- Full table with all columns

### 3.4 Design Tokens (Reference)

```css
/* Backgrounds */
--bg-page: linear-gradient(to-br, amber-50/80, orange-50/40, stone-100)
--bg-card: white/80 with backdrop-blur-sm
--bg-muted: stone-50/80

/* Borders */
--border-default: stone-200/50
--border-hover: amber-200/50

/* Gold Accent */
--gold: hsl(43, 56%, 41%)
--gold-light: amber-50/80
--gold-hover: amber-50/30

/* Text */
--text-primary: stone-900
--text-secondary: stone-600
--text-muted: stone-500
--text-faint: stone-400
```

### 3.5 Hover & Interaction States

| Element | Hover Effect |
|---------|--------------|
| Table row | `hover:bg-amber-50/30` (warm highlight) |
| Clickable name | `text-stone-900` to gold accent on hover |
| Action button | `hover:bg-stone-100/80` |
| Card | `shadow-md`, `border-amber-200/50`, `-translate-y-0.5` |
| Quick view panel | Static (no hover effect on container) |

### 3.6 Loading States

**Initial load:**
```
┌─────────────────────────────────────┐
│  [Skeleton stats bar - 4 cards]     │
│  [Skeleton search bar]              │
│  [Skeleton table rows x 5]         │
└─────────────────────────────────────┘
```

**Row expanding (tree mode):**
- Show spinner in chevron position
- Disable row interactions until loaded

---

## 4. Key Design Decisions

These were surfaced during the audit and remain open or have recommendations.

| Decision | Options | Recommendation |
|----------|---------|----------------|
| Table vs Cards | Keep flat table or switch to card grid | **Keep table.** Data-dense, functional for 100+ agents. Restyle it. |
| Quick View Panel | Keep as sidebar or switch to slide-over drawer | **Keep sidebar.** Works well, avoids modals. |
| Filter bar layout | Keep horizontal or move to collapsible panel | **Keep horizontal.** Add glass card wrapper for polish. |
| Pagination style | Numbered buttons or infinite scroll | **Keep numbered.** Clean, predictable, URL-persisted. |
| AdminLayout update approach | Update shared shell (Option A) vs. self-contained page (Option B) | **Option A.** Update AdminLayout first to bring all admin pages to new baseline, then refine AllAgentsTab. |

### Why Option A (Update AdminLayout First)

AdminLayout wraps ALL admin sub-pages (Agents, Contracting, RTS Import, Agent Profile, Activity Log). Updating it first creates the most impact with the least code change:

1. **AdminLayout.tsx** — Match dashboard gradient, header glass effect, logo mark, texture overlay
2. **AllAgentsTab.tsx** — Update table container, row styles, filters, quick view
3. **AssignManagerModal.tsx** — Already uses gold accents, minimal updates needed

**Risk:** May require checking other admin pages for visual conflicts after the AdminLayout update.

---

## 5. Open Action Items

### Visual Revamp (Priority Order)

- [ ] **AdminLayout shell** — Update page gradient, header bg, back link styling, footer color, add texture overlay (Tier 1, items 1-5)
- [ ] **Table container & rows** — Update border radius, glass effect, header cells, row hover/selected states, cell text colors (Tier 2, items 6-13)
- [ ] **Filter bar** — Glass card wrapper for search, update select borders, add section label, restyle export button (Tier 3, items 14-17)
- [ ] **Quick view panel** — Glass container, backdrop-blur header, update borders/labels/values/buttons/icons (Tier 4, items 18-24)
- [ ] **Bulk action bar & pagination** — Warm color scheme for bulk bar, amber/gold pagination accent, update text colors (Tier 5, items 25-30)
- [ ] **Status dots & badges** — Minor color refinements: imported, invited, Direct to TIG text (Tier 6, items 31-33)

### Feature Additions (Lower Priority)

- [ ] **Stats bar** — Add 4-card summary row above filter bar showing Total/MGAs/GAs/Agents counts
- [ ] **Tree view toggle** — Optional hierarchy visualization (List | Tree toggle in filter bar)
- [ ] **Mobile responsive** — Audit and implement responsive breakpoints for table columns
- [ ] **Loading skeletons** — Add skeleton states for initial page load

### Open Questions

1. **Bulk actions expansion** — Should we add more bulk operations beyond assign manager and send setup link?
2. **Export enhancements** — Should export include additional fields or filtering?
3. **Inline editing** — Should status/upline be editable inline or always require navigating to profile?
4. **Pagination vs Virtualization** — For 200+ agents, should we switch to virtualized scrolling?
5. **Real-time updates** — Should we subscribe to profile changes via Supabase realtime?
6. **Cross-page audit** — After AdminLayout update, which other admin pages need follow-up styling fixes?

---

### Superseded Items (Removed from Original Spec)

The following items from the Jan 18 spec were superseded by the actual implementation direction and are no longer planned:

- **Hierarchical tree table as default view** — Replaced by flat table + manager filter dropdown
- **MGA Detail View (two-column drill-down)** — Not needed; quick view panel + manager filter serve the same purpose
- **AgentHierarchyTable / AgentHierarchyRow components** — Not built; AllAgentsTab handles everything
- **SubTeamCard / DirectAgentList / MGADetailView components** — Not built; flat table approach preferred
- **TeamCards.tsx / TeamDrilldown.tsx removal** — These were already removed in an earlier refactor
- **Three-mode view switcher (teams/myteam/list)** — Replaced by single flat table with filters
