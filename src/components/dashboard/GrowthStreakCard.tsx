import { Flame, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GrowthStreakCardProps {
  streak: number;
  newThisMonth: number;
  termedThisMonth: number;
  netChange: number;
  isCompact?: boolean;
}

/**
 * GrowthStreakCard - Shows consecutive months of growth
 *
 * If streak >= 2: Shows orange gradient "Growth Streak" card
 * If streak < 2: Shows blue "This Month" card with new client count
 */
export function GrowthStreakCard({
  streak,
  newThisMonth,
  termedThisMonth,
  netChange,
  isCompact = false,
}: GrowthStreakCardProps) {
  const showStreak = streak >= 2;

  if (showStreak) {
    return (
      <div
        className={cn(
          'bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl text-white shadow-lg shadow-orange-500/20',
          isCompact ? 'p-4' : 'p-5'
        )}
      >
        <div className="flex items-center gap-2 mb-2">
          <Flame className="w-5 h-5" />
          <span className="text-sm font-medium text-orange-100">Growth Streak</span>
        </div>
        <p className={cn('font-bold', isCompact ? 'text-3xl' : 'text-4xl')}>
          {streak}
        </p>
        <p className="text-sm text-orange-100">months in a row</p>
      </div>
    );
  }

  // Fallback: "This Month" card
  return (
    <div
      className={cn(
        'bg-gradient-to-br rounded-2xl text-white shadow-lg',
        netChange > 0 ? 'from-blue-500 to-indigo-500 shadow-blue-500/20' :
        netChange < 0 ? 'from-amber-500 to-orange-500 shadow-amber-500/20' :
        'from-slate-500 to-slate-600 shadow-slate-500/20',
        isCompact ? 'p-4' : 'p-5'
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className={cn('w-5 h-5', netChange < 0 && 'rotate-180')} />
        <span className="text-sm font-medium opacity-80">This Month</span>
      </div>
      <p className={cn('font-bold', isCompact ? 'text-3xl' : 'text-4xl')}>
        {netChange > 0 ? '+' : ''}{netChange}
      </p>
      <p className="text-sm opacity-80">
        net change
        {(newThisMonth > 0 || termedThisMonth > 0) && (
          <span className="opacity-60"> · +{newThisMonth} / -{termedThisMonth}</span>
        )}
      </p>
    </div>
  );
}
