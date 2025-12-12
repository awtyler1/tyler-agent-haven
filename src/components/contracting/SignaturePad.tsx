import { useRef, useEffect, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Eraser, Check } from 'lucide-react';

interface SignaturePadProps {
  value?: string; // base64 image data
  onChange: (signature: string | null) => void;
  disabled?: boolean;
}

export function SignaturePad({ value, onChange, disabled }: SignaturePadProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    // Load existing signature if available
    if (value && sigCanvas.current) {
      sigCanvas.current.fromDataURL(value);
      setIsEmpty(false);
    }
  }, []);

  const handleClear = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
      setIsEmpty(true);
      onChange(null);
    }
  };

  const handleEnd = () => {
    if (sigCanvas.current) {
      const dataUrl = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
      setIsEmpty(sigCanvas.current.isEmpty());
      onChange(dataUrl);
    }
  };

  return (
    <div className="space-y-3">
      <div 
        className={`relative rounded-xl border-2 border-dashed ${
          disabled ? 'bg-muted/30 border-muted' : 'bg-white border-border/50 hover:border-primary/30'
        } transition-colors`}
      >
        <SignatureCanvas
          ref={sigCanvas}
          canvasProps={{
            className: 'w-full h-32 rounded-xl',
            style: { 
              touchAction: 'none',
              pointerEvents: disabled ? 'none' : 'auto',
            }
          }}
          backgroundColor="transparent"
          penColor="#1a1a1a"
          onEnd={handleEnd}
        />
        {isEmpty && !disabled && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-sm text-muted-foreground/50">Sign here with your mouse or finger</span>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClear}
          disabled={disabled || isEmpty}
          className="rounded-lg"
        >
          <Eraser className="h-4 w-4 mr-1.5" />
          Clear
        </Button>
        {!isEmpty && (
          <span className="text-xs text-emerald-600 flex items-center gap-1">
            <Check className="h-3 w-3" />
            Signature captured
          </span>
        )}
      </div>
    </div>
  );
}
