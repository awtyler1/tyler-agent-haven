# Agents Page Redesign Specification

**Date:** 2026-01-18
**Version:** 1.0
**Status:** Draft

---

## 1. Current State

### 1.1 Existing Pages
- **AgentsPage.tsx** - Top-level agents view with three modes:
  - `teams` view - Shows MGA tiles using TeamCards component
  - `myteam` view - Shows logged-in manager's team using TeamDrilldown
  - `list` view - Flat list of all agents

- **TeamCards.tsx** - Grid/list of MGA tiles with "Direct to TIG" section
- **TeamDrilldown.tsx** - Detailed view of a single MGA's hierarchy

### 1.2 Current Pain Points

| Issue | Impact |
|-------|--------|
| **Inconsistent navigation** | Clicking tiles goes to drilldown, clicking names goes to profile - confusing |
| **Count confusion** | "Total Agents" vs "downline" vs "agents" terminology is unclear |
| **No scalability** | Card grid doesn't scale well with 50+ MGAs |
| **Wasted space** | Large tiles with minimal information |
| **Two-click depth** | Must drill into MGA, then click agent to see profile |
| **No bulk actions** | Can't select multiple agents for operations |
| **Poor search** | Search only filters visible tiles, not deep agent search |

### 1.3 Current Flow
```
AgentsPage (tiles)
    └─> Click MGA tile
        └─> TeamDrilldown (GA sections + agents)
            └─> Click agent row
                └─> AgentProfilePage
```

---

## 2. Design Principles

### 2.1 TIG Brand Identity
- **Warm, professional palette:** Cream backgrounds, gold accents
- **Serif headings:** Playfair Display for elegance
- **Generous whitespace:** Premium feel, not cramped
- **Subtle shadows:** Depth without heaviness
- **Gold hover states:** Consistent interaction feedback

### 2.2 Design Tokens (Existing)
```css
/* Backgrounds */
--bg-page: linear-gradient(to-br, #FEFDFB, #FDFBF7, #FAF8F3)
--bg-card: white
--bg-muted: rgba(0,0,0,0.03)

/* Borders */
--border-default: #E5E2DB
--border-hover: rgba(var(--gold), 0.3)

/* Gold Accent */
--gold: hsl(43, 56%, 41%)
--gold-light: rgba(var(--gold), 0.1)
--gold-hover: rgba(var(--gold), 0.05)

/* Text */
--text-primary: foreground
--text-muted: muted-foreground
```

### 2.3 Consistency Rules
1. All admin pages use same page wrapper structure
2. Stats bars use same card pattern across views
3. Tables use consistent column alignment and hover states
4. Buttons follow established variant hierarchy
5. Status badges use same color mapping everywhere

---

## 3. Agents Page (Top Level)

### 3.1 Layout Wireframe

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [Navigation Bar]                                                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Agents                                           [+ Add Agent] button   │
│  Manage your organization's agent hierarchy                              │
│                                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                    │
│  │ 47       │ │ 5        │ │ 12       │ │ 30       │                    │
│  │ Total    │ │ MGAs     │ │ GAs      │ │ Agents   │                    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘                    │
│                                                                          │
│  ┌─────────────────────────────────┐  ┌─────────┐  ┌─────────┐          │
│  │ 🔍 Search agents...             │  │ Filter ▼│  │ ☰  ▦   │          │
│  └─────────────────────────────────┘  └─────────┘  └─────────┘          │
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ Name                │ Role      │ Upline     │ Status    │        │  │
│  ├───────────────────────────────────────────────────────────────────┤  │
│  │ ▶ MGA Alpha         │ MGA       │ —          │ Active    │   →    │  │
│  │   └─ GA Beta        │ GA        │ MGA Alpha  │ Active    │   →    │  │
│  │      └─ Agent 1     │ Agent     │ GA Beta    │ Appointed │   →    │  │
│  │      └─ Agent 2     │ Agent     │ GA Beta    │ Pending   │   →    │  │
│  │   └─ Agent 3        │ Agent     │ MGA Alpha  │ Appointed │   →    │  │
│  │ ▶ MGA Charlie       │ MGA       │ —          │ Active    │   →    │  │
│  │ ▶ Direct to TIG (3) │ —         │ TIG        │ —         │   →    │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  [Footer]                                                                │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Stats Bar Specification

| Stat | Value | Icon | Color |
|------|-------|------|-------|
| Total | Count of all active profiles | Users | Gold |
| MGAs | Profiles with downline, no upline | Building2 | Gold |
| GAs | Profiles with downline AND upline | Shield | Amber |
| Agents | Profiles with no downline | User | Blue |

**Component:**
```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
  <StatCard icon={Users} value={47} label="Total" />
  <StatCard icon={Building2} value={5} label="MGAs" />
  <StatCard icon={Shield} value={12} label="GAs" />
  <StatCard icon={User} value={30} label="Agents" />
</div>
```

