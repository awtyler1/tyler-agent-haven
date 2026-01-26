import { useAuth, Profile, OnboardingStatus } from './useAuth';

// Re-export types for backwards compatibility
export type { Profile, OnboardingStatus };

/**
 * @deprecated Use useAuth() instead for better performance.
 * This hook is kept for backwards compatibility but internally uses useAuth
 * which fetches profile, roles, and downline status in parallel.
 */
export function useProfile() {
  const auth = useAuth();

  return {
    user: auth.user,
    profile: auth.profile,
    loading: auth.loading,
    error: auth.error,
    isAuthenticated: auth.isAuthenticated,
    isActive: auth.isActive,
    onboardingStatus: auth.onboardingStatus,
    isAppointed: auth.isAppointed,
    isContractingRequired: auth.isContractingRequired,
    isContractSubmitted: auth.isContractSubmitted,
    isSuspended: auth.isSuspended,
    refetch: auth.refetch,
  };
}
