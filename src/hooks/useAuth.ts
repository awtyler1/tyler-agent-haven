import { useProfile } from './useProfile';
import { useRole } from './useRole';
import { useDeveloperAccess } from './useDeveloperAccess';

export function useAuth() {
  const profile = useProfile();
  const role = useRole();
  const developer = useDeveloperAccess();

  const loading = profile.loading || role.loading || developer.loading;

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

    // Developer routes
    if (route.startsWith('/developer')) {
      return developer.hasDeveloperAccess;
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

  // Check if user has developer access
  const hasDeveloperAccess = (): boolean => {
    return developer.hasDeveloperAccess;
  };

  // Check if user can access developer tools
  const canAccessDeveloper = (): boolean => {
    return profile.isAuthenticated && developer.hasDeveloperAccess;
  };

  return {
    // Profile exports
    ...profile,

    // Role exports
    ...role,

    // Developer access
    hasDeveloperAccess,
    canAccessDeveloper,

    // Combined
    loading,
    getDefaultRoute,
    canAccessRoute,
  };
}
