import { cn } from '@/lib/utils';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
  color?: string;
  showLabels?: boolean;
  labels?: string[];
}

/**
 * Sparkline - Reusable area chart with gradient fill
 *
 * Features:
 * - Auto-scales Y axis based on data min/max
 * - Gradient fill beneath line
 * - Dot at final data point
 * - Optional month labels
 * - Handles edge cases (empty, single point, flat line)
 */
export function Sparkline({
  data,
  width = 280,
  height = 50,
  className,
  color = '#3b82f6', // blue-500
  showLabels = true,
  labels = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'],
}: SparklineProps) {
  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <div className={cn('opacity-30', className)}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-12">
          <line
            x1="0"
            y1={height / 2}
            x2={width}
            y2={height / 2}
            stroke={color}
            strokeWidth="2"
            strokeDasharray="4 4"
            opacity="0.3"
          />
        </svg>
        {showLabels && (
          <div className="flex justify-between text-xs text-slate-400 mt-1 px-1">
            {labels.map((label, i) => (
              <span key={i}>{label}</span>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Calculate bounds with padding
  const maxVal = Math.max(...data, 1); // Ensure minimum of 1 to avoid division by zero
  const minVal = Math.min(...data, 0);
  const range = maxVal - minVal || 1;
  const padding = height * 0.1; // 10% padding top and bottom
  const chartHeight = height - padding * 2;

  // Convert data points to coordinates
  const points = data.map((value, index) => {
    const x = data.length === 1 ? width / 2 : (index / (data.length - 1)) * width;
    const y = padding + chartHeight - ((value - minVal) / range) * chartHeight;
    return { x, y };
  });

  // Generate path for line
  const linePath = points
    .map((point, i) => `${i === 0 ? 'M' : 'L'}${point.x},${point.y}`)
    .join(' ');

  // Generate path for area fill
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;

  // Unique ID for gradient
  const gradientId = `sparkline-gradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={className}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-12">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <path d={areaPath} fill={`url(#${gradientId})`} />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* End dot */}
        {points.length > 0 && (
          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r="5"
            fill={color}
          />
        )}
      </svg>

      {showLabels && labels.length > 0 && (
        <div className="flex justify-between text-xs text-slate-400 mt-1 px-1">
          {labels.slice(0, data.length).map((label, i) => (
            <span key={i}>{label}</span>
          ))}
        </div>
      )}
    </div>
  );
}
