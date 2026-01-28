import { useUpload } from '@/contexts/UploadContext';
import { Loader2 } from 'lucide-react';

export function GlobalUploadIndicator() {
  const { activeUploads } = useUpload();

  // Only show if there are active uploads and modal might be closed
  const inProgressUploads = activeUploads.filter(u =>
    u.status !== 'idle' && u.status !== 'complete' && u.status !== 'error'
  );

  if (inProgressUploads.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-lg border border-stone-200 dark:border-stone-700 overflow-hidden">
        {inProgressUploads.map(upload => (
          <div key={upload.id} className="px-4 py-3 flex items-center gap-3 min-w-[280px]">
            {/* Spinner */}
            <div className="relative w-8 h-8">
              <svg className="w-8 h-8 -rotate-90">
                <circle
                  cx="16"
                  cy="16"
                  r="14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-stone-200 dark:text-stone-700"
                />
                <circle
                  cx="16"
                  cy="16"
                  r="14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray={88}
                  strokeDashoffset={88 - (88 * upload.progress) / 100}
                  strokeLinecap="round"
                  className="text-blue-500 transition-all duration-500"
                />
              </svg>
              <Loader2 className="w-4 h-4 absolute inset-0 m-auto text-blue-500 animate-spin" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-stone-900 dark:text-white truncate">
                {upload.carrierName}
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400 capitalize">
                {upload.status === 'reading' && 'Reading file...'}
                {upload.status === 'processing' && 'Processing clients...'}
                {upload.status === 'saving' && 'Saving...'}
              </p>
            </div>

            {/* Progress percentage */}
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400 tabular-nums">
              {upload.progress}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
