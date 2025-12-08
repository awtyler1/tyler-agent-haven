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

  return (
    <div className="max-w-5xl mx-auto">
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileCheck className="h-4 w-4" />
            Licensing & Identification
          </CardTitle>
          <CardDescription className="text-sm">
            Enter your license information and upload required documents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pb-4">
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
            <div className="space-y-1">
              <Label htmlFor="resident_license_number" className="text-xs">Resident License # *</Label>
              <Input
                id="resident_license_number"
                value={application.resident_license_number || ''}
                onChange={e => onUpdate('resident_license_number', e.target.value)}
                placeholder="ABC123456"
                className="h-8 text-sm"
              />
            </div>
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
                    <SelectItem key={state.code} value={state.code}>
                      {state.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="license_expiration_date" className="text-xs">License Expires *</Label>
              <Input
                id="license_expiration_date"
                type="date"
                value={application.license_expiration_date || ''}
                onChange={e => onUpdate('license_expiration_date', e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="drivers_license_number" className="text-xs">Driver's License #</Label>
              <Input
                id="drivers_license_number"
                value={application.drivers_license_number || ''}
                onChange={e => onUpdate('drivers_license_number', e.target.value)}
                placeholder="D12345678"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="drivers_license_state" className="text-xs">DL State</Label>
              <Select
                value={application.drivers_license_state || ''}
                onValueChange={value => onUpdate('drivers_license_state', value)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map(state => (
                    <SelectItem key={state.code} value={state.code}>
                      {state.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Non-Resident States</Label>
            <div className="grid grid-cols-10 gap-1 p-2 border rounded-lg max-h-24 overflow-y-auto">
              {US_STATES.filter(s => s.code !== application.resident_state).map(state => (
                <label key={state.code} className="flex items-center gap-1 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={application.non_resident_states?.includes(state.code)}
                    onChange={e => handleNonResidentStatesChange(state.code, e.target.checked)}
                    className="h-3 w-3 rounded"
                  />
                  {state.code}
                </label>
              ))}
            </div>
          </div>

          {/* Document uploads */}
          <div className="grid gap-3 grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Insurance License Copy</Label>
              <input
                type="file"
                ref={licenseInputRef}
                onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'insurance_license')}
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start h-8 text-xs"
                onClick={() => licenseInputRef.current?.click()}
              >
                <Upload className="h-3 w-3 mr-2" />
                {application.uploaded_documents?.insurance_license
                  ? '✓ License uploaded'
                  : 'Upload license'}
              </Button>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Government-Issued ID</Label>
              <input
                type="file"
                ref={idInputRef}
                onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'government_id')}
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start h-8 text-xs"
                onClick={() => idInputRef.current?.click()}
              >
                <Upload className="h-3 w-3 mr-2" />
                {application.uploaded_documents?.government_id
                  ? '✓ ID uploaded'
                  : 'Upload ID'}
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
