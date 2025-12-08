import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ContractingApplication, Address, EMPTY_ADDRESS, US_STATES } from '@/types/contracting';
import { MapPin, Plus, X } from 'lucide-react';

interface AddressesStepProps {
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

export function AddressesStep({ application, onUpdate, onBack, onContinue }: AddressesStepProps) {
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

  return (
    <div className="max-w-5xl mx-auto">
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-4 w-4" />
            Address Information
          </CardTitle>
          <CardDescription className="text-sm">
            We use these addresses for licensing, contracting, and mail.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pb-4">
          {/* Home Address */}
          <div className="space-y-2">
            <h3 className="font-medium text-sm">Home Address *</h3>
            <CompactAddressFields
              address={homeAddress}
              onChange={addr => onUpdate('home_address', addr)}
              prefix="home"
            />
          </div>

          {/* Mailing Address */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h3 className="font-medium text-sm">Mailing Address</h3>
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
              <h3 className="font-medium text-sm">UPS Street Address</h3>
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
              <h3 className="font-medium text-sm">Previous Addresses (last 10 years)</h3>
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
