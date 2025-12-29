import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ContractingApplication, US_STATES } from '@/types/contracting';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { FormFieldError, getFieldErrorClass } from '../FormFieldError';

interface AdditionalLicensesSectionProps {
  application: ContractingApplication;
  onUpdate: <K extends keyof ContractingApplication>(field: K, value: ContractingApplication[K]) => void;
  disabled?: boolean;
  fieldErrors?: Record<string, string>;
  showValidation?: boolean;
  onClearError?: (field: string) => void;
}

export function AdditionalLicensesSection({ 
  application, 
  onUpdate, 
  disabled,
  fieldErrors = {},
  showValidation = false,
  onClearError
}: AdditionalLicensesSectionProps) {
  const nonResidentStates = application.non_resident_states || [];

  const toggleState = (stateCode: string) => {
    if (nonResidentStates.includes(stateCode)) {
      onUpdate('non_resident_states', nonResidentStates.filter(s => s !== stateCode));
    } else {
      onUpdate('non_resident_states', [...nonResidentStates, stateCode]);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-8">
      <div className="space-y-8" style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
        
        {/* Non-Resident States */}
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-slate-900">Non-Resident States</Label>
            <p className="text-sm text-slate-500 mt-1">
              Select any other states where you hold a license
            </p>
          </div>
          
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
            {US_STATES.filter(state => state.code !== application.resident_state).map((state) => {
              const isSelected = nonResidentStates.includes(state.code);
              return (
                <button
                  key={state.code}
                  type="button"
                  onClick={() => toggleState(state.code)}
                  className={cn(
                    "py-2 px-1 rounded-lg text-xs font-medium transition-all",
                    isSelected
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {state.code}
                </button>
              );
            })}
          </div>
          
          {nonResidentStates.length > 0 && (
            <p className="text-sm text-slate-500">
              Selected: {nonResidentStates.map(code => 
                US_STATES.find(s => s.code === code)?.name
              ).join(', ')}
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-100" />

        {/* FINRA */}
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <div className={cn(
              "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
              application.is_finra_registered 
                ? "bg-slate-900 border-slate-900" 
                : "border-slate-300"
            )}>
              {application.is_finra_registered && <Check className="h-3 w-3 text-white" />}
            </div>
            <input
              type="checkbox"
              className="sr-only"
              checked={application.is_finra_registered || false}
              onChange={(e) => {
                onUpdate('is_finra_registered', e.target.checked);
                if (!e.target.checked) {
                  onUpdate('finra_broker_dealer_name', null);
                  onUpdate('finra_crd_number', null);
                }
              }}
            />
            <div>
              <span className="text-sm font-medium text-slate-900">I am registered with FINRA</span>
              <p className="text-sm text-slate-500">Financial Industry Regulatory Authority</p>
            </div>
          </label>

          {application.is_finra_registered && (
            <div className="grid grid-cols-2 gap-4 pl-8 animate-in fade-in duration-200">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Broker-Dealer Name <span className="text-rose-400">*</span>
                </Label>
                <Input
                  value={application.finra_broker_dealer_name || ''}
                  onChange={(e) => {
                    onUpdate('finra_broker_dealer_name', e.target.value);
                    if (onClearError) onClearError('finra_broker_dealer_name');
                  }}
                  placeholder="Enter name"
                  className={cn(
                    "h-12 rounded-xl bg-slate-50 border-slate-200",
                    getFieldErrorClass(!!fieldErrors.finra_broker_dealer_name, showValidation)
                  )}
                />
                <FormFieldError error={fieldErrors.finra_broker_dealer_name} show={showValidation} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  CRD Number <span className="text-rose-400">*</span>
                </Label>
                <Input
                  value={application.finra_crd_number || ''}
                  onChange={(e) => {
                    onUpdate('finra_crd_number', e.target.value);
                    if (onClearError) onClearError('finra_crd_number');
                  }}
                  placeholder="Enter CRD #"
                  className={cn(
                    "h-12 rounded-xl bg-slate-50 border-slate-200",
                    getFieldErrorClass(!!fieldErrors.finra_crd_number, showValidation)
                  )}
                />
                <FormFieldError error={fieldErrors.finra_crd_number} show={showValidation} />
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

