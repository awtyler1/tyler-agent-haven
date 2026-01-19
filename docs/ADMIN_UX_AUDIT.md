# Admin UI UX Audit

Generated: 2026-01-19

## Summary Table

| Page | Route | Status | Key Issues |
|------|-------|--------|------------|
| AdminDashboard | `/admin` | Working | Good layout, could use navigation sidebar for admin pages |
| AgentsPage | `/admin/agents` | Working | Tab-based (All/Teams), inconsistent "upline" terminology |
| TeamDetailPage | `/admin/agents/team/:profileId` | Working | Good drill-down, uses "GAs" terminology |
| AgentProfilePage | `/admin/agents/:profileId` | Working | Complex but comprehensive, ~1700 lines - could be split |
| NewAgentPage | `/admin/agents/new` | Working | Uses "upline" 15+ times, should be "Manager" |
| ContractingQueuePage | `/admin/contracting` | Working | Good workflow design, labeled "Contracting Hub" |
| AllAgentsTab | Component | Working | Uses "Upline" throughout - 26 instances |
| TeamsTab | Component | Working | Good hierarchy display |

## Default Route After Login

- **Admin users:** Redirected to `/admin` (AdminDashboard)
- **Agents (non-admin):** Redirected to `/` (Index/Dashboard)
- **Agents with downline:** Access `/admin/agents` to see their team
- **Agents needing contracting:** Redirected to `/contracting`

## Navigation Structure

The app uses a **top navigation bar** (not a sidebar) for all users:
- Links: Dashboard, Tools, Training
- Admin link (shield icon) visible to admin users
- Profile dropdown for authenticated users

**No dedicated admin sidebar exists** - admin pages have back arrows to navigate.

---

## Page-by-Page Analysis

### 1. AdminDashboard (`/admin`)

**Route:** `/admin`

**Layout Structure:**
- Header: "Welcome back, {firstName}"
- Stats row: 3 cards (Total Agents, In Contracting, Appointed)
- Needs Attention section (amber alert box)
- Quick Actions: 6 buttons (Add Agent, Contracting Queue, All Agents, Hierarchy, RTS Import, Roadmaps)
- Recent Activity list
- Super Admin Tools (conditional)

**UX Issues:**
1. No persistent sidebar - must navigate back via arrows
2. Quick Actions don't visually indicate current counts
3. "Needs Attention" items not clickable to navigate directly

---

### 2. AgentsPage (`/admin/agents`)

**Route:** `/admin/agents`

**Layout Structure:**
- Back arrow to `/admin`
- Header: "Agents" with "Add Agent" button
- Tab bar: "All Agents" | "Teams"
- Content area switches based on tab

**UX Issues:**
1. Variable naming uses `selectedUpline`, `initialUplineFilter` - inconsistent with "Manager"
2. URL param `?tab=teams` for teams tab
3. Non-admin agents with downline can access but are redirected to their profile if no downline

---

### 3. TeamDetailPage (`/admin/agents/team/:profileId`)

**Route:** `/admin/agents/team/:profileId`

**Layout Structure:**
- Back link to `/admin/agents`
- Header card with team leader info (avatar, name, email, "View Profile" button)
- Search bar
- Stats line
- Sections: "GAs" (sub-teams) and "Direct to {Name}" (agents)
- Empty state if no team members

**UX Issues:**
1. Uses "GAs" terminology (General Agents) - may need explanation
2. Section title "Direct to {leaderFirstName}" is clear
3. Good empty state with icon

---

### 4. AgentProfilePage (`/admin/agents/:profileId`)

**Route:** `/admin/agents/:profileId`

**Layout Structure:**
- Back navigation
- Header with agent info, role badge, actions
- Multiple collapsible sections:
  - Carrier Statuses with AHIP badge
  - Documents card
  - Hierarchy section (with "Reports to" display)
  - Downline section
  - Role management
  - Deactivate/Reactivate

