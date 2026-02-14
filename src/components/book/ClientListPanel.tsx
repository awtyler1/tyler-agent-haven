import type { BookClientWithMeta } from '@/hooks/useBookClients';
import { formatPhone, titleCase } from '@/lib/utils';

// Map carrier names to Homestead CSS variables for carrier dots
const CARRIER_CSS_VARS: Record<string, string> = {
  humana: 'var(--carrier-humana)',
  aetna: 'var(--carrier-aetna)',
  anthem: 'var(--carrier-anthem)',
  uhc: 'var(--carrier-uhc)',
  'united healthcare': 'var(--carrier-uhc)',
  wellcare: 'var(--carrier-wellcare)',
  devoted: 'var(--carrier-devoted)',
};

function getCarrierCSSVar(carrierName: string): string {
  const key = carrierName.toLowerCase();
  for (const [pattern, cssVar] of Object.entries(CARRIER_CSS_VARS)) {
    if (key.includes(pattern)) return cssVar;
  }
  return 'var(--text-muted)';
}

/** Get birthday info for a client */
function getBirthdayInfo(dob: string | null): { isToday: boolean; isUpcoming: boolean; label: string } | null {
  if (!dob) return null;
  const d = new Date(dob);
  const now = new Date();
  const birthdayThisYear = new Date(now.getFullYear(), d.getMonth(), d.getDate());

  // Check if today
  if (
    now.getMonth() === d.getMonth() &&
    now.getDate() === d.getDate()
  ) {
    return { isToday: true, isUpcoming: false, label: '\u{1F382} Today' };
  }

  // Check upcoming 30 days
  if (birthdayThisYear < now) birthdayThisYear.setFullYear(birthdayThisYear.getFullYear() + 1);
  const diffDays = Math.ceil((birthdayThisYear.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays > 0 && diffDays <= 30) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return { isToday: false, isUpcoming: true, label: `\u{1F382} ${months[d.getMonth()]} ${d.getDate()}` };
  }

  return null;
}

const SOURCE_LABELS: Record<string, string> = {
  referral: 'Referral',
  phone_call: 'Phone Call',
  community_event: 'Community Event',
  walk_in: 'Walk-in',
  other: 'Other',
};

