import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ContractingApplication, US_STATES } from '@/types/contracting';
import { FileText, Upload, CheckCircle2, Loader2, X } from 'lucide-react';
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
        "relative group flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-200 cursor-pointer min-h-[140px]",
        // Uploaded state
        isUploaded && "bg-emerald-50/50 border-emerald-200 cursor-default",
        // Uploading state
        isUploading && "bg-primary/5 border-primary/30 cursor-wait",
        // Dragging state
        isDragging && "bg-primary/10 border-primary border-dashed scale-[1.02]",
        // Error state
        hasError && !isUploaded && "border-rose-300 bg-rose-50/30",
        // Default empty state
        !isUploaded && !isUploading && !isDragging && !hasError && "border-dashed border-border/40 hover:border-primary/40 hover:bg-primary/5",
        // Required vs optional visual weight
        !isUploaded && !isRequired && "opacity-80"
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
        "w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors",
        isUploaded && "bg-emerald-100",
        isUploading && "bg-primary/10",
        !isUploaded && !isUploading && "bg-muted/30 group-hover:bg-primary/10"
      )}>
        {isUploading ? (
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
        ) : isUploaded ? (
          <CheckCircle2 className="h-6 w-6 text-emerald-600" />
        ) : (
          <FileText className={cn(
            "h-6 w-6 transition-colors",
            hasError ? "text-rose-400" : "text-muted-foreground/50 group-hover:text-primary/70"
          )} />
        )}
      </div>

      {/* Label */}
      <span className={cn(
        "text-sm font-medium text-center transition-colors",
        isUploaded && "text-emerald-700",
        isUploading && "text-primary",
        !isUploaded && !isUploading && hasError && "text-rose-600",
        !isUploaded && !isUploading && !hasError && "text-foreground/70 group-hover:text-foreground"
      )}>
        {label}
      </span>

      {/* Status text */}
      <span className={cn(
        "text-xs mt-1 transition-colors",
        isUploaded && "text-emerald-600/70",
        isUploading && "text-primary/70",
        !isUploaded && !isUploading && "text-muted-foreground/50"
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
  
  const optionalDocs = [
    { key: 'aml_training', label: 'AML Certificate' },
  ];

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
    <Card className="rounded-[28px] border-0 overflow-hidden" style={{ 
      background: 'linear-gradient(180deg, #FFFFFF 0%, #FEFEFE 100%)',
      boxShadow: '0px 1px 0px rgba(255, 255, 255, 0.8) inset, 0px 20px 60px rgba(0, 0, 0, 0.06)'
    }}>
      <CardHeader className="pb-2">
        <div className="flex flex-col items-center text-center pt-4">
          {/* Icon */}
          <div className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors",
            allRequiredComplete ? "bg-emerald-100" : "bg-primary/10"
          )}>
            {allRequiredComplete ? (
              <CheckCircle2 className="h-7 w-7 text-emerald-600" />
            ) : (
              <Upload className="h-7 w-7 text-primary" />
            )}
          </div>

          {/* Title */}
          <CardTitle className="text-xl font-medium">
            {allRequiredComplete ? "Documents Complete" : "Upload Documents"}
          </CardTitle>

          {/* Progress */}
          <p className="text-sm text-muted-foreground mt-1">
            {completedRequired} of {totalRequired} required
          </p>

          {/* Progress bar */}
          <div className="w-48 h-1.5 bg-muted/30 rounded-full mt-4 overflow-hidden">
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

      <CardContent className="px-6 pb-8 pt-6">
        {disabled ? (
          <div className="flex items-center justify-center p-8 rounded-xl bg-muted/20 text-muted-foreground/60">
            <span className="text-sm">Enter your initials to unlock</span>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Required Documents Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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

            {/* Optional Documents */}
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground/60 text-center">Optional</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {optionalDocs.map((doc) => (
                  <DocumentCard
                    key={doc.key}
                    label={doc.label}
                    documentType={doc.key}
                    isUploaded={!!uploadedDocs[doc.key]}
                    isRequired={false}
                    onUpload={handleUpload}
                    onRemove={onRemove}
                  />
                ))}
              </div>
            </div>

            {/* Non-Resident Licenses */}
            {nonResidentStates.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-border/10">
                <p className="text-xs text-muted-foreground/60 text-center">
                  Non-Resident Licenses
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
