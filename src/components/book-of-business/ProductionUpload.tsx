import { useState, useRef, DragEvent, useEffect } from 'react';
import { Upload, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

interface ProductionUploadProps {
  profileId: string;
  onComplete?: () => void;
}

type Step = 'select-carrier' | 'upload-file' | 'processing' | 'success';

// Supported carrier codes for production upload
const SUPPORTED_CARRIERS = ['humana', 'aetna', 'anthem', 'wellcare'];

// Carrier brand colors for the cards
const CARRIER_COLORS: Record<string, string> = {
  humana: 'text-green-600 bg-green-100',
  aetna: 'text-purple-600 bg-purple-100',
  anthem: 'text-blue-600 bg-blue-100',
  wellcare: 'text-indigo-600 bg-indigo-100',
};

export function ProductionUpload({ profileId, onComplete }: ProductionUploadProps) {
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

  // Handle carrier selection
  const handleSelectCarrier = (carrier: Carrier) => {
    setSelectedCarrier(carrier);
    setStep('upload-file');
    setError(null);
  };

  // File handling
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

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix (e.g., "data:text/csv;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Process the upload
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
      setStep('upload-file');
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset to start another upload
  const handleReset = () => {
    setStep('select-carrier');
    setSelectedCarrier(null);
    setSelectedFile(null);
    setStats(null);
    setError(null);
  };

  // Go back to carrier selection
  const handleBack = () => {
    if (step === 'upload-file') {
      setStep('select-carrier');
      setSelectedCarrier(null);
      setSelectedFile(null);
      setError(null);
    }
  };

  // Render carrier selection step
  const renderCarrierSelection = () => (
    <div className="px-6 py-6">
      <h2 className="text-lg font-semibold text-foreground mb-2">Upload Production Report</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Select the carrier and upload your latest report. We'll handle the rest.
      </p>

      {loadingCarriers ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {carriers.map((carrier) => (
            <button
              key={carrier.id}
              onClick={() => handleSelectCarrier(carrier)}
              className={cn(
                'p-4 border rounded-xl text-center transition-all hover:border-primary/50 hover:shadow-sm',
                'focus:outline-none focus:ring-2 focus:ring-primary/20'
              )}
            >
              <div
                className={cn(
                  'w-12 h-12 mx-auto mb-2 rounded-lg flex items-center justify-center',
                  CARRIER_COLORS[carrier.code] || 'text-gray-600 bg-gray-100'
                )}
              >
                <span className="text-lg font-bold">{carrier.name.charAt(0)}</span>
              </div>
              <p className="text-sm font-medium text-foreground">{carrier.name}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // Render file upload step
  const renderFileUpload = () => (
    <div className="px-6 py-6">
      {/* Header with back button */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={handleBack}
          className="p-2 -ml-2 rounded-lg hover:bg-muted/50 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <div
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center',
            selectedCarrier && (CARRIER_COLORS[selectedCarrier.code] || 'text-gray-600 bg-gray-100')
          )}
        >
          <span className="text-lg font-bold">{selectedCarrier?.name.charAt(0)}</span>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Upload {selectedCarrier?.name} Report
          </h2>
          <p className="text-sm text-muted-foreground">CSV or Excel file from carrier portal</p>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all',
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
            <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-4" />
            <p className="text-foreground font-medium mb-1">{selectedFile.name}</p>
            <p className="text-sm text-muted-foreground">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
            <p className="text-xs text-primary mt-4 font-medium">Click to change file</p>
          </>
        ) : (
          <>
            <Upload className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-foreground font-medium mb-1">Drop your file here</p>
            <p className="text-sm text-muted-foreground">
              or <span className="text-primary font-medium">browse</span> to upload
            </p>
            <p className="text-xs text-muted-foreground/60 mt-4">Supports .csv, .xlsx</p>
          </>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-600 mt-4 text-center">{error}</p>
      )}

      {/* Upload button */}
      {selectedFile && (
        <div className="mt-6 flex justify-center">
          <Button onClick={handleUpload} className="px-8">
            Upload Report
          </Button>
        </div>
      )}
    </div>
  );

  // Render processing step
  const renderProcessing = () => (
    <div className="px-6 py-12 text-center">
      <div className="w-16 h-16 mx-auto mb-4 relative">
        <Loader2 className="w-16 h-16 text-primary animate-spin" />
      </div>
      <h2 className="text-lg font-semibold text-foreground mb-2">Processing your report...</h2>
      <p className="text-sm text-muted-foreground">Matching clients and updating your book</p>
    </div>
  );

  // Render success step
  const renderSuccess = () => (
    <div className="px-6 py-12 text-center bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background rounded-b-xl">
      <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
        <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
      </div>
      <h2 className="text-lg font-semibold text-foreground mb-2">
        {selectedCarrier?.name} report uploaded!
      </h2>
      <p className="text-sm text-muted-foreground mb-6">Your book has been updated</p>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-6">
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

      {/* Actions */}
      <div className="flex items-center justify-center gap-3">
        <Button variant="outline" onClick={handleReset}>
          Upload another
        </Button>
        <Button onClick={onComplete}>View your book</Button>
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-border/50 overflow-hidden">
      {step === 'select-carrier' && renderCarrierSelection()}
      {step === 'upload-file' && renderFileUpload()}
      {step === 'processing' && renderProcessing()}
      {step === 'success' && renderSuccess()}
    </div>
  );
}
