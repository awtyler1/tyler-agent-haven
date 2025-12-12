import { Check, Lock, AlertCircle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { SectionStatus } from './ContractingForm';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface SectionAcknowledgmentProps {
  sectionId: string;
  sectionName: string;
  initials: string | null;
  status: SectionStatus | undefined;
  onAcknowledge: () => void;
  disabled?: boolean;
  hasValidationError?: boolean;
}

export function SectionAcknowledgment({
  sectionId,
  sectionName,
  initials,
  status,
  onAcknowledge,
  disabled,
  hasValidationError = false,
}: SectionAcknowledgmentProps) {
  const isAcknowledged = status?.acknowledged || false;
  const acknowledgedAt = status?.acknowledgedAt;

  if (disabled) {
    return (
      <div className="mt-4 p-4 rounded-xl bg-muted/20 border border-border/10 opacity-50">
        <div className="flex items-center gap-3 text-muted-foreground/60">
          <Lock className="h-4 w-4" />
          <span className="text-sm">Enter your initials above to acknowledge sections</span>
        </div>
      </div>
    );
  }

  if (isAcknowledged) {
    return (
      <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
              <Check className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground/80">Section Acknowledged</p>
              <p className="text-xs text-muted-foreground/60">
                I confirm I have reviewed and completed this section
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground/50">Initials:</span>
              <span className="text-sm font-semibold text-foreground/70 tracking-wide">{initials}</span>
            </div>
            {acknowledgedAt && (
              <p className="text-[10px] text-muted-foreground/40 mt-0.5">
                {format(new Date(acknowledgedAt), 'MMM d, yyyy · h:mm a')}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Not acknowledged - show with optional validation error state
  return (
    <div 
      id={`ack-section-${sectionId}`}
      className={cn(
        "mt-4 p-4 rounded-xl border transition-all duration-200",
        hasValidationError 
          ? "bg-destructive/5 border-destructive/30 animate-fade-in" 
          : "bg-amber-50/50 border-amber-200/30"
      )}
    >
      <label className="flex items-start gap-3 cursor-pointer group">
        <Checkbox
          id={`ack-${sectionId}`}
          checked={false}
          onCheckedChange={onAcknowledge}
          className={cn(
            "mt-0.5",
            hasValidationError 
              ? "border-destructive/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              : "border-amber-400/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          )}
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className={cn(
              "text-sm font-medium group-hover:text-foreground transition-colors",
              hasValidationError ? "text-destructive" : "text-foreground/80"
            )}>
              I confirm I have reviewed and completed this section
            </p>
            {hasValidationError && (
              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium">
                <AlertCircle className="h-2.5 w-2.5" />
                Required
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground/50">Initials:</span>
            <span className="text-sm font-semibold text-foreground/60 tracking-wide">{initials}</span>
            <span className="text-xs text-muted-foreground/40">·</span>
            <span className="text-xs text-muted-foreground/50">
              {format(new Date(), 'MMM d, yyyy')}
            </span>
          </div>
        </div>
      </label>
    </div>
  );
}
