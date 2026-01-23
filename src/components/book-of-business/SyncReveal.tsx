import { CheckCircle2, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getMonthName, getPreviousMonthName, getNextSyncDate } from '@/lib/sync';

interface CarrierBreakdown {
  carrier: string;
  code: string;
  count: number;
  delta: number;
}

interface SyncRevealProps {
  totalClients: number;
  previousTotal: number;
  carrierBreakdown: CarrierBreakdown[];
  onContinue: () => void;
}

const CARRIER_COLORS: Record<string, { bg: string; text: string }> = {
  humana: { bg: 'bg-green-100', text: 'text-green-600' },
  aetna: { bg: 'bg-blue-100', text: 'text-blue-600' },
  anthem: { bg: 'bg-indigo-100', text: 'text-indigo-600' },
  wellcare: { bg: 'bg-purple-100', text: 'text-purple-600' },
};

export function SyncReveal({
  totalClients,
  previousTotal,
  carrierBreakdown,
  onContinue,
}: SyncRevealProps) {
  const delta = totalClients - previousTotal;
  const isGrowth = delta >= 0;
  const retentionRate = previousTotal > 0
    ? Math.round((totalClients / previousTotal) * 100)
    : 100;

  const monthName = getMonthName();
  const prevMonthName = getPreviousMonthName();
  const nextSyncDate = getNextSyncDate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-white flex flex-col">
      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center">
          {/* Success Badge */}
          {isGrowth && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-6">
              <CheckCircle2 className="w-4 h-4" />
              All synced!
            </div>
          )}

          {/* Headline */}
          <h1 className="text-2xl font-semibold text-gray-900 mb-8">
            {isGrowth ? "You're all synced!" : "Sync complete"}
          </h1>

          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            {/* Label */}
            <p className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-4">
              Your {monthName} book
            </p>

            {/* Big Number */}
            <p
              className="text-7xl font-bold text-gray-900 tracking-tight mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ textShadow: isGrowth ? '0 0 80px rgba(34, 197, 94, 0.2)' : undefined }}
            >
              {totalClients}
            </p>

            {/* Growth Pill */}
            <div className="flex items-center justify-center gap-2 mb-8">
              <div
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium',
                  isGrowth
                    ? 'bg-green-100 text-green-700'
                    : 'bg-amber-100 text-amber-700'
                )}
              >
                {isGrowth ? (
                  <ArrowUp className="w-4 h-4" />
                ) : (
                  <ArrowDown className="w-4 h-4" />
                )}
                {delta >= 0 ? `+${delta}` : delta} from {prevMonthName}
              </div>
            </div>

            {/* Down month message */}
            {!isGrowth && (
              <p className="text-sm text-gray-500 mb-8">
                Some months are slower. Your {retentionRate}% retention rate is still strong.
              </p>
            )}

            {/* Carrier Breakdown */}
            {carrierBreakdown.length > 0 && (
              <div className="border-t border-gray-100 pt-6">
                <div className={cn(
                  'grid gap-4',
                  carrierBreakdown.length === 1 ? 'grid-cols-1 max-w-[120px] mx-auto' :
                  carrierBreakdown.length === 2 ? 'grid-cols-2' :
                  carrierBreakdown.length === 3 ? 'grid-cols-3' : 'grid-cols-4'
                )}>
                  {carrierBreakdown.map((item) => {
                    const colors = CARRIER_COLORS[item.code] || {
                      bg: 'bg-gray-100',
                      text: 'text-gray-600',
                    };
                    return (
                      <div key={item.code} className="text-center">
                        <div
                          className={cn(
                            'w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center',
                            colors.bg
                          )}
                        >
                          <span className={cn('text-sm font-bold', colors.text)}>
                            {item.carrier.charAt(0)}
                          </span>
                        </div>
                        <p className="text-lg font-semibold text-gray-900">{item.count}</p>
                        <p className="text-xs text-gray-400">{item.carrier}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* CTA Button */}
          <Button onClick={onContinue} size="lg" className="w-full max-w-xs">
            View Your Dashboard
          </Button>

          {/* Hint */}
          <p className="text-xs text-gray-400 mt-4">
            Your data is fresh until {nextSyncDate}
          </p>
        </div>
      </div>
    </div>
  );
}
