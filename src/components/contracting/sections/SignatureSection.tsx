import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ContractingApplication } from '@/types/contracting';
import { SectionStatus } from '../ContractingForm';
import { PenLine, Lock, Check, AlertCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { SignaturePad } from '../SignaturePad';
import { ValidationBanner } from '../ValidationBanner';
import { FormFieldError, getFieldErrorClass } from '../FormFieldError';
import { cn } from '@/lib/utils';

interface SectionError {
  sectionId: string;
  sectionName: string;
  isValid: boolean;
  needsAcknowledgment: boolean;
}

interface SignatureSectionProps {
  application: ContractingApplication;
  sectionStatuses: Record<string, SectionStatus>;
  onUpdate: <K extends keyof ContractingApplication>(field: K, value: ContractingApplication[K]) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  disabled?: boolean;
  fieldErrors?: Record<string, string>;
  sectionErrors?: Record<string, SectionError>;
  showValidation?: boolean;
  onScrollToSection?: (sectionId: string) => void;
}

export function SignatureSection({ 
  application, 
  sectionStatuses, 
  onUpdate, 
  onSubmit,
  isSubmitting,
  disabled,
  fieldErrors = {},
  sectionErrors = {},
  showValidation = false,
  onScrollToSection,
}: SignatureSectionProps) {
  const allSectionsAcknowledged = Object.entries(sectionStatuses)
    .filter(([id]) => !['initials', 'signature'].includes(id))
    .every(([, status]) => status.acknowledged);

  const unacknowledgedSections = Object.entries(sectionStatuses)
    .filter(([id, status]) => !['initials', 'signature'].includes(id) && !status.acknowledged)
    .map(([, status]) => status.name);

  // Check if signature drawing exists (stored in uploaded_documents)
  const uploadedDocs = (application.uploaded_documents || {}) as Record<string, string>;
  const hasDrawnSignature = !!uploadedDocs.final_signature;

  const handleSignatureChange = (signatureData: string | null) => {
    const docs = (application.uploaded_documents || {}) as Record<string, string>;
    if (signatureData) {
      onUpdate('uploaded_documents', { ...docs, final_signature: signatureData });
    } else {
      const { final_signature, ...rest } = docs;
      onUpdate('uploaded_documents', rest);
    }
  };

  const handleSubmit = () => {
    // Set the signature date before submitting
    if (!application.signature_date) {
      onUpdate('signature_date', new Date().toISOString());
    }
    // Small delay to ensure the date is saved before submission
    setTimeout(() => {
      onSubmit();
    }, 100);
  };

  // Determine what's incomplete for helper text
  const getIncompleteMessage = () => {
    const issues = [];
    if (!application.signature_name) issues.push('type your legal name');
    if (!hasDrawnSignature) issues.push('draw your signature');
    if (!allSectionsAcknowledged) issues.push('acknowledge all sections');
    
    if (issues.length === 0) return null;
    return `Please ${issues.join(' and ')} to submit`;
  };

  return (
    <Card 
      className="rounded-[28px] border-0 overflow-hidden"
      style={{ 
        background: 'linear-gradient(180deg, #FFFFFF 0%, #FEFEFE 100%)',
        boxShadow: '0px 1px 0px rgba(255, 255, 255, 0.8) inset, 0px 20px 60px rgba(0, 0, 0, 0.08), 0px 0px 100px rgba(163, 133, 41, 0.03)'
      }}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <PenLine className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg font-medium">Electronic Signature</CardTitle>
            <p className="text-xs text-muted-foreground/60">Review and sign to complete your application</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pb-8">
        {disabled && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 text-muted-foreground/60">
            <Lock className="h-4 w-4" />
            <span className="text-sm">Enter your initials above to unlock this section</span>
          </div>
        )}

        <div style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }} className="space-y-6">
          {/* Validation Banner - shows when validation fails */}
          {showValidation && Object.values(sectionErrors).some(s => !s.isValid) && (
            <ValidationBanner
              show={true}
              sectionErrors={sectionErrors}
              onSectionClick={onScrollToSection}
            />
          )}

          {/* Section status summary - only show if not showing validation errors */}
          {!showValidation && !allSectionsAcknowledged && (
            <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/30">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Sections to Complete</p>
                  <p className="text-xs text-amber-700/70 mt-1">
                    Acknowledge the following sections before signing:
                  </p>
                  <ul className="mt-2 space-y-1">
                    {unacknowledgedSections.map((name) => (
                      <li key={name} className="text-xs text-amber-700/80 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-amber-400" />
                        {name}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {allSectionsAcknowledged && !showValidation && (
            <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Check className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-800">All Sections Complete</p>
                  <p className="text-xs text-emerald-700/70">You're ready to sign and submit</p>
                </div>
              </div>
            </div>
          )}

          {/* Attestation */}
          <div className="p-4 rounded-xl bg-muted/20 border border-border/10">
            <p className="text-sm leading-relaxed text-muted-foreground">
              I, <span className="font-medium text-foreground">{application.signature_name || '________________'}</span>, 
              hereby authorize Tyler Insurance Group to affix or append a facsimile of my signature to all required 
              signature fields on all Insurance Carrier documents. I affirm that the information I have submitted 
              is correct to the best of my knowledge.
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground mt-3">
              <strong>My initials throughout this document confirm review and acceptance of each section.</strong>
            </p>
            <p className="text-xs text-muted-foreground/60 mt-3">
              By signing this form, I acknowledge that all information is true and correct to the best of my knowledge.
            </p>
          </div>

          {/* Typed name and initials */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="signature_name">Type Your Full Legal Name <span className="text-destructive">*</span></Label>
              <Input
                id="signature_name"
                value={application.signature_name || ''}
                onChange={(e) => onUpdate('signature_name', e.target.value)}
                placeholder="Your legal name"
                className={cn(
                  "h-11 rounded-xl font-medium",
                  getFieldErrorClass(!!fieldErrors.signature_name, showValidation)
                )}
              />
              <FormFieldError error={fieldErrors.signature_name} show={showValidation} />
            </div>

            <div className="space-y-2">
              <Label>Your Initials</Label>
              <div className="h-11 px-4 rounded-xl bg-muted/30 flex items-center text-lg font-semibold tracking-widest">
                {application.signature_initials || '—'}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <div className="h-11 px-4 rounded-xl bg-muted/30 flex items-center text-sm">
                {format(new Date(), 'MMMM d, yyyy')}
              </div>
            </div>
          </div>

          {/* Drawn signature */}
          <div className="space-y-2">
            <Label>Draw Your Signature <span className="text-destructive">*</span></Label>
            <div className={cn(
              "rounded-xl transition-all duration-200",
              showValidation && fieldErrors.final_signature && "ring-2 ring-destructive/30"
            )}>
              <SignaturePad
                value={uploadedDocs.final_signature}
                onChange={handleSignatureChange}
                disabled={disabled}
              />
            </div>
            <FormFieldError error={fieldErrors.final_signature} show={showValidation} />
          </div>

          {/* Submit button - ALWAYS visible and clickable */}
          <div className="pt-4">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full h-14 text-base font-medium rounded-2xl"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                'Submit Contracting Application'
              )}
            </Button>
            
            {/* Helper text - shows what's incomplete */}
            {!showValidation && getIncompleteMessage() && (
              <p className="text-xs text-center text-muted-foreground/60 mt-3">
                {getIncompleteMessage()}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
