import { Check, Lock } from 'lucide-react';
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
      <div className="mt-5 p-4 rounded-2xl bg-muted/15 border border-border/8">
        <div className="flex items-center gap-3 text-muted-foreground/50">
          <Lock className="h-4 w-4" />
          <span className="text-[13px]">Enter your initials above to acknowledge sections</span>
        </div>
      </div>
    );
  }

  // Completed state - calm, confident
  if (isAcknowledged) {
    return (
      <div 
        className="mt-5 p-4 rounded-2xl border transition-all duration-300"
        style={{ 
          background: 'linear-gradient(180deg, rgba(236, 253, 245, 0.5) 0%, rgba(236, 253, 245, 0.3) 100%)',
          borderColor: 'rgba(167, 243, 208, 0.4)'
        }}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(16, 185, 129, 0.12)' }}
            >
              <Check className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-emerald-800/80">Section reviewed and confirmed</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-semibold text-emerald-700/70 tracking-wide">{initials}</span>
            </div>
            {acknowledgedAt && (
              <p className="text-[10px] text-emerald-600/50 mt-0.5">
                {format(new Date(acknowledgedAt), 'MMM d, yyyy')}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Needs acknowledgment state - quiet, guiding
  return (
    <div 
      id={`ack-section-${sectionId}`}
      className={cn(
        "mt-5 p-4 rounded-2xl border transition-all duration-300",
        hasValidationError 
          ? "border-rose-200/60" 
          : "border-amber-200/40"
      )}
      style={{ 
        background: hasValidationError 
          ? 'linear-gradient(180deg, rgba(255, 251, 250, 0.6) 0%, rgba(254, 249, 248, 0.4) 100%)'
          : 'linear-gradient(180deg, rgba(255, 251, 245, 0.5) 0%, rgba(254, 252, 247, 0.3) 100%)',
        animation: hasValidationError ? 'fade-in 0.3s ease-out' : undefined
      }}
    >
      <label className="flex items-start gap-3.5 cursor-pointer group">
        <Checkbox
          id={`ack-${sectionId}`}
          checked={false}
          onCheckedChange={onAcknowledge}
          className={cn(
            "mt-0.5 transition-colors duration-200",
            hasValidationError 
              ? "border-rose-300/70 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              : "border-amber-300/60 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          )}
        />
        <div className="flex-1">
          <p className={cn(
            "text-[13px] font-medium transition-colors duration-200 group-hover:text-foreground",
            hasValidationError ? "text-rose-700/80" : "text-foreground/70"
          )}>
            {hasValidationError 
              ? "Please confirm this section to continue"
              : "I confirm I have reviewed and completed this section"
            }
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[11px] text-muted-foreground/40">Initials:</span>
            <span className="text-[12px] font-semibold text-foreground/50 tracking-wide">{initials}</span>
            <span className="text-muted-foreground/20">·</span>
            <span className="text-[11px] text-muted-foreground/40">
              {format(new Date(), 'MMM d, yyyy')}
            </span>
          </div>
        </div>
      </label>
    </div>
  );
}
