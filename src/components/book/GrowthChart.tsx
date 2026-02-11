import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { MonthlyGrowth } from '@/types/book';

interface GrowthChartProps {
  data: MonthlyGrowth[];
}

function GrowthTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-[10px] px-3.5 py-2.5"
      style={{ background: '#2A2720', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}
    >
      <div className="text-[12px] mb-1" style={{ color: '#A09888' }}>{label}</div>
      <div className="text-[15px] font-bold" style={{ color: '#FAFAF8' }}>
        {payload[0].value} clients
      </div>
    </div>
  );
}

export function GrowthChart({ data }: GrowthChartProps) {
  const chartData = data.map(m => ({
    month: formatMonth(m.month),
    clients: m.total_clients,
  }));

  return (
    <div
      className="rounded-2xl p-7 mb-5"
      style={{
        background: 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(200,190,170,0.25)',
      }}
    >
      <div className="flex justify-between items-center mb-6">
        <span className="text-[16px] font-semibold" style={{ color: '#2C2418' }}>Client Growth</span>
        <span className="text-[12px]" style={{ color: '#8B7E6A' }}>Last 12 months</span>
      </div>
      <div className="h-[200px]">
        <ResponsiveContainer>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="growGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2D8B4E" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#2D8B4E" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(200,190,170,0.15)" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#8B7E6A' }}
              interval={1}
            />
            <YAxis
              domain={['dataMin - 3', 'dataMax + 3']}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#8B7E6A' }}
            />
            <Tooltip content={<GrowthTooltip />} />
            <Area
              type="monotone"
              dataKey="clients"
              stroke="#2D8B4E"
              strokeWidth={2.5}
              fill="url(#growGrad)"
              dot={{ r: 3.5, fill: '#2D8B4E', stroke: '#F8F5F0', strokeWidth: 2 }}
              activeDot={{ r: 5, fill: '#2D8B4E', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function formatMonth(monthStr: string): string {
  // Input: "2026-02" or "2025-09" etc
  try {
    const [year, month] = monthStr.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const shortYear = year.slice(2);
    return `${monthNames[parseInt(month, 10) - 1]} '${shortYear}`;
  } catch {
    return monthStr;
  }
}
