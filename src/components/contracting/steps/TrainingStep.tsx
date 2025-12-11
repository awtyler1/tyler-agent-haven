import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ContractingApplication } from '@/types/contracting';
import { GraduationCap, Upload, Shield, ArrowRight } from 'lucide-react';
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
  const eoInputRef = useRef<HTMLInputElement>(null);

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
            Upload any certificates you have ready now. Missing something? Continue and upload later.
          </p>
        </div>

        <CardContent className="space-y-3 py-3 px-4">
          {/* Two column layout for AML and CE */}
          <div className="grid grid-cols-2 gap-3">
            {/* AML Training */}
            <div className="p-3 border rounded-lg space-y-2">
              <div>
                <h3 className="font-medium text-sm">AML Training</h3>
                <p className="text-[10px] text-muted-foreground">Required for carrier appointments.</p>
              </div>
              <div className="grid gap-2 grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="aml_training_provider" className="text-[10px]">Provider</Label>
                  <Select
                    value={application.aml_training_provider || ''}
                    onValueChange={value => onUpdate('aml_training_provider', value)}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="limra">LIMRA</SelectItem>
                      <SelectItem value="carrier">Carrier</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="aml_completion_date" className="text-[10px]">Completion</Label>
                  <Input
                    id="aml_completion_date"
                    type="date"
                    value={application.aml_completion_date || ''}
                    onChange={e => onUpdate('aml_completion_date', e.target.value)}
                    className="h-7 text-xs"
                  />
                </div>
              </div>
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
                className="h-6 text-[10px] w-full"
                onClick={() => amlInputRef.current?.click()}
              >
                <Upload className="h-2.5 w-2.5 mr-1" />
                {application.uploaded_documents?.aml_certificate ? '✓ Uploaded' : 'Upload certificate'}
              </Button>
            </div>

            {/* CE Training */}
            <div className="p-3 border rounded-lg space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-medium text-sm">Continuing Education</h3>
                  <p className="text-[10px] text-muted-foreground">Requirements vary by state.</p>
                </div>
                <div className="flex items-center gap-1 pt-0.5">
                  <Checkbox
                    id="state_requires_ce"
                    checked={application.state_requires_ce}
                    onCheckedChange={checked => onUpdate('state_requires_ce', !!checked)}
                    className="h-3 w-3"
                  />
                  <Label htmlFor="state_requires_ce" className="text-[10px] cursor-pointer">Required</Label>
                </div>
              </div>
              {application.state_requires_ce && (
                <>
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
                    className="h-6 text-[10px] w-full"
                    onClick={() => ceInputRef.current?.click()}
                  >
                    <Upload className="h-2.5 w-2.5 mr-1" />
                    {application.uploaded_documents?.ce_certificate ? '✓ Uploaded' : 'Upload CE certificate'}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Two column layout for LTC and E&O */}
          <div className="grid grid-cols-2 gap-3">
            {/* LTC Certification */}
            <div className="p-3 border rounded-lg space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-medium text-sm">Long-Term Care</h3>
                  <p className="text-[10px] text-muted-foreground">Only if selling LTC products.</p>
                </div>
                <div className="flex items-center gap-1 pt-0.5">
                  <Checkbox
                    id="has_ltc_certification"
                    checked={application.has_ltc_certification}
                    onCheckedChange={checked => onUpdate('has_ltc_certification', !!checked)}
                    className="h-3 w-3"
                  />
                  <Label htmlFor="has_ltc_certification" className="text-[10px] cursor-pointer">I have LTC</Label>
                </div>
              </div>
              {application.has_ltc_certification && (
                <>
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
                    className="h-6 text-[10px] w-full"
                    onClick={() => ltcInputRef.current?.click()}
                  >
                    <Upload className="h-2.5 w-2.5 mr-1" />
                    {application.uploaded_documents?.ltc_certificate ? '✓ Uploaded' : 'Upload LTC certificate'}
                  </Button>
                </>
              )}
            </div>

            {/* E&O Insurance */}
            <div className="p-3 border rounded-lg space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                  <h3 className="font-medium text-sm">E&O Insurance</h3>
                </div>
                <div className="flex items-center gap-1 pt-0.5">
                  <Checkbox
                    id="eo_not_yet_covered"
                    checked={application.eo_not_yet_covered}
                    onCheckedChange={checked => onUpdate('eo_not_yet_covered', !!checked)}
                    className="h-3 w-3"
                  />
                  <Label htmlFor="eo_not_yet_covered" className="text-[10px] cursor-pointer">Not yet</Label>
                </div>
              </div>
              
              {application.eo_not_yet_covered ? (
                <p className="text-[10px] text-muted-foreground bg-muted/30 rounded p-2">
                  No problem—we'll help you get covered before appointments are finalized.
                </p>
              ) : (
                <>
                  <div className="grid gap-2 grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-[10px]">Provider</Label>
                      <Input
                        value={application.eo_provider || ''}
                        onChange={e => onUpdate('eo_provider', e.target.value)}
                        placeholder="e.g. Hiscox"
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Policy #</Label>
                      <Input
                        value={application.eo_policy_number || ''}
                        onChange={e => onUpdate('eo_policy_number', e.target.value)}
                        placeholder="Optional"
                        className="h-7 text-xs"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 space-y-1">
                      <Label className="text-[10px]">Expiration</Label>
                      <Input
                        type="date"
                        value={application.eo_expiration_date || ''}
                        onChange={e => onUpdate('eo_expiration_date', e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="flex-1 pt-4">
                      <input
                        type="file"
                        ref={eoInputRef}
                        onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'eo_certificate')}
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10px] w-full"
                        onClick={() => eoInputRef.current?.click()}
                      >
                        <Upload className="h-2.5 w-2.5 mr-1" />
                        {application.uploaded_documents?.eo_certificate ? '✓ Uploaded' : 'Upload'}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* E&O helper text */}
          <p className="text-[10px] text-muted-foreground text-center px-4">
            E&O coverage is required by most carriers before appointments. Don't have it yet? Continue now—we'll follow up.
          </p>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2">
            <Button variant="ghost" onClick={onBack} className="text-muted-foreground">
              Back
            </Button>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <ArrowRight className="h-3 w-3" />
              <span className="text-foreground/70">Next: Carrier Selection</span>
            </p>
            <Button onClick={onContinue}>
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
