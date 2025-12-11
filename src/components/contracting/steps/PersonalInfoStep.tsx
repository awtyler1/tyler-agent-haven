import { useEffect, useRef, useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ContractingApplication, Address, EMPTY_ADDRESS, US_STATES } from '@/types/contracting';
import { User, Plus, X, AlertCircle } from 'lucide-react';
import { WizardProgress } from '../WizardProgress';
import { InitialsAcknowledgmentBar } from '../InitialsAcknowledgmentBar';
import { validatePersonalInfo } from '@/hooks/useContractingValidation';
import { toast } from 'sonner';
import { formatPhoneNumber, formatZipCode } from '@/lib/formatters';

interface PreviousAddress extends Address {
  years_lived?: string;
}

interface ProgressProps {
  currentStep: number;
  completedSteps: number[];
  onStepClick: (step: number) => void;
}

interface PersonalInfoStepProps {
  application: ContractingApplication;
  initials: string | null;
  onUpdate: <K extends keyof ContractingApplication>(field: K, value: ContractingApplication[K]) => void;
  onBack: () => void;
  onContinue: () => void;
  progressProps: ProgressProps;
}

export function PersonalInfoStep({ application, initials, onUpdate, onBack, onContinue, progressProps }: PersonalInfoStepProps) {
  const homeAddress = (application.home_address as Address) || EMPTY_ADDRESS;
  const mailingAddress = (application.mailing_address as Address) || EMPTY_ADDRESS;
  const upsAddress = (application.ups_address as Address) || EMPTY_ADDRESS;
  const previousAddresses = (application.previous_addresses as PreviousAddress[]) || [];
  const hasInitialized = useRef(false);
  const [showPreviousAddresses, setShowPreviousAddresses] = useState(previousAddresses.length > 0);

  // Set Mobile as default preferred contact on first load
  useEffect(() => {
    if (!hasInitialized.current) {
      if (!application.preferred_contact_methods || application.preferred_contact_methods.length === 0) {
        onUpdate('preferred_contact_methods', ['Mobile']);
      }
      hasInitialized.current = true;
    }
  }, [application.preferred_contact_methods, onUpdate]);

  const toggleContactMethod = (method: string) => {
    const current = application.preferred_contact_methods || [];
    if (current.includes(method)) {
      onUpdate('preferred_contact_methods', current.filter(m => m !== method));
    } else {
      onUpdate('preferred_contact_methods', [...current, method]);
    }
  };

  const updateAddress = (type: 'home_address' | 'mailing_address' | 'ups_address', field: keyof Address, value: string) => {
    const current = type === 'home_address' ? homeAddress : type === 'mailing_address' ? mailingAddress : upsAddress;
    onUpdate(type, { ...current, [field]: value });
  };

  const addPreviousAddress = () => {
    onUpdate('previous_addresses', [...previousAddresses, { ...EMPTY_ADDRESS, years_lived: '' }]);
    setShowPreviousAddresses(true);
  };

  const updatePreviousAddress = (index: number, field: keyof PreviousAddress, value: string) => {
    const updated = [...previousAddresses];
    updated[index] = { ...updated[index], [field]: value };
    onUpdate('previous_addresses', updated);
  };

  const removePreviousAddress = (index: number) => {
    const updated = previousAddresses.filter((_, i) => i !== index);
    onUpdate('previous_addresses', updated);
    if (updated.length === 0) setShowPreviousAddresses(false);
  };

  // Email is always prefilled from login and cannot be changed

  // Validation
  const validation = useMemo(() => validatePersonalInfo(application), [application]);

  const handleContinue = () => {
    if (!validation.isValid) {
      toast.error(validation.errors[0]);
      return;
    }
    onContinue();
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card 
        className="border-0 rounded-[24px]"
        style={{ 
          background: 'linear-gradient(180deg, #FFFFFF 0%, #FEFEFE 100%)',
          boxShadow: '0px 1px 0px rgba(255, 255, 255, 0.8) inset, 0px 20px 60px rgba(0, 0, 0, 0.08), 0px 0px 100px rgba(163, 133, 41, 0.03)'
        }}
      >
        {/* Progress + Header */}
        <div className="pt-5 pb-4 text-center border-b border-border/20">
          <WizardProgress {...progressProps} compact />
          <div className="flex items-center justify-center gap-2.5 mt-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-xl font-semibold font-serif" style={{ letterSpacing: '0.015em' }}>Contact Information</h2>
          </div>
          <p className="text-xs text-muted-foreground/60 mt-1.5">
            We use this to stay in touch throughout contracting and beyond.
          </p>
        </div>
        <CardContent className="space-y-4 py-5 px-7">
          {/* Row 1: Name, Gender, Mobile, Business Phone */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-4 space-y-1.5">
              <Label className="text-xs">Full Legal Name *</Label>
              <Input
                value={application.full_legal_name || ''}
                onChange={e => onUpdate('full_legal_name', e.target.value)}
                placeholder="First Middle Last"
                className="h-9"
              />
              <p className="text-[10px] text-muted-foreground">As it appears on your government ID or insurance license</p>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs">Gender</Label>
              <Select value={application.gender || ''} onValueChange={value => onUpdate('gender', value)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-3 space-y-1.5">
              <Label className="text-xs">Mobile *</Label>
              <Input
                type="tel"
                value={application.phone_mobile || ''}
                onChange={e => onUpdate('phone_mobile', formatPhoneNumber(e.target.value))}
                placeholder="(555) 123-4567"
                className="h-9"
              />
            </div>
            <div className="col-span-3 space-y-1.5">
              <Label className="text-xs">Business Phone</Label>
              <Input
                type="tel"
                value={application.phone_business || ''}
                onChange={e => onUpdate('phone_business', formatPhoneNumber(e.target.value))}
                placeholder="(555) 123-4567"
                className="h-9"
              />
            </div>
          </div>

          {/* Row 2: Email (full width) - Always disabled, prefilled from login */}
          <div className="space-y-1.5">
            <Label className="text-xs">Email *</Label>
            <Input
              type="email"
              value={application.email_address || ''}
              readOnly
              disabled
              className="h-9 bg-muted/50 cursor-not-allowed"
            />
            <p className="text-[10px] text-muted-foreground">This is your login email and cannot be changed here</p>
          </div>

          {/* Home Address with grouped checkboxes */}
          <div className="space-y-2 p-4 rounded-lg bg-muted/30 border border-border/50">
            <Label className="text-xs">Home Address *</Label>
            <div className="grid grid-cols-6 gap-3">
              <Input
                value={homeAddress.street}
                onChange={e => updateAddress('home_address', 'street', e.target.value)}
                placeholder="Street address"
                className="h-9 col-span-3 bg-background"
              />
              <Input
                value={homeAddress.city}
                onChange={e => updateAddress('home_address', 'city', e.target.value)}
                placeholder="City"
                className="h-9 bg-background"
              />
              <Select value={homeAddress.state} onValueChange={value => updateAddress('home_address', 'state', value)}>
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue placeholder="ST" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map(state => (
                    <SelectItem key={state.code} value={state.code}>{state.code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={homeAddress.zip}
                onChange={e => updateAddress('home_address', 'zip', formatZipCode(e.target.value))}
                placeholder="ZIP"
                className="h-9 bg-background"
              />
            </div>
            {/* Address same-as checkboxes */}
            <div className="flex gap-6 text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                <Checkbox 
                  checked={application.mailing_address_same_as_home} 
                  onCheckedChange={checked => onUpdate('mailing_address_same_as_home', !!checked)} 
                  className="h-4 w-4"
                />
                <span>Mailing address same as home</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                <Checkbox 
                  checked={application.ups_address_same_as_home} 
                  onCheckedChange={checked => onUpdate('ups_address_same_as_home', !!checked)} 
                  className="h-4 w-4"
                />
                <span>UPS/Shipping same as home</span>
              </label>
            </div>
          </div>

          {/* Mailing Address (if different) */}
          {!application.mailing_address_same_as_home && (
            <div className="space-y-1.5 animate-fade-in">
              <Label className="text-xs">Mailing Address</Label>
              <div className="grid grid-cols-6 gap-3">
                <Input
                  value={mailingAddress.street}
                  onChange={e => updateAddress('mailing_address', 'street', e.target.value)}
                  placeholder="Street address"
                  className="h-9 col-span-3"
                />
                <Input
                  value={mailingAddress.city}
                  onChange={e => updateAddress('mailing_address', 'city', e.target.value)}
                  placeholder="City"
                  className="h-9"
                />
                <Select value={mailingAddress.state} onValueChange={value => updateAddress('mailing_address', 'state', value)}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="ST" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map(state => (
                      <SelectItem key={state.code} value={state.code}>{state.code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={mailingAddress.zip}
                  onChange={e => updateAddress('mailing_address', 'zip', formatZipCode(e.target.value))}
                  placeholder="ZIP"
                  className="h-9"
                />
              </div>
            </div>
          )}

          {/* UPS Address (if different) */}
          {!application.ups_address_same_as_home && (
            <div className="space-y-1.5 animate-fade-in">
              <Label className="text-xs">UPS/Shipping Address</Label>
              <div className="grid grid-cols-6 gap-3">
                <Input
                  value={upsAddress.street}
                  onChange={e => updateAddress('ups_address', 'street', e.target.value)}
                  placeholder="Street address"
                  className="h-9 col-span-3"
                />
                <Input
                  value={upsAddress.city}
                  onChange={e => updateAddress('ups_address', 'city', e.target.value)}
                  placeholder="City"
                  className="h-9"
                />
                <Select value={upsAddress.state} onValueChange={value => updateAddress('ups_address', 'state', value)}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="ST" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map(state => (
                      <SelectItem key={state.code} value={state.code}>{state.code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={upsAddress.zip}
                  onChange={e => updateAddress('ups_address', 'zip', formatZipCode(e.target.value))}
                  placeholder="ZIP"
                  className="h-9"
                />
              </div>
            </div>
          )}

          {/* Previous Addresses (Optional) */}
          <div className="space-y-2">
            {!showPreviousAddresses ? (
              <button
                type="button"
                onClick={addPreviousAddress}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Add previous address (within last 10 years)
              </button>
            ) : (
              <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Previous Addresses (last 10 years)</Label>
                  <button
                    type="button"
                    onClick={addPreviousAddress}
                    className="text-xs text-primary hover:text-primary/80 flex items-center gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add another
                  </button>
                </div>
                {previousAddresses.map((addr, index) => (
                  <div key={index} className="space-y-2 pt-2 border-t border-border/30 first:border-0 first:pt-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Address {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removePreviousAddress(index)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-6 gap-2">
                      <Input
                        value={addr.street || ''}
                        onChange={e => updatePreviousAddress(index, 'street', e.target.value)}
                        placeholder="Street address"
                        className="h-8 text-sm col-span-3 bg-background"
                      />
                      <Input
                        value={addr.city || ''}
                        onChange={e => updatePreviousAddress(index, 'city', e.target.value)}
                        placeholder="City"
                        className="h-8 text-sm bg-background"
                      />
                      <Select value={addr.state || ''} onValueChange={value => updatePreviousAddress(index, 'state', value)}>
                        <SelectTrigger className="h-8 text-sm bg-background">
                          <SelectValue placeholder="ST" />
                        </SelectTrigger>
                        <SelectContent>
                          {US_STATES.map(state => (
                            <SelectItem key={state.code} value={state.code}>{state.code}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        value={addr.zip || ''}
                        onChange={e => updatePreviousAddress(index, 'zip', formatZipCode(e.target.value))}
                        placeholder="ZIP"
                        className="h-8 text-sm bg-background"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preferred Contact */}
          <div className="flex items-center gap-5 text-xs">
            <span className="text-muted-foreground">Preferred contact:</span>
            {['Email', 'Mobile', 'Text'].map(method => (
              <label key={method} className="flex items-center gap-2 cursor-pointer">
                <Checkbox 
                  checked={(application.preferred_contact_methods || ['Mobile']).includes(method)} 
                  onCheckedChange={() => toggleContactMethod(method)} 
                  className="h-4 w-4"
                />
                <span>{method}</span>
              </label>
            ))}
          </div>

          {/* Validation indicator */}
          {!validation.isValid && (
            <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 rounded-lg">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              <span>Complete all required fields (*) to continue</span>
            </div>
          )}

          {/* Initials Acknowledgment */}
          <InitialsAcknowledgmentBar initials={initials} />

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="ghost" onClick={onBack} className="text-muted-foreground">
              Back
            </Button>
            <Button onClick={handleContinue} disabled={!validation.isValid}>
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
