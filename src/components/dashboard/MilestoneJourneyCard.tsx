import { useState } from 'react';
import { Flag, ChevronDown, ChevronUp, Calendar, TrendingUp, Star, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MILESTONES, getLastMilestone, getMilestonesHit } from './NextGoalCard';

interface MilestoneJourneyCardProps {
  totalClients: number;
  projectedDate?: string;
  avgNewPerMonth?: number;
  bestMonth?: { month: string; count: number };
  isCompact?: boolean;
}

/**
 * MilestoneJourneyCard - Expandable progress card
 *
 * Collapsed: Shows milestone count, progress bar, "X to go"
 * Expanded: Shows projected date, avg growth, best month, visual journey
 */
export function MilestoneJourneyCard({
  totalClients,
  projectedDate,
  avgNewPerMonth,
  bestMonth,
  isCompact = false,
}: MilestoneJourneyCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Calculate milestone data
  const milestonesHit = getMilestonesHit(totalClients);
  const lastMilestone = getLastMilestone(totalClients);
  const nextMilestone = MILESTONES.find((m) => m > totalClients) || totalClients + 100;
  const toGoal = nextMilestone - totalClients;

  // Progress percentage between last and next milestone
  const progressRange = nextMilestone - lastMilestone;
  const progressValue = totalClients - lastMilestone;
  const progressPercent = progressRange > 0 ? (progressValue / progressRange) * 100 : 0;

  // Get visible milestones for the journey visualization
  const getVisibleMilestones = (): number[] => {
    const nextIndex = MILESTONES.findIndex((m) => m > totalClients);
    const startIndex = Math.max(0, nextIndex - 3);
    const endIndex = Math.min(MILESTONES.length, nextIndex + 3);
    return MILESTONES.slice(startIndex, endIndex);
  };

  return (
    <div
      className={cn(
        'bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden',
        isCompact ? 'mb-3' : 'mb-5'
      )}
    >
      {/* Collapsed Header - Always Visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'w-full flex items-center justify-between hover:bg-slate-50/50 transition-colors',
          isCompact ? 'p-4' : 'p-5'
        )}
      >
        <div className="flex items-center gap-4">
          <div
            className={cn(
              'bg-blue-50 rounded-xl flex items-center justify-center',
              isCompact ? 'w-10 h-10' : 'w-12 h-12'
            )}
          >
            <Flag className={cn('text-blue-600', isCompact ? 'w-5 h-5' : 'w-6 h-6')} />
          </div>
          <div className="text-left">
            <p className="text-sm text-slate-500">Milestone Journey</p>
            <p className={cn('font-bold text-slate-800', isCompact ? 'text-base' : 'text-lg')}>
              {milestonesHit.length} milestones reached
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className={cn('font-bold text-blue-600', isCompact ? 'text-base' : 'text-lg')}>
              {toGoal}
            </p>
            <p className="text-xs text-slate-400">to {nextMilestone}</p>
          </div>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </button>

      {/* Progress Bar - Always Visible */}
      <div className="px-5 pb-4">
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-700"
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-slate-400">{lastMilestone}</span>
          <span className="text-xs font-medium text-blue-600">{nextMilestone}</span>
        </div>
      </div>

      {/* Expanded Detail */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-slate-100">
          <div className="pt-4 space-y-3">
            {/* Projected Date */}
            {projectedDate && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-600">Projected date</span>
                </div>
                <span className="text-sm font-semibold text-slate-800">{projectedDate}</span>
              </div>
            )}

            {/* Monthly Average */}
            {avgNewPerMonth !== undefined && avgNewPerMonth > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-600">Monthly average</span>
                </div>
                <span className="text-sm font-semibold text-slate-800">
                  +{avgNewPerMonth} clients
                </span>
              </div>
            )}

            {/* Best Month */}
            {bestMonth && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-600">Best month</span>
                </div>
                <span className="text-sm font-semibold text-slate-800">
                  {bestMonth.month} (+{bestMonth.count})
                </span>
              </div>
            )}

            {/* Visual Milestone Journey */}
            <div className="pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-400 mb-3">Your Journey</p>
              <div className="flex items-center gap-1">
                {getVisibleMilestones().map((m, i, arr) => {
                  const isHit = totalClients >= m;
                  const isNext = m === nextMilestone;

                  return (
                    <div key={m} className="flex items-center flex-1 last:flex-initial">
                      {/* Connector line (not before first) */}
                      {i > 0 && (
                        <div
                          className={cn(
                            'flex-1 h-1 rounded-full mr-1',
                            isHit ? 'bg-blue-500' : 'bg-slate-200'
                          )}
                        />
                      )}

                      {/* Milestone dot */}
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                            isHit
                              ? 'bg-blue-500 text-white'
                              : isNext
                              ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500 ring-offset-2'
                              : 'bg-slate-100 text-slate-400'
                          )}
                        >
                          {isHit ? <CheckCircle2 className="w-4 h-4" /> : m}
                        </div>
                        <span
                          className={cn(
                            'text-xs mt-1',
                            isHit ? 'text-blue-600 font-medium' : 'text-slate-400'
                          )}
                        >
                          {m}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
