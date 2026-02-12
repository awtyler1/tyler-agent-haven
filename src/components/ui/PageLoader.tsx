import { cn } from '@/lib/utils';

interface PageLoaderProps {
  message?: string;
  className?: string;
}

export function PageLoader({ message = 'Loading...', className }: PageLoaderProps) {
  return (
    <div className={cn(
      "flex items-center justify-center",
      className
    )}
      style={{ background: 'var(--bg)', minHeight: '100%' }}
    >
      <div className="flex flex-col items-center gap-4">
        {/* TIG mark with subtle gold shimmer */}
        <div className="relative overflow-hidden rounded-2xl">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, var(--gold-dark), var(--gold))',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 700, color: '#fff' }}>T</span>
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
        <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 300 }}>{message}</p>
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
