import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ContractingApplication } from '@/types/contracting';
import { FileDropZone } from '../FileDropZone';
import { Building2, Lock } from 'lucide-react';

interface BankingSectionProps {
  application: ContractingApplication;
  onUpdate: <K extends keyof ContractingApplication>(field: K, value: ContractingApplication[K]) => void;
  onUpload: (file: File, documentType: string) => Promise<string | null>;
  onRemove: (documentType: string) => Promise<void>;
  disabled?: boolean;
}

export function BankingSection({ application, onUpdate, onUpload, onRemove, disabled }: BankingSectionProps) {
  const uploadedDocs = application.uploaded_documents || {};

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
                onChange={(e) => onUpdate('bank_routing_number', e.target.value)}
                placeholder="9 digits"
                className="h-11 rounded-xl"
                maxLength={9}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bank_account_number">Account # <span className="text-destructive">*</span></Label>
              <Input
                id="bank_account_number"
                value={application.bank_account_number || ''}
                onChange={(e) => onUpdate('bank_account_number', e.target.value)}
                className="h-11 rounded-xl"
              />
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

          {/* Voided Check Upload */}
          <div>
            <FileDropZone
              label="Voided Check or Bank Letter"
              documentType="voided_check"
              existingFile={uploadedDocs['voided_check']}
              onUpload={onUpload}
              onRemove={() => onRemove('voided_check')}
              required
              description="Required for direct deposit setup"
            />
          </div>

          {/* Commission Advancing */}
          <div className="pt-4 border-t border-border/10">
            <label className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={application.requesting_commission_advancing || false}
                onCheckedChange={(checked) => onUpdate('requesting_commission_advancing', !!checked)}
              />
              <div>
                <span className="text-sm font-medium">Request Commission Advancing</span>
                <p className="text-xs text-muted-foreground/60">Receive commissions faster with advancing (terms apply)</p>
              </div>
            </label>
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