**UX Issues:**
1. Very long file (~1700 lines) - could be split into components
2. Multiple modals (carrier request, hierarchy assignment, deactivate)
3. "Reports to" shows "TIG (Direct)" for null manager_id - **GOOD**
4. Uses Building2 icon for "TIG (Direct)" - **GOOD**

---

### 5. NewAgentPage (`/admin/agents/new`)

**Route:** `/admin/agents/new`

**Layout Structure:**
- Back arrow to `/admin/agents`
- Header: "Add Agent"
- Form card with fields:
  - Full Name
  - Email Address
  - Reports To (dropdown)
  - Agent Type (New/Existing radio)
  - Send setup email checkbox
- Submit/Cancel buttons

**UX Issues:**
1. **Uses "upline" 15+ times** - should all be "Manager"
   - Interface name: `PotentialUpline`
   - Variables: `potentialUplines`, `loadingUplines`, `selectedUplineName`
   - Label: "Select upline"
   - Text: "assign their upline", "no upline"
2. Form label says "Reports To" but placeholder says "Select upline"
3. Error toast says "Failed to load upline options"

---

### 6. ContractingQueuePage (`/admin/contracting`)

**Route:** `/admin/contracting`

**Layout Structure:**
- Header: "Contracting Hub" with Refresh button
- Stats row: Needs Action, In Progress, Sent to Pinnacle, Completed, Total (clickable filters)
- Search/filter bar
- Table: Agent, NPN, State, Status, Submitted, Docs, Actions
- Slide-out detail panel when agent selected
- Pinnacle modal for sending requests

**UX Issues:**
1. Page title is "Contracting Hub" but route is `/admin/contracting`
2. Good use of stat cards as filters
3. Detail panel could benefit from more info
4. No back navigation (relies on browser)

---

### 7. AllAgentsTab (Component)

**File:** `src/components/admin/AllAgentsTab.tsx`

**Layout Structure:**
- Filters row: Status, Upline, State, Search
- Table: Checkbox, Name, Phone, Email, Upline, Status
- Quick View panel (slides in from right)
- Bulk actions bar (when items selected)

**UX Issues:**
1. **Uses "Upline" throughout UI** - should be "Manager":
   - Filter label: "All Uplines"
   - Table header: "Upline"
   - Quick View: "Upline"
   - Button: "Assign Upline"
2. Good: Shows "Direct to TIG" for null manager (recently fixed)
3. Quick View panel has placeholder "Assign Upline" button

---

### 8. TeamsTab (Component)

**File:** `src/components/admin/TeamsTab.tsx`

**Layout Structure:**
- "Direct to TIG" section (MGAs with no manager)
- Team cards for each MGA/GA with downline
- Click team → switches to All Agents with upline filter

**UX Issues:**
1. Uses "No upline assigned" text (line 231)
2. Good use of Building2 icon for "Direct to TIG"
3. Clear visual hierarchy

---

## Terminology Inconsistencies

### "Upline" vs "Manager" Usage

The codebase inconsistently uses "Upline" (industry term) vs "Manager" (database column name).

**Recommendation:** Standardize on **"Manager"** in UI for consistency with:
- Database column: `manager_id`
- API parameters: `managerId`
- AgentProfilePage: "Reports to"

---

## "Upline" Instances to Change to "Manager"

### Source Files (UI/Code Changes Needed)

