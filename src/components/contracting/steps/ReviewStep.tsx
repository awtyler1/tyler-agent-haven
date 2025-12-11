import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ContractingApplication, SelectedCarrier, Address, WIZARD_STEPS } from '@/types/contracting';
import { ClipboardCheck, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { WizardProgress } from '../WizardProgress';

interface ProgressProps {
  currentStep: number;
  completedSteps: number[];
  onStepClick: (step: number) => void;
}

interface ReviewStepProps {
  application: ContractingApplication;
  onBack: () => void;
  onSubmit: () => Promise<boolean>;
  progressProps: ProgressProps;
}

export function ReviewStep({ application, onBack, onSubmit, progressProps }: ReviewStepProps) {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    await onSubmit();
    setSubmitting(false);
  };

  const selectedCarriers = (application.selected_carriers as SelectedCarrier[]) || [];
  const homeAddress = application.home_address as Address;
  const agreements = application.agreements as Record<string, boolean>;
  const uploadedDocs = application.uploaded_documents as Record<string, string>;

  // Validation checks
  const checks = [
    { label: 'Personal information', passed: !!application.full_legal_name && !!application.email_address },
    { label: 'Home address', passed: !!homeAddress?.street && !!homeAddress?.city },
    { label: 'Licensing information', passed: !!application.resident_license_number },
    { label: 'Legal questions answered', passed: Object.keys(application.legal_questions || {}).length > 0 },
    { label: 'Banking information', passed: !!application.bank_routing_number && !!application.bank_account_number },
    { label: 'AML training', passed: !!application.aml_training_provider },
    { label: 'Carrier selection', passed: selectedCarriers.length > 0 },
    { label: 'Required agreements', passed: agreements?.info_accurate && agreements?.receive_emails && agreements?.enter_info && agreements?.facsimile_signature },
    { label: 'Electronic signature', passed: !!application.signature_name && !!application.signature_initials },
  ];

  const allPassed = checks.every(c => c.passed);
  const docCount = Object.keys(uploadedDocs || {}).length;

  return (
    <div className="max-w-4xl mx-auto">
      <Card 
        className="border-0 rounded-[24px]"
        style={{ 
          background: 'linear-gradient(180deg, #FFFFFF 0%, #FEFEFE 100%)',
          boxShadow: '0px 1px 0px rgba(255, 255, 255, 0.8) inset, 0px 20px 60px rgba(0, 0, 0, 0.08), 0px 0px 100px rgba(163, 133, 41, 0.03)'
        }}
      >
        {/* Progress + Header */}
        <div className="pt-4 pb-3 text-center border-b border-border/20">
          <WizardProgress {...progressProps} compact />
          <div className="flex items-center justify-center gap-2.5 mt-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <ClipboardCheck className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-lg font-semibold font-serif" style={{ letterSpacing: '0.015em' }}>Review & Submit</h2>
          </div>
          <p className="text-[11px] text-muted-foreground/60 mt-1">
            Review your application before submitting
          </p>
        </div>
        <CardContent className="space-y-4 py-4 px-6">
          {/* Summary */}
          <div className="grid gap-3 grid-cols-2">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Applicant</p>
              <p className="font-medium text-sm">{application.full_legal_name || 'Not provided'}</p>
              <p className="text-xs text-muted-foreground">{application.email_address}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Carriers Selected</p>
              <p className="font-medium text-sm">{selectedCarriers.length} carrier{selectedCarriers.length !== 1 ? 's' : ''}</p>
              <p className="text-xs text-muted-foreground">{docCount} document{docCount !== 1 ? 's' : ''} uploaded</p>
            </div>
          </div>

          {/* Checklist */}
          <div className="border rounded-lg p-3">
            <h3 className="font-medium text-sm mb-2">Application Checklist</h3>
            <div className="grid grid-cols-2 gap-2">
              {checks.map((check, index) => (
                <div key={index} className="flex items-center gap-2">
                  {check.passed ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                  )}
                  <span className={`text-xs ${check.passed ? 'text-foreground' : 'text-amber-600'}`}>
                    {check.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Carriers list */}
          {selectedCarriers.length > 0 && (
            <div className="border rounded-lg p-3">
              <h3 className="font-medium text-sm mb-2">Selected Carriers</h3>
              <div className="flex flex-wrap gap-1">
                {selectedCarriers.map(carrier => (
                  <span key={carrier.carrier_id} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded">
                    {carrier.carrier_name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Signature confirmation */}
          <div className="border rounded-lg p-3 bg-muted/30">
            <h3 className="font-medium text-sm mb-1">Electronic Signature</h3>
            <p className="text-sm">{application.signature_name || 'Not signed'}</p>
            <p className="text-xs text-muted-foreground">
              Signed on {application.signature_date || 'N/A'}
            </p>
          </div>

          {!allPassed && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-800">
                Some sections are incomplete. You can still submit, but completing all sections helps speed up processing.
              </p>
            </div>
          )}

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={onBack} size="sm">
              Back
            </Button>
            <Button onClick={handleSubmit} size="sm" disabled={submitting} className="gap-2">
              {submitting && <Loader2 className="h-3 w-3 animate-spin" />}
              Submit Application
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
