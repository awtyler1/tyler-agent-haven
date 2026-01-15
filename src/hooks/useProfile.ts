import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

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
}

export function useProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);

        if (session?.user) {
          // Use setTimeout to avoid Supabase auth deadlock, catch any errors
          setTimeout(() => {
            fetchProfile(session.user.id).catch((err) => {
              console.error('Failed to fetch profile on auth change:', err);
            });
          }, 0);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id).catch((err) => {
            console.error('Failed to fetch profile on init:', err);
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
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setProfile(data as Profile);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    if (user?.id) {
      fetchProfile(user.id).catch((err) => {
        console.error('Failed to refetch profile:', err);
      });
    }
  };

  return {
    user,
    profile,
    loading,
    error,
    isAuthenticated: !!user,
    isActive: profile?.is_active ?? true,
    onboardingStatus: profile?.onboarding_status ?? null,
    isAppointed: profile?.onboarding_status === 'APPOINTED',
    isContractingRequired: profile?.onboarding_status === 'CONTRACTING_REQUIRED',
    isContractSubmitted: profile?.onboarding_status === 'CONTRACTING_SUBMITTED',
    isSuspended: profile?.onboarding_status === 'SUSPENDED',
    refetch,
  };
}
