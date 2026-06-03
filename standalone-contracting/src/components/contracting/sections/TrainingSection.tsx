import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ContractingApplication } from '@/types/contracting';
import { GraduationCap, Lock, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FormFieldError, getFieldErrorClass } from '../FormFieldError';

interface TrainingSectionProps {
  application: ContractingApplication;
  onUpdate: <K extends keyof ContractingApplication>(field: K, value: ContractingApplication[K]) => void;
  disabled?: boolean;
  fieldErrors?: Record<string, string>;
  showValidation?: boolean;
  onClearError?: (field: string) => void;
}

export function TrainingSection({ application, onUpdate, disabled, fieldErrors = {}, showValidation = false, onClearError }: TrainingSectionProps) {

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
            

            {/* Get E&O Coverage Link */}
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
              <p className="text-sm text-muted-foreground mb-2">
                Need E&O coverage? Get affordable Errors & Omissions insurance through NAPA Benefits.
              </p>
              <a
                href="https://www.napa-benefits.org/insurance/errors-and-omissions-eando-insurance"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                Get E&O Coverage
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* AML Training */}
          <div className="pt-4 border-t border-border/10">
            <h4 className="text-sm font-medium mb-2">Anti-Money Laundering (AML) Training</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Have you taken an AML course within the past two (2) years? (Anti-Money Laundering)
            </p>
            
            <RadioGroup
              value={application.has_aml_course === true ? 'yes' : application.has_aml_course === false ? 'no' : ''}
              onValueChange={value => {
                onUpdate('has_aml_course', value === 'yes');
                if (value === 'no') {
                  onUpdate('aml_course_name', null);
                  onUpdate('aml_course_date', null);
                }
              }}
              className="flex gap-6 mb-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="yes" id="aml_yes_section" className="h-4 w-4" />
                <Label htmlFor="aml_yes_section" className="text-sm cursor-pointer">Yes</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="no" id="aml_no_section" className="h-4 w-4" />
                <Label htmlFor="aml_no_section" className="text-sm cursor-pointer">No</Label>
              </div>
            </RadioGroup>

            {application.has_aml_course && (
              <div className="grid gap-4 md:grid-cols-2 animate-fade-in">
                <div className="space-y-2">
                  <Label htmlFor="aml_course_name">Course Name</Label>
                  <Input
                    id="aml_course_name"
                    value={application.aml_course_name || ''}
                    onChange={(e) => onUpdate('aml_course_name', e.target.value)}
                    placeholder="Enter course name"
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aml_course_date">Course Date</Label>
                  <Input
                    id="aml_course_date"
                    type="date"
                    value={application.aml_course_date || ''}
                    onChange={(e) => onUpdate('aml_course_date', e.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>
              </div>
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
