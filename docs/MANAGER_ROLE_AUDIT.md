# Manager Role Audit

**Date:** 2026-01-18
**Purpose:** Document all usages of the 'manager' role before potential removal

---

## Summary

The `manager` role is used in **3 key areas**:
1. **RLS Policies** (Supabase migrations) - 4 active policies
2. **Frontend role checks** (TypeScript/React) - 12+ files
3. **Backend/Edge Functions** - 1 file (type definition only)

---

## 1. RLS Policies (Supabase Migrations)

### Active Policies (from latest migration)

| File | Line | Policy Name | What it does |
|------|------|-------------|--------------|
| `20251208182754_*.sql` | 90 | Managers view team profiles | Allows managers to SELECT profiles where `manager_id = get_my_profile_id()` |
| `20251208182754_*.sql` | 108 | Managers view team roles | Allows managers to SELECT user_roles for their team members |
| `20251220005106_*.sql` | 70 | (unnamed) | Additional manager check using `has_role(auth.uid(), 'manager')` |

### Role Definition

| File | Line | What it does |
|------|------|--------------|
| `20251208181451_*.sql` | 23 | Defines enum: `CREATE TYPE app_role_new AS ENUM ('super_admin', 'admin', 'manager', 'agent')` |
| `20251208182754_*.sql` | 25 | Final enum: `('super_admin', 'admin', 'manager', 'independent_agent', 'internal_tig_agent')` |

### Role Hierarchy

| File | Line | What it does |
|------|------|--------------|
| `20251208182754_*.sql` | 72 | `get_role_level()` function assigns manager level 3 (below admin at 2) |

---

## 2. Frontend Role Checks

### Core Type Definitions

| File | Line | How it uses 'manager' |
|------|------|----------------------|
| `src/hooks/useRole.ts` | 5 | `AppRole = 'super_admin' \| 'admin' \| 'manager' \| ...` - Type definition |
| `src/hooks/useRole.ts` | 64 | Role hierarchy array: `['super_admin', 'admin', 'manager', ...]` |
| `src/hooks/useRole.ts` | 83 | `isManager()` function: `hasRole('manager')` |
| `src/hooks/useRole.ts` | 95 | `canViewTeam()`: `isManager() \|\| isAdmin()` |
| `src/integrations/supabase/types.ts` | 1081, 1218 | Generated Supabase types include 'manager' |

### User Management

| File | Line | How it uses 'manager' |
|------|------|----------------------|
| `src/hooks/useUserManagement.ts` | 122 | `updateUserRole()` accepts 'manager' as valid role |
| `src/components/admin/CreateUserDialog.tsx` | 38, 57, 60 | Role enum includes 'manager'; in `adminAssignableRoles` array |
| `src/components/admin/UserManagementTable.tsx` | 465, 713 | `<SelectItem value="manager">Manager</SelectItem>` - Role dropdown option |

### Role-Based Access Control

| File | Line | How it uses 'manager' |
|------|------|----------------------|
| `src/pages/admin/AgentsPage.tsx` | 37 | Destructures `isManager` from `useAuth()` |
| `src/pages/admin/AgentsPage.tsx` | 42 | `if (isManager()) return 'myteam'` - Default view for managers |
| `src/pages/admin/AgentsPage.tsx` | 80 | Redirect check: `isAgent() && !isManager() && !isAdmin()` |
| `src/pages/admin/AgentsPage.tsx` | 234 | `canViewMyTeam = isManager() && !isAdmin()` |

### Role Assignment UI

| File | Line | How it uses 'manager' |
|------|------|----------------------|
| `src/pages/admin/UserDetailPage.tsx` | 66 | AppRole type includes 'manager' |
| `src/pages/admin/UserDetailPage.tsx` | 77 | `adminAssignableRoles: AppRole[] = ['manager', ...]` |
| `src/pages/admin/UserDetailPage.tsx` | 80 | `allRoles: AppRole[]` includes 'manager' |
| `src/pages/admin/AgentProfilePage.tsx` | 132 | AppRole type includes 'manager' |
| `src/pages/admin/AgentProfilePage.tsx` | 143 | `ADMIN_ASSIGNABLE_ROLES` includes 'manager' |
| `src/pages/admin/AgentProfilePage.tsx` | 146 | `ALL_ROLES` includes 'manager' |

### Manager Queries

| File | Line | How it uses 'manager' |
|------|------|----------------------|
| `src/pages/admin/NewAgentPage.tsx` | 49 | `.in('role', ['manager', 'admin', 'super_admin'])` - Fetches potential managers |
| `src/components/admin/HierarchyAssignmentPanel.tsx` | 49 | `.in('role', ['manager', 'admin', 'super_admin'])` - Same query |
| `src/pages/admin/ManagersPage.tsx` | 46 | `.filter(p => p.role === 'manager')` - Filters to show only managers |
| `src/components/admin/TeamDrilldown.tsx` | 117, 121 | `p.role === 'manager'` - Identifies manager profiles |

### TeamCards UI Component

| File | Line | How it uses 'manager' |
|------|------|----------------------|
| `src/components/admin/TeamCards.tsx` | 330, 431 | `const isManager = !team.isDirectToTIG && onViewProfile` (local variable, not role check) |

---

## 3. Backend/Edge Functions

| File | Line | How it uses 'manager' |
|------|------|----------------------|
| `supabase/functions/_shared/auth.ts` | 8 | `AppRole = 'super_admin' \| 'admin' \| 'manager' \| ...` - Type definition |

**Note:** The `create-agent` function uses `managerId` and `manager_id` but these refer to the **profile.id** of the upline, not the role itself.

---

## 4. Related Pages/Routes

| File | What it does |
|------|--------------|
| `src/App.tsx` | Imports `ManagersPage` and `NewManagerPage` routes |
| `src/pages/admin/ManagersPage.tsx` | Dedicated page for managing users with 'manager' role |
| `src/pages/admin/NewManagerPage.tsx` | Page for creating new managers |

---

## Impact Analysis

### If 'manager' role is removed:

1. **RLS Policies will break** - Managers won't be able to view their team's profiles or roles
2. **Frontend role checks will fail** - `isManager()` will always return false
3. **Role assignment UI needs update** - Remove 'manager' from dropdown options
4. **Type definitions need update** - Remove from AppRole union type
5. **Managers page becomes orphaned** - No users will match the filter
6. **Agent hierarchy queries break** - Queries looking for manager role won't find uplines

### Recommended removal order:

1. Update RLS policies to use alternative access pattern (e.g., manager_id check without role)
2. Update frontend role checks and UI components
3. Remove manager from AppRole enum in migrations
4. Remove/repurpose ManagersPage and NewManagerPage

---

## Questions to Consider

1. **What replaces manager access control?** - Should admins be the only ones who can view teams?
2. **How do uplines access their downline?** - Currently requires manager role + manager_id relationship
3. **Keep manager_id column?** - This defines the hierarchy, separate from role
