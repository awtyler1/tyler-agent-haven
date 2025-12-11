import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ContractingApplication, US_STATES } from '@/types/contracting';
import { Shield, ChevronDown, Lock, CheckCircle2, ArrowRight, User, Building2, Eye, EyeOff, CalendarIcon } from 'lucide-react';
import { useState, useMemo, useRef } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { WizardProgress } from '../WizardProgress';
import { InitialsAcknowledgmentBar } from '../InitialsAcknowledgmentBar';
import { FileDropZone } from '../FileDropZone';
import { validateLicensing } from '@/hooks/useContractingValidation';
import { formatSSN, formatEIN, maskSSN, maskEIN } from '@/lib/formatters';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, parse } from 'date-fns';
import { cn } from '@/lib/utils';
import { FormFieldError, getFieldErrorClass } from '../FormFieldError';
import { ValidationBanner } from '../ValidationBanner';

interface ProgressProps {
  currentStep: number;
  completedSteps: number[];
  onStepClick: (step: number) => void;
}

interface LicensingStepProps {
  application: ContractingApplication;
  initials: string | null;
  onUpdate: <K extends keyof ContractingApplication>(field: K, value: ContractingApplication[K]) => void;
  onUpload: (file: File, type: string) => Promise<string | null>;
  onRemove: (type: string) => void;
  onBack: () => void;
  onContinue: () => void;
  progressProps: ProgressProps;
}

