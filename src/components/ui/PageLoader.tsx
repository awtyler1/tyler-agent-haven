import { cn } from '@/lib/utils';

interface PageLoaderProps {
  message?: string;
  className?: string;
}

export function PageLoader({ message = 'Loading...', className }: PageLoaderProps) {
  return (
    <div className={cn(
      "min-h-screen bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3] flex items-center justify-center",
      className
    )}>
      <div className="flex flex-col items-center gap-4">
        {/* TIG mark with subtle gold shimmer */}
        <div className="relative overflow-hidden rounded-2xl">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-md border border-amber-100/50 flex items-center justify-center">
            <span className="font-serif text-xl font-bold text-amber-700">T</span>
          </div>
          {/* Subtle shimmer overlay */}
          <div
            className="absolute inset-0 -translate-x-full rounded-2xl"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent)',
              animation: 'shimmer 2s ease-in-out infinite',
            }}
          />
        </div>
        <p className="text-sm text-[#8c8580] font-light">{message}</p>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
