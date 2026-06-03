import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ContractingApplication } from '@/types/contracting';
import { Building2, Lock, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FormFieldError, getFieldErrorClass } from '../FormFieldError';
import { formatRoutingNumber, formatAccountNumber, getBankName, isValidRoutingNumber } from '@/lib/formatters';
import { useState, useEffect } from 'react';

interface BankingSectionProps {
  application: ContractingApplication;
  onUpdate: <K extends keyof ContractingApplication>(field: K, value: ContractingApplication[K]) => void;
  disabled?: boolean;
  fieldErrors?: Record<string, string>;
  fieldSuccess?: Record<string, boolean>;
  showValidation?: boolean;
  onClearError?: (field: string) => void;
  onFieldBlur?: (fieldName: string, value: any, application: ContractingApplication) => void;
}

export function BankingSection({ application, onUpdate, disabled, fieldErrors = {}, fieldSuccess = {}, showValidation = false, onClearError, onFieldBlur }: BankingSectionProps) {
  const [detectedBank, setDetectedBank] = useState<string | null>(null);

  // Helper to get field styling based on validation state
  const getFieldClass = (fieldName: string) => {
    const hasError = fieldErrors[fieldName] && (showValidation || fieldErrors[fieldName]);
    const isSuccess = fieldSuccess[fieldName];

    if (hasError) return "border-amber-400 focus:ring-amber-400/20";
    if (isSuccess) return "border-green-400/50";
    return "border-slate-200";
  };

  // Sync detected bank when routing number changes
  useEffect(() => {
    if (application.bank_routing_number?.length === 9) {
      const bank = getBankName(application.bank_routing_number);
      setDetectedBank(bank);
    } else {
      setDetectedBank(null);
    }
  }, [application.bank_routing_number]);

  return (
    <Card 
      className="rounded-[28px] border-0 overflow-hidden"
      style={{ 
        background: 'linear-gradient(180deg, #FFFFFF 0%, #FEFEFE 100%)',
        boxShadow: '0px 1px 0px rgba(255, 255, 255, 0.8) inset, 0px 20px 60px rgba(0, 0, 0, 0.06)'
      }}
    >
      <CardHeader className="pb-2 pt-4 px-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base font-medium">Banking & Direct Deposit</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pb-5 px-5">
        {disabled && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 text-muted-foreground/60">
            <Lock className="h-4 w-4" />
            <span className="text-sm">Enter your initials above to unlock this section</span>
          </div>
        )}

        <div style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }} className="space-y-4">
          {/* Bank Information */}
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="bank_routing_number">Routing # <span className="text-amber-500">*</span></Label>
              <Input
                id="bank_routing_number"
                value={application.bank_routing_number || ''}
                onChange={(e) => {
                  const formatted = formatRoutingNumber(e.target.value);
                  onUpdate('bank_routing_number', formatted);
                  if (formatted.length === 9) {
                    const bank = getBankName(formatted);
                    setDetectedBank(bank);
                    if (onClearError) onClearError('bank_routing_number');
                  } else {
                    setDetectedBank(null);
                  }
                }}
                onBlur={() => onFieldBlur?.('bank_routing_number', application.bank_routing_number, application)}
                placeholder="9 digits"
                className={cn("h-11 rounded-xl", getFieldClass('bank_routing_number'))}
                maxLength={9}
              />
              {detectedBank && (
                <p className="text-xs text-emerald-600 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  {detectedBank}
                </p>
              )}
              <FormFieldError error={fieldErrors.bank_routing_number} show={!!fieldErrors.bank_routing_number} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="bank_account_number">Account # <span className="text-amber-500">*</span></Label>
              <Input
                id="bank_account_number"
                value={application.bank_account_number || ''}
                onChange={(e) => {
                  const formatted = formatAccountNumber(e.target.value);
                  onUpdate('bank_account_number', formatted);
                  if (formatted.length >= 4 && onClearError) onClearError('bank_account_number');
                }}
                onBlur={() => onFieldBlur?.('bank_account_number', application.bank_account_number, application)}
                placeholder="Account number"
                className={cn("h-11 rounded-xl", getFieldClass('bank_account_number'))}
                maxLength={17}
              />
              <FormFieldError error={fieldErrors.bank_account_number} show={!!fieldErrors.bank_account_number} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="bank_branch_name">Bank Name <span className="text-slate-400 font-normal">(opt)</span></Label>
              <Input
                id="bank_branch_name"
                value={application.bank_branch_name || ''}
                onChange={(e) => onUpdate('bank_branch_name', e.target.value)}
                placeholder="e.g. Chase Bank"
                className="h-11 rounded-xl"
              />
            </div>
          </div>

          {/* Commission Advancing */}
          <div className="pt-3 border-t border-border/10">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Commission Advancing? <span className="text-amber-500">*</span></Label>
                <p className="text-xs text-muted-foreground/60">Receive commissions faster (terms apply)</p>
              </div>
              <RadioGroup
                value={application.requesting_commission_advancing === true ? 'yes' : 'no'}
                onValueChange={(value) => onUpdate('requesting_commission_advancing', value === 'yes')}
                className="flex gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="yes" id="commission_yes" />
                  <Label htmlFor="commission_yes" className="text-sm font-normal cursor-pointer">Yes</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="no" id="commission_no" />
                  <Label htmlFor="commission_no" className="text-sm font-normal cursor-pointer">No</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* Beneficiary */}
          <div className="pt-3 border-t border-border/10">
            <h4 className="text-sm font-medium mb-2">Beneficiary <span className="text-slate-400 font-normal">(optional)</span></h4>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="beneficiary_name">Name</Label>
                <Input
                  id="beneficiary_name"
                  value={application.beneficiary_name || ''}
                  onChange={(e) => onUpdate('beneficiary_name', e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="beneficiary_relationship">Relationship</Label>
                <Input
                  id="beneficiary_relationship"
                  value={application.beneficiary_relationship || ''}
                  onChange={(e) => onUpdate('beneficiary_relationship', e.target.value)}
                  placeholder="e.g. Spouse, Child"
                  className="h-11 rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
