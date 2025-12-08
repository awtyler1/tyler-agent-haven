import { useProfile } from './useProfile';
import { useRole } from './useRole';

export function useAuth() {
  const profile = useProfile();
  const role = useRole();

  const loading = profile.loading || role.loading;

  // Determine where user should be routed after login
  const getDefaultRoute = (): string => {
    // If not authenticated, go to auth
    if (!profile.isAuthenticated) {
      return '/auth';
    }

    // If agent needs contracting, send to contracting
    if (role.isAgent() && profile.isContractingRequired) {
      return '/contracting';
    }

    // If admin, can access admin dashboard
    if (role.canAccessAdmin()) {
      return '/admin';
    }

    // Default to main dashboard
    return '/';
  };

  // Check if user can access a specific route
  const canAccessRoute = (route: string): boolean => {
    if (!profile.isAuthenticated) {
      return route === '/auth';
    }

    // Admin routes
    if (route.startsWith('/admin')) {
      return role.canAccessAdmin();
    }

    // Agent in contracting mode can only access contracting
    if (role.isAgent() && profile.isContractingRequired) {
      return route === '/contracting' || route === '/auth';
    }

    return true;
  };

  return {
    ...profile,
    ...role,
    loading,
    getDefaultRoute,
    canAccessRoute,
  };
}
