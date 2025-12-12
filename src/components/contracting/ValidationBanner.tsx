import { AlertCircle, ChevronRight } from 'lucide-react';
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
  message = "Please complete the highlighted fields before continuing.",
  className 
}: ValidationBannerProps) {
  if (!show) return null;

  const invalidSections = sectionErrors 
    ? Object.values(sectionErrors).filter(s => !s.isValid)
    : [];

  // Simple banner without section details
  if (invalidSections.length === 0 || !onSectionClick) {
    return (
      <div className={cn(
        "flex items-center gap-2.5 px-4 py-2.5 rounded-xl",
        "bg-destructive/5 border border-destructive/20",
        "animate-fade-in",
        className
      )}>
        <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
        <p className="text-xs text-destructive font-medium">
          {message}
        </p>
      </div>
    );
  }

  // Detailed banner with section links
  return (
    <div 
      className={cn(
        "p-4 rounded-2xl bg-destructive/5 border border-destructive/20 animate-fade-in",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5">
          <AlertCircle className="h-4 w-4 text-destructive" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground/80 mb-2">
            Please complete the following sections
          </p>
          <div className="space-y-1.5">
            {invalidSections.map(section => (
              <button
                key={section.sectionId}
                onClick={() => onSectionClick(section.sectionId)}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-destructive/5 transition-colors group text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive/60" />
                  <span className="text-sm text-foreground/70 group-hover:text-foreground transition-colors">
                    {section.sectionName}
                  </span>
                  {section.needsAcknowledgment && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                      Needs Acknowledgment
                    </span>
                  )}
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-foreground/60 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
