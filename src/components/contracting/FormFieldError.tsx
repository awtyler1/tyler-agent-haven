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
      "text-[10px] text-destructive mt-1 animate-fade-in",
      className
    )}>
      {error}
    </p>
  );
}

// Helper to get error border class
export function getFieldErrorClass(hasError: boolean, showErrors: boolean): string {
  if (!hasError || !showErrors) return '';
  return 'border-destructive focus:border-destructive focus:ring-destructive/20';
}
