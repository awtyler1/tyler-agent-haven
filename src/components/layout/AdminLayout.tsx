import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { UserAvatarDropdown } from '@/components/UserAvatarDropdown';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type MaxWidth = 'narrow' | 'default' | 'wide';

interface AdminLayoutProps {
  children: ReactNode;
  /** Show back button in header */
  showBackButton?: boolean;
  /** Custom back handler (default: navigate(-1)) */
  onBack?: () => void;
  /** Back button label */
  backLabel?: string;
  /** Content max width: narrow (3xl), default (6xl), wide (7xl) */
  maxWidth?: MaxWidth;
  /** Additional className for main content area */
  className?: string;
}

const MAX_WIDTH_CLASSES: Record<MaxWidth, string> = {
  narrow: 'max-w-3xl',
  default: 'max-w-6xl',
  wide: 'max-w-7xl',
};

export function AdminLayout({
  children,
  showBackButton = false,
  onBack,
  backLabel = 'Back',
  maxWidth = 'default',
  className,
}: AdminLayoutProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]">
      {/* Minimal Header */}
      <header className="bg-background/80 backdrop-blur-sm border-b border-border sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          {/* Left: Back button (optional) */}
          <div className="flex items-center gap-3">
            {showBackButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="gap-1.5 text-muted-foreground hover:text-foreground hover:bg-primary/10"
              >
                <ArrowLeft className="h-4 w-4" />
                {backLabel}
              </Button>
            )}
          </div>

          {/* Right: Avatar Dropdown */}
          <UserAvatarDropdown />
        </div>
      </header>

      {/* Page Content */}
      <main className={cn('mx-auto px-6 py-8', MAX_WIDTH_CLASSES[maxWidth], className)}>
        {children}
      </main>
    </div>
  );
}
