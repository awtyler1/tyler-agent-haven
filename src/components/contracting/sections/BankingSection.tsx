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
  showValidation?: boolean;
  onClearError?: (field: string) => void;
}

export function BankingSection({ application, onUpdate, disabled, fieldErrors = {}, showValidation = false, onClearError }: BankingSectionProps) {
  const [detectedBank, setDetectedBank] = useState<string | null>(null);

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
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg font-medium">Banking & Direct Deposit</CardTitle>
            <p className="text-xs text-muted-foreground/60">Your bank details for commission payments</p>
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

        <div style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }} className="space-y-6">
          {/* Bank Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bank_routing_number">Bank Routing # <span className="text-destructive">*</span></Label>
              <Input
                id="bank_routing_number"
                value={application.bank_routing_number || ''}
                onChange={(e) => {
                  const formatted = formatRoutingNumber(e.target.value);
                  onUpdate('bank_routing_number', formatted);
                  
                  // Detect bank name
                  if (formatted.length === 9) {
                    const bank = getBankName(formatted);
                    setDetectedBank(bank);
                    if (onClearError) onClearError('bank_routing_number');
                  } else {
                    setDetectedBank(null);
                  }
                }}
                placeholder="9 digits"
                className={cn("h-11 rounded-xl", getFieldErrorClass(!!fieldErrors.bank_routing_number, showValidation))}
                maxLength={9}
              />
              {/* Bank name display */}
              {detectedBank && (
                <p className="text-xs text-emerald-600 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  {detectedBank}
                </p>
              )}
              {application.bank_routing_number?.length === 9 && !detectedBank && isValidRoutingNumber(application.bank_routing_number) && (
                <p className="text-xs text-slate-500">Valid routing number</p>
              )}
              <FormFieldError error={fieldErrors.bank_routing_number} show={showValidation} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bank_account_number">Account # <span className="text-destructive">*</span></Label>
              <Input
                id="bank_account_number"
                value={application.bank_account_number || ''}
                onChange={(e) => {
                  const formatted = formatAccountNumber(e.target.value);
                  onUpdate('bank_account_number', formatted);
                  if (formatted.length >= 4 && onClearError) onClearError('bank_account_number');
                }}
                placeholder="Account number"
                className={cn("h-11 rounded-xl", getFieldErrorClass(!!fieldErrors.bank_account_number, showValidation))}
                maxLength={17}
              />
              <FormFieldError error={fieldErrors.bank_account_number} show={showValidation} />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="bank_branch_name">Bank Name / Branch Location</Label>
              <Input
                id="bank_branch_name"
                value={application.bank_branch_name || ''}
                onChange={(e) => onUpdate('bank_branch_name', e.target.value)}
                placeholder="e.g. Chase Bank - Main Street Branch"
                className="h-11 rounded-xl"
              />
            </div>
          </div>


          {/* Commission Advancing */}
          <div className="pt-4 border-t border-border/10">
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Requesting Commission Advancing? <span className="text-destructive">*</span></Label>
                <p className="text-xs text-muted-foreground/60 mt-0.5">Receive commissions faster with advancing (terms apply)</p>
              </div>
              <RadioGroup
                value={application.requesting_commission_advancing === true ? 'yes' : 'no'}
                onValueChange={(value) => onUpdate('requesting_commission_advancing', value === 'yes')}
                className="flex gap-6"
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
          <div className="pt-4 border-t border-border/10">
            <h4 className="text-sm font-medium mb-4">Beneficiary Information</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="beneficiary_name">Beneficiary Name</Label>
                <Input
                  id="beneficiary_name"
                  value={application.beneficiary_name || ''}
                  onChange={(e) => onUpdate('beneficiary_name', e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-2">
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
