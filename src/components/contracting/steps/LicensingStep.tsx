import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ContractingApplication, US_STATES } from '@/types/contracting';
import { FileCheck, Upload, ChevronDown } from 'lucide-react';
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

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="border-0 shadow-lg">
        <CardHeader className="py-4 text-center">
          <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <FileCheck className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-xl">Identity & Licensing</CardTitle>
          <CardDescription className="text-sm">
            This information is required for carrier contracting and compliance verification.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pb-5">
          {/* Identity Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Identity</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="birth_date" className="text-sm">Date of Birth *</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={application.birth_date || ''}
                  onChange={e => onUpdate('birth_date', e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tax_id" className="text-sm">SSN / Tax ID *</Label>
                <Input
                  id="tax_id"
                  value={application.tax_id || ''}
                  onChange={e => onUpdate('tax_id', e.target.value)}
                  placeholder="XXX-XX-XXXX"
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gender" className="text-sm">Gender</Label>
                <Select value={application.gender || ''} onValueChange={value => onUpdate('gender', value)}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="drivers_license_number" className="text-sm">Driver's License #</Label>
                <Input
                  id="drivers_license_number"
                  value={application.drivers_license_number || ''}
                  onChange={e => onUpdate('drivers_license_number', e.target.value)}
                  placeholder="D12345678"
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="drivers_license_state" className="text-sm">DL State</Label>
                <Select
                  value={application.drivers_license_state || ''}
                  onValueChange={value => onUpdate('drivers_license_state', value)}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map(state => (
                      <SelectItem key={state.code} value={state.code}>{state.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Licensing Information */}
          <div className="space-y-3 pt-2 border-t">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Insurance Licensing</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="npn_number" className="text-sm">NPN Number *</Label>
                <Input
                  id="npn_number"
                  value={application.npn_number || ''}
                  onChange={e => onUpdate('npn_number', e.target.value)}
                  placeholder="12345678"
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="insurance_license_number" className="text-sm">Insurance License # *</Label>
                <Input
                  id="insurance_license_number"
                  value={application.insurance_license_number || ''}
                  onChange={e => onUpdate('insurance_license_number', e.target.value)}
                  placeholder="ABC123456"
                  className="h-10"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="resident_state" className="text-sm">Resident State *</Label>
                <Select
                  value={application.resident_state || ''}
                  onValueChange={value => onUpdate('resident_state', value)}
                >
                  <SelectTrigger className="h-10">
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
                <Label htmlFor="resident_license_number" className="text-sm">Resident License #</Label>
                <Input
                  id="resident_license_number"
                  value={application.resident_license_number || ''}
                  onChange={e => onUpdate('resident_license_number', e.target.value)}
                  placeholder="ABC123456"
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="license_expiration_date" className="text-sm">Expiration Date *</Label>
                <Input
                  id="license_expiration_date"
                  type="date"
                  value={application.license_expiration_date || ''}
                  onChange={e => onUpdate('license_expiration_date', e.target.value)}
                  className="h-10"
                />
              </div>
            </div>

            {/* Non-Resident States - Progressive Disclosure */}
            <Collapsible open={showNonResident} onOpenChange={setShowNonResident}>
              <CollapsibleTrigger className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ChevronDown className={`h-4 w-4 transition-transform ${showNonResident ? 'rotate-180' : ''}`} />
                {showNonResident ? 'Hide' : 'Add'} non-resident state licenses
                {(application.non_resident_states?.length || 0) > 0 && (
                  <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded ml-1">
                    {application.non_resident_states?.length} selected
                  </span>
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <div className="grid grid-cols-8 gap-1.5 p-3 border rounded-lg bg-muted/30">
                  {US_STATES.filter(s => s.code !== application.resident_state).map(state => (
                    <label key={state.code} className="flex items-center gap-1 text-xs cursor-pointer">
                      <Checkbox
                        checked={application.non_resident_states?.includes(state.code)}
                        onCheckedChange={checked => handleNonResidentStatesChange(state.code, !!checked)}
                        className="h-3.5 w-3.5"
                      />
                      {state.code}
                    </label>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Document Uploads */}
          <div className="space-y-3 pt-2 border-t">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Documents</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Insurance License Copy *</Label>
                <input
                  type="file"
                  ref={licenseInputRef}
                  onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'insurance_license')}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                />
                <Button
                  variant="outline"
                  className="w-full justify-start h-10"
                  onClick={() => licenseInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {application.uploaded_documents?.insurance_license
                    ? '✓ License uploaded'
                    : 'Upload license'}
                </Button>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Government-Issued ID *</Label>
                <input
                  type="file"
                  ref={idInputRef}
                  onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'government_id')}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                />
                <Button
                  variant="outline"
                  className="w-full justify-start h-10"
                  onClick={() => idInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {application.uploaded_documents?.government_id
                    ? '✓ ID uploaded'
                    : 'Upload ID'}
                </Button>
              </div>
            </div>
          </div>

          {/* Business Info - Optional */}
          <div className="flex items-center gap-3 pt-2 border-t">
            <Checkbox
              id="is_corporation"
              checked={application.is_corporation || false}
              onCheckedChange={checked => onUpdate('is_corporation', !!checked)}
            />
            <div className="flex-1">
              <Label htmlFor="is_corporation" className="text-sm cursor-pointer">
                I am operating as a corporation or business entity
              </Label>
            </div>
            {application.is_corporation && (
              <Input
                value={application.agency_name || ''}
                onChange={e => onUpdate('agency_name', e.target.value)}
                placeholder="Agency/Business name"
                className="h-9 w-48"
              />
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-3 border-t">
            <Button variant="ghost" onClick={onBack} className="text-muted-foreground">
              Back
            </Button>
            <Button onClick={onContinue}>
              Continue
            </Button>
          </div>

          {/* Progress */}
          <p className="text-[10px] text-center text-muted-foreground">
            Step 3 of 9
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
