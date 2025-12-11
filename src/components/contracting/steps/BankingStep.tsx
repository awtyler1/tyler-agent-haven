import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ContractingApplication } from '@/types/contracting';
import { Landmark, Upload, Shield, CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react';
import { useRef, useMemo } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { WizardProgress } from '../WizardProgress';
import { validateBanking } from '@/hooks/useContractingValidation';
import { toast } from 'sonner';

interface ProgressProps {
  currentStep: number;
  completedSteps: number[];
  onStepClick: (step: number) => void;
}

interface BankingStepProps {
  application: ContractingApplication;
  onUpdate: <K extends keyof ContractingApplication>(field: K, value: ContractingApplication[K]) => void;
  onUpload: (file: File, type: string) => Promise<string | null>;
  onBack: () => void;
  onContinue: () => void;
  progressProps: ProgressProps;
}

export function BankingStep({ application, onUpdate, onUpload, onBack, onContinue, progressProps }: BankingStepProps) {
  const checkInputRef = useRef<HTMLInputElement>(null);

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
      <Card className="border-0 shadow-lg">
        {/* Progress + Header */}
        <div className="pt-4 pb-3 text-center border-b border-border/30">
          <WizardProgress {...progressProps} compact />
          <div className="flex items-center justify-center gap-2.5 mt-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Landmark className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">Commission Deposit</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 max-w-md mx-auto">
            Where should we send your commissions?
          </p>
          {/* Security reassurance */}
          <div className="flex items-center justify-center gap-1.5 mt-2 text-[10px] text-muted-foreground/70">
            <Shield className="h-3 w-3" />
            <span>Banking details are encrypted and used only for commission deposits.</span>
          </div>
        </div>

        <CardContent className="py-5 px-6 space-y-5">
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
            <input
              type="file"
              ref={checkInputRef}
              onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'voided_check')}
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
            />
            <Button
              variant="outline"
              className={`w-full justify-start h-10 ${
                application.uploaded_documents?.voided_check 
                  ? 'border-primary/30 bg-primary/5' 
                  : ''
              }`}
              onClick={() => checkInputRef.current?.click()}
            >
              {application.uploaded_documents?.voided_check ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2 text-primary" />
                  <span className="text-primary">Voided check uploaded</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload voided check or bank letter
                </>
              )}
            </Button>
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
