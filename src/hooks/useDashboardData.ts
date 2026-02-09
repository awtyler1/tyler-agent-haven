import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { MILESTONES } from '@/components/dashboard/NextGoalCard';

// Carrier color mapping
const CARRIER_COLORS: Record<string, string> = {
  humana: 'bg-emerald-500',
  aetna: 'bg-purple-500',
  anthem: 'bg-blue-500',
  wellcare: 'bg-amber-500',
  cigna: 'bg-red-500',
  unitedhealthcare: 'bg-sky-500',
  uhc: 'bg-sky-500',
  centene: 'bg-orange-500',
  // Add more as needed
};

function getCarrierColor(carrierCode: string): string {
  const normalizedCode = carrierCode.toLowerCase().replace(/[^a-z]/g, '');
  return CARRIER_COLORS[normalizedCode] || 'bg-slate-500';
}

/**
 * Determine sync status based on last sync date
 * Uses the "7th of the month" rule - if we're past the 7th and haven't synced this month, it's stale
 */
function determineSyncStatus(lastSyncAt: string | null): 'synced' | 'stale' | 'never' {
  if (!lastSyncAt) return 'never';

  const lastSync = new Date(lastSyncAt);
  const now = new Date();

  // Get current month's 7th
  const currentMonth7th = new Date(now.getFullYear(), now.getMonth(), 7);

  // If we're past the 7th of this month
  if (now.getDate() > 7) {
    // Stale if last sync was before this month's 7th
    if (lastSync < currentMonth7th) {
      return 'stale';
    }
  } else {
    // Before the 7th - check if synced this month or last month after the 7th
    const lastMonth7th = new Date(now.getFullYear(), now.getMonth() - 1, 7);
    if (lastSync < lastMonth7th) {
      return 'stale';
    }
  }

  return 'synced';
}

export interface CarrierData {
  id: string;
  code: string;
  name: string;
  count: number;
  color: string;
}

export interface DashboardData {
  // Profile
  profileId: string;
  firstName: string;
  fullName: string | null;
  initials: string;

  // Book metrics
  totalClients: number;
  newThisMonth: number;
  termedThisMonth: number;
  netChange: number;
  growthStreak: number;
  monthlyHistory: number[];
  carriers: CarrierData[];

  // Milestones
  milestonesHit: number[];
  nextMilestone: number;
  lastMilestone: number;
  projectedDate?: string;
  avgNewPerMonth?: number;
  bestMonth?: { month: string; count: number };

  // Sync status
  syncStatus: 'synced' | 'stale' | 'never';
  lastSyncAt: string | null;
}