function formatShortDate(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}`;
  } catch {
    return '';
  }
}

interface ClientListPanelProps {
  clients: BookClientWithMeta[];
  leads: BookClientWithMeta[];
  selectedClientId: string | null;
  onSelectClient: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  availableCarriers: { id: string; name: string; color: string }[];
  selectedCarrier: string;
  onCarrierChange: (id: string) => void;
  birthdayFilter: boolean;
  onBirthdayToggle: () => void;
  birthdayCount: number;
  statusFilter: 'active' | 'termed' | 'lead' | 'all';
  onStatusChange: (s: 'active' | 'termed' | 'lead' | 'all') => void;
  effDateFilter: string;
  onEffDateChange: (v: string) => void;
  currentPage: number;
  totalPages: number;
  totalClients: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  totalCount: number;
  leadCount: number;
  attentionCount: number;
  onAddClient?: () => void;
  onAddLead?: () => void;
}

export function ClientListPanel({
  clients,
  leads,
  selectedClientId,
  onSelectClient,
  searchQuery,
  onSearchChange,
  availableCarriers,
  selectedCarrier,
  onCarrierChange,
  birthdayFilter,
  onBirthdayToggle,
  birthdayCount,
  statusFilter,
  onStatusChange,
  currentPage,
  totalPages,
  totalClients,
  onPageChange,
  itemsPerPage,
  totalCount,
  leadCount,
  attentionCount,
  effDateFilter,
  onEffDateChange,
  onAddClient,
  onAddLead,
}: ClientListPanelProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalClients);

  // Build page numbers for pagination
  const pageNumbers = buildPageNumbers(currentPage, totalPages);

  const showLeadsSection = leads.length > 0 && statusFilter !== 'termed' && statusFilter !== 'active';
  const showClientsSection = statusFilter !== 'lead';

  return (
    <div
      style={{
        width: 380,
        flexShrink: 0,
        background: 'var(--bg-card)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRight: '1px solid var(--bg-muted)',
      }}
    >
      {/* 1. Title row — inside the white card */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 16px 0',
          flexShrink: 0,
        }}
      >
        <h1
          style={{
            fontFamily: "'Lora', serif",
            fontSize: 20,
            fontWeight: 600,
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
            margin: 0,
          }}
        >
          My Book
        </h1>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={onAddLead}
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 11,
              fontWeight: 600,
              padding: '5px 12px',
              borderRadius: 8,
              border: '1px solid rgba(74,127,181,0.3)',
              background: 'transparent',
              color: 'var(--blue)',
              cursor: 'pointer',
              transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            + Lead
          </button>
          <button
            onClick={onAddClient}
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 11,
              fontWeight: 600,
              padding: '5px 12px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--blue)',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            + Client
          </button>
        </div>
      </div>

      {/* 2. Stat badges */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          flexWrap: 'wrap',
          padding: '8px 16px 12px',
          borderBottom: '1px solid var(--bg-muted)',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: '4px 12px',
            borderRadius: 8,
            background: 'var(--bg-subtle)',
            color: 'var(--text-primary)',
          }}
        >
          {totalCount} clients
        </span>
        {leadCount > 0 && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: '4px 12px',
              borderRadius: 8,
              background: 'rgba(74,127,181,0.1)',
              color: 'var(--blue)',
            }}
          >
            {leadCount} leads
          </span>
        )}
        {attentionCount > 0 && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: '4px 12px',
              borderRadius: 8,
              background: 'rgba(196,74,63,0.08)',
              color: 'var(--red)',
            }}
          >
            {attentionCount} need attention
          </span>
        )}
        {birthdayCount > 0 && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: '4px 12px',
              borderRadius: 8,
              background: 'rgba(201,168,76,0.1)',
              color: 'var(--gold-dark)',
            }}
          >
            {'\u{1F382}'} {birthdayCount} birthdays
          </span>
        )}
      </div>

      {/* 3. Search & Filters */}
      <div style={{ padding: '14px 16px 10px', flexShrink: 0 }}>
        {/* Search bar */}
        <div
          className="search-bar-wrapper"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid var(--bg-muted)',
            background: 'white',
            transition: 'border-color 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--gold)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--bg-muted)')}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--text-faint)"
            strokeWidth="2"
            style={{ flexShrink: 0 }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search name, phone, Medicare #…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontFamily: "var(--font-sans)",
              fontSize: 12.5,
              color: 'var(--text-primary)',
              background: 'transparent',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                color: 'var(--text-muted)',
                fontSize: 14,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          )}
        </div>

        {/* Filter row — nowrap, compact */}
        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'nowrap' }}>
          {/* Carrier filter */}
          <select
            value={selectedCarrier}
            onChange={(e) => onCarrierChange(e.target.value)}
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 11,
              fontWeight: 500,
              padding: '5px 22px 5px 8px',
              borderRadius: 6,
              border: `1px solid ${selectedCarrier ? 'var(--gold)' : 'var(--bg-muted)'}`,
              background: 'white',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              appearance: 'none' as const,
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23A89A84' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 6px center',
            }}
          >
            <option value="">All Carriers</option>
            {availableCarriers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Eff. Date filter */}
          <select
            value={effDateFilter}
            onChange={(e) => onEffDateChange(e.target.value)}
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 11,
              fontWeight: 500,
              padding: '5px 22px 5px 8px',
              borderRadius: 6,
              border: `1px solid ${effDateFilter ? 'var(--gold)' : 'var(--bg-muted)'}`,
              background: 'white',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              appearance: 'none' as const,
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23A89A84' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 6px center',
            }}
          >
            <option value="">Eff. Date</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>

          {/* Birthday toggle — compact: emoji + count only */}
          <button
            onClick={onBirthdayToggle}
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 11,
              fontWeight: birthdayFilter ? 600 : 500,
              padding: '5px 8px',
              borderRadius: 6,
              border: `1px solid ${birthdayFilter ? 'var(--gold)' : 'var(--bg-muted)'}`,
              background: birthdayFilter ? 'rgba(201,168,76,0.1)' : 'white',
              color: birthdayFilter ? 'var(--gold-dark)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              whiteSpace: 'nowrap',
              transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {'\u{1F382}'} {birthdayCount > 0 ? birthdayCount : ''}
          </button>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value as 'active' | 'termed' | 'lead' | 'all')}
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 11,
              fontWeight: 500,
              padding: '5px 22px 5px 8px',
              borderRadius: 6,
              border: `1px solid ${statusFilter !== 'active' ? 'var(--gold)' : 'var(--bg-muted)'}`,
              background: 'white',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              appearance: 'none' as const,
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23A89A84' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 6px center',
            }}
          >
            <option value="active">Active</option>
            <option value="lead">Leads</option>
            <option value="termed">Termed</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      {/* Client list (scrollable) */}
      <div
        className="client-list-scroll"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--bg-muted) transparent',
        }}
      >
        {clients.length === 0 && leads.length === 0 ? (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>
              No clients match these filters
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Try adjusting your search or filters
            </div>
          </div>
        ) : (
          <>
            {/* Leads section */}
            {showLeadsSection && leads.length > 0 && (
              <>
                <SectionDivider label={`Leads \u00B7 ${leads.length}`} />
                {leads.map((lead) => {
                  const isSelected = selectedClientId != null && String(lead.id) === String(selectedClientId);
                  return (
                    <LeadRow
                      key={lead.id}
                      client={lead}
                      isSelected={isSelected}
                      onSelect={() => onSelectClient(String(lead.id))}
                    />
                  );
                })}
              </>
            )}

            {/* Lead-only filter: show leads without dividers */}
            {statusFilter === 'lead' && leads.length > 0 && (
              leads.map((lead) => {
                const isSelected = selectedClientId != null && String(lead.id) === String(selectedClientId);
                return (
                  <LeadRow
                    key={lead.id}
                    client={lead}
                    isSelected={isSelected}
                    onSelect={() => onSelectClient(String(lead.id))}
                  />
                );
              })
            )}

            {/* Clients section */}
            {showClientsSection && clients.length > 0 && (
              <>
                {showLeadsSection && leads.length > 0 && (
                  <SectionDivider label={`Clients \u00B7 ${totalClients}`} />
                )}
                {clients.map((client) => {
                  const isSelected = selectedClientId != null && String(client.id) === String(selectedClientId);
                  return (
                    <ClientRow
                      key={client.id}
                      client={client}
                      isSelected={isSelected}
                      onSelect={() => onSelectClient(String(client.id))}
                    />
                  );
                })}
              </>
            )}
          </>
        )}
      </div>

      {/* Pagination footer */}
      {totalClients > 0 && statusFilter !== 'lead' && (
        <div
          style={{
            padding: '10px 16px',
            flexShrink: 0,
            borderTop: '1px solid #F5F0E8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 11,
            color: 'var(--text-muted)',
          }}
        >
          <span>
            {startItem}–{endItem} of {totalClients}
          </span>
          <div style={{ display: 'flex', gap: 2 }}>
            {pageNumbers.map((p, i) =>
              p === '...' ? (
                <span
                  key={`ellipsis-${i}`}
                  style={{
                    width: 26,
                    height: 26,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    color: 'var(--text-muted)',
                  }}
                >
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => onPageChange(p as number)}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    border: 'none',
                    background: currentPage === p ? 'var(--text-primary)' : 'transparent',
                    color: currentPage === p ? 'white' : 'var(--text-muted)',
                    fontSize: 11,
                    fontFamily: "var(--font-sans)",
                    fontWeight: currentPage === p ? 600 : 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {p}
                </button>
              ),
            )}
            {currentPage < totalPages && (
              <button
                onClick={() => onPageChange(currentPage + 1)}
                style={{
                  width: 'auto',
                  padding: '0 8px',
                  height: 26,
                  borderRadius: 6,
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Custom scrollbar styles */}
      <style>{`
        .client-list-scroll::-webkit-scrollbar { width: 4px; }
        .client-list-scroll::-webkit-scrollbar-thumb { background: var(--bg-muted); border-radius: 2px; }
        .client-list-scroll::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  );
}

