import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export type OnboardingStatus = 
  | 'CONTRACTING_REQUIRED'
  | 'CONTRACT_SUBMITTED'
  | 'APPOINTED'
  | 'SUSPENDED';

export interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  onboarding_status: OnboardingStatus;
  appointed_at: string | null;
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
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
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
      fetchProfile(user.id);
    }
  };

  return {
    user,
    profile,
    loading,
    error,
    isAuthenticated: !!user,
    onboardingStatus: profile?.onboarding_status ?? null,
    isAppointed: profile?.onboarding_status === 'APPOINTED',
    isContractingRequired: profile?.onboarding_status === 'CONTRACTING_REQUIRED',
    isContractSubmitted: profile?.onboarding_status === 'CONTRACT_SUBMITTED',
    isSuspended: profile?.onboarding_status === 'SUSPENDED',
    refetch,
  };
}
