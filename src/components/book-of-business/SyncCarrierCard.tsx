import { useRef } from 'react';
import { Upload, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SyncCarrierCardProps {
  carrier: {
    id: string;
    code: string;
    name: string;
  };
  status: 'pending' | 'uploading' | 'complete';
  clientCount?: number | null;
  previousCount?: number | null;
  onFileSelect: (file: File) => void;
}

const CARRIER_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  humana: { bg: 'bg-green-100', text: 'text-green-600', icon: 'bg-green-500' },
  aetna: { bg: 'bg-blue-100', text: 'text-blue-600', icon: 'bg-blue-500' },
  anthem: { bg: 'bg-indigo-100', text: 'text-indigo-600', icon: 'bg-indigo-500' },
  wellcare: { bg: 'bg-purple-100', text: 'text-purple-600', icon: 'bg-purple-500' },
};

export function SyncCarrierCard({
  carrier,
  status,
  clientCount,
  previousCount,
  onFileSelect,
}: SyncCarrierCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const colors = CARRIER_COLORS[carrier.code] || {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    icon: 'bg-gray-500',
  };

  const delta = clientCount != null && previousCount != null
    ? clientCount - previousCount
    : null;

  const handleClick = () => {
    if (status === 'pending') {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
      // Reset input so same file can be selected again
      e.target.value = '';
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'relative rounded-xl p-4 transition-all',
        status === 'pending' && 'bg-white border-2 border-gray-200 hover:border-primary hover:bg-primary/5 cursor-pointer',
        status === 'uploading' && 'bg-blue-50 border-2 border-blue-200',
        status === 'complete' && 'bg-green-50 border-2 border-green-200'
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex items-center justify-between">
        {/* Left: Carrier info */}
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', colors.bg)}>
            <span className={cn('text-base font-bold', colors.text)}>
              {carrier.name.charAt(0)}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900">{carrier.name}</p>
            {status === 'pending' && previousCount != null && (
              <p className="text-sm text-gray-400">Last: {previousCount} clients</p>
            )}
            {status === 'uploading' && (
              <p className="text-sm text-blue-600">Processing...</p>
            )}
            {status === 'complete' && clientCount != null && (
              <p className="text-sm text-green-600">{clientCount} clients</p>
            )}
          </div>
        </div>

        {/* Right: Action/Status */}
        <div className="flex items-center gap-2">
          {status === 'pending' && (
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
              <Upload className="w-5 h-5 text-gray-500" />
            </div>
          )}
          {status === 'uploading' && (
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            </div>
          )}
          {status === 'complete' && (
            <>
              {delta !== null && (
                <span
                  className={cn(
                    'text-sm font-medium',
                    delta >= 0 ? 'text-green-600' : 'text-amber-600'
                  )}
                >
                  {delta >= 0 ? `+${delta}` : delta}
                </span>
              )}
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600" />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
