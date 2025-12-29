import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ContractingApplication } from '@/types/contracting';
import { Mail, Phone, Lock, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FormFieldError, getFieldErrorClass } from '../FormFieldError';
import { formatPhone } from '@/lib/formatters';

interface PersonalInfoSectionProps {
  application: ContractingApplication;
  onUpdate: <K extends keyof ContractingApplication>(field: K, value: ContractingApplication[K]) => void;
  disabled?: boolean;
  fieldErrors?: Record<string, string>;
  showValidation?: boolean;
  onClearError?: (field: string) => void;
  testMode?: boolean;
}

export function PersonalInfoSection({ application, onUpdate, disabled, fieldErrors = {}, showValidation = false, onClearError, testMode = false }: PersonalInfoSectionProps) {
  const contactMethods = application.preferred_contact_methods || [];

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
    if (normalized && onClearError) onClearError('gender');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
      <div className="p-8">
        {disabled && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 text-slate-400 mb-6">
            <Lock className="h-4 w-4" />
            <span className="text-sm">Enter your initials above to unlock this section</span>
          </div>
        )}

        <div className="space-y-6" style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Full Legal Name */}
            <div className="space-y-2">
              <label htmlFor="full_legal_name" className="block text-sm font-medium text-slate-700">
                Full Legal Name <span className="text-rose-400">*</span>
              </label>
              <input
                id="full_legal_name"
                value={application.full_legal_name || ''}
                onChange={(e) => {
                  onUpdate('full_legal_name', e.target.value);
                  if (e.target.value && onClearError) onClearError('full_legal_name');
                }}
                placeholder="As it appears on your government ID"
                className={cn(
                  "w-full h-12 px-4 rounded-xl bg-slate-50 border text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 focus:border-transparent transition-all duration-200",
                  fieldErrors.full_legal_name && showValidation && "border-rose-300 bg-rose-50 focus:ring-rose-500"
                )}
              />
              <FormFieldError error={fieldErrors.full_legal_name} show={showValidation} />
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
                Date of Birth <span className="text-rose-400">*</span>
              </label>
              <input
                id="birth_date"
                type="date"
                value={application.birth_date || ''}
                onChange={(e) => {
                  onUpdate('birth_date', e.target.value);
                  if (e.target.value && onClearError) onClearError('birth_date');
                }}
                className={cn(
                  "w-full h-12 px-4 rounded-xl bg-slate-50 border text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 focus:border-transparent transition-all duration-200",
                  fieldErrors.birth_date && showValidation && "border-rose-300 bg-rose-50 focus:ring-rose-500"
                )}
              />
              <FormFieldError error={fieldErrors.birth_date} show={showValidation} />
            </div>

            {/* Gender */}
            <div className="md:col-span-2 space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Gender <span className="text-rose-400">*</span>
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
                    : fieldErrors.gender && showValidation
                      ? "border-rose-300 bg-rose-50"
                      : "border-slate-200 hover:bg-slate-50"
                )}>
                  <RadioGroupItem value="Male" id="gender-male" />
                  <span className="text-sm text-slate-700">Male</span>
                </label>
                <label className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors",
                  normalizedGender === 'Female' 
                    ? "border-slate-900 bg-slate-100" 
                    : fieldErrors.gender && showValidation
                      ? "border-rose-300 bg-rose-50"
                      : "border-slate-200 hover:bg-slate-50"
                )}>
                  <RadioGroupItem value="Female" id="gender-female" />
                  <span className="text-sm text-slate-700">Female</span>
                </label>
              </RadioGroup>
              <FormFieldError error={fieldErrors.gender} show={showValidation} />
              {testMode && (
                <p className="text-xs font-mono text-amber-700 bg-amber-50 px-2 py-1 rounded">
                  gender = {application.gender === null ? 'null' : application.gender === undefined ? 'undefined' : `"${application.gender}"`}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Birth City */}
            <div className="space-y-2">
              <label htmlFor="birth_city" className="block text-sm font-medium text-slate-700">
                City of Birth <span className="text-rose-400">*</span>
              </label>
              <input
                id="birth_city"
                value={application.birth_city || ''}
                onChange={(e) => {
                  onUpdate('birth_city', e.target.value);
                  if (e.target.value && onClearError) onClearError('birth_city');
                }}
                placeholder="City where you were born"
                className={cn(
                  "w-full h-12 px-4 rounded-xl bg-slate-50 border text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 focus:border-transparent transition-all duration-200",
                  fieldErrors.birth_city && showValidation && "border-rose-300 bg-rose-50 focus:ring-rose-500"
                )}
              />
              <FormFieldError error={fieldErrors.birth_city} show={showValidation} />
            </div>

            {/* Birth State */}
            <div className="space-y-2">
              <label htmlFor="birth_state" className="block text-sm font-medium text-slate-700">
                State of Birth <span className="text-rose-400">*</span>
              </label>
              <input
                id="birth_state"
                value={application.birth_state || ''}
                onChange={(e) => {
                  onUpdate('birth_state', e.target.value);
                  if (e.target.value && onClearError) onClearError('birth_state');
                }}
                placeholder="State where you were born"
                className={cn(
                  "w-full h-12 px-4 rounded-xl bg-slate-50 border text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 focus:border-transparent transition-all duration-200",
                  fieldErrors.birth_state && showValidation && "border-rose-300 bg-rose-50 focus:ring-rose-500"
                )}
              />
              <FormFieldError error={fieldErrors.birth_state} show={showValidation} />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email_address" className="block text-sm font-medium text-slate-700">
                Email Address <span className="text-rose-400">*</span>
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
                Mobile Phone <span className="text-rose-400">*</span>
              </label>
              <input
                id="phone_mobile"
                type="tel"
                value={application.phone_mobile || ''}
                onChange={(e) => {
                  const formatted = formatPhone(e.target.value);
                  onUpdate('phone_mobile', formatted);
                  if (formatted.length === 14 && onClearError) onClearError('phone_mobile');
                }}
                placeholder="(555) 123-4567"
                className={cn(
                  "w-full h-12 px-4 rounded-xl bg-slate-50 border text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 focus:border-transparent transition-all duration-200",
                  fieldErrors.phone_mobile && showValidation && "border-rose-300 bg-rose-50 focus:ring-rose-500"
                )}
                maxLength={14}
              />
              <FormFieldError error={fieldErrors.phone_mobile} show={showValidation} />
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
        <div className="pt-6 border-t border-slate-200" style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
          <label className="block text-sm font-medium text-slate-700 mb-3">Preferred Contact Method</label>
          <div className="flex flex-wrap gap-3">
            {['Email', 'Phone', 'Text'].map((method) => (
              <label
                key={method}
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
          {testMode && (
            <p className="mt-2 text-xs font-mono text-amber-700 bg-amber-50 px-2 py-1 rounded">
              preferred_contact_methods = {JSON.stringify(contactMethods)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
