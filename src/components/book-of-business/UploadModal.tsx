import { useState, useRef, DragEvent, useEffect } from 'react';
import { Upload, CheckCircle2, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import {
  detectCarrierFromFile,
  checkFileTypeMatch,
  getExpectedFileType,
  SupportedCarrier,
} from '@/lib/carrier-detection';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { useUpload } from '@/contexts/UploadContext';
import { UploadProgressAnimated } from './UploadProgressAnimated';

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
  onSuccess: (stats?: UploadStats, uploadId?: string, carrierId?: string) => void;
  profileId: string;
  preselectedCarrier?: Carrier;
  onCarrierChange?: (carrierId: string, carrierCode: string, carrierName: string) => void;
}

type Step = 'select-carrier' | 'upload-file' | 'processing' | 'success';

type ValidationStatus = 'idle' | 'detecting' | 'mismatch' | 'undetected' | 'ready';

const SUPPORTED_CARRIERS = ['humana', 'aetna', 'anthem', 'wellcare'];

const CARRIER_COLORS: Record<string, string> = {
  humana: 'text-green-600 bg-green-100',
  aetna: 'text-blue-600 bg-blue-100',
  anthem: 'text-indigo-600 bg-indigo-100',
  wellcare: 'text-purple-600 bg-purple-100',
};

const CARRIER_NAMES: Record<string, string> = {
  aetna: 'Aetna',
  humana: 'Humana',
  wellcare: 'Wellcare',
  anthem: 'Anthem',
};

