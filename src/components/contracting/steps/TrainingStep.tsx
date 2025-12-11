import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ContractingApplication } from '@/types/contracting';
import { GraduationCap, Shield, ArrowRight, BookOpen, Heart } from 'lucide-react';
import { WizardProgress } from '../WizardProgress';
import { InitialsAcknowledgmentBar } from '../InitialsAcknowledgmentBar';
import { FileDropZone } from '../FileDropZone';

interface ProgressProps {
  currentStep: number;
  completedSteps: number[];
  onStepClick: (step: number) => void;
}

interface TrainingStepProps {
  application: ContractingApplication;
  initials: string | null;
  onUpdate: <K extends keyof ContractingApplication>(field: K, value: ContractingApplication[K]) => void;
  onUpload: (file: File, type: string) => Promise<string | null>;
  onBack: () => void;
  onContinue: () => void;
  progressProps: ProgressProps;
}

export function TrainingStep({ application, initials, onUpdate, onUpload, onBack, onContinue, progressProps }: TrainingStepProps) {

  const handleFileUpload = async (file: File, type: string) => {
    await onUpload(file, type);
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
              <GraduationCap className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-xl font-semibold font-serif" style={{ letterSpacing: '0.015em' }}>Training & Certificates</h2>
          </div>
          <p className="text-xs text-muted-foreground/60 mt-1.5 max-w-lg mx-auto">
            Upload certificates you have ready now. Missing something? No problem—continue and our team will help you complete anything outstanding.
          </p>
        </div>

        <CardContent className="py-4 px-6">
          {/* Main grid - 4 items in a row */}
          <div className="grid grid-cols-4 gap-4">
            {/* AML Training */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium text-sm">AML Training</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-tight">
                Required before appointments. Upload now or later.
              </p>
              <Select
                value={application.aml_training_provider || ''}
                onValueChange={value => onUpdate('aml_training_provider', value)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="limra">LIMRA</SelectItem>
                  <SelectItem value="carrier">Carrier</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={application.aml_completion_date || ''}
                onChange={e => onUpdate('aml_completion_date', e.target.value)}
                className="h-8 text-xs"
                placeholder="Completion date"
              />
              <FileDropZone
                onFileSelect={(file) => handleFileUpload(file, 'aml_certificate')}
                isUploaded={!!application.uploaded_documents?.aml_certificate}
                uploadedLabel="✓ Uploaded"
                defaultLabel="Upload"
                compact
              />
            </div>

            {/* CE Training */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium text-sm">CE Credits</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-tight">
                Requirements vary by state. We'll confirm what applies to you.
              </p>
              <div className="flex items-center gap-2 h-8 px-2 border rounded-md bg-muted/20">
                <Checkbox
                  id="state_requires_ce"
                  checked={application.state_requires_ce}
                  onCheckedChange={checked => onUpdate('state_requires_ce', !!checked)}
                  className="h-3.5 w-3.5"
                />
                <Label htmlFor="state_requires_ce" className="text-xs cursor-pointer">
                  My state requires CE
                </Label>
              </div>
              {application.state_requires_ce && (
                <FileDropZone
                  onFileSelect={(file) => handleFileUpload(file, 'ce_certificate')}
                  isUploaded={!!application.uploaded_documents?.ce_certificate}
                  uploadedLabel="✓ Uploaded"
                  defaultLabel="Upload CE"
                  compact
                />
              )}
            </div>

            {/* LTC Certification */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium text-sm">LTC Cert</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-tight">
                Only needed if you plan to sell long-term care products.
              </p>
              <div className="flex items-center gap-2 h-8 px-2 border rounded-md bg-muted/20">
                <Checkbox
                  id="has_ltc_certification"
                  checked={application.has_ltc_certification}
                  onCheckedChange={checked => onUpdate('has_ltc_certification', !!checked)}
                  className="h-3.5 w-3.5"
                />
                <Label htmlFor="has_ltc_certification" className="text-xs cursor-pointer">
                  I have LTC cert
                </Label>
              </div>
              {application.has_ltc_certification && (
                <FileDropZone
                  onFileSelect={(file) => handleFileUpload(file, 'ltc_certificate')}
                  isUploaded={!!application.uploaded_documents?.ltc_certificate}
                  uploadedLabel="✓ Uploaded"
                  defaultLabel="Upload LTC"
                  compact
                />
              )}
            </div>

            {/* E&O Insurance */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium text-sm">E&O Insurance</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-tight">
                Required by most carriers. We'll help if you need coverage.
              </p>
              <div className="flex items-center gap-2 h-8 px-2 border rounded-md bg-muted/20">
                <Checkbox
                  id="eo_not_yet_covered"
                  checked={application.eo_not_yet_covered}
                  onCheckedChange={checked => onUpdate('eo_not_yet_covered', !!checked)}
                  className="h-3.5 w-3.5"
                />
                <Label htmlFor="eo_not_yet_covered" className="text-xs cursor-pointer">
                  Not yet covered
                </Label>
              </div>
              {!application.eo_not_yet_covered && (
                <>
                  <Input
                    value={application.eo_provider || ''}
                    onChange={e => onUpdate('eo_provider', e.target.value)}
                    placeholder="Provider (e.g. Hiscox)"
                    className="h-8 text-xs"
                  />
                  <FileDropZone
                    onFileSelect={(file) => handleFileUpload(file, 'eo_certificate')}
                    isUploaded={!!application.uploaded_documents?.eo_certificate}
                    uploadedLabel="✓ Uploaded"
                    defaultLabel="Upload"
                    compact
                  />
                </>
              )}
            </div>
          </div>

          {/* Helper text */}
          <p className="text-xs text-muted-foreground text-center mt-5 mb-4">
            You can continue without completing this step. We'll follow up on anything needed before appointments are finalized.
          </p>

          {/* Initials Acknowledgment */}
          <InitialsAcknowledgmentBar initials={initials} />

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2 border-t border-border/30">
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
