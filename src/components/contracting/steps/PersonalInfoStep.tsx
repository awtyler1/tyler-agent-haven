import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ContractingApplication, Address, EMPTY_ADDRESS, US_STATES } from '@/types/contracting';
import { User, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface PersonalInfoStepProps {
  application: ContractingApplication;
  onUpdate: <K extends keyof ContractingApplication>(field: K, value: ContractingApplication[K]) => void;
  onBack: () => void;
  onContinue: () => void;
}

export function PersonalInfoStep({ application, onUpdate, onBack, onContinue }: PersonalInfoStepProps) {
  const [showOptional, setShowOptional] = useState(false);
  const homeAddress = (application.home_address as Address) || EMPTY_ADDRESS;

  const toggleContactMethod = (method: string) => {
    const current = application.preferred_contact_methods || [];
    if (current.includes(method)) {
      onUpdate('preferred_contact_methods', current.filter(m => m !== method));
    } else {
      onUpdate('preferred_contact_methods', [...current, method]);
    }
  };

  const updateHomeAddress = (field: keyof Address, value: string) => {
    onUpdate('home_address', { ...homeAddress, [field]: value });
  };

  return (
    <div className="max-w-xl mx-auto">
      <Card className="border-0 shadow-lg">
        <CardHeader className="py-4 text-center">
          <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <User className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-xl">Contact Information</CardTitle>
          <CardDescription className="text-sm">
            We use this information to stay in touch with you throughout the contracting process and beyond.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pb-5">
          {/* Core Required Fields */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="full_legal_name" className="text-sm font-medium">Full Legal Name *</Label>
              <Input
                id="full_legal_name"
                value={application.full_legal_name || ''}
                onChange={e => onUpdate('full_legal_name', e.target.value)}
                placeholder="First Middle Last"
                className="h-10"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="email_address" className="text-sm font-medium">Email Address *</Label>
                <Input
                  id="email_address"
                  type="email"
                  value={application.email_address || ''}
                  onChange={e => onUpdate('email_address', e.target.value)}
                  placeholder="you@example.com"
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone_mobile" className="text-sm font-medium">Mobile Phone *</Label>
                <Input
                  id="phone_mobile"
                  type="tel"
                  value={application.phone_mobile || ''}
                  onChange={e => onUpdate('phone_mobile', e.target.value)}
                  placeholder="(555) 123-4567"
                  className="h-10"
                />
              </div>
            </div>
          </div>

          {/* Home Address */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Home Address *</Label>
            <div className="space-y-2">
              <Input
                value={homeAddress.street}
                onChange={e => updateHomeAddress('street', e.target.value)}
                placeholder="Street address"
                className="h-10"
              />
              <div className="grid grid-cols-6 gap-2">
                <Input
                  value={homeAddress.city}
                  onChange={e => updateHomeAddress('city', e.target.value)}
                  placeholder="City"
                  className="h-10 col-span-2"
                />
                <Select value={homeAddress.state} onValueChange={value => updateHomeAddress('state', value)}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="State" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map(state => (
                      <SelectItem key={state.code} value={state.code}>{state.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={homeAddress.zip}
                  onChange={e => updateHomeAddress('zip', e.target.value)}
                  placeholder="ZIP"
                  className="h-10"
                />
                <Input
                  value={homeAddress.county}
                  onChange={e => updateHomeAddress('county', e.target.value)}
                  placeholder="County"
                  className="h-10 col-span-2"
                />
              </div>
            </div>
          </div>

          {/* Preferred Contact Method */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Preferred Contact Method *</Label>
            <div className="flex flex-wrap gap-4">
              {['Email', 'Mobile', 'Text'].map(method => (
                <label key={method} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox 
                    checked={(application.preferred_contact_methods || []).includes(method)} 
                    onCheckedChange={() => toggleContactMethod(method)} 
                  />
                  <span className="text-sm">{method}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Optional Fields - Progressive Disclosure */}
          <Collapsible open={showOptional} onOpenChange={setShowOptional}>
            <CollapsibleTrigger className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors w-full justify-center py-2">
              <ChevronDown className={`h-4 w-4 transition-transform ${showOptional ? 'rotate-180' : ''}`} />
              {showOptional ? 'Hide' : 'Add'} additional contact details
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-2">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="phone_home" className="text-xs text-muted-foreground">Home Phone</Label>
                  <Input
                    id="phone_home"
                    type="tel"
                    value={application.phone_home || ''}
                    onChange={e => onUpdate('phone_home', e.target.value)}
                    placeholder="(555) 123-4567"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone_business" className="text-xs text-muted-foreground">Business Phone</Label>
                  <Input
                    id="phone_business"
                    type="tel"
                    value={application.phone_business || ''}
                    onChange={e => onUpdate('phone_business', e.target.value)}
                    placeholder="(555) 123-4567"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fax" className="text-xs text-muted-foreground">Fax</Label>
                  <Input
                    id="fax"
                    type="tel"
                    value={application.fax || ''}
                    onChange={e => onUpdate('fax', e.target.value)}
                    placeholder="(555) 123-4567"
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

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
            Step 2 of 9
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
