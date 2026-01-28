import { useEffect, useState } from 'react';
import { Check, FileText, Cpu, CloudUpload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UploadStatus } from '@/contexts/UploadContext';

interface UploadProgressAnimatedProps {
  status: UploadStatus;
  progress: number;
  fileName: string;
  carrierName: string;
  stats?: {
    imported: number;
    updated: number;
  };
}

const stages = [
  { key: 'reading', label: 'Reading file', Icon: FileText },
  { key: 'processing', label: 'Processing clients', Icon: Cpu },
  { key: 'saving', label: 'Saving to your book', Icon: CloudUpload },
];

export function UploadProgressAnimated({
  status,
  progress,
  fileName,
  carrierName,
  stats,
}: UploadProgressAnimatedProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [showPulse, setShowPulse] = useState(false);

  // Smooth progress animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 50);
    return () => clearTimeout(timer);
  }, [progress]);

  // Pulse effect during processing
  useEffect(() => {
    if (status === 'processing') {
      setShowPulse(true);
      const interval = setInterval(() => {
        setShowPulse(p => !p);
      }, 1000);
      return () => clearInterval(interval);
    }
    setShowPulse(false);
  }, [status]);

  if (status === 'complete') {
    return (
      <div className="py-8 text-center animate-in fade-in-0 zoom-in-95 duration-300">
        {/* Success checkmark with animation */}
        <div className="relative w-20 h-20 mx-auto mb-4">
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full bg-emerald-100 dark:bg-emerald-900/30 animate-in zoom-in-0 duration-500" />
          {/* Inner circle */}
          <div className="absolute inset-2 rounded-full bg-emerald-500 flex items-center justify-center animate-in zoom-in-50 duration-300 delay-150">
            <Check className="w-8 h-8 text-white animate-in zoom-in-0 duration-200 delay-300" strokeWidth={3} />
          </div>
          {/* Success ripple */}
          <div className="absolute inset-0 rounded-full bg-emerald-400/30 animate-ping" style={{ animationDuration: '1s', animationIterationCount: '1' }} />
        </div>

        <h3 className="text-lg font-semibold text-stone-900 dark:text-white mb-1 animate-in slide-in-from-bottom-2 duration-300 delay-200">
          Upload complete
        </h3>
        <p className="text-stone-500 dark:text-stone-400 animate-in slide-in-from-bottom-2 duration-300 delay-300">
          {(stats?.imported || 0) + (stats?.updated || 0)} clients synced to {carrierName}
        </p>
      </div>
    );
  }

  const currentStageIndex = stages.findIndex(s => s.key === status);

  return (
    <div className="py-6 animate-in fade-in-0 duration-200">
      {/* File being processed */}
      <div className="text-center mb-6">
        <div className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm',
          'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300',
          'animate-in slide-in-from-top-2 duration-300'
        )}>
          <FileText className="w-3.5 h-3.5" />
          <span className="truncate max-w-[200px]">{fileName}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6 px-4">
        <div className="h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
          {/* Animated gradient progress */}
          <div
            className="h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden"
            style={{ width: `${animatedProgress}%` }}
          >
            {/* Base gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500" />
            {/* Shimmer effect */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              style={{
                animation: 'shimmer 1.5s infinite',
                transform: 'translateX(-100%)',
              }}
            />
          </div>
        </div>

        {/* Add shimmer keyframes via style tag */}
        <style>{`
          @keyframes shimmer {
            100% { transform: translateX(100%); }
          }
        `}</style>
      </div>

      {/* Progress stages */}
      <div className="space-y-2 px-2">
        {stages.map((stage, index) => {
          const Icon = stage.Icon;
          const isActive = stage.key === status;
          const isComplete = currentStageIndex > index;
          const isPending = currentStageIndex < index;

          return (
            <div
              key={stage.key}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300',
                isActive && 'bg-blue-50 dark:bg-blue-900/20 scale-[1.02]',
                isComplete && 'bg-emerald-50/50 dark:bg-emerald-900/10',
                isPending && 'opacity-40'
              )}
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              {/* Icon container */}
              <div className={cn(
                'w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300',
                isActive && 'bg-blue-100 dark:bg-blue-800 shadow-sm',
                isComplete && 'bg-emerald-100 dark:bg-emerald-800',
                isPending && 'bg-stone-100 dark:bg-stone-800'
              )}>
                {isComplete ? (
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                ) : (
                  <Icon className={cn(
                    'w-4 h-4 transition-all duration-300',
                    isActive && 'text-blue-600 dark:text-blue-400',
                    isActive && showPulse && 'scale-110',
                    isPending && 'text-stone-400 dark:text-stone-500'
                  )} />
                )}
              </div>

              {/* Label */}
              <div className="flex-1">
                <span className={cn(
                  'text-sm font-medium transition-colors duration-300',
                  isActive && 'text-blue-700 dark:text-blue-300',
                  isComplete && 'text-emerald-700 dark:text-emerald-300',
                  isPending && 'text-stone-400 dark:text-stone-500'
                )}>
                  {stage.label}
                </span>
                {isActive && (
                  <span className="ml-2 text-sm text-blue-500/70 dark:text-blue-400/70 animate-pulse">
                    ...
                  </span>
                )}
              </div>

              {/* Status indicator */}
              {isActive && (
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
