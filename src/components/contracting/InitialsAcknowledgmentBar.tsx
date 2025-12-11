import { CheckCircle2 } from 'lucide-react';

interface InitialsAcknowledgmentBarProps {
  initials: string | null;
}

export function InitialsAcknowledgmentBar({ initials }: InitialsAcknowledgmentBarProps) {
  if (!initials) return null;

  return (
    <div 
      className="flex items-center gap-3 py-3 px-4 rounded-xl bg-muted/20 border border-border/10"
      role="status"
      aria-label={`Page acknowledged with initials ${initials}`}
    >
      <CheckCircle2 className="h-4 w-4 text-primary/50 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-muted-foreground/50 leading-relaxed">
          Page Acknowledgment · These initials confirm you've reviewed the information on this page.
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-[10px] text-muted-foreground/40 uppercase tracking-wider">Initials:</span>
        <span className="text-xs font-medium text-foreground/60 tracking-wide">{initials}</span>
      </div>
    </div>
  );
}
