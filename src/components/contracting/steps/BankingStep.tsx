import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ContractingApplication } from '@/types/contracting';
import { Landmark, Shield, ArrowRight, CalendarIcon } from 'lucide-react';
import { useMemo, useState, useRef } from 'react';
import { WizardProgress } from '../WizardProgress';
import { InitialsAcknowledgmentBar } from '../InitialsAcknowledgmentBar';
import { FileDropZone } from '../FileDropZone';
import { validateBanking } from '@/hooks/useContractingValidation';
import { FormFieldError, getFieldErrorClass } from '../FormFieldError';
import { ValidationBanner } from '../ValidationBanner';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, parse } from 'date-fns';

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
  const predefinedRelationships = ['Spouse', 'Child', 'Parent', 'Sibling', 'Grandchild', 'Domestic Partner', 'Trust', 'Estate'];
  const isOtherRelationship = application.beneficiary_relationship && !predefinedRelationships.includes(application.beneficiary_relationship);
  const [showOtherInput, setShowOtherInput] = useState(isOtherRelationship);
  const [showErrors, setShowErrors] = useState(false);
  const firstErrorRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File, type: string) => {
    await onUpload(file, type);
  };

  // Validation
  const validation = useMemo(() => validateBanking(application), [application]);
  const { fieldErrors } = validation;

  const handleContinue = () => {
    if (!validation.isValid) {
      setShowErrors(true);
      setTimeout(() => {
        firstErrorRef.current?.focus();
        firstErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return;
    }
    onContinue();
  };

  const handleRelationshipChange = (value: string) => {
    if (value === 'Other') {
      setShowOtherInput(true);
      onUpdate('beneficiary_relationship', '');
    } else {
      setShowOtherInput(false);
      onUpdate('beneficiary_relationship', value);
    }
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
          {/* Section 1: Bank Details */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Bank Details</p>
            <div className="grid gap-4 grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="bank_routing_number" className="text-sm">Routing Number *</Label>
                <Input
                  ref={fieldErrors.bank_routing_number ? firstErrorRef : undefined}
                  id="bank_routing_number"
                  value={application.bank_routing_number || ''}
                  onChange={e => onUpdate('bank_routing_number', e.target.value.replace(/\D/g, '').slice(0, 9))}
                  placeholder="123456789"
                  maxLength={9}
                  className={cn("h-9", getFieldErrorClass(!!fieldErrors.bank_routing_number, showErrors))}
                />
                {showErrors && fieldErrors.bank_routing_number ? (
                  <FormFieldError error={fieldErrors.bank_routing_number} />
                ) : (
                  <p className="text-[10px] text-muted-foreground/70">9-digit number</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bank_account_number" className="text-sm">Account Number *</Label>
                <Input
                  ref={!fieldErrors.bank_routing_number && fieldErrors.bank_account_number ? firstErrorRef : undefined}
                  id="bank_account_number"
                  value={application.bank_account_number || ''}
                  onChange={e => onUpdate('bank_account_number', e.target.value)}
                  placeholder="1234567890"
                  className={cn("h-9", getFieldErrorClass(!!fieldErrors.bank_account_number, showErrors))}
                />
                <FormFieldError error={fieldErrors.bank_account_number} show={showErrors} />
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

          {/* Section 2: Beneficiary */}
          <div className="space-y-3 pt-2 border-t border-border/30">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">List a Beneficiary</p>
            <div className="grid gap-3 grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="beneficiary_name" className="text-sm">Beneficiary Name</Label>
                <Input
                  id="beneficiary_name"
                  value={application.beneficiary_name || ''}
                  onChange={e => onUpdate('beneficiary_name', e.target.value)}
                  placeholder="John Doe"
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="beneficiary_relationship" className="text-sm">Relationship</Label>
                <Select
                  value={showOtherInput ? 'Other' : (application.beneficiary_relationship || '')}
                  onValueChange={handleRelationshipChange}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    <SelectItem value="Spouse">Spouse</SelectItem>
                    <SelectItem value="Child">Child</SelectItem>
                    <SelectItem value="Parent">Parent</SelectItem>
                    <SelectItem value="Sibling">Sibling</SelectItem>
                    <SelectItem value="Grandchild">Grandchild</SelectItem>
                    <SelectItem value="Domestic Partner">Domestic Partner</SelectItem>
                    <SelectItem value="Trust">Trust</SelectItem>
                    <SelectItem value="Estate">Estate</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {showOtherInput && (
                  <Input
                    id="beneficiary_relationship_other"
                    value={application.beneficiary_relationship || ''}
                    onChange={e => onUpdate('beneficiary_relationship', e.target.value)}
                    placeholder="Specify relationship"
                    className="h-9 mt-2"
                  />
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="beneficiary_birth_date" className="text-sm">Date of Birth</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "h-9 w-full justify-start text-left font-normal",
                        !application.beneficiary_birth_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {application.beneficiary_birth_date ? format(parse(application.beneficiary_birth_date, 'yyyy-MM-dd', new Date()), 'MMM d, yyyy') : <span>Select date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={application.beneficiary_birth_date ? parse(application.beneficiary_birth_date, 'yyyy-MM-dd', new Date()) : undefined}
                      onSelect={(date) => onUpdate('beneficiary_birth_date', date ? format(date, 'yyyy-MM-dd') : null)}
                      disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                      initialFocus
                      captionLayout="dropdown-buttons"
                      fromYear={1930}
                      toYear={new Date().getFullYear()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Section 3: Account verification */}
          <div className="space-y-3 pt-2 border-t border-border/30">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Account Verification *</p>
                <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                  Prevents payment errors and confirms account ownership.
                </p>
              </div>
            </div>
            <div className={cn(showErrors && fieldErrors.voided_check && "ring-1 ring-destructive rounded-lg")}>
              <FileDropZone
                onFileSelect={(file) => handleFileUpload(file, 'voided_check')}
                onRemove={() => onRemove('voided_check')}
                isUploaded={!!application.uploaded_documents?.voided_check}
                uploadedLabel="Voided check uploaded"
                defaultLabel="Upload voided check or bank letter"
              />
            </div>
            <FormFieldError error={fieldErrors.voided_check} show={showErrors} />
          </div>

          {/* Commission advancing option */}
          <div className="pt-2 border-t border-border/30">
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Requesting Commission Advancing? <span className="text-destructive">*</span></Label>
                <p className="text-[10px] text-muted-foreground/70 leading-relaxed mt-0.5">
                  Receive a portion of your commission upfront when policies are issued, rather than waiting for the standard payment cycle.
                </p>
              </div>
              <RadioGroup
                value={application.requesting_commission_advancing === true ? 'yes' : 'no'}
                onValueChange={(value) => onUpdate('requesting_commission_advancing', value === 'yes')}
                className="flex gap-6"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="yes" id="step_commission_yes" />
                  <Label htmlFor="step_commission_yes" className="text-sm font-normal cursor-pointer">Yes</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="no" id="step_commission_no" />
                  <Label htmlFor="step_commission_no" className="text-sm font-normal cursor-pointer">No</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* Validation Banner */}
          <ValidationBanner show={showErrors && !validation.isValid} />

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
            <Button onClick={handleContinue}>
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
