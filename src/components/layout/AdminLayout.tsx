import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { UserAvatarDropdown } from '@/components/UserAvatarDropdown';
import { cn } from '@/lib/utils';

type MaxWidth = 'narrow' | 'default' | 'wide';

interface AdminLayoutProps {
  children: ReactNode;
  /** Content max width: narrow (3xl), default (6xl), wide (7xl) */
  maxWidth?: MaxWidth;
  /** Additional className for main content area */
  className?: string;
  /** Show back button (defaults to true) */
  showBackButton?: boolean;
  /** Label for back button */
  backLabel?: string;
  /** Custom back navigation handler */
  onBack?: () => void;
}

const MAX_WIDTH_CLASSES: Record<MaxWidth, string> = {
  narrow: 'max-w-3xl',
  default: 'max-w-6xl',
  wide: 'max-w-7xl',
};

export function AdminLayout({
  children,
  maxWidth = 'default',
  className,
  showBackButton = true,
  backLabel = 'Dashboard',
  onBack,
}: AdminLayoutProps) {

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]">
      {/* Header */}
      <header className="border-b border-[#e8e4dd] bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          {/* Left: TIG | Agent Portal - links to admin dashboard */}
          <Link to="/admin" className="flex items-center gap-2">
            <span className="text-lg font-semibold text-[#292524]">TIG</span>
            <span className="text-[#5c5552]">|</span>
            <span className="text-sm text-[#5c5552]">Agent Portal</span>
          </Link>

          {/* Right: Avatar Dropdown */}
          <UserAvatarDropdown />
        </div>
      </header>

      {/* Back Link */}
      {showBackButton && (
        <div className="max-w-5xl mx-auto px-6 pt-6">
          {onBack ? (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to {backLabel}
            </button>
          ) : (
            <Link
              to="/admin"
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to {backLabel}
            </Link>
          )}
        </div>
      )}

      {/* Page Content */}
      <main className={cn('mx-auto px-6 py-8', MAX_WIDTH_CLASSES[maxWidth], className)}>
        {children}
      </main>

      {/* Footer */}
      <footer className="py-8 text-center">
        <p className="text-xs text-[#5c5552]/50">Powered by Tyler Insurance Group</p>
      </footer>
    </div>
  );
}
