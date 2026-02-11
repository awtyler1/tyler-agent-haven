import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { CarrierIncome } from '@/types/book';
import { getCarrierColor, PLAN_TYPE_RENEWAL } from '@/types/book';

export function useCarrierIncome() {
  const { profile } = useAuth();

  return useQuery<CarrierIncome[]>({
    queryKey: ['carrier-income', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      // Fetch active policies with carrier info and plan type
      const { data: policies, error } = await supabase
        .from('policies')
        .select('id, plan_type, status, carrier:carriers(id, name)')
        .eq('profile_id', profile!.id)
        .eq('status', 'active');

      if (error) throw error;

      // Group by carrier and calculate income
      const carrierMap = new Map<string, { name: string; policies: number; income: number }>();

      (policies || []).forEach((p: any) => {
        const carrierId = p.carrier?.id;
        const carrierName = p.carrier?.name;
        if (!carrierId || !carrierName) return;

        const existing = carrierMap.get(carrierId) || { name: carrierName, policies: 0, income: 0 };
        const planType = (p.plan_type || 'OTHER').toUpperCase();
        const rate = PLAN_TYPE_RENEWAL[planType] || PLAN_TYPE_RENEWAL.OTHER;

        existing.policies += 1;
        existing.income += rate;
        carrierMap.set(carrierId, existing);
      });

      // Convert to array and calculate percentages
      const totalIncome = Array.from(carrierMap.values()).reduce((sum, c) => sum + c.income, 0);

      return Array.from(carrierMap.entries())
        .map(([carrierId, data]) => ({
          carrier_id: carrierId,
          carrier_name: data.name,
          policies: data.policies,
          income: data.income,
          percentage: totalIncome > 0 ? Math.round((data.income / totalIncome) * 1000) / 10 : 0,
          color: getCarrierColor(data.name),
        }))
        .sort((a, b) => b.income - a.income);
    },
  });
}
