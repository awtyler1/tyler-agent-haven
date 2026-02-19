import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { BookSummary } from '@/types/book';
import { PLAN_TYPE_RENEWAL } from '@/types/book';

export function useBookSummary() {
  const { profile } = useAuth();

  return useQuery<BookSummary>({
    queryKey: ['book-summary', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const profileId = profile!.id;

      // Parallel fetches for all summary data
      const [clientsRes, policiesRes, syncsRes] = await Promise.all([
        // All clients (for total count)
        supabase
          .from('clients')
          .select('id', { count: 'exact', head: true })
          .eq('profile_id', profileId),

        // All policies with plan type
        supabase
          .from('policies')
          .select('id, status, plan_type, client_id')
          .eq('profile_id', profileId),

        // Monthly syncs ordered descending (most recent first)
        supabase
          .from('monthly_syncs')
          .select('month, total_clients, new_clients, termed_clients, net_change')
          .eq('profile_id', profileId)
          .eq('status', 'complete')
          .order('month', { ascending: false })
          .limit(13),
      ]);

      const totalClients = clientsRes.count ?? 0;
      const policies = (policiesRes.data as any[]) || [];
      const activePolicies = policies.filter(p => p.status === 'active');
      const syncs = (syncsRes.data as any[]) || [];

      console.log('[useBookSummary] querying profile_id:', profileId);
      console.log('[useBookSummary] raw results:', {
        totalClients,
        policiesCount: policies.length,
        activePoliciesCount: activePolicies.length,
        syncsCount: syncs.length,
        clientsError: clientsRes.error,
        policiesError: policiesRes.error,
        syncsError: syncsRes.error,
      });

      // IMPORTANT: Two different counts exist:
      // - totalClients (returned as total_contacts): ALL client records in the clients table (553)
      //   Includes Connecture/SunFire contacts that may not have any carrier policy.
      // - activeClients: Unique clients with at least one active policy in the policies table (204)
      //   THIS is the real book size. Use this for hero numbers, milestones, and growth metrics.
      const clientsWithActivePolicy = new Set(activePolicies.map(p => p.client_id));
      const activeClients = clientsWithActivePolicy.size;

      // Annual renewal from active policies
      let totalAnnualRenewal = 0;
      activePolicies.forEach(p => {
        const planType = (p.plan_type || 'OTHER').toUpperCase();
        const rate = PLAN_TYPE_RENEWAL[planType] || PLAN_TYPE_RENEWAL.OTHER;
        totalAnnualRenewal += rate;
      });

      // --- Growth & retention from monthly syncs ---
      const currentMonth = syncs[0]; // most recent
      const newThisMonth = currentMonth?.new_clients ?? 0;

      // Total termed across all available sync months
      const totalTermed = syncs.reduce((sum: number, s: any) => sum + (s.termed_clients ?? 0), 0);

      // Growth rate: compare current to earliest available data point
      // syncs are descending, so last element is the oldest
      const earliestSync = syncs.length > 1 ? syncs[syncs.length - 1] : null;
      const currentTotal = currentMonth?.total_clients ?? activeClients;
      const earliestTotal = earliestSync?.total_clients ?? 0;
      const monthsSpan = syncs.length;

      let growthRate = 0;
      if (earliestTotal > 0 && earliestTotal !== currentTotal && monthsSpan >= 3) {
        const raw = ((currentTotal - earliestTotal) / earliestTotal) * 100;
        // Sanity check: if growth is negative but no clients were termed,
        // the sync data is inconsistent (e.g., inflated initial import).
        // Don't show a misleading number.
        if (raw < 0 && totalTermed === 0) {
          growthRate = 0; // Dashboard will show "not enough data" via months_of_data check
        } else {
          growthRate = raw;
        }
      }

      // Retention rate: of all clients we've ever had, what percentage are still active
      // Formula: (start + added - termed) / (start + added) * 100
      // Which simplifies to: 1 - (termed / (start + added))
      let retentionRate = 100;
      if (syncs.length > 0) {
        const totalAdded = syncs.reduce((sum: number, s: any) => sum + (s.new_clients ?? 0), 0);
        const denominator = earliestTotal + totalAdded;
        if (denominator > 0 && totalTermed > 0) {
          retentionRate = ((denominator - totalTermed) / denominator) * 100;
        }
      }

      // Compute attention count client-side (birthday, no contact, no phone)
      // This is done in useBookClients — here we just pass 0 and let the dashboard
      // use the count from useBookClients instead
      const clientsNeedingAttention = 0; // populated by useBookClients

      return {
        total_contacts: totalClients,
        active_clients: activeClients,
        total_policies: policies.length,
        active_policies: activePolicies.length,
        total_annual_renewal: totalAnnualRenewal,
        clients_needing_attention: clientsNeedingAttention,
        retention_rate: Math.round(retentionRate * 10) / 10,
        new_this_month: newThisMonth,
        growth_rate: Math.round(growthRate * 10) / 10,
        // Extra: raw termed count for dashboard display
        total_termed_12m: totalTermed,
        months_of_data: monthsSpan,
      } as BookSummary;
    },
  });
}
