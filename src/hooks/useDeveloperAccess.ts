import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useDeveloperAccess(userId: string | undefined) {
  const [hasDeveloperAccess, setHasDeveloperAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkDeveloperAccess = useCallback(async () => {
    if (!userId) {
      setHasDeveloperAccess(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('developer_access')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setHasDeveloperAccess(data?.developer_access ?? false);
    } catch (err) {
      console.error('Error checking developer access:', err);
      setHasDeveloperAccess(false);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    checkDeveloperAccess();
  }, [checkDeveloperAccess]);

  return {
    hasDeveloperAccess,
    loading,
    refetch: checkDeveloperAccess,
  };
}
