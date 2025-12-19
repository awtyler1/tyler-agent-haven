import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FeatureFlag {
  id: string;
  flag_key: string;
  flag_value: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export function useFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchFlags = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('feature_flags')
        .select('*')
        .order('flag_key');

      if (fetchError) throw fetchError;
      setFlags(data as FeatureFlag[]);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlags();

    // Subscribe to real-time changes on feature_flags table
    const channel = supabase
      .channel('feature_flags_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'feature_flags',
        },
        (payload) => {
          console.log('Feature flag changed:', payload);
          // Refetch all flags when any change occurs
          fetchFlags();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchFlags]);

  const isEnabled = useCallback((flagKey: string): boolean => {
    const flag = flags.find(f => f.flag_key === flagKey);
    return flag?.flag_value ?? false;
  }, [flags]);

  const toggleFlag = async (flagKey: string): Promise<boolean> => {
    const flag = flags.find(f => f.flag_key === flagKey);
    if (!flag) return false;

    const newValue = !flag.flag_value;
    
    const { error: updateError } = await supabase
      .from('feature_flags')
      .update({ 
        flag_value: newValue, 
        updated_at: new Date().toISOString() 
      })
      .eq('flag_key', flagKey);

    if (updateError) {
      console.error('Error toggling flag:', updateError);
      return false;
    }

    setFlags(prev => prev.map(f => 
      f.flag_key === flagKey 
        ? { ...f, flag_value: newValue, updated_at: new Date().toISOString() }
        : f
    ));

    return true;
  };

  const createFlag = async (
    flagKey: string, 
    description: string, 
    initialValue: boolean = false
  ): Promise<boolean> => {
    const { error: insertError } = await supabase
      .from('feature_flags')
      .insert({
        flag_key: flagKey,
        flag_value: initialValue,
        description,
      });

    if (insertError) {
      console.error('Error creating flag:', insertError);
      return false;
    }

    await fetchFlags();
    return true;
  };

  const deleteFlag = async (flagKey: string): Promise<boolean> => {
    const { error: deleteError } = await supabase
      .from('feature_flags')
      .delete()
      .eq('flag_key', flagKey);

    if (deleteError) {
      console.error('Error deleting flag:', deleteError);
      return false;
    }

    setFlags(prev => prev.filter(f => f.flag_key !== flagKey));
    return true;
  };

  return {
    flags,
    loading,
    error,
    isEnabled,
    toggleFlag,
    createFlag,
    deleteFlag,
    refetch: fetchFlags,
  };
}
