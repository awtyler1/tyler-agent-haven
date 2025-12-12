import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ContractingApplication, US_STATES } from '@/types/contracting';
import { FileDropZone } from '../FileDropZone';
import { IdCard, Lock, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FormFieldError, getFieldErrorClass } from '../FormFieldError';

interface LicensingSectionProps {
  application: ContractingApplication;
  onUpdate: <K extends keyof ContractingApplication>(field: K, value: ContractingApplication[K]) => void;
  onUpload: (file: File, documentType: string) => Promise<string | null>;
  onRemove: (documentType: string) => Promise<void>;
  disabled?: boolean;
  fieldErrors?: Record<string, string>;
  showValidation?: boolean;
  onClearError?: (field: string) => void;
}

export function LicensingSection({ application, onUpdate, onUpload, onRemove, disabled, fieldErrors = {}, showValidation = false, onClearError }: LicensingSectionProps) {
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
            <IdCard className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg font-medium">Licensing & Identification</CardTitle>
            <p className="text-xs text-muted-foreground/60">Insurance license, NPN, and identification details</p>
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
          {/* Identity Information */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="birth_date">Date of Birth <span className="text-destructive">*</span></Label>
              <Input
                id="birth_date"
                type="date"
                value={application.birth_date || ''}
                onChange={(e) => {
                  onUpdate('birth_date', e.target.value);
                  if (e.target.value && onClearError) onClearError('birth_date');
                }}
                className={cn("h-11 rounded-xl", getFieldErrorClass(!!fieldErrors.birth_date, showValidation))}
              />
              <FormFieldError error={fieldErrors.birth_date} show={showValidation} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select value={application.gender || ''} onValueChange={(v) => onUpdate('gender', v)}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tax_id">
                SSN / Tax ID <span className="text-destructive">*</span>
              </Label>
              <Input
                id="tax_id"
                value={application.tax_id || ''}
                onChange={(e) => {
                  onUpdate('tax_id', e.target.value);
                  if (e.target.value && onClearError) onClearError('tax_id');
                }}
                placeholder="XXX-XX-XXXX"
                className={cn("h-11 rounded-xl", getFieldErrorClass(!!fieldErrors.tax_id, showValidation))}
                maxLength={11}
              />
              <FormFieldError error={fieldErrors.tax_id} show={showValidation} />
              {!fieldErrors.tax_id && <p className="text-[10px] text-muted-foreground/50">Used only for contracting. Securely encrypted.</p>}
            </div>
          </div>

          {/* License Information */}
          <div className="pt-4 border-t border-border/10">
            <h4 className="text-sm font-medium mb-4">Insurance License</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="npn_number">NPN Number <span className="text-destructive">*</span></Label>
                <Input
                  id="npn_number"
                  value={application.npn_number || ''}
                  onChange={(e) => {
                    onUpdate('npn_number', e.target.value);
                    if (e.target.value && onClearError) onClearError('npn_number');
                  }}
                  placeholder="National Producer Number"
                  className={cn("h-11 rounded-xl", getFieldErrorClass(!!fieldErrors.npn_number, showValidation))}
                />
                <FormFieldError error={fieldErrors.npn_number} show={showValidation} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="insurance_license_number">Insurance License # <span className="text-destructive">*</span></Label>
                <Input
                  id="insurance_license_number"
                  value={application.insurance_license_number || ''}
                  onChange={(e) => {
                    onUpdate('insurance_license_number', e.target.value);
                    if (e.target.value && onClearError) onClearError('insurance_license_number');
                  }}
                  className={cn("h-11 rounded-xl", getFieldErrorClass(!!fieldErrors.insurance_license_number, showValidation))}
                />
                <FormFieldError error={fieldErrors.insurance_license_number} show={showValidation} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="resident_state">Resident State <span className="text-destructive">*</span></Label>
                <Select value={application.resident_state || ''} onValueChange={(v) => {
                  onUpdate('resident_state', v);
                  if (v && onClearError) onClearError('resident_state');
                }}>
                  <SelectTrigger className={cn("h-11 rounded-xl", getFieldErrorClass(!!fieldErrors.resident_state, showValidation))}>
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

              <div className="space-y-2">
                <Label htmlFor="license_expiration_date">License Expiration <span className="text-destructive">*</span></Label>
                <Input
                  id="license_expiration_date"
                  type="date"
                  value={application.license_expiration_date || ''}
                  onChange={(e) => {
                    onUpdate('license_expiration_date', e.target.value);
                    if (e.target.value && onClearError) onClearError('license_expiration_date');
                  }}
                  className={cn("h-11 rounded-xl", getFieldErrorClass(!!fieldErrors.license_expiration_date, showValidation))}
                />
                <FormFieldError error={fieldErrors.license_expiration_date} show={showValidation} />
              </div>
            </div>
          </div>

          {/* Driver's License */}
          <div className="pt-4 border-t border-border/10">
            <h4 className="text-sm font-medium mb-4">Driver's License</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="drivers_license_number">Driver's License # <span className="text-destructive">*</span></Label>
                <Input
                  id="drivers_license_number"
                  value={application.drivers_license_number || ''}
                  onChange={(e) => {
                    onUpdate('drivers_license_number', e.target.value);
                    if (e.target.value && onClearError) onClearError('drivers_license_number');
                  }}
                  className={cn("h-11 rounded-xl", getFieldErrorClass(!!fieldErrors.drivers_license_number, showValidation))}
                />
                <FormFieldError error={fieldErrors.drivers_license_number} show={showValidation} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="drivers_license_state">Driver's License State <span className="text-destructive">*</span></Label>
                <Select value={application.drivers_license_state || ''} onValueChange={(v) => {
                  onUpdate('drivers_license_state', v);
                  if (v && onClearError) onClearError('drivers_license_state');
                }}>
                  <SelectTrigger className={cn("h-11 rounded-xl", getFieldErrorClass(!!fieldErrors.drivers_license_state, showValidation))}>
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
          <div className="pt-4 border-t border-border/10">
            <label className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={application.is_corporation || false}
                onCheckedChange={(checked) => onUpdate('is_corporation', !!checked)}
              />
              <div>
                <span className="text-sm font-medium">I am applying as a corporation or business entity</span>
                <p className="text-xs text-muted-foreground/60">Additional documentation may be required</p>
              </div>
            </label>
          </div>

          {/* Document Uploads */}
          <div className="pt-4 border-t border-border/10">
            <h4 className="text-sm font-medium mb-2">Required Documents</h4>
            <p className="text-xs text-muted-foreground/60 mb-4">Upload clear photos or scans of your documents</p>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <FileDropZone
                  label="Insurance License"
                  documentType="insurance_license"
                  existingFile={uploadedDocs['insurance_license']}
                  onUpload={onUpload}
                  onRemove={() => onRemove('insurance_license')}
                  onClearError={onClearError}
                  required
                  hasError={showValidation && !!fieldErrors.insurance_license}
                />
                <FormFieldError error={fieldErrors.insurance_license} show={showValidation} />
              </div>
              <div>
                <FileDropZone
                  label="Government-Issued ID"
                  documentType="government_id"
                  existingFile={uploadedDocs['government_id']}
                  onUpload={onUpload}
                  onRemove={() => onRemove('government_id')}
                  onClearError={onClearError}
                  required
                  hasError={showValidation && !!fieldErrors.government_id}
                />
                <FormFieldError error={fieldErrors.government_id} show={showValidation} />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
