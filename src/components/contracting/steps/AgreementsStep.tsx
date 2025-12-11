import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ContractingApplication } from '@/types/contracting';
import { PenTool, ArrowRight, CheckCircle2 } from 'lucide-react';
import { WizardProgress } from '../WizardProgress';

interface ProgressProps {
  currentStep: number;
  completedSteps: number[];
  onStepClick: (step: number) => void;
}

interface AgreementsStepProps {
  application: ContractingApplication;
  onUpdate: <K extends keyof ContractingApplication>(field: K, value: ContractingApplication[K]) => void;
  onBack: () => void;
  onContinue: () => void;
  progressProps: ProgressProps;
}

const REQUIRED_AGREEMENTS = [
  { 
    id: 'info_accurate', 
    text: 'I confirm that all of the information provided is true and correct to the best of my knowledge.' 
  },
  { 
    id: 'receive_emails', 
    text: 'I agree to receive all carrier required emails and Tyler Insurance Group compliance updates.' 
  },
  { 
    id: 'enter_info', 
    text: 'I give Tyler Insurance Group permission to enter this information on my behalf for contracting purposes.' 
  },
  { 
    id: 'facsimile_signature', 
    text: 'I authorize Tyler Insurance Group to affix a facsimile of my signature to carrier documents for contracting, and agree to indemnify and hold harmless Tyler Insurance Group and relevant third parties as described.' 
  },
];

const OPTIONAL_AGREEMENTS = [
  { 
    id: 'marketing', 
    text: 'I agree to let Tyler Insurance Group send me information about carriers, products, and lead opportunities.' 
  },
];

export function AgreementsStep({ application, onUpdate, onBack, onContinue, progressProps }: AgreementsStepProps) {
  const agreements = (application.agreements as Record<string, boolean>) || {};

  const handleAgreementChange = (agreementId: string, checked: boolean) => {
    onUpdate('agreements', { ...agreements, [agreementId]: checked });
  };

  const today = new Date().toISOString().split('T')[0];

  // Check if all required agreements are checked
  const allRequiredChecked = REQUIRED_AGREEMENTS.every(a => agreements[a.id]);
  const hasSignature = application.signature_name?.trim() && application.signature_initials?.trim();
  const canProceed = allRequiredChecked && hasSignature;

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="border-0 shadow-lg">
        {/* Progress + Header */}
        <div className="pt-3 pb-2 text-center border-b border-border/30">
          <WizardProgress {...progressProps} compact />
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
              <PenTool className="h-3.5 w-3.5 text-primary" />
            </div>
            <h2 className="text-base font-semibold">Agreements & E-Signature</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto leading-relaxed">
            These agreements allow us to submit your contracting accurately and communicate as required by carriers.
          </p>
        </div>

        <CardContent className="py-5 px-6 space-y-6">
          {/* Required Agreements Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-medium text-foreground/80 uppercase tracking-wide">Required for Contracting</h3>
            </div>
            <div className="space-y-4">
              {REQUIRED_AGREEMENTS.map(agreement => (
                <div 
                  key={agreement.id} 
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                    agreements[agreement.id] 
                      ? 'bg-primary/5 border-primary/20' 
                      : 'bg-background border-border/50 hover:border-border'
                  }`}
                >
                  <Checkbox
                    id={`agreement_${agreement.id}`}
                    checked={agreements[agreement.id] || false}
                    onCheckedChange={checked => handleAgreementChange(agreement.id, !!checked)}
                    className="h-4 w-4 mt-0.5"
                  />
                  <Label 
                    htmlFor={`agreement_${agreement.id}`} 
                    className="text-sm font-normal cursor-pointer leading-relaxed flex-1"
                  >
                    {agreement.text}
                  </Label>
                  {agreements[agreement.id] && (
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Optional Communications Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Optional Communications</h3>
            </div>
            <div className="space-y-3">
              {OPTIONAL_AGREEMENTS.map(agreement => (
                <div 
                  key={agreement.id} 
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/30"
                >
                  <Checkbox
                    id={`agreement_${agreement.id}`}
                    checked={agreements[agreement.id] || false}
                    onCheckedChange={checked => handleAgreementChange(agreement.id, !!checked)}
                    className="h-4 w-4 mt-0.5"
                  />
                  <Label 
                    htmlFor={`agreement_${agreement.id}`} 
                    className="text-sm font-normal cursor-pointer leading-relaxed text-muted-foreground flex-1"
                  >
                    {agreement.text}
                    <span className="text-xs text-muted-foreground/70 ml-1">(optional)</span>
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Electronic Signature Section */}
          <div className="pt-4">
            <div className="rounded-xl bg-gradient-to-b from-muted/40 to-muted/20 border border-border/50 p-5 space-y-4">
              <div className="text-center space-y-1">
                <h3 className="font-semibold text-sm">Electronic Signature</h3>
                <p className="text-xs text-muted-foreground">
                  By typing your name and initials below, you are signing this application electronically.
                </p>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5 sm:col-span-1">
                  <Label htmlFor="signature_name" className="text-xs font-medium">
                    Full Legal Name
                  </Label>
                  <Input
                    id="signature_name"
                    value={application.signature_name || ''}
                    onChange={e => onUpdate('signature_name', e.target.value)}
                    placeholder="Type your full name"
                    className="h-9 text-sm bg-background"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signature_initials" className="text-xs font-medium">
                    Initials
                  </Label>
                  <Input
                    id="signature_initials"
                    value={application.signature_initials || ''}
                    onChange={e => onUpdate('signature_initials', e.target.value.toUpperCase())}
                    placeholder="JD"
                    maxLength={4}
                    className="h-9 text-sm uppercase bg-background"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signature_date" className="text-xs font-medium">
                    Date
                  </Label>
                  <Input
                    id="signature_date"
                    type="date"
                    value={application.signature_date || today}
                    onChange={e => onUpdate('signature_date', e.target.value)}
                    className="h-9 text-sm bg-background"
                    readOnly
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Validation feedback */}
          {!canProceed && (
            <p className="text-xs text-muted-foreground text-center">
              Please acknowledge all required agreements and provide your signature to continue.
            </p>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2">
            <Button variant="ghost" onClick={onBack} className="text-muted-foreground">
              Back
            </Button>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <ArrowRight className="h-3 w-3" />
              <span className="text-foreground/70">Next: Review & Submit</span>
            </p>
            <Button onClick={onContinue} disabled={!canProceed}>
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
