import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ContractingApplication } from '@/types/contracting';
import { Landmark, Shield, ArrowRight, AlertCircle } from 'lucide-react';
import { useMemo } from 'react';
import { WizardProgress } from '../WizardProgress';
import { InitialsAcknowledgmentBar } from '../InitialsAcknowledgmentBar';
import { FileDropZone } from '../FileDropZone';
import { validateBanking } from '@/hooks/useContractingValidation';
import { toast } from 'sonner';

interface ProgressProps {
  currentStep: number;
  completedSteps: number[];
  onStepClick: (step: number) => void;
}

interface BankingStepProps {
  application: ContractingApplication;
  initials: string | null;
  onUpdate: <K extends keyof ContractingApplication>(field: K, value: ContractingApplication[K]) => void;
  onUpload: (file: File, type: string) => Promise<string | null>;
  onRemove: (type: string) => void;
  onBack: () => void;
  onContinue: () => void;
  progressProps: ProgressProps;
}

export function BankingStep({ application, initials, onUpdate, onUpload, onRemove, onBack, onContinue, progressProps }: BankingStepProps) {

  const handleFileUpload = async (file: File, type: string) => {
    await onUpload(file, type);
  };

  // Validation
  const validation = useMemo(() => validateBanking(application), [application]);

  const handleContinue = () => {
    if (!validation.isValid) {
      toast.error(validation.errors[0]);
      return;
    }
    onContinue();
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card 
        className="border-0 rounded-[24px]"
        style={{ 
          background: 'linear-gradient(180deg, #FFFFFF 0%, #FEFEFE 100%)',
          boxShadow: '0px 1px 0px rgba(255, 255, 255, 0.8) inset, 0px 20px 60px rgba(0, 0, 0, 0.08), 0px 0px 100px rgba(163, 133, 41, 0.03)'
        }}
      >
        {/* Progress + Header */}
        <div className="pt-5 pb-4 text-center border-b border-border/20">
          <WizardProgress {...progressProps} compact />
          <div className="flex items-center justify-center gap-2.5 mt-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <Landmark className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-xl font-semibold font-serif" style={{ letterSpacing: '0.015em' }}>Commission Deposit</h2>
          </div>
          <p className="text-xs text-muted-foreground/60 mt-1.5 max-w-md mx-auto">
            Where should we send your commissions?
          </p>
          {/* Security reassurance */}
          <div className="flex items-center justify-center gap-1.5 mt-2 text-[10px] text-muted-foreground/50">
            <Shield className="h-3 w-3" />
            <span>Banking details are encrypted and used only for commission deposits.</span>
          </div>
        </div>

        <CardContent className="py-5 px-7 space-y-5">
          {/* Section 1: Who receives commissions */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Account Holder</p>
            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="beneficiary_name" className="text-sm">Name on Account</Label>
                <Input
                  id="beneficiary_name"
                  value={application.beneficiary_name || ''}
                  onChange={e => onUpdate('beneficiary_name', e.target.value)}
                  placeholder="John Doe"
                  className="h-9"
                />
                <p className="text-[10px] text-muted-foreground/70">Must match the name on your bank account.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="beneficiary_relationship" className="text-sm">Relationship to You</Label>
                <Input
                  id="beneficiary_relationship"
                  value={application.beneficiary_relationship || ''}
                  onChange={e => onUpdate('beneficiary_relationship', e.target.value)}
                  placeholder='Self, Spouse, Business...'
                  className="h-9"
                />
                <p className="text-[10px] text-muted-foreground/70">Enter "Self" if this is your personal account.</p>
              </div>
            </div>
          </div>

          {/* Section 2: Where commissions are deposited */}
          <div className="space-y-3 pt-2 border-t border-border/30">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Bank Details</p>
            <div className="grid gap-4 grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="bank_routing_number" className="text-sm">Routing Number</Label>
                <Input
                  id="bank_routing_number"
                  value={application.bank_routing_number || ''}
                  onChange={e => onUpdate('bank_routing_number', e.target.value)}
                  placeholder="123456789"
                  className="h-9"
                />
                <p className="text-[10px] text-muted-foreground/70">9-digit number</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bank_account_number" className="text-sm">Account Number</Label>
                <Input
                  id="bank_account_number"
                  value={application.bank_account_number || ''}
                  onChange={e => onUpdate('bank_account_number', e.target.value)}
                  placeholder="1234567890"
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bank_branch_name" className="text-sm flex items-center gap-1">
                  Bank Name <span className="text-muted-foreground/50 font-normal">optional</span>
                </Label>
                <Input
                  id="bank_branch_name"
                  value={application.bank_branch_name || ''}
                  onChange={e => onUpdate('bank_branch_name', e.target.value)}
                  placeholder="Chase, Wells Fargo..."
                  className="h-9"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Account verification */}
          <div className="space-y-3 pt-2 border-t border-border/30">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Account Verification</p>
                <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                  Prevents payment errors and confirms account ownership.
                </p>
              </div>
            </div>
            <FileDropZone
              onFileSelect={(file) => handleFileUpload(file, 'voided_check')}
              onRemove={() => onRemove('voided_check')}
              isUploaded={!!application.uploaded_documents?.voided_check}
              uploadedLabel="Voided check uploaded"
              defaultLabel="Upload voided check or bank letter"
            />
          </div>

          {/* Commission advancing option */}
          <div className="pt-2 border-t border-border/30">
            <div className="flex items-start gap-3">
              <Checkbox
                id="requesting_commission_advancing"
                checked={application.requesting_commission_advancing}
                onCheckedChange={checked => onUpdate('requesting_commission_advancing', !!checked)}
                className="mt-0.5"
              />
              <div className="space-y-1">
                <Label htmlFor="requesting_commission_advancing" className="text-sm font-normal cursor-pointer">
                  I'd like to request commission advancing
                </Label>
                <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
                  Optional. Receive a portion of your commission upfront when policies are issued, rather than waiting for the standard payment cycle.
                </p>
              </div>
            </div>
          </div>

          {/* Validation indicator */}
          {!validation.isValid && (
            <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 rounded-lg">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              <span>Complete all required fields and upload a voided check to continue</span>
            </div>
          )}

          {/* Initials Acknowledgment */}
          <InitialsAcknowledgmentBar initials={initials} />

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button variant="ghost" onClick={onBack} className="text-muted-foreground">
              Back
            </Button>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <ArrowRight className="h-3 w-3" />
              <span className="text-foreground/70">Next: Training</span>
            </p>
            <Button onClick={handleContinue} disabled={!validation.isValid}>
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