| File | Line | Current Text | Change To |
|------|------|--------------|-----------|
| `NewAgentPage.tsx` | 15 | `interface PotentialUpline` | `interface PotentialManager` |
| `NewAgentPage.tsx` | 27 | `potentialUplines` | `potentialManagers` |
| `NewAgentPage.tsx` | 28 | `loadingUplines` | `loadingManagers` |
| `NewAgentPage.tsx` | 42 | `fetchPotentialUplines` | `fetchPotentialManagers` |
| `NewAgentPage.tsx` | 58 | `"Failed to load upline options"` | `"Failed to load manager options"` |
| `NewAgentPage.tsx` | 145 | `selectedUplineName` | `selectedManagerName` |
| `NewAgentPage.tsx` | 177 | `"assign their upline"` | `"assign their manager"` |
| `NewAgentPage.tsx` | 219 | `"Select upline"` | `"Select manager"` |
| `NewAgentPage.tsx` | 240 | `"(no upline)"` | `"(no manager)"` |
| `AllAgentsTab.tsx` | 85 | `initialUplineFilter` | `initialManagerFilter` |
| `AllAgentsTab.tsx` | 95 | `uplineFilter` | `managerFilter` |
| `AllAgentsTab.tsx` | 198 | `uniqueUplines` | `uniqueManagers` |
| `AllAgentsTab.tsx` | 287-288 | `handleAssignUpline` | `handleAssignManager` |
| `AllAgentsTab.tsx` | 332 | `"All Uplines"` | `"All Managers"` |
| `AllAgentsTab.tsx` | 335 | `"All Uplines"` | `"All Managers"` |
| `AllAgentsTab.tsx` | 393 | `<TableHead>Upline</TableHead>` | `<TableHead>Manager</TableHead>` |
| `AllAgentsTab.tsx` | 489 | `"Upline"` | `"Manager"` |
| `AllAgentsTab.tsx` | 525, 527 | `"Assign Upline"` | `"Assign Manager"` |
| `AllAgentsTab.tsx` | 551, 553 | `"Assign Upline..."` | `"Assign Manager..."` |
| `AgentsPage.tsx` | 24-25 | `selectedUpline` | `selectedManager` |
| `AgentsPage.tsx` | 37 | `'no-upline'` | `'no-manager'` |
| `HierarchyAssignmentPanel.tsx` | 14 | `interface PotentialUpline` | `interface PotentialManager` |
| `HierarchyAssignmentPanel.tsx` | 35 | `potentialUplines` | `potentialManagers` |
| `HierarchyAssignmentPanel.tsx` | 58, 78, 82 | Various toast messages | Update text |
| `HierarchyAssignmentPanel.tsx` | 97 | `currentUplineName` | `currentManagerName` |
| `HierarchyAssignmentPanel.tsx` | 106, 128, 134, 161 | UI labels | `"Manager"` |
| `TeamsTab.tsx` | 231 | `"No upline assigned"` | `"No manager assigned"` |

### Documentation Files (Optional)

- `.cursorrules`
- `docs/AGENT_IMPORT_CURRENT_STATE.md`
- `docs/AGENT_IMPORT_PLANNING.md`
- `docs/AGENTS_PAGE_REDESIGN.md`
- `docs/MANAGER_ROLE_AUDIT.md`
- `docs/MVP_ANALYSIS.md`
- `docs/TIG_PLATFORM_FOUNDATION_AUDIT.md`
- `TIG_PLATFORM_CONTEXT.md`
- `ROADMAP_GENERATOR_CONTEXT.md`

### Backend/Database (Do NOT Change)

These use "upline" for legacy/external reasons - keep as-is:
- `supabase/migrations/*` - Historical migrations
- `src/integrations/supabase/types.ts` - Generated types (reflects DB)
- `supabase/functions/create-agent/index.ts` - Comment only

### Agent-Facing Pages (Keep "Upline" - Industry Term)

These are user-facing and use industry terminology:
- `MyCertificationsPage.tsx` - "Contact your upline"
- `ContractingHubPage.tsx` - "Contact your upline"
- `CertificationsPage.tsx` - "Contact your upline"
- `PlatformMapPage.tsx` - "Send to Upline" (workflow diagram)

---

## Recommendations

### High Priority

1. **Standardize terminology**: Change "Upline" to "Manager" in admin UI
2. **Add admin sidebar**: Persistent navigation for admin pages
3. **Split AgentProfilePage**: Extract modals and sections into components

### Medium Priority

4. **Make attention items clickable**: Navigate to agent/issue directly
5. **Add breadcrumbs**: Better wayfinding in deep admin pages
6. **Consistent back navigation**: All admin pages should have back arrows

### Low Priority

7. **Empty states**: Ensure all tables have helpful empty states
8. **Loading states**: Skeleton loaders instead of spinners
9. **Keyboard navigation**: Tab through tables and actions
