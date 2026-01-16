import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type AgentCertification = Tables<'agent_certifications'>;

interface UseAgentCertificationsOptions {
  profileId?: string;
  fetchAll?: boolean;
  fetchCurrentUser?: boolean;
}

export function useAgentCertifications(options: UseAgentCertificationsOptions = {}) {
  const { profileId, fetchAll = false, fetchCurrentUser = false } = options;
  const [certifications, setCertifications] = useState<AgentCertification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentUserProfileId, setCurrentUserProfileId] = useState<string | null>(null);

  // Get current user's profile ID if needed
  useEffect(() => {
    if (fetchCurrentUser && !profileId) {
      const getCurrentUserProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
          if (profile) {
            setCurrentUserProfileId(profile.id);
          }
        }
      };
      getCurrentUserProfile();
    }
  }, [fetchCurrentUser, profileId]);

  const effectiveProfileId = profileId || currentUserProfileId;

  const fetchCertifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('agent_certifications')
        .select('*');

      if (!fetchAll && effectiveProfileId) {
        query = query.eq('profile_id', effectiveProfileId);
      }

      const { data, error: queryError } = await query.order('carrier_name');

      if (queryError) throw queryError;
      setCertifications(data || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch certifications'));
    } finally {
      setLoading(false);
    }
  }, [effectiveProfileId, fetchAll]);

  useEffect(() => {
    if (fetchAll || effectiveProfileId) {
      fetchCertifications();
    } else if (!fetchCurrentUser) {
      setLoading(false);
    }
  }, [fetchAll, effectiveProfileId, fetchCurrentUser, fetchCertifications]);

  return {
    certifications,
    loading,
    error,
    refetch: fetchCertifications,
  };
}
