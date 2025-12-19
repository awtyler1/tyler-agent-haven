import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FeatureFlag {
  id: string;
  flag_key: string;
  flag_value: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface FeatureFlagsContextType {
  flags: FeatureFlag[];
  loading: boolean;
  error: Error | null;
  isEnabled: (flagKey: string) => boolean;
  toggleFlag: (flagKey: string) => Promise<boolean>;
  createFlag: (flagKey: string, description: string, initialValue?: boolean) => Promise<boolean>;
  deleteFlag: (flagKey: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(undefined);

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
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
  }, [fetchFlags]);

  const isEnabled = useCallback((flagKey: string): boolean => {
    const flag = flags.find(f => f.flag_key === flagKey);
    return flag?.flag_value ?? false;
  }, [flags]);

  const toggleFlag = useCallback(async (flagKey: string): Promise<boolean> => {
    const flag = flags.find(f => f.flag_key === flagKey);
    if (!flag) return false;

    const newValue = !flag.flag_value;
    
    // Optimistically update local state immediately
    setFlags(prev => prev.map(f => 
      f.flag_key === flagKey 
        ? { ...f, flag_value: newValue, updated_at: new Date().toISOString() }
        : f
    ));

    const { error: updateError } = await supabase
      .from('feature_flags')
      .update({ 
        flag_value: newValue, 
        updated_at: new Date().toISOString() 
      })
      .eq('flag_key', flagKey);

    if (updateError) {
      console.error('Error toggling flag:', updateError);
      // Revert on error
      setFlags(prev => prev.map(f => 
        f.flag_key === flagKey 
          ? { ...f, flag_value: !newValue, updated_at: flag.updated_at }
          : f
      ));
      return false;
    }

    return true;
  }, [flags]);

  const createFlag = useCallback(async (
    flagKey: string, 
    description: string, 
    initialValue: boolean = false
  ): Promise<boolean> => {
    const { data, error: insertError } = await supabase
      .from('feature_flags')
      .insert({
        flag_key: flagKey,
        flag_value: initialValue,
        description,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating flag:', insertError);
      return false;
    }

    // Add to local state immediately
    setFlags(prev => [...prev, data as FeatureFlag].sort((a, b) => a.flag_key.localeCompare(b.flag_key)));
    return true;
  }, []);

  const deleteFlag = useCallback(async (flagKey: string): Promise<boolean> => {
    const { error: deleteError } = await supabase
      .from('feature_flags')
      .delete()
      .eq('flag_key', flagKey);

    if (deleteError) {
      console.error('Error deleting flag:', deleteError);
      return false;
    }

    // Remove from local state immediately
    setFlags(prev => prev.filter(f => f.flag_key !== flagKey));
    return true;
  }, []);

  return (
    <FeatureFlagsContext.Provider value={{
      flags,
      loading,
      error,
      isEnabled,
      toggleFlag,
      createFlag,
      deleteFlag,
      refetch: fetchFlags,
    }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags() {
  const context = useContext(FeatureFlagsContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider');
  }
  return context;
}
