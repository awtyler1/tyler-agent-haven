import { useState } from 'react';
import { Search, Phone, ChevronDown, X } from 'lucide-react';
import type { BookClientWithMeta } from '@/hooks/useBookClients';
import { getFlagConfig } from '@/types/book';

interface ClientDirectoryProps {
  flaggedClients: BookClientWithMeta[];
  regularClients: BookClientWithMeta[];
  totalCount: number;
  selectedId: string | null;
  onSelect: (client: BookClientWithMeta) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filterSlot: React.ReactNode;
}

export function ClientDirectory({
  flaggedClients,
  regularClients,
  totalCount,
  selectedId,
  onSelect,
  searchQuery,
  onSearchChange,
  filterSlot,
}: ClientDirectoryProps) {
  const [attentionOpen, setAttentionOpen] = useState(true);
  const [allClientsOpen, setAllClientsOpen] = useState(true);

  return (
    <div
      className="flex flex-col h-full flex-shrink-0"
      style={{
        width: '400px',
        borderRight: '1px solid rgba(200,190,170,0.25)',
        background: 'rgba(255,255,255,0.35)',
      }}
    >
      {/* Search */}
      <div className="px-4 pt-4">
        <div
          className="flex items-center gap-2 rounded-[10px] px-3.5 py-2.5"
          style={{ background: 'rgba(200,190,170,0.1)' }}
        >
          <Search size={16} color="#8B7E6A" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-[14px]"
            style={{ color: '#2C2418', fontFamily: 'inherit' }}
          />
          {searchQuery && (
            <X size={14} color="#8B7E6A" className="cursor-pointer" onClick={() => onSearchChange('')} />
          )}
        </div>
      </div>

      {/* Filter row */}
      <div className="px-4 py-2.5 flex gap-1.5 items-center flex-wrap">
        {filterSlot}
      </div>

      {/* Count */}
      <div className="px-5 pb-2 text-[12px]" style={{ color: '#A09888' }}>
        {totalCount} client{totalCount !== 1 ? 's' : ''}
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {/* Needs Attention section */}
        {flaggedClients.length > 0 && (
          <>
            <button
              onClick={() => setAttentionOpen(!attentionOpen)}
              className="flex items-center gap-1.5 w-full px-3 py-2 pt-2 text-[11px] font-semibold uppercase tracking-wider bg-transparent border-none cursor-pointer text-left"
              style={{ color: '#C75A3A' }}
            >
              <ChevronDown
                size={12}
                className="transition-transform duration-150"
                style={{ transform: attentionOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}
              />
              Needs Attention · {flaggedClients.length}
            </button>
            {attentionOpen && flaggedClients.map(c => (
              <ClientRow
                key={c.id}
                client={c}
                isSelected={selectedId === c.id}
                onSelect={() => onSelect(c)}
                showFlag
              />
            ))}
          </>
        )}

        {/* All Clients section */}
        {regularClients.length > 0 && (
          <button
            onClick={() => setAllClientsOpen(!allClientsOpen)}
            className="flex items-center gap-1.5 w-full px-3 py-3 pt-3 text-[11px] font-semibold uppercase tracking-wider bg-transparent border-none cursor-pointer text-left"
            style={{ color: '#8B7E6A' }}
          >
            <ChevronDown
              size={12}
              className="transition-transform duration-150"
              style={{ transform: allClientsOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}
            />
            All Clients · {regularClients.length}
          </button>
        )}
        {allClientsOpen && regularClients.map(c => (
          <ClientRow
            key={c.id}
            client={c}
            isSelected={selectedId === c.id}
            onSelect={() => onSelect(c)}
          />
        ))}

        {/* Empty state */}
        {flaggedClients.length === 0 && regularClients.length === 0 && (
          <div className="py-10 px-5 text-center">
            <Search size={28} color="#A09888" className="mx-auto mb-2" style={{ opacity: 0.3 }} />
            <div className="text-[14px]" style={{ color: '#5C5347' }}>No clients match these filters</div>
            <div className="text-[12px] mt-1" style={{ color: '#8B7E6A' }}>Try adjusting your search or filters</div>
          </div>
        )}
      </div>
    </div>
  );
}

function ClientRow({
  client,
  isSelected,
  onSelect,
  showFlag,
}: {
  client: BookClientWithMeta;
  isSelected: boolean;
  onSelect: () => void;
  showFlag?: boolean;
}) {
  const flagInfo = showFlag && client.flag_type ? getFlagConfig(client.flag_type) : null;

  return (
    <div
      onClick={onSelect}
      className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer mb-0.5 transition-all duration-100"
      style={{
        background: isSelected ? 'rgba(59,111,181,0.05)' : 'transparent',
        border: isSelected ? '1px solid rgba(59,111,181,0.1)' : '1px solid transparent',
      }}
    >
      {/* Avatar */}
      <div
        className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-[14px] font-bold"
        style={{
          background: `${client.carrier_color}12`,
          color: client.carrier_color,
        }}
      >
        {client.first_name[0]}{client.last_name[0]}
      </div>

      {/* Name + sub info */}
      <div className="flex-1 min-w-0">
        <div
          className="text-[14px] font-semibold overflow-hidden text-ellipsis whitespace-nowrap"
          style={{ color: '#2C2418' }}
        >
          {client.first_name} {client.last_name}
        </div>
        {flagInfo ? (
          <div className="text-[12px] font-medium" style={{ color: flagInfo.color }}>
            {flagInfo.short}
          </div>
        ) : (
          <div className="text-[12px]" style={{ color: '#8B7E6A' }}>
            {client.carrier_name || 'No carrier'}{client.plan_type ? ` · ${client.plan_type}` : ''}
          </div>
        )}
      </div>

      {/* Phone indicator */}
      {client.phone && <Phone size={13} color="#A09888" />}
    </div>
  );
}
