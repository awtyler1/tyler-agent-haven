import { cn } from '@/lib/utils';

// Milestone thresholds
const MILESTONES = [25, 50, 100, 150, 200, 250, 300, 400, 500, 750, 1000];

interface MilestoneCardProps {
  /** Current total client count */
  currentClients: number;
  /** Optional custom next milestone (if not provided, calculated from MILESTONES) */
  nextMilestone?: number;
  /** Additional class names */
  className?: string;
}

export function MilestoneCard({ currentClients, nextMilestone, className }: MilestoneCardProps) {
  // Calculate next milestone if not provided
  const calculatedNextMilestone = nextMilestone ?? MILESTONES.find(m => m > currentClients) ?? 1000;

  // Find previous milestone for progress calculation
  const previousMilestone = [...MILESTONES].reverse().find(m => m <= currentClients) ?? 0;

  // Calculate progress between previous and next milestone
  const range = calculatedNextMilestone - previousMilestone;
  const progress = range > 0 ? ((currentClients - previousMilestone) / range) * 100 : 0;

  // Calculate clients to go
  const clientsToGo = calculatedNextMilestone - currentClients;

  return (
    <div className={cn(
      'bg-white rounded-3xl p-5',
      'shadow-[0_0_0_1px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.08),0_20px_40px_-12px_rgba(0,0,0,0.1)]',
      className
    )}>
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-[0_8px_32px_-8px_rgba(59,130,246,0.4)]">
          <span className="text-2xl">🎯</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-base font-semibold text-stone-900">
              {clientsToGo} clients to {calculatedNextMilestone}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${Math.min(progress, 100)}%`,
                animation: 'progress-grow 1s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              }}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes progress-grow {
          from {
            width: 0;
          }
        }
      `}</style>
    </div>
  );
}

export { MILESTONES };
