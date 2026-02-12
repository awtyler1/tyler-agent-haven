import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowUpDown, Loader2, Phone, BookOpen } from 'lucide-react';
import { useMyClients, type StatusFilter } from '@/hooks/useMyClients';

// Golden Hour tokens (matching Index.tsx)
const GH = {
  pageBg: '#F3EDE4',
  glass: 'rgba(255,255,255,0.55)',
  glassBorder: 'rgba(255,255,255,0.7)',
  glassShadow: '0 2px 12px rgba(60,48,28,0.04)',
  glassBlur: '20px',
  textPrimary: 'rgba(60,48,28,0.85)',
  textSecondary: 'rgba(60,48,28,0.55)',
  textMuted: 'rgba(60,48,28,0.35)',
  border: 'rgba(60,48,28,0.06)',
};

function formatPhone(phone: string | null): string {
  if (!phone) return '—';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits[0] === '1') {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
}

function relativeTime(dateStr: string | null): { text: string; color: string } {
  if (!dateStr) return { text: 'Never', color: '#9ca3af' };
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now.getTime() - then.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let text: string;
  if (diffDays === 0) text = 'Today';
  else if (diffDays === 1) text = 'Yesterday';
  else if (diffDays < 30) text = `${diffDays}d ago`;
  else if (diffDays < 365) text = `${Math.floor(diffDays / 30)}mo ago`;
  else text = `${Math.floor(diffDays / 365)}y ago`;

  let color: string;
  if (diffDays < 30) color = '#22c55e';       // green
  else if (diffDays < 90) color = '#f59e0b';   // amber
  else color = '#ef4444';                       // red

  return { text, color };
}

