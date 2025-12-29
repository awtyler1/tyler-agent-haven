import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ContractingApplication, Address, EMPTY_ADDRESS, US_STATES } from '@/types/contracting';
import { cn } from '@/lib/utils';
import { FormFieldError, getFieldErrorClass } from '../FormFieldError';

interface HomeAddressSectionProps {
  application: ContractingApplication;
  onUpdate: <K extends keyof ContractingApplication>(field: K, value: ContractingApplication[K]) => void;
  disabled?: boolean;
  fieldErrors?: Record<string, string>;
  showValidation?: boolean;
  onClearError?: (field: string) => void;
}

export function HomeAddressSection({ 
  application, 
  onUpdate, 
  disabled,
  fieldErrors = {},
  showValidation = false,
  onClearError 
}: HomeAddressSectionProps) {
  const homeAddress = (application.home_address as Address) || EMPTY_ADDRESS;

  const updateAddress = (field: keyof Address, value: string) => {
    onUpdate('home_address', { ...homeAddress, [field]: value });
    if (value && onClearError) onClearError(`home_address.${field}`);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-8">
      <div className="space-y-6" style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
        
        {/* Street */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">
            Street Address <span className="text-rose-400">*</span>
          </Label>
          <Input
            value={homeAddress.street || ''}
            onChange={(e) => updateAddress('street', e.target.value)}
            placeholder="123 Main Street"
            className={cn(
              "h-12 rounded-xl bg-slate-50 border-slate-200",
              getFieldErrorClass(!!fieldErrors['home_address.street'], showValidation)
            )}
          />
          <FormFieldError error={fieldErrors['home_address.street']} show={showValidation} />
        </div>

        {/* City, State, Zip */}
        <div className="grid grid-cols-6 gap-4">
          <div className="col-span-3 space-y-2">
            <Label className="text-sm font-medium text-slate-700">
              City <span className="text-rose-400">*</span>
            </Label>
            <Input
              value={homeAddress.city || ''}
              onChange={(e) => updateAddress('city', e.target.value)}
              placeholder="City"
              className={cn(
                "h-12 rounded-xl bg-slate-50 border-slate-200",
                getFieldErrorClass(!!fieldErrors['home_address.city'], showValidation)
              )}
            />
            <FormFieldError error={fieldErrors['home_address.city']} show={showValidation} />
          </div>
          
          <div className="col-span-2 space-y-2">
            <Label className="text-sm font-medium text-slate-700">
              State <span className="text-rose-400">*</span>
            </Label>
            <Select 
              value={homeAddress.state || ''} 
              onValueChange={(v) => updateAddress('state', v)}
            >
              <SelectTrigger className={cn(
                "h-12 rounded-xl bg-slate-50 border-slate-200",
                getFieldErrorClass(!!fieldErrors['home_address.state'], showValidation)
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
            <FormFieldError error={fieldErrors['home_address.state']} show={showValidation} />
          </div>
          
          <div className="col-span-1 space-y-2">
            <Label className="text-sm font-medium text-slate-700">
              ZIP <span className="text-rose-400">*</span>
            </Label>
            <Input
              value={homeAddress.zip || ''}
              onChange={(e) => updateAddress('zip', e.target.value)}
              placeholder="12345"
              className={cn(
                "h-12 rounded-xl bg-slate-50 border-slate-200",
                getFieldErrorClass(!!fieldErrors['home_address.zip'], showValidation)
              )}
            />
            <FormFieldError error={fieldErrors['home_address.zip']} show={showValidation} />
          </div>
        </div>

        {/* County */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">County</Label>
          <Input
            value={homeAddress.county || ''}
            onChange={(e) => updateAddress('county', e.target.value)}
            placeholder="County (optional)"
            className="h-12 rounded-xl bg-slate-50 border-slate-200"
          />
        </div>

      </div>
    </div>
  );
}

