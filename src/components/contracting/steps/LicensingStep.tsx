import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ContractingApplication, US_STATES } from '@/types/contracting';
import { FileCheck, Upload } from 'lucide-react';
import { useRef } from 'react';

interface LicensingStepProps {
  application: ContractingApplication;
  onUpdate: <K extends keyof ContractingApplication>(field: K, value: ContractingApplication[K]) => void;
  onUpload: (file: File, type: string) => Promise<string | null>;
  onBack: () => void;
  onContinue: () => void;
}

export function LicensingStep({ application, onUpdate, onUpload, onBack, onContinue }: LicensingStepProps) {
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

  const isValid = application.resident_license_number && application.resident_state && 
                  application.license_expiration_date;

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Licensing & Identification
          </CardTitle>
          <CardDescription>
            Enter your license information and upload required documents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="resident_license_number">Resident License Number *</Label>
              <Input
                id="resident_license_number"
                value={application.resident_license_number || ''}
                onChange={e => onUpdate('resident_license_number', e.target.value)}
                placeholder="ABC123456"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resident_state">Resident State *</Label>
              <Select
                value={application.resident_state || ''}
                onValueChange={value => onUpdate('resident_state', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map(state => (
                    <SelectItem key={state.code} value={state.code}>
                      {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="license_expiration_date">License Expiration Date *</Label>
            <Input
              id="license_expiration_date"
              type="date"
              value={application.license_expiration_date || ''}
              onChange={e => onUpdate('license_expiration_date', e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <Label>Non-Resident States (select all that apply)</Label>
            <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 border rounded-lg">
              {US_STATES.filter(s => s.code !== application.resident_state).map(state => (
                <label key={state.code} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={application.non_resident_states?.includes(state.code)}
                    onChange={e => handleNonResidentStatesChange(state.code, e.target.checked)}
                    className="rounded"
                  />
                  {state.code}
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="drivers_license_number">Driver's License Number</Label>
              <Input
                id="drivers_license_number"
                value={application.drivers_license_number || ''}
                onChange={e => onUpdate('drivers_license_number', e.target.value)}
                placeholder="D12345678"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="drivers_license_state">Driver's License State</Label>
              <Select
                value={application.drivers_license_state || ''}
                onValueChange={value => onUpdate('drivers_license_state', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map(state => (
                    <SelectItem key={state.code} value={state.code}>
                      {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Document uploads */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-medium">Required Documents</h3>
            
            <div className="space-y-2">
              <Label>Insurance License Copy</Label>
              <input
                type="file"
                ref={licenseInputRef}
                onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'insurance_license')}
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
              />
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => licenseInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                {application.uploaded_documents?.insurance_license
                  ? '✓ License uploaded'
                  : 'Upload insurance license'}
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Government-Issued ID</Label>
              <input
                type="file"
                ref={idInputRef}
                onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'government_id')}
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
              />
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => idInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                {application.uploaded_documents?.government_id
                  ? '✓ ID uploaded'
                  : 'Upload government ID'}
              </Button>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
            <Button onClick={onContinue}>
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}