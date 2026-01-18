# Role Management Feature

## Overview

The Role Management feature allows administrators to view and change user roles in the system. It uses a single-role-per-user model with a hierarchical permission system.

## What It Does

- **View Role**: Displays the user's current role in the User Settings card
- **Change Role**: Allows admins to change a user's role via a dropdown select
- **Single Role Model**: Each user has exactly one role (not multiple)

## Available Roles

| Role | Label | Description |
|------|-------|-------------|
| `super_admin` | Superadmin | Full system access, can assign any role |
| `admin` | Admin | Administrative access, limited role assignment |
| `manager` | Manager | Can view team, manage downline agents |
| `internal_tig_agent` | Internal TIG Agent | TIG employee agent |
| `independent_agent` | Independent Agent | External contracted agent |

### Role Hierarchy

Roles are ordered by privilege level (highest to lowest):
```typescript
const roleHierarchy: AppRole[] = [
  'super_admin',
  'admin',
  'manager',
  'internal_tig_agent',
  'independent_agent'
];
```

## Who Can Change Roles

### Super Admins
Can assign **all roles** including:
- `super_admin`
- `admin`
- `manager`
- `internal_tig_agent`
- `independent_agent`

### Regular Admins
Can only assign **non-admin roles**:
- `manager`
- `internal_tig_agent`
- `independent_agent`

```typescript
// src/pages/admin/UserDetailPage.tsx:76-80
// Roles that Admins can assign (not Super Admin or Admin)
const adminAssignableRoles: AppRole[] = ['manager', 'internal_tig_agent', 'independent_agent'];

// All roles for Super Admins
const allRoles: AppRole[] = ['super_admin', 'admin', 'manager', 'internal_tig_agent', 'independent_agent'];

// Determine which roles current user can assign
const assignableRoles = isSuperAdmin() ? allRoles : adminAssignableRoles;
```

## How It's Triggered

The role is changed via a **Select dropdown** in the User Settings card on the UserDetailPage:

```tsx
// src/pages/admin/UserDetailPage.tsx:565-590
<div className="space-y-2">
  <Label>Role</Label>
  {updatingRole ? (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      Updating...
    </div>
  ) : (
    <Select
      value={user.role || 'independent_agent'}
      onValueChange={(value) => handleRoleChange(value as AppRole)}
    >
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {assignableRoles.map((role) => (
          <SelectItem key={role} value={role}>
            {roleLabels[role]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )}
</div>
```

## Technical Implementation

### Handler Function

**File:** `src/pages/admin/UserDetailPage.tsx:188-203`

```typescript
const handleRoleChange = async (newRole: AppRole) => {
  if (!user) return;
  setUpdatingRole(true);
  try {
    // Delete existing role(s)
    await supabase.from('user_roles').delete().eq('user_id', user.user_id);

    // Insert new role
    const { error } = await supabase
      .from('user_roles')
      .insert({ user_id: user.user_id, role: newRole });

    if (error) throw error;

    toast.success('Role updated successfully');
    setUser(prev => prev ? { ...prev, role: newRole } : null);
  } catch (err: any) {
    toast.error(`Failed to update role: ${err.message}`);
  } finally {
    setUpdatingRole(false);
  }
};
```

### Database Schema

The `user_roles` table stores role assignments:

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | References auth.users |
| `role` | text | One of the AppRole values |
| `created_at` | timestamp | When role was assigned |

### Fetching User Role

```typescript
// src/pages/admin/UserDetailPage.tsx:124-132
const { data: roleData } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', userId)
  .maybeSingle();

const userData = {
  ...profile,
  role: roleData?.role || null,
};
```

## useRole Hook

The `useRole` hook (`src/hooks/useRole.ts`) provides role checking utilities throughout the app:

```typescript
export function useRole() {
  // ... state and fetching logic ...

  const hasRole = (role: AppRole): boolean => roles.includes(role);

  const isAdmin = (): boolean =>
    hasRole('super_admin') || hasRole('admin');

  const isSuperAdmin = (): boolean => hasRole('super_admin');

  const isAdminRole = (): boolean => hasRole('admin');

  const isManager = (): boolean => hasRole('manager');

  const isAgent = (): boolean =>
    hasRole('independent_agent') || hasRole('internal_tig_agent');

  const canAccessAdmin = (): boolean => isAdmin();
  const canManageAgents = (): boolean => isAdmin();
  const canViewTeam = (): boolean => isManager() || isAdmin();

  return {
    user, roles, primaryRole, loading, error,
    hasRole, isAdmin, isSuperAdmin, isAdminRole,
    isManager, isAgent, isIndependentAgent, isInternalTigAgent,
    canAccessAdmin, canManageAgents, canViewTeam, refetch,
  };
}
```

## UI Behavior

### Role Display
- For **agent roles** (`independent_agent`, `internal_tig_agent`): Shows onboarding status badge
- For **non-agent roles**: Shows role name badge (e.g., "Superadmin", "Admin", "Manager")

```typescript
// src/pages/admin/UserDetailPage.tsx:302
const isAgentRole = user?.role === 'independent_agent' || user?.role === 'internal_tig_agent';
```

### Loading State
While updating, shows a spinner with "Updating..." text instead of the dropdown.

### Success/Error Feedback
- Success: `toast.success('Role updated successfully')`
- Error: `toast.error('Failed to update role: [message]')`

## Related Files

| File | Purpose |
|------|---------|
| `src/pages/admin/UserDetailPage.tsx` | Role management UI and handler |
| `src/hooks/useRole.ts` | Role checking hook used throughout app |
| `src/hooks/useAuth.ts` | Higher-level auth hook (wraps useRole) |

## Security Considerations

- Role changes are immediate (no confirmation dialog)
- Admins cannot elevate users to admin/super_admin roles
- Super admins can assign any role including other super_admins
- RLS policies on `user_roles` table should restrict who can modify roles
