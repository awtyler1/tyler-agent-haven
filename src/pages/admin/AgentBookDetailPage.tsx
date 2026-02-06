import { useParams, useNavigate } from 'react-router-dom';
import { Info, RefreshCw } from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { PageLoader } from '@/components/ui/PageLoader';
import { useAdminAgentBook } from '@/hooks/useAdminAgentBook';

export default function AgentBookDetailPage() {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const { agent, carrierBreakdown, bookStats, isLoading, refetch } = useAdminAgentBook(agentId);

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
    return <PageLoader message="Loading agent data..." />;
  }

  if (!agent) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <p className="text-stone-500 dark:text-stone-400">Agent not found</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout maxWidth="narrow">
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
          <div className="flex items-start gap-3">
            <div className="text-right">
              <p className="text-sm text-stone-500 dark:text-stone-400">NPN</p>
              <p className="font-mono text-stone-900 dark:text-white">{agent.npn || '—'}</p>
            </div>
            <button
              onClick={() => refetch()}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-[#2C2C2E] dark:hover:text-stone-300 transition-colors"
              title="Refresh data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
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
          {(bookStats.newThisMonth > 0 || bookStats.termedThisMonth > 0) && (
            <div className="text-right">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${
                bookStats.netChange > 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800' :
                bookStats.netChange < 0 ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800' :
                'bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-700'
              }`}>
                <span className={`font-semibold text-sm ${
                  bookStats.netChange > 0 ? 'text-emerald-700 dark:text-emerald-400' :
                  bookStats.netChange < 0 ? 'text-amber-700 dark:text-amber-400' :
                  'text-stone-600 dark:text-stone-400'
                }`}>
                  net {bookStats.netChange > 0 ? '+' : ''}{bookStats.netChange} this month
                </span>
              </div>
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
                +{bookStats.newThisMonth} new · -{bookStats.termedThisMonth} termed
              </p>
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
                    {(carrier.new_this_month > 0 || carrier.termed_this_month > 0) && (
                      <p className={`text-xs ${
                        carrier.net_change > 0 ? 'text-emerald-600 dark:text-emerald-400' :
                        carrier.net_change < 0 ? 'text-amber-600 dark:text-amber-400' :
                        'text-stone-500 dark:text-stone-400'
                      }`}>
                        net {carrier.net_change > 0 ? '+' : ''}{carrier.net_change}
                        <span className="text-stone-400 dark:text-stone-500"> (+{carrier.new_this_month} / -{carrier.termed_this_month})</span>
                      </p>
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
