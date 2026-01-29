import { useState, useEffect, useCallback } from 'react';
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
 * useDashboardData - Fetches and computes all dashboard data
 *
 * Sources:
 * - Profile from useProfile/useAuth
 * - Book data from monthly_syncs table
 * - Carrier breakdown from sync_carrier_uploads
 */
export function useDashboardData(): UseDashboardDataReturn {
  const { profile, loading: profileLoading } = useProfile();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDashboardData = useCallback(async () => {
    if (!profile?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const profileId = profile.id;

      // Get all completed syncs for history and calculations
      const { data: syncHistory, error: syncError } = await supabase
        .from('monthly_syncs')
        .select('month, total_clients, previous_month_clients, new_clients, created_at')
        .eq('profile_id', profileId)
        .eq('status', 'complete')
        .order('month', { ascending: true });

      if (syncError) throw syncError;

      // Calculate metrics from sync history
      let totalClients = 0;
      let newThisMonth = 0;
      let lastSyncAt: string | null = null;
      const monthlyHistory: number[] = [];
      let growthStreak = 0;

      if (syncHistory && syncHistory.length > 0) {
        // Get last 6 months for sparkline
        const recentSyncs = syncHistory.slice(-6);
        monthlyHistory.push(...recentSyncs.map((s) => s.total_clients || 0));

        // Latest sync data
        const latest = syncHistory[syncHistory.length - 1];
        totalClients = latest.total_clients || 0;
        // Use stored new_clients (based on effective_date) instead of delta calculation
        newThisMonth = latest.new_clients || 0;
        lastSyncAt = latest.created_at;

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
        var avgNewPerMonth = growthMonths > 0 ? Math.round(totalGrowth / growthMonths) : undefined;

        // Find best month
        let bestMonthData: { month: string; count: number } | undefined;
        let maxGrowth = 0;
        for (let i = 1; i < syncHistory.length; i++) {
          const diff = (syncHistory[i].total_clients || 0) - (syncHistory[i - 1].total_clients || 0);
          if (diff > maxGrowth) {
            maxGrowth = diff;
            const monthDate = new Date(syncHistory[i].month);
            bestMonthData = {
              month: monthDate.toLocaleDateString('en-US', { month: 'long' }),
              count: diff,
            };
          }
        }
        var bestMonth = bestMonthData;
      }

      // Determine sync status using the 7th-of-month rule
      const syncStatus = determineSyncStatus(lastSyncAt);

      // Get carrier breakdown from latest sync
      const { data: latestSyncWithCarriers } = await supabase
        .from('monthly_syncs')
        .select(
          `
          id,
          sync_carrier_uploads (
            carrier_id,
            client_count,
            carriers (id, code, name)
          )
        `
        )
        .eq('profile_id', profileId)
        .eq('status', 'complete')
        .order('month', { ascending: false })
        .limit(1)
        .single();

      const carriers: CarrierData[] = [];
      if (latestSyncWithCarriers?.sync_carrier_uploads) {
        const uploads = latestSyncWithCarriers.sync_carrier_uploads as any[];
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
      const firstName = profile.full_name?.split(' ')[0] || 'Agent';
      const initials = profile.full_name
        ? profile.full_name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
        : 'AG';

      setData({
        profileId,
        firstName,
        fullName: profile.full_name,
        initials,
        totalClients,
        newThisMonth,
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
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err : new Error('Failed to load dashboard data'));
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    if (!profileLoading) {
      fetchDashboardData();
    }
  }, [profileLoading, fetchDashboardData]);

  return {
    data,
    isLoading: isLoading || profileLoading,
    error,
    refetch: fetchDashboardData,
  };
}
