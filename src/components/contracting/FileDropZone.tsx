import { useRef, useState, DragEvent } from 'react';
import { Upload, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FileDropZoneProps {
  onFileSelect: (file: File) => void;
  onRemove?: () => void;
  accept?: string;
  isUploaded?: boolean;
  uploadedLabel?: string;
  defaultLabel?: string;
  className?: string;
  compact?: boolean;
}

export function FileDropZone({
  onFileSelect,
  onRemove,
  accept = '.pdf,.jpg,.jpeg,.png',
  isUploaded = false,
  uploadedLabel = 'Uploaded',
  defaultLabel = 'Upload',
  className,
  compact = false,
}: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

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
      const file = files[0];
      // Validate file type
      const acceptedTypes = accept.split(',').map(t => t.trim().toLowerCase());
      const fileExt = `.${file.name.split('.').pop()?.toLowerCase()}`;
      if (acceptedTypes.some(type => type === fileExt || type === file.type)) {
        onFileSelect(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.();
  };

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
                {defaultLabel}
              </>
            )}
          </Button>
          {isUploaded && onRemove && (
            <button
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
          variant={isUploaded ? "secondary" : "outline"}
          className={cn(
            "w-full justify-start h-9 transition-all duration-200",
            isDragging && "border-primary bg-primary/5 border-dashed border-2",
            isUploaded && "text-primary border-primary/30 pr-10"
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
              {defaultLabel}
            </>
          )}
        </Button>
        {isUploaded && onRemove && (
          <button
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