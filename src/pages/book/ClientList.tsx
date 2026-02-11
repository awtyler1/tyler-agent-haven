import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useBookClients, type BookClientWithMeta } from '@/hooks/useBookClients';
import { ClientDirectory } from '@/components/book/ClientDirectory';
import { ClientDetail } from '@/components/book/ClientDetail';
import { CarrierFilterDropdown, CarrierFilterChips } from '@/components/book/CarrierFilterDropdown';
import { DateFilterDropdown, DateFilterChip } from '@/components/book/DateFilterDropdown';

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
    <div className="h-screen flex flex-col" style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif", background: '#F8F5F0' }}>
      {/* Header bar */}
      <div
        className="px-7 py-4 flex-shrink-0 flex items-center justify-between"
        style={{
          borderBottom: '1px solid rgba(200,190,170,0.25)',
          background: 'rgba(255,255,255,0.5)',
        }}
      >
        <div>
          <button
            onClick={() => navigate('/book')}
            className="text-[13px] font-medium mb-0.5 bg-transparent border-none cursor-pointer p-0"
            style={{ color: '#3B6FB5' }}
          >
            ← My Book
          </button>
          <h1 className="text-[22px] font-bold m-0" style={{ color: '#2C2418' }}>All Clients</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: '#2D8B4E' }} />
          <span className="text-[13px]" style={{ color: '#8B7E6A' }}>
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
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
