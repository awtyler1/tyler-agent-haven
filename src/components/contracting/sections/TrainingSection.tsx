import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ContractingApplication } from '@/types/contracting';
import { FileDropZone } from '../FileDropZone';
import { GraduationCap, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FormFieldError, getFieldErrorClass } from '../FormFieldError';

interface TrainingSectionProps {
  application: ContractingApplication;
  onUpdate: <K extends keyof ContractingApplication>(field: K, value: ContractingApplication[K]) => void;
  onUpload: (file: File, documentType: string) => Promise<string | null>;
  onRemove: (documentType: string) => Promise<void>;
  disabled?: boolean;
  fieldErrors?: Record<string, string>;
  showValidation?: boolean;
  onClearError?: (field: string) => void;
}

export function TrainingSection({ application, onUpdate, onUpload, onRemove, disabled, fieldErrors = {}, showValidation = false, onClearError }: TrainingSectionProps) {
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
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg font-medium">Training & Certifications</CardTitle>
            <p className="text-xs text-muted-foreground/60">E&O insurance, AML training, and certifications</p>
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
          {/* E&O Insurance */}
          <div>
            <h4 className="text-sm font-medium mb-4">E&O Insurance</h4>
            
            <label className="flex items-center gap-3 cursor-pointer mb-4">
              <Checkbox
                checked={application.eo_not_yet_covered || false}
                onCheckedChange={(checked) => onUpdate('eo_not_yet_covered', !!checked)}
              />
              <span className="text-sm text-muted-foreground">I don't have E&O coverage yet</span>
            </label>

            {!application.eo_not_yet_covered && (
              <>
                <div className="grid gap-4 md:grid-cols-3 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="eo_provider">E&O Provider</Label>
                    <Input
                      id="eo_provider"
                      value={application.eo_provider || ''}
                      onChange={(e) => onUpdate('eo_provider', e.target.value)}
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="eo_policy_number">Policy Number</Label>
                    <Input
                      id="eo_policy_number"
                      value={application.eo_policy_number || ''}
                      onChange={(e) => onUpdate('eo_policy_number', e.target.value)}
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="eo_expiration_date">Expiration Date</Label>
                    <Input
                      id="eo_expiration_date"
                      type="date"
                      value={application.eo_expiration_date || ''}
                      onChange={(e) => onUpdate('eo_expiration_date', e.target.value)}
                      className="h-11 rounded-xl"
                    />
                  </div>
                </div>
                <div>
                  <FileDropZone
                    label="E&O Certificate"
                    documentType="eo_certificate"
                    existingFile={uploadedDocs['eo_certificate']}
                    onUpload={onUpload}
                    onRemove={() => onRemove('eo_certificate')}
                    onClearError={onClearError}
                    description="Your E&O certificate must list your full name as the insured"
                    hasError={showValidation && !!fieldErrors.eo_certificate}
                  />
                  <FormFieldError error={fieldErrors.eo_certificate} show={showValidation} />
                </div>
              </>
            )}
          </div>

          {/* AML Training */}
          <div className="pt-4 border-t border-border/10">
            <h4 className="text-sm font-medium mb-4">Anti-Money Laundering (AML) Training</h4>
            <div className="grid gap-4 md:grid-cols-2 mb-4">
              <div className="space-y-2">
                <Label htmlFor="aml_training_provider">AML Provider</Label>
                <Select 
                  value={application.aml_training_provider || ''} 
                  onValueChange={(v) => onUpdate('aml_training_provider', v)}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Select provider..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LIMRA">LIMRA</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                    <SelectItem value="None">None yet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="aml_completion_date">Date Completed</Label>
                <Input
                  id="aml_completion_date"
                  type="date"
                  value={application.aml_completion_date || ''}
                  onChange={(e) => onUpdate('aml_completion_date', e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>
            </div>
            {application.aml_training_provider && application.aml_training_provider !== 'LIMRA' && application.aml_training_provider !== 'None' && (
              <FileDropZone
                label="AML Certificate"
                documentType="aml_certificate"
                existingFile={uploadedDocs['aml_certificate']}
                onUpload={onUpload}
                onRemove={() => onRemove('aml_certificate')}
              />
            )}
          </div>

          {/* FINRA */}
          <div className="pt-4 border-t border-border/10">
            <label className="flex items-center gap-3 cursor-pointer mb-4">
              <Checkbox
                checked={application.is_finra_registered || false}
                onCheckedChange={(checked) => onUpdate('is_finra_registered', !!checked)}
              />
              <div>
                <span className="text-sm font-medium">I am a registered representative with FINRA</span>
              </div>
            </label>

            {application.is_finra_registered && (
              <div className="grid gap-4 md:grid-cols-2 pl-6">
                <div className="space-y-2">
                  <Label htmlFor="finra_broker_dealer_name">Broker/Dealer Name <span className="text-destructive">*</span></Label>
                  <Input
                    id="finra_broker_dealer_name"
                    value={application.finra_broker_dealer_name || ''}
                    onChange={(e) => {
                      onUpdate('finra_broker_dealer_name', e.target.value);
                      if (e.target.value && onClearError) onClearError('finra_broker_dealer_name');
                    }}
                    className={cn("h-11 rounded-xl", getFieldErrorClass(!!fieldErrors.finra_broker_dealer_name, showValidation))}
                  />
                  <FormFieldError error={fieldErrors.finra_broker_dealer_name} show={showValidation} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="finra_crd_number">CRD # <span className="text-destructive">*</span></Label>
                  <Input
                    id="finra_crd_number"
                    value={application.finra_crd_number || ''}
                    onChange={(e) => {
                      onUpdate('finra_crd_number', e.target.value);
                      if (e.target.value && onClearError) onClearError('finra_crd_number');
                    }}
                    className={cn("h-11 rounded-xl", getFieldErrorClass(!!fieldErrors.finra_crd_number, showValidation))}
                  />
                  <FormFieldError error={fieldErrors.finra_crd_number} show={showValidation} />
                </div>
              </div>
            )}
          </div>

          {/* LTC Certification */}
          <div className="pt-4 border-t border-border/10">
            <label className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={application.has_ltc_certification || false}
                onCheckedChange={(checked) => onUpdate('has_ltc_certification', !!checked)}
              />
              <div>
                <span className="text-sm font-medium">I have Long-Term Care Partnership Certification</span>
                <p className="text-xs text-muted-foreground/60">Please attach certificate if applicable</p>
              </div>
            </label>

            {application.has_ltc_certification && (
              <div className="mt-4 pl-6">
                <FileDropZone
                  label="LTC Certificate"
                  documentType="ltc_certificate"
                  existingFile={uploadedDocs['ltc_certificate']}
                  onUpload={onUpload}
                  onRemove={() => onRemove('ltc_certificate')}
                />
              </div>
            )}
          </div>

          {/* Continuing Education */}
          <div className="pt-4 border-t border-border/10">
            <label className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={application.state_requires_ce || false}
                onCheckedChange={(checked) => onUpdate('state_requires_ce', !!checked)}
              />
              <div>
                <span className="text-sm font-medium">My state requires Continuing Education (CE)</span>
                <p className="text-xs text-muted-foreground/60">Check if your resident state has CE requirements for insurance agents</p>
              </div>
            </label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
