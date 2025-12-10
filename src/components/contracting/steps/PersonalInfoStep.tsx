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

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-4 w-4" />
            Personal & Contact Information
          </CardTitle>
          <CardDescription className="text-sm">
            Enter your personal details and contact preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pb-4">
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="full_legal_name" className="text-xs">Full Legal Name *</Label>
              <Input
                id="full_legal_name"
                value={application.full_legal_name || ''}
                onChange={e => onUpdate('full_legal_name', e.target.value)}
                placeholder="John Doe"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="agency_name" className="text-xs">Agency Name (if applicable)</Label>
              <Input
                id="agency_name"
                value={application.agency_name || ''}
                onChange={e => onUpdate('agency_name', e.target.value)}
                placeholder="Your Agency LLC"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="gender" className="text-xs">Gender</Label>
              <Select
                value={application.gender || ''}
                onValueChange={value => onUpdate('gender', value)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="birth_date" className="text-xs">Birth Date</Label>
              <Input
                id="birth_date"
                type="date"
                value={application.birth_date || ''}
                onChange={e => onUpdate('birth_date', e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </div>

          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
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
              <Label htmlFor="insurance_license_number" className="text-xs">Insurance License # *</Label>
              <Input
                id="insurance_license_number"
                value={application.insurance_license_number || ''}
                onChange={e => onUpdate('insurance_license_number', e.target.value)}
                placeholder="ABC123456"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tax_id" className="text-xs">SSN or EIN (if applicable)</Label>
              <Input
                id="tax_id"
                value={application.tax_id || ''}
                onChange={e => onUpdate('tax_id', e.target.value)}
                placeholder="XXX-XX-XXXX"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email_address" className="text-xs">Email Address *</Label>
              <Input
                id="email_address"
                type="email"
                value={application.email_address || ''}
                onChange={e => onUpdate('email_address', e.target.value)}
                placeholder="you@example.com"
                className="h-8 text-sm"
              />
            </div>
          </div>

          <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="phone_mobile" className="text-xs">Mobile Phone *</Label>
              <Input
                id="phone_mobile"
                type="tel"
                value={application.phone_mobile || ''}
                onChange={e => onUpdate('phone_mobile', e.target.value)}
                placeholder="(555) 123-4567"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone_business" className="text-xs">Business Phone</Label>
              <Input
                id="phone_business"
                type="tel"
                value={application.phone_business || ''}
                onChange={e => onUpdate('phone_business', e.target.value)}
                placeholder="(555) 123-4567"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone_home" className="text-xs">Home Phone</Label>
              <Input
                id="phone_home"
                type="tel"
                value={application.phone_home || ''}
                onChange={e => onUpdate('phone_home', e.target.value)}
                placeholder="(555) 123-4567"
                className="h-8 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Label className="text-xs">Preferred Contact:</Label>
            <div className="flex gap-4">
              {['Email', 'Phone', 'Text'].map(method => (
                <div key={method} className="flex items-center gap-1.5">
                  <Checkbox
                    id={`contact_${method}`}
                    checked={application.preferred_contact_methods?.includes(method.toLowerCase())}
                    onCheckedChange={checked => handleContactMethodChange(method.toLowerCase(), !!checked)}
                    className="h-3.5 w-3.5"
                  />
                  <Label htmlFor={`contact_${method}`} className="text-xs font-normal cursor-pointer">
                    {method}
                  </Label>
                </div>
              ))}
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
