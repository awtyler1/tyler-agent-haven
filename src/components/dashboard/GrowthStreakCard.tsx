import { Flame, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GrowthStreakCardProps {
  streak: number;
  newThisMonth: number;
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
        'bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl text-white shadow-lg shadow-blue-500/20',
        isCompact ? 'p-4' : 'p-5'
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="w-5 h-5" />
        <span className="text-sm font-medium text-blue-100">This Month</span>
      </div>
      <p className={cn('font-bold', isCompact ? 'text-3xl' : 'text-4xl')}>
        +{newThisMonth}
      </p>
      <p className="text-sm text-blue-100">new clients</p>
    </div>
  );
}
