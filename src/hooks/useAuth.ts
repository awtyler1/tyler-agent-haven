import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';

// ============ Types ============

export type OnboardingStatus =
  | 'CONTRACTING_REQUIRED'
  | 'CONTRACTING_SUBMITTED'
  | 'APPOINTED'
  | 'SUSPENDED';

export interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  onboarding_status: OnboardingStatus;
  appointed_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  ahip_cert_year: number | null;
  ahip_cert_uploaded_at: string | null;
  ahip_cert_file_path: string | null;
}

export type AppRole = 'super_admin' | 'admin' | 'manager' | 'internal_tig_agent' | 'independent_agent';

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

// ============ Hook ============

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [primaryRole, setPrimaryRole] = useState<AppRole | null>(null);
  const [hasDownlineValue, setHasDownlineValue] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Prevent multiple deactivation sign-out attempts
  const isSigningOutRef = useRef(false);

  // Fetch all auth data in parallel
  const fetchAuthData = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch profile, roles, and downline status in PARALLEL
      const [profileResult, rolesResult, downlineResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single(),
        supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', userId),
        supabase.rpc('current_user_has_downline'),
      ]);

      // Handle profile result
      if (profileResult.error) {
        throw profileResult.error;
      }

      const profileData = profileResult.data as Profile;

      // Check if account is deactivated
      if (profileData && profileData.is_active === false && !isSigningOutRef.current) {
        isSigningOutRef.current = true;
        console.log('Account deactivated, signing out...');
        await supabase.auth.signOut();
        toast.error('Your account has been deactivated. Please contact support.', {
          duration: 6000,
        });
        window.location.href = '/auth';
        return;
      }

      setProfile(profileData);

      // Handle roles result
      if (rolesResult.error) {
        console.error('Error fetching roles:', rolesResult.error);
        setRoles([]);
        setPrimaryRole(null);
      } else {
        const userRoles = (rolesResult.data as UserRole[]).map(r => r.role);
        setRoles(userRoles);

        // Determine primary role by hierarchy
        const roleHierarchy: AppRole[] = ['super_admin', 'admin', 'manager', 'internal_tig_agent', 'independent_agent'];
        const primary = roleHierarchy.find(role => userRoles.includes(role)) ?? null;
        setPrimaryRole(primary);
      }

      // Handle downline result
      if (downlineResult.error) {
        console.error('Error checking downline status:', downlineResult.error);
        setHasDownlineValue(false);
      } else {
        setHasDownlineValue(downlineResult.data === true);
      }

    } catch (err) {
      console.error('Error fetching auth data:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch auth data'));
    } finally {
      setLoading(false);
    }
  }, []);

  // Single auth state subscription
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);

        if (session?.user) {
          // Use setTimeout to avoid Supabase auth deadlock
          setTimeout(() => {
            fetchAuthData(session.user.id).catch((err) => {
              console.error('Failed to fetch auth data on auth change:', err);
            });
          }, 0);
        } else {
          setProfile(null);
          setRoles([]);
          setPrimaryRole(null);
          setHasDownlineValue(false);
          setLoading(false);
        }
      }
    );

    // Initial session check
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchAuthData(session.user.id).catch((err) => {
            console.error('Failed to fetch auth data on init:', err);
          });
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to get auth session:', err);
        setError(err instanceof Error ? err : new Error('Failed to get session'));
        setLoading(false);
      });

    return () => subscription.unsubscribe();
  }, [fetchAuthData]);

  // ============ Role helpers ============

  const hasRole = (role: AppRole): boolean => roles.includes(role);

  const isAdmin = (): boolean =>
    hasRole('super_admin') || hasRole('admin');

  const isSuperAdmin = (): boolean => hasRole('super_admin');

  const isAdminRole = (): boolean => hasRole('admin');

  const isManager = (): boolean => hasRole('manager');

  const isAgent = (): boolean => hasRole('independent_agent') || hasRole('internal_tig_agent');

  const isIndependentAgent = (): boolean => hasRole('independent_agent');

  const isInternalTigAgent = (): boolean => hasRole('internal_tig_agent');

  const hasDownline = (): boolean => hasDownlineValue;

  const canAccessAdmin = (): boolean => isAdmin();

  const canManageAgents = (): boolean => isAdmin();

  const canViewTeam = (): boolean => hasDownline() || isAdmin();

  // ============ Profile helpers ============

  const isAuthenticated = !!user;
  const isActive = profile?.is_active ?? true;
  const onboardingStatus = profile?.onboarding_status ?? null;
  const isAppointed = profile?.onboarding_status === 'APPOINTED';
  const isContractingRequired = profile?.onboarding_status === 'CONTRACTING_REQUIRED';
  const isContractSubmitted = profile?.onboarding_status === 'CONTRACTING_SUBMITTED';
  const isSuspended = profile?.onboarding_status === 'SUSPENDED';

  // ============ Navigation helpers ============

  const getDefaultRoute = (): string => {
    if (!isAuthenticated) {
      return '/auth';
    }

    if (isAgent() && isContractingRequired) {
      return '/contracting';
    }

    if (canAccessAdmin()) {
      return '/admin';
    }

    return '/hub';
  };

  const canAccessRoute = (route: string): boolean => {
    if (!isAuthenticated) {
      return route === '/auth';
    }

    if (route.startsWith('/admin')) {
      return canAccessAdmin();
    }

    if (isAgent() && isContractingRequired) {
      return route === '/contracting' || route === '/auth';
    }

    return true;
  };

  // ============ Refetch ============

  const refetch = () => {
    if (user?.id) {
      fetchAuthData(user.id).catch((err) => {
        console.error('Failed to refetch auth data:', err);
      });
    }
  };

  return {
    // User & Profile
    user,
    profile,
    loading,
    error,
    isAuthenticated,
    isActive,
    onboardingStatus,
    isAppointed,
    isContractingRequired,
    isContractSubmitted,
    isSuspended,

    // Roles
    roles,
    primaryRole,
    hasRole,
    isAdmin,
    isSuperAdmin,
    isAdminRole,
    isManager,
    isAgent,
    isIndependentAgent,
    isInternalTigAgent,
    hasDownline,
    canAccessAdmin,
    canManageAgents,
    canViewTeam,

    // Navigation
    getDefaultRoute,
    canAccessRoute,

    // Actions
    refetch,
  };
}
