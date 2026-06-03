import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ContractingApplication, Address, EMPTY_ADDRESS, US_STATES } from '@/types/contracting';
import { Lock, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FormFieldError, getFieldErrorClass } from '../FormFieldError';

interface AddressSectionProps {
  application: ContractingApplication;
  onUpdate: <K extends keyof ContractingApplication>(field: K, value: ContractingApplication[K]) => void;
  disabled?: boolean;
  fieldErrors?: Record<string, string>;
  showValidation?: boolean;
  onClearError?: (field: string) => void;
}

function AddressFields({ 
  label, 
  address, 
  onChange,
  required = false,
  hasError = false,
  showValidation = false,
  onClearError,
  errorField,
}: { 
  label: string;
  address: Address; 
  onChange: (address: Address) => void;
  required?: boolean;
  hasError?: boolean;
  showValidation?: boolean;
  onClearError?: (field: string) => void;
  errorField?: string;
}) {
  const updateField = (field: keyof Address, value: string) => {
    const newAddress = { ...address, [field]: value };
    onChange(newAddress);
    // Check if address is now complete and clear error
    if (onClearError && errorField && value) {
      const isComplete = newAddress.street?.trim() && newAddress.city?.trim() && newAddress.state && newAddress.zip?.trim();
      if (isComplete) {
        onClearError(errorField);
      }
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-700">
        {label} {required && <span className="text-rose-400">*</span>}
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="md:col-span-2">
          <input
            value={address.street || ''}
            onChange={(e) => updateField('street', e.target.value)}
            placeholder="Street Address"
            className={cn(
              "w-full h-12 px-4 rounded-xl bg-slate-50 border text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 focus:border-transparent transition-all duration-200",
              hasError && showValidation && !address.street?.trim() && "border-rose-300 bg-rose-50 focus:ring-rose-500"
            )}
          />
        </div>
        <input
          value={address.city || ''}
          onChange={(e) => updateField('city', e.target.value)}
          placeholder="City"
          className={cn(
            "w-full h-12 px-4 rounded-xl bg-slate-50 border text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 focus:border-transparent transition-all duration-200",
            hasError && showValidation && !address.city?.trim() && "border-rose-300 bg-rose-50 focus:ring-rose-500"
          )}
        />
        <div className="grid grid-cols-2 gap-3">
          <Select value={address.state || ''} onValueChange={(v) => updateField('state', v)}>
            <SelectTrigger className={cn(
              "h-12 rounded-xl bg-slate-50 border border-slate-200",
              hasError && showValidation && !address.state && "border-rose-300 bg-rose-50"
            )}>
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
          <input
            value={address.zip || ''}
            onChange={(e) => updateField('zip', e.target.value)}
            placeholder="ZIP"
            className={cn(
              "w-full h-12 px-4 rounded-xl bg-slate-50 border text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 focus:border-transparent transition-all duration-200",
              hasError && showValidation && !address.zip?.trim() && "border-rose-300 bg-rose-50 focus:ring-rose-500"
            )}
            maxLength={10}
          />
        </div>
        <input
          value={address.county || ''}
          onChange={(e) => updateField('county', e.target.value)}
          placeholder="County"
          className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 focus:border-transparent transition-all duration-200"
        />
      </div>
      <FormFieldError error={hasError && showValidation ? "Please complete all address fields" : undefined} show={hasError && showValidation} />
    </div>
  );
}

export function AddressSection({ application, onUpdate, disabled, fieldErrors = {}, showValidation = false, onClearError }: AddressSectionProps) {
  const homeAddress = application.home_address || EMPTY_ADDRESS;
  const mailingAddress = application.mailing_address || EMPTY_ADDRESS;
  const upsAddress = application.ups_address || EMPTY_ADDRESS;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
      <div className="p-8">
        {disabled && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 text-slate-400 mb-6">
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
            hasError={!!fieldErrors.home_address}
            showValidation={showValidation}
            onClearError={onClearError}
            errorField="home_address"
          />

          {/* Mailing Address */}
          <div className="pt-6 border-t border-slate-200">
            <label 
              className="flex items-center gap-3 p-4 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
              onClick={() => onUpdate('mailing_address_same_as_home', application.mailing_address_same_as_home === false)}
            >
              <div className={cn(
                "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                application.mailing_address_same_as_home !== false
                  ? "bg-slate-900 border-slate-900" 
                  : "border-slate-300"
              )}>
                {application.mailing_address_same_as_home !== false && <Check className="h-3 w-3 text-white" />}
              </div>
              <span className="text-sm text-slate-700">Mailing address is the same as home address</span>
            </label>
            
            {!application.mailing_address_same_as_home && (
              <div className="mt-4">
                <AddressFields
                  label="Mailing Address"
                  address={mailingAddress}
                  onChange={(addr) => onUpdate('mailing_address', addr)}
                />
              </div>
            )}
          </div>

          {/* UPS/Shipping Address */}
          <div className="pt-6 border-t border-slate-200">
            <label 
              className="flex items-center gap-3 p-4 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
              onClick={() => onUpdate('ups_address_same_as_home', application.ups_address_same_as_home === false)}
            >
              <div className={cn(
                "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                application.ups_address_same_as_home !== false
                  ? "bg-slate-900 border-slate-900" 
                  : "border-slate-300"
              )}>
                {application.ups_address_same_as_home !== false && <Check className="h-3 w-3 text-white" />}
              </div>
              <span className="text-sm text-slate-700">UPS/Shipping address is the same as home address</span>
            </label>
            
            {!application.ups_address_same_as_home && (
              <div className="mt-4">
                <AddressFields
                  label="UPS/Shipping Address"
                  address={upsAddress}
                  onChange={(addr) => onUpdate('ups_address', addr)}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
