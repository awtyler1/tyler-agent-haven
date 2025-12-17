import { cn } from '@/lib/utils';

interface SectionError {
  sectionId: string;
  sectionName: string;
  isValid: boolean;
  needsAcknowledgment: boolean;
}

interface ValidationBannerProps {
  show: boolean;
  sectionErrors?: Record<string, SectionError>;
  onSectionClick?: (sectionId: string) => void;
  message?: string;
  className?: string;
}

export function ValidationBanner({ 
  show, 
  sectionErrors,
  onSectionClick,
  message,
  className 
}: ValidationBannerProps) {
  if (!show) return null;

  const invalidSections = sectionErrors 
    ? Object.values(sectionErrors).filter(s => !s.isValid)
    : [];

  // Show banner with message even if no sectionErrors provided
  const displayMessage = message || 'Please review the highlighted fields below to continue.';

  return (
    <div 
      className={cn(
        "transition-all duration-500 ease-out",
        className
      )}
      style={{ animation: 'fade-in 0.3s ease-out' }}
    >
      <div 
        className="rounded-xl px-4 py-3 border border-rose-200/50"
        style={{ 
          background: 'linear-gradient(180deg, rgba(255, 251, 250, 0.97) 0%, rgba(254, 249, 248, 0.97) 100%)',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.03)'
        }}
      >
        <p className="text-[13px] text-rose-800/70 leading-relaxed font-medium">
          {displayMessage}
        </p>
        {onSectionClick && invalidSections.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {invalidSections.map((section) => (
              <button
                key={section.sectionId}
                onClick={() => onSectionClick(section.sectionId)}
                className="text-[11px] px-3 py-1.5 rounded-full bg-rose-100/50 text-rose-600/80 hover:bg-rose-100/80 hover:text-rose-700 transition-all duration-200 font-medium"
              >
                {section.sectionName}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
