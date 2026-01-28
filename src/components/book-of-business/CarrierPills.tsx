import { cn } from '@/lib/utils';

interface CarrierData {
  id: string;
  code: string;
  name: string;
  clientCount: number;
}

interface CarrierPillsProps {
  /** Array of carrier data */
  carriers: CarrierData[];
  /** Maximum carriers to show before overflow (default 4) */
  maxVisible?: number;
  /** Variant: 'dark' for dark backgrounds, 'light' for light backgrounds */
  variant?: 'dark' | 'light';
  /** Additional class names */
  className?: string;
  /** Callback when overflow pill is clicked */
  onOverflowClick?: () => void;
}

// Carrier color mapping
const CARRIER_COLORS: Record<string, { dot: string; bg: string; border: string; text: string }> = {
  aetna: {
    dot: 'bg-violet-400',
    bg: 'bg-white/5',
    border: 'border-white/10',
    text: 'text-white/90',
  },
  anthem: {
    dot: 'bg-blue-400',
    bg: 'bg-white/5',
    border: 'border-white/10',
    text: 'text-white/90',
  },
  humana: {
    dot: 'bg-emerald-400',
    bg: 'bg-white/5',
    border: 'border-white/10',
    text: 'text-white/90',
  },
  wellcare: {
    dot: 'bg-sky-400',
    bg: 'bg-white/5',
    border: 'border-white/10',
    text: 'text-white/90',
  },
  uhc: {
    dot: 'bg-red-400',
    bg: 'bg-white/5',
    border: 'border-white/10',
    text: 'text-white/90',
  },
  cigna: {
    dot: 'bg-orange-400',
    bg: 'bg-white/5',
    border: 'border-white/10',
    text: 'text-white/90',
  },
};

const CARRIER_COLORS_LIGHT: Record<string, { dot: string; bg: string; border: string; text: string }> = {
  aetna: {
    dot: 'bg-violet-500',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    text: 'text-violet-700',
  },
  anthem: {
    dot: 'bg-blue-500',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
  },
  humana: {
    dot: 'bg-emerald-500',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
  },
  wellcare: {
    dot: 'bg-sky-500',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    text: 'text-sky-700',
  },
  uhc: {
    dot: 'bg-red-500',
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
  },
  cigna: {
    dot: 'bg-orange-500',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-700',
  },
};

const DEFAULT_COLORS = {
  dot: 'bg-stone-400',
  bg: 'bg-white/5',
  border: 'border-white/10',
  text: 'text-white/90',
};

const DEFAULT_COLORS_LIGHT = {
  dot: 'bg-stone-400',
  bg: 'bg-stone-50',
  border: 'border-stone-200',
  text: 'text-stone-700',
};

function getCarrierColors(code: string, variant: 'dark' | 'light') {
  const colorMap = variant === 'dark' ? CARRIER_COLORS : CARRIER_COLORS_LIGHT;
  const defaults = variant === 'dark' ? DEFAULT_COLORS : DEFAULT_COLORS_LIGHT;
  return colorMap[code.toLowerCase()] || defaults;
}

export function CarrierPills({
  carriers,
  maxVisible = 4,
  variant = 'dark',
  className,
  onOverflowClick,
}: CarrierPillsProps) {
  // Sort by client count descending
  const sortedCarriers = [...carriers].sort((a, b) => b.clientCount - a.clientCount);

  // Split into visible and overflow
  const visibleCarriers = sortedCarriers.slice(0, maxVisible);
  const overflowCarriers = sortedCarriers.slice(maxVisible);
  const hasOverflow = overflowCarriers.length > 0;

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      {visibleCarriers.map((carrier) => {
        const colors = getCarrierColors(carrier.code, variant);

        return (
          <span
            key={carrier.id}
            className={cn(
              'px-4 py-2.5 rounded-2xl text-sm font-medium border',
              'transition-all duration-200 ease-out',
              'hover:-translate-y-0.5 hover:shadow-lg',
              colors.bg,
              colors.border,
              colors.text
            )}
          >
            <span className={cn('inline-block w-2 h-2 rounded-full mr-2', colors.dot)} />
            {carrier.name} {carrier.clientCount}
          </span>
        );
      })}

      {hasOverflow && (
        <button
          onClick={onOverflowClick}
          className={cn(
            'px-4 py-2.5 rounded-2xl text-sm font-medium border',
            'transition-all duration-200 ease-out',
            'hover:-translate-y-0.5 hover:shadow-lg',
            variant === 'dark'
              ? 'bg-white/5 border-white/10 text-white/70 hover:text-white/90'
              : 'bg-stone-100 border-stone-200 text-stone-600 hover:text-stone-900'
          )}
        >
          +{overflowCarriers.length} more
        </button>
      )}
    </div>
  );
}
