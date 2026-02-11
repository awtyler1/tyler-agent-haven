import { TrendingUp } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import type { BookSummary, MonthlyGrowth } from '@/types/book';
import { PLAN_TYPE_RENEWAL } from '@/types/book';

interface HeroCardProps {
  summary: BookSummary;
  monthlyData: MonthlyGrowth[];
  planBreakdown: { type: string; count: number; revenue: number }[];
}

export function HeroCard({ summary, monthlyData, planBreakdown }: HeroCardProps) {
  const sparkData = monthlyData.slice(-6).map(m => ({ clients: m.total_clients }));

  return (
    <div
      className="rounded-[20px] relative overflow-hidden mb-5"
      style={{ background: 'linear-gradient(135deg, #1C1A16 0%, #2A2720 100%)' }}
    >
      {/* Gold accent line */}
      <div
        className="absolute top-0 left-10 right-10 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(200,169,81,0.3), transparent)' }}
      />

      <div className="grid grid-cols-2 gap-10 items-center px-10 py-9">
        {/* Left: Client count */}
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="flex items-center gap-1 text-[13px] font-semibold px-3 py-1 rounded-full"
              style={{ background: 'rgba(45,139,78,0.15)', color: '#5BC47A' }}
            >
              <TrendingUp size={13} />
              +{summary.new_this_month} this month
            </span>
          </div>
          <div className="text-[72px] font-bold tracking-[-3px] leading-none" style={{ color: '#FAFAF8' }}>
            {summary.active_clients}
          </div>
          <div className="text-[16px] mt-1.5" style={{ color: '#A09888' }}>
            active clients in your book
          </div>

          {/* Sparkline */}
          <div className="mt-5 h-12 w-4/5">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData}>
                <defs>
                  <linearGradient id="heroSpark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5BC47A" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#5BC47A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="clients" stroke="#5BC47A" strokeWidth={2} fill="url(#heroSpark)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Revenue */}
        <div className="border-l pl-10" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="text-[12px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#8B7E6A' }}>
            Projected Annual Renewals
          </div>
          <div className="text-[42px] font-bold tracking-[-1.5px] leading-none" style={{ color: '#C8A951' }}>
            ${summary.total_annual_renewal.toLocaleString()}
          </div>
          <div className="text-[14px] mt-2.5" style={{ color: '#6B6356' }}>
            ${Math.round(summary.total_annual_renewal / 12).toLocaleString()}{' '}
            <span style={{ color: '#8B7E6A' }}>/ month avg</span>
          </div>

          <div className="mt-5 flex flex-col gap-2">
            {planBreakdown.map((item, i) => (
              <div key={i} className="flex justify-between items-baseline">
                <span className="text-[13px]" style={{ color: '#8B7E6A' }}>
                  {item.type} Renewals
                </span>
                <span className="text-[14px] font-semibold" style={{ color: '#D4C9B0' }}>
                  ${item.revenue.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
