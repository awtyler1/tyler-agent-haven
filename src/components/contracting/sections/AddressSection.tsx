import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ContractingApplication, Address, EMPTY_ADDRESS, US_STATES } from '@/types/contracting';
import { MapPin, Lock } from 'lucide-react';

interface AddressSectionProps {
  application: ContractingApplication;
  onUpdate: <K extends keyof ContractingApplication>(field: K, value: ContractingApplication[K]) => void;
  disabled?: boolean;
}

function AddressFields({ 
  label, 
  address, 
  onChange,
  required = false,
}: { 
  label: string;
  address: Address; 
  onChange: (address: Address) => void;
  required?: boolean;
}) {
  const updateField = (field: keyof Address, value: string) => {
    onChange({ ...address, [field]: value });
  };

  return (
    <div className="space-y-3">
      <Label className="font-medium">{label} {required && <span className="text-destructive">*</span>}</Label>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="md:col-span-2">
          <Input
            value={address.street || ''}
            onChange={(e) => updateField('street', e.target.value)}
            placeholder="Street Address"
            className="h-11 rounded-xl"
          />
        </div>
        <Input
          value={address.city || ''}
          onChange={(e) => updateField('city', e.target.value)}
          placeholder="City"
          className="h-11 rounded-xl"
        />
        <div className="grid grid-cols-2 gap-3">
          <Select value={address.state || ''} onValueChange={(v) => updateField('state', v)}>
            <SelectTrigger className="h-11 rounded-xl">
              <SelectValue placeholder="State" />
            </SelectTrigger>
            <SelectContent>
              {US_STATES.map((state) => (
                <SelectItem key={state.code} value={state.code}>
                  {state.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={address.zip || ''}
            onChange={(e) => updateField('zip', e.target.value)}
            placeholder="ZIP"
            className="h-11 rounded-xl"
            maxLength={10}
          />
        </div>
        <Input
          value={address.county || ''}
          onChange={(e) => updateField('county', e.target.value)}
          placeholder="County"
          className="h-11 rounded-xl"
        />
      </div>
    </div>
  );
}

export function AddressSection({ application, onUpdate, disabled }: AddressSectionProps) {
  const homeAddress = application.home_address || EMPTY_ADDRESS;
  const mailingAddress = application.mailing_address || EMPTY_ADDRESS;
  const upsAddress = application.ups_address || EMPTY_ADDRESS;

  return (
    <Card 
      className="rounded-[28px] border-0 overflow-hidden"
      style={{ 
        background: 'linear-gradient(180deg, #FFFFFF 0%, #FEFEFE 100%)',
        boxShadow: '0px 1px 0px rgba(255, 255, 255, 0.8) inset, 0px 20px 60px rgba(0, 0, 0, 0.06)'
      }}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg font-medium">Addresses</CardTitle>
            <p className="text-xs text-muted-foreground/60">Your home, mailing, and shipping addresses</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pb-6">
        {disabled && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 text-muted-foreground/60">
            <Lock className="h-4 w-4" />
            <span className="text-sm">Enter your initials above to unlock this section</span>
          </div>
        )}

        <div style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }} className="space-y-6">
          {/* Home Address */}
          <AddressFields
            label="Home Address"
            address={homeAddress}
            onChange={(addr) => onUpdate('home_address', addr)}
            required
          />

          {/* Mailing Address */}
          <div className="pt-4 border-t border-border/10">
            <label className="flex items-center gap-2 mb-4 cursor-pointer">
              <Checkbox
                checked={application.mailing_address_same_as_home !== false}
                onCheckedChange={(checked) => onUpdate('mailing_address_same_as_home', !!checked)}
              />
              <span className="text-sm">Mailing address is the same as home address</span>
            </label>
            
            {!application.mailing_address_same_as_home && (
              <AddressFields
                label="Mailing Address"
                address={mailingAddress}
                onChange={(addr) => onUpdate('mailing_address', addr)}
              />
            )}
          </div>

          {/* UPS/Shipping Address */}
          <div className="pt-4 border-t border-border/10">
            <label className="flex items-center gap-2 mb-4 cursor-pointer">
              <Checkbox
                checked={application.ups_address_same_as_home !== false}
                onCheckedChange={(checked) => onUpdate('ups_address_same_as_home', !!checked)}
              />
              <span className="text-sm">UPS/Shipping address is the same as home address</span>
            </label>
            
            {!application.ups_address_same_as_home && (
              <AddressFields
                label="UPS/Shipping Address"
                address={upsAddress}
                onChange={(addr) => onUpdate('ups_address', addr)}
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