export function LicensingStep({ application, initials, onUpdate, onUpload, onRemove, onBack, onContinue, progressProps }: LicensingStepProps) {
  const [showNonResident, setShowNonResident] = useState(false);
  const [showTaxId, setShowTaxId] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const handleNonResidentStatesChange = (stateCode: string, checked: boolean) => {
    const current = application.non_resident_states || [];
    const updated = checked
      ? [...current, stateCode]
      : current.filter(s => s !== stateCode);
    onUpdate('non_resident_states', updated);
  };

  const handleFileUpload = async (file: File, type: string) => {
    await onUpload(file, type);
  };

  const hasLicenseUploaded = !!application.uploaded_documents?.insurance_license;
  const hasIdUploaded = !!application.uploaded_documents?.government_id;
  const documentsComplete = hasLicenseUploaded && hasIdUploaded;

  // Validation
  const validation = useMemo(() => validateLicensing(application), [application]);

  const handleContinue = () => {
    if (!validation.isValid) {
      setShowErrors(true);
      // Find first error field and scroll to it
      const firstErrorField = Object.keys(validation.fieldErrors)[0];
      if (firstErrorField && formRef.current) {
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
        <div className="pt-5 pb-4 text-center border-b border-border/20">
          <WizardProgress {...progressProps} compact />
          <div className="flex items-center justify-center gap-2.5 mt-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-xl font-semibold font-serif" style={{ letterSpacing: '0.015em' }}>Identity & Licensing</h2>
          </div>
          <p className="text-xs text-muted-foreground/60 mt-1.5">
            Required for carrier contracting and compliance.
          </p>
        </div>
        <CardContent className="space-y-4 py-5 px-7">
          
          {/* Section 1: Identity Verification */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground bg-primary/10 px-2 py-1 rounded">1</span>
              <h3 className="text-sm font-medium">Identity Verification</h3>
            </div>
            
            {/* Business Structure Selection */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onUpdate('is_corporation', false)}
                className={`flex items-center gap-2.5 p-3 rounded-lg border text-left transition-all ${
                  !application.is_corporation
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <User className={`h-4 w-4 ${!application.is_corporation ? 'text-primary' : 'text-muted-foreground'}`} />
                <p className={`text-sm font-medium ${!application.is_corporation ? 'text-foreground' : 'text-muted-foreground'}`}>
                  Individual / Sole Proprietor
                </p>
              </button>
              <button
                type="button"
                onClick={() => onUpdate('is_corporation', true)}
                className={`flex items-center gap-2.5 p-3 rounded-lg border text-left transition-all ${
                  application.is_corporation
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Building2 className={`h-4 w-4 ${application.is_corporation ? 'text-primary' : 'text-muted-foreground'}`} />
                <p className={`text-sm font-medium ${application.is_corporation ? 'text-foreground' : 'text-muted-foreground'}`}>
                  Corporation / Entity
                </p>
              </button>
            </div>

            {/* Core Identity Fields */}
            <div className={`grid gap-3 ${application.is_corporation ? 'grid-cols-3' : 'grid-cols-2'}`}>
              {application.is_corporation && (
                <div className="space-y-1.5" data-field="agency_name">
                  <Label htmlFor="agency_name" className="text-xs">Business Name *</Label>
                  <Input
                    id="agency_name"
                    value={application.agency_name || ''}
                    onChange={e => onUpdate('agency_name', e.target.value)}
                    placeholder="Agency name"
                    className={cn("h-9", getFieldErrorClass(!!validation.fieldErrors.agency_name, showErrors))}
                  />
                  <FormFieldError error={validation.fieldErrors.agency_name} show={showErrors} />
                </div>
              )}
              <div className="space-y-1.5" data-field="birth_date">
                <Label htmlFor="birth_date" className="text-xs">Date of Birth *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "h-9 w-full justify-start text-left font-normal",
                        !application.birth_date && "text-muted-foreground",
                        getFieldErrorClass(!!validation.fieldErrors.birth_date, showErrors)
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {application.birth_date ? format(parse(application.birth_date, 'yyyy-MM-dd', new Date()), 'MMM d, yyyy') : <span>Select date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={application.birth_date ? parse(application.birth_date, 'yyyy-MM-dd', new Date()) : undefined}
                      onSelect={(date) => onUpdate('birth_date', date ? format(date, 'yyyy-MM-dd') : '')}
                      disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                      initialFocus
                      captionLayout="dropdown-buttons"
                      fromYear={1930}
                      toYear={new Date().getFullYear()}
                    />
                  </PopoverContent>
                </Popover>
                <FormFieldError error={validation.fieldErrors.birth_date} show={showErrors} />
              </div>
              <div className="space-y-1.5" data-field="tax_id">
                <Label htmlFor="tax_id" className="text-xs">
                  {application.is_corporation ? 'EIN *' : 'SSN *'}
                </Label>
                <div className="relative">
                  <Input
                    id="tax_id"
                    value={showTaxId 
                      ? (application.is_corporation ? formatEIN(application.tax_id || '') : formatSSN(application.tax_id || ''))
                      : (application.tax_id ? (application.is_corporation ? maskEIN(application.tax_id) : maskSSN(application.tax_id)) : '')
                    }
                    onChange={e => {
                      const formatter = application.is_corporation ? formatEIN : formatSSN;
                      onUpdate('tax_id', formatter(e.target.value));
                    }}
                    onFocus={() => setShowTaxId(true)}
                    placeholder={application.is_corporation ? 'XX-XXXXXXX' : 'XXX-XX-XXXX'}
                    className={cn("h-9 pr-9", getFieldErrorClass(!!validation.fieldErrors.tax_id, showErrors))}
                  />
                  <button
                    type="button"
                    onClick={() => setShowTaxId(!showTaxId)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showTaxId ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <FormFieldError error={validation.fieldErrors.tax_id} show={showErrors} />
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Lock className="h-2.5 w-2.5" /> Securely encrypted
                </p>
              </div>
            </div>

            {/* Driver's License Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5" data-field="drivers_license_number">
                <Label htmlFor="drivers_license_number" className="text-xs">Driver's License # *</Label>
                <Input
                  id="drivers_license_number"
                  value={application.drivers_license_number || ''}
                  onChange={e => onUpdate('drivers_license_number', e.target.value)}
                  placeholder="Enter license number"
                  className={cn("h-9", getFieldErrorClass(!!validation.fieldErrors.drivers_license_number, showErrors))}
                />
                <FormFieldError error={validation.fieldErrors.drivers_license_number} show={showErrors} />
              </div>
              <div className="space-y-1.5" data-field="drivers_license_state">
                <Label htmlFor="drivers_license_state" className="text-xs">Driver's License State *</Label>
                <Select
                  value={application.drivers_license_state || ''}
                  onValueChange={value => onUpdate('drivers_license_state', value)}
                >
                  <SelectTrigger className={cn("h-9", getFieldErrorClass(!!validation.fieldErrors.drivers_license_state, showErrors))}>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map(state => (
                      <SelectItem key={state.code} value={state.code}>{state.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormFieldError error={validation.fieldErrors.drivers_license_state} show={showErrors} />
              </div>
            </div>

          </div>

          {/* Section 2: Insurance Licensing */}
          <div className="space-y-3 pt-4 border-t border-border/50">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground bg-primary/10 px-2 py-1 rounded">2</span>
              <h3 className="text-sm font-medium">Insurance Licensing</h3>
            </div>
            
            {/* All licensing fields */}
            <div className="grid grid-cols-4 gap-3">
              <div className="space-y-1.5" data-field="npn_number">
                <Label htmlFor="npn_number" className="text-xs">NPN Number *</Label>
                <Input
                  id="npn_number"
                  value={application.npn_number || ''}
                  onChange={e => onUpdate('npn_number', e.target.value)}
                  placeholder="12345678"
                  className={cn("h-9", getFieldErrorClass(!!validation.fieldErrors.npn_number, showErrors))}
                />
                <FormFieldError error={validation.fieldErrors.npn_number} show={showErrors} />
              </div>
              <div className="space-y-1.5" data-field="insurance_license_number">
                <Label htmlFor="insurance_license_number" className="text-xs">Resident License # *</Label>
                <Input
                  id="insurance_license_number"
                  value={application.insurance_license_number || ''}
                  onChange={e => onUpdate('insurance_license_number', e.target.value)}
                  placeholder="ABC123456"
                  className={cn("h-9", getFieldErrorClass(!!validation.fieldErrors.insurance_license_number, showErrors))}
                />
                <FormFieldError error={validation.fieldErrors.insurance_license_number} show={showErrors} />
              </div>
              <div className="space-y-1.5" data-field="resident_state">
                <Label htmlFor="resident_state" className="text-xs">Resident State *</Label>
                <Select
                  value={application.resident_state || ''}
                  onValueChange={value => onUpdate('resident_state', value)}
                >
                  <SelectTrigger className={cn("h-9", getFieldErrorClass(!!validation.fieldErrors.resident_state, showErrors))}>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map(state => (
                      <SelectItem key={state.code} value={state.code}>{state.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormFieldError error={validation.fieldErrors.resident_state} show={showErrors} />
              </div>
              <div className="space-y-1.5" data-field="license_expiration_date">
                <Label htmlFor="license_expiration_date" className="text-xs">Expiration *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "h-9 w-full justify-start text-left font-normal",
                        !application.license_expiration_date && "text-muted-foreground",
                        getFieldErrorClass(!!validation.fieldErrors.license_expiration_date, showErrors)
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {application.license_expiration_date ? format(parse(application.license_expiration_date, 'yyyy-MM-dd', new Date()), 'MMM d, yyyy') : <span>Select</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={application.license_expiration_date ? parse(application.license_expiration_date, 'yyyy-MM-dd', new Date()) : undefined}
                      onSelect={(date) => onUpdate('license_expiration_date', date ? format(date, 'yyyy-MM-dd') : '')}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      captionLayout="dropdown-buttons"
                      fromYear={new Date().getFullYear()}
                      toYear={new Date().getFullYear() + 10}
                    />
                  </PopoverContent>
                </Popover>
                <FormFieldError error={validation.fieldErrors.license_expiration_date} show={showErrors} />
              </div>
            </div>

            {/* Non-Resident States */}
            <Collapsible open={showNonResident} onOpenChange={setShowNonResident}>
              <CollapsibleTrigger className="flex items-center gap-1.5 text-xs text-muted-foreground/70 hover:text-muted-foreground">
                <ChevronDown className={`h-3 w-3 transition-transform ${showNonResident ? 'rotate-180' : ''}`} />
                <span>Non-resident licenses</span>
                <span className="text-[10px] text-muted-foreground/50 italic">optional</span>
                {(application.non_resident_states?.length || 0) > 0 && (
                  <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded ml-1">
                    {application.non_resident_states?.length} selected
                  </span>
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <div className="grid grid-cols-10 gap-1 p-3 border rounded-lg bg-muted/20">
                  {US_STATES.filter(s => s.code !== application.resident_state).map(state => (
                    <label key={state.code} className="flex items-center gap-1 text-[10px] cursor-pointer">
                      <Checkbox
                        checked={application.non_resident_states?.includes(state.code)}
                        onCheckedChange={checked => handleNonResidentStatesChange(state.code, !!checked)}
                        className="h-3 w-3"
                      />
                      {state.code}
                    </label>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Section 3: Document Uploads */}
          <div className="space-y-3 pt-4 border-t border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground bg-primary/10 px-2 py-1 rounded">3</span>
                <h3 className="text-sm font-medium">Documents</h3>
              </div>
              {documentsComplete && (
                <span className="text-xs text-primary flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Complete
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5" data-field="insurance_license">
                <Label className="text-xs">License Copy *</Label>
                <FileDropZone
                  onFileSelect={(file) => handleFileUpload(file, 'insurance_license')}
                  onRemove={() => onRemove('insurance_license')}
                  isUploaded={hasLicenseUploaded}
                  uploadedLabel="Uploaded"
                  defaultLabel="Upload"
                  hasError={showErrors && !!validation.fieldErrors.insurance_license}
                />
                <FormFieldError error={validation.fieldErrors.insurance_license} show={showErrors} />
              </div>
              <div className="space-y-1.5" data-field="government_id">
                <Label className="text-xs">Government ID *</Label>
                <FileDropZone
                  onFileSelect={(file) => handleFileUpload(file, 'government_id')}
                  onRemove={() => onRemove('government_id')}
                  isUploaded={hasIdUploaded}
                  uploadedLabel="Uploaded"
                  defaultLabel="Upload"
                  hasError={showErrors && !!validation.fieldErrors.government_id}
                />
                <FormFieldError error={validation.fieldErrors.government_id} show={showErrors} />
              </div>
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
              <span className="text-foreground/70">Next: Background Questions</span>
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
