import { cn } from '@/lib/utils';

interface FormFieldErrorProps {
  error?: string;
  show?: boolean;
  className?: string;
}

export function FormFieldError({ error, show = true, className }: FormFieldErrorProps) {
  if (!error || !show) return null;
  
  return (
    <p className={cn(
      "text-[11px] text-rose-600/80 mt-1.5 leading-relaxed transition-all duration-300 ease-out",
      "animate-[fade-in_0.2s_ease-out]",
      className
    )}>
      {error}
    </p>
  );
}

// Refined error border class - soft, muted rose that feels refined, not alarming
export function getFieldErrorClass(hasError: boolean, showErrors: boolean): string {
  if (!hasError || !showErrors) return '';
  return 'border-rose-300/70 focus:border-rose-400/80 focus:ring-rose-100 bg-rose-50/30 transition-all duration-300';
}

// Helper for select triggers with error state
export function getSelectErrorClass(hasError: boolean, showErrors: boolean): string {
  if (!hasError || !showErrors) return '';
  return 'border-rose-300/70 bg-rose-50/30 transition-all duration-300';
}