interface UseDashboardDataReturn {
  data: DashboardData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Fetch and compute all dashboard data
 * Parallelizes both Supabase queries for faster loading
 */
async function fetchDashboardData(
  profileId: string,
  profileFullName: string | null
): Promise<DashboardData> {
  // Run BOTH queries in parallel for faster loading
  const [syncHistoryResult, carrierDataResult] = await Promise.all([
    // Query 1: All completed syncs for history and calculations
    supabase
      .from('monthly_syncs')
      .select('*')
      .eq('profile_id', profileId)
      .eq('status', 'complete')
      .order('month', { ascending: true }),

    // Query 2: Carrier breakdown from latest sync
    supabase
      .from('monthly_syncs')
      .select(`
        id,
        sync_carrier_uploads (
          carrier_id,
          client_count,
          carriers (id, code, name)
        )
      `)
      .eq('profile_id', profileId)
      .eq('status', 'complete')
      .order('month', { ascending: false })
      .limit(1)
      .single(),
  ]);

  if (syncHistoryResult.error) throw syncHistoryResult.error;

  const syncHistory = syncHistoryResult.data || [];

  // Calculate metrics from sync history
  let totalClients = 0;
  let newThisMonth = 0;
  let termedThisMonth = 0;
  let netChange = 0;
  let lastSyncAt: string | null = null;
  const monthlyHistory: number[] = [];
  let growthStreak = 0;
  let avgNewPerMonth: number | undefined;
  let bestMonth: { month: string; count: number } | undefined;

  if (syncHistory.length > 0) {
    // Get last 6 months for sparkline
    const recentSyncs = syncHistory.slice(-6);
    monthlyHistory.push(...recentSyncs.map((s) => s.total_clients || 0));

    // Latest sync data
    const latest = syncHistory[syncHistory.length - 1];
    totalClients = latest.total_clients || 0;
    // Use stored new_clients (based on effective_date) instead of delta calculation
    newThisMonth = latest.new_clients || 0;
    termedThisMonth = latest.termed_clients || 0;
    netChange = latest.net_change ?? (newThisMonth - termedThisMonth);
    lastSyncAt = latest.completed_at || latest.created_at;

    // Calculate growth streak (consecutive months of positive growth)
    for (let i = syncHistory.length - 1; i > 0; i--) {
      const current = syncHistory[i].total_clients || 0;
      const previous = syncHistory[i - 1].total_clients || 0;
      if (current > previous) {
        growthStreak++;
      } else {
        break;
      }
    }

    // Calculate average new per month
    let totalGrowth = 0;
    let growthMonths = 0;
    for (let i = 1; i < syncHistory.length; i++) {
      const diff = (syncHistory[i].total_clients || 0) - (syncHistory[i - 1].total_clients || 0);
      if (diff > 0) {
        totalGrowth += diff;
        growthMonths++;
      }
    }
    avgNewPerMonth = growthMonths > 0 ? Math.round(totalGrowth / growthMonths) : undefined;

    // Find best month
    let maxGrowth = 0;
    for (let i = 1; i < syncHistory.length; i++) {
      const diff = (syncHistory[i].total_clients || 0) - (syncHistory[i - 1].total_clients || 0);
      if (diff > maxGrowth) {
        maxGrowth = diff;
        const monthDate = new Date(syncHistory[i].month);
        bestMonth = {
          month: monthDate.toLocaleDateString('en-US', { month: 'long' }),
          count: diff,
        };
      }
    }
  }

  // Determine sync status using the 7th-of-month rule
  const syncStatus = determineSyncStatus(lastSyncAt);

  // Process carrier breakdown
  const carriers: CarrierData[] = [];
  if (carrierDataResult.data?.sync_carrier_uploads) {
    const uploads = carrierDataResult.data.sync_carrier_uploads as any[];
    for (const u of uploads) {
      if (u.client_count && u.client_count > 0 && u.carriers) {
        carriers.push({
          id: u.carrier_id,
          code: u.carriers.code,
          name: u.carriers.name,
          count: u.client_count,
          color: getCarrierColor(u.carriers.code),
        });
      }
    }
    // Sort by count descending
    carriers.sort((a, b) => b.count - a.count);
  }

  // Calculate milestones
  const milestonesHit = MILESTONES.filter((m) => m <= totalClients);
  const nextMilestone = MILESTONES.find((m) => m > totalClients) || totalClients + 100;
  const lastMilestone = milestonesHit.length > 0 ? milestonesHit[milestonesHit.length - 1] : 0;

  // Project date to next milestone
  let projectedDate: string | undefined;
  if (avgNewPerMonth && avgNewPerMonth > 0) {
    const toGoal = nextMilestone - totalClients;
    const monthsToGoal = Math.ceil(toGoal / avgNewPerMonth);
    const projDate = new Date();
    projDate.setMonth(projDate.getMonth() + monthsToGoal);
    projectedDate = projDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // Build profile data
  const firstName = profileFullName?.split(' ')[0] || 'Agent';
  const initials = profileFullName
    ? profileFullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'AG';

  return {
    profileId,
    firstName,
    fullName: profileFullName,
    initials,
    totalClients,
    newThisMonth,
    termedThisMonth,
    netChange,
    growthStreak,
    monthlyHistory,
    carriers,
    milestonesHit,
    nextMilestone,
    lastMilestone,
    projectedDate,
    avgNewPerMonth,
    bestMonth,
    syncStatus,
    lastSyncAt,
  };
}

/**
 * useDashboardData - Fetches and computes all dashboard data with caching
 *
 * Uses React Query for:
 * - Automatic caching (5 minute stale time)
 * - No refetch on tab switch
 * - Instant data on navigation back to dashboard
 *
 * Sources:
 * - Profile from useProfile/useAuth
 * - Book data from monthly_syncs table
 * - Carrier breakdown from sync_carrier_uploads
 */
export function useDashboardData(): UseDashboardDataReturn {
  const { profile, loading: profileLoading } = useProfile();

  const query = useQuery({
    queryKey: ['dashboard', profile?.id],
    queryFn: () => fetchDashboardData(profile!.id, profile!.full_name),
    enabled: !!profile?.id && !profileLoading,
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading || profileLoading,
    error: query.error as Error | null,
    refetch: async () => {
      await query.refetch();
    },
  };
}
