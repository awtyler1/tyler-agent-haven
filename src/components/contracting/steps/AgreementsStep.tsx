import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ContractingApplication } from '@/types/contracting';
import { PenTool } from 'lucide-react';

interface AgreementsStepProps {
  application: ContractingApplication;
  onUpdate: <K extends keyof ContractingApplication>(field: K, value: ContractingApplication[K]) => void;
  onBack: () => void;
  onContinue: () => void;
}

const AGREEMENTS = [
  { id: 'info_accurate', text: 'I confirm that all of the information provided is true and correct to the best of my knowledge.', required: true },
  { id: 'receive_emails', text: 'I agree to receive all carrier required emails and Tyler Insurance Group compliance updates.', required: true },
  { id: 'marketing', text: 'I agree to let Tyler Insurance Group send me information about carriers, products, and lead opportunities.', required: false },
  { id: 'enter_info', text: 'I give Tyler Insurance Group permission to enter this information on my behalf for contracting purposes.', required: true },
  { id: 'facsimile_signature', text: 'I authorize Tyler Insurance Group to affix a facsimile of my signature to carrier documents for contracting, and agree to indemnify and hold harmless Tyler Insurance Group and relevant third parties as described.', required: true },
];

export function AgreementsStep({ application, onUpdate, onBack, onContinue }: AgreementsStepProps) {
  const agreements = (application.agreements as Record<string, boolean>) || {};

  const handleAgreementChange = (agreementId: string, checked: boolean) => {
    onUpdate('agreements', { ...agreements, [agreementId]: checked });
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <PenTool className="h-4 w-4" />
            Agreements & E-Signature
          </CardTitle>
          <CardDescription className="text-sm">
            Review and accept the agreements, then sign below
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pb-4">
          {/* Agreements */}
          <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
            {AGREEMENTS.map(agreement => (
              <div key={agreement.id} className="flex items-start gap-2">
                <Checkbox
                  id={`agreement_${agreement.id}`}
                  checked={agreements[agreement.id] || false}
                  onCheckedChange={checked => handleAgreementChange(agreement.id, !!checked)}
                  className="h-4 w-4 mt-0.5"
                />
                <Label 
                  htmlFor={`agreement_${agreement.id}`} 
                  className="text-xs font-normal cursor-pointer leading-relaxed"
                >
                  {agreement.text}
                  {agreement.required && <span className="text-destructive ml-1">*</span>}
                </Label>
              </div>
            ))}
          </div>

          {/* Signature section */}
          <div className="border-t pt-4 space-y-3">
            <h3 className="font-medium text-sm">Electronic Signature</h3>
            <div className="grid gap-3 grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="signature_name" className="text-xs">Full Legal Name *</Label>
                <Input
                  id="signature_name"
                  value={application.signature_name || ''}
                  onChange={e => onUpdate('signature_name', e.target.value)}
                  placeholder="Type your full name"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="signature_initials" className="text-xs">Initials *</Label>
                <Input
                  id="signature_initials"
                  value={application.signature_initials || ''}
                  onChange={e => onUpdate('signature_initials', e.target.value.toUpperCase())}
                  placeholder="JD"
                  maxLength={4}
                  className="h-8 text-sm uppercase"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="signature_date" className="text-xs">Date</Label>
                <Input
                  id="signature_date"
                  type="date"
                  value={application.signature_date || today}
                  onChange={e => onUpdate('signature_date', e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              By typing your name and initials above, you are signing this application electronically.
            </p>
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={onBack} size="sm">
              Back
            </Button>
            <Button onClick={onContinue} size="sm">
              Continue to Review
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
