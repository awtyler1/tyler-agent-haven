import { useAuth, AppRole, UserRole } from './useAuth';

// Re-export types for backwards compatibility
export type { AppRole, UserRole };

/**
 * @deprecated Use useAuth() instead for better performance.
 * This hook is kept for backwards compatibility but internally uses useAuth
 * which fetches profile, roles, and downline status in parallel.
 */
export function useRole() {
  const auth = useAuth();

  return {
    user: auth.user,
    roles: auth.roles,
    primaryRole: auth.primaryRole,
    loading: auth.loading,
    error: auth.error,
    hasRole: auth.hasRole,
    isAdmin: auth.isAdmin,
    isSuperAdmin: auth.isSuperAdmin,
    isAdminRole: auth.isAdminRole,
    isManager: auth.isManager,
    isAgent: auth.isAgent,
    isIndependentAgent: auth.isIndependentAgent,
    isInternalTigAgent: auth.isInternalTigAgent,
    hasDownline: auth.hasDownline,
    canAccessAdmin: auth.canAccessAdmin,
    canManageAgents: auth.canManageAgents,
    canViewTeam: auth.canViewTeam,
    refetch: auth.refetch,
  };
}
