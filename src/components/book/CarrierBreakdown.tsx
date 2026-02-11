import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import type { CarrierBreakdownItem } from '@/types/book';

interface CarrierBreakdownProps {
  carriers: CarrierBreakdownItem[];
  totalClients: number;
}

export function CarrierBreakdown({ carriers, totalClients }: CarrierBreakdownProps) {
  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(200,190,170,0.3)',
      }}
    >
      <div className="text-[12px] font-semibold uppercase tracking-wider mb-5" style={{ color: '#8B7E6A' }}>
        Carriers
      </div>

      <div className="flex items-center gap-4 mb-5">
        <div className="w-20 h-20">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={carriers}
                cx="50%"
                cy="50%"
                innerRadius={24}
                outerRadius={38}
                dataKey="count"
                strokeWidth={0}
              >
                {carriers.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="text-[13px]" style={{ color: '#8B7E6A' }}>
          <span className="text-[20px] font-bold" style={{ color: '#2C2418' }}>{totalClients}</span>
          <br />
          active clients
        </div>
      </div>

      {carriers.map((carrier, i) => (
        <div key={i} className={i < carriers.length - 1 ? 'mb-3.5' : ''}>
          <div className="flex justify-between mb-1.5">
            <span className="text-[14px] font-medium" style={{ color: '#2C2418' }}>
              {carrier.carrier_name}
            </span>
            <span className="text-[14px] font-semibold" style={{ color: '#2C2418' }}>
              {carrier.count}
            </span>
          </div>
          <div className="h-1.5 rounded-sm overflow-hidden" style={{ background: 'rgba(200,190,170,0.2)' }}>
            <div
              className="h-full rounded-sm transition-all duration-1000"
              style={{ width: `${carrier.percentage}%`, background: carrier.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
