import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ContractingApplication, Address, EMPTY_ADDRESS, US_STATES } from '@/types/contracting';
import { User } from 'lucide-react';

interface PersonalInfoStepProps {
  application: ContractingApplication;
  onUpdate: <K extends keyof ContractingApplication>(field: K, value: ContractingApplication[K]) => void;
  onBack: () => void;
  onContinue: () => void;
}

export function PersonalInfoStep({ application, onUpdate, onBack, onContinue }: PersonalInfoStepProps) {
  const homeAddress = (application.home_address as Address) || EMPTY_ADDRESS;
  const mailingAddress = (application.mailing_address as Address) || EMPTY_ADDRESS;
  const upsAddress = (application.ups_address as Address) || EMPTY_ADDRESS;

  const toggleContactMethod = (method: string) => {
    const current = application.preferred_contact_methods || [];
    if (current.includes(method)) {
      onUpdate('preferred_contact_methods', current.filter(m => m !== method));
    } else {
      onUpdate('preferred_contact_methods', [...current, method]);
    }
  };

  const updateAddress = (type: 'home_address' | 'mailing_address' | 'ups_address', field: keyof Address, value: string) => {
    const current = type === 'home_address' ? homeAddress : type === 'mailing_address' ? mailingAddress : upsAddress;
    onUpdate(type, { ...current, [field]: value });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="border-0 shadow-lg">
        <CardHeader className="py-3 text-center">
          <div className="mx-auto w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center mb-1">
            <User className="h-4 w-4 text-primary" />
          </div>
          <CardTitle className="text-lg">Contact Information</CardTitle>
          <CardDescription className="text-xs">
            We use this to stay in touch throughout contracting and beyond.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pb-4">
          {/* Row 1: Name, Email, Mobile */}
          <div className="grid grid-cols-4 gap-2">
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Full Legal Name *</Label>
              <Input
                value={application.full_legal_name || ''}
                onChange={e => onUpdate('full_legal_name', e.target.value)}
                placeholder="First Middle Last"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Email *</Label>
              <Input
                type="email"
                value={application.email_address || ''}
                onChange={e => onUpdate('email_address', e.target.value)}
                placeholder="you@example.com"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Mobile *</Label>
              <Input
                type="tel"
                value={application.phone_mobile || ''}
                onChange={e => onUpdate('phone_mobile', e.target.value)}
                placeholder="(555) 123-4567"
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* Home Address */}
          <div className="space-y-1">
            <Label className="text-xs">Home Address *</Label>
            <div className="grid grid-cols-6 gap-1.5">
              <Input
                value={homeAddress.street}
                onChange={e => updateAddress('home_address', 'street', e.target.value)}
                placeholder="Street address"
                className="h-8 text-sm col-span-3"
              />
              <Input
                value={homeAddress.city}
                onChange={e => updateAddress('home_address', 'city', e.target.value)}
                placeholder="City"
                className="h-8 text-sm"
              />
              <Select value={homeAddress.state} onValueChange={value => updateAddress('home_address', 'state', value)}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="ST" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map(state => (
                    <SelectItem key={state.code} value={state.code}>{state.code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={homeAddress.zip}
                onChange={e => updateAddress('home_address', 'zip', e.target.value)}
                placeholder="ZIP"
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* Address same-as checkboxes */}
          <div className="flex gap-6 text-xs">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <Checkbox 
                checked={application.mailing_address_same_as_home} 
                onCheckedChange={checked => onUpdate('mailing_address_same_as_home', !!checked)} 
                className="h-3.5 w-3.5"
              />
              <span>Mailing address same as home</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <Checkbox 
                checked={application.ups_address_same_as_home} 
                onCheckedChange={checked => onUpdate('ups_address_same_as_home', !!checked)} 
                className="h-3.5 w-3.5"
              />
              <span>UPS/Shipping same as home</span>
            </label>
          </div>

          {/* Mailing Address (if different) */}
          {!application.mailing_address_same_as_home && (
            <div className="space-y-1 animate-fade-in">
              <Label className="text-xs">Mailing Address</Label>
              <div className="grid grid-cols-6 gap-1.5">
                <Input
                  value={mailingAddress.street}
                  onChange={e => updateAddress('mailing_address', 'street', e.target.value)}
                  placeholder="Street address"
                  className="h-8 text-sm col-span-3"
                />
                <Input
                  value={mailingAddress.city}
                  onChange={e => updateAddress('mailing_address', 'city', e.target.value)}
                  placeholder="City"
                  className="h-8 text-sm"
                />
                <Select value={mailingAddress.state} onValueChange={value => updateAddress('mailing_address', 'state', value)}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="ST" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map(state => (
                      <SelectItem key={state.code} value={state.code}>{state.code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={mailingAddress.zip}
                  onChange={e => updateAddress('mailing_address', 'zip', e.target.value)}
                  placeholder="ZIP"
                  className="h-8 text-sm"
                />
              </div>
            </div>
          )}

          {/* UPS Address (if different) */}
          {!application.ups_address_same_as_home && (
            <div className="space-y-1 animate-fade-in">
              <Label className="text-xs">UPS/Shipping Address</Label>
              <div className="grid grid-cols-6 gap-1.5">
                <Input
                  value={upsAddress.street}
                  onChange={e => updateAddress('ups_address', 'street', e.target.value)}
                  placeholder="Street address"
                  className="h-8 text-sm col-span-3"
                />
                <Input
                  value={upsAddress.city}
                  onChange={e => updateAddress('ups_address', 'city', e.target.value)}
                  placeholder="City"
                  className="h-8 text-sm"
                />
                <Select value={upsAddress.state} onValueChange={value => updateAddress('ups_address', 'state', value)}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="ST" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map(state => (
                      <SelectItem key={state.code} value={state.code}>{state.code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={upsAddress.zip}
                  onChange={e => updateAddress('ups_address', 'zip', e.target.value)}
                  placeholder="ZIP"
                  className="h-8 text-sm"
                />
              </div>
            </div>
          )}

          {/* Preferred Contact */}
          <div className="flex items-center gap-4 text-xs">
            <span className="text-muted-foreground">Preferred contact:</span>
            {['Email', 'Mobile', 'Text'].map(method => (
              <label key={method} className="flex items-center gap-1.5 cursor-pointer">
                <Checkbox 
                  checked={(application.preferred_contact_methods || []).includes(method)} 
                  onCheckedChange={() => toggleContactMethod(method)} 
                  className="h-3.5 w-3.5"
                />
                <span>{method}</span>
              </label>
            ))}
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

          <p className="text-[10px] text-center text-muted-foreground">Step 2 of 9</p>
        </CardContent>
      </Card>
    </div>
  );
}
