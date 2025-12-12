import { Check, AlertCircle, Lock } from 'lucide-react';
import { SectionStatus } from './ContractingForm';
import { cn } from '@/lib/utils';

interface SectionNavProps {
  sections: { id: string; name: string; requiresAcknowledgment: boolean }[];
  sectionStatuses: Record<string, SectionStatus>;
  initialsEntered: boolean;
  onSectionClick: (sectionId: string) => void;
}

export function SectionNav({ sections, sectionStatuses, initialsEntered, onSectionClick }: SectionNavProps) {
  return (
    <nav className="sticky top-[57px] z-40 bg-white/80 backdrop-blur-sm border-b border-border/10">
      <div className="container max-w-5xl mx-auto px-4">
        <div className="flex items-center gap-1 py-2 overflow-x-auto scrollbar-hide">
          {sections.map((section, index) => {
            const status = sectionStatuses[section.id];
            const isCompleted = status?.acknowledged;
            const hasErrors = status?.hasErrors;
            const isDisabled = section.id !== 'initials' && !initialsEntered;

            return (
              <button
                key={section.id}
                onClick={() => onSectionClick(section.id)}
                disabled={isDisabled}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap",
                  isDisabled 
                    ? "opacity-40 cursor-not-allowed text-muted-foreground/60"
                    : isCompleted
                      ? "bg-primary/10 text-primary"
                      : hasErrors
                        ? "bg-destructive/10 text-destructive"
                        : "hover:bg-secondary/50 text-muted-foreground hover:text-foreground"
                )}
              >
                {/* Status indicator */}
                {isCompleted ? (
                  <Check className="h-3 w-3" />
                ) : hasErrors ? (
                  <AlertCircle className="h-3 w-3" />
                ) : isDisabled ? (
                  <Lock className="h-2.5 w-2.5" />
                ) : (
                  <span className="w-4 h-4 rounded-full border border-current/30 flex items-center justify-center text-[10px]">
                    {index + 1}
                  </span>
                )}
                <span className="hidden sm:inline">{section.name}</span>
                <span className="sm:hidden">{index + 1}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
