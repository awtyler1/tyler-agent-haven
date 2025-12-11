import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ContractingApplication } from '@/types/contracting';
import { PenTool, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useState, useRef, useMemo } from 'react';
import { WizardProgress } from '../WizardProgress';
import { InitialsAcknowledgmentBar } from '../InitialsAcknowledgmentBar';
import { ValidationBanner } from '../ValidationBanner';
import { cn } from '@/lib/utils';
import { VALIDATION_MESSAGES } from '@/hooks/useContractingValidation';

interface ProgressProps {
  currentStep: number;
  completedSteps: number[];
  onStepClick: (step: number) => void;
}

interface AgreementsStepProps {
  application: ContractingApplication;
  initials: string | null;
  onUpdate: <K extends keyof ContractingApplication>(field: K, value: ContractingApplication[K]) => void;
  onBack: () => void;
  onContinue: () => void;
  progressProps: ProgressProps;
}

const REQUIRED_AGREEMENTS = [
  { id: 'info_accurate', text: 'I confirm that all information provided is true and correct to the best of my knowledge.' },
  { id: 'receive_emails', text: 'I agree to receive carrier required emails and Tyler Insurance Group compliance updates.' },
  { id: 'enter_info', text: 'I give Tyler Insurance Group permission to enter this information on my behalf for contracting.' },
  { id: 'facsimile_signature', text: 'I authorize Tyler Insurance Group to affix a facsimile of my signature to carrier documents.' },
];

const OPTIONAL_AGREEMENTS = [
  { id: 'marketing', text: 'Send me information about carriers, products, and lead opportunities.' },
];

