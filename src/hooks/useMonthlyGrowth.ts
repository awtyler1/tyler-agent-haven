import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { MonthlyGrowth } from '@/types/book';

export function useMonthlyGrowth(months = 12) {
  const { profile } = useAuth();

  return useQuery<MonthlyGrowth[]>({
    queryKey: ['monthly-growth', profile?.id, months],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('monthly_syncs')
        .select('month, total_clients, new_clients, termed_clients, net_change')
        .eq('profile_id', profile!.id)
        .eq('status', 'complete')
        .order('month', { ascending: true })
        .limit(months);

      if (error) throw error;

      return (data || []).map(row => ({
        month: row.month,
        total_clients: row.total_clients || 0,
        new_clients: row.new_clients || 0,
        termed_clients: row.termed_clients || 0,
        net_change: row.net_change || 0,
      }));
    },
  });
}