### 3.3 Search/Filter Bar

**Left side:**
- Search input (searches name, email across all agents)
- Placeholder: "Search agents by name or email..."

**Right side:**
- Filter dropdown: All | MGAs only | GAs only | Agents only | Needs attention
- View toggle: Tree view (default) | Flat list

### 3.4 Table Structure

| Column | Width | Content | Sortable |
|--------|-------|---------|----------|
| Expand | 40px | Chevron (for MGA/GA rows) | No |
| Name | flex | Full name + email subtitle | Yes |
| Type | 100px | Badge: MGA / GA / Agent | Yes |
| Upline | 150px | Upline name or "—" | Yes |
| Status | 120px | Status badge | Yes |
| Actions | 60px | Chevron → to profile | No |

**Row Types:**
1. **MGA Row** - Expandable, shows direct reports when expanded
2. **GA Row** - Expandable (nested under MGA), shows their agents
3. **Agent Row** - Not expandable, leaf node
4. **Direct to TIG Row** - Expandable, shows orphan agents

### 3.5 Expand/Collapse Behavior

```
Initial state: All MGAs collapsed
Click MGA chevron → Expand to show GAs + direct agents
Click GA chevron → Expand to show GA's agents
Clicking anywhere else on row → Navigate to profile
```

**Indentation:**
- MGA: 0px indent
- GA: 24px indent
- Agent under GA: 48px indent
- Agent under MGA: 24px indent

### 3.6 Mobile Responsive

**< 768px (mobile):**
- Stats bar: 2x2 grid
- Table columns: Name, Status only
- Upline shown as subtitle under name
- Type badge shown inline with name

**768px - 1024px (tablet):**
- Stats bar: 4 columns
- Table columns: Name, Type, Status, Actions

**> 1024px (desktop):**
- Full table with all columns

---

## 4. MGA Detail View (Drill-down)

### 4.1 Layout Wireframe

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [Navigation Bar]                                                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ← Back to Agents                                                        │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  [Avatar]  MGA Alpha                                              │   │
│  │            mga.alpha@test.com                        [View Profile]│   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                                 │
│  │ 15       │ │ 3        │ │ 12       │                                 │
│  │ Downline │ │ GAs      │ │ Agents   │                                 │
│  └──────────┘ └──────────┘ └──────────┘                                 │
│                                                                          │
│  ┌─────────────────────────┐  ┌─────────────────────────────────────┐   │
│  │  Sub-Teams (3 GAs)      │  │  Direct Agents (4)                  │   │
│  │                         │  │                                      │   │
│  │  ┌─────────────────┐   │  │  ┌─────────────────────────────────┐│   │
│  │  │ GA Beta         │   │  │  │ Agent 7         Appointed    → ││   │
│  │  │ 4 agents    [→] │   │  │  ├─────────────────────────────────┤│   │
│  │  └─────────────────┘   │  │  │ Agent 8         Pending      → ││   │
│  │                         │  │  ├─────────────────────────────────┤│   │
│  │  ┌─────────────────┐   │  │  │ Agent 9         Appointed    → ││   │
│  │  │ GA Charlie      │   │  │  ├─────────────────────────────────┤│   │
│  │  │ 5 agents    [→] │   │  │  │ Agent 10        Contracting  → ││   │
│  │  └─────────────────┘   │  │  └─────────────────────────────────┘│   │
│  │                         │  │                                      │   │
│  │  ┌─────────────────┐   │  │                                      │   │
│  │  │ GA Delta        │   │  │                                      │   │
│  │  │ 3 agents    [→] │   │  │                                      │   │
│  │  └─────────────────┘   │  │                                      │   │
│  └─────────────────────────┘  └─────────────────────────────────────┘   │
│                                                                          │
│  [Footer]                                                                │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Header Card

**Content:**
- Avatar placeholder (gold circle with initials)
- Name (clickable, goes to profile)
- Email
- "View Profile" button (outline style)

### 4.3 Stats Bar (Scoped)

| Stat | Calculation |
|------|-------------|
| Downline | Total recursive count under this MGA |
| GAs | Direct reports who have their own downline |
| Agents | Leaf nodes (no downline) in entire tree |

### 4.4 Two-Column Layout

**Left Column: Sub-Teams (40% width)**
- Title: "Sub-Teams ({count} GAs)"
- List of GA cards
- Each GA card shows: Name, agent count, arrow to drill deeper
- Clicking GA card → drills into GA's detail view (same layout, recursively)

**Right Column: Direct Agents (60% width)**
- Title: "Direct Agents ({count})"
- Simple list of agents reporting directly to this MGA (not through a GA)
- Each row: Name, status badge, arrow to profile

### 4.5 Empty States