export function UploadModal({
  isOpen,
  onClose,
  onSuccess,
  profileId,
  preselectedCarrier,
  onCarrierChange,
}: UploadModalProps) {
  const [step, setStep] = useState<Step>('select-carrier');
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loadingCarriers, setLoadingCarriers] = useState(true);
  const [selectedCarrier, setSelectedCarrier] = useState<Carrier | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [stats, setStats] = useState<UploadStats | null>(null);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalSessionRef = useRef<string | null>(null);

  // Upload context for background persistence
  const { startUpload, getUpload } = useUpload();
  const [currentUploadId, setCurrentUploadId] = useState<string | null>(null);
  const currentUpload = currentUploadId ? getUpload(currentUploadId) : null;

  // Validation state
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>('idle');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [detectedCarrier, setDetectedCarrier] = useState<SupportedCarrier | null>(null);
  const [detectedCarrierName, setDetectedCarrierName] = useState<string>('');
  const [autoUploadPending, setAutoUploadPending] = useState(false);


  // Reset state when modal opens (not when carrier changes while open)
  useEffect(() => {
    if (isOpen) {
      // Generate a session ID when modal opens
      const sessionId = `${Date.now()}`;

      // Only reset if this is a new session (modal just opened)
      if (modalSessionRef.current !== sessionId) {
        modalSessionRef.current = sessionId;

        if (preselectedCarrier) {
          setStep('upload-file');
          setSelectedCarrier(preselectedCarrier);
        } else {
          setStep('select-carrier');
          setSelectedCarrier(null);
        }
        setSelectedFile(null);
        setStats(null);
        setUploadId(null);
        setError(null);
        setValidationStatus('idle');
        setPendingFile(null);
        setDetectedCarrier(null);
        setDetectedCarrierName('');
        setCurrentUploadId(null);
      }
    } else {
      // Clear session when modal closes
      modalSessionRef.current = null;
    }
  }, [isOpen]); // Only depend on isOpen, not preselectedCarrier

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
      handleFileSelected(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const validateBasicFile = (file: File): boolean => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'csv' && ext !== 'xlsx') {
      setError('Please upload a CSV or Excel file');
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be under 10MB');
      return false;
    }
    return true;
  };

  const handleFileSelected = async (file: File) => {
    // Basic validation first
    if (!validateBasicFile(file)) {
      return;
    }

    // If no preselected carrier (using carrier selection), skip detection
    if (!preselectedCarrier) {
      setSelectedFile(file);
      setError(null);
      return;
    }

    // Start detection process
    setValidationStatus('detecting');
    setPendingFile(file);
    setError(null);

    // Check file type first
    const carrierCode = preselectedCarrier.code.toLowerCase() as SupportedCarrier;
    const fileTypeOk = checkFileTypeMatch(file, carrierCode);
    if (!fileTypeOk) {
      const expected = getExpectedFileType(carrierCode);
      setError(`${preselectedCarrier.name} reports use ${expected} format. Please upload the correct file type.`);
      setValidationStatus('idle');
      setPendingFile(null);
      return;
    }

    // Detect carrier from file
    const detection = await detectCarrierFromFile(file);

    if (detection.detected && detection.carrier) {
      // Carrier detected
      if (detection.carrier.toLowerCase() === carrierCode) {
        // Match! Proceed normally
        setValidationStatus('ready');
        setSelectedFile(file);
        setPendingFile(null);
      } else {
        // Mismatch - show dialog
        setDetectedCarrier(detection.carrier);
        setDetectedCarrierName(CARRIER_NAMES[detection.carrier] || detection.carrier);
        setValidationStatus('mismatch');
      }
    } else {
      // Could not detect - ask for confirmation
      setValidationStatus('undetected');
    }
  };

  const handleUploadToDetected = () => {
    if (!pendingFile || !detectedCarrier) return;

    // Find the carrier from our list
    const carrier = carriers.find(
      (c) => c.code.toLowerCase() === detectedCarrier.toLowerCase()
    );

    if (carrier && onCarrierChange) {
      // Notify parent to change carrier
      onCarrierChange(carrier.id, carrier.code, carrier.name);
    }

    // Set file and carrier, then flag for auto-upload
    setSelectedFile(pendingFile);
    setSelectedCarrier(carrier || null);
    setValidationStatus('ready');
    setPendingFile(null);
    setAutoUploadPending(true);
  };

  const handleProceedWithUndetected = () => {
    if (!pendingFile) return;
    setSelectedFile(pendingFile);
    setValidationStatus('ready');
    setPendingFile(null);
  };

  const handleCloseValidationDialog = () => {
    setValidationStatus('idle');
    setPendingFile(null);
    setDetectedCarrier(null);
    setDetectedCarrierName('');
  };

  const handleUpload = () => {
    if (!selectedFile || !selectedCarrier) return;

    setStep('processing');
    setError(null);

    const uploadContextId = startUpload({
      file: selectedFile,
      carrierId: selectedCarrier.id,
      carrierCode: selectedCarrier.code,
      carrierName: selectedCarrier.name,
      profileId,
      onComplete: (upload) => {
        setStats(upload.stats || null);
        setUploadId(upload.uploadId || null);
        setStep('success');
      },
    });

    setCurrentUploadId(uploadContextId);
  };

  const handleDone = () => {
    const carrierId = selectedCarrier?.id || preselectedCarrier?.id || '';
    onSuccess(stats ?? undefined, uploadId ?? undefined, carrierId);
    onClose();
  };

  const handleUploadAnother = () => {
    // Save the current upload data BEFORE resetting
    if (stats) {
      const carrierId = selectedCarrier?.id || preselectedCarrier?.id || '';
      onSuccess(stats, uploadId ?? undefined, carrierId);
    }

    // Now reset for next upload
    setStep('select-carrier');
    setSelectedCarrier(null);
    setSelectedFile(null);
    setStats(null);
    setUploadId(null);
    setError(null);
    setValidationStatus('idle');
    setCurrentUploadId(null);
  };

  // Auto-upload when mismatch is resolved by selecting detected carrier
  useEffect(() => {
    if (autoUploadPending && selectedFile && selectedCarrier) {
      setAutoUploadPending(false);
      handleUpload();
    }
  }, [autoUploadPending, selectedFile, selectedCarrier]);

  const canUpload = selectedCarrier && selectedFile;
  const isDetecting = validationStatus === 'detecting';

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-lg p-0 gap-0">
          {step === 'processing' && currentUpload ? (
            // Processing state - animated progress
            <div className="px-6">
              <VisuallyHidden>
                <DialogTitle>Uploading {selectedCarrier?.name} report</DialogTitle>
                <DialogDescription>Please wait while we process your file</DialogDescription>
              </VisuallyHidden>
              <UploadProgressAnimated
                status={currentUpload.status}
                progress={currentUpload.progress}
                fileName={currentUpload.fileName}
                carrierName={currentUpload.carrierName}
                stats={currentUpload.stats}
              />
            </div>
          ) : step === 'success' ? (
            // Success state
            <div className="px-6 py-12 text-center bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background">
              <VisuallyHidden>
                <DialogTitle>Upload complete</DialogTitle>
                <DialogDescription>{selectedCarrier?.name} report has been uploaded successfully</DialogDescription>
              </VisuallyHidden>
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
                <DialogTitle>
                  {preselectedCarrier
                    ? `Upload ${preselectedCarrier.name} Report`
                    : 'Upload Production Report'}
                </DialogTitle>
              </DialogHeader>

              <div className="px-6 py-6">
                {/* Only show carrier selection if no preselected carrier */}
                {!preselectedCarrier && (
                  <>
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
                  </>
                )}

                {/* File Drop Zone with Inline Feedback */}
                <div className="space-y-4">
                  {/* Drop zone */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => !isDetecting && fileInputRef.current?.click()}
                    className={cn(
                      'border-2 border-dashed rounded-xl p-8 text-center transition-all',
                      isDetecting ? 'cursor-wait' : 'cursor-pointer',
                      validationStatus === 'mismatch' || validationStatus === 'undetected'
                        ? 'border-amber-300 bg-amber-50/50 dark:border-amber-700 dark:bg-amber-950/20'
                        : isDragging
                          ? 'border-primary bg-primary/5'
                          : error
                            ? 'border-red-300 bg-red-50/50 dark:border-red-700 dark:bg-red-950/20'
                            : 'border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30'
                    )}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".csv,.xlsx"
                      className="hidden"
                      disabled={isDetecting}
                    />

                    {isDetecting ? (
                      <div className="flex flex-col items-center justify-center gap-2 py-2">
                        <Loader2 className="w-10 h-10 animate-spin text-stone-400" />
                        <p className="text-sm text-stone-500 dark:text-stone-400">
                          Checking file...
                        </p>
                      </div>
                    ) : pendingFile ? (
                      // Show the file that's pending validation
                      <>
                        <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <p className="text-sm font-medium text-foreground">{pendingFile.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {(pendingFile.size / 1024).toFixed(1)} KB
                        </p>
                      </>
                    ) : selectedFile ? (
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
                        <p className="text-xs text-muted-foreground/60 mt-3">
                          {preselectedCarrier?.code.toLowerCase() === 'humana' ? '.xlsx only' : '.csv or .xlsx'}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Inline Feedback - Carrier Mismatch */}
                  {validationStatus === 'mismatch' && detectedCarrierName && (
                    <InlineAlert
                      variant="warning"
                      title={`This is a ${detectedCarrierName} file`}
                      message={`You're uploading to ${preselectedCarrier?.name}. Would you like to upload this to ${detectedCarrierName} instead?`}
                      action={{
                        label: `Upload to ${detectedCarrierName}`,
                        onClick: handleUploadToDetected,
                      }}
                      secondaryAction={{
                        label: 'Choose different file',
                        onClick: handleCloseValidationDialog,
                      }}
                    />
                  )}

                  {/* Inline Feedback - Detection Failed */}
                  {validationStatus === 'undetected' && (
                    <InlineAlert
                      variant="info"
                      title="Confirm your file"
                      message={`We couldn't automatically detect the carrier. Please confirm this is a ${preselectedCarrier?.name} production report.`}
                      action={{
                        label: `Yes, upload to ${preselectedCarrier?.name}`,
                        onClick: handleProceedWithUndetected,
                      }}
                      secondaryAction={{
                        label: 'Choose different file',
                        onClick: handleCloseValidationDialog,
                      }}
                    />
                  )}

                  {/* Inline Feedback - File Type Error */}
                  {error && (
                    <InlineAlert
                      variant="error"
                      message={error}
                      action={{
                        label: 'Try again',
                        onClick: () => {
                          setError(null);
                          fileInputRef.current?.click();
                        },
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-muted/30 border-t border-border/50 flex justify-end gap-3">
                <Button variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleUpload} disabled={!canUpload || isDetecting}>
                  Upload
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
