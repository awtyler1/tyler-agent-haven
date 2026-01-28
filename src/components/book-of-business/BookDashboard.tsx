import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUp, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCommissions } from '@/hooks/useCommissions';
import { BookSparkline } from './BookSparkline';
import { MilestoneCard, MILESTONES } from './MilestoneCard';
import { CarrierPills } from './CarrierPills';
import { cn } from '@/lib/utils';

interface BookDashboardProps {
  profileId: string;
  refreshKey?: number;
  lastSyncAt?: string | null;
}

interface CarrierData {
  id: string;
  code: string;
  name: string;
  clientCount: number;
}

interface MonthlyBookData {
  month: string;
  totalClients: number;
}

function isDataStale(lastSyncAt: string | null | undefined): boolean {
  if (!lastSyncAt) return true;

  const lastSync = new Date(lastSyncAt);
  const now = new Date();

  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const syncMonth = lastSync.getMonth();
  const syncYear = lastSync.getFullYear();

  return !(currentMonth === syncMonth && currentYear === syncYear);
}

function formatSyncDate(lastSyncAt: string | null): string {
  if (!lastSyncAt) return 'Never';
  const date = new Date(lastSyncAt);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function BookDashboard({ profileId, refreshKey, lastSyncAt }: BookDashboardProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [totalClients, setTotalClients] = useState(0);
  const [newThisMonth, setNewThisMonth] = useState(0);
  const [carrierData, setCarrierData] = useState<CarrierData[]>([]);
  const [bookHistory, setBookHistory] = useState<number[]>([]);

  const {
    monthlyEarnings,
    annualProjection,
    isLoading: commissionsLoading,
  } = useCommissions(profileId);

  useEffect(() => {
    fetchDashboardData();
  }, [profileId, refreshKey]);

  async function fetchDashboardData() {
    setLoading(true);
    try {
      // Get latest completed sync for accurate total
      const { data: latestSync } = await supabase
        .from('monthly_syncs')
        .select('total_clients, previous_month_clients')
        .eq('profile_id', profileId)
        .eq('status', 'complete')
        .order('month', { ascending: false })
        .limit(1)
        .single();

      if (latestSync?.total_clients) {
        setTotalClients(latestSync.total_clients);

        // Calculate new this month from sync data
        const previousTotal = latestSync.previous_month_clients || 0;
        setNewThisMonth(latestSync.total_clients - previousTotal);
      } else {
        // Fallback: count from clients table
        const { count: clientCount } = await supabase
          .from('clients')
          .select('id', { count: 'exact', head: true })
          .eq('profile_id', profileId);
        setTotalClients(clientCount || 0);
      }

      // Get 6-month history for sparkline
      const { data: syncHistory } = await supabase
        .from('monthly_syncs')
        .select('month, total_clients')
        .eq('profile_id', profileId)
        .eq('status', 'complete')
        .order('month', { ascending: true })
        .limit(6);

      if (syncHistory && syncHistory.length > 0) {
        setBookHistory(syncHistory.map(s => s.total_clients || 0));
      }

      // Get carrier breakdown from latest sync
      const { data: latestSyncWithUploads } = await supabase
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
        .single();

      if (latestSyncWithUploads?.sync_carrier_uploads) {
        const carriers: CarrierData[] = latestSyncWithUploads.sync_carrier_uploads
          .filter((u: any) => u.client_count && u.client_count > 0 && u.carriers)
          .map((u: any) => ({
            id: u.carrier_id,
            code: u.carriers.code,
            name: u.carriers.name,
            clientCount: u.client_count,
          }));
        setCarrierData(carriers);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }

  // Calculate next milestone
  const nextMilestone = MILESTONES.find(m => m > totalClients) ?? 1000;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
      </div>
    );
  }

  // Stale state - needs sync
  if (isDataStale(lastSyncAt)) {
    return <StaleState lastSyncAt={lastSyncAt} />;
  }

  // Format earnings
  const formattedEarnings = monthlyEarnings?.total
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(monthlyEarnings.total)
    : '$0';

  const formattedProjection = annualProjection
    ? `$${(annualProjection / 1000).toFixed(1)}K`
    : '$0';

  const currentMonthName = new Date().toLocaleDateString('en-US', { month: 'long' });

  return (
    <div className="w-full">
      {/* Outer card with border effect */}
      <div className="bg-gradient-to-br from-[#1d1d1f] to-[#0d0d0d] rounded-[2.5rem] shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_20px_40px_-12px_rgba(0,0,0,0.2)] overflow-visible p-1">

        {/* Inner dark card */}
        <div className="bg-gradient-to-br from-[#2d2d2f] to-[#1d1d1f] rounded-[2.3rem] p-6 sm:p-8 pb-16 border border-white/5">

          {/* Header */}
          <div className="flex items-center justify-between mb-8 sm:mb-10">
            <div>
              <p className="text-white/40 text-xs font-medium uppercase tracking-widest">Your Book</p>
              <h1 className="text-white text-lg sm:text-xl font-semibold mt-1">Book of Business</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full" />
              <span className="text-white/50 text-sm">Synced {formatSyncDate(lastSyncAt)}</span>
            </div>
          </div>

          {/* Hero Section: Number + Area Chart */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-8 sm:mb-10">
            <div className="animate-[fadeInUp_0.8s_cubic-bezier(0.16,1,0.3,1)_forwards]">
              <span className="text-6xl sm:text-7xl font-bold text-white tracking-tight">
                {totalClients.toLocaleString()}
              </span>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-white/40 text-lg">clients</span>
                {newThisMonth !== 0 && (
                  <span className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1 border text-sm font-semibold rounded-xl',
                    newThisMonth > 0
                      ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                      : 'bg-red-500/20 border-red-500/30 text-red-400'
                  )}>
                    {newThisMonth > 0 ? (
                      <ArrowUp className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowUp className="w-3.5 h-3.5 rotate-180" />
                    )}
                    {Math.abs(newThisMonth)} this month
                  </span>
                )}
              </div>
            </div>

            {/* Area Chart Sparkline */}
            <BookSparkline
              data={bookHistory}
              width={140}
              height={70}
              className="hidden sm:block"
            />
          </div>

          {/* Carrier Pills */}
          {carrierData.length > 0 && (
            <CarrierPills
              carriers={carrierData}
              variant="dark"
              maxVisible={4}
            />
          )}
        </div>

        {/* Floating Milestone Card */}
        <div className="px-4 sm:px-6 -mt-10 relative z-10">
          <MilestoneCard
            currentClients={totalClients}
            nextMilestone={nextMilestone}
          />
        </div>

        {/* Earnings Section (light background) */}
        <div className="bg-white rounded-b-[2.5rem] px-4 sm:px-6 pt-8 pb-6 -mt-4">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-xs font-medium text-stone-400 uppercase tracking-wider">
                {currentMonthName} Earnings
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
                {formattedEarnings}
              </p>
            </div>
            <div className="w-px h-14 bg-stone-200 mx-4 sm:mx-6" />
            <div className="flex-1">
              <p className="text-xs font-medium text-stone-400 uppercase tracking-wider">
                {new Date().getFullYear()} Projection
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
                {formattedProjection}
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

// Stale State Component
function StaleState({ lastSyncAt }: { lastSyncAt: string | null }) {
  const navigate = useNavigate();

  const nextMonthName = new Date().toLocaleDateString('en-US', { month: 'long' });

  return (
    <div className="w-full">
      {/* Outer card */}
      <div className="bg-gradient-to-br from-[#1d1d1f] to-[#0d0d0d] rounded-[2.5rem] shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_20px_40px_-12px_rgba(0,0,0,0.2)] overflow-hidden p-1">

        {/* Inner card */}
        <div className="bg-gradient-to-br from-[#2d2d2f] to-[#1d1d1f] rounded-[2.3rem] p-10 text-center border border-white/5">

          {/* Animated sync icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-amber-500/20 to-amber-600/20 border border-amber-500/30 flex items-center justify-center animate-[float_3s_ease-in-out_infinite]">
            <svg className="w-10 h-10 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-white mb-3">
            Your {nextMonthName} numbers<br />are ready
          </h2>
          <p className="text-white/40 mb-8 max-w-xs mx-auto">
            Sync your carrier reports to see your updated book and earnings
          </p>

          <button
            onClick={() => navigate('/book-of-business')}
            className="px-10 py-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-semibold rounded-2xl transition-all transform hover:scale-[1.02] shadow-lg shadow-amber-500/25"
          >
            Sync Now
          </button>

          {lastSyncAt && (
            <p className="text-white/30 text-sm mt-6">
              Last synced {formatSyncDate(lastSyncAt)}
            </p>
          )}
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}

// First Time User State Component
export function FirstTimeState() {
  const navigate = useNavigate();

  return (
    <div className="w-full">
      {/* Outer card */}
      <div className="bg-gradient-to-br from-[#1d1d1f] to-[#0d0d0d] rounded-[2.5rem] shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_20px_40px_-12px_rgba(0,0,0,0.2)] overflow-hidden p-1">

        {/* Inner card */}
        <div className="bg-gradient-to-br from-[#2d2d2f] to-[#1d1d1f] rounded-[2.3rem] p-10 text-center border border-white/5">

          {/* Welcome icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 flex items-center justify-center">
            <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-white mb-3">Let's build your book</h2>
          <p className="text-white/40 mb-8 max-w-xs mx-auto">
            Upload your first carrier reports to start tracking your clients and earnings
          </p>

          <button
            onClick={() => navigate('/book-of-business')}
            className="px-10 py-4 bg-gradient-to-r from-blue-500 to-blue-400 hover:from-blue-400 hover:to-blue-300 text-white font-semibold rounded-2xl transition-all transform hover:scale-[1.02] shadow-lg shadow-blue-500/25"
          >
            Start Sync
          </button>
        </div>
      </div>
    </div>
  );
}
