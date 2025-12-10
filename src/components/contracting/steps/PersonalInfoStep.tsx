import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ContractingApplication, Address, EMPTY_ADDRESS, US_STATES } from '@/types/contracting';
import { User, Plus, X } from 'lucide-react';
import { useState } from 'react';

interface PersonalInfoStepProps {
  application: ContractingApplication;
  onUpdate: <K extends keyof ContractingApplication>(field: K, value: ContractingApplication[K]) => void;
  onBack: () => void;
  onContinue: () => void;
}

function CompactAddress({ 
  address, 
  onChange,
  label
}: { 
  address: Address; 
  onChange: (address: Address) => void;
  label: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex gap-1">
        <Input
          value={address.street}
          onChange={e => onChange({ ...address, street: e.target.value })}
          placeholder="Street"
          className="h-7 text-xs flex-[3]"
        />
        <Input
          value={address.city}
          onChange={e => onChange({ ...address, city: e.target.value })}
          placeholder="City"
          className="h-7 text-xs flex-[2]"
        />
        <Select value={address.state} onValueChange={value => onChange({ ...address, state: value })}>
          <SelectTrigger className="h-7 text-xs w-16">
            <SelectValue placeholder="ST" />
          </SelectTrigger>
          <SelectContent>
            {US_STATES.map(state => (
              <SelectItem key={state.code} value={state.code}>{state.code}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={address.zip}
          onChange={e => onChange({ ...address, zip: e.target.value })}
          placeholder="ZIP"
          className="h-7 text-xs w-16"
        />
        <Input
          value={address.county}
          onChange={e => onChange({ ...address, county: e.target.value })}
          placeholder="County"
          className="h-7 text-xs w-20"
        />
      </div>
    </div>
  );
}

export function PersonalInfoStep({ application, onUpdate, onBack, onContinue }: PersonalInfoStepProps) {
  const [showPrevAddresses, setShowPrevAddresses] = useState(false);
  
  const homeAddress = (application.home_address as Address) || EMPTY_ADDRESS;
  const mailingAddress = (application.mailing_address as Address) || EMPTY_ADDRESS;
  const upsAddress = (application.ups_address as Address) || EMPTY_ADDRESS;
  const previousAddresses = (application.previous_addresses as Address[]) || [];

  const personalInfoAcknowledged = application.agreements?.personal_info_acknowledged || false;

  const toggleContactMethod = (method: string) => {
    const current = application.preferred_contact_methods || [];
    if (current.includes(method)) {
      onUpdate('preferred_contact_methods', current.filter(m => m !== method));
    } else {
      onUpdate('preferred_contact_methods', [...current, method]);
    }
  };

  const addPreviousAddress = () => {
    onUpdate('previous_addresses', [...previousAddresses, EMPTY_ADDRESS]);
    setShowPrevAddresses(true);
  };

  const removePreviousAddress = (index: number) => {
    onUpdate('previous_addresses', previousAddresses.filter((_, i) => i !== index));
  };

  const updatePreviousAddress = (index: number, address: Address) => {
    const updated = [...previousAddresses];
    updated[index] = address;
    onUpdate('previous_addresses', updated);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-4 w-4" />
            Personal Information & Addresses
          </CardTitle>
          <CardDescription className="text-sm">
            Please provide your personal details and contact information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pb-4">
          {/* Row 1: Basic Info */}
          <div className="grid gap-2 grid-cols-2 md:grid-cols-4 lg:grid-cols-8">
            <div className="space-y-1 col-span-2">
              <Label className="text-xs">Full Legal Name *</Label>
              <Input
                value={application.full_legal_name || ''}
                onChange={e => onUpdate('full_legal_name', e.target.value)}
                placeholder="First Middle Last"
                className="h-7 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Gender</Label>
              <Select value={application.gender || ''} onValueChange={value => onUpdate('gender', value)}>
                <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Birth Date</Label>
              <Input type="date" value={application.birth_date || ''} onChange={e => onUpdate('birth_date', e.target.value)} className="h-7 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">SSN/Tax ID *</Label>
              <Input value={application.tax_id || ''} onChange={e => onUpdate('tax_id', e.target.value)} placeholder="XXX-XX-XXXX" className="h-7 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">NPN *</Label>
              <Input value={application.npn_number || ''} onChange={e => onUpdate('npn_number', e.target.value)} placeholder="12345678" className="h-7 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">License # *</Label>
              <Input value={application.insurance_license_number || ''} onChange={e => onUpdate('insurance_license_number', e.target.value)} placeholder="ABC123" className="h-7 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Agency Name</Label>
              <Input value={application.agency_name || ''} onChange={e => onUpdate('agency_name', e.target.value)} placeholder="If applicable" className="h-7 text-xs" />
            </div>
          </div>

          {/* Row 2: Contact & License Details */}
          <div className="grid gap-2 grid-cols-2 md:grid-cols-4 lg:grid-cols-8">
            <div className="space-y-1 col-span-2">
              <Label className="text-xs">Email *</Label>
              <Input type="email" value={application.email_address || ''} onChange={e => onUpdate('email_address', e.target.value)} placeholder="you@example.com" className="h-7 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Mobile *</Label>
              <Input type="tel" value={application.phone_mobile || ''} onChange={e => onUpdate('phone_mobile', e.target.value)} placeholder="(555) 123-4567" className="h-7 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Home Phone</Label>
              <Input type="tel" value={application.phone_home || ''} onChange={e => onUpdate('phone_home', e.target.value)} placeholder="(555) 123-4567" className="h-7 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Business Phone</Label>
              <Input type="tel" value={application.phone_business || ''} onChange={e => onUpdate('phone_business', e.target.value)} placeholder="(555) 123-4567" className="h-7 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fax</Label>
              <Input type="tel" value={application.fax || ''} onChange={e => onUpdate('fax', e.target.value)} placeholder="(555) 123-4567" className="h-7 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Driver's License #</Label>
              <Input value={application.drivers_license_number || ''} onChange={e => onUpdate('drivers_license_number', e.target.value)} placeholder="D12345678" className="h-7 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">DL State</Label>
              <Select value={application.drivers_license_state || ''} onValueChange={value => onUpdate('drivers_license_state', value)}>
                <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="ST" /></SelectTrigger>
                <SelectContent>
                  {US_STATES.map(state => (<SelectItem key={state.code} value={state.code}>{state.code}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 3: Preferred Contact & Corporation */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <span className="text-muted-foreground">Preferred contact:</span>
            {['Email', 'Mobile', 'Home', 'Business', 'Fax'].map(method => (
              <label key={method} className="flex items-center gap-1 cursor-pointer">
                <Checkbox checked={(application.preferred_contact_methods || []).includes(method)} onCheckedChange={() => toggleContactMethod(method)} className="h-3 w-3" />
                <span>{method}</span>
              </label>
            ))}
            <div className="ml-auto flex items-center gap-1">
              <Checkbox checked={application.is_corporation || false} onCheckedChange={checked => onUpdate('is_corporation', !!checked)} className="h-3 w-3" />
              <span>Operating as corporation</span>
            </div>
          </div>

          {/* Addresses Section */}
          <div className="space-y-2 pt-1 border-t">
            <CompactAddress address={homeAddress} onChange={addr => onUpdate('home_address', addr)} label="Home Address *" />
            
            <div className="flex gap-4 text-xs">
              <label className="flex items-center gap-1 cursor-pointer">
                <Checkbox checked={application.mailing_address_same_as_home} onCheckedChange={checked => onUpdate('mailing_address_same_as_home', !!checked)} className="h-3 w-3" />
                <span>Mailing same as home</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <Checkbox checked={application.ups_address_same_as_home} onCheckedChange={checked => onUpdate('ups_address_same_as_home', !!checked)} className="h-3 w-3" />
                <span>UPS same as home</span>
              </label>
              <button onClick={addPreviousAddress} className="flex items-center gap-1 text-primary hover:underline ml-auto">
                <Plus className="h-3 w-3" /> Add previous address
              </button>
            </div>

            {!application.mailing_address_same_as_home && (
              <CompactAddress address={mailingAddress} onChange={addr => onUpdate('mailing_address', addr)} label="Mailing Address" />
            )}

            {!application.ups_address_same_as_home && (
              <CompactAddress address={upsAddress} onChange={addr => onUpdate('ups_address', addr)} label="UPS/Shipping Address" />
            )}

            {previousAddresses.map((addr, index) => (
              <div key={index} className="flex gap-1 items-end">
                <div className="flex-1">
                  <CompactAddress address={addr} onChange={newAddr => updatePreviousAddress(index, newAddr)} label={`Previous Address ${index + 1}`} />
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 mb-0.5" onClick={() => removePreviousAddress(index)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>

          {/* Acknowledgment & Signature */}
          <div className="rounded-lg bg-muted/50 p-3 space-y-2 border">
            <p className="text-xs text-muted-foreground leading-relaxed">
              By signing this form, I acknowledge that all information is true and correct to the best of my knowledge.
              I agree to receive all carrier required emails, and Tyler Insurance Group Compliance updates.
              Additionally, by checking here, I agree to let Tyler Insurance Group send me information about carriers, products, and lead opportunities.
            </p>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={personalInfoAcknowledged}
                  onCheckedChange={checked => {
                    onUpdate('agreements', { ...application.agreements, personal_info_acknowledged: !!checked });
                  }}
                  className="h-4 w-4"
                />
                <span className="text-xs font-medium">I acknowledge and agree *</span>
              </label>

              <div className="flex items-center gap-3 sm:ml-auto">
                <div className="flex items-center gap-1.5">
                  <Label className="text-xs text-muted-foreground shrink-0">Initials *</Label>
                  <Input
                    value={application.signature_initials || ''}
                    onChange={e => onUpdate('signature_initials', e.target.value.toUpperCase())}
                    placeholder="AB"
                    maxLength={4}
                    className="h-7 w-12 text-center font-semibold tracking-wider uppercase text-xs"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <Label className="text-xs text-muted-foreground shrink-0">Date *</Label>
                  <Input
                    type="date"
                    value={application.signature_date?.split('T')[0] || new Date().toISOString().split('T')[0]}
                    onChange={e => onUpdate('signature_date', e.target.value)}
                    className="h-7 w-[120px] text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-1">
            <Button variant="outline" onClick={onBack} size="sm">Back</Button>
            <Button onClick={onContinue} size="sm">Continue</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
