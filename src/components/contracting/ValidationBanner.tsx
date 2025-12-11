import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ValidationBannerProps {
  show: boolean;
  message?: string;
  className?: string;
}

export function ValidationBanner({ 
  show, 
  message = "Please complete the highlighted fields before continuing.",
  className 
}: ValidationBannerProps) {
  if (!show) return null;
  
  return (
    <div className={cn(
      "flex items-center gap-2.5 px-4 py-2.5 rounded-lg",
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
