import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ContractingApplication } from '@/types/contracting';
import { PenTool, ArrowRight, Check } from 'lucide-react';
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
  { id: 'info_accurate', text: 'I confirm that all information provided is true and correct to the best of my knowledge.' },
  { id: 'receive_emails', text: 'I agree to receive carrier required emails and Tyler Insurance Group compliance updates.' },
  { id: 'enter_info', text: 'I give Tyler Insurance Group permission to enter this information on my behalf for contracting.' },
  { id: 'facsimile_signature', text: 'I authorize Tyler Insurance Group to affix a facsimile of my signature to carrier documents.' },
];

const OPTIONAL_AGREEMENTS = [
  { id: 'marketing', text: 'Send me information about carriers, products, and lead opportunities.' },
];

export function AgreementsStep({ application, onUpdate, onBack, onContinue, progressProps }: AgreementsStepProps) {
  const agreements = (application.agreements as Record<string, boolean>) || {};

  const handleAgreementChange = (agreementId: string, checked: boolean) => {
    onUpdate('agreements', { ...agreements, [agreementId]: checked });
  };

  const today = new Date().toISOString().split('T')[0];

  const allRequiredChecked = REQUIRED_AGREEMENTS.every(a => agreements[a.id]);
  const hasSignature = application.signature_name?.trim() && application.signature_initials?.trim();
  const canProceed = allRequiredChecked && hasSignature;

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="border-0 shadow-lg">
        {/* Progress + Header */}
        <div className="pt-2 pb-1.5 text-center border-b border-border/30">
          <WizardProgress {...progressProps} compact />
          <div className="flex items-center justify-center gap-2 mt-1.5">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
              <PenTool className="h-3 w-3 text-primary" />
            </div>
            <h2 className="text-sm font-semibold">Agreements & E-Signature</h2>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            These agreements allow us to submit your contracting accurately.
          </p>
        </div>

        <CardContent className="py-3 px-4 space-y-3">
          {/* Required Agreements */}
          <div className="space-y-1.5">
            <h3 className="text-[10px] font-medium text-foreground/70 uppercase tracking-wide">Required for Contracting</h3>
            <div className="space-y-1.5">
              {REQUIRED_AGREEMENTS.map(agreement => (
                <div 
                  key={agreement.id} 
                  className={`flex items-center gap-2 py-1.5 px-2 rounded-md border transition-colors ${
                    agreements[agreement.id] 
                      ? 'bg-primary/5 border-primary/20' 
                      : 'border-border/40 hover:border-border'
                  }`}
                >
                  <Checkbox
                    id={`agreement_${agreement.id}`}
                    checked={agreements[agreement.id] || false}
                    onCheckedChange={checked => handleAgreementChange(agreement.id, !!checked)}
                    className="h-3.5 w-3.5"
                  />
                  <Label 
                    htmlFor={`agreement_${agreement.id}`} 
                    className="text-xs font-normal cursor-pointer flex-1"
                  >
                    {agreement.text}
                  </Label>
                  {agreements[agreement.id] && (
                    <Check className="h-3 w-3 text-primary flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Optional + Signature Row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Optional */}
            <div className="space-y-1.5">
              <h3 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Optional</h3>
              {OPTIONAL_AGREEMENTS.map(agreement => (
                <div 
                  key={agreement.id} 
                  className="flex items-center gap-2 py-1.5 px-2 rounded-md bg-muted/30 border border-border/30"
                >
                  <Checkbox
                    id={`agreement_${agreement.id}`}
                    checked={agreements[agreement.id] || false}
                    onCheckedChange={checked => handleAgreementChange(agreement.id, !!checked)}
                    className="h-3.5 w-3.5"
                  />
                  <Label 
                    htmlFor={`agreement_${agreement.id}`} 
                    className="text-xs font-normal cursor-pointer text-muted-foreground"
                  >
                    {agreement.text}
                  </Label>
                </div>
              ))}
            </div>

            {/* Signature */}
            <div className="space-y-1.5">
              <h3 className="text-[10px] font-medium text-foreground/70 uppercase tracking-wide">E-Signature</h3>
              <div className="rounded-lg bg-muted/30 border border-border/40 p-2 space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2 space-y-0.5">
                    <Label htmlFor="signature_name" className="text-[10px] text-muted-foreground">Full Name</Label>
                    <Input
                      id="signature_name"
                      value={application.signature_name || ''}
                      onChange={e => onUpdate('signature_name', e.target.value)}
                      placeholder="Type your full name"
                      className="h-7 text-xs"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <Label htmlFor="signature_initials" className="text-[10px] text-muted-foreground">Initials</Label>
                    <Input
                      id="signature_initials"
                      value={application.signature_initials || ''}
                      onChange={e => onUpdate('signature_initials', e.target.value.toUpperCase())}
                      placeholder="JD"
                      maxLength={4}
                      className="h-7 text-xs uppercase"
                    />
                  </div>
                </div>
                <p className="text-[9px] text-muted-foreground/70 text-center">
                  Typing above signs this application electronically • {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-1 border-t border-border/30">
            <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground h-8">
              Back
            </Button>
            <div className="flex items-center gap-3">
              {!canProceed && (
                <p className="text-[10px] text-muted-foreground">
                  Complete all required items to continue
                </p>
              )}
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <ArrowRight className="h-2.5 w-2.5" />
                <span>Review & Submit</span>
              </p>
            </div>
            <Button size="sm" onClick={onContinue} disabled={!canProceed} className="h-8">
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
