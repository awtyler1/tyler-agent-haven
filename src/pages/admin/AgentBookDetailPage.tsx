import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Info, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/layout/AdminLayout';

interface AgentProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  npn: string | null;
  state: string | null;
  last_sync_at: string | null;
}

interface CarrierBreakdown {
  carrier_name: string;
  client_count: number;
  new_this_month: number;
}

export default function AgentBookDetailPage() {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [carrierBreakdown, setCarrierBreakdown] = useState<CarrierBreakdown[]>([]);
  const [bookStats, setBookStats] = useState({ total: 0, ma: 0, pdp: 0, newThisMonth: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const monthStart = new Date(currentYear, currentMonth, 1).toISOString();

  useEffect(() => {
    if (agentId) {
      fetchAgentData();
    }
  }, [agentId]);

  const fetchAgentData = async () => {
    try {
      // Fetch agent profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email, npn, state, last_sync_at')
        .eq('id', agentId)
        .single();

      if (profileError) throw profileError;
      setAgent(profile);

      // Fetch policies with carrier info
      const { data: policies, error: policiesError } = await supabase
        .from('policies')
        .select(`
          id,
          plan_type,
          effective_date,
          carrier_id
        `)
        .eq('profile_id', agentId)
        .eq('status', 'active');

      if (policiesError) throw policiesError;

      // Fetch carriers for mapping
      const carrierIds = [...new Set((policies || []).map(p => p.carrier_id).filter(Boolean))];
      const { data: carriers } = await supabase
        .from('carriers')
        .select('id, name')
        .in('id', carrierIds.length > 0 ? carrierIds : ['00000000-0000-0000-0000-000000000000']);

      const carrierMap = new Map((carriers || []).map(c => [c.id, c.name]));

      // Calculate stats
      const total = policies?.length || 0;
      const ma = policies?.filter(p => p.plan_type === 'MA').length || 0;
      const pdp = policies?.filter(p => p.plan_type === 'PDP').length || 0;
      const newThisMonth = policies?.filter(p =>
        p.effective_date && new Date(p.effective_date) >= new Date(monthStart)
      ).length || 0;

      setBookStats({ total, ma, pdp, newThisMonth });

      // Calculate carrier breakdown
      const carrierStats = new Map<string, { count: number; newThisMonth: number }>();
      policies?.forEach(p => {
        const carrierName = carrierMap.get(p.carrier_id) || 'Unknown';
        const existing = carrierStats.get(carrierName) || { count: 0, newThisMonth: 0 };
        existing.count++;
        if (p.effective_date && new Date(p.effective_date) >= new Date(monthStart)) {
          existing.newThisMonth++;
        }
        carrierStats.set(carrierName, existing);
      });

      const breakdown = Array.from(carrierStats.entries())
        .map(([carrier_name, stats]) => ({
          carrier_name,
          client_count: stats.count,
          new_this_month: stats.newThisMonth,
        }))
        .sort((a, b) => b.client_count - a.client_count);

      setCarrierBreakdown(breakdown);

    } catch (err) {
      console.error('Error fetching agent data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getSyncStatus = () => {
    if (!agent?.last_sync_at) return { status: 'never', label: 'Never synced' };

    const lastSync = new Date(agent.last_sync_at);
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const syncMonth = lastSync.getMonth();
    const syncYear = lastSync.getFullYear();

    if (currentMonth === syncMonth && currentYear === syncYear) {
      return { status: 'current', label: `Synced ${lastSync.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` };
    }

    const diffDays = Math.floor((now.getTime() - lastSync.getTime()) / (1000 * 60 * 60 * 24));
    return { status: 'stale', label: `Last synced ${diffDays} days ago` };
  };

  const getInitials = (name: string | null) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const syncStatus = getSyncStatus();

  const carrierColors: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
    'Humana': { bg: 'bg-emerald-100', text: 'text-emerald-700', darkBg: 'dark:bg-emerald-900/30', darkText: 'dark:text-emerald-400' },
    'Aetna': { bg: 'bg-violet-100', text: 'text-violet-700', darkBg: 'dark:bg-violet-900/30', darkText: 'dark:text-violet-400' },
    'Anthem': { bg: 'bg-blue-100', text: 'text-blue-700', darkBg: 'dark:bg-blue-900/30', darkText: 'dark:text-blue-400' },
    'Wellcare': { bg: 'bg-sky-100', text: 'text-sky-700', darkBg: 'dark:bg-sky-900/30', darkText: 'dark:text-sky-400' },
    'UnitedHealthcare': { bg: 'bg-red-100', text: 'text-red-700', darkBg: 'dark:bg-red-900/30', darkText: 'dark:text-red-400' },
    'default': { bg: 'bg-stone-100', text: 'text-stone-700', darkBg: 'dark:bg-stone-800', darkText: 'dark:text-stone-300' },
  };

  const getCarrierColor = (name: string) => carrierColors[name] || carrierColors.default;

  if (isLoading) {
    return (
      <AdminLayout showBackButton backLabel="Agent Books" onBack={() => navigate('/admin/agents/book')}>
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
            <p className="text-stone-500 dark:text-stone-400">Loading agent data...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!agent) {
    return (
      <AdminLayout showBackButton backLabel="Agent Books" onBack={() => navigate('/admin/agents/book')}>
        <div className="flex items-center justify-center py-20">
          <p className="text-stone-500 dark:text-stone-400">Agent not found</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout maxWidth="narrow" showBackButton backLabel="Agent Books" onBack={() => navigate('/admin/agents/book')}>
      {/* Agent Header Card */}
      <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-sm border border-stone-200 dark:border-[#38383A] p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
              <span className="text-blue-700 dark:text-blue-400 font-bold text-xl">{getInitials(agent.full_name)}</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-stone-900 dark:text-white">{agent.full_name}</h2>
              <p className="text-stone-500 dark:text-stone-400">Agent · {agent.state || 'Unknown'}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${
                  syncStatus.status === 'current' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                  syncStatus.status === 'stale' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                  'bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    syncStatus.status === 'current' ? 'bg-emerald-500' :
                    syncStatus.status === 'stale' ? 'bg-amber-500' :
                    'bg-stone-400'
                  }`}></span>
                  {syncStatus.status === 'current' ? 'Current' :
                   syncStatus.status === 'stale' ? 'Stale' : 'No Data'}
                </span>
                <span className="text-sm text-stone-500 dark:text-stone-400">{syncStatus.label}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-stone-500 dark:text-stone-400">NPN</p>
            <p className="font-mono text-stone-900 dark:text-white">{agent.npn || '—'}</p>
          </div>
        </div>
      </div>

      {/* Admin Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6 flex items-center gap-3">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <p className="text-sm text-blue-800 dark:text-blue-300">You're viewing this agent's book as an admin. Data is read-only.</p>
      </div>

      {/* Book Size Card */}
      <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-sm border border-stone-200 dark:border-[#38383A] p-8 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-sm font-medium text-stone-500 dark:text-stone-400 mb-1">Book Size</p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold text-stone-900 dark:text-white">{bookStats.total}</span>
              <span className="text-lg text-stone-400 dark:text-stone-500">clients</span>
            </div>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">{bookStats.ma} MA · {bookStats.pdp} PDP</p>
          </div>
          {bookStats.newThisMonth > 0 && (
            <div className="text-right">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-full border border-emerald-100 dark:border-emerald-800">
                <svg className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd"/>
                </svg>
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold text-sm">+{bookStats.newThisMonth} this month</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Carrier Breakdown */}
      <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-sm border border-stone-200 dark:border-[#38383A] overflow-hidden">
        <div className="px-6 py-5 border-b border-stone-100 dark:border-[#38383A]">
          <h3 className="font-semibold text-stone-900 dark:text-white">By Carrier</h3>
        </div>

        {carrierBreakdown.length === 0 ? (
          <div className="px-6 py-12 text-center text-stone-500 dark:text-stone-400">
            No carrier data available
          </div>
        ) : (
          <div className="divide-y divide-stone-100 dark:divide-[#38383A]">
            {carrierBreakdown.map(carrier => {
              const colors = getCarrierColor(carrier.carrier_name);
              return (
                <div key={carrier.carrier_name} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${colors.bg} ${colors.darkBg} rounded-xl flex items-center justify-center`}>
                      <span className={`${colors.text} ${colors.darkText} font-bold text-sm`}>
                        {carrier.carrier_name.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <p className="font-medium text-stone-900 dark:text-white">{carrier.carrier_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-stone-900 dark:text-white">{carrier.client_count} clients</p>
                    {carrier.new_this_month > 0 && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">+{carrier.new_this_month} this mo</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
