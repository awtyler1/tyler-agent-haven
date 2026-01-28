import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface BookSparklineProps {
  /** Array of client counts for the last 6 months (oldest to newest) */
  data: number[];
  /** Width of the SVG */
  width?: number;
  /** Height of the SVG */
  height?: number;
  /** Additional class names */
  className?: string;
}

export function BookSparkline({
  data,
  width = 140,
  height = 70,
  className
}: BookSparklineProps) {
  const { linePath, areaPath } = useMemo(() => {
    if (!data || data.length < 2) {
      // Default upward trend if no data
      return {
        linePath: `M0,${height - 10} C${width * 0.3},${height - 15} ${width * 0.6},${height * 0.4} ${width},${height * 0.15}`,
        areaPath: `M0,${height - 10} C${width * 0.3},${height - 15} ${width * 0.6},${height * 0.4} ${width},${height * 0.15} V${height} H0 Z`,
      };
    }

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    // Normalize data to fit within the SVG with padding
    const padding = { top: 10, bottom: 10 };
    const chartHeight = height - padding.top - padding.bottom;

    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = padding.top + chartHeight - ((value - min) / range) * chartHeight;
      return { x, y };
    });

    // Create smooth curve using cubic bezier
    let linePath = `M${points[0].x},${points[0].y}`;

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const tension = 0.3;

      const cp1x = prev.x + (curr.x - prev.x) * tension;
      const cp1y = prev.y;
      const cp2x = curr.x - (curr.x - prev.x) * tension;
      const cp2y = curr.y;

      linePath += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${curr.x},${curr.y}`;
    }

    // Area path (same as line but closes to bottom)
    const areaPath = `${linePath} V${height} H0 Z`;

    return { linePath, areaPath };
  }, [data, width, height]);

  const endPoint = useMemo(() => {
    if (!data || data.length < 2) {
      return { x: width, y: height * 0.15 };
    }

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const padding = { top: 10, bottom: 10 };
    const chartHeight = height - padding.top - padding.bottom;

    const lastValue = data[data.length - 1];
    const y = padding.top + chartHeight - ((lastValue - min) / range) * chartHeight;

    return { x: width, y };
  }, [data, width, height]);

  return (
    <div className={cn('flex-shrink-0', className)}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
      >
        <defs>
          <linearGradient id="sparklineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <path
          d={areaPath}
          fill="url(#sparklineGradient)"
          className="transition-all duration-1000"
        />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="#10b981"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="transition-all duration-1000"
          style={{
            strokeDasharray: 300,
            strokeDashoffset: 0,
            animation: 'sparkline-draw 1.5s ease-out forwards',
          }}
        />

        {/* End dot */}
        <circle
          cx={endPoint.x}
          cy={endPoint.y}
          r="4"
          fill="#10b981"
          className="animate-pulse"
        />
      </svg>
      <p className="text-white/30 text-xs text-right mt-1">6 month trend</p>

      <style>{`
        @keyframes sparkline-draw {
          from {
            stroke-dashoffset: 300;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}
