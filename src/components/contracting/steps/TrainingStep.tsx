import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ContractingApplication } from '@/types/contracting';
import { GraduationCap, Upload } from 'lucide-react';
import { useRef } from 'react';
import { WizardProgress } from '../WizardProgress';

interface ProgressProps {
  currentStep: number;
  completedSteps: number[];
  onStepClick: (step: number) => void;
}

interface TrainingStepProps {
  application: ContractingApplication;
  onUpdate: <K extends keyof ContractingApplication>(field: K, value: ContractingApplication[K]) => void;
  onUpload: (file: File, type: string) => Promise<string | null>;
  onBack: () => void;
  onContinue: () => void;
  progressProps: ProgressProps;
}

export function TrainingStep({ application, onUpdate, onUpload, onBack, onContinue, progressProps }: TrainingStepProps) {
  const amlInputRef = useRef<HTMLInputElement>(null);
  const ceInputRef = useRef<HTMLInputElement>(null);
  const ltcInputRef = useRef<HTMLInputElement>(null);

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
              <GraduationCap className="h-3.5 w-3.5 text-primary" />
            </div>
            <h2 className="text-base font-semibold">Training & Certificates</h2>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5 max-w-md mx-auto leading-relaxed">
            Upload any certificates you have ready now. If something is missing, 
            you can continue and upload it later—our team will guide you.
          </p>
        </div>
        <CardContent className="space-y-3 py-3">
          {/* AML Training */}
          <div className="p-3 border rounded-lg space-y-2.5">
            <div>
              <h3 className="font-medium text-sm">AML (Anti-Money Laundering) Training</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Required for carrier appointments. Don't have your certificate yet? 
                You can continue setup and upload it before final submission.
              </p>
            </div>
            <div className="grid gap-3 grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="aml_training_provider" className="text-xs">Training Provider</Label>
                <Select
                  value={application.aml_training_provider || ''}
                  onValueChange={value => onUpdate('aml_training_provider', value)}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="limra">LIMRA</SelectItem>
                    <SelectItem value="carrier">Carrier Training</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="aml_completion_date" className="text-xs">Completion Date</Label>
                <Input
                  id="aml_completion_date"
                  type="date"
                  value={application.aml_completion_date || ''}
                  onChange={e => onUpdate('aml_completion_date', e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1">
              <input
                type="file"
                ref={amlInputRef}
                onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'aml_certificate')}
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => amlInputRef.current?.click()}
              >
                <Upload className="h-3 w-3 mr-1" />
                {application.uploaded_documents?.aml_certificate
                  ? '✓ AML certificate uploaded'
                  : 'Upload AML certificate'}
              </Button>
            </div>
          </div>

          {/* CE Training */}
          <div className="p-3 border rounded-lg space-y-2.5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h3 className="font-medium text-sm">Continuing Education (CE)</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Requirements vary by state. We'll confirm what's needed based on your license.
                </p>
              </div>
              <div className="flex items-center gap-1.5 pt-0.5">
                <Checkbox
                  id="state_requires_ce"
                  checked={application.state_requires_ce}
                  onCheckedChange={checked => onUpdate('state_requires_ce', !!checked)}
                  className="h-3.5 w-3.5"
                />
                <Label htmlFor="state_requires_ce" className="text-xs font-normal cursor-pointer whitespace-nowrap">
                  My state requires CE
                </Label>
              </div>
            </div>
            {application.state_requires_ce && (
              <div className="space-y-1">
                <input
                  type="file"
                  ref={ceInputRef}
                  onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'ce_certificate')}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => ceInputRef.current?.click()}
                >
                  <Upload className="h-3 w-3 mr-1" />
                  {application.uploaded_documents?.ce_certificate
                    ? '✓ CE certificate uploaded'
                    : 'Upload CE certificate'}
                </Button>
              </div>
            )}
          </div>

          {/* LTC Certification */}
          <div className="p-3 border rounded-lg space-y-2.5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h3 className="font-medium text-sm">Long-Term Care Partnership</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Only needed if you plan to sell long-term care products. Skip if not applicable.
                </p>
              </div>
              <div className="flex items-center gap-1.5 pt-0.5">
                <Checkbox
                  id="has_ltc_certification"
                  checked={application.has_ltc_certification}
                  onCheckedChange={checked => onUpdate('has_ltc_certification', !!checked)}
                  className="h-3.5 w-3.5"
                />
                <Label htmlFor="has_ltc_certification" className="text-xs font-normal cursor-pointer whitespace-nowrap">
                  I have LTC certification
                </Label>
              </div>
            </div>
            {application.has_ltc_certification && (
              <div className="space-y-1">
                <input
                  type="file"
                  ref={ltcInputRef}
                  onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'ltc_certificate')}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => ltcInputRef.current?.click()}
                >
                  <Upload className="h-3 w-3 mr-1" />
                  {application.uploaded_documents?.ltc_certificate
                    ? '✓ LTC certificate uploaded'
                    : 'Upload LTC certificate'}
                </Button>
              </div>
            )}
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
