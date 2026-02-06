# All Agents Page — Design Revamp Audit

**Files analyzed:** February 5, 2026
**Goal:** Align with Apple-inspired dashboard aesthetic (warm gradients, glass morphism, gold accents)

---

## 1. Component File Paths

| File | Lines | Role |
|------|-------|------|
| `src/pages/admin/AgentsPage.tsx` | 29 | Route wrapper (auth gate + redirect logic) |
| `src/components/layout/AdminLayout.tsx` | 55 | Shared header/footer/background shell |
| `src/components/admin/AllAgentsTab.tsx` | 943 | Main content (filters, table, quick view, bulk actions) |
| `src/components/admin/AssignManagerModal.tsx` | 411 | Manager assignment dialog |

---

## 2. Current Structure

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

---

## 3. Visual Audit

### Current Styling (Element by Element)

#### AdminLayout Shell
| Element | Current Classes | Issue |
|---------|----------------|-------|
| Page bg | `bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]` | ❌ Old gradient, dashboard now uses `from-amber-50/80 via-orange-50/40 to-stone-100` |
| Header bg | `bg-white/70 backdrop-blur-xl border-b border-gray-200/50` | ❌ Dashboard uses `bg-white/60 border-white/80` |
| Back link | `text-blue-600 hover:text-blue-700` | ❌ Cold blue, should use stone/warm tones |
| Back text | `font-medium` (plain) | ❌ No logo mark; dashboard has amber gradient "T" icon |
| Footer text | `text-[#5c5552]/50` hardcoded | ⚠️ Should be `text-stone-400` |
| No texture overlay | — | ❌ Dashboard has subtle dot-grid texture |

#### Filter Bar
| Element | Current Classes | Issue |
|---------|----------------|-------|
| Search input | `pl-10 h-10 border-border` | ❌ Plain white box, dashboard search is glass card |
| Search icon | `text-muted-foreground/70` | ⚠️ Should be `text-stone-400` |
| Select triggers | `w-[130px] h-10 border-border` | ❌ Standard shadcn selects, no glass effect |
| Export button | `variant="outline" size="sm"` | ⚠️ Generic outline style |
| Filter row | `flex gap-3` | ⚠️ No section label above |

#### Table Container
| Element | Current Classes | Issue |
|---------|----------------|-------|
| Container | `border border-border rounded-lg bg-white overflow-hidden` | ❌ `rounded-lg` → should be `rounded-2xl`; no glass effect |
| Header row | `bg-muted hover:bg-muted` | ⚠️ Generic muted bg, could use `bg-stone-50/80` |
| Header cells | `font-medium text-muted-foreground bg-muted` | ⚠️ Should use stone palette |
| Data rows | `hover:bg-muted/50` | ❌ Should use warm hover: `hover:bg-amber-50/30` |
| Selected row | `bg-primary/5` | ❌ Blue tint; should be amber: `bg-amber-50/50` |
| Cell text | `text-muted-foreground`, `text-foreground` | ⚠️ Should explicitly use `text-stone-*` |
| Name cell | `font-medium text-foreground` | ✅ Acceptable but could use `text-stone-900` |
| Border colors | `border-border`, `border-t border-border` | ⚠️ Should be `border-stone-200/50` |

#### Status Dots
| Status | Current | Issue |
|--------|---------|-------|
| Imported | `bg-muted-foreground/40` | ⚠️ Could be `bg-stone-300` |
| Invited | `bg-yellow-400` | ⚠️ Slightly harsh, could be `bg-amber-400` |
| Active | `bg-green-500` | ✅ OK, matches design system |
| Dot size | `w-2.5 h-2.5` | ✅ OK |

#### Pagination
| Element | Current Classes | Issue |
|---------|----------------|-------|
| Container | `px-4 py-3 border-t border-border bg-muted/50` | ⚠️ Generic muted bg |
| Page buttons (current) | `variant="default"` (blue bg) | ❌ Should use amber/gold accent |
| Page buttons (other) | `variant="ghost"` | ✅ OK |
| Info text | `text-sm text-muted-foreground` | ⚠️ Should be `text-stone-500` |

