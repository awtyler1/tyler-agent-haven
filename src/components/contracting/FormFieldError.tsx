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
      "text-[10px] text-destructive mt-1 animate-fade-in leading-tight",
      className
    )}>
      {error}
    </p>
  );
}

// Helper to get error border class - soft red border style
export function getFieldErrorClass(hasError: boolean, showErrors: boolean): string {
  if (!hasError || !showErrors) return '';
  return 'border-destructive/60 focus:border-destructive focus:ring-destructive/20 bg-destructive/[0.02]';
}

// Helper for shake animation on error (optional enhancement)
export function getFieldShakeClass(hasError: boolean, showErrors: boolean): string {
  if (!hasError || !showErrors) return '';
  return 'animate-[shake_0.5s_ease-in-out]';
}

