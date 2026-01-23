import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CarrierCardProps {
  carrier: {
    name: string;
    code: string;
  };
  clientCount: number;
  totalClients: number;
  lastUploadDate: Date | null;
  onClick?: () => void;
}

const CARRIER_COLORS: Record<string, { bg: string; text: string; progress: string }> = {
  aetna: { bg: 'bg-blue-100', text: 'text-blue-600', progress: 'bg-blue-500' },
  anthem: { bg: 'bg-indigo-100', text: 'text-indigo-600', progress: 'bg-indigo-500' },
  humana: { bg: 'bg-green-100', text: 'text-green-600', progress: 'bg-green-500' },
  wellcare: { bg: 'bg-purple-100', text: 'text-purple-600', progress: 'bg-purple-500' },
};

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function CarrierCard({
  carrier,
  clientCount,
  totalClients,
  lastUploadDate,
  onClick,
}: CarrierCardProps) {
  const colors = CARRIER_COLORS[carrier.code] || {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    progress: 'bg-gray-500',
  };

  const percentage = totalClients > 0 ? Math.round((clientCount / totalClients) * 100) : 0;

  // Check if data is stale (> 30 days)
  const isStale = lastUploadDate
    ? (Date.now() - lastUploadDate.getTime()) / (1000 * 60 * 60 * 24) > 30
    : false;

  const daysAgo = lastUploadDate
    ? Math.floor((Date.now() - lastUploadDate.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white dark:bg-card rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer',
        isStale
          ? 'border-2 border-amber-300 dark:border-amber-600'
          : 'border border-gray-100 dark:border-border'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', colors.bg)}>
            <span className={cn('text-base font-bold', colors.text)}>
              {carrier.name.charAt(0)}
            </span>
          </div>
          <span className="font-medium text-gray-900 dark:text-foreground">{carrier.name}</span>
        </div>
        {!isStale && lastUploadDate && (
          <span className="text-xs text-gray-400">
            {formatShortDate(lastUploadDate)}
          </span>
        )}
      </div>

      {/* Client count */}
      <p className="text-3xl font-bold text-gray-900 dark:text-foreground">{clientCount}</p>

      {/* Progress bar or stale warning */}
      {isStale ? (
        <div className="flex items-center gap-1.5 mt-3 text-amber-600 dark:text-amber-500">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-xs font-medium">{daysAgo} days ago</span>
        </div>
      ) : (
        <>
          <div className="mt-3 h-2 bg-gray-100 dark:bg-muted rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', colors.progress)}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">{percentage}% of book</p>
        </>
      )}
    </div>
  );
}
