import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ContractingApplication } from '@/types/contracting';
import { cn } from '@/lib/utils';
import { FormFieldError, getFieldErrorClass } from '../FormFieldError';
import { SignaturePad } from '../SignaturePad';

interface SignSubmitSectionProps {
  application: ContractingApplication;
  onUpdate: <K extends keyof ContractingApplication>(field: K, value: ContractingApplication[K]) => void;
  disabled?: boolean;
  fieldErrors?: Record<string, string>;
  showValidation?: boolean;
  onClearError?: (field: string) => void;
}

export function SignSubmitSection({ 
  application, 
  onUpdate, 
  disabled,
  fieldErrors = {},
  showValidation = false,
  onClearError
}: SignSubmitSectionProps) {
  const today = new Date().toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });

  const uploadedDocs = (application.uploaded_documents || {}) as Record<string, string>;

  const handleSignatureChange = (signatureData: string | null) => {
    const docs = (application.uploaded_documents || {}) as Record<string, string>;
    if (signatureData) {
      onUpdate('uploaded_documents', { ...docs, final_signature: signatureData });
      if (onClearError) onClearError('final_signature');
    } else {
      const { final_signature, ...rest } = docs;
      onUpdate('uploaded_documents', rest);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-8">
      <div className="space-y-6" style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
        
        {/* Legal text */}
        <p className="text-sm text-slate-500 leading-relaxed">
          By typing your name below, you are providing a legally binding electronic signature.
        </p>

        {/* Signature fields */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-2">
            <Label className="text-sm font-medium text-slate-700">
              Full Legal Name <span className="text-rose-400">*</span>
            </Label>
            <Input
              value={application.signature_name || ''}
              onChange={(e) => {
                onUpdate('signature_name', e.target.value);
                if (onClearError) onClearError('signature_name');
              }}
              placeholder="Type your full name"
              className={cn(
                "h-12 rounded-xl bg-slate-50 border-slate-200 text-lg",
                getFieldErrorClass(!!fieldErrors.signature_name, showValidation)
              )}
            />
            <FormFieldError error={fieldErrors.signature_name} show={showValidation} />
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">
              Initials <span className="text-rose-400">*</span>
            </Label>
            <Input
              value={application.signature_initials || ''}
              onChange={(e) => {
                onUpdate('signature_initials', e.target.value.toUpperCase());
                if (onClearError) onClearError('signature_initials');
              }}
              placeholder="ABC"
              maxLength={4}
              className={cn(
                "h-12 rounded-xl bg-slate-50 border-slate-200 text-lg text-center uppercase",
                getFieldErrorClass(!!fieldErrors.signature_initials, showValidation)
              )}
            />
            <FormFieldError error={fieldErrors.signature_initials} show={showValidation} />
          </div>
        </div>

        {/* Date */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50">
          <span className="text-sm text-slate-500">Date</span>
          <span className="text-sm font-medium text-slate-900">{today}</span>
        </div>

        {/* Drawn signature */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">
            Draw Your Signature <span className="text-rose-400">*</span>
          </Label>
          <div className={cn(
            "rounded-xl transition-all duration-300",
            showValidation && fieldErrors.final_signature && "ring-2 ring-rose-200/70"
          )}>
            <SignaturePad
              value={uploadedDocs.final_signature}
              onChange={handleSignatureChange}
              disabled={disabled}
            />
          </div>
          <FormFieldError error={fieldErrors.final_signature} show={showValidation} />
        </div>

        {/* Final attestation */}
        <p className="text-xs text-slate-400 text-center leading-relaxed">
          By signing, you acknowledge this constitutes a legally binding agreement.
          This agreement is governed by the laws of the Commonwealth of Kentucky.
        </p>

      </div>
    </div>
  );
}

