import { useState, useRef, useEffect } from 'react';
import { Filter, ChevronDown, Check, X } from 'lucide-react';

interface CarrierOption {
  id: string;
  name: string;
  color: string;
}

interface CarrierFilterDropdownProps {
  carriers: CarrierOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function CarrierFilterDropdown({ carriers, selected, onChange }: CarrierFilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hasFilter = selected.length > 0;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const toggle = (id: string) => {
    onChange(
      selected.includes(id) ? selected.filter(c => c !== id) : [...selected, id]
    );
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] transition-all duration-150"
        style={{
          background: hasFilter ? 'rgba(59,111,181,0.05)' : 'transparent',
          border: hasFilter ? '1px solid rgba(59,111,181,0.15)' : '1px solid rgba(200,190,170,0.15)',
          fontWeight: hasFilter ? 600 : 400,
          color: hasFilter ? '#3B6FB5' : '#8B7E6A',
        }}
      >
        <Filter size={12} />
        Carrier{hasFilter ? ` (${selected.length})` : ''}
        <ChevronDown
          size={12}
          className="transition-transform duration-150"
          style={{ transform: open ? 'rotate(180deg)' : 'none' }}
        />
      </button>

      {open && (
        <div
          className="absolute top-[calc(100%+4px)] left-0 z-50 rounded-xl p-1.5"
          style={{
            background: '#FFFEFA',
            border: '1px solid rgba(200,190,170,0.25)',
            boxShadow: '0 8px 24px rgba(44,36,24,0.12)',
            width: '200px',
          }}
        >
          {carriers.map(c => {
            const isChecked = selected.includes(c.id);
            return (
              <button
                key={c.id}
                onClick={() => toggle(c.id)}
                className="flex items-center gap-2.5 w-full px-2.5 py-2.5 rounded-lg border-none cursor-pointer transition-colors duration-100"
                style={{
                  background: isChecked ? `${c.color}08` : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isChecked) (e.currentTarget as HTMLElement).style.background = 'rgba(200,190,170,0.06)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = isChecked ? `${c.color}08` : 'transparent';
                }}
              >
                <div
                  className="w-[18px] h-[18px] rounded-[5px] flex items-center justify-center transition-all duration-150"
                  style={{
                    border: isChecked ? `2px solid ${c.color}` : '2px solid rgba(200,190,170,0.15)',
                    background: isChecked ? `${c.color}15` : 'transparent',
                  }}
                >
                  {isChecked && <Check size={11} color={c.color} strokeWidth={3} />}
                </div>
                <div className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                <span
                  className="text-[13px]"
                  style={{
                    color: isChecked ? '#2C2418' : '#5C5347',
                    fontWeight: isChecked ? 600 : 400,
                  }}
                >
                  {c.name}
                </span>
              </button>
            );
          })}
          {hasFilter && (
            <button
              onClick={() => onChange([])}
              className="block w-full px-2.5 py-2 border-none bg-transparent cursor-pointer text-[12px] font-medium text-left"
              style={{
                color: '#C75A3A',
                borderTop: '1px solid rgba(200,190,170,0.15)',
                marginTop: '4px',
                paddingTop: '10px',
              }}
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Active filter chips for selected carriers
export function CarrierFilterChips({
  carriers,
  selected,
  onRemove,
}: {
  carriers: CarrierOption[];
  selected: string[];
  onRemove: (id: string) => void;
}) {
  return (
    <>
      {selected.map(id => {
        const carrier = carriers.find(c => c.id === id);
        if (!carrier) return null;
        return (
          <div
            key={id}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold"
            style={{
              background: `${carrier.color}08`,
              border: `1px solid ${carrier.color}20`,
              color: carrier.color,
            }}
          >
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: carrier.color }} />
            {carrier.name}
            <X size={11} className="cursor-pointer opacity-60" onClick={() => onRemove(id)} />
          </div>
        );
      })}
    </>
  );
}
