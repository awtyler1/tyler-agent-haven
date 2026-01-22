import { Sparkles, TrendingUp, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getMonthName } from '@/lib/sync';

interface SyncMilestoneProps {
  milestone: number;
  totalClients: number;
  previousTotal: number;
  nextMilestone: number | null;
  onContinue: () => void;
}

export function SyncMilestone({
  milestone,
  totalClients,
  previousTotal,
  nextMilestone,
  onContinue,
}: SyncMilestoneProps) {
  const delta = totalClients - previousTotal;
  const monthName = getMonthName();
  const progressToNext = nextMilestone
    ? Math.round((totalClients / nextMilestone) * 100)
    : 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-50/30 flex flex-col">
      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center">
          {/* Gold Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-200 to-yellow-200 text-amber-800 rounded-full text-sm font-medium mb-6 shadow-sm">
            <Sparkles className="w-4 h-4" />
            Milestone Unlocked
          </div>

          {/* Headline */}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            You hit {milestone} clients! 🎉
          </h1>
          <p className="text-gray-500 mb-8">
            Amazing work growing your book of business
          </p>

          {/* Stats Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-green-100 mx-auto mb-3 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{totalClients}</p>
                <p className="text-xs text-gray-400 mt-1">Total Clients</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-blue-100 mx-auto mb-3 flex items-center justify-center">
                  <span className="text-lg font-bold text-blue-600">+</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {delta >= 0 ? `+${delta}` : delta}
                </p>
                <p className="text-xs text-gray-400 mt-1">{monthName} Change</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-amber-100 mx-auto mb-3 flex items-center justify-center">
                  <Target className="w-6 h-6 text-amber-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{milestone}</p>
                <p className="text-xs text-gray-400 mt-1">Milestone</p>
              </div>
            </div>

            {/* Progress to Next Milestone */}
            {nextMilestone && (
              <div className="border-t border-gray-100 pt-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-500">Next: {nextMilestone} clients</span>
                  <span className="text-gray-900 font-medium">{progressToNext}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full transition-all duration-500"
                    style={{ width: `${progressToNext}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {nextMilestone - totalClients} more to go
                </p>
              </div>
            )}
          </div>

          {/* CTA Button */}
          <Button onClick={onContinue} size="lg" className="w-full max-w-xs">
            Continue to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
