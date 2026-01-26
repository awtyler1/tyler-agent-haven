import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { UserAvatarDropdown } from '@/components/UserAvatarDropdown';
import { useNavigationContext } from '@/hooks/useNavigationContext';
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
  const { homePath, isDualRole, viewMode, toggleMode, backToDashboard } = useNavigationContext();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3] dark:from-black dark:via-black dark:to-black">
      {/* Header */}
      <header className="border-b border-[#e8e4dd] bg-white/80 backdrop-blur-sm sticky top-0 z-40 dark:border-[#38383A] dark:bg-black/90">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          {/* Left: TIG | Agent Portal - links to current mode's dashboard */}
          <div className="flex items-center gap-3">
            <Link to={homePath} className="flex items-center gap-2">
              <span className="text-lg font-semibold text-[#292524] dark:text-white">TIG</span>
              <span className="text-[#5c5552] dark:text-[#8E8E93]">|</span>
              <span className="text-sm text-[#5c5552] dark:text-[#8E8E93]">Agent Portal</span>
            </Link>
            {/* Mode indicator for dual-role users - clickable to toggle */}
            {isDualRole && (
              <button
                onClick={toggleMode}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer hover:opacity-80",
                  viewMode === 'admin'
                    ? 'bg-purple-100 text-purple-700 dark:bg-[#BF5AF2]/20 dark:text-[#BF5AF2]'
                    : 'bg-green-100 text-green-700 dark:bg-[#30D158]/20 dark:text-[#30D158]'
                )}
                title={`Click to switch to ${viewMode === 'admin' ? 'Agent' : 'Admin'} View`}
              >
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  viewMode === 'admin' ? 'bg-purple-500 dark:bg-[#BF5AF2]' : 'bg-green-500 dark:bg-[#30D158]'
                )} />
                {viewMode === 'admin' ? 'Admin View' : 'Agent View'}
              </button>
            )}
          </div>

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
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 dark:text-[#0A84FF] dark:hover:text-[#409CFF]"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to {backLabel}
            </button>
          ) : (
            <Link
              to={homePath}
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 dark:text-[#0A84FF] dark:hover:text-[#409CFF]"
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
      <footer className="py-8 text-center dark:border-t dark:border-[#38383A]">
        <p className="text-xs text-[#5c5552]/50 dark:text-[#8E8E93]/50">Powered by Tyler Insurance Group</p>
      </footer>
    </div>
  );
}
