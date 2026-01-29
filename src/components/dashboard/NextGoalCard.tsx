import { Target } from 'lucide-react';
import { cn } from '@/lib/utils';

// Milestone progression
export const MILESTONES = [10, 25, 50, 100, 150, 200, 250, 300, 400, 500, 750, 1000];

interface NextGoalCardProps {
  currentClients: number;
  isCompact?: boolean;
}

/**
 * NextGoalCard - Shows next milestone target
 *
 * Automatically calculates next milestone from predefined list.
 * Shows "X to go" countdown.
 */
export function NextGoalCard({ currentClients, isCompact = false }: NextGoalCardProps) {
  // Calculate next milestone
  const nextMilestone = MILESTONES.find((m) => m > currentClients) || currentClients + 100;
  const toGoal = nextMilestone - currentClients;

  return (
    <div
      className={cn(
        'bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl text-white shadow-lg shadow-purple-500/20',
        isCompact ? 'p-4' : 'p-5'
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <Target className="w-5 h-5" />
        <span className="text-sm font-medium text-purple-100">Next Goal</span>
      </div>
      <p className={cn('font-bold', isCompact ? 'text-3xl' : 'text-4xl')}>
        {nextMilestone}
      </p>
      <p className="text-sm text-purple-100">{toGoal} to go</p>
    </div>
  );
}

/**
 * Helper to get the last completed milestone
 */
export function getLastMilestone(currentClients: number): number {
  const passed = MILESTONES.filter((m) => m <= currentClients);
  return passed.length > 0 ? passed[passed.length - 1] : 0;
}

/**
 * Helper to get milestones hit
 */
export function getMilestonesHit(currentClients: number): number[] {
  return MILESTONES.filter((m) => m <= currentClients);
}
