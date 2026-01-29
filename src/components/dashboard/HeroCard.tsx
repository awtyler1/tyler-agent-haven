import { TrendingUp, Rocket } from 'lucide-react';
import { Sparkline } from './Sparkline';
import { cn } from '@/lib/utils';

interface CarrierData {
  name: string;
  count: number;
  color: string; // Tailwind class e.g., 'bg-emerald-500'
}

interface HeroCardProps {
  totalClients: number;
  newThisMonth: number;
  carriers: CarrierData[];
  monthlyHistory: number[];
  isCompact?: boolean;
}

/**
 * HeroCard - The centerpiece of the dashboard
 *
 * Features:
 * - Growth badge at top (or "Let's get started" for new agents)
 * - Giant client count number (THE hero)
 * - 6-month sparkline trend
 * - Color-coded carrier pills
 */
export function HeroCard({
  totalClients,
  newThisMonth,
  carriers,
  monthlyHistory,
  isCompact = false,
}: HeroCardProps) {
  const hasGrowth = newThisMonth > 0;
  const isNewAgent = totalClients < 10;

  // Generate month labels for sparkline (last 6 months)
  const getMonthLabels = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const labels = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(months[date.getMonth()]);
    }
    return labels;
  };

  return (
    <div
      className={cn(
        'bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100',
        isCompact ? 'p-4 mb-3' : 'p-6 mb-5'
      )}
    >
      {/* Growth Badge */}
      <div className="flex justify-center mb-3">
        {hasGrowth ? (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-700">
              +{newThisMonth} this month
            </span>
          </div>
        ) : isNewAgent ? (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100">
            <Rocket className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-700">
              Let's get started
            </span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 border border-slate-200">
            <span className="text-sm font-medium text-slate-600">
              No change this month
            </span>
          </div>
        )}
      </div>

      {/* THE NUMBER */}
      <div className="text-center mb-1">
        <span
          className={cn(
            'font-bold tracking-tight text-slate-800',
            isCompact ? 'text-7xl' : 'text-8xl'
          )}
        >
          {totalClients.toLocaleString()}
        </span>
      </div>
      <p className="text-center text-slate-500 mb-4">
        {totalClients === 1 ? 'client' : 'total clients'}
      </p>

      {/* Sparkline */}
      {monthlyHistory.length > 0 && (
        <div className={isCompact ? 'mb-3' : 'mb-5'}>
          <Sparkline
            data={monthlyHistory}
            labels={getMonthLabels()}
            className={isCompact ? 'h-10' : 'h-12'}
          />
        </div>
      )}

      {/* Carrier Pills */}
      {carriers.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {carriers.map((carrier) => (
            <div
              key={carrier.name}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200/80"
            >
              <div className={cn('w-2 h-2 rounded-full', carrier.color)} />
              <span className="text-sm font-medium text-slate-700">
                {carrier.name}
              </span>
              <span className="text-sm text-slate-400">{carrier.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
