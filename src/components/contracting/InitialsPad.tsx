import { useRef, useEffect, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Eraser, Check, PenLine } from 'lucide-react';

interface InitialsPadProps {
  value?: string; // base64 image data
  onChange: (initials: string | null) => void;
  disabled?: boolean;
}

export function InitialsPad({ value, onChange, disabled }: InitialsPadProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    // Load existing initials if available
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
    <div className="space-y-4">
      {/* Instructions */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <PenLine className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Draw your initials below</p>
          <p className="text-xs text-muted-foreground/70">Use your mouse, trackpad, or finger to draw</p>
        </div>
      </div>

      {/* Drawing area */}
      <div 
        className={`relative rounded-2xl border-2 border-dashed ${
          disabled ? 'bg-muted/30 border-muted' : 'bg-white border-primary/30 hover:border-primary/50'
        } transition-colors overflow-hidden`}
      >
        <SignatureCanvas
          ref={sigCanvas}
          canvasProps={{
            className: 'w-full h-28 rounded-2xl',
            style: { 
              touchAction: 'none',
              pointerEvents: disabled ? 'none' : 'auto',
            }
          }}
          backgroundColor="transparent"
          penColor="#1a1a1a"
          minWidth={2}
          maxWidth={4}
          onEnd={handleEnd}
        />
        {isEmpty && !disabled && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <span className="text-2xl font-light text-muted-foreground/30">ABC</span>
              <p className="text-xs text-muted-foreground/40 mt-1">Draw your initials here</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClear}
          disabled={disabled || isEmpty}
          className="rounded-xl"
        >
          <Eraser className="h-4 w-4 mr-1.5" />
          Clear & Redraw
        </Button>
        {!isEmpty && (
          <span className="text-sm text-emerald-600 flex items-center gap-1.5 font-medium">
            <Check className="h-4 w-4" />
            Initials captured
          </span>
        )}
      </div>
    </div>
  );
}
