import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AgentProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  npn: string | null;
  state: string | null;
  last_sync_at: string | null;
}

export interface CarrierBreakdown {
  carrier_name: string;
  client_count: number;
  new_this_month: number;
  termed_this_month: number;
  net_change: number;
}

export interface BookStats {
  total: number;
  ma: number;
  pdp: number;
  newThisMonth: number;
  termedThisMonth: number;
  netChange: number;
}

interface AgentBookData {
  agent: AgentProfile;
  carrierBreakdown: CarrierBreakdown[];
  bookStats: BookStats;
}

async function fetchAgentBookData(agentId: string): Promise<AgentBookData> {
  const now = new Date();
  const monthStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  ).toISOString();

  // Fetch agent profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, email, npn, state, last_sync_at')
    .eq('id', agentId)
    .single();

  if (profileError) throw profileError;

  // Fetch active and termed policies in parallel
  const [activePoliciesResult, termedPoliciesResult] = await Promise.all([
    supabase
      .from('policies')
      .select('id, plan_type, effective_date, carrier_id')
      .eq('profile_id', agentId)
      .eq('status', 'active'),
    supabase
      .from('policies')
      .select('id, carrier_id, term_date')
      .eq('profile_id', agentId)
      .eq('status', 'termed')
      .gte('term_date', monthStart),
  ]);

  if (activePoliciesResult.error) throw activePoliciesResult.error;

  const policies = activePoliciesResult.data || [];
  const termedPolicies = termedPoliciesResult.data || [];

  // Fetch carriers for mapping
  const allCarrierIds = [
    ...new Set(
      [...policies.map((p) => p.carrier_id), ...termedPolicies.map((p) => p.carrier_id)].filter(
        Boolean
      )
    ),
  ];
  const { data: carriers } = await supabase
    .from('carriers')
    .select('id, name')
    .in(
      'id',
      allCarrierIds.length > 0
        ? allCarrierIds
        : ['00000000-0000-0000-0000-000000000000']
    );

  const carrierMap = new Map((carriers || []).map((c) => [c.id, c.name]));

  // Calculate stats
  const total = policies.length;
  const ma = policies.filter((p) => p.plan_type === 'MA').length;
  const pdp = policies.filter((p) => p.plan_type === 'PDP').length;
  const newThisMonth = policies.filter(
    (p) => p.effective_date && new Date(p.effective_date) >= new Date(monthStart)
  ).length;
  const termedThisMonth = termedPolicies.length;
  const netChange = newThisMonth - termedThisMonth;

  // Calculate carrier breakdown
  const carrierStats = new Map<
    string,
    { count: number; newThisMonth: number; termedThisMonth: number }
  >();
  policies.forEach((p) => {
    const carrierName = carrierMap.get(p.carrier_id) || 'Unknown';
    const existing = carrierStats.get(carrierName) || {
      count: 0,
      newThisMonth: 0,
      termedThisMonth: 0,
    };
    existing.count++;
    if (
      p.effective_date &&
      new Date(p.effective_date) >= new Date(monthStart)
    ) {
      existing.newThisMonth++;
    }
    carrierStats.set(carrierName, existing);
  });

  // Add termed counts per carrier
  termedPolicies.forEach((p) => {
    const carrierName = carrierMap.get(p.carrier_id) || 'Unknown';
    const existing = carrierStats.get(carrierName) || {
      count: 0,
      newThisMonth: 0,
      termedThisMonth: 0,
    };
    existing.termedThisMonth++;
    carrierStats.set(carrierName, existing);
  });

  const carrierBreakdown = Array.from(carrierStats.entries())
    .map(([carrier_name, stats]) => ({
      carrier_name,
      client_count: stats.count,
      new_this_month: stats.newThisMonth,
      termed_this_month: stats.termedThisMonth,
      net_change: stats.newThisMonth - stats.termedThisMonth,
    }))
    .sort((a, b) => b.client_count - a.client_count);

  return {
    agent: profile,
    carrierBreakdown,
    bookStats: { total, ma, pdp, newThisMonth, termedThisMonth, netChange },
  };
}

export function useAdminAgentBook(agentId: string | undefined) {
  const query = useQuery({
    queryKey: ['admin-agent-book', agentId],
    queryFn: () => fetchAgentBookData(agentId!),
    enabled: !!agentId,
    staleTime: 2 * 60 * 1000,
  });

  return {
    agent: query.data?.agent ?? null,
    carrierBreakdown: query.data?.carrierBreakdown ?? [],
    bookStats: query.data?.bookStats ?? {
      total: 0,
      ma: 0,
      pdp: 0,
      newThisMonth: 0,
      termedThisMonth: 0,
      netChange: 0,
    },
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