/** Section divider between leads and clients */
function SectionDivider({ label }: { label: string }) {
  return (
    <div
      style={{
        padding: '6px 18px',
        fontSize: 9,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'var(--text-faint)',
        background: 'var(--bg-subtle)',
        borderBottom: '1px solid #F0EBE2',
        fontFamily: "var(--font-sans)",
      }}
    >
      {label}
    </div>
  );
}

/** Lead row — blue dot, blue left border, LEAD tag */
function LeadRow({
  client,
  isSelected,
  onSelect,
}: {
  client: BookClientWithMeta;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const sourceLabel = client.lead_source ? SOURCE_LABELS[client.lead_source] || client.lead_source : null;
  const addedDate = formatShortDate(client.created_at || null);
  const subLine = [sourceLabel, addedDate ? `Added ${addedDate}` : null].filter(Boolean).join(' \u00B7 ');

  return (
    <div
      onClick={onSelect}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 16px',
        paddingLeft: 15,
        cursor: 'pointer',
        borderBottom: '1px solid #F5F0E8',
        borderLeft: '3px solid var(--blue)',
        transition: 'background 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        background: isSelected ? '#F0E8DA' : 'transparent',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.background = 'var(--bg-subtle)';
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.background = 'transparent';
      }}
    >
      {/* Selected indicator — gold right bar */}
      {isSelected && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 8,
            bottom: 8,
            width: 3,
            background: 'var(--gold)',
            borderRadius: '2px 0 0 2px',
            zIndex: 2,
          }}
        />
      )}

      {/* Blue dot */}
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          flexShrink: 0,
          background: 'var(--blue)',
        }}
      />

      {/* Lead info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-primary)',
              lineHeight: 1.3,
            }}
          >
            {titleCase(client.first_name)} {titleCase(client.last_name)}
          </span>
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--blue)',
              background: 'rgba(74,127,181,0.1)',
              padding: '2px 7px',
              borderRadius: 4,
            }}
          >
            LEAD
          </span>
        </div>
        {subLine && (
          <div
            style={{
              fontSize: 10,
              color: 'var(--text-faint)',
              marginTop: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {subLine}
          </div>
        )}
      </div>

      {/* Right side: phone */}
      {client.phone && (
        <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
          {formatPhone(client.phone)}
        </span>
      )}
    </div>
  );
}

