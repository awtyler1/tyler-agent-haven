import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ContractingApplication, US_STATES } from '@/types/contracting';
import { Lock, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FormFieldError, getFieldErrorClass } from '../FormFieldError';
import { formatSSN } from '@/lib/formatters';

interface LicensingSectionProps {
  application: ContractingApplication;
  onUpdate: <K extends keyof ContractingApplication>(field: K, value: ContractingApplication[K]) => void;
  disabled?: boolean;
  fieldErrors?: Record<string, string>;
  showValidation?: boolean;
  onClearError?: (field: string) => void;
}

export function LicensingSection({ application, onUpdate, disabled, fieldErrors = {}, showValidation = false, onClearError }: LicensingSectionProps) {

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
          {/* Identity Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="tax_id" className="block text-sm font-medium text-slate-700">
                SSN <span className="text-rose-400">*</span>
              </label>
              <input
                id="tax_id"
                value={application.tax_id || ''}
                onChange={(e) => {
                  const formatted = formatSSN(e.target.value);
                  onUpdate('tax_id', formatted);
                  if (formatted.length === 11 && onClearError) onClearError('tax_id');
                }}
                placeholder="XXX-XX-XXXX"
                className={cn(
                  "w-full h-12 px-4 rounded-xl bg-slate-50 border text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 focus:border-transparent transition-all duration-200",
                  fieldErrors.tax_id && showValidation && "border-rose-300 bg-rose-50 focus:ring-rose-500"
                )}
                maxLength={11}
              />
              <FormFieldError error={fieldErrors.tax_id} show={showValidation} />
              {!fieldErrors.tax_id && <p className="text-xs text-slate-400">Used only for contracting. Securely encrypted.</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="agency_name" className="block text-sm font-medium text-slate-700">
                Agency / Business Name
              </label>
              <input
                id="agency_name"
                value={application.agency_name || ''}
                onChange={(e) => {
                  onUpdate('agency_name', e.target.value);
                }}
                placeholder="If applicable"
                className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="agency_tax_id" className="block text-sm font-medium text-slate-700">
                Agency Tax ID
              </label>
              <input
                id="agency_tax_id"
                value={(application as any).agency_tax_id || ''}
                onChange={(e) => {
                  onUpdate('agency_tax_id' as any, e.target.value);
                }}
                placeholder="XX-XXXXXXX"
                className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 focus:border-transparent transition-all duration-200"
                maxLength={10}
              />
              <p className="text-xs text-slate-400">If different from SSN</p>
            </div>
          </div>

          {/* License Information */}
          <div className="pt-6 border-t border-slate-200">
            <h4 className="text-sm font-medium mb-4">Insurance License</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="npn_number" className="block text-sm font-medium text-slate-700">
                  NPN Number <span className="text-rose-400">*</span>
                </label>
                <input
                  id="npn_number"
                  value={application.npn_number || ''}
                  onChange={(e) => {
                    onUpdate('npn_number', e.target.value);
                    if (e.target.value && onClearError) onClearError('npn_number');
                  }}
                  placeholder="National Producer Number"
                  className={cn(
                    "w-full h-12 px-4 rounded-xl bg-slate-50 border text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 focus:border-transparent transition-all duration-200",
                    fieldErrors.npn_number && showValidation && "border-rose-300 bg-rose-50 focus:ring-rose-500"
                  )}
                />
                <FormFieldError error={fieldErrors.npn_number} show={showValidation} />
              </div>

              <div className="space-y-2">
                <label htmlFor="insurance_license_number" className="block text-sm font-medium text-slate-700">
                  Insurance License # <span className="text-rose-400">*</span>
                </label>
                <input
                  id="insurance_license_number"
                  value={application.insurance_license_number || ''}
                  onChange={(e) => {
                    onUpdate('insurance_license_number', e.target.value);
                    if (e.target.value && onClearError) onClearError('insurance_license_number');
                  }}
                  className={cn(
                    "w-full h-12 px-4 rounded-xl bg-slate-50 border text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 focus:border-transparent transition-all duration-200",
                    fieldErrors.insurance_license_number && showValidation && "border-rose-300 bg-rose-50 focus:ring-rose-500"
                  )}
                />
                <FormFieldError error={fieldErrors.insurance_license_number} show={showValidation} />
              </div>

              <div className="space-y-2">
                <label htmlFor="resident_state" className="block text-sm font-medium text-slate-700">
                  Resident State <span className="text-rose-400">*</span>
                </label>
                <Select value={application.resident_state || ''} onValueChange={(v) => {
                  onUpdate('resident_state', v);
                  if (v && onClearError) onClearError('resident_state');
                }}>
                  <SelectTrigger className={cn(
                    "h-12 rounded-xl bg-slate-50 border border-slate-200",
                    fieldErrors.resident_state && showValidation && "border-rose-300 bg-rose-50"
                  )}>
                    <SelectValue placeholder="Select state..." />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map((state) => (
                      <SelectItem key={state.code} value={state.code}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormFieldError error={fieldErrors.resident_state} show={showValidation} />
              </div>
            </div>
          </div>

          {/* Driver's License */}
          <div className="pt-6 border-t border-slate-200">
            <h4 className="text-sm font-medium mb-4">Driver's License</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="drivers_license_number" className="block text-sm font-medium text-slate-700">
                  Driver's License # <span className="text-rose-400">*</span>
                </label>
                <input
                  id="drivers_license_number"
                  value={application.drivers_license_number || ''}
                  onChange={(e) => {
                    onUpdate('drivers_license_number', e.target.value);
                    if (e.target.value && onClearError) onClearError('drivers_license_number');
                  }}
                  className={cn(
                    "w-full h-12 px-4 rounded-xl bg-slate-50 border text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 focus:border-transparent transition-all duration-200",
                    fieldErrors.drivers_license_number && showValidation && "border-rose-300 bg-rose-50 focus:ring-rose-500"
                  )}
                />
                <FormFieldError error={fieldErrors.drivers_license_number} show={showValidation} />
              </div>

              <div className="space-y-2">
                <label htmlFor="drivers_license_state" className="block text-sm font-medium text-slate-700">
                  Driver's License State <span className="text-rose-400">*</span>
                </label>
                <Select value={application.drivers_license_state || ''} onValueChange={(v) => {
                  onUpdate('drivers_license_state', v);
                  if (v && onClearError) onClearError('drivers_license_state');
                }}>
                  <SelectTrigger className={cn(
                    "h-12 rounded-xl bg-slate-50 border border-slate-200",
                    fieldErrors.drivers_license_state && showValidation && "border-rose-300 bg-rose-50"
                  )}>
                    <SelectValue placeholder="Select state..." />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map((state) => (
                      <SelectItem key={state.code} value={state.code}>
                        {state.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormFieldError error={fieldErrors.drivers_license_state} show={showValidation} />
              </div>
            </div>
          </div>

          {/* Corporation */}
          <div className="pt-6 border-t border-slate-200">
            <label 
              className="flex items-center gap-3 p-4 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
              onClick={() => onUpdate('is_corporation', !application.is_corporation)}
            >
              <div className={cn(
                "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                application.is_corporation
                  ? "bg-slate-900 border-slate-900" 
                  : "border-slate-300"
              )}>
                {application.is_corporation && <Check className="h-3 w-3 text-white" />}
              </div>
              <div>
                <span className="text-sm font-medium text-slate-700">I am applying as a corporation or business entity</span>
                <p className="text-xs text-slate-500">Additional documentation may be required</p>
              </div>
            </label>
          </div>

        </div>
      </div>
    </div>
  );
}
