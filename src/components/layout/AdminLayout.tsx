import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { UserAvatarDropdown } from '@/components/UserAvatarDropdown';
import { cn } from '@/lib/utils';

type MaxWidth = 'narrow' | 'default' | 'wide';

interface AdminLayoutProps {
  children: ReactNode;
  /** Content max width: narrow (3xl), default (5xl), wide (6xl) */
  maxWidth?: MaxWidth;
  /** Additional className for main content area */
  className?: string;
}

const MAX_WIDTH_CLASSES: Record<MaxWidth, string> = {
  narrow: 'max-w-3xl',
  default: 'max-w-5xl',
  wide: 'max-w-6xl',
};

export function AdminLayout({
  children,
  maxWidth = 'default',
  className,
}: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/80 via-orange-50/40 to-stone-100">
      {/* Texture overlay */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.015) 1px, transparent 0)',
          backgroundSize: '20px 20px'
        }}
      />

      {/* Header */}
      <header className="bg-white/60 backdrop-blur-xl border-b border-white/80 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between py-3 px-6">
          {/* Left: Logo mark + contextual back */}
          <div className="flex items-center">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25 flex items-center justify-center mr-3">
              <span className="font-serif text-base font-bold text-white">T</span>
            </div>
            <Link to="/admin" className="flex items-center gap-1.5 text-stone-500 hover:text-stone-900 transition-colors group">
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
              <span className="font-medium">Admin Dashboard</span>
            </Link>
          </div>

          {/* Right: Avatar */}
          <UserAvatarDropdown />
        </div>
      </header>

      {/* Page Content */}
      <main className={cn('relative mx-auto px-6 py-6', MAX_WIDTH_CLASSES[maxWidth], className)}>
        {children}
      </main>

      {/* Footer */}
      <footer className="py-8 text-center">
        <p className="text-xs text-stone-400">Powered by Tyler Insurance Group</p>
      </footer>
    </div>
  );
}
