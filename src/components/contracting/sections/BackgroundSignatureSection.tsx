import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ContractingApplication } from '@/types/contracting';
import { PenLine, Check, Lock, Trash2 } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { FormFieldError } from '../FormFieldError';

interface BackgroundSignatureSectionProps {
  application: ContractingApplication;
  onUpdate: <K extends keyof ContractingApplication>(field: K, value: ContractingApplication[K]) => void;
  disabled?: boolean;
  fieldErrors?: Record<string, string>;
  showValidation?: boolean;
  onClearError?: (field: string) => void;
}

export function BackgroundSignatureSection({ application, onUpdate, disabled, fieldErrors = {}, showValidation = false, onClearError }: BackgroundSignatureSectionProps) {
  const signatureRef = useRef<SignatureCanvas>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Get existing signature from uploaded documents
  const uploadedDocs = (application.uploaded_documents || {}) as Record<string, string>;
  const existingSignature = uploadedDocs.background_signature;

  useEffect(() => {
    if (existingSignature) {
      setIsConfirmed(true);
    }
  }, [existingSignature]);

  const handleClear = () => {
    signatureRef.current?.clear();
  };

  const handleConfirm = () => {
    if (signatureRef.current && !signatureRef.current.isEmpty()) {
      const signatureImage = signatureRef.current.toDataURL('image/png');
      const now = new Date().toISOString();
      
      // Save signature image to uploaded documents
      const currentDocs = (application.uploaded_documents || {}) as Record<string, string>;
      onUpdate('uploaded_documents', { 
        ...currentDocs, 
        background_signature: signatureImage,
        background_signature_date: now
      });
      
      // Clear validation error instantly
      onClearError?.('background_signature');
      
      setIsConfirmed(true);
    }
  };

  const handleRedraw = () => {
    setIsConfirmed(false);
    const currentDocs = (application.uploaded_documents || {}) as Record<string, string>;
    const { background_signature, background_signature_date, ...rest } = currentDocs;
    onUpdate('uploaded_documents', rest);
  };

  if (isConfirmed && existingSignature) {
    return (
      <Card 
        className="rounded-[28px] border-0 overflow-hidden mt-4"
        style={{ 
          background: 'linear-gradient(180deg, #FFFFFF 0%, #FEFEFE 100%)',
          boxShadow: '0px 1px 0px rgba(255, 255, 255, 0.8) inset, 0px 20px 60px rgba(0, 0, 0, 0.06)'
        }}
      >
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Check className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-medium">Background Questions Signature</CardTitle>
              <p className="text-xs text-muted-foreground/60">Signature confirmed</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/30">
            <div className="h-16 w-40 rounded-lg bg-white border border-emerald-200/50 flex items-center justify-center overflow-hidden p-2">
              <img 
                src={existingSignature} 
                alt="Your signature" 
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-emerald-800">Signature Confirmed</p>
              <p className="text-xs text-emerald-700/70">
                Signed on {new Date(uploadedDocs.background_signature_date || '').toLocaleDateString()}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRedraw}
              className="text-muted-foreground hover:text-foreground"
            >
              Redraw
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasError = showValidation && fieldErrors['background_signature'];

  return (
    <Card 
      className={`rounded-[28px] border-0 overflow-hidden mt-4 transition-all duration-300 ${
        hasError ? 'ring-1 ring-rose-300/70' : ''
      }`}
      style={{ 
        background: 'linear-gradient(180deg, #FFFFFF 0%, #FEFEFE 100%)',
        boxShadow: '0px 1px 0px rgba(255, 255, 255, 0.8) inset, 0px 20px 60px rgba(0, 0, 0, 0.06)'
      }}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            hasError ? 'bg-rose-50' : 'bg-primary/10'
          }`}>
            <PenLine className={`h-5 w-5 ${hasError ? 'text-rose-500' : 'text-primary'}`} />
          </div>
          <div>
            <CardTitle className="text-lg font-medium">Background Questions Signature</CardTitle>
            <p className="text-xs text-muted-foreground/60">Sign to confirm your background question answers are accurate</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-6">
        {disabled && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 text-muted-foreground/60 mb-4">
            <Lock className="h-4 w-4" />
            <span className="text-sm">Enter your initials above to unlock this section</span>
          </div>
        )}

        <div style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
          <div className="p-4 rounded-xl bg-muted/20 border border-border/10 mb-4">
            <p className="text-xs text-muted-foreground/70 leading-relaxed">
              By signing below, I attest that the information I have provided in the Background Questions section 
              is true to the best of my knowledge. I acknowledge that if any of the information changes, 
              I will notify Tyler Insurance Group within five (5) days of such a change.
            </p>
          </div>

          <div className={`border-2 border-dashed rounded-xl p-4 bg-white transition-all duration-300 ${
            hasError ? 'border-rose-300/70' : 'border-border/30'
          }`}>
            <p className="text-xs text-muted-foreground/50 mb-2 text-center">Draw your signature below</p>
            <div className={`border rounded-lg bg-white transition-all duration-300 ${
              hasError ? 'border-rose-300/70' : 'border-border/20'
            }`}>
              <SignatureCanvas
                ref={signatureRef}
                penColor="black"
                canvasProps={{
                  className: 'w-full h-24 rounded-lg',
                  style: { width: '100%', height: '96px' }
                }}
              />
            </div>
            {hasError && (
              <div className="mt-3">
                <FormFieldError error={fieldErrors['background_signature']} />
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              onClick={handleClear}
              className="flex-1 gap-2 rounded-xl"
            >
              <Trash2 className="h-4 w-4" />
              Clear
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 gap-2 rounded-xl"
            >
              <Check className="h-4 w-4" />
              Confirm Signature
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
