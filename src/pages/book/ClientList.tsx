import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useBookClients, type BookClientWithMeta } from '@/hooks/useBookClients';
import { ClientDirectory } from '@/components/book/ClientDirectory';
import { ClientDetail } from '@/components/book/ClientDetail';
import { CarrierFilterDropdown, CarrierFilterChips } from '@/components/book/CarrierFilterDropdown';
import { DateFilterDropdown, DateFilterChip } from '@/components/book/DateFilterDropdown';
import { UserAvatarDropdown } from '@/components/UserAvatarDropdown';

export default function ClientList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    flaggedClients = [],
    regularClients = [],
    clients: filteredClients = [],
    isLoading,
    availableCarriers = [],
    searchQuery = '',
    setSearchQuery,
    selectedCarriers = [],
    setSelectedCarriers,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
  } = useBookClients();

  const [selected, setSelected] = useState<BookClientWithMeta | null>(null);
  const [datePresetLabel, setDatePresetLabel] = useState('All Dates');

  const handleDateApply = (from: Date | null, to: Date | null, label: string) => {
    setDateFrom(from);
    setDateTo(to);
    setDatePresetLabel(label);
  };

  const handleDateClear = () => {
    setDateFrom(null);
    setDateTo(null);
    setDatePresetLabel('All Dates');
  };

  const handleRemoveCarrier = (id: string) => {
    setSelectedCarriers(selectedCarriers.filter(c => c !== id));
  };

  return (
    <div className="flex flex-col h-full" style={{ fontFamily: "var(--font-sans)" }}>
      {/* Header bar */}
      <div
        className="px-6 flex-shrink-0 flex items-center justify-between"
        style={{
          height: 52,
          borderBottom: '1px solid rgba(60,48,28,0.04)',
          background: 'rgba(255,255,255,0.5)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <Link
          to="/book"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            textDecoration: 'none',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: '#8B6914' }}>
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: '#2C2418',
              letterSpacing: '-0.01em',
            }}
          >
            All Clients
          </span>
        </Link>
        <UserAvatarDropdown />
      </div>

      {/* Two-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        <ClientDirectory
          flaggedClients={flaggedClients}
          regularClients={regularClients}
          totalCount={filteredClients.length}
          selectedId={selected?.id || null}
          onSelect={setSelected}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filterSlot={
            <>
              <CarrierFilterDropdown
                carriers={availableCarriers}
                selected={selectedCarriers}
                onChange={setSelectedCarriers}
              />
              <DateFilterDropdown
                dateFrom={dateFrom}
                dateTo={dateTo}
                onApply={handleDateApply}
                onClear={handleDateClear}
                activePreset={datePresetLabel}
              />
              <CarrierFilterChips
                carriers={availableCarriers}
                selected={selectedCarriers}
                onRemove={handleRemoveCarrier}
              />
              {datePresetLabel !== 'All Dates' && (
                <DateFilterChip label={datePresetLabel} onClear={handleDateClear} />
              )}
            </>
          }
        />

        {/* Right panel — Detail */}
        <div className="flex-1 overflow-y-auto" style={{ background: '#F8F5F0' }}>
          <ClientDetail client={selected} />
        </div>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
          <div className="animate-pulse text-[14px]" style={{ color: '#8B7E6A' }}>Loading clients...</div>
        </div>
      )}
    </div>
  );
}