**No GAs:**
```
Left column shows: "No sub-teams"
All agents appear in right column
```

**No Direct Agents:**
```
Right column shows: "All agents report through GAs"
```

**No Downline at All:**
```
Full-width message: "No agents in this team yet"
With CTA: "Add Agent" button
```

---

## 5. Component Breakdown

### 5.1 New Components Needed

| Component | Location | Purpose |
|-----------|----------|---------|
| `AgentHierarchyTable` | `src/components/admin/` | Main hierarchical table view |
| `AgentHierarchyRow` | `src/components/admin/` | Single expandable row |
| `MGADetailView` | `src/components/admin/` | Two-column MGA detail layout |
| `SubTeamCard` | `src/components/admin/` | GA card in left column |
| `DirectAgentList` | `src/components/admin/` | Simple agent list for right column |
| `AgentStatsBar` | `src/components/admin/` | Reusable stats bar |

### 5.2 Component Props

#### AgentHierarchyTable
```tsx
interface AgentHierarchyTableProps {
  profiles: ProfileWithRole[];
  onSelectAgent: (profileId: string) => void;
  searchQuery: string;
  filter: 'all' | 'mga' | 'ga' | 'agent' | 'attention';
}
```

#### AgentHierarchyRow
```tsx
interface AgentHierarchyRowProps {
  profile: ProfileWithRole;
  depth: number; // 0 = MGA, 1 = GA or direct agent, 2 = agent under GA
  isExpanded: boolean;
  onToggleExpand: () => void;
  onSelect: () => void;
  children?: ProfileWithRole[]; // Direct reports
  hasDownline: boolean;
}
```

#### MGADetailView
```tsx
interface MGADetailViewProps {
  managerId: string;
  onBack: () => void;
  onSelectAgent: (profileId: string) => void;
  onDrillIntoGA: (gaId: string) => void;
}
```

#### SubTeamCard
```tsx
interface SubTeamCardProps {
  ga: ProfileWithRole;
  agentCount: number;
  onClick: () => void;
}
```

#### DirectAgentList
```tsx
interface DirectAgentListProps {
  agents: ProfileWithRole[];
  onSelectAgent: (profileId: string) => void;
}
```

#### AgentStatsBar
```tsx
interface AgentStatsBarProps {
  total: number;
  mgaCount: number;
  gaCount: number;
  agentCount: number;
  // Optional: scoped stats for detail view
  scope?: 'global' | 'team';
}
```

### 5.3 Existing Components to Reuse

| Component | Reuse As-Is | Modify |
|-----------|-------------|--------|
| `Navigation` | ✅ | — |
| `Footer` | ✅ | — |
| `Button` | ✅ | — |
| `Badge` | ✅ | — |
| `Input` | ✅ | — |
| `Select` | ✅ | — |
| `TeamCards` | ❌ | Replace with table |
| `TeamDrilldown` | ❌ | Replace with MGADetailView |

---

## 6. Interaction Patterns

### 6.1 Click Behaviors

| Element | Click Action |
|---------|--------------|
| MGA row chevron | Toggle expand/collapse |
| MGA row (non-chevron) | Navigate to MGA profile |
| GA row chevron | Toggle expand/collapse |
| GA row (non-chevron) | Navigate to GA profile |
| Agent row | Navigate to agent profile |
| "View Team" button | Drill into MGADetailView |
| Sub-team card | Drill into that GA's detail view |
| Back button | Return to previous view |

### 6.2 Expand/Collapse

**Visual states:**
- Collapsed: `▶` chevron pointing right
- Expanded: `▼` chevron pointing down
- Animation: `transition-transform duration-150`

**Persistence:**
- Expand state stored in component state
- Reset when search/filter changes
- Consider localStorage for persistence across sessions

### 6.3 Hover States

| Element | Hover Effect |
|---------|--------------|
| Table row | `bg-muted/30`, subtle highlight |
| Clickable name | `text-gold`, color change |
| Action button | `bg-gold/10`, subtle background |
| Card | `shadow-md`, `border-gold/30`, `-translate-y-0.5` |

### 6.4 Loading States

**Initial load:**
```
┌─────────────────────────────────────┐
│  [Skeleton stats bar - 4 cards]     │
│  [Skeleton search bar]              │
│  [Skeleton table rows x 5]          │
└─────────────────────────────────────┘
```

**Expanding row:**
- Show spinner in chevron position
- Disable row interactions until loaded

**Navigating:**
- Use existing page transition patterns
- Show loading spinner in main content area

---

## 7. Data Requirements

### 7.1 Queries Needed

#### Main Agents Page
```typescript
// 1. Get all user roles
const { data: roles } = await supabase
  .from('user_roles')
  .select('user_id, role');

// 2. Get all active profiles with hierarchy
const { data: profiles } = await supabase
  .from('profiles')
  .select('id, user_id, full_name, email, manager_id, is_active, onboarding_status')
  .eq('is_active', true)
  .order('full_name');
```