export function AgreementsStep({ application, initials, onUpdate, onBack, onContinue, progressProps }: AgreementsStepProps) {
  const agreements = (application.agreements as Record<string, boolean>) || {};
  const [showErrors, setShowErrors] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const handleAgreementChange = (agreementId: string, checked: boolean) => {
    onUpdate('agreements', { ...agreements, [agreementId]: checked });
  };

  const today = new Date().toISOString().split('T')[0];

  // Validation
  const validation = useMemo(() => {
    const errors: string[] = [];
    const fieldErrors: Record<string, string> = {};
    
    const uncheckedAgreements = REQUIRED_AGREEMENTS.filter(a => !agreements[a.id]);
    if (uncheckedAgreements.length > 0) {
      errors.push('Please accept all required agreements');
      fieldErrors.agreements = 'All required agreements must be accepted';
    }
    
    if (!application.signature_name?.trim()) {
      errors.push('Signature name is required');
      fieldErrors.signature_name = 'Required';
    }
    
    if (!application.signature_initials?.trim()) {
      errors.push('Initials are required');
      fieldErrors.signature_initials = 'Required';
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      fieldErrors,
    };
  }, [agreements, application.signature_name, application.signature_initials]);

  const handleContinue = () => {
    if (!validation.isValid) {
      setShowErrors(true);
      // Scroll to first error
      if (formRef.current) {
        const firstErrorField = Object.keys(validation.fieldErrors)[0];
        const el = formRef.current.querySelector(`[data-field="${firstErrorField}"]`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    onContinue();
  };

  return (
    <div className="max-w-3xl mx-auto" ref={formRef}>
      <Card 
        className="border-0 rounded-[24px]"
        style={{ 
          background: 'linear-gradient(180deg, #FFFFFF 0%, #FEFEFE 100%)',
          boxShadow: '0px 1px 0px rgba(255, 255, 255, 0.8) inset, 0px 20px 60px rgba(0, 0, 0, 0.08), 0px 0px 100px rgba(163, 133, 41, 0.03)'
        }}
      >
        {/* Progress + Header */}
        <div className="pt-4 pb-3 text-center border-b border-border/20">
          <WizardProgress {...progressProps} compact />
          <div className="flex items-center justify-center gap-2.5 mt-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <PenTool className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-lg font-semibold font-serif" style={{ letterSpacing: '0.015em' }}>Agreements & E-Signature</h2>
          </div>
          <p className="text-xs text-muted-foreground/60 mt-1.5 max-w-md mx-auto">
            In exchange for access to carrier appointments, training, and agency resources, please confirm the following.
          </p>
        </div>

        <CardContent className="py-4 px-6 space-y-4">
          {/* Required Agreements Section */}
          <div className="space-y-2" data-field="agreements">
            <h3 className="text-[10px] font-medium text-foreground/80 uppercase tracking-wide">Required for Contracting</h3>
            <div className="space-y-2">
              {REQUIRED_AGREEMENTS.map(agreement => (
                <div 
                  key={agreement.id} 
                  className={cn(
                    "flex items-center gap-3 p-2.5 rounded-lg border transition-colors",
                    agreements[agreement.id] && "bg-primary/5 border-primary/20",
                    !agreements[agreement.id] && !showErrors && "bg-background border-border/50 hover:border-border",
                    !agreements[agreement.id] && showErrors && "bg-background border-destructive"
                  )}
                >
                  <Checkbox
                    id={`agreement_${agreement.id}`}
                    checked={agreements[agreement.id] || false}
                    onCheckedChange={checked => handleAgreementChange(agreement.id, !!checked)}
                    className="h-4 w-4"
                  />
                  <Label 
                    htmlFor={`agreement_${agreement.id}`} 
                    className="text-xs font-normal cursor-pointer flex-1"
                  >
                    {agreement.text}
                  </Label>
                  {agreements[agreement.id] && (
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
            {showErrors && validation.fieldErrors.agreements && (
              <p className="text-[10px] text-destructive animate-fade-in">{validation.fieldErrors.agreements}</p>
            )}
          </div>

          {/* Optional Communications Section */}
          <div className="space-y-2">
            <h3 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Optional Communications</h3>
            {OPTIONAL_AGREEMENTS.map(agreement => (
              <div 
                key={agreement.id} 
                className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 border border-border/30"
              >
                <Checkbox
                  id={`agreement_${agreement.id}`}
                  checked={agreements[agreement.id] || false}
                  onCheckedChange={checked => handleAgreementChange(agreement.id, !!checked)}
                  className="h-4 w-4"
                />
                <Label 
                  htmlFor={`agreement_${agreement.id}`} 
                  className="text-xs font-normal cursor-pointer text-muted-foreground flex-1"
                >
                  {agreement.text}
                  <span className="text-[10px] text-muted-foreground/70 ml-1">(optional)</span>
                </Label>
              </div>
            ))}
          </div>

          {/* Electronic Signature Section */}
          <div className="rounded-xl bg-gradient-to-b from-muted/40 to-muted/20 border border-border/50 p-4 space-y-3">
            <div className="text-center">
              <h3 className="font-semibold text-sm">Electronic Signature</h3>
              <p className="text-[10px] text-muted-foreground">
                By typing your name and initials below, you are providing a valid electronic signature under applicable law.
              </p>
            </div>
            
            <div className="grid gap-3 grid-cols-3">
              <div className="space-y-1" data-field="signature_name">
                <Label htmlFor="signature_name" className="text-[10px] font-medium">Full Legal Name *</Label>
                <Input
                  id="signature_name"
                  value={application.signature_name || ''}
                  onChange={e => onUpdate('signature_name', e.target.value)}
                  placeholder="Type your full name"
                  className={cn(
                    "h-8 text-sm bg-background",
                    showErrors && validation.fieldErrors.signature_name && "border-destructive focus:border-destructive focus:ring-destructive/20"
                  )}
                />
                {showErrors && validation.fieldErrors.signature_name && (
                  <p className="text-[10px] text-destructive animate-fade-in">{validation.fieldErrors.signature_name}</p>
                )}
              </div>
              <div className="space-y-1" data-field="signature_initials">
                <Label htmlFor="signature_initials" className="text-[10px] font-medium">Initials *</Label>
                <Input
                  id="signature_initials"
                  value={application.signature_initials || ''}
                  onChange={e => onUpdate('signature_initials', e.target.value.toUpperCase())}
                  placeholder="JD"
                  maxLength={4}
                  className={cn(
                    "h-8 text-sm uppercase bg-background",
                    showErrors && validation.fieldErrors.signature_initials && "border-destructive focus:border-destructive focus:ring-destructive/20"
                  )}
                />
                {showErrors && validation.fieldErrors.signature_initials && (
                  <p className="text-[10px] text-destructive animate-fade-in">{validation.fieldErrors.signature_initials}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="signature_date" className="text-[10px] font-medium">Date</Label>
                <Input
                  id="signature_date"
                  type="date"
                  value={application.signature_date || today}
                  onChange={e => onUpdate('signature_date', e.target.value)}
                  className="h-8 text-sm bg-background"
                  readOnly
                />
              </div>
            </div>

            {/* Binding Agreement Statement */}
            <p className="text-[10px] text-center text-muted-foreground leading-relaxed pt-1">
              By signing and submitting this application, I acknowledge this constitutes a legally binding agreement 
              and that applicable agency policies, carrier requirements, and compliance standards are incorporated by reference.
            </p>
          </div>

          {/* Governing Law - Subtle */}
          <p className="text-[9px] text-muted-foreground/70 text-center">
            This agreement is governed by the laws of the Commonwealth of Kentucky.
          </p>

          {/* Validation Banner */}
          <ValidationBanner 
            show={showErrors && !validation.isValid}
            message={
              validation.fieldErrors.agreements 
                ? VALIDATION_MESSAGES.agreementsRequired
                : validation.fieldErrors.signature_name 
                  ? VALIDATION_MESSAGES.signatureRequired
                  : VALIDATION_MESSAGES.required
            }
          />

          {/* Initials Acknowledgment */}
          <InitialsAcknowledgmentBar initials={initials} />

          {/* Navigation */}
          <div className="flex items-center justify-between pt-1">
            <Button variant="ghost" onClick={onBack} className="text-muted-foreground">
              Back
            </Button>
            <div className="flex items-center gap-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <ArrowRight className="h-3 w-3" />
                <span className="text-foreground/70">Review & Submit</span>
              </p>
            </div>
            <Button onClick={handleContinue}>
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}