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
    <div className="min-h-screen bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]">
      {/* Header */}
      <header className="bg-white/70 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between py-3 px-6">
          {/* Left: Contextual back */}
          <Link to="/admin" className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 transition-colors group">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            <span className="font-medium">Admin Dashboard</span>
          </Link>

          {/* Right: Avatar */}
          <UserAvatarDropdown />
        </div>
      </header>

      {/* Page Content */}
      <main className={cn('mx-auto px-6 py-6', MAX_WIDTH_CLASSES[maxWidth], className)}>
        {children}
      </main>

      {/* Footer */}
      <footer className="py-8 text-center">
        <p className="text-xs text-[#5c5552]/50">Powered by Tyler Insurance Group</p>
      </footer>
    </div>
  );
}
