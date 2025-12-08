import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export type AppRole = 'super_admin' | 'admin' | 'manager' | 'internal_tig_agent' | 'independent_agent';

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export function useRole() {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [primaryRole, setPrimaryRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchRoles(session.user.id);
          }, 0);
        } else {
          setRoles([]);
          setPrimaryRole(null);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRoles(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchRoles = async (userId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      const userRoles = (data as UserRole[]).map(r => r.role);
      setRoles(userRoles);

      // Determine primary role by hierarchy
      const roleHierarchy: AppRole[] = ['super_admin', 'admin', 'manager', 'internal_tig_agent', 'independent_agent'];
      const primary = roleHierarchy.find(role => userRoles.includes(role)) ?? null;
      setPrimaryRole(primary);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (role: AppRole): boolean => roles.includes(role);
  
  const isAdmin = (): boolean => 
    hasRole('super_admin') || hasRole('admin');
  
  const isSuperAdmin = (): boolean => hasRole('super_admin');
  
  const isAdminRole = (): boolean => hasRole('admin');
  
  const isManager = (): boolean => hasRole('manager');
  
  const isAgent = (): boolean => hasRole('independent_agent') || hasRole('internal_tig_agent');
  
  const isIndependentAgent = (): boolean => hasRole('independent_agent');
  
  const isInternalTigAgent = (): boolean => hasRole('internal_tig_agent');

  const canAccessAdmin = (): boolean => isAdmin();
  
  const canManageAgents = (): boolean => isAdmin();
  
  const canViewTeam = (): boolean => isManager() || isAdmin();

  const refetch = () => {
    if (user?.id) {
      fetchRoles(user.id);
    }
  };

  return {
    user,
    roles,
    primaryRole,
    loading,
    error,
    hasRole,
    isAdmin,
    isSuperAdmin,
    isAdminRole,
    isManager,
    isAgent,
    isIndependentAgent,
    isInternalTigAgent,
    canAccessAdmin,
    canManageAgents,
    canViewTeam,
    refetch,
  };
}
