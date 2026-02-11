import { ArrowUpRight, Minus } from 'lucide-react';
import type { MonthlyGrowth } from '@/types/book';

interface MonthlyActivityTableProps {
  data: MonthlyGrowth[];
}

export function MonthlyActivityTable({ data }: MonthlyActivityTableProps) {
  // Show last 6 months, most recent first
  const rows = [...data].slice(-6).reverse();

  return (
    <div
      className="rounded-2xl px-7 py-6"
      style={{
        background: 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(200,190,170,0.25)',
      }}
    >
      <span className="text-[16px] font-semibold block mb-4" style={{ color: '#2C2418' }}>
        Monthly Activity
      </span>

      {/* Header */}
      <div className="grid grid-cols-[80px_1fr_1fr_1fr_1fr] pb-2.5" style={{ borderBottom: '1px solid rgba(200,190,170,0.15)' }}>
        <span className="text-[11px] font-semibold" style={{ color: '#A09888' }}></span>
        <span className="text-[11px] font-semibold text-center" style={{ color: '#A09888' }}>Added</span>
        <span className="text-[11px] font-semibold text-center" style={{ color: '#A09888' }}>Lost</span>
        <span className="text-[11px] font-semibold text-center" style={{ color: '#A09888' }}>Net</span>
        <span className="text-[11px] font-semibold text-right" style={{ color: '#A09888' }}>Book</span>
      </div>

      {rows.map((m, i) => {
        const isFirst = i === 0;
        return (
          <div
            key={m.month}
            className="grid grid-cols-[80px_1fr_1fr_1fr_1fr] items-center py-3.5 px-1"
            style={{
              borderBottom: i < rows.length - 1 ? '1px solid rgba(200,190,170,0.15)' : 'none',
              background: isFirst ? 'rgba(59,111,181,0.03)' : 'transparent',
              borderRadius: isFirst ? '6px' : '0',
            }}
          >
            <span
              className="text-[13px]"
              style={{ color: isFirst ? '#2C2418' : '#8B7E6A', fontWeight: isFirst ? 600 : 500 }}
            >
              {formatMonthShort(m.month)}
            </span>
            <span className="text-[14px] font-semibold text-center" style={{ color: '#2D8B4E' }}>
              +{m.new_clients}
            </span>
            <span
              className="text-[14px] text-center"
              style={{
                color: m.termed_clients > 0 ? '#C75A3A' : '#A09888',
                fontWeight: m.termed_clients > 0 ? 600 : 400,
              }}
            >
              {m.termed_clients > 0 ? `-${m.termed_clients}` : '\u2014'}
            </span>
            <div className="flex items-center justify-center gap-0.5">
              {m.net_change > 0 ? (
                <ArrowUpRight size={13} color="#2D8B4E" />
              ) : (
                <Minus size={13} color={m.net_change < 0 ? '#C75A3A' : '#A09888'} />
              )}
              <span
                className="text-[14px] font-bold"
                style={{ color: m.net_change > 0 ? '#2D8B4E' : '#2C2418' }}
              >
                {m.net_change > 0 ? `+${m.net_change}` : m.net_change}
              </span>
            </div>
            <span
              className="text-[15px] text-right"
              style={{ fontWeight: isFirst ? 700 : 600, color: isFirst ? '#2C2418' : '#5C5347' }}
            >
              {m.total_clients}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function formatMonthShort(monthStr: string): string {
  try {
    const [, month] = monthStr.split('-');
    const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return names[parseInt(month, 10) - 1] || monthStr;
  } catch {
    return monthStr;
  }
}
