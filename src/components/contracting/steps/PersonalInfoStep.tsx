import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ContractingApplication, Address, EMPTY_ADDRESS, US_STATES } from '@/types/contracting';
import { Plus, X, MapPin, User, Phone, Building } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PersonalInfoStepProps {
  application: ContractingApplication;
  onUpdate: <K extends keyof ContractingApplication>(field: K, value: ContractingApplication[K]) => void;
  onBack: () => void;
  onContinue: () => void;
}

function AddressFields({ 
  address, 
  onChange, 
  prefix 
}: { 
  address: Address; 
  onChange: (address: Address) => void;
  prefix: string;
}) {
  return (
    <div className="grid grid-cols-6 gap-2">
      <div className="col-span-6 sm:col-span-4">
        <Input
          value={address.street}
          onChange={e => onChange({ ...address, street: e.target.value })}
          placeholder="Street address"
          className="h-10"
        />
      </div>
      <div className="col-span-3 sm:col-span-2">
        <Input
          value={address.city}
          onChange={e => onChange({ ...address, city: e.target.value })}
          placeholder="City"
          className="h-10"
        />
      </div>
      <div className="col-span-1">
        <Select
          value={address.state}
          onValueChange={value => onChange({ ...address, state: value })}
        >
          <SelectTrigger className="h-10">
            <SelectValue placeholder="ST" />
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
      <div className="col-span-2 sm:col-span-1">
        <Input
          value={address.zip}
          onChange={e => onChange({ ...address, zip: e.target.value })}
          placeholder="ZIP"
          className="h-10"
        />
      </div>
      <div className="col-span-3 sm:col-span-2">
        <Input
          value={address.county}
          onChange={e => onChange({ ...address, county: e.target.value })}
          placeholder="County"
          className="h-10"
        />
      </div>
    </div>
  );
}

