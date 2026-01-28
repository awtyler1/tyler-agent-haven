import { useState, useRef, DragEvent } from 'react';
import { Check, Upload, X, FileText, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUpload } from '@/contexts/UploadContext';
import { detectCarrierFromFile } from '@/lib/carrier-detection';

const SUPPORTED_CARRIERS = ['aetna', 'wellcare', 'humana', 'anthem'];

interface CarrierStatus {
  id: string;
  carrier_id: string;
  carrier_code: string;
  carrier_name: string;
  status: 'pending' | 'uploading' | 'complete';
  client_count: number | null;
  previous_count: number | null;
}

interface SyncCarrierGridProps {
  carriers: CarrierStatus[];
  profileId: string;
  onUploadComplete: (carrierId: string, stats: { imported: number; updated: number }, uploadId: string) => void;
  onClearClick?: (carrierId: string, carrierName: string) => void;
}

const CARRIER_COLORS: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  humana: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800', icon: 'bg-emerald-100 dark:bg-emerald-900/40' },
  aetna: { bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-700 dark:text-violet-400', border: 'border-violet-200 dark:border-violet-800', icon: 'bg-violet-100 dark:bg-violet-900/40' },
  anthem: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800', icon: 'bg-blue-100 dark:bg-blue-900/40' },
  wellcare: { bg: 'bg-sky-50 dark:bg-sky-900/20', text: 'text-sky-700 dark:text-sky-400', border: 'border-sky-200 dark:border-sky-800', icon: 'bg-sky-100 dark:bg-sky-900/40' },
};

function getCarrierStyle(code: string) {
  return CARRIER_COLORS[code.toLowerCase()] || {
    bg: 'bg-stone-50 dark:bg-stone-800',
    text: 'text-stone-700 dark:text-stone-300',
    border: 'border-stone-200 dark:border-stone-700',
    icon: 'bg-stone-100 dark:bg-stone-700',
  };
}

interface TileUploadState {
  status: 'idle' | 'detecting' | 'uploading' | 'error';
  progress: number;
  fileName?: string;
  error?: string;
}

