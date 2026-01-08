import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ContractingApplication, US_STATES } from '@/types/contracting';
import { Mail, Phone, Lock, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FormFieldError, getFieldErrorClass } from '../FormFieldError';
import { formatPhone } from '@/lib/formatters';

interface PersonalInfoSectionProps {
  application: ContractingApplication;
  onUpdate: <K extends keyof ContractingApplication>(field: K, value: ContractingApplication[K]) => void;
  disabled?: boolean;
  fieldErrors?: Record<string, string>;
  fieldSuccess?: Record<string, boolean>;
  showValidation?: boolean;
  onClearError?: (field: string) => void;
  onFieldBlur?: (fieldName: string, value: any, application: ContractingApplication) => void;
}

export function PersonalInfoSection({ application, onUpdate, disabled, fieldErrors = {}, fieldSuccess = {}, showValidation = false, onClearError, onFieldBlur }: PersonalInfoSectionProps) {
  const contactMethods = application.preferred_contact_methods || [];

  // Helper to get field styling based on validation state
  const getFieldClass = (fieldName: string) => {
    const hasError = fieldErrors[fieldName] && (showValidation || fieldErrors[fieldName]);
    const isSuccess = fieldSuccess[fieldName];

    if (hasError) return "border-amber-400 focus:ring-amber-400/20";
    if (isSuccess) return "border-green-400/50";
    return "border-slate-200";
  };

  const toggleContactMethod = (method: string) => {
    if (contactMethods.includes(method)) {
      onUpdate('preferred_contact_methods', contactMethods.filter(m => m !== method));
    } else {
      onUpdate('preferred_contact_methods', [...contactMethods, method]);
    }
  };

  // Normalize gender to "Male" or "Female"
  const normalizedGender = application.gender === 'Male' || application.gender === 'male' ? 'Male' 
    : application.gender === 'Female' || application.gender === 'female' ? 'Female' 
    : '';

  const handleGenderChange = (value: string) => {
    // Always store normalized value
    const normalized = value === 'Male' ? 'Male' : value === 'Female' ? 'Female' : value;
    onUpdate('gender', normalized);
    onClearError?.('gender');
    // Validate immediately on selection
    if (onFieldBlur) {
      setTimeout(() => onFieldBlur('gender', normalized, application), 0);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
      <div className="p-6">
        {disabled && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 text-slate-400 mb-6">
            <Lock className="h-4 w-4" />
            <span className="text-sm">Enter your initials above to unlock this section</span>
          </div>
        )}

        <div className="space-y-4" style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
          <div className="grid gap-3 md:grid-cols-2">
            {/* Full Legal Name */}
            <div className="space-y-2">
              <label htmlFor="full_legal_name" className="block text-sm font-medium text-slate-700">
                Full Legal Name <span className="text-amber-500">*</span>
              </label>
              <input
                id="full_legal_name"
                value={application.full_legal_name || ''}
                onChange={(e) => {
                  onUpdate('full_legal_name', e.target.value);
                  onClearError?.('full_legal_name');
                }}
                onBlur={() => onFieldBlur?.('full_legal_name', application.full_legal_name, application)}
                placeholder="Full name as shown on ID"
                className={cn(
                  "w-full h-12 px-4 rounded-xl bg-slate-50 border text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 focus:border-transparent transition-all duration-200",
                  getFieldClass('full_legal_name')
                )}
              />
              <FormFieldError error={fieldErrors.full_legal_name} show={!!fieldErrors.full_legal_name} />
            </div>

            {/* Personal Name or Principal (for businesses) */}
            <div className="space-y-2">
              <label htmlFor="personal_name_principal" className="block text-sm font-medium text-slate-700">
                Personal Name or Principal
              </label>
              <input
                id="personal_name_principal"
                value={(application.uploaded_documents as any)?.personal_name_principal || ''}
                onChange={(e) => {
                  const docs = application.uploaded_documents || {};
                  onUpdate('uploaded_documents', { ...docs, personal_name_principal: e.target.value });
                }}
                placeholder="If different from legal name"
                className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 focus:border-transparent transition-all duration-200"
              />
              <p className="text-xs text-slate-400">For business entities: the principal/owner name</p>
            </div>

            {/* Date of Birth */}
            <div className="space-y-2">
              <label htmlFor="birth_date" className="block text-sm font-medium text-slate-700">
                Date of Birth <span className="text-amber-500">*</span>
              </label>
              <input
                id="birth_date"
                type="date"
                value={application.birth_date || ''}
                onChange={(e) => {
                  onUpdate('birth_date', e.target.value);
                  onClearError?.('birth_date');
                }}
                onBlur={() => onFieldBlur?.('birth_date', application.birth_date, application)}
                className={cn(
                  "w-full h-12 px-4 rounded-xl bg-slate-50 border text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 focus:border-transparent transition-all duration-200",
                  getFieldClass('birth_date')
                )}
              />
              <FormFieldError error={fieldErrors.birth_date} show={!!fieldErrors.birth_date} />
            </div>

            {/* Gender */}
            <div className="md:col-span-2 space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Gender <span className="text-amber-500">*</span>
              </label>
              <RadioGroup
                value={normalizedGender}
                onValueChange={handleGenderChange}
                className="flex gap-4"
              >
                <label className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors",
                  normalizedGender === 'Male'
                    ? "border-slate-900 bg-slate-100"
                    : fieldSuccess.gender
                      ? "border-green-400/50 hover:bg-slate-50"
                      : fieldErrors.gender
                        ? "border-amber-400"
                        : "border-slate-200 hover:bg-slate-50"
                )}>
                  <RadioGroupItem value="Male" id="gender-male" />
                  <span className="text-sm text-slate-700">Male</span>
                </label>
                <label className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors",
                  normalizedGender === 'Female'
                    ? "border-slate-900 bg-slate-100"
                    : fieldSuccess.gender
                      ? "border-green-400/50 hover:bg-slate-50"
                      : fieldErrors.gender
                        ? "border-amber-400"
                        : "border-slate-200 hover:bg-slate-50"
                )}>
                  <RadioGroupItem value="Female" id="gender-female" />
                  <span className="text-sm text-slate-700">Female</span>
                </label>
              </RadioGroup>
              <FormFieldError error={fieldErrors.gender} show={!!fieldErrors.gender} />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {/* Birth City */}
            <div className="space-y-2">
              <label htmlFor="birth_city" className="block text-sm font-medium text-slate-700">
                City of Birth <span className="text-amber-500">*</span>
              </label>
              <input
                id="birth_city"
                value={application.birth_city || ''}
                onChange={(e) => {
                  onUpdate('birth_city', e.target.value);
                  onClearError?.('birth_city');
                }}
                onBlur={() => onFieldBlur?.('birth_city', application.birth_city, application)}
                placeholder="City where you were born"
                className={cn(
                  "w-full h-12 px-4 rounded-xl bg-slate-50 border text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 focus:border-transparent transition-all duration-200",
                  getFieldClass('birth_city')
                )}
              />
              <FormFieldError error={fieldErrors.birth_city} show={!!fieldErrors.birth_city} />
            </div>

            {/* Birth State */}
            <div className="space-y-2">
              <label htmlFor="birth_state" className="block text-sm font-medium text-slate-700">
                State of Birth <span className="text-amber-500">*</span>
              </label>
              <Select
                value={application.birth_state || ''}
                onValueChange={(v) => {
                  onUpdate('birth_state', v);
                  onClearError?.('birth_state');
                  // Validate immediately on selection
                  if (onFieldBlur) {
                    setTimeout(() => onFieldBlur('birth_state', v, application), 0);
                  }
                }}
              >
                <SelectTrigger className={cn(
                  "h-12 rounded-xl bg-slate-50 border",
                  getFieldClass('birth_state')
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
              <FormFieldError error={fieldErrors.birth_state} show={!!fieldErrors.birth_state} />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email_address" className="block text-sm font-medium text-slate-700">
                Email Address <span className="text-amber-500">*</span>
              </label>
              <input
                id="email_address"
                type="email"
                value={application.email_address || ''}
                onChange={(e) => onUpdate('email_address', e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                disabled
              />
              <p className="text-xs text-slate-400">Synced with your login email</p>
            </div>

            {/* Mobile Phone */}
            <div className="space-y-2">
              <label htmlFor="phone_mobile" className="block text-sm font-medium text-slate-700">
                Mobile Phone <span className="text-amber-500">*</span>
              </label>
              <input
                id="phone_mobile"
                type="tel"
                value={application.phone_mobile || ''}
                onChange={(e) => {
                  const formatted = formatPhone(e.target.value);
                  onUpdate('phone_mobile', formatted);
                  onClearError?.('phone_mobile');
                }}
                onBlur={() => onFieldBlur?.('phone_mobile', application.phone_mobile, application)}
                placeholder="(555) 123-4567"
                className={cn(
                  "w-full h-12 px-4 rounded-xl bg-slate-50 border text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 focus:border-transparent transition-all duration-200",
                  getFieldClass('phone_mobile')
                )}
                maxLength={14}
              />
              <FormFieldError error={fieldErrors.phone_mobile} show={!!fieldErrors.phone_mobile} />
            </div>

            {/* Business Phone */}
            <div className="space-y-2">
              <label htmlFor="phone_business" className="block text-sm font-medium text-slate-700">
                Business Phone
              </label>
              <input
                id="phone_business"
                type="tel"
                value={application.phone_business || ''}
                onChange={(e) => {
                  const formatted = formatPhone(e.target.value);
                  onUpdate('phone_business', formatted);
                  if (formatted.length === 14 && onClearError) onClearError('phone_business');
                }}
                placeholder="(555) 123-4567"
                className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 focus:border-transparent transition-all duration-200"
                maxLength={14}
              />
            </div>

            {/* Home Phone */}
            <div className="space-y-2">
              <label htmlFor="phone_home" className="block text-sm font-medium text-slate-700">
                Home Phone
              </label>
              <input
                id="phone_home"
                type="tel"
                value={application.phone_home || ''}
                onChange={(e) => {
                  const formatted = formatPhone(e.target.value);
                  onUpdate('phone_home', formatted);
                  if (formatted.length === 14 && onClearError) onClearError('phone_home');
                }}
                placeholder="(555) 123-4567"
                className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 focus:border-transparent transition-all duration-200"
                maxLength={14}
              />
            </div>

            {/* Fax */}
            <div className="space-y-2">
              <label htmlFor="fax" className="block text-sm font-medium text-slate-700">
                Fax
              </label>
              <input
                id="fax"
                type="tel"
                value={application.fax || ''}
                onChange={(e) => onUpdate('fax', e.target.value)}
                placeholder="Optional"
                className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>
        </div>

        {/* Preferred Contact Method */}
        <div className="pt-4 border-t border-slate-200" style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
          <label className="block text-sm font-medium text-slate-700 mb-3">Preferred Contact Method</label>
          <div className="flex flex-wrap gap-3">
            {['Email', 'Phone', 'Text'].map((method) => (
              <label
                key={method}
                onClick={() => toggleContactMethod(method)}
                className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <div className={cn(
                  "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                  contactMethods.includes(method)
                    ? "bg-slate-900 border-slate-900" 
                    : "border-slate-300"
                )}>
                  {contactMethods.includes(method) && <Check className="h-3 w-3 text-white" />}
                </div>
                <span className="text-sm text-slate-700">{method}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
