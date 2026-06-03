import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ContractingApplication, Address, EMPTY_ADDRESS, US_STATES } from '@/types/contracting';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface MailingShippingSectionProps {
  application: ContractingApplication;
  onUpdate: <K extends keyof ContractingApplication>(field: K, value: ContractingApplication[K]) => void;
  disabled?: boolean;
}

export function MailingShippingSection({ application, onUpdate, disabled }: MailingShippingSectionProps) {
  const mailingAddress = (application.mailing_address as Address) || EMPTY_ADDRESS;
  const upsAddress = (application.ups_address as Address) || EMPTY_ADDRESS;

  const updateMailingAddress = (field: keyof Address, value: string) => {
    onUpdate('mailing_address', { ...mailingAddress, [field]: value });
  };

  const updateUpsAddress = (field: keyof Address, value: string) => {
    onUpdate('ups_address', { ...upsAddress, [field]: value });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5">
      <div className="space-y-4" style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>

        {/* Mailing Address */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-slate-900">Mailing Address</Label>
            <label className="flex items-center gap-2 cursor-pointer">
              <div className={cn(
                "w-4 h-4 rounded border-2 flex items-center justify-center transition-all",
                application.mailing_address_same_as_home
                  ? "bg-slate-900 border-slate-900"
                  : "border-slate-300"
              )}>
                {application.mailing_address_same_as_home && <Check className="h-2.5 w-2.5 text-white" />}
              </div>
              <input
                type="checkbox"
                className="sr-only"
                checked={application.mailing_address_same_as_home || false}
                onChange={(e) => onUpdate('mailing_address_same_as_home', e.target.checked)}
              />
              <span className="text-sm text-slate-600">Same as home</span>
            </label>
          </div>

          {!application.mailing_address_same_as_home && (
            <div className="grid grid-cols-12 gap-3 animate-in fade-in duration-200">
              <Input
                value={mailingAddress.street || ''}
                onChange={(e) => updateMailingAddress('street', e.target.value)}
                placeholder="Street address"
                className="col-span-12 md:col-span-5 h-11 rounded-xl bg-slate-50 border-slate-200"
              />
              <Input
                value={mailingAddress.city || ''}
                onChange={(e) => updateMailingAddress('city', e.target.value)}
                placeholder="City"
                className="col-span-5 md:col-span-3 h-11 rounded-xl bg-slate-50 border-slate-200"
              />
              <Select value={mailingAddress.state || ''} onValueChange={(v) => updateMailingAddress('state', v)}>
                <SelectTrigger className="col-span-4 md:col-span-2 h-11 rounded-xl bg-slate-50 border-slate-200">
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((state) => (
                    <SelectItem key={state.code} value={state.code}>{state.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={mailingAddress.zip || ''}
                onChange={(e) => updateMailingAddress('zip', e.target.value)}
                placeholder="ZIP"
                className="col-span-3 md:col-span-2 h-11 rounded-xl bg-slate-50 border-slate-200"
              />
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-100" />

        {/* UPS/Shipping Address */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-slate-900">Shipping Address</Label>
            <label className="flex items-center gap-2 cursor-pointer">
              <div className={cn(
                "w-4 h-4 rounded border-2 flex items-center justify-center transition-all",
                application.ups_address_same_as_home
                  ? "bg-slate-900 border-slate-900"
                  : "border-slate-300"
              )}>
                {application.ups_address_same_as_home && <Check className="h-2.5 w-2.5 text-white" />}
              </div>
              <input
                type="checkbox"
                className="sr-only"
                checked={application.ups_address_same_as_home || false}
                onChange={(e) => onUpdate('ups_address_same_as_home', e.target.checked)}
              />
              <span className="text-sm text-slate-600">Same as home</span>
            </label>
          </div>

          {!application.ups_address_same_as_home && (
            <div className="grid grid-cols-12 gap-3 animate-in fade-in duration-200">
              <Input
                value={upsAddress.street || ''}
                onChange={(e) => updateUpsAddress('street', e.target.value)}
                placeholder="Street address"
                className="col-span-12 md:col-span-5 h-11 rounded-xl bg-slate-50 border-slate-200"
              />
              <Input
                value={upsAddress.city || ''}
                onChange={(e) => updateUpsAddress('city', e.target.value)}
                placeholder="City"
                className="col-span-5 md:col-span-3 h-11 rounded-xl bg-slate-50 border-slate-200"
              />
              <Select value={upsAddress.state || ''} onValueChange={(v) => updateUpsAddress('state', v)}>
                <SelectTrigger className="col-span-4 md:col-span-2 h-11 rounded-xl bg-slate-50 border-slate-200">
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((state) => (
                    <SelectItem key={state.code} value={state.code}>{state.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={upsAddress.zip || ''}
                onChange={(e) => updateUpsAddress('zip', e.target.value)}
                placeholder="ZIP"
                className="col-span-3 md:col-span-2 h-11 rounded-xl bg-slate-50 border-slate-200"
              />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

