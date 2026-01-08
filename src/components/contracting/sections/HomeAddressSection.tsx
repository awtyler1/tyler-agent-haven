import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ContractingApplication, Address, EMPTY_ADDRESS, US_STATES } from '@/types/contracting';
import { cn } from '@/lib/utils';
import { FormFieldError } from '../FormFieldError';
import { AddressAutocomplete, ParsedAddress } from '../AddressAutocomplete';

interface HomeAddressSectionProps {
  application: ContractingApplication;
  onUpdate: <K extends keyof ContractingApplication>(field: K, value: ContractingApplication[K]) => void;
  disabled?: boolean;
  fieldErrors?: Record<string, string>;
  fieldSuccess?: Record<string, boolean>;
  showValidation?: boolean;
  onClearError?: (field: string) => void;
  onFieldBlur?: (fieldName: string, value: any, application: ContractingApplication) => void;
}

export function HomeAddressSection({
  application,
  onUpdate,
  disabled,
  fieldErrors = {},
  fieldSuccess = {},
  showValidation = false,
  onClearError,
  onFieldBlur
}: HomeAddressSectionProps) {
  const homeAddress = (application.home_address as Address) || EMPTY_ADDRESS;

  // Helper to get field styling based on validation state
  const getFieldClass = (fieldName: string) => {
    const hasError = fieldErrors[fieldName] && (showValidation || fieldErrors[fieldName]);
    const isSuccess = fieldSuccess[fieldName];

    if (hasError) return "border-amber-400 focus:ring-amber-400/20";
    if (isSuccess) return "border-green-400/50";
    return "border-slate-200";
  };

  const updateAddress = (field: keyof Address, value: string) => {
    onUpdate('home_address', { ...homeAddress, [field]: value });
    if (value && onClearError) onClearError(`home_address.${field}`);
  };

  const handleAddressBlur = (field: keyof Address) => {
    if (onFieldBlur) {
      onFieldBlur(`home_address.${field}`, homeAddress[field], application);
    }
  };

  // Handle address selection from autocomplete
  const handleAddressSelect = (parsed: ParsedAddress) => {
    // Update all address fields at once
    const updatedAddress: Address = {
      street: parsed.street,
      city: parsed.city,
      state: parsed.state,
      zip: parsed.zip,
      county: parsed.county || homeAddress.county, // Keep existing county if not provided
    };

    onUpdate('home_address', updatedAddress);

    // Clear errors for all populated fields
    if (onClearError) {
      if (parsed.street) onClearError('home_address.street');
      if (parsed.city) onClearError('home_address.city');
      if (parsed.state) onClearError('home_address.state');
      if (parsed.zip) onClearError('home_address.zip');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
      <div className="space-y-4" style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
        
        {/* Street with Autocomplete */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">
            Street Address <span className="text-amber-500">*</span>
          </Label>
          <AddressAutocomplete
            value={homeAddress.street || ''}
            onChange={(value) => updateAddress('street', value)}
            onAddressSelect={handleAddressSelect}
            onBlur={() => handleAddressBlur('street')}
            placeholder="Start typing your address..."
            disabled={disabled}
            className={cn(
              "h-12 rounded-xl bg-slate-50",
              getFieldClass('home_address.street')
            )}
          />
          <p className="text-xs text-slate-400">Start typing to search for your address</p>
          <FormFieldError error={fieldErrors['home_address.street']} show={!!fieldErrors['home_address.street']} />
        </div>

        {/* City, State, Zip */}
        <div className="grid grid-cols-6 gap-4">
          <div className="col-span-3 space-y-2">
            <Label className="text-sm font-medium text-slate-700">
              City <span className="text-amber-500">*</span>
            </Label>
            <Input
              value={homeAddress.city || ''}
              onChange={(e) => updateAddress('city', e.target.value)}
              onBlur={() => handleAddressBlur('city')}
              placeholder="City"
              className={cn(
                "h-12 rounded-xl bg-slate-50",
                getFieldClass('home_address.city')
              )}
            />
            <FormFieldError error={fieldErrors['home_address.city']} show={!!fieldErrors['home_address.city']} />
          </div>

          <div className="col-span-2 space-y-2">
            <Label className="text-sm font-medium text-slate-700">
              State <span className="text-amber-500">*</span>
            </Label>
            <Select
              value={homeAddress.state || ''}
              onValueChange={(v) => {
                updateAddress('state', v);
                // Validate immediately on selection
                if (onFieldBlur) {
                  setTimeout(() => onFieldBlur('home_address.state', v, application), 0);
                }
              }}
            >
              <SelectTrigger className={cn(
                "h-12 rounded-xl bg-slate-50",
                getFieldClass('home_address.state')
              )}>
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent>
                {US_STATES.map((state) => (
                  <SelectItem key={state.code} value={state.code}>
                    {state.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormFieldError error={fieldErrors['home_address.state']} show={!!fieldErrors['home_address.state']} />
          </div>

          <div className="col-span-1 space-y-2">
            <Label className="text-sm font-medium text-slate-700">
              ZIP <span className="text-amber-500">*</span>
            </Label>
            <Input
              value={homeAddress.zip || ''}
              onChange={(e) => updateAddress('zip', e.target.value)}
              onBlur={() => handleAddressBlur('zip')}
              placeholder="12345"
              className={cn(
                "h-12 rounded-xl bg-slate-50",
                getFieldClass('home_address.zip')
              )}
            />
            <FormFieldError error={fieldErrors['home_address.zip']} show={!!fieldErrors['home_address.zip']} />
          </div>
        </div>

        {/* County */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">
            County <span className="text-slate-400 font-normal">(optional)</span>
          </Label>
          <Input
            value={homeAddress.county || ''}
            onChange={(e) => updateAddress('county', e.target.value)}
            placeholder="Auto-filled from address"
            className="h-12 rounded-xl bg-slate-50 border-slate-200"
          />
        </div>

      </div>
    </div>
  );
}

