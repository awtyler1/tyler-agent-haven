import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ContractingApplication } from '@/types/contracting';
import { User, Mail, Phone, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FormFieldError, getFieldErrorClass } from '../FormFieldError';

interface PersonalInfoSectionProps {
  application: ContractingApplication;
  onUpdate: <K extends keyof ContractingApplication>(field: K, value: ContractingApplication[K]) => void;
  disabled?: boolean;
  fieldErrors?: Record<string, string>;
  showValidation?: boolean;
  onClearError?: (field: string) => void;
}

export function PersonalInfoSection({ application, onUpdate, disabled, fieldErrors = {}, showValidation = false, onClearError }: PersonalInfoSectionProps) {
  const contactMethods = application.preferred_contact_methods || [];

  const toggleContactMethod = (method: string) => {
    if (contactMethods.includes(method)) {
      onUpdate('preferred_contact_methods', contactMethods.filter(m => m !== method));
    } else {
      onUpdate('preferred_contact_methods', [...contactMethods, method]);
    }
  };

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
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg font-medium">Personal Information</CardTitle>
            <p className="text-xs text-muted-foreground/60">Your legal name and contact details</p>
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

        <div className="grid gap-4 md:grid-cols-2" style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
          {/* Full Legal Name */}
          <div className="space-y-2">
            <Label htmlFor="full_legal_name">
              Full Legal Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="full_legal_name"
              value={application.full_legal_name || ''}
              onChange={(e) => {
                onUpdate('full_legal_name', e.target.value);
                if (e.target.value && onClearError) onClearError('full_legal_name');
              }}
              placeholder="As it appears on your government ID"
              className={cn("h-11 rounded-xl", getFieldErrorClass(!!fieldErrors.full_legal_name, showValidation))}
            />
            <FormFieldError error={fieldErrors.full_legal_name} show={showValidation} />
          </div>

          {/* Personal Name or Principal (for businesses) */}
          <div className="space-y-2">
            <Label htmlFor="personal_name_principal">Personal Name or Principal</Label>
            <Input
              id="personal_name_principal"
              value={(application.uploaded_documents as any)?.personal_name_principal || ''}
              onChange={(e) => {
                const docs = application.uploaded_documents || {};
                onUpdate('uploaded_documents', { ...docs, personal_name_principal: e.target.value });
              }}
              placeholder="If different from legal name"
              className="h-11 rounded-xl"
            />
            <p className="text-[10px] text-muted-foreground/50">For business entities: the principal/owner name</p>
          </div>

          {/* Gender */}
          <div className="md:col-span-2 space-y-2">
            <Label>Gender <span className="text-destructive">*</span></Label>
            <RadioGroup
              value={application.gender || ''}
              onValueChange={(value) => {
                onUpdate('gender', value);
                if (value && onClearError) onClearError('gender');
              }}
              className="flex gap-6"
            >
              <label className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer transition-colors",
                application.gender === 'male' 
                  ? "border-primary bg-primary/5" 
                  : fieldErrors.gender && showValidation
                    ? "border-destructive/60 bg-destructive/[0.02]"
                    : "border-border/20 hover:bg-muted/20"
              )}>
                <RadioGroupItem value="male" id="gender-male" />
                <span className="text-sm">Male</span>
              </label>
              <label className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer transition-colors",
                application.gender === 'female' 
                  ? "border-primary bg-primary/5" 
                  : fieldErrors.gender && showValidation
                    ? "border-destructive/60 bg-destructive/[0.02]"
                    : "border-border/20 hover:bg-muted/20"
              )}>
                <RadioGroupItem value="female" id="gender-female" />
                <span className="text-sm">Female</span>
              </label>
            </RadioGroup>
            <FormFieldError error={fieldErrors.gender} show={showValidation} />
          </div>

          {/* Birth City */}
          <div className="space-y-2">
            <Label htmlFor="birth_city">City of Birth</Label>
            <Input
              id="birth_city"
              value={application.birth_city || ''}
              onChange={(e) => onUpdate('birth_city', e.target.value)}
              placeholder="City where you were born"
              className="h-11 rounded-xl"
            />
          </div>

          {/* Birth State */}
          <div className="space-y-2">
            <Label htmlFor="birth_state">State of Birth</Label>
            <Input
              id="birth_state"
              value={application.birth_state || ''}
              onChange={(e) => onUpdate('birth_state', e.target.value)}
              placeholder="State where you were born"
              className="h-11 rounded-xl"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email_address" className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-muted-foreground/50" />
              Email Address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email_address"
              type="email"
              value={application.email_address || ''}
              onChange={(e) => onUpdate('email_address', e.target.value)}
              className="h-11 rounded-xl bg-muted/20"
              disabled
            />
            <p className="text-[10px] text-muted-foreground/50">Synced with your login email</p>
          </div>

          {/* Mobile Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone_mobile" className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-muted-foreground/50" />
              Mobile Phone <span className="text-destructive">*</span>
            </Label>
            <Input
              id="phone_mobile"
              type="tel"
              value={application.phone_mobile || ''}
              onChange={(e) => {
                onUpdate('phone_mobile', e.target.value);
                if (e.target.value && onClearError) onClearError('phone_mobile');
              }}
              placeholder="(555) 123-4567"
              className={cn("h-11 rounded-xl", getFieldErrorClass(!!fieldErrors.phone_mobile, showValidation))}
            />
            <FormFieldError error={fieldErrors.phone_mobile} show={showValidation} />
          </div>

          {/* Business Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone_business">Business Phone</Label>
            <Input
              id="phone_business"
              type="tel"
              value={application.phone_business || ''}
              onChange={(e) => onUpdate('phone_business', e.target.value)}
              placeholder="Optional"
              className="h-11 rounded-xl"
            />
          </div>

          {/* Home Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone_home">Home Phone</Label>
            <Input
              id="phone_home"
              type="tel"
              value={application.phone_home || ''}
              onChange={(e) => onUpdate('phone_home', e.target.value)}
              placeholder="Optional"
              className="h-11 rounded-xl"
            />
          </div>

          {/* Fax */}
          <div className="space-y-2">
            <Label htmlFor="fax">Fax</Label>
            <Input
              id="fax"
              type="tel"
              value={application.fax || ''}
              onChange={(e) => onUpdate('fax', e.target.value)}
              placeholder="Optional"
              className="h-11 rounded-xl"
            />
          </div>
        </div>

        {/* Preferred Contact Method */}
        <div className="pt-4 border-t border-border/10" style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
          <Label className="mb-3 block">Preferred Contact Method</Label>
          <div className="flex flex-wrap gap-3">
            {['Email', 'Phone', 'Text'].map((method) => (
              <label
                key={method}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border/20 cursor-pointer hover:bg-muted/20 transition-colors"
              >
                <Checkbox
                  checked={contactMethods.includes(method)}
                  onCheckedChange={() => toggleContactMethod(method)}
                />
                <span className="text-sm">{method}</span>
              </label>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
