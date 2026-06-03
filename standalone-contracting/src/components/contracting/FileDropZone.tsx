import { useRef, useState, DragEvent } from 'react';
import { Upload, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FileDropZoneProps {
  onFileSelect?: (file: File) => void;
  onUpload?: (file: File, documentType: string) => Promise<string | null>;
  onRemove?: () => void;
  onClearError?: (field: string) => void;
  accept?: string;
  isUploaded?: boolean;
  uploadedLabel?: string;
  defaultLabel?: string;
  className?: string;
  compact?: boolean;
  hasError?: boolean;
  // Extended props for section components
  label?: string;
  documentType?: string;
  existingFile?: string;
  required?: boolean;
  description?: string;
}

export function FileDropZone({
  onFileSelect,
  onUpload,
  onRemove,
  onClearError,
  accept = '.pdf,.jpg,.jpeg,.png',
  isUploaded: isUploadedProp,
  uploadedLabel = 'Uploaded',
  defaultLabel,
  className,
  compact = false,
  hasError = false,
  label,
  documentType,
  existingFile,
  required = false,
  description,
}: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Determine if file is uploaded
  const isUploaded = isUploadedProp ?? !!existingFile;
  const displayLabel = defaultLabel || label || 'Upload';

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

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      // Validate file type
      const acceptedTypes = accept.split(',').map(t => t.trim().toLowerCase());
      const fileExt = `.${file.name.split('.').pop()?.toLowerCase()}`;
      if (acceptedTypes.some(type => type === fileExt || type === file.type)) {
        await handleFileUpload(file);
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      await handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (onUpload && documentType) {
      setIsUploading(true);
      try {
        const result = await onUpload(file, documentType);
        // Clear the error instantly when upload succeeds
        if (result && onClearError && documentType) {
          onClearError(documentType);
        }
      } finally {
        setIsUploading(false);
      }
    } else if (onFileSelect) {
      onFileSelect(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.();
  };

  // If we have a label prop, render with label wrapper
  if (label) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center justify-between">
          <Label className="text-sm">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {isUploaded && (
            <span className="text-xs text-primary flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Uploaded
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground/60">{description}</p>
        )}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative transition-all duration-200",
            isDragging && "scale-[1.01]"
          )}
        >
          <input
            type="file"
            ref={inputRef}
            onChange={handleFileChange}
            accept={accept}
            className="hidden"
          />
          <div className="relative">
            <Button
              type="button"
              variant={isUploaded ? "secondary" : "outline"}
              className={cn(
                "w-full justify-start h-11 transition-all duration-200 rounded-xl",
                isDragging && "border-primary bg-primary/5 border-dashed border-2",
                isUploaded && "text-primary border-primary/30 pr-10",
                hasError && !isUploaded && "border-destructive focus:border-destructive"
              )}
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  Uploading...
                </>
              ) : isUploaded ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2 text-primary" />
                  {existingFile ? existingFile.split('/').pop() : uploadedLabel}
                </>
              ) : isDragging ? (
                <span className="text-primary font-medium">Drop file here</span>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Click to upload or drag & drop
                </>
              )}
            </Button>
            {isUploaded && onRemove && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                title="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative transition-all duration-200",
          isDragging && "scale-[1.02]",
          className
        )}
      >
        <input
          type="file"
          ref={inputRef}
          onChange={handleFileChange}
          accept={accept}
          className="hidden"
        />
        <div className="relative">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "h-8 text-xs w-full transition-all duration-200",
              isDragging && "border-primary bg-primary/5 border-dashed",
              isUploaded && "border-primary/30 bg-primary/5 text-primary pr-8"
            )}
            onClick={() => inputRef.current?.click()}
          >
            {isUploaded ? (
              <>
                <CheckCircle2 className="h-3 w-3 mr-1.5 text-primary" />
                {uploadedLabel}
              </>
            ) : isDragging ? (
              <span className="text-primary">Drop file here</span>
            ) : (
              <>
                <Upload className="h-3 w-3 mr-1.5" />
                {displayLabel}
              </>
            )}
          </Button>
          {isUploaded && onRemove && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              title="Remove file"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative transition-all duration-200",
        isDragging && "scale-[1.01]",
        className
      )}
    >
      <input
        type="file"
        ref={inputRef}
        onChange={handleFileChange}
        accept={accept}
        className="hidden"
      />
      <div className="relative">
        <Button
          type="button"
          variant={isUploaded ? "secondary" : "outline"}
          className={cn(
            "w-full justify-start h-9 transition-all duration-200",
            isDragging && "border-primary bg-primary/5 border-dashed border-2",
            isUploaded && "text-primary border-primary/30 pr-10",
            hasError && !isUploaded && "border-destructive focus:border-destructive"
          )}
          onClick={() => inputRef.current?.click()}
        >
          {isUploaded ? (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2 text-primary" />
              {uploadedLabel}
            </>
          ) : isDragging ? (
            <span className="text-primary font-medium">Drop file here</span>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              {displayLabel}
            </>
          )}
        </Button>
        {isUploaded && onRemove && (
          <button
            type="button"
            onClick={handleRemove}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            title="Remove file"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {!isUploaded && !isDragging && (
        <p className="text-[10px] text-muted-foreground/60 mt-1 text-center">
          or drag & drop
        </p>
      )}
    </div>
  );
}