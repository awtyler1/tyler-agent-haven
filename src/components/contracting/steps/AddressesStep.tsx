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
    <div className="grid gap-4">
      <div className="space-y-2">
        <Label htmlFor={`${prefix}_street`}>Street Address</Label>
        <Input
          id={`${prefix}_street`}
          value={address.street}
          onChange={e => onChange({ ...address, street: e.target.value })}
          placeholder="123 Main St"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${prefix}_city`}>City</Label>
          <Input
            id={`${prefix}_city`}
            value={address.city}
            onChange={e => onChange({ ...address, city: e.target.value })}
            placeholder="Louisville"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}_state`}>State</Label>
          <Select
            value={address.state}
            onValueChange={value => onChange({ ...address, state: value })}
          >
            <SelectTrigger>
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
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${prefix}_zip`}>ZIP Code</Label>
          <Input
            id={`${prefix}_zip`}
            value={address.zip}
            onChange={e => onChange({ ...address, zip: e.target.value })}
            placeholder="40202"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}_county`}>County</Label>
          <Input
            id={`${prefix}_county`}
            value={address.county}
            onChange={e => onChange({ ...address, county: e.target.value })}
            placeholder="Jefferson"
          />
        </div>
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

  const isValid = homeAddress.street && homeAddress.city && homeAddress.state && homeAddress.zip;

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Address Information
          </CardTitle>
          <CardDescription>
            We use these addresses for licensing, contracting, and mail. Use your legal residential address.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Home Address */}
          <div className="space-y-4">
            <h3 className="font-medium">Home Address *</h3>
            <AddressFields
              address={homeAddress}
              onChange={addr => onUpdate('home_address', addr)}
              prefix="home"
            />
          </div>

          {/* Mailing Address */}
          <div className="space-y-4">
            <h3 className="font-medium">Mailing Address</h3>
            <div className="flex items-center gap-2">
              <Checkbox
                id="mailing_same"
                checked={application.mailing_address_same_as_home}
                onCheckedChange={checked => onUpdate('mailing_address_same_as_home', !!checked)}
              />
              <Label htmlFor="mailing_same" className="font-normal cursor-pointer">
                Same as home address
              </Label>
            </div>
            {!application.mailing_address_same_as_home && (
              <AddressFields
                address={mailingAddress}
                onChange={addr => onUpdate('mailing_address', addr)}
                prefix="mailing"
              />
            )}
          </div>

          {/* UPS Address */}
          <div className="space-y-4">
            <h3 className="font-medium">UPS Street Address</h3>
            <div className="flex items-center gap-2">
              <Checkbox
                id="ups_same"
                checked={application.ups_address_same_as_home}
                onCheckedChange={checked => onUpdate('ups_address_same_as_home', !!checked)}
              />
              <Label htmlFor="ups_same" className="font-normal cursor-pointer">
                Same as home address
              </Label>
            </div>
            {!application.ups_address_same_as_home && (
              <AddressFields
                address={upsAddress}
                onChange={addr => onUpdate('ups_address', addr)}
                prefix="ups"
              />
            )}
          </div>

          {/* Previous Addresses */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Previous Addresses (within last 10 years)</h3>
              <Button variant="outline" size="sm" onClick={addPreviousAddress}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
            {previousAddresses.map((addr, index) => (
              <div key={index} className="relative border rounded-lg p-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => removePreviousAddress(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <AddressFields
                  address={addr}
                  onChange={newAddr => updatePreviousAddress(index, newAddr)}
                  prefix={`prev_${index}`}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
            <Button onClick={onContinue}>
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}