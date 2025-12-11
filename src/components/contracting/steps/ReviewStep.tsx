import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ContractingApplication, SelectedCarrier, Address, WIZARD_STEPS } from '@/types/contracting';
import { ClipboardCheck, CheckCircle, AlertCircle, Loader2, Download, FileText, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { WizardProgress } from '../WizardProgress';
import { useContractingPdf } from '@/hooks/useContractingPdf';
import { supabase } from '@/integrations/supabase/client';

const DOCUMENT_LABELS: Record<string, string> = {
  insurance_license: 'Insurance License',
  government_id: 'Government ID',
  voided_check: 'Voided Check',
  eo_certificate: 'E&O Certificate',
  aml_certificate: 'AML Certificate',
  ce_certificate: 'CE Certificate',
  ltc_certificate: 'LTC Certificate',
  corporate_resolution: 'Corporate Resolution',
  background_explanation: 'Background Documentation',
};
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
  const [pdfData, setPdfData] = useState<{ filename: string; pdf: string } | null>(null);
  const { generating, generatePdf, downloadPdf, validateApplication } = useContractingPdf();

  const handleSubmit = async () => {
    setSubmitting(true);
    
    // First generate the PDF
    const pdfResult = await generatePdf(application);
    if (pdfResult.success && pdfResult.pdf && pdfResult.filename) {
      setPdfData({ filename: pdfResult.filename, pdf: pdfResult.pdf });
    }
    
    // Then submit the application
    await onSubmit();
    setSubmitting(false);
  };

  const handleDownloadPdf = () => {
    if (pdfData) {
      downloadPdf(pdfData.pdf, pdfData.filename);
    }
  };

  const selectedCarriers = (application.selected_carriers as SelectedCarrier[]) || [];
  const homeAddress = application.home_address as Address;
  const agreements = application.agreements as Record<string, boolean>;
  const uploadedDocs = application.uploaded_documents as Record<string, string>;

  // Validation checks
  const checks = [
    { label: 'Personal information', passed: !!application.full_legal_name && !!application.email_address },
    { label: 'Home address', passed: !!homeAddress?.street && !!homeAddress?.city },
    { label: 'Licensing information', passed: !!application.insurance_license_number && !!application.npn_number },
    { label: 'Legal questions answered', passed: Object.keys(application.legal_questions || {}).length > 0 },
    { label: 'Banking information', passed: !!application.bank_routing_number && !!application.bank_account_number },
    { label: 'E&O Insurance', passed: !!application.uploaded_documents?.eo_certificate },
    { label: 'Carrier selection', passed: selectedCarriers.length > 0 },
    { label: 'Required agreements', passed: agreements?.info_accurate && agreements?.receive_emails && agreements?.enter_info && agreements?.facsimile_signature },
    { label: 'Electronic signature', passed: !!application.signature_name && !!application.signature_initials },
  ];

  const allPassed = checks.every(c => c.passed);
  const docCount = Object.keys(uploadedDocs || {}).length;

  // Pre-validation for PDF generation
  const pdfValidationErrors = validateApplication(application);
  const canGeneratePdf = pdfValidationErrors.length === 0;

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
            </div>
          </div>

          {/* Uploaded Documents */}
          {docCount > 0 && (
            <div className="border rounded-lg p-3">
              <h3 className="font-medium text-sm mb-2">Uploaded Documents ({docCount})</h3>
              <div className="grid grid-cols-2 gap-1.5">
                {Object.entries(uploadedDocs || {}).map(([docType, filePath]) => {
                  if (!filePath || !DOCUMENT_LABELS[docType]) return null;
                  
                  const handleViewDocument = async () => {
                    const { data } = await supabase.storage
                      .from('contracting-documents')
                      .createSignedUrl(filePath as string, 300); // 5 min expiry
                    
                    if (data?.signedUrl) {
                      window.open(data.signedUrl, '_blank');
                    }
                  };
                  
                  return (
                    <button
                      key={docType}
                      onClick={handleViewDocument}
                      className="flex items-center gap-2 text-left hover:bg-muted/50 rounded px-1.5 py-1 -mx-1.5 transition-colors group"
                    >
                      <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                      <span className="text-xs text-foreground group-hover:text-primary transition-colors">
                        {DOCUMENT_LABELS[docType]}
                      </span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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
              Initials: {application.signature_initials || 'N/A'} • Signed on {application.signature_date || 'N/A'}
            </p>
          </div>

          {/* PDF Generation Status */}
          {pdfData && (
            <div className="border rounded-lg p-3 bg-green-50 border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800">Contracting Packet Generated</p>
                    <p className="text-xs text-green-600">{pdfData.filename}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadPdf}
                  className="gap-1.5 text-green-700 border-green-300 hover:bg-green-100"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </Button>
              </div>
            </div>
          )}

          {!canGeneratePdf && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-800 font-medium mb-1">Cannot generate contracting packet:</p>
              <ul className="text-xs text-amber-700 list-disc list-inside">
                {pdfValidationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {!allPassed && canGeneratePdf && (
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
            <Button 
              onClick={handleSubmit} 
              size="sm" 
              disabled={submitting || generating || !canGeneratePdf} 
              className="gap-2"
            >
              {(submitting || generating) && <Loader2 className="h-3 w-3 animate-spin" />}
              {generating ? 'Generating PDF...' : submitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
