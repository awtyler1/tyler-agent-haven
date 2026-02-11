import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, DollarSign, Users, Activity } from 'lucide-react';
import { useBookSummary } from '@/hooks/useBookSummary';
import { useMonthlyGrowth } from '@/hooks/useMonthlyGrowth';
import { useCarrierIncome } from '@/hooks/useCarrierIncome';
import { GrowthChart } from '@/components/book/GrowthChart';
import { MonthlyActivityTable } from '@/components/book/MonthlyActivityTable';
import { IncomeByCarrier } from '@/components/book/IncomeByCarrier';

export default function GrowthIncome() {
  const navigate = useNavigate();
  const { data: summary } = useBookSummary();
  const { data: monthlyData = [] } = useMonthlyGrowth(12);
  const { data: carrierIncomeData = [] } = useCarrierIncome();

  const totalIncome = carrierIncomeData.reduce((sum, c) => sum + c.income, 0);
  const totalPolicies = carrierIncomeData.reduce((sum, c) => sum + c.policies, 0);

  // Calculate 12-month growth
  const growth12m = useMemo(() => {
    if (monthlyData.length < 2) return { added: 0, rate: 0 };
    const first = monthlyData[0]?.total_clients || 0;
    const last = monthlyData[monthlyData.length - 1]?.total_clients || 0;
    return {
      added: last - first,
      rate: first > 0 ? Math.round(((last - first) / first) * 1000) / 10 : 0,
    };
  }, [monthlyData]);

  const avgRevenue = summary && summary.active_clients > 0
    ? Math.round(totalIncome / summary.active_clients)
    : 0;

  const metrics = [
    {
      label: '12-Month Growth',
      value: `+${growth12m.added} clients`,
      sub: monthlyData.length >= 2
        ? `${monthlyData[0]?.total_clients || 0} → ${monthlyData[monthlyData.length - 1]?.total_clients || 0}`
        : '',
      color: '#2D8B4E',
      icon: TrendingUp,
    },
    {
      label: 'Growth Rate',
      value: `${growth12m.rate > 0 ? '+' : ''}${growth12m.rate}%`,
      sub: 'year over year',
      color: '#2D8B4E',
      icon: Activity,
    },
    {
      label: 'Annual Renewals',
      value: `$${totalIncome.toLocaleString()}`,
      sub: `$${Math.round(totalIncome / 12).toLocaleString()}/mo average`,
      color: '#C8A951',
      icon: DollarSign,
    },
    {
      label: 'Avg Revenue/Client',
      value: `$${avgRevenue}`,
      sub: 'across all plan types',
      color: '#2C2418',
      icon: Users,
    },
  ];

  return (
    <div
      className="min-h-screen px-10 py-8"
      style={{ background: '#F8F5F0', fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}
    >
      {/* Header */}
      <div className="mb-7">
        <button
          onClick={() => navigate('/book')}
          className="text-[13px] font-medium mb-1 bg-transparent border-none cursor-pointer p-0"
          style={{ color: '#3B6FB5' }}
        >
          ← My Book
        </button>
        <h1 className="text-[26px] font-bold m-0" style={{ color: '#2C2418' }}>Growth & Income</h1>
        <p className="text-[14px] m-0 mt-1" style={{ color: '#8B7E6A' }}>
          How your book is growing and what it's earning
        </p>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {metrics.map((m, i) => (
          <div
            key={i}
            className="rounded-[14px] px-5 py-5"
            style={{
              background: 'rgba(255,255,255,0.75)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(200,190,170,0.25)',
            }}
          >
            <div className="flex items-center gap-1.5 mb-2.5">
              <m.icon size={14} color="#8B7E6A" />
              <span className="text-[12px] font-medium" style={{ color: '#8B7E6A' }}>{m.label}</span>
            </div>
            <div className="text-[24px] font-bold tracking-tight" style={{ color: m.color }}>
              {m.value}
            </div>
            <div className="text-[12px] mt-0.5" style={{ color: '#A09888' }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Growth chart */}
      <GrowthChart data={monthlyData} />

      {/* Two columns: Monthly Activity + Income by Carrier */}
      <div className="grid grid-cols-2 gap-5">
        <MonthlyActivityTable data={monthlyData} />
        <IncomeByCarrier carriers={carrierIncomeData} totalIncome={totalIncome} />
      </div>
    </div>
  );
}
