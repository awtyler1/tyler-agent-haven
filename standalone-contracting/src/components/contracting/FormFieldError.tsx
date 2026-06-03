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
      "text-[11px] text-amber-600 mt-1.5 leading-relaxed transition-all duration-300 ease-out",
      "animate-[fade-in_0.2s_ease-out]",
      className
    )}>
      {error}
    </p>
  );
}

// Refined error border class - soft amber that feels refined, not alarming
export function getFieldErrorClass(hasError: boolean, showErrors: boolean): string {
  if (!hasError || !showErrors) return '';
  return 'border-amber-400 focus:border-amber-400 focus:ring-amber-400/20 transition-all duration-300';
}

// Helper for select triggers with error state
export function getSelectErrorClass(hasError: boolean, showErrors: boolean): string {
  if (!hasError || !showErrors) return '';
  return 'border-amber-400 transition-all duration-300';
}

