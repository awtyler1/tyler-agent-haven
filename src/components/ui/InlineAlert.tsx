import { AlertCircle, Info, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type AlertVariant = 'info' | 'warning' | 'error' | 'success';

interface InlineAlertProps {
  variant: AlertVariant;
  title?: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const variants: Record<AlertVariant, {
  bg: string;
  border: string;
  icon: string;
  title: string;
  text: string;
  Icon: typeof AlertCircle;
}> = {
  info: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'text-blue-500',
    title: 'text-blue-900 dark:text-blue-100',
    text: 'text-blue-700 dark:text-blue-300',
    Icon: Info,
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    icon: 'text-amber-500',
    title: 'text-amber-900 dark:text-amber-100',
    text: 'text-amber-700 dark:text-amber-300',
    Icon: AlertCircle,
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-800',
    icon: 'text-red-500',
    title: 'text-red-900 dark:text-red-100',
    text: 'text-red-700 dark:text-red-300',
    Icon: XCircle,
  },
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800',
    icon: 'text-emerald-500',
    title: 'text-emerald-900 dark:text-emerald-100',
    text: 'text-emerald-700 dark:text-emerald-300',
    Icon: CheckCircle,
  },
};

export function InlineAlert({
  variant,
  title,
  message,
  action,
  secondaryAction,
  className
}: InlineAlertProps) {
  const styles = variants[variant];
  const Icon = styles.Icon;

  return (
    <div className={cn(
      'rounded-xl border p-4',
      styles.bg,
      styles.border,
      className
    )}>
      <div className="flex gap-3">
        <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', styles.icon)} />
        <div className="flex-1 min-w-0">
          {title && (
            <p className={cn('font-medium mb-1', styles.title)}>{title}</p>
          )}
          <p className={cn('text-sm', styles.text)}>{message}</p>

          {(action || secondaryAction) && (
            <div className="flex gap-3 mt-3">
              {action && (
                <button
                  onClick={action.onClick}
                  className={cn(
                    'text-sm font-medium px-3 py-1.5 rounded-lg transition-colors',
                    'bg-white dark:bg-stone-800 shadow-sm',
                    'hover:bg-stone-50 dark:hover:bg-stone-700',
                    styles.title
                  )}
                >
                  {action.label}
                </button>
              )}
              {secondaryAction && (
                <button
                  onClick={secondaryAction.onClick}
                  className={cn('text-sm font-medium', styles.text, 'hover:underline')}
                >
                  {secondaryAction.label}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