#### Quick View Panel
| Element | Current Classes | Issue |
|---------|----------------|-------|
| Container | `border border-border rounded-lg bg-muted/30` | ❌ `rounded-lg` → `rounded-2xl`; should be glass |
| Header bg | `bg-white` | ⚠️ Should be `bg-white/80 backdrop-blur-sm` |
| Section borders | `border-t border-border` | ⚠️ Should be `border-stone-200/50` |
| Action buttons | Default shadcn blue primary | ❌ Primary should be amber/gold |
| A&A badge | `bg-gold/10 text-gold` | ✅ Already matches gold accent |
| Detail labels | `text-muted-foreground` | ⚠️ Should be `text-stone-500` |
| Detail values | `text-foreground font-medium` | ⚠️ Should be `text-stone-900 font-medium` |

#### Bulk Action Bar
| Element | Current Classes | Issue |
|---------|----------------|-------|
| Container | `bg-primary/10 border border-primary/20 rounded-lg p-3` | ❌ Blue tint; should be warm: `bg-amber-50/80 border-amber-200/50 rounded-2xl` |
| Action buttons | Blue default variant | ❌ Should use stone/amber styling |

---

## 4. Interactions Summary

| Interaction | How It Works | Status |
|-------------|-------------|--------|
| Search | Debounced text filter across name/email/NPN | ✅ Working |
| Status filter | Dropdown: All/Imported/Invited/Active | ✅ Working |
| Manager filter | Dropdown: All/A&A/specific managers/Direct to TIG | ✅ Working |
| State filter | Dropdown: All + dynamic state list | ✅ Working |
| Row click | Opens quick view side panel | ✅ Working |
| Checkbox select | Individual + select all on page + select all filtered | ✅ Working |
| Bulk assign manager | Opens AssignManagerModal | ✅ Working |
| Bulk send setup links | Calls edge function per agent, shows toast | ✅ Working |
| Copy invite link | Generates signed URL, clipboard copy | ✅ Working |
| Export | Dynamic XLSX import, downloads Excel | ✅ Working |
| Pagination | 25/page, URL-persisted, smart ellipsis | ✅ Working |
| View full profile | Navigates to `/admin/agents/{id}` | ✅ Working |

All functionality is solid — this is purely a visual revamp.

---

## 5. Agent Row Structure (Current JSX)

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
    {managerName || <span className="inline-flex items-center gap-1.5 text-muted-foreground/60 italic">
      <Building2 className="w-3.5 h-3.5" /> Direct to TIG
    </span>}
  </TableCell>
  <TableCell className="px-3 py-3 text-center">
    <StatusDot status={getAgentStatus(agent)} />
  </TableCell>
</TableRow>
```

---

## 6. Elements Needing Updates

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
| 14 | Search input | Plain `border-border` | Glass card wrapper like dashboard: `bg-white/70 rounded-xl border-white/80` |
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

## 7. Revamp Approach Recommendations

### Option A: Update AdminLayout First (Recommended)

Since AdminLayout wraps ALL admin sub-pages (Agents, Contracting, RTS Import, Agent Profile, Activity Log), updating it first creates the most impact with the least code change:

1. **AdminLayout.tsx** — Match dashboard gradient, header glass effect, logo mark, texture overlay
2. **AllAgentsTab.tsx** — Update table container, row styles, filters, quick view
3. **AssignManagerModal.tsx** — Already uses gold accents, minimal updates needed

**Pros:** Every admin page immediately gets the new look. Consistent foundation.
**Cons:** May require checking other admin pages for visual conflicts.

### Option B: Self-Contained Agents Page

Give AgentsPage its own full-page layout (bypass AdminLayout), similar to how AdminDashboard manages its own shell.

**Pros:** Full control, no risk of breaking other pages.
**Cons:** Duplicated header/footer code, other admin pages stay outdated.

### Recommendation: Option A

Update AdminLayout first to bring ALL admin pages to the new baseline, then refine AllAgentsTab-specific elements. The dashboard already diverges from AdminLayout (it has its own header), so updating AdminLayout to match the dashboard unifies the design language.

### Key Design Decisions Needed

1. **Table vs. Cards** — Keep the table format (data-dense, functional for 100+ agents) or switch to card grid?
   - **Recommendation:** Keep table. It's the right pattern for roster management. Just restyle it.

2. **Quick View Panel** — Keep as right sidebar or switch to slide-over drawer?
   - **Recommendation:** Keep as sidebar. It works well and avoids modals.

3. **Filter bar** — Keep horizontal row or move to collapsible panel?
   - **Recommendation:** Keep horizontal. Add glass card wrapper for polish.

4. **Pagination style** — Numbered buttons or infinite scroll?
   - **Recommendation:** Keep numbered pagination. Clean, predictable, URL-persisted.