/** Single client row in the list */
function ClientRow({
  client,
  isSelected,
  onSelect,
}: {
  client: BookClientWithMeta;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const carrierName = client.carrier_name || '';
  const carrierColor = getCarrierCSSVar(carrierName);
  const birthday = getBirthdayInfo(client.date_of_birth);

  // Flagged = any attention flag EXCEPT birthday (birthday gets its own gem badge)
  const isFlagged = !!client.flag_type && client.flag_type !== 'birthday_upcoming';

  // Flag tag display — map flag_type to label and color treatment
  let flagTag: { label: string; type: 'alert' | 'termed' } | null = null;
  if (client.flag_type === 'not_on_report') {
    flagTag = { label: 'Not on report', type: 'alert' };
  } else if (client.flag_type === 'termed_on_report') {
    flagTag = { label: 'Termed on report', type: 'termed' };
  } else if (client.flag_type === 'no_contact_90' || client.flag_type === 'no_contact_180') {
    flagTag = { label: client.flag_title || 'Overdue', type: 'alert' };
  } else if (client.flag_type && client.flag_type !== 'birthday_upcoming') {
    flagTag = { label: client.flag_title || client.flag_type.replace(/_/g, ' '), type: 'alert' };
  }

  return (
    <div
      onClick={onSelect}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 16px',
        cursor: 'pointer',
        borderBottom: '1px solid #F5F0E8',
        transition: 'background 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        background: isSelected
          ? '#F0E8DA'
          : isFlagged
            ? 'rgba(196,74,63,0.03)'
            : 'transparent',
        ...(isFlagged
          ? { borderLeft: '3px solid var(--red)', paddingLeft: 13 }
          : {}),
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.background = isFlagged
            ? 'rgba(196,74,63,0.06)'
            : 'var(--bg-subtle)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.background = isFlagged
            ? 'rgba(196,74,63,0.03)'
            : 'transparent';
        }
      }}
    >
      {/* Selected indicator — gold right bar */}
      {isSelected && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 8,
            bottom: 8,
            width: 3,
            background: 'var(--gold)',
            borderRadius: '2px 0 0 2px',
            zIndex: 2,
          }}
        />
      )}

      {/* Carrier dot */}
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          flexShrink: 0,
          background: carrierColor,
        }}
      />

      {/* Client info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text-primary)',
            lineHeight: 1.3,
          }}
        >
          {titleCase(client.first_name)} {titleCase(client.last_name)}
        </div>
        <div
          style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            marginTop: 1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {carrierName}{client.plan_name ? ` \u00B7 ${client.plan_name}` : client.plan_type ? ` \u00B7 ${client.plan_type}` : ''}
        </div>
      </div>

      {/* Right side: phone + tags */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 4,
          flexShrink: 0,
        }}
      >
        {client.phone && (
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {formatPhone(client.phone)}
          </span>
        )}
        {flagTag && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 600,
              padding: '2px 7px',
              borderRadius: 4,
              whiteSpace: 'nowrap',
              background:
                flagTag.type === 'alert' ? 'rgba(196,74,63,0.08)' : 'rgba(184,148,74,0.12)',
              color: flagTag.type === 'alert' ? 'var(--red)' : 'var(--amber)',
            }}
          >
            {flagTag.label}
          </span>
        )}
        {birthday && !flagTag && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 10,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              ...(birthday.isToday
                ? {
                    background: 'linear-gradient(135deg, var(--gold), var(--gold-dark))',
                    color: 'white',
                  }
                : {
                    background: 'rgba(201,168,76,0.15)',
                    color: 'var(--gold-dark)',
                  }),
            }}
          >
            {birthday.label}
          </span>
        )}
      </div>
    </div>
  );
}

/** Build smart page numbers: [1, 2, 3, '...', 14] */
function buildPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | '...')[] = [];
  if (current <= 3) {
    pages.push(1, 2, 3, '...', total);
  } else if (current >= total - 2) {
    pages.push(1, '...', total - 2, total - 1, total);
  } else {
    pages.push(1, '...', current - 1, current, current + 1, '...', total);
  }
  return pages;
}
