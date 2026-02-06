import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AdminDashboardStats {
  totalAgents: number;
}

interface AdminDashboardData {
  stats: AdminDashboardStats;
  pendingCount: number;
}

async function fetchAdminDashboardData(): Promise<AdminDashboardData> {
  const [rolesResult, profilesResult, contractingResult] = await Promise.all([
    supabase.from('user_roles').select('user_id, role'),
    supabase
      .from('profiles')
      .select('id, user_id')
      .eq('is_active', true)
      .or('is_test.is.null,is_test.eq.false'),
    supabase
      .from('contracting_applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'submitted')
      .not('queue_status', 'in', '("completed","sent_to_pinnacle")')
      .or('is_test.is.null,is_test.eq.false'),
  ]);

  // Process roles to identify admins
  const adminUserIds = new Set(
    (rolesResult.data || [])
      .filter((r) => r.role === 'admin' || r.role === 'super_admin')
      .map((r) => r.user_id)
  );

  // Filter profiles to exclude admins
  const agents = (profilesResult.data || []).filter((p) => {
    if (!p.user_id) return true;
    return !adminUserIds.has(p.user_id);
  });

  return {
    stats: { totalAgents: agents.length },
    pendingCount: contractingResult.count || 0,
  };
}

export function useAdminDashboardData() {
  const query = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: fetchAdminDashboardData,
    staleTime: 2 * 60 * 1000,
  });

  return {
    stats: query.data?.stats ?? { totalAgents: 0 },
    pendingCount: query.data?.pendingCount ?? 0,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
