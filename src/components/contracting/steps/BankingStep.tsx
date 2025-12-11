import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ContractingApplication } from '@/types/contracting';
import { Landmark, Upload } from 'lucide-react';
import { useRef } from 'react';
import { WizardProgress } from '../WizardProgress';

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

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="border-0 shadow-lg">
        {/* Progress + Header */}
        <div className="pt-3 pb-2 text-center border-b border-border/30">
          <WizardProgress {...progressProps} compact />
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
              <Landmark className="h-3.5 w-3.5 text-primary" />
            </div>
            <h2 className="text-base font-semibold">Banking & Direct Deposit</h2>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            For commission deposits. Be sure to attach a voided check.
          </p>
        </div>
        <CardContent className="space-y-4 py-3">
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="bank_routing_number" className="text-xs">Bank Routing Number</Label>
              <Input
                id="bank_routing_number"
                value={application.bank_routing_number || ''}
                onChange={e => onUpdate('bank_routing_number', e.target.value)}
                placeholder="123456789"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="bank_account_number" className="text-xs">Account Number</Label>
              <Input
                id="bank_account_number"
                value={application.bank_account_number || ''}
                onChange={e => onUpdate('bank_account_number', e.target.value)}
                placeholder="1234567890"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="bank_branch_name" className="text-xs">Branch Name/Location</Label>
              <Input
                id="bank_branch_name"
                value={application.bank_branch_name || ''}
                onChange={e => onUpdate('bank_branch_name', e.target.value)}
                placeholder="Main Street Branch"
                className="h-8 text-sm"
              />
            </div>
          </div>

          <div className="grid gap-3 grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="beneficiary_name" className="text-xs">Beneficiary Name</Label>
              <Input
                id="beneficiary_name"
                value={application.beneficiary_name || ''}
                onChange={e => onUpdate('beneficiary_name', e.target.value)}
                placeholder="John Doe"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="beneficiary_relationship" className="text-xs">Relationship to Agent</Label>
              <Input
                id="beneficiary_relationship"
                value={application.beneficiary_relationship || ''}
                onChange={e => onUpdate('beneficiary_relationship', e.target.value)}
                placeholder="Spouse"
                className="h-8 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Checkbox
              id="requesting_commission_advancing"
              checked={application.requesting_commission_advancing}
              onCheckedChange={checked => onUpdate('requesting_commission_advancing', !!checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="requesting_commission_advancing" className="text-sm font-normal cursor-pointer">
              I am requesting commission advancing
            </Label>
          </div>

          <div className="pt-2 border-t">
            <div className="space-y-1">
              <Label className="text-xs">Voided Check</Label>
              <input
                type="file"
                ref={checkInputRef}
                onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'voided_check')}
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start h-8 text-xs"
                onClick={() => checkInputRef.current?.click()}
              >
                <Upload className="h-3 w-3 mr-2" />
                {application.uploaded_documents?.voided_check
                  ? '✓ Voided check uploaded'
                  : 'Upload voided check'}
              </Button>
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={onBack} size="sm">
              Back
            </Button>
            <Button onClick={onContinue} size="sm">
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
