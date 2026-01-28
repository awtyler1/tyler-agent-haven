import { ChevronRight, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MonthlyEarnings } from '@/lib/commissions';

interface EarningsCardProps {
  month: string; // e.g., "January 2026"
  earnings: MonthlyEarnings;
  onViewBreakdown?: () => void;
  untaggedCount?: number; // Number of policies assumed plan change
}

export function EarningsCard({ month, earnings, onViewBreakdown, untaggedCount }: EarningsCardProps) {
  const navigate = useNavigate();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate per-unit rates for display
  const renewalMonthlyRate = (347 / 12).toFixed(2); // MA renewal rate / 12

  return (
    <div className="border-t border-stone-100 dark:border-border pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-stone-500 dark:text-muted-foreground">{month} Earnings</p>
        {onViewBreakdown && (
          <button
            onClick={onViewBreakdown}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            View breakdown
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Earnings Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Renewals */}
        <div className="bg-stone-50 dark:bg-muted/50 rounded-2xl p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-2 h-2 bg-stone-400 rounded-full"></div>
            <p className="text-xs font-medium text-stone-500 dark:text-muted-foreground">RENEWALS</p>
          </div>
          <p className="text-xl font-bold text-stone-900 dark:text-foreground">{formatCurrency(earnings.renewals.amount)}</p>
          <p className="text-xs text-stone-500 dark:text-muted-foreground mt-1">{earnings.renewals.count} × ${renewalMonthlyRate}</p>
        </div>

        {/* Plan Changes */}
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400">PLAN CHANGE</p>
          </div>
          <p className="text-xl font-bold text-stone-900 dark:text-foreground">{formatCurrency(earnings.planChanges.amount)}</p>
          <p className="text-xs text-stone-500 dark:text-muted-foreground mt-1">{earnings.planChanges.count} × $347</p>
        </div>

        {/* T65 */}
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">T65</p>
          </div>
          <p className="text-xl font-bold text-stone-900 dark:text-foreground">{formatCurrency(earnings.t65.amount)}</p>
          <p className="text-xs text-stone-500 dark:text-muted-foreground mt-1">{earnings.t65.count} × $694</p>
        </div>

        {/* Total */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 border border-blue-100 dark:border-blue-800">
          <div className="flex items-center gap-1.5 mb-2">
            <p className="text-xs font-medium text-blue-600 dark:text-blue-400">TOTAL</p>
          </div>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(earnings.total)}</p>
          <p className="text-xs text-stone-500 dark:text-muted-foreground mt-1">this month</p>
        </div>
      </div>

      {/* T65 Nudge Banner */}
      {untaggedCount && untaggedCount > 0 && (
        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <p className="text-sm text-amber-800 dark:text-amber-300">
              {untaggedCount} {untaggedCount === 1 ? 'policy' : 'policies'} assumed plan change.{' '}
              <span className="font-medium">Tag T65s to see higher earnings.</span>
            </p>
          </div>
          <button
            onClick={() => navigate('/book-of-business/t65-review')}
            className="text-sm text-amber-700 dark:text-amber-400 font-medium hover:text-amber-900 dark:hover:text-amber-300"
          >
            Review →
          </button>
        </div>
      )}
    </div>
  );
}