export default function MyClientsPage() {
  const {
    clients,
    isLoading,
    activeCount,
    availableCarriers,
    searchQuery,
    setSearchQuery,
    carrierFilter,
    setCarrierFilter,
    statusFilter,
    setStatusFilter,
    sortColumn,
    sortAsc,
    handleSort,
  } = useMyClients();

  const SortHeader = ({ column, label, className = '' }: { column: string; label: string; className?: string }) => (
    <th
      className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide cursor-pointer select-none hover:opacity-70 transition-opacity ${className}`}
      style={{ color: GH.textMuted }}
      onClick={() => handleSort(column)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortColumn === column && (
          <ArrowUpDown className="w-3 h-3" style={{ color: GH.textPrimary }} />
        )}
      </span>
    </th>
  );

  return (
    <div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-16">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: GH.textPrimary }}>
            My Book
          </h1>
          <p className="mt-1 text-sm" style={{ color: GH.textSecondary }}>
            {isLoading ? 'Loading...' : `${activeCount} active clients`}
          </p>
        </div>

        {/* Filters Bar */}
        <div
          className="rounded-2xl p-4 mb-6"
          style={{
            background: GH.glass,
            backdropFilter: `blur(${GH.glassBlur})`,
            WebkitBackdropFilter: `blur(${GH.glassBlur})`,
            border: `1px solid ${GH.glassBorder}`,
            boxShadow: GH.glassShadow,
          }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 w-full sm:max-w-xs">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: GH.textMuted }} />
              <input
                type="text"
                placeholder="Search by name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                style={{
                  background: 'rgba(255,255,255,0.6)',
                  border: `1px solid ${GH.border}`,
                  color: GH.textPrimary,
                }}
              />
            </div>

            {/* Carrier filter */}
            <select
              value={carrierFilter}
              onChange={(e) => setCarrierFilter(e.target.value)}
              className="px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              style={{
                background: 'rgba(255,255,255,0.6)',
                border: `1px solid ${GH.border}`,
                color: GH.textPrimary,
              }}
            >
              <option value="all">All Carriers</option>
              {availableCarriers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Status filter */}
            <div className="flex items-center rounded-xl overflow-hidden" style={{ border: `1px solid ${GH.border}` }}>
              {(['active', 'termed', 'all'] as StatusFilter[]).map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className="px-3 py-2 text-sm font-medium transition-colors capitalize"
                  style={{
                    background: statusFilter === status ? 'rgba(60,48,28,0.08)' : 'rgba(255,255,255,0.6)',
                    color: statusFilter === status ? GH.textPrimary : GH.textSecondary,
                  }}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Client Table */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: GH.glass,
            backdropFilter: `blur(${GH.glassBlur})`,
            WebkitBackdropFilter: `blur(${GH.glassBlur})`,
            border: `1px solid ${GH.glassBorder}`,
            boxShadow: GH.glassShadow,
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr style={{ borderBottom: `1px solid ${GH.border}` }}>
                  <SortHeader column="last_name" label="Client" />
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: GH.textMuted }}>
                    Phone
                  </th>
                  <SortHeader column="carrier" label="Carrier" />
                  <SortHeader column="effective_date" label="Plan" className="hidden lg:table-cell" />
                  <SortHeader column="last_contacted_at" label="Last Contact" />
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: GH.textMuted }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex items-center justify-center gap-2" style={{ color: GH.textSecondary }}>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Loading your book...
                      </div>
                    </td>
                  </tr>
                ) : clients.length === 0 && searchQuery === '' && carrierFilter === 'all' && statusFilter === 'active' ? (
                  // True empty state — no data at all
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <BookOpen className="w-8 h-8 mx-auto mb-3" style={{ color: GH.textMuted }} />
                      <p className="text-sm font-medium" style={{ color: GH.textPrimary }}>
                        No clients yet
                      </p>
                      <p className="text-sm mt-1" style={{ color: GH.textSecondary }}>
                        Sync your carrier reports to build your book.
                      </p>
                      <a
                        href="/sync"
                        className="inline-block mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
                      >
                        Go to Smart Sync
                      </a>
                    </td>
                  </tr>
                ) : clients.length === 0 ? (
                  // Filter produces no results
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <p className="text-sm" style={{ color: GH.textSecondary }}>
                        No clients match your filters
                      </p>
                    </td>
                  </tr>
                ) : (
                  clients.map(client => {
                    const policy = client.primaryPolicy;
                    const lastContact = relativeTime(client.last_contacted_at);
                    const isActive = policy?.status === 'active';

                    return (
                      <tr
                        key={client.id}
                        className="group cursor-pointer transition-colors"
                        style={{ borderBottom: `1px solid ${GH.border}` }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(60,48,28,0.02)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = ''}
                      >
                        {/* Client name */}
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium" style={{ color: GH.textPrimary }}>
                            {client.last_name}, {client.first_name}
                          </p>
                          {client.date_of_birth && (
                            <p className="text-xs mt-0.5" style={{ color: GH.textMuted }}>
                              DOB: {formatDate(client.date_of_birth)}
                            </p>
                          )}
                        </td>

                        {/* Phone */}
                        <td className="px-4 py-3">
                          {client.phone ? (
                            <a
                              href={`tel:${client.phone}`}
                              className="text-sm text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Phone className="w-3 h-3" />
                              {formatPhone(client.phone)}
                            </a>
                          ) : (
                            <span className="text-sm" style={{ color: GH.textMuted }}>—</span>
                          )}
                        </td>

                        {/* Carrier */}
                        <td className="px-4 py-3">
                          <span className="text-sm" style={{ color: GH.textPrimary }}>
                            {policy?.carrier?.name || '—'}
                          </span>
                        </td>

                        {/* Plan + Effective Date (hidden on mobile) */}
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <p className="text-sm" style={{ color: GH.textPrimary }}>
                            {policy?.plan_name || '—'}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: GH.textMuted }}>
                            Eff. {formatDate(policy?.effective_date || null)}
                          </p>
                        </td>

                        {/* Last Contact */}
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium" style={{ color: lastContact.color }}>
                            {lastContact.text}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <span
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full"
                            style={{
                              background: isActive ? 'rgba(34,197,94,0.1)' : 'rgba(156,163,175,0.1)',
                              color: isActive ? '#16a34a' : '#6b7280',
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ background: isActive ? '#22c55e' : '#9ca3af' }}
                            />
                            {isActive ? 'Active' : 'Termed'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer count */}
          {!isLoading && clients.length > 0 && (
            <div className="px-4 py-3" style={{ borderTop: `1px solid ${GH.border}` }}>
              <p className="text-sm" style={{ color: GH.textMuted }}>
                Showing {clients.length} client{clients.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
