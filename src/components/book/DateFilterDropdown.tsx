import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, X } from 'lucide-react';

interface DateFilterDropdownProps {
  dateFrom: Date | null;
  dateTo: Date | null;
  onApply: (from: Date | null, to: Date | null, presetLabel: string) => void;
  onClear: () => void;
  activePreset: string;
}

const DATE_PRESETS = [
  { label: 'All Dates', from: null, to: null },
  { label: 'This Month', getRange: () => {
    const now = new Date();
    return {
      from: new Date(now.getFullYear(), now.getMonth(), 1),
      to: new Date(now.getFullYear(), now.getMonth() + 1, 0),
    };
  }},
  { label: 'Last 90 Days', getRange: () => {
    const now = new Date();
    const from = new Date(now);
    from.setDate(from.getDate() - 90);
    return { from, to: now };
  }},
  { label: 'This Year', getRange: () => {
    const now = new Date();
    return {
      from: new Date(now.getFullYear(), 0, 1),
      to: now,
    };
  }},
];

export function DateFilterDropdown({ dateFrom, dateTo, onApply, onClear, activePreset }: DateFilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const hasFilter = activePreset !== 'All Dates';

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const applyPreset = (preset: typeof DATE_PRESETS[number]) => {
    if (preset.label === 'All Dates') {
      onClear();
    } else if ('getRange' in preset && preset.getRange) {
      const range = preset.getRange();
      onApply(range.from, range.to, preset.label);
    }
    setOpen(false);
  };

  const applyCustom = () => {
    const from = customFrom ? parseInputDate(customFrom) : null;
    const to = customTo ? parseInputDate(customTo) : null;
    if (from || to) {
      onApply(from, to, 'Custom');
      setOpen(false);
    }
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
        <Calendar size={12} />
        Effective{hasFilter ? `: ${activePreset}` : ''}
        <ChevronDown
          size={12}
          className="transition-transform duration-150"
          style={{ transform: open ? 'rotate(180deg)' : 'none' }}
        />
      </button>

      {open && (
        <div
          className="absolute top-[calc(100%+4px)] left-0 z-50 rounded-xl p-2"
          style={{
            background: '#FFFEFA',
            border: '1px solid rgba(200,190,170,0.25)',
            boxShadow: '0 8px 24px rgba(44,36,24,0.12)',
            width: '290px',
          }}
        >
          {/* Presets */}
          <div className="px-1 pb-2" style={{ borderBottom: '1px solid rgba(200,190,170,0.15)' }}>
            <div className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 px-1" style={{ color: '#8B7E6A' }}>
              Quick Filters
            </div>
            <div className="flex flex-wrap gap-1">
              {DATE_PRESETS.map(p => (
                <button
                  key={p.label}
                  onClick={() => applyPreset(p)}
                  className="rounded-[7px] px-2.5 py-1.5 text-[12px] cursor-pointer border transition-all duration-100"
                  style={{
                    background: activePreset === p.label ? 'rgba(59,111,181,0.08)' : 'rgba(200,190,170,0.06)',
                    borderColor: activePreset === p.label ? 'rgba(59,111,181,0.2)' : 'rgba(200,190,170,0.15)',
                    fontWeight: activePreset === p.label ? 600 : 400,
                    color: activePreset === p.label ? '#3B6FB5' : '#5C5347',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom range */}
          <div className="px-1 pt-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider mb-2 px-1" style={{ color: '#8B7E6A' }}>
              Custom Range
            </div>
            <div className="flex gap-1.5 items-center mb-2">
              <input
                type="text"
                placeholder="MM/DD/YYYY"
                value={customFrom}
                onChange={e => setCustomFrom(e.target.value)}
                className="flex-1 px-2.5 py-[7px] rounded-[7px] text-[12px] outline-none"
                style={{
                  border: '1px solid rgba(200,190,170,0.15)',
                  background: 'rgba(200,190,170,0.04)',
                  color: '#2C2418',
                  fontFamily: 'inherit',
                }}
              />
              <span className="text-[12px]" style={{ color: '#A09888' }}>to</span>
              <input
                type="text"
                placeholder="MM/DD/YYYY"
                value={customTo}
                onChange={e => setCustomTo(e.target.value)}
                className="flex-1 px-2.5 py-[7px] rounded-[7px] text-[12px] outline-none"
                style={{
                  border: '1px solid rgba(200,190,170,0.15)',
                  background: 'rgba(200,190,170,0.04)',
                  color: '#2C2418',
                  fontFamily: 'inherit',
                }}
              />
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={applyCustom}
                className="flex-1 py-[7px] rounded-[7px] border-none text-[12px] font-semibold cursor-pointer"
                style={{ background: '#3B6FB5', color: '#fff' }}
              >
                Apply
              </button>
              {hasFilter && (
                <button
                  onClick={() => { onClear(); setOpen(false); }}
                  className="py-[7px] px-3 rounded-[7px] text-[12px] font-medium cursor-pointer"
                  style={{
                    background: 'transparent',
                    color: '#C75A3A',
                    border: '1px solid rgba(199,90,58,0.15)',
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Date filter chip
export function DateFilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <div
      className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold"
      style={{
        background: 'rgba(59,111,181,0.05)',
        border: '1px solid rgba(59,111,181,0.13)',
        color: '#3B6FB5',
      }}
    >
      {label}
      <X size={11} className="cursor-pointer opacity-60" onClick={onClear} />
    </div>
  );
}

function parseInputDate(str: string): Date | null {
  if (!str) return null;
  const parts = str.split('/').map(Number);
  if (parts.length === 3) {
    const [m, d, y] = parts;
    return new Date(y, m - 1, d);
  }
  // Try ISO
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}