export function PersonalInfoStep({ application, onUpdate, onBack, onContinue }: PersonalInfoStepProps) {
  const homeAddress = (application.home_address as Address) || EMPTY_ADDRESS;
  const mailingAddress = (application.mailing_address as Address) || EMPTY_ADDRESS;
  const upsAddress = (application.ups_address as Address) || EMPTY_ADDRESS;
  const previousAddresses = (application.previous_addresses as Address[]) || [];

  const addPreviousAddress = () => {
    onUpdate('previous_addresses', [...previousAddresses, EMPTY_ADDRESS]);
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

  const toggleContactMethod = (method: string) => {
    const current = application.preferred_contact_methods || [];
    if (current.includes(method)) {
      onUpdate('preferred_contact_methods', current.filter(m => m !== method));
    } else {
      onUpdate('preferred_contact_methods', [...current, method]);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto">
      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-8 pb-6">
          {/* Section: Personal Details */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <User className="h-4 w-4" />
              <h2 className="text-sm font-semibold uppercase tracking-wide">Personal Details</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="sm:col-span-2">
                <Label className="text-xs text-muted-foreground mb-1.5 block">Full Legal Name *</Label>
                <Input
                  value={application.full_legal_name || ''}
                  onChange={e => onUpdate('full_legal_name', e.target.value)}
                  placeholder="First Middle Last"
                  className="h-10"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Gender</Label>
                <Select
                  value={application.gender || ''}
                  onValueChange={value => onUpdate('gender', value)}
                >
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
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Date of Birth</Label>
                <Input
                  type="date"
                  value={application.birth_date || ''}
                  onChange={e => onUpdate('birth_date', e.target.value)}
                  className="h-10"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">SSN/Tax ID *</Label>
                <Input
                  value={application.tax_id || ''}
                  onChange={e => onUpdate('tax_id', e.target.value)}
                  placeholder="XXX-XX-XXXX"
                  className="h-10"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Driver's License #</Label>
                <Input
                  value={application.drivers_license_number || ''}
                  onChange={e => onUpdate('drivers_license_number', e.target.value)}
                  placeholder="License number"
                  className="h-10"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">License State</Label>
                <Select
                  value={application.drivers_license_state || ''}
                  onValueChange={value => onUpdate('drivers_license_state', value)}
                >
                  <SelectTrigger className="h-10">
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
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Agency Name</Label>
                <Input
                  value={application.agency_name || ''}
                  onChange={e => onUpdate('agency_name', e.target.value)}
                  placeholder="If applicable"
                  className="h-10"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <Checkbox
                id="is_corporation"
                checked={application.is_corporation || false}
                onCheckedChange={checked => onUpdate('is_corporation', !!checked)}
              />
              <Label htmlFor="is_corporation" className="text-sm cursor-pointer">
                I am operating as a corporation
              </Label>
            </div>
          </section>

          {/* Section: Contact Information */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Phone className="h-4 w-4" />
              <h2 className="text-sm font-semibold uppercase tracking-wide">Contact Information</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="sm:col-span-2">
                <Label className="text-xs text-muted-foreground mb-1.5 block">Email Address *</Label>
                <Input
                  type="email"
                  value={application.email_address || ''}
                  onChange={e => onUpdate('email_address', e.target.value)}
                  placeholder="you@example.com"
                  className="h-10"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Mobile Phone *</Label>
                <Input
                  type="tel"
                  value={application.phone_mobile || ''}
                  onChange={e => onUpdate('phone_mobile', e.target.value)}
                  placeholder="(555) 123-4567"
                  className="h-10"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Home Phone</Label>
                <Input
                  type="tel"
                  value={application.phone_home || ''}
                  onChange={e => onUpdate('phone_home', e.target.value)}
                  placeholder="(555) 123-4567"
                  className="h-10"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Business Phone</Label>
                <Input
                  type="tel"
                  value={application.phone_business || ''}
                  onChange={e => onUpdate('phone_business', e.target.value)}
                  placeholder="(555) 123-4567"
                  className="h-10"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Fax</Label>
                <Input
                  type="tel"
                  value={application.fax || ''}
                  onChange={e => onUpdate('fax', e.target.value)}
                  placeholder="(555) 123-4567"
                  className="h-10"
                />
              </div>
            </div>

            <div className="pt-1">
              <Label className="text-xs text-muted-foreground mb-2 block">Preferred Contact Methods</Label>
              <div className="flex flex-wrap gap-4">
                {['Email', 'Mobile', 'Home Phone', 'Business Phone', 'Fax'].map(method => (
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
          </section>

          {/* Section: Insurance Licensing */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Building className="h-4 w-4" />
              <h2 className="text-sm font-semibold uppercase tracking-wide">Insurance Licensing</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">NPN Number *</Label>
                <Input
                  value={application.npn_number || ''}
                  onChange={e => onUpdate('npn_number', e.target.value)}
                  placeholder="12345678"
                  className="h-10"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Insurance License # *</Label>
                <Input
                  value={application.insurance_license_number || ''}
                  onChange={e => onUpdate('insurance_license_number', e.target.value)}
                  placeholder="ABC123456"
                  className="h-10"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Resident State *</Label>
                <Select
                  value={application.resident_state || ''}
                  onValueChange={value => onUpdate('resident_state', value)}
                >
                  <SelectTrigger className="h-10">
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
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">License Expiration</Label>
                <Input
                  type="date"
                  value={application.license_expiration_date || ''}
                  onChange={e => onUpdate('license_expiration_date', e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs text-muted-foreground mb-1.5 block">Resident License #</Label>
                <Input
                  value={application.resident_license_number || ''}
                  onChange={e => onUpdate('resident_license_number', e.target.value)}
                  placeholder="Resident license number"
                  className="h-10"
                />
              </div>
            </div>
          </section>

          {/* Section: Addresses */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <MapPin className="h-4 w-4" />
              <h2 className="text-sm font-semibold uppercase tracking-wide">Addresses</h2>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Home Address *</Label>
                <AddressFields
                  address={homeAddress}
                  onChange={addr => onUpdate('home_address', addr)}
                  prefix="home"
                />
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={application.mailing_address_same_as_home}
                    onCheckedChange={checked => onUpdate('mailing_address_same_as_home', !!checked)}
                  />
                  <span className="text-sm">Mailing address same as home</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={application.ups_address_same_as_home}
                    onCheckedChange={checked => onUpdate('ups_address_same_as_home', !!checked)}
                  />
                  <span className="text-sm">UPS/Shipping address same as home</span>
                </label>
              </div>

              {!application.mailing_address_same_as_home && (
                <div className="animate-fade-in">
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Mailing Address</Label>
                  <AddressFields
                    address={mailingAddress}
                    onChange={addr => onUpdate('mailing_address', addr)}
                    prefix="mailing"
                  />
                </div>
              )}

              {!application.ups_address_same_as_home && (
                <div className="animate-fade-in">
                  <Label className="text-xs text-muted-foreground mb-1.5 block">UPS/Shipping Address</Label>
                  <AddressFields
                    address={upsAddress}
                    onChange={addr => onUpdate('ups_address', addr)}
                    prefix="ups"
                  />
                </div>
              )}

              {/* Previous Addresses */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs text-muted-foreground">Previous Addresses (last 10 years)</Label>
                  <Button variant="ghost" size="sm" onClick={addPreviousAddress} className="h-7 text-xs">
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </div>
                {previousAddresses.length > 0 && (
                  <div className="space-y-3">
                    {previousAddresses.map((addr, index) => (
                      <div key={index} className="flex gap-2 items-start animate-fade-in">
                        <div className="flex-1">
                          <AddressFields
                            address={addr}
                            onChange={newAddr => updatePreviousAddress(index, newAddr)}
                            prefix={`prev_${index}`}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => removePreviousAddress(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Acknowledgment & Signature */}
          <section className="rounded-xl border border-border/50 bg-muted/30 p-5 space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              By signing this form, I acknowledge that all information is true and correct to the best of my knowledge.
              I agree to receive all carrier required emails, and Tyler Insurance Group Compliance updates.
              Additionally, by checking here, I agree to let Tyler Insurance Group send me information about
              carriers, products, and lead opportunities.
            </p>
            
            <div className="flex items-start gap-3">
              <Checkbox
                id="personal_info_acknowledged"
                checked={personalInfoAcknowledged}
                onCheckedChange={checked => {
                  onUpdate('agreements', {
                    ...application.agreements,
                    personal_info_acknowledged: !!checked
                  });
                }}
                className="mt-0.5"
              />
              <Label htmlFor="personal_info_acknowledged" className="text-sm font-medium cursor-pointer">
                I acknowledge and agree to the above statements *
              </Label>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-2">
              <div className="flex items-center gap-3">
                <Label className="text-sm text-muted-foreground whitespace-nowrap">Initials *</Label>
                <Input
                  value={application.signature_initials || ''}
                  onChange={e => onUpdate('signature_initials', e.target.value.toUpperCase())}
                  placeholder="AB"
                  maxLength={4}
                  className="h-10 w-20 text-center font-semibold text-lg tracking-widest uppercase border-b-2 border-primary/50 rounded-none bg-transparent focus-visible:ring-0 focus-visible:border-primary"
                />
              </div>
              <div className="flex items-center gap-3">
                <Label className="text-sm text-muted-foreground whitespace-nowrap">Date *</Label>
                <Input
                  type="date"
                  value={application.signature_date?.split('T')[0] || new Date().toISOString().split('T')[0]}
                  onChange={e => onUpdate('signature_date', e.target.value)}
                  className="h-10 w-40"
                />
              </div>
            </div>
          </section>
        </div>
      </ScrollArea>

      {/* Navigation - Fixed at bottom */}
      <div className="flex justify-between pt-4 mt-auto border-t">
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
