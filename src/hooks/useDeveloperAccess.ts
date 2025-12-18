import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export function useDeveloperAccess() {
  const [user, setUser] = useState<User | null>(null);
  const [hasDeveloperAccess, setHasDeveloperAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            checkDeveloperAccess(session.user.id);
          }, 0);
        } else {
          setHasDeveloperAccess(false);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkDeveloperAccess(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkDeveloperAccess = async (userId: string) => {
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
  };

  const refetch = () => {
    if (user?.id) {
      checkDeveloperAccess(user.id);
    }
  };

  return {
    hasDeveloperAccess,
    loading,
    refetch,
  };
}
