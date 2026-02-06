import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, ChevronRight, Download, Loader2, RefreshCw } from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useAdminAgentsBook, type AgentWithBook } from '@/hooks/useAdminAgentsBook';

type SyncStatus = 'current' | 'stale' | 'very-stale' | 'never';

function getSyncStatus(lastSyncAt: string | null): SyncStatus {
  if (!lastSyncAt) return 'never';

  const lastSync = new Date(lastSyncAt);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - lastSync.getTime()) / (1000 * 60 * 60 * 24));

  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const syncMonth = lastSync.getMonth();
  const syncYear = lastSync.getFullYear();

  if (currentMonth === syncMonth && currentYear === syncYear) {
    return 'current';
  } else if (diffDays <= 45) {
    return 'stale';
  } else {
    return 'very-stale';
  }
}

function formatSyncDate(lastSyncAt: string | null): string {
  if (!lastSyncAt) return 'Never';
  return new Date(lastSyncAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

export default function AgentsBookPage() {
  const navigate = useNavigate();
  const { agents, isLoading, refetch } = useAdminAgentsBook();

  // URL state persistence
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const statusFilter = (searchParams.get('status') as 'all' | SyncStatus) || 'all';

  const updateParams = (updates: Record<string, string | null>) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '') next.delete(key);
        else next.set(key, value);
      });
      return next;
    }, { replace: true });
  };

  // Filter agents
  const filteredAgents = agents.filter(agent => {
    // Search filter
    const matchesSearch = !searchQuery ||
      agent.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.email?.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const status = getSyncStatus(agent.last_sync_at);
    const matchesStatus = statusFilter === 'all' || status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Summary stats
  const totalAgents = agents.length;
  const totalClients = agents.reduce((sum, a) => sum + a.policy_count, 0);
  const syncedThisMonth = agents.filter(a => getSyncStatus(a.last_sync_at) === 'current').length;
  const needsAttention = agents.filter(a => getSyncStatus(a.last_sync_at) !== 'current').length;
  const newThisMonth = agents.reduce((sum, a) => sum + a.new_this_month, 0);
  const termedThisMonth = agents.reduce((sum, a) => sum + a.termed_this_month, 0);
  const netChangeTotal = newThisMonth - termedThisMonth;

  const getInitials = (name: string | null) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const StatusBadge = ({ status }: { status: SyncStatus }) => {
    const styles = {
      current: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      stale: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      'very-stale': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      never: 'bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400',
    };
    const labels = {
      current: 'Current',
      stale: 'Stale',
      'very-stale': 'Very Stale',
      never: 'No Data',
    };
    const dots = {
      current: 'bg-emerald-500',
      stale: 'bg-amber-500',
      'very-stale': 'bg-red-500',
      never: 'bg-stone-400',
    };

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dots[status]}`}></span>
        {labels[status]}
      </span>
    );
  };

  return (
    <AdminLayout>
      {/* Page Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-white">Agent Book Tracking</h1>
          <p className="text-stone-500 dark:text-stone-400 mt-1">Monitor agent sync status and book sizes</p>
        </div>
        <button
          onClick={() => refetch()}
          className="p-2 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-[#2C2C2E] dark:hover:text-stone-300 transition-colors"
          title="Refresh data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-5 shadow-sm border border-stone-200 dark:border-[#38383A]">
          <p className="text-sm text-stone-500 dark:text-stone-400 mb-1">Total Agents</p>
          <p className="text-3xl font-bold text-stone-900 dark:text-white">{totalAgents}</p>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">with book data</p>
        </div>

        <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-5 shadow-sm border border-stone-200 dark:border-[#38383A]">
          <p className="text-sm text-stone-500 dark:text-stone-400 mb-1">Total Clients</p>
          <p className="text-3xl font-bold text-stone-900 dark:text-white">{totalClients.toLocaleString()}</p>
          <p className={`text-xs mt-1 ${netChangeTotal > 0 ? 'text-emerald-600 dark:text-emerald-400' : netChangeTotal < 0 ? 'text-amber-600 dark:text-amber-400' : 'text-stone-400 dark:text-stone-500'}`}>
            net {netChangeTotal > 0 ? '+' : ''}{netChangeTotal} this month
            {(newThisMonth > 0 || termedThisMonth > 0) && (
              <span className="text-stone-400 dark:text-stone-500"> (+{newThisMonth} / -{termedThisMonth})</span>
            )}
          </p>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-5 shadow-sm border border-emerald-200 dark:border-emerald-800">
          <p className="text-sm text-emerald-700 dark:text-emerald-400 mb-1">Synced This Month</p>
          <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">{syncedThisMonth}</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">
            {totalAgents > 0 ? Math.round((syncedThisMonth / totalAgents) * 100) : 0}% compliance
          </p>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-5 shadow-sm border border-amber-200 dark:border-amber-800">
          <p className="text-sm text-amber-700 dark:text-amber-400 mb-1">Needs Attention</p>
          <p className="text-3xl font-bold text-amber-700 dark:text-amber-400">{needsAttention}</p>
          <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">not synced yet</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-sm border border-stone-200 dark:border-[#38383A] p-4 mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search agents..."
                value={searchQuery}
                onChange={(e) => updateParams({ q: e.target.value || null })}
                className="pl-9 pr-4 py-2 border border-stone-200 dark:border-[#38383A] rounded-xl text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-[#2C2C2E] dark:text-white dark:placeholder-stone-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => updateParams({ status: e.target.value === 'all' ? null : e.target.value })}
              className="px-3 py-2 border border-stone-200 dark:border-[#38383A] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#2C2C2E] dark:text-white"
            >
              <option value="all">All Agents</option>
              <option value="current">Synced This Month</option>
              <option value="stale">Needs Sync</option>
              <option value="never">Never Synced</option>
            </select>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 text-sm text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Agent Table */}
      <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-sm border border-stone-200 dark:border-[#38383A] overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead className="bg-stone-50 dark:bg-[#2C2C2E] border-b border-stone-200 dark:border-[#38383A]">
            <tr>
              <th className="text-left px-6 py-4 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Agent</th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Book Size</th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Net (This Mo)</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Last Sync</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Status</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-[#38383A]">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="flex items-center justify-center gap-2 text-stone-500 dark:text-stone-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Loading agents...
                  </div>
                </td>
              </tr>
            ) : filteredAgents.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-stone-500 dark:text-stone-400">
                  No agents found
                </td>
              </tr>
            ) : (
              filteredAgents.map(agent => {
                const status = getSyncStatus(agent.last_sync_at);
                const rowBg = status === 'stale' ? 'bg-amber-50/30 dark:bg-amber-900/10' :
                             status === 'very-stale' || status === 'never' ? 'bg-red-50/30 dark:bg-red-900/10' : '';

                return (
                  <tr
                    key={agent.id}
                    className={`hover:bg-stone-50 dark:hover:bg-[#2C2C2E] cursor-pointer ${rowBg}`}
                    onClick={() => navigate(`/admin/agents/${agent.id}/book`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-stone-100 dark:bg-[#3A3A3C] rounded-full flex items-center justify-center">
                          <span className="text-stone-600 dark:text-stone-300 font-semibold text-sm">
                            {getInitials(agent.full_name)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-stone-900 dark:text-white">{agent.full_name || 'Unknown'}</p>
                          <p className="text-sm text-stone-500 dark:text-stone-400">{agent.state || 'No state'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className={`font-semibold ${status !== 'current' && agent.policy_count > 0 ? 'text-stone-500 dark:text-stone-400' : 'text-stone-900 dark:text-white'}`}>
                        {agent.policy_count > 0 ? agent.policy_count : '—'}
                      </p>
                      {status !== 'current' && agent.policy_count > 0 && (
                        <p className="text-xs text-amber-600 dark:text-amber-400">outdated</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {agent.net_change !== 0 ? (
                        <div>
                          <p className={`font-medium ${agent.net_change > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                            {agent.net_change > 0 ? '+' : ''}{agent.net_change}
                          </p>
                          {(agent.new_this_month > 0 || agent.termed_this_month > 0) && (
                            <p className="text-[10px] text-stone-400 dark:text-stone-500">
                              +{agent.new_this_month} / -{agent.termed_this_month}
                            </p>
                          )}
                        </div>
                      ) : agent.new_this_month > 0 || agent.termed_this_month > 0 ? (
                        <div>
                          <p className="text-stone-500 dark:text-stone-400 font-medium">0</p>
                          <p className="text-[10px] text-stone-400 dark:text-stone-500">
                            +{agent.new_this_month} / -{agent.termed_this_month}
                          </p>
                        </div>
                      ) : (
                        <p className="text-stone-400 dark:text-stone-500">—</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className={status === 'current' ? 'text-stone-600 dark:text-stone-300' :
                                   status === 'stale' ? 'text-amber-600 dark:text-amber-400' :
                                   status === 'never' ? 'text-stone-400 dark:text-stone-500' : 'text-red-500 dark:text-red-400'}>
                        {formatSyncDate(agent.last_sync_at)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={status} />
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>

        {/* Pagination placeholder */}
        {filteredAgents.length > 0 && (
          <div className="px-6 py-4 border-t border-stone-200 dark:border-[#38383A] flex items-center justify-between">
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Showing {filteredAgents.length} of {agents.length} agents
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