export function SyncCarrierGrid({ carriers, profileId, onUploadComplete, onClearClick }: SyncCarrierGridProps) {
  const { startUpload } = useUpload();
  const [tileStates, setTileStates] = useState<Record<string, TileUploadState>>({});
  const [dragOver, setDragOver] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const supportedCarriers = carriers.filter(c =>
    SUPPORTED_CARRIERS.includes(c.carrier_code.toLowerCase())
  );

  // Sort: completed first, then alphabetically
  const sortedCarriers = [...supportedCarriers].sort((a, b) => {
    if (a.status === 'complete' && b.status !== 'complete') return -1;
    if (a.status !== 'complete' && b.status === 'complete') return 1;
    return a.carrier_name.localeCompare(b.carrier_name);
  });

  const updateTileState = (carrierId: string, updates: Partial<TileUploadState>) => {
    setTileStates(prev => ({
      ...prev,
      [carrierId]: { ...prev[carrierId], ...updates },
    }));
  };

  const handleFileDrop = async (carrierId: string, carrierCode: string, carrierName: string, file: File) => {
    // Validate file type
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'csv' && ext !== 'xlsx') {
      updateTileState(carrierId, { status: 'error', error: 'Use CSV or Excel file' });
      return;
    }

    // Detect carrier
    updateTileState(carrierId, { status: 'detecting', fileName: file.name, progress: 0 });

    const detection = await detectCarrierFromFile(file);

    if (detection.detected && detection.carrier) {
      if (detection.carrier.toLowerCase() !== carrierCode.toLowerCase()) {
        updateTileState(carrierId, {
          status: 'error',
          error: `This is a ${detection.carrier} file`,
          fileName: file.name,
        });
        return;
      }
    }

    // Start upload
    updateTileState(carrierId, { status: 'uploading', progress: 0, fileName: file.name });

    startUpload({
      file,
      carrierId,
      carrierCode,
      carrierName,
      profileId,
      onProgress: (progress) => {
        updateTileState(carrierId, { progress });
      },
      onComplete: (upload) => {
        updateTileState(carrierId, { status: 'idle', progress: 0 });
        onUploadComplete(carrierId, {
          imported: upload.stats?.imported || 0,
          updated: upload.stats?.updated || 0,
        }, upload.uploadId || '');
      },
      onError: (error) => {
        updateTileState(carrierId, { status: 'error', error: error.message });
      },
    });
  };

  const handleDragOver = (e: DragEvent, carrierId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(carrierId);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(null);
  };

  const handleDrop = (e: DragEvent, carrier: CarrierStatus) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(null);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileDrop(carrier.carrier_id, carrier.carrier_code, carrier.carrier_name, file);
    }
  };

  const handleFileSelect = (carrier: CarrierStatus, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileDrop(carrier.carrier_id, carrier.carrier_code, carrier.carrier_name, file);
    }
    // Reset input
    e.target.value = '';
  };

  const handleTileClick = (carrier: CarrierStatus) => {
    const tileState = tileStates[carrier.carrier_id];
    if (carrier.status === 'complete' || tileState?.status === 'uploading' || tileState?.status === 'detecting') return;

    // Clear error if clicking again
    if (tileState?.status === 'error') {
      updateTileState(carrier.carrier_id, { status: 'idle', error: undefined });
    }

    fileInputRefs.current[carrier.carrier_id]?.click();
  };

  return (
    <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
      {sortedCarriers.map((carrier) => {
        const style = getCarrierStyle(carrier.carrier_code);
        const isComplete = carrier.status === 'complete';
        const tileState = tileStates[carrier.carrier_id] || { status: 'idle', progress: 0 };
        const isUploading = tileState.status === 'uploading';
        const isDetecting = tileState.status === 'detecting';
        const hasError = tileState.status === 'error';
        const isDraggedOver = dragOver === carrier.carrier_id;

        return (
          <div
            key={carrier.carrier_id}
            onClick={() => handleTileClick(carrier)}
            onDragOver={(e) => handleDragOver(e, carrier.carrier_id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, carrier)}
            role="button"
            tabIndex={isComplete || isUploading || isDetecting ? -1 : 0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleTileClick(carrier);
              }
            }}
            className={cn(
              'group relative p-5 rounded-2xl border-2 transition-all text-left min-h-[140px]',
              isComplete
                ? `${style.bg} ${style.border}`
                : isDraggedOver
                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 scale-[1.02]'
                  : hasError
                    ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/10'
                    : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600',
              !isComplete && !isUploading && !isDetecting && 'cursor-pointer hover:shadow-md active:scale-[0.98]',
              (isUploading || isDetecting) && 'cursor-wait',
            )}
          >
            {/* Hidden file input */}
            <input
              type="file"
              ref={el => fileInputRefs.current[carrier.carrier_id] = el}
              onChange={(e) => handleFileSelect(carrier, e)}
              accept=".csv,.xlsx"
              className="hidden"
            />

            {/* Clear button for completed tiles */}
            {isComplete && onClearClick && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClearClick(carrier.carrier_id, carrier.carrier_name);
                }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 dark:bg-stone-800/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white dark:hover:bg-stone-700 hover:shadow-sm"
              >
                <X className="w-4 h-4 text-stone-500 dark:text-stone-400" />
              </button>
            )}

            {/* Uploading state */}
            {(isUploading || isDetecting) && (
              <div className="flex flex-col items-center justify-center h-full">
                {/* Progress ring */}
                <div className="relative w-12 h-12 mb-3">
                  <svg className="w-12 h-12 -rotate-90">
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      className="text-stone-200 dark:text-stone-700"
                    />
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeDasharray={126}
                      strokeDashoffset={126 - (126 * tileState.progress) / 100}
                      strokeLinecap="round"
                      className="text-blue-500 transition-all duration-300"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                      {tileState.progress}%
                    </span>
                  </div>
                </div>
                <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
                  {carrier.carrier_name}
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400 truncate max-w-full px-2">
                  {isDetecting ? 'Checking...' : 'Uploading...'}
                </p>
              </div>
            )}

            {/* Error state */}
            {hasError && !isUploading && !isDetecting && (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-3">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
                <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
                  {carrier.carrier_name}
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 text-center px-2">
                  {tileState.error}
                </p>
                <p className="text-xs text-stone-400 mt-1">Tap to retry</p>
              </div>
            )}

            {/* Complete state */}
            {isComplete && !isUploading && !isDetecting && (
              <>
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-3', style.icon)}>
                  <Check className={cn('w-6 h-6', style.text)} />
                </div>
                <p className={cn('font-semibold mb-1', style.text)}>
                  {carrier.carrier_name}
                </p>
                <p className={cn('text-sm', style.text)}>
                  {carrier.client_count} clients
                </p>
              </>
            )}

            {/* Pending state */}
            {!isComplete && !isUploading && !isDetecting && !hasError && (
              <>
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors',
                  isDraggedOver ? 'bg-blue-100 dark:bg-blue-800' : 'bg-stone-100 dark:bg-stone-800'
                )}>
                  {isDraggedOver ? (
                    <FileText className="w-6 h-6 text-blue-500" />
                  ) : (
                    <span className="font-bold text-lg text-stone-400 dark:text-stone-500">
                      {carrier.carrier_name.charAt(0)}
                    </span>
                  )}
                </div>
                <p className="font-semibold text-stone-900 dark:text-white mb-1">
                  {carrier.carrier_name}
                </p>
                <div className="flex items-center gap-1.5 text-sm text-stone-400 dark:text-stone-500">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isDraggedOver ? 'Drop file' : 'Drop or tap'}</span>
                </div>
                {carrier.previous_count && carrier.previous_count > 0 && (
                  <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
                    Last: {carrier.previous_count}
                  </p>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Helper to get stats from carriers
export function getSyncStats(carriers: CarrierStatus[]) {
  const supported = carriers.filter(c =>
    SUPPORTED_CARRIERS.includes(c.carrier_code.toLowerCase())
  );
  const completed = supported.filter(c => c.status === 'complete').length;
  const total = supported.length;
  const progress = total > 0 ? (completed / total) * 100 : 0;
  const totalClients = supported.reduce((sum, c) => sum + (c.client_count || 0), 0);

  return { completed, total, progress, totalClients };
}
