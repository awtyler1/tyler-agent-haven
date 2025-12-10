import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ContractingApplication, Address, EMPTY_ADDRESS, US_STATES } from '@/types/contracting';
import { User, MapPin, Plus, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PersonalInfoStepProps {
  application: ContractingApplication;
  onUpdate: <K extends keyof ContractingApplication>(field: K, value: ContractingApplication[K]) => void;
  onBack: () => void;
  onContinue: () => void;
}

function CompactAddressFields({ 
  address, 
  onChange, 
  prefix 
}: { 
  address: Address; 
  onChange: (address: Address) => void;
  prefix: string;
}) {
  return (
    <div className="grid gap-2 grid-cols-6">
      <div className="col-span-2 space-y-1">
        <Label htmlFor={`${prefix}_street`} className="text-xs">Street</Label>
        <Input
          id={`${prefix}_street`}
          value={address.street}
          onChange={e => onChange({ ...address, street: e.target.value })}
          placeholder="123 Main St"
          className="h-8 text-sm"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`${prefix}_city`} className="text-xs">City</Label>
        <Input
          id={`${prefix}_city`}
          value={address.city}
          onChange={e => onChange({ ...address, city: e.target.value })}
          placeholder="Louisville"
          className="h-8 text-sm"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`${prefix}_state`} className="text-xs">State</Label>
        <Select
          value={address.state}
          onValueChange={value => onChange({ ...address, state: value })}
        >
          <SelectTrigger className="h-8 text-sm">
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
      </div>
      <div className="space-y-1">
        <Label htmlFor={`${prefix}_zip`} className="text-xs">ZIP</Label>
        <Input
          id={`${prefix}_zip`}
          value={address.zip}
          onChange={e => onChange({ ...address, zip: e.target.value })}
          placeholder="40202"
          className="h-8 text-sm"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`${prefix}_county`} className="text-xs">County</Label>
        <Input
          id={`${prefix}_county`}
          value={address.county}
          onChange={e => onChange({ ...address, county: e.target.value })}
          placeholder="Jefferson"
          className="h-8 text-sm"
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

  return (
    <div className="max-w-5xl mx-auto">
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-4 w-4" />
            Personal & Contact Information
          </CardTitle>
          <CardDescription className="text-sm">
            Enter your personal details, contact info, and addresses
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-4">
          <ScrollArea className="h-[420px] pr-4">
            <div className="space-y-4">
              {/* Personal Details */}
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

              {/* License & ID Info */}
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

              {/* Phone Numbers */}
              <div className="grid gap-3 grid-cols-2">
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
              </div>

              {/* Divider */}
              <div className="flex items-center gap-2 pt-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium text-sm">Address Information</h3>
              </div>

              {/* Home Address */}
              <div className="space-y-2">
                <h4 className="font-medium text-xs text-muted-foreground">Home Address *</h4>
                <CompactAddressFields
                  address={homeAddress}
                  onChange={addr => onUpdate('home_address', addr)}
                  prefix="home"
                />
              </div>

              {/* Mailing Address */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h4 className="font-medium text-xs text-muted-foreground">Mailing Address</h4>
                  <div className="flex items-center gap-1.5">
                    <Checkbox
                      id="mailing_same"
                      checked={application.mailing_address_same_as_home}
                      onCheckedChange={checked => onUpdate('mailing_address_same_as_home', !!checked)}
                      className="h-3.5 w-3.5"
                    />
                    <Label htmlFor="mailing_same" className="text-xs font-normal cursor-pointer">
                      Same as home
                    </Label>
                  </div>
                </div>
                {!application.mailing_address_same_as_home && (
                  <CompactAddressFields
                    address={mailingAddress}
                    onChange={addr => onUpdate('mailing_address', addr)}
                    prefix="mailing"
                  />
                )}
              </div>

              {/* UPS Address */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h4 className="font-medium text-xs text-muted-foreground">UPS Street Address</h4>
                  <div className="flex items-center gap-1.5">
                    <Checkbox
                      id="ups_same"
                      checked={application.ups_address_same_as_home}
                      onCheckedChange={checked => onUpdate('ups_address_same_as_home', !!checked)}
                      className="h-3.5 w-3.5"
                    />
                    <Label htmlFor="ups_same" className="text-xs font-normal cursor-pointer">
                      Same as home
                    </Label>
                  </div>
                </div>
                {!application.ups_address_same_as_home && (
                  <CompactAddressFields
                    address={upsAddress}
                    onChange={addr => onUpdate('ups_address', addr)}
                    prefix="ups"
                  />
                )}
              </div>

              {/* Previous Addresses */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-xs text-muted-foreground">Previous Addresses (last 10 years)</h4>
                  <Button variant="outline" size="sm" onClick={addPreviousAddress} className="h-7 text-xs">
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>
                {previousAddresses.map((addr, index) => (
                  <div key={index} className="relative border rounded-lg p-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={() => removePreviousAddress(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <CompactAddressFields
                      address={addr}
                      onChange={newAddr => updatePreviousAddress(index, newAddr)}
                      prefix={`prev_${index}`}
                    />
                  </div>
                ))}
              </div>

              {/* Acknowledgment & Signature Section */}
              <div className="border-t pt-4 mt-4 space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <p className="text-xs leading-relaxed">
                    By signing this form, I acknowledge that all information is true and correct to the best of my knowledge.
                    I agree to receive all carrier required emails, and Tyler Insurance Group Compliance updates.
                    Additionally, by checking here, I agree to let Tyler Insurance Group send me information about
                    carriers, products, and lead opportunities.
                  </p>
                  <div className="flex items-center gap-2">
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
                    <Label htmlFor="personal_info_acknowledged" className="text-xs font-medium cursor-pointer">
                      I agree to the above statement *
                    </Label>
                  </div>
                </div>

                <div className="flex gap-4 items-end">
                  <div className="space-y-1 flex-1 max-w-[200px]">
                    <Label htmlFor="personal_info_initials" className="text-xs">Initials *</Label>
                    <Input
                      id="personal_info_initials"
                      value={application.signature_initials || ''}
                      onChange={e => onUpdate('signature_initials', e.target.value.toUpperCase())}
                      placeholder="JD"
                      maxLength={4}
                      className="h-10 text-center text-lg font-semibold tracking-widest uppercase"
                    />
                  </div>
                  <div className="space-y-1 flex-1 max-w-[200px]">
                    <Label htmlFor="personal_info_date" className="text-xs">Date *</Label>
                    <Input
                      id="personal_info_date"
                      type="date"
                      value={application.signature_date?.split('T')[0] || new Date().toISOString().split('T')[0]}
                      onChange={e => onUpdate('signature_date', e.target.value)}
                      className="h-10 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="flex justify-between pt-4 border-t mt-4">
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