import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ContractingApplication, Address, EMPTY_ADDRESS, US_STATES } from '@/types/contracting';
import { ChevronDown, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface PersonalInfoStepProps {
  application: ContractingApplication;
  onUpdate: <K extends keyof ContractingApplication>(field: K, value: ContractingApplication[K]) => void;
  onBack: () => void;
  onContinue: () => void;
}

function InlineAddressFields({ 
  address, 
  onChange, 
  prefix 
}: { 
  address: Address; 
  onChange: (address: Address) => void;
  prefix: string;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      <Input
        id={`${prefix}_street`}
        value={address.street}
        onChange={e => onChange({ ...address, street: e.target.value })}
        placeholder="Street address"
        className="h-9 flex-[2] min-w-[180px]"
      />
      <Input
        id={`${prefix}_city`}
        value={address.city}
        onChange={e => onChange({ ...address, city: e.target.value })}
        placeholder="City"
        className="h-9 flex-1 min-w-[100px]"
      />
      <Select
        value={address.state}
        onValueChange={value => onChange({ ...address, state: value })}
      >
        <SelectTrigger className="h-9 w-[80px]">
          <SelectValue placeholder="State" />
        </SelectTrigger>
        <SelectContent>
          {US_STATES.map(state => (
            <SelectItem key={state.code} value={state.code}>
              {state.code}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        id={`${prefix}_zip`}
        value={address.zip}
        onChange={e => onChange({ ...address, zip: e.target.value })}
        placeholder="ZIP"
        className="h-9 w-[80px]"
      />
      <Input
        id={`${prefix}_county`}
        value={address.county}
        onChange={e => onChange({ ...address, county: e.target.value })}
        placeholder="County"
        className="h-9 w-[100px]"
      />
    </div>
  );
}

export function PersonalInfoStep({ application, onUpdate, onBack, onContinue }: PersonalInfoStepProps) {
  const [showOptional, setShowOptional] = useState(false);
  const [showPrevAddresses, setShowPrevAddresses] = useState(false);
  
  const homeAddress = (application.home_address as Address) || EMPTY_ADDRESS;
  const mailingAddress = (application.mailing_address as Address) || EMPTY_ADDRESS;
  const upsAddress = (application.ups_address as Address) || EMPTY_ADDRESS;
  const previousAddresses = (application.previous_addresses as Address[]) || [];

  const addPreviousAddress = () => {
    onUpdate('previous_addresses', [...previousAddresses, EMPTY_ADDRESS]);
    setShowPrevAddresses(true);
  };

  const removePreviousAddress = (index: number) => {
    const updated = previousAddresses.filter((_, i) => i !== index);
    onUpdate('previous_addresses', updated);
  };

  const updatePreviousAddress = (index: number, address: Address) => {
    const updated = [...previousAddresses];
    updated[index] = address;
    onUpdate('previous_addresses', updated);
  };

  const personalInfoAcknowledged = application.agreements?.personal_info_acknowledged || false;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Tell us about yourself</h1>
        <p className="text-muted-foreground text-sm">We just need a few details to get started</p>
      </div>

      {/* Essential Info - Always Visible */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="col-span-2 md:col-span-1">
          <Label htmlFor="full_legal_name" className="text-xs text-muted-foreground">Full Name *</Label>
          <Input
            id="full_legal_name"
            value={application.full_legal_name || ''}
            onChange={e => onUpdate('full_legal_name', e.target.value)}
            placeholder="John Doe"
            className="h-9 mt-1"
          />
        </div>
        <div>
          <Label htmlFor="npn_number" className="text-xs text-muted-foreground">NPN *</Label>
          <Input
            id="npn_number"
            value={application.npn_number || ''}
            onChange={e => onUpdate('npn_number', e.target.value)}
            placeholder="12345678"
            className="h-9 mt-1"
          />
        </div>
        <div>
          <Label htmlFor="insurance_license_number" className="text-xs text-muted-foreground">License # *</Label>
          <Input
            id="insurance_license_number"
            value={application.insurance_license_number || ''}
            onChange={e => onUpdate('insurance_license_number', e.target.value)}
            placeholder="ABC123456"
            className="h-9 mt-1"
          />
        </div>
        <div>
          <Label htmlFor="phone_mobile" className="text-xs text-muted-foreground">Mobile *</Label>
          <Input
            id="phone_mobile"
            type="tel"
            value={application.phone_mobile || ''}
            onChange={e => onUpdate('phone_mobile', e.target.value)}
            placeholder="(555) 123-4567"
            className="h-9 mt-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label htmlFor="email_address" className="text-xs text-muted-foreground">Email *</Label>
          <Input
            id="email_address"
            type="email"
            value={application.email_address || ''}
            onChange={e => onUpdate('email_address', e.target.value)}
            placeholder="you@example.com"
            className="h-9 mt-1"
          />
        </div>
        <Collapsible open={showOptional} onOpenChange={setShowOptional}>
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 mt-6 transition-colors">
              <ChevronDown className={`h-3 w-3 transition-transform ${showOptional ? 'rotate-180' : ''}`} />
              {showOptional ? 'Hide' : 'Show'} optional fields
            </button>
          </CollapsibleTrigger>
        </Collapsible>
      </div>

      {/* Optional Fields - Collapsible */}
      <Collapsible open={showOptional} onOpenChange={setShowOptional}>
        <CollapsibleContent className="space-y-3 animate-fade-in">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-dashed">
            <div>
              <Label htmlFor="agency_name" className="text-xs text-muted-foreground">Agency Name</Label>
              <Input
                id="agency_name"
                value={application.agency_name || ''}
                onChange={e => onUpdate('agency_name', e.target.value)}
                placeholder="Your Agency LLC"
                className="h-9 mt-1"
              />
            </div>
            <div>
              <Label htmlFor="tax_id" className="text-xs text-muted-foreground">SSN/EIN</Label>
              <Input
                id="tax_id"
                value={application.tax_id || ''}
                onChange={e => onUpdate('tax_id', e.target.value)}
                placeholder="XXX-XX-XXXX"
                className="h-9 mt-1"
              />
            </div>
            <div>
              <Label htmlFor="birth_date" className="text-xs text-muted-foreground">Birth Date</Label>
              <Input
                id="birth_date"
                type="date"
                value={application.birth_date || ''}
                onChange={e => onUpdate('birth_date', e.target.value)}
                className="h-9 mt-1"
              />
            </div>
            <div>
              <Label htmlFor="phone_business" className="text-xs text-muted-foreground">Business Phone</Label>
              <Input
                id="phone_business"
                type="tel"
                value={application.phone_business || ''}
                onChange={e => onUpdate('phone_business', e.target.value)}
                placeholder="(555) 123-4567"
                className="h-9 mt-1"
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Address Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Home Address *</span>
        </div>
        <InlineAddressFields
          address={homeAddress}
          onChange={addr => onUpdate('home_address', addr)}
          prefix="home"
        />

        <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              id="mailing_same"
              checked={application.mailing_address_same_as_home}
              onCheckedChange={checked => onUpdate('mailing_address_same_as_home', !!checked)}
              className="h-4 w-4"
            />
            <span className="text-muted-foreground">Mailing address same as home</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              id="ups_same"
              checked={application.ups_address_same_as_home}
              onCheckedChange={checked => onUpdate('ups_address_same_as_home', !!checked)}
              className="h-4 w-4"
            />
            <span className="text-muted-foreground">UPS address same as home</span>
          </label>
        </div>

        {!application.mailing_address_same_as_home && (
          <div className="space-y-1 animate-fade-in">
            <span className="text-xs text-muted-foreground">Mailing Address</span>
            <InlineAddressFields
              address={mailingAddress}
              onChange={addr => onUpdate('mailing_address', addr)}
              prefix="mailing"
            />
          </div>
        )}

        {!application.ups_address_same_as_home && (
          <div className="space-y-1 animate-fade-in">
            <span className="text-xs text-muted-foreground">UPS Address</span>
            <InlineAddressFields
              address={upsAddress}
              onChange={addr => onUpdate('ups_address', addr)}
              prefix="ups"
            />
          </div>
        )}

        {/* Previous Addresses */}
        <Collapsible open={showPrevAddresses} onOpenChange={setShowPrevAddresses}>
          <div className="flex items-center gap-2">
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <ChevronDown className={`h-3 w-3 transition-transform ${showPrevAddresses ? 'rotate-180' : ''}`} />
                Previous addresses (last 10 years)
              </button>
            </CollapsibleTrigger>
            <Button variant="ghost" size="sm" onClick={addPreviousAddress} className="h-6 text-xs px-2">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <CollapsibleContent className="space-y-2 mt-2">
            {previousAddresses.map((addr, index) => (
              <div key={index} className="flex gap-2 items-start animate-fade-in">
                <div className="flex-1">
                  <InlineAddressFields
                    address={addr}
                    onChange={newAddr => updatePreviousAddress(index, newAddr)}
                    prefix={`prev_${index}`}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => removePreviousAddress(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Agreement & Signature */}
      <div className="rounded-xl bg-muted/40 p-4 space-y-3">
        <p className="text-xs text-muted-foreground leading-relaxed">
          By signing, I confirm all information is accurate. I agree to receive carrier emails and Tyler Insurance Group updates, 
          including information about carriers, products, and lead opportunities.
        </p>
        
        <div className="flex items-center justify-between flex-wrap gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              id="personal_info_acknowledged"
              checked={personalInfoAcknowledged}
              onCheckedChange={checked => {
                onUpdate('agreements', {
                  ...application.agreements,
                  personal_info_acknowledged: !!checked
                });
              }}
              className="h-4 w-4"
            />
            <span className="text-sm font-medium">I agree *</span>
          </label>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Initials</span>
              <Input
                value={application.signature_initials || ''}
                onChange={e => onUpdate('signature_initials', e.target.value.toUpperCase())}
                placeholder="AB"
                maxLength={4}
                className="h-9 w-16 text-center font-semibold tracking-wider uppercase"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Date</span>
              <Input
                type="date"
                value={application.signature_date?.split('T')[0] || new Date().toISOString().split('T')[0]}
                onChange={e => onUpdate('signature_date', e.target.value)}
                className="h-9 w-[130px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={onBack} className="text-muted-foreground">
          Back
        </Button>
        <Button onClick={onContinue} className="px-8">
          Continue
        </Button>
      </div>
    </div>
  );
}