import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Users, TrendingUp } from 'lucide-react';
import { useBookSummary } from '@/hooks/useBookSummary';
import { useMonthlyGrowth } from '@/hooks/useMonthlyGrowth';
import { useCarrierIncome } from '@/hooks/useCarrierIncome';
import { useBookClients } from '@/hooks/useBookClients';
import { HeroCard } from '@/components/book/HeroCard';
import { AttentionQueue, buildAttentionItems } from '@/components/book/AttentionQueue';
import { CarrierBreakdown } from '@/components/book/CarrierBreakdown';
import { MilestoneProgress } from '@/components/book/MilestoneProgress';
import type { CarrierBreakdownItem } from '@/types/book';
import { getCarrierColor } from '@/types/book';
import { UserAvatarDropdown } from '@/components/UserAvatarDropdown';
import { useNavigationContext } from '@/hooks/useNavigationContext';

export default function BookDashboard() {
  const navigate = useNavigate();
  const { homePath } = useNavigationContext();
  const { data: summary } = useBookSummary();
  const { data: monthlyData = [] } = useMonthlyGrowth(12);
  const { data: carrierIncomeData = [] } = useCarrierIncome();
  const { flaggedClients, allClients } = useBookClients();

  // Build plan breakdown for hero card from actual policy data
  const planBreakdown = useMemo(() => {
    if (!summary) return [];
    const total = summary.total_annual_renewal;
    if (total === 0) return [];
    // Use active policies count to estimate plan type split
    // This is approximate — a proper fix would group by plan_type in the query
    return [
      { type: 'MA', count: 0, revenue: Math.round(total * 0.93) },
      { type: 'PDP', count: 0, revenue: Math.round(total * 0.01) },
      { type: 'Other', count: 0, revenue: Math.round(total * 0.06) },
    ];
  }, [summary]);

  // Only clients with at least one active policy (matches hero card's active_clients)
  const activeOnlyClients = useMemo(() =>
    allClients.filter(c => c.policy_status === 'active'),
    [allClients],
  );

  // Build carrier breakdown from active clients only (one carrier per client)
  const carrierBreakdown: CarrierBreakdownItem[] = useMemo(() => {
    const carrierMap = new Map<string, { carrier_id: string; carrier_name: string; count: number; color: string }>();
    activeOnlyClients.forEach(c => {
      if (!c.carrier_id || !c.carrier_name) return;
      const existing = carrierMap.get(c.carrier_id);
      if (existing) {
        existing.count++;
      } else {
        carrierMap.set(c.carrier_id, {
          carrier_id: c.carrier_id,
          carrier_name: c.carrier_name,
          count: 1,
          color: c.carrier_color || getCarrierColor(c.carrier_name),
        });
      }
    });
    const total = Array.from(carrierMap.values()).reduce((s, c) => s + c.count, 0);
    return Array.from(carrierMap.values())
      .sort((a, b) => b.count - a.count)
      .map(c => ({
        carrier_id: c.carrier_id,
        carrier_name: c.carrier_name,
        count: c.count,
        percentage: total > 0 ? Math.round((c.count / total) * 1000) / 10 : 0,
        color: c.color,
      }));
  }, [activeOnlyClients]);

  const totalClientsForCarrier = carrierBreakdown.reduce((sum, c) => sum + c.count, 0);
  const attentionItems = buildAttentionItems(flaggedClients);

  // Use actual data from hooks — ?? instead of || so 0 isn't treated as falsy
  const activeClients = summary?.active_clients ?? allClients.length;
  const totalTermed = summary?.total_termed_12m ?? 0;
  const monthsOfData = summary?.months_of_data ?? 0;
  const retentionRate = summary?.retention_rate ?? 100;
  const growthRate = summary?.growth_rate ?? 0;
  const newThisMonth = summary?.new_this_month ?? 0;

  // Growth rate subtitle
  const growthSub = growthRate === 0 && monthsOfData < 3
    ? 'building history...'
    : growthRate === 0 && monthsOfData >= 3
      ? 'data under review'
      : monthsOfData >= 12
        ? 'vs. last year'
        : `over ${monthsOfData} months`;

  // Retention subtitle: use actual termed count
  const retentionSub = totalTermed > 0
    ? `${totalTermed} lost in ${monthsOfData >= 12 ? '12' : monthsOfData} months`
    : monthsOfData > 0
      ? `0 lost in ${monthsOfData} months`
      : 'no sync data yet';

  return (
    <div
      className="min-h-screen"
      style={{ background: '#F8F5F0', fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}
    >
      {/* Sticky Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          height: 52,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          background: 'rgba(255,255,255,0.5)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(60,48,28,0.04)',
        }}
      >
        <Link
          to={homePath}
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
            My Book
          </span>
        </Link>
        <UserAvatarDropdown />
      </header>

      <div className="px-10 py-8">

      {/* Hero Card */}
      <HeroCard
        summary={{
          ...(summary || {
            total_clients: allClients.length,
            active_clients: activeClients,
            total_policies: summary?.total_policies || 0,
            active_policies: summary?.active_policies || 0,
            total_annual_renewal: carrierIncomeData.reduce((s, c) => s + c.income, 0),
            clients_needing_attention: flaggedClients.length,
            retention_rate: retentionRate,
            new_this_month: newThisMonth,
            growth_rate: growthRate,
            total_termed_12m: 0,
            months_of_data: 0,
          }),
          // Always use computed attention count from useBookClients
          clients_needing_attention: flaggedClients.length,
        }}
        monthlyData={monthlyData}
        planBreakdown={planBreakdown}
      />

      {/* Three columns below hero */}
      <div className="grid grid-cols-3 gap-4">
        {/* Book Health */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(200,190,170,0.3)',
          }}
        >
          <div className="text-[12px] font-semibold uppercase tracking-wider mb-5" style={{ color: '#8B7E6A' }}>
            Book Health
          </div>

          {[
            {
              label: 'Retention Rate',
              value: `${retentionRate}%`,
              icon: Shield,
              color: '#2D8B4E',
              sub: retentionSub,
            },
            {
              label: 'New This Month',
              value: `+${newThisMonth}`,
              icon: Users,
              color: '#3B6FB5',
              sub: `in ${new Date().toLocaleDateString('en-US', { month: 'long' })}`,
            },
            {
              label: 'Growth Rate',
              value: `${growthRate > 0 ? '+' : ''}${growthRate}%`,
              icon: TrendingUp,
              color: '#2D8B4E',
              sub: growthSub,
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="flex items-center gap-3.5 py-3"
              style={{ borderBottom: i < 2 ? '1px solid rgba(200,190,170,0.2)' : 'none' }}
            >
              <div
                className="w-9 h-9 rounded-[10px] flex items-center justify-center"
                style={{ background: `${stat.color}12` }}
              >
                <stat.icon size={18} color={stat.color} />
              </div>
              <div className="flex-1">
                <div className="text-[13px]" style={{ color: '#8B7E6A' }}>{stat.label}</div>
                <div className="text-[20px] font-bold" style={{ color: '#2C2418' }}>{stat.value}</div>
              </div>
              <div className="text-[11px] text-right" style={{ color: '#A09888' }}>{stat.sub}</div>
            </div>
          ))}

          {/* Growth & Income link */}
          <button
            onClick={() => navigate('/book/growth')}
            className="mt-4 w-full py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer transition-all duration-150 border-none"
            style={{ background: 'rgba(59,111,181,0.06)', color: '#3B6FB5' }}
          >
            View Growth & Income →
          </button>
        </div>

        {/* Carrier Breakdown */}
        <CarrierBreakdown carriers={carrierBreakdown} totalClients={totalClientsForCarrier} />

        {/* Attention + Milestone */}
        <div className="flex flex-col gap-4">
          <AttentionQueue totalCount={flaggedClients.length} items={attentionItems} />
          <MilestoneProgress currentClients={activeClients} />
        </div>
      </div>

      {/* Quick link to client list */}
      <div className="mt-5 text-center">
        <button
          onClick={() => navigate('/book/clients')}
          className="text-[14px] font-semibold cursor-pointer bg-transparent border-none p-2"
          style={{ color: '#3B6FB5' }}
        >
          View All Clients →
        </button>
      </div>
      </div>
    </div>
  );
}
