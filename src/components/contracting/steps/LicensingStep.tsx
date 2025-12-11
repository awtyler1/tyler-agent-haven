import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ContractingApplication, US_STATES } from '@/types/contracting';
import { Shield, Upload, ChevronDown, Lock, CheckCircle2, ArrowRight, User, Building2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface LicensingStepProps {
  application: ContractingApplication;
  onUpdate: <K extends keyof ContractingApplication>(field: K, value: ContractingApplication[K]) => void;
  onUpload: (file: File, type: string) => Promise<string | null>;
  onBack: () => void;
  onContinue: () => void;
}

export function LicensingStep({ application, onUpdate, onUpload, onBack, onContinue }: LicensingStepProps) {
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
    <div className="max-w-2xl mx-auto">
      <Card className="border-0 shadow-lg">
        <CardHeader className="py-3 text-center">
          <div className="mx-auto w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center mb-1">
            <Shield className="h-4 w-4 text-primary" />
          </div>
          <CardTitle className="text-lg">Identity & Licensing</CardTitle>
          <CardDescription className="text-xs">
            Required for carrier contracting and compliance verification.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pb-4">
          
          {/* Section 1: Identity Verification */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground bg-primary/10 px-2 py-0.5 rounded">1</span>
              <h3 className="text-sm font-medium">Identity Verification</h3>
            </div>
            
            {/* Business Structure Selection */}
            <div className="space-y-1.5">
              <Label className="text-xs">Business Structure *</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onUpdate('is_corporation', false)}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all ${
                    !application.is_corporation
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border hover:border-primary/50 hover:bg-muted/30'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                    !application.is_corporation ? 'bg-primary/10' : 'bg-muted'
                  }`}>
                    <User className={`h-3.5 w-3.5 ${!application.is_corporation ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className={`text-xs font-medium ${!application.is_corporation ? 'text-foreground' : 'text-muted-foreground'}`}>
                      Individual / Sole Proprietor
                    </p>
                    <p className="text-[10px] text-muted-foreground">Personal SSN required</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => onUpdate('is_corporation', true)}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all ${
                    application.is_corporation
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border hover:border-primary/50 hover:bg-muted/30'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                    application.is_corporation ? 'bg-primary/10' : 'bg-muted'
                  }`}>
                    <Building2 className={`h-3.5 w-3.5 ${application.is_corporation ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className={`text-xs font-medium ${application.is_corporation ? 'text-foreground' : 'text-muted-foreground'}`}>
                      Corporation / Business Entity
                    </p>
                    <p className="text-[10px] text-muted-foreground">Business EIN required</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Agency Name - Only show for corporations */}
            {application.is_corporation && (
              <div className="space-y-1 animate-fade-in">
                <Label htmlFor="agency_name" className="text-xs">Business / Agency Name *</Label>
                <Input
                  id="agency_name"
                  value={application.agency_name || ''}
                  onChange={e => onUpdate('agency_name', e.target.value)}
                  placeholder="Your business or agency name"
                  className="h-8 text-sm"
                />
              </div>
            )}
            
            {/* Core Identity Fields */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="birth_date" className="text-xs">Date of Birth *</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={application.birth_date || ''}
                  onChange={e => onUpdate('birth_date', e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="tax_id" className="text-xs">
                  {application.is_corporation ? 'Tax ID (EIN) *' : 'Social Security Number *'}
                </Label>
                <Input
                  id="tax_id"
                  value={application.tax_id || ''}
                  onChange={e => onUpdate('tax_id', e.target.value)}
                  placeholder={application.is_corporation ? 'XX-XXXXXXX' : 'XXX-XX-XXXX'}
                  className="h-8 text-sm"
                />
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Lock className="h-2.5 w-2.5" />
                  {application.is_corporation 
                    ? 'Your business EIN for carrier contracting. Securely encrypted.'
                    : 'Used only for contracting. Securely encrypted.'
                  }
                </p>
              </div>
            </div>

            {/* Optional Identity Fields - Progressive Disclosure */}
            <Collapsible open={showOptionalIdentity} onOpenChange={setShowOptionalIdentity}>
              <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <ChevronDown className={`h-3 w-3 transition-transform ${showOptionalIdentity ? 'rotate-180' : ''}`} />
                {showOptionalIdentity ? 'Hide' : 'Show'} additional identity fields
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <div className="grid grid-cols-3 gap-2 p-2 rounded-lg bg-muted/20 border border-border/30">
                  <div className="space-y-1">
                    <Label htmlFor="gender" className="text-xs text-muted-foreground">Gender</Label>
                    <Select value={application.gender || ''} onValueChange={value => onUpdate('gender', value)}>
                      <SelectTrigger className="h-8 text-sm bg-background">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="drivers_license_number" className="text-xs text-muted-foreground">Driver's License #</Label>
                    <Input
                      id="drivers_license_number"
                      value={application.drivers_license_number || ''}
                      onChange={e => onUpdate('drivers_license_number', e.target.value)}
                      placeholder="D12345678"
                      className="h-8 text-sm bg-background"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="drivers_license_state" className="text-xs text-muted-foreground">DL State</Label>
                    <Select
                      value={application.drivers_license_state || ''}
                      onValueChange={value => onUpdate('drivers_license_state', value)}
                    >
                      <SelectTrigger className="h-8 text-sm bg-background">
                        <SelectValue placeholder="Select" />
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
          <div className="space-y-2.5 pt-2 border-t border-border/50">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground bg-primary/10 px-2 py-0.5 rounded">2</span>
              <h3 className="text-sm font-medium">Insurance Licensing</h3>
            </div>
            
            {/* Core Licensing Fields */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="npn_number" className="text-xs">NPN Number *</Label>
                <Input
                  id="npn_number"
                  value={application.npn_number || ''}
                  onChange={e => onUpdate('npn_number', e.target.value)}
                  placeholder="12345678"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="insurance_license_number" className="text-xs">Resident License # *</Label>
                <Input
                  id="insurance_license_number"
                  value={application.insurance_license_number || ''}
                  onChange={e => onUpdate('insurance_license_number', e.target.value)}
                  placeholder="ABC123456"
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="resident_state" className="text-xs">Resident State *</Label>
                <Select
                  value={application.resident_state || ''}
                  onValueChange={value => onUpdate('resident_state', value)}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map(state => (
                      <SelectItem key={state.code} value={state.code}>{state.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="license_expiration_date" className="text-xs">Expiration Date *</Label>
                <Input
                  id="license_expiration_date"
                  type="date"
                  value={application.license_expiration_date || ''}
                  onChange={e => onUpdate('license_expiration_date', e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>

            {/* Non-Resident States - Progressive Disclosure */}
            <Collapsible open={showNonResident} onOpenChange={setShowNonResident}>
              <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <ChevronDown className={`h-3 w-3 transition-transform ${showNonResident ? 'rotate-180' : ''}`} />
                {showNonResident ? 'Hide' : 'Add'} non-resident state licenses
                {(application.non_resident_states?.length || 0) > 0 && (
                  <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded ml-1">
                    {application.non_resident_states?.length} selected
                  </span>
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <div className="grid grid-cols-8 gap-1 p-2 border rounded-lg bg-muted/20">
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
          <div className="space-y-2.5 pt-2 border-t border-border/50">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground bg-primary/10 px-2 py-0.5 rounded">3</span>
              <h3 className="text-sm font-medium">Document Uploads</h3>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Upload clear photos or scans of your documents. These verify your identity and licensing for carrier appointments.
            </p>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Insurance License Copy *</Label>
                <input
                  type="file"
                  ref={licenseInputRef}
                  onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'insurance_license')}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                />
                <Button
                  variant={hasLicenseUploaded ? "secondary" : "outline"}
                  className={`w-full justify-start h-8 text-xs ${hasLicenseUploaded ? 'text-primary border-primary/30' : ''}`}
                  onClick={() => licenseInputRef.current?.click()}
                >
                  {hasLicenseUploaded ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-primary" />
                      License uploaded
                    </>
                  ) : (
                    <>
                      <Upload className="h-3.5 w-3.5 mr-2" />
                      Upload license
                    </>
                  )}
                </Button>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Government-Issued ID *</Label>
                <input
                  type="file"
                  ref={idInputRef}
                  onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'government_id')}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                />
                <Button
                  variant={hasIdUploaded ? "secondary" : "outline"}
                  className={`w-full justify-start h-8 text-xs ${hasIdUploaded ? 'text-primary border-primary/30' : ''}`}
                  onClick={() => idInputRef.current?.click()}
                >
                  {hasIdUploaded ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-primary" />
                      ID uploaded
                    </>
                  ) : (
                    <>
                      <Upload className="h-3.5 w-3.5 mr-2" />
                      Upload ID
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {documentsComplete && (
              <p className="text-[10px] text-primary flex items-center gap-1 animate-fade-in">
                <CheckCircle2 className="h-3 w-3" />
                Documents uploaded. You're ready to continue.
              </p>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-2 border-t">
            <Button variant="ghost" onClick={onBack} size="sm" className="text-muted-foreground">
              Back
            </Button>
            <Button onClick={onContinue} size="sm">
              Continue
            </Button>
          </div>

          {/* Progress Cue */}
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
              <span>You're making great progress</span>
              <ArrowRight className="h-2.5 w-2.5" />
              <span className="text-foreground/70">Next: Background Questions</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
