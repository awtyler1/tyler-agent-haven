import { useState, useRef, DragEvent, useEffect } from 'react';
import { Upload, CheckCircle2, ArrowLeft, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface Carrier {
  id: string;
  code: string;
  name: string;
}

interface UploadStats {
  total: number;
  imported: number;
  updated: number;
  skipped: number;
}

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  profileId: string;
}

type Step = 'select-carrier' | 'upload-file' | 'processing' | 'success';

const SUPPORTED_CARRIERS = ['humana', 'aetna', 'anthem', 'wellcare'];

const CARRIER_COLORS: Record<string, string> = {
  humana: 'text-green-600 bg-green-100',
  aetna: 'text-blue-600 bg-blue-100',
  anthem: 'text-indigo-600 bg-indigo-100',
  wellcare: 'text-purple-600 bg-purple-100',
};

export function UploadModal({ isOpen, onClose, onSuccess, profileId }: UploadModalProps) {
  const [step, setStep] = useState<Step>('select-carrier');
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loadingCarriers, setLoadingCarriers] = useState(true);
  const [selectedCarrier, setSelectedCarrier] = useState<Carrier | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState<UploadStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('select-carrier');
      setSelectedCarrier(null);
      setSelectedFile(null);
      setStats(null);
      setError(null);
    }
  }, [isOpen]);

  // Fetch supported carriers on mount
  useEffect(() => {
    async function fetchCarriers() {
      try {
        const { data, error } = await supabase
          .from('carriers')
          .select('id, code, name')
          .in('code', SUPPORTED_CARRIERS);

        if (error) throw error;
        setCarriers(data || []);
      } catch (err) {
        console.error('Failed to fetch carriers:', err);
      } finally {
        setLoadingCarriers(false);
      }
    }
    fetchCarriers();
  }, []);

  const handleSelectCarrier = (carrier: Carrier) => {
    setSelectedCarrier(carrier);
    setError(null);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'csv' && ext !== 'xlsx') {
      setError('Please upload a CSV or Excel file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be under 10MB');
      return;
    }
    setSelectedFile(file);
    setError(null);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedCarrier) return;

    setStep('processing');
    setIsProcessing(true);
    setError(null);

    try {
      const base64Content = await fileToBase64(selectedFile);

      const { data, error: fnError } = await supabase.functions.invoke('parse-production-report', {
        body: {
          file: base64Content,
          carrier_code: selectedCarrier.code,
          profile_id: profileId,
        },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      setStats(data.stats);
      setStep('success');
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
      setStep('select-carrier');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDone = () => {
    onSuccess();
    onClose();
  };

  const handleUploadAnother = () => {
    setStep('select-carrier');
    setSelectedCarrier(null);
    setSelectedFile(null);
    setStats(null);
    setError(null);
  };

  const canUpload = selectedCarrier && selectedFile;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 gap-0">
        {step === 'processing' ? (
          // Processing state - no header
          <div className="px-6 py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 relative">
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Processing your report...</h2>
            <p className="text-sm text-muted-foreground">Matching clients and updating your book</p>
          </div>
        ) : step === 'success' ? (
          // Success state
          <div className="px-6 py-12 text-center bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">
              {selectedCarrier?.name} report uploaded!
            </h2>
            <p className="text-sm text-muted-foreground mb-6">Your book has been updated</p>

            {stats && (
              <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto mb-6">
                <div className="bg-white dark:bg-card border border-border/50 rounded-lg p-3">
                  <p className="text-2xl font-semibold text-green-600">+{stats.imported}</p>
                  <p className="text-xs text-muted-foreground">New clients</p>
                </div>
                <div className="bg-white dark:bg-card border border-border/50 rounded-lg p-3">
                  <p className="text-2xl font-semibold text-foreground">{stats.updated}</p>
                  <p className="text-xs text-muted-foreground">Updated</p>
                </div>
                <div className="bg-white dark:bg-card border border-border/50 rounded-lg p-3">
                  <p className="text-2xl font-semibold text-amber-600">{stats.skipped}</p>
                  <p className="text-xs text-muted-foreground">Skipped</p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" onClick={handleUploadAnother}>
                Upload another
              </Button>
              <Button onClick={handleDone}>Done</Button>
            </div>
          </div>
        ) : (
          // Carrier selection + file upload
          <>
            <DialogHeader className="px-6 py-4 border-b border-border/50">
              <DialogTitle>Upload Production Report</DialogTitle>
            </DialogHeader>

            <div className="px-6 py-6">
              <p className="text-sm text-muted-foreground mb-4">
                Select carrier and upload your latest report
              </p>

              {/* Carrier Selection */}
              {loadingCarriers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-3 mb-6">
                  {carriers.map((carrier) => (
                    <button
                      key={carrier.id}
                      onClick={() => handleSelectCarrier(carrier)}
                      className={cn(
                        'p-3 border rounded-lg text-center transition-all',
                        selectedCarrier?.id === carrier.id
                          ? 'border-2 border-primary bg-primary/5'
                          : 'border-border hover:border-muted-foreground/30'
                      )}
                    >
                      <div
                        className={cn(
                          'w-8 h-8 mx-auto mb-1 rounded-lg flex items-center justify-center',
                          selectedCarrier?.id === carrier.id
                            ? CARRIER_COLORS[carrier.code]
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        <span className="text-sm font-bold">{carrier.name.charAt(0)}</span>
                      </div>
                      <p className="text-xs font-medium text-foreground">{carrier.name}</p>
                    </button>
                  ))}
                </div>
              )}

              {/* File Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
                  isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30'
                )}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv,.xlsx"
                  className="hidden"
                />

                {selectedFile ? (
                  <>
                    <CheckCircle2 className="w-10 h-10 mx-auto text-green-500 mb-3" />
                    <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                    <p className="text-sm font-medium text-foreground">Drop your file here</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      or <span className="text-primary">browse</span>
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-3">.csv or .xlsx</p>
                  </>
                )}
              </div>

              {error && (
                <p className="text-sm text-red-600 mt-4 text-center">{error}</p>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-muted/30 border-t border-border/50 flex justify-end gap-3">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={!canUpload || isProcessing}>
                {isProcessing ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
