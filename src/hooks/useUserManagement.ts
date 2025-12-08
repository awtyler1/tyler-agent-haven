import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ManagedUser {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  onboarding_status: string;
  created_at: string;
  setup_link_sent_at: string | null;
  password_created_at: string | null;
  first_login_at: string | null;
  role: string | null;
  is_active: boolean;
}

export function useUserManagement() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
      }

      const roleMap = roles?.reduce((acc, r) => {
        acc[r.user_id] = r.role;
        return acc;
      }, {} as Record<string, string>) || {};

      const usersWithRoles: ManagedUser[] = (profiles || []).map(p => ({
        id: p.id,
        user_id: p.user_id,
        email: p.email,
        full_name: p.full_name,
        onboarding_status: p.onboarding_status,
        created_at: p.created_at,
        setup_link_sent_at: p.setup_link_sent_at,
        password_created_at: p.password_created_at,
        first_login_at: p.first_login_at,
        role: roleMap[p.user_id] || null,
        is_active: p.is_active ?? true,
      }));

      setUsers(usersWithRoles);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createUser = async (data: { email: string; fullName: string; role: string; managerId?: string; sendSetupEmail?: boolean }) => {
    try {
      const { data: result, error } = await supabase.functions.invoke('create-agent', {
        body: {
          email: data.email,
          fullName: data.fullName,
          role: data.role,
          managerId: data.managerId || null,
          sendSetupEmail: data.sendSetupEmail ?? true,
        },
      });

      if (error) throw error;
      if (result?.error) throw new Error(result.error);

      const message = data.sendSetupEmail 
        ? 'User created and setup email sent'
        : 'User created successfully';
      toast.success(message);
      await fetchUsers();
      return { success: true, userId: result.userId };
    } catch (err: any) {
      toast.error(`Failed to create user: ${err.message}`);
      return { success: false, error: err.message };
    }
  };

  const sendSetupLink = async (userId: string) => {
    try {
      const { data: result, error } = await supabase.functions.invoke('send-setup-link', {
        body: { userId },
      });

      if (error) throw error;
      if (result?.error) throw new Error(result.error);

      toast.success('Setup link sent successfully');
      await fetchUsers();
      return { success: true };
    } catch (err: any) {
      toast.error(`Failed to send setup link: ${err.message}`);
      return { success: false, error: err.message };
    }
  };

  const updateUserRole = async (userId: string, newRole: 'super_admin' | 'admin' | 'manager' | 'agent') => {
    try {
      // Delete existing role
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Insert new role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: newRole });

      if (error) throw error;

      toast.success('Role updated successfully');
      await fetchUsers();
      return { success: true };
    } catch (err: any) {
      toast.error(`Failed to update role: ${err.message}`);
      return { success: false, error: err.message };
    }
  };

  const toggleUserActive = async (userId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: isActive })
        .eq('user_id', userId);

      if (error) throw error;

      toast.success(isActive ? 'Account activated' : 'Account deactivated');
      await fetchUsers();
      return { success: true };
    } catch (err: any) {
      toast.error(`Failed to update account status: ${err.message}`);
      return { success: false, error: err.message };
    }
  };

  const updateUserProfile = async (userId: string, data: { full_name?: string; email?: string }) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('Profile updated successfully');
      await fetchUsers();
      return { success: true };
    } catch (err: any) {
      toast.error(`Failed to update profile: ${err.message}`);
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
    createUser,
    sendSetupLink,
    updateUserRole,
    toggleUserActive,
    updateUserProfile,
  };
}