#### Derived Data (Computed Client-Side)
```typescript
interface ProfileWithRole {
  id: string;
  user_id: string | null;
  full_name: string | null;
  email: string | null;
  manager_id: string | null;
  is_active: boolean;
  onboarding_status: string;
  // Computed
  role: string; // from user_roles
  hierarchyType: 'mga' | 'ga' | 'agent'; // computed from hierarchy
  hasDownline: boolean;
  downlineCount: number;
  directReports: ProfileWithRole[];
}
```

### 7.2 Data Processing

```typescript
function buildHierarchy(profiles: Profile[], roleMap: Record<string, string>) {
  // 1. Build lookup of who has downline
  const managersWithDownline = new Set<string>();
  profiles.forEach(p => {
    if (p.manager_id) managersWithDownline.add(p.manager_id);
  });

  // 2. Categorize each profile
  return profiles.map(p => ({
    ...p,
    role: roleMap[p.user_id] || 'unknown',
    hasDownline: managersWithDownline.has(p.id),
    hierarchyType: getHierarchyType(p, managersWithDownline),
    directReports: profiles.filter(child => child.manager_id === p.id),
  }));
}

function getHierarchyType(profile, managersWithDownline): 'mga' | 'ga' | 'agent' {
  const hasDownline = managersWithDownline.has(profile.id);
  if (profile.manager_id === null && hasDownline) return 'mga';
  if (profile.manager_id !== null && hasDownline) return 'ga';
  return 'agent';
}
```

### 7.3 Stats Calculation

```typescript
function calculateStats(profiles: ProfileWithRole[]) {
  return {
    total: profiles.length,
    mgaCount: profiles.filter(p => p.hierarchyType === 'mga').length,
    gaCount: profiles.filter(p => p.hierarchyType === 'ga').length,
    agentCount: profiles.filter(p => p.hierarchyType === 'agent').length,
  };
}
```

### 7.4 Search/Filter Logic

```typescript
function filterProfiles(
  profiles: ProfileWithRole[],
  searchQuery: string,
  filter: string
) {
  return profiles.filter(p => {
    // Search match
    const matchesSearch = !searchQuery ||
      p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchQuery.toLowerCase());

    // Filter match
    const matchesFilter = filter === 'all' ||
      (filter === 'mga' && p.hierarchyType === 'mga') ||
      (filter === 'ga' && p.hierarchyType === 'ga') ||
      (filter === 'agent' && p.hierarchyType === 'agent') ||
      (filter === 'attention' && p.onboarding_status !== 'APPOINTED');

    return matchesSearch && matchesFilter;
  });
}
```

---

## 8. Implementation Plan

### Phase 1: Core Table View
1. Create `AgentHierarchyTable` component
2. Create `AgentHierarchyRow` component
3. Implement expand/collapse logic
4. Add search and filter
5. Replace TeamCards usage in AgentsPage

### Phase 2: Detail View
1. Create `MGADetailView` component
2. Create `SubTeamCard` component
3. Create `DirectAgentList` component
4. Implement drill-down navigation
5. Replace TeamDrilldown usage

### Phase 3: Polish
1. Add loading skeletons
2. Implement mobile responsive behavior
3. Add keyboard navigation
4. Performance optimization (virtualization if needed)
5. Add empty states

---

## 9. Migration Notes

### Files to Modify
- `src/pages/admin/AgentsPage.tsx` - Replace view modes
- `src/components/admin/TeamCards.tsx` - Deprecate or remove
- `src/components/admin/TeamDrilldown.tsx` - Deprecate or remove

### Files to Create
- `src/components/admin/AgentHierarchyTable.tsx`
- `src/components/admin/AgentHierarchyRow.tsx`
- `src/components/admin/MGADetailView.tsx`
- `src/components/admin/SubTeamCard.tsx`
- `src/components/admin/DirectAgentList.tsx`
- `src/components/admin/AgentStatsBar.tsx`

### Backward Compatibility
- Keep existing URL structure (`/admin/agents`, `/admin/agents/:profileId`)
- Manager's "My Team" view can reuse MGADetailView with their profile ID
- Maintain existing navigation patterns

---

## 10. Open Questions

1. **Bulk actions?** - Should we support selecting multiple agents for bulk operations?
2. **Export?** - Should we add Excel/CSV export like UserManagementTable?
3. **Inline editing?** - Should status/upline be editable inline or always go to profile?
4. **Pagination vs Virtualization?** - For 100+ agents, which approach?
5. **Real-time updates?** - Should we subscribe to changes via Supabase realtime?

---

*Document prepared for development handoff. Refer to existing codebase patterns and this spec for implementation guidance.*
