import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ContractingApplication, US_STATES } from '@/types/contracting';
import { Shield, Upload, ChevronDown, Lock, CheckCircle2, ArrowRight, User, Building2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { WizardProgress } from '../WizardProgress';

interface ProgressProps {
  currentStep: number;
  completedSteps: number[];
  onStepClick: (step: number) => void;
}

interface LicensingStepProps {
  application: ContractingApplication;
  onUpdate: <K extends keyof ContractingApplication>(field: K, value: ContractingApplication[K]) => void;
  onUpload: (file: File, type: string) => Promise<string | null>;
  onBack: () => void;
  onContinue: () => void;
  progressProps: ProgressProps;
}

export function LicensingStep({ application, onUpdate, onUpload, onBack, onContinue, progressProps }: LicensingStepProps) {
  const [showNonResident, setShowNonResident] = useState(false);
  const [showOptionalIdentity, setShowOptionalIdentity] = useState(
    !!(application.gender || application.drivers_license_number)
  );
  const licenseInputRef = useRef<HTMLInputElement>(null);
  const idInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="border-0 shadow-lg">
        {/* Progress + Header */}
        <div className="pt-4 pb-3 text-center border-b border-border/30">
          <WizardProgress {...progressProps} compact />
          <div className="flex items-center justify-center gap-2.5 mt-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">Identity & Licensing</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Required for carrier contracting and compliance.
          </p>
        </div>
        <CardContent className="space-y-4 py-5 px-6">
          
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
                  Individual
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
                <div className="space-y-1.5">
                  <Label htmlFor="agency_name" className="text-xs">Business Name *</Label>
                  <Input
                    id="agency_name"
                    value={application.agency_name || ''}
                    onChange={e => onUpdate('agency_name', e.target.value)}
                    placeholder="Agency name"
                    className="h-9"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="birth_date" className="text-xs">Date of Birth *</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={application.birth_date || ''}
                  onChange={e => onUpdate('birth_date', e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tax_id" className="text-xs">
                  {application.is_corporation ? 'EIN *' : 'SSN *'}
                </Label>
                <Input
                  id="tax_id"
                  value={application.tax_id || ''}
                  onChange={e => onUpdate('tax_id', e.target.value)}
                  placeholder={application.is_corporation ? 'XX-XXXXXXX' : 'XXX-XX-XXXX'}
                  className="h-9"
                />
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Lock className="h-2.5 w-2.5" /> Securely encrypted
                </p>
              </div>
            </div>

            {/* Optional Identity Fields */}
            <Collapsible open={showOptionalIdentity} onOpenChange={setShowOptionalIdentity}>
              <CollapsibleTrigger className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                <ChevronDown className={`h-3 w-3 transition-transform ${showOptionalIdentity ? 'rotate-180' : ''}`} />
                Additional fields (gender, DL)
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-muted/20 border border-border/30">
                  <div className="space-y-1.5">
                    <Label htmlFor="gender" className="text-xs text-muted-foreground">Gender</Label>
                    <Select value={application.gender || ''} onValueChange={value => onUpdate('gender', value)}>
                      <SelectTrigger className="h-9 bg-background">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="drivers_license_number" className="text-xs text-muted-foreground">DL #</Label>
                    <Input
                      id="drivers_license_number"
                      value={application.drivers_license_number || ''}
                      onChange={e => onUpdate('drivers_license_number', e.target.value)}
                      className="h-9 bg-background"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="drivers_license_state" className="text-xs text-muted-foreground">DL State</Label>
                    <Select
                      value={application.drivers_license_state || ''}
                      onValueChange={value => onUpdate('drivers_license_state', value)}
                    >
                      <SelectTrigger className="h-9 bg-background">
                        <SelectValue placeholder="State" />
                      </SelectTrigger>
                      <SelectContent>
                        {US_STATES.map(state => (
                          <SelectItem key={state.code} value={state.code}>{state.code}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Section 2: Insurance Licensing */}
          <div className="space-y-3 pt-4 border-t border-border/50">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground bg-primary/10 px-2 py-1 rounded">2</span>
              <h3 className="text-sm font-medium">Insurance Licensing</h3>
            </div>
            
            {/* All licensing fields */}
            <div className="grid grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="npn_number" className="text-xs">NPN *</Label>
                <Input
                  id="npn_number"
                  value={application.npn_number || ''}
                  onChange={e => onUpdate('npn_number', e.target.value)}
                  placeholder="12345678"
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="insurance_license_number" className="text-xs">Resident License # *</Label>
                <Input
                  id="insurance_license_number"
                  value={application.insurance_license_number || ''}
                  onChange={e => onUpdate('insurance_license_number', e.target.value)}
                  placeholder="ABC123456"
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="resident_state" className="text-xs">Resident State *</Label>
                <Select
                  value={application.resident_state || ''}
                  onValueChange={value => onUpdate('resident_state', value)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map(state => (
                      <SelectItem key={state.code} value={state.code}>{state.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="license_expiration_date" className="text-xs">Expiration *</Label>
                <Input
                  id="license_expiration_date"
                  type="date"
                  value={application.license_expiration_date || ''}
                  onChange={e => onUpdate('license_expiration_date', e.target.value)}
                  className="h-9"
                />
              </div>
            </div>

            {/* Non-Resident States */}
            <Collapsible open={showNonResident} onOpenChange={setShowNonResident}>
              <CollapsibleTrigger className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                <ChevronDown className={`h-3 w-3 transition-transform ${showNonResident ? 'rotate-180' : ''}`} />
                Non-resident licenses
                {(application.non_resident_states?.length || 0) > 0 && (
                  <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded ml-1">
                    {application.non_resident_states?.length}
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
              <div className="space-y-1.5">
                <Label className="text-xs">License Copy *</Label>
                <input
                  type="file"
                  ref={licenseInputRef}
                  onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'insurance_license')}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                />
                <Button
                  variant={hasLicenseUploaded ? "secondary" : "outline"}
                  className={`w-full justify-start h-9 ${hasLicenseUploaded ? 'text-primary border-primary/30' : ''}`}
                  onClick={() => licenseInputRef.current?.click()}
                >
                  {hasLicenseUploaded ? (
                    <><CheckCircle2 className="h-4 w-4 mr-2 text-primary" />Uploaded</>
                  ) : (
                    <><Upload className="h-4 w-4 mr-2" />Upload</>
                  )}
                </Button>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Government ID *</Label>
                <input
                  type="file"
                  ref={idInputRef}
                  onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'government_id')}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                />
                <Button
                  variant={hasIdUploaded ? "secondary" : "outline"}
                  className={`w-full justify-start h-9 ${hasIdUploaded ? 'text-primary border-primary/30' : ''}`}
                  onClick={() => idInputRef.current?.click()}
                >
                  {hasIdUploaded ? (
                    <><CheckCircle2 className="h-4 w-4 mr-2 text-primary" />Uploaded</>
                  ) : (
                    <><Upload className="h-4 w-4 mr-2" />Upload</>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button variant="ghost" onClick={onBack} className="text-muted-foreground">
              Back
            </Button>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <ArrowRight className="h-3 w-3" />
              <span className="text-foreground/70">Next: Background</span>
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
