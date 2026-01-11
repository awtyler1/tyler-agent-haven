import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ContractingApplication, US_STATES } from '@/types/contracting';
import { Upload, CheckCircle2, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentsSectionProps {
  application: ContractingApplication;
  onUpload: (file: File, documentType: string) => Promise<string | null>;
  onRemove: (documentType: string) => void;
  disabled?: boolean;
  fieldErrors?: Record<string, string>;
  showValidation?: boolean;
  onClearError?: (field: string) => void;
}

interface DocumentCardProps {
  label: string;
  documentType: string;
  isUploaded: boolean;
  isRequired?: boolean;
  onUpload: (file: File, documentType: string) => Promise<string | null>;
  onRemove: (documentType: string) => void;
  hasError?: boolean;
}

function DocumentCard({ 
  label, 
  documentType, 
  isUploaded, 
  isRequired = false,
  onUpload, 
  onRemove,
  hasError = false
}: DocumentCardProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = async (file: File) => {
    setIsUploading(true);
    try {
      await onUpload(file, documentType);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClick = () => {
    if (isUploaded || isUploading) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handleFileSelect(file);
    };
    input.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isUploaded && !isUploading) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isUploaded || isUploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(documentType);
  };

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative group flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer min-h-[100px]",
        // Uploaded state
        isUploaded && "bg-emerald-50/50 border-emerald-200 cursor-default",
        // Uploading state
        isUploading && "bg-primary/5 border-primary/30 cursor-wait",
        // Dragging state
        isDragging && "bg-primary/10 border-primary scale-[1.02] shadow-lg",
        // Error state
        hasError && !isUploaded && "border-rose-300 bg-rose-50/30",
        // Default empty state - more interactive styling
        !isUploaded && !isUploading && !isDragging && !hasError && "border-slate-200 bg-slate-50/50 hover:border-slate-400 hover:bg-white hover:shadow-md active:scale-[0.99]"
      )}
    >
      {/* Remove button for uploaded files */}
      {isUploaded && (
        <button
          onClick={handleRemove}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 text-muted-foreground hover:text-rose-500 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {/* Icon */}
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all",
        isUploaded && "bg-emerald-100",
        isUploading && "bg-primary/10",
        !isUploaded && !isUploading && "bg-slate-100 group-hover:bg-slate-200 group-hover:scale-110"
      )}>
        {isUploading ? (
          <Loader2 className="h-5 w-5 text-primary animate-spin" />
        ) : isUploaded ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
        ) : (
          <Upload className={cn(
            "h-4 w-4 transition-colors",
            hasError ? "text-rose-400" : "text-slate-500 group-hover:text-slate-700"
          )} />
        )}
      </div>

      {/* Label */}
      <span className={cn(
        "text-sm font-medium text-center transition-colors",
        isUploaded && "text-emerald-700",
        isUploading && "text-primary",
        !isUploaded && !isUploading && hasError && "text-rose-600",
        !isUploaded && !isUploading && !hasError && "text-slate-700 group-hover:text-slate-900"
      )}>
        {label}
      </span>

      {/* Status text */}
      <span className={cn(
        "text-xs transition-colors",
        isUploaded && "text-emerald-600/70",
        isUploading && "text-primary/70",
        !isUploaded && !isUploading && "text-slate-400 group-hover:text-slate-500"
      )}>
        {isUploading ? "Uploading..." : isUploaded ? "Uploaded" : "Click or drag"}
      </span>

      {/* Required indicator */}
      {isRequired && !isUploaded && (
        <span className="absolute top-2 left-2 text-[10px] font-medium text-rose-400">
          Required
        </span>
      )}
    </div>
  );
}

export function DocumentsSection({ 
  application, 
  onUpload, 
  onRemove, 
  disabled,
  fieldErrors = {},
  showValidation = false,
  onClearError
}: DocumentsSectionProps) {
  const uploadedDocs = application.uploaded_documents || {};
  const nonResidentStates = application.non_resident_states || [];
  
  // Define required documents
  const requiredDocs = [
    { key: 'insurance_license', label: 'Resident License' },
    { key: 'eo_certificate', label: 'E&O Insurance' },
    { key: 'voided_check', label: 'Voided Check' },
  ];
  
  // Removed AML Certificate - not needed

  // Calculate progress
  const completedRequired = requiredDocs.filter(doc => !!uploadedDocs[doc.key]).length;
  const totalRequired = requiredDocs.length;
  const progressPercent = (completedRequired / totalRequired) * 100;
  const allRequiredComplete = completedRequired === totalRequired;

  // Handle upload with error clearing
  const handleUpload = async (file: File, documentType: string) => {
    const result = await onUpload(file, documentType);
    if (result && onClearError) {
      onClearError(documentType);
    }
    return result;
  };

  return (
    <Card className="rounded-2xl border-0 overflow-hidden" style={{
      background: 'linear-gradient(180deg, #FFFFFF 0%, #FEFEFE 100%)',
      boxShadow: '0px 1px 0px rgba(255, 255, 255, 0.8) inset, 0px 20px 60px rgba(0, 0, 0, 0.06)'
    }}>
      <CardHeader className="pb-2 pt-4 px-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
              allRequiredComplete ? "bg-emerald-100" : "bg-primary/10"
            )}>
              {allRequiredComplete ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <Upload className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              <CardTitle className="text-base font-medium">
                {allRequiredComplete ? "Documents Complete" : "Upload Documents"}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {completedRequired} of {totalRequired} required
              </p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="w-24 h-1.5 bg-muted/30 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                allRequiredComplete ? "bg-emerald-500" : "bg-primary"
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-5 pb-5 pt-3">
        {disabled ? (
          <div className="flex items-center justify-center p-8 rounded-xl bg-muted/20 text-muted-foreground/60">
            <span className="text-sm">Enter your initials to unlock</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Required Documents Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {requiredDocs.map((doc) => (
                <DocumentCard
                  key={doc.key}
                  label={doc.label}
                  documentType={doc.key}
                  isUploaded={!!uploadedDocs[doc.key]}
                  isRequired={true}
                  onUpload={handleUpload}
                  onRemove={onRemove}
                  hasError={showValidation && !!fieldErrors[doc.key]}
                />
              ))}
            </div>


            {/* Non-Resident Licenses */}
            {nonResidentStates.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-border/10">
                <p className="text-xs text-muted-foreground/60 text-center">
                  Non-Resident Licenses
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {nonResidentStates.map((stateCode) => {
                    const stateName = US_STATES.find(s => s.code === stateCode)?.name || stateCode;
                    const documentType = `non_resident_license_${stateCode}`;
                    
                    return (
                      <DocumentCard
                        key={stateCode}
                        label={stateName}
                        documentType={documentType}
                        isUploaded={!!uploadedDocs[documentType]}
                        isRequired={false}
                        onUpload={handleUpload}
                        onRemove={onRemove}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
