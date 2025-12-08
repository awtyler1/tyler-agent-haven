import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ContractingApplication } from '@/types/contracting';
import { User } from 'lucide-react';

interface PersonalInfoStepProps {
  application: ContractingApplication;
  onUpdate: <K extends keyof ContractingApplication>(field: K, value: ContractingApplication[K]) => void;
  onBack: () => void;
  onContinue: () => void;
}

export function PersonalInfoStep({ application, onUpdate, onBack, onContinue }: PersonalInfoStepProps) {
  const handleContactMethodChange = (method: string, checked: boolean) => {
    const current = application.preferred_contact_methods || [];
    const updated = checked
      ? [...current, method]
      : current.filter(m => m !== method);
    onUpdate('preferred_contact_methods', updated);
  };

  const isValid = application.full_legal_name && application.npn_number && 
                  application.insurance_license_number && application.email_address && 
                  application.phone_mobile;

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal & Contact Information
          </CardTitle>
          <CardDescription>
            Enter your personal details and contact preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="full_legal_name">Full Legal Name *</Label>
              <Input
                id="full_legal_name"
                value={application.full_legal_name || ''}
                onChange={e => onUpdate('full_legal_name', e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agency_name">Agency Name (if applicable)</Label>
              <Input
                id="agency_name"
                value={application.agency_name || ''}
                onChange={e => onUpdate('agency_name', e.target.value)}
                placeholder="Your Agency LLC"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={application.gender || ''}
                onValueChange={value => onUpdate('gender', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="birth_date">Birth Date</Label>
              <Input
                id="birth_date"
                type="date"
                value={application.birth_date || ''}
                onChange={e => onUpdate('birth_date', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax_id">SSN or EIN</Label>
              <Input
                id="tax_id"
                value={application.tax_id || ''}
                onChange={e => onUpdate('tax_id', e.target.value)}
                placeholder="XXX-XX-XXXX"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="npn_number">NPN Number *</Label>
              <Input
                id="npn_number"
                value={application.npn_number || ''}
                onChange={e => onUpdate('npn_number', e.target.value)}
                placeholder="12345678"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="insurance_license_number">Insurance License Number *</Label>
              <Input
                id="insurance_license_number"
                value={application.insurance_license_number || ''}
                onChange={e => onUpdate('insurance_license_number', e.target.value)}
                placeholder="ABC123456"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email_address">Email Address *</Label>
            <Input
              id="email_address"
              type="email"
              value={application.email_address || ''}
              onChange={e => onUpdate('email_address', e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone_mobile">Mobile Phone *</Label>
              <Input
                id="phone_mobile"
                type="tel"
                value={application.phone_mobile || ''}
                onChange={e => onUpdate('phone_mobile', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone_business">Business Phone</Label>
              <Input
                id="phone_business"
                type="tel"
                value={application.phone_business || ''}
                onChange={e => onUpdate('phone_business', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone_home">Home Phone</Label>
              <Input
                id="phone_home"
                type="tel"
                value={application.phone_home || ''}
                onChange={e => onUpdate('phone_home', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fax">Fax</Label>
              <Input
                id="fax"
                type="tel"
                value={application.fax || ''}
                onChange={e => onUpdate('fax', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Preferred Contact Method(s)</Label>
            <p className="text-sm text-muted-foreground">You can choose more than one.</p>
            <div className="flex flex-wrap gap-4">
              {['Email', 'Phone', 'Text'].map(method => (
                <div key={method} className="flex items-center gap-2">
                  <Checkbox
                    id={`contact_${method}`}
                    checked={application.preferred_contact_methods?.includes(method.toLowerCase())}
                    onCheckedChange={checked => handleContactMethodChange(method.toLowerCase(), !!checked)}
                  />
                  <Label htmlFor={`contact_${method}`} className="font-normal cursor-pointer">
                    {method}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
            <Button onClick={onContinue} disabled={!isValid}>
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}