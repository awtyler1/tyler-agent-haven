import { Target } from 'lucide-react';

interface MilestoneProgressProps {
  currentClients: number;
}

// Milestone tiers
const MILESTONES = [50, 100, 150, 200, 250, 300, 400, 500, 750, 1000];

export function MilestoneProgress({ currentClients }: MilestoneProgressProps) {
  // Find the next milestone above current count
  const nextMilestone = MILESTONES.find(m => m > currentClients) || MILESTONES[MILESTONES.length - 1];
  const toGo = nextMilestone - currentClients;
  const percentage = Math.min((currentClients / nextMilestone) * 100, 100);

  return (
    <div
      className="rounded-2xl px-6 py-5"
      style={{
        background: 'linear-gradient(135deg, rgba(200,169,81,0.08) 0%, rgba(200,169,81,0.03) 100%)',
        border: '1px solid rgba(200,169,81,0.2)',
      }}
    >
      <div className="flex items-center gap-2 mb-2.5">
        <Target size={16} color="#B8963E" />
        <span className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: '#B8963E' }}>
          Next Milestone
        </span>
      </div>
      <div className="flex justify-between items-baseline mb-2.5">
        <span className="text-[18px] font-bold" style={{ color: '#2C2418' }}>
          {nextMilestone} clients
        </span>
        <span className="text-[14px] font-semibold" style={{ color: '#B8963E' }}>
          {toGo} to go
        </span>
      </div>
      <div className="h-1.5 rounded-sm" style={{ background: 'rgba(200,169,81,0.15)' }}>
        <div
          className="h-full rounded-sm"
          style={{
            width: `${percentage}%`,
            background: 'linear-gradient(90deg, #C8A951, #D4B96A)',
          }}
        />
      </div>
    </div>
  );
}
