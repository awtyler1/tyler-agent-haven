import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AgentWithBook {
  id: string;
  full_name: string | null;
  email: string | null;
  state: string | null;
  last_sync_at: string | null;
  policy_count: number;
  new_this_month: number;
  termed_this_month: number;
  net_change: number;
}

async function fetchAgentsBook(): Promise<AgentWithBook[]> {
  const now = new Date();
  const monthStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  ).toISOString();

  // Fetch profiles, active policies, and termed policies in parallel
  const [profilesResult, activePoliciesResult, termedPoliciesResult] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, email, state, last_sync_at')
        .eq('is_active', true)
        .order('full_name'),
      supabase
        .from('policies')
        .select('profile_id, effective_date')
        .eq('status', 'active'),
      supabase
        .from('policies')
        .select('profile_id, term_date')
        .eq('status', 'termed')
        .gte('term_date', monthStart),
    ]);

  if (profilesResult.error) throw profilesResult.error;

  const profiles = profilesResult.data || [];
  const activePolicies = activePoliciesResult.data || [];
  const termedPolicies = termedPoliciesResult.data || [];

  // Build policy counts map in a single pass
  const policyCounts = new Map<
    string,
    { total: number; newThisMonth: number; termedThisMonth: number }
  >();

  for (const policy of activePolicies) {
    if (!policy.profile_id) continue;

    const existing = policyCounts.get(policy.profile_id) || {
      total: 0,
      newThisMonth: 0,
      termedThisMonth: 0,
    };
    existing.total += 1;

    if (policy.effective_date && policy.effective_date >= monthStart) {
      existing.newThisMonth += 1;
    }

    policyCounts.set(policy.profile_id, existing);
  }

  // Add termed counts
  for (const policy of termedPolicies) {
    if (!policy.profile_id) continue;

    const existing = policyCounts.get(policy.profile_id) || {
      total: 0,
      newThisMonth: 0,
      termedThisMonth: 0,
    };
    existing.termedThisMonth += 1;
    policyCounts.set(policy.profile_id, existing);
  }

  // Merge profiles with policy counts
  const agentsWithCounts: AgentWithBook[] = profiles.map((profile) => {
    const counts = policyCounts.get(profile.id) || {
      total: 0,
      newThisMonth: 0,
      termedThisMonth: 0,
    };
    return {
      ...profile,
      policy_count: counts.total,
      new_this_month: counts.newThisMonth,
      termed_this_month: counts.termedThisMonth,
      net_change: counts.newThisMonth - counts.termedThisMonth,
    };
  });

  // Filter out agents with no policies and no sync
  return agentsWithCounts.filter(
    (a) => a.policy_count > 0 || a.last_sync_at
  );
}

export function useAdminAgentsBook() {
  const query = useQuery({
    queryKey: ['admin-agents-book'],
    queryFn: fetchAgentsBook,
    staleTime: 2 * 60 * 1000,
  });

  return {
    agents: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
