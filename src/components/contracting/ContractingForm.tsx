import { useState, useEffect, useRef, useCallback } from 'react';
import { useContractingApplication } from '@/hooks/useContractingApplication';
import { useProfile } from '@/hooks/useProfile';
import { useFormValidation } from '@/hooks/useFormValidation';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, LogOut, Check, Lock, AlertCircle, ChevronDown, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Clock } from 'lucide-react';
import tylerLogo from '@/assets/tyler-logo.png';
import { LEGAL_QUESTIONS, type Address, ContractingApplication } from '@/types/contracting';

// Section components
import { InitialsEntrySection } from './sections/InitialsEntrySection';
import { PersonalInfoSection } from './sections/PersonalInfoSection';
import { MarketingConsentSection } from './sections/MarketingConsentSection';
import { HomeAddressSection } from './sections/HomeAddressSection';
import { MailingShippingSection } from './sections/MailingShippingSection';
import { LicensingSection } from './sections/LicensingSection';
import { AdditionalLicensesSection } from './sections/AdditionalLicensesSection';
import { BackgroundQuestionsSection1 } from './sections/BackgroundQuestionsSection1';
import { BackgroundQuestionsSection2 } from './sections/BackgroundQuestionsSection2';
import { BankingSection } from './sections/BankingSection';
import { DocumentsSection } from './sections/DocumentsSection';
import { AgreementsSection } from './sections/AgreementsSection';
import { SignSubmitSection } from './sections/SignSubmitSection';
import { ValidationBanner } from './ValidationBanner';
import { TestModeSnapshotPanel } from './TestModeSnapshotPanel';
import { SuccessModal } from './SuccessModal';

import { TestModeValidationReport } from './TestModeValidationReport';
import { TestModeMappingReport } from './TestModeMappingReport';
import { TestModeSchemaPanel } from './TestModeSchemaPanel';
import { TestModePdfPreviewPanel } from './TestModePdfPreviewPanel';
import { TestModePdfDebugPanel, DebugLogEntry } from './TestModePdfDebugPanel';
import { TestModeSignatureFieldsPanel } from './TestModeSignatureFieldsPanel';
import { TestModeEdgeLogsPanel } from './TestModeEdgeLogsPanel';
import { useContractingPdf, MappingEntry, SignatureFieldInfo } from '@/hooks/useContractingPdf';

interface SubmissionSnapshot {
  timestamp: string;
  submissionId: string;
  data: Partial<ContractingApplication>;
}

export interface SectionStatus {
  id: string;
  name: string;
  acknowledged: boolean;
  acknowledgedAt: string | null;
  hasErrors: boolean;
}

const SECTIONS = [
  { id: 'initials', name: 'Get Started', step: 1, requiresAcknowledgment: false },
  { id: 'personal', name: 'Personal Info', step: 2, requiresAcknowledgment: true },
  { id: 'home-address', name: 'Home Address', step: 3, requiresAcknowledgment: true },
  { id: 'other-addresses', name: 'Mailing & Shipping', step: 4, requiresAcknowledgment: true },
  { id: 'licensing', name: 'Licensing', step: 5, requiresAcknowledgment: true },
  { id: 'additional-licenses', name: 'Additional Licenses', step: 6, requiresAcknowledgment: true },
  { id: 'background-1', name: 'Background', step: 7, requiresAcknowledgment: true },
  { id: 'background-2', name: 'Background', step: 8, requiresAcknowledgment: true },
  { id: 'banking', name: 'Banking', step: 9, requiresAcknowledgment: true },
  { id: 'documents', name: 'Documents', step: 10, requiresAcknowledgment: true },
  { id: 'agreements', name: 'Agreements', step: 11, requiresAcknowledgment: true },
  { id: 'signature', name: 'Sign & Submit', step: 12, requiresAcknowledgment: false },
];

const TOTAL_STEPS = 12;

// Step descriptions helper
const getStepDescription = (step: number): string => {
  const descriptions: Record<number, string> = {
    1: "Let's get started",
    2: "How can we reach you?",
    3: "Where do you live?",
    4: "Any other addresses?",
    5: "Your license information",
    6: "Additional states and registrations",
    7: "A few background questions",
    8: "Just a few more questions",
    9: "Set up your payments",
    10: "Upload your documents",
    11: "Review the agreements",
    12: "Sign and submit",
  };
  return descriptions[step] || "";
};

// Generate a simple initials image as base64
const generateTestInitialsImage = (initials: string): string => {
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 80;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#000';
    ctx.font = 'italic 40px serif';
    ctx.fillText(initials, 50, 55);
  }
  return canvas.toDataURL('image/png');
};

// Generate a simple signature image as base64
const generateTestSignatureImage = (name: string): string => {
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 100;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#000';
    ctx.font = 'italic 32px cursive';
    ctx.fillText(name, 20, 60);
  }
  return canvas.toDataURL('image/png');
};

export function ContractingForm() {
  const { profile } = useProfile();
  const {
    application,
    loading,
    saving,
    lastSaved,
    updateField,
    uploadDocument,
    deleteDocument,
    submitApplication,
  } = useContractingApplication();

  const { validationState, validateForm, clearValidation, clearFieldError } = useFormValidation();

  const [showSaved, setShowSaved] = useState(false);
  const [sectionStatuses, setSectionStatuses] = useState<Record<string, SectionStatus>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [showSuccess, setShowSuccess] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [testMode, setTestMode] = useState(false);
  const [lastSubmissionSnapshot, setLastSubmissionSnapshot] = useState<SubmissionSnapshot | null>(null);
  const [lastMappingReport, setLastMappingReport] = useState<MappingEntry[] | null>(null);
  const [lastPdfData, setLastPdfData] = useState<{ base64: string | null; filename: string | null; size: number | null; error: string | null }>({
    base64: null,
    filename: null,
    size: null,
    error: null,
  });
  const [lastDebugLogs, setLastDebugLogs] = useState<DebugLogEntry[]>([]);
  const [lastSignatureFields, setLastSignatureFields] = useState<SignatureFieldInfo[]>([]);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  
  const { generatePdf, downloadPdf } = useContractingPdf();

  // Initialize section statuses from application
  useEffect(() => {
    if (application?.section_acknowledgments) {
      const acks = application.section_acknowledgments as Record<string, { acknowledged: boolean; acknowledgedAt: string | null }>;
      const statuses: Record<string, SectionStatus> = {};
      
      SECTIONS.forEach(section => {
        const ack = acks[section.id];
        statuses[section.id] = {
          id: section.id,
          name: section.name,
          acknowledged: ack?.acknowledged || false,
          acknowledgedAt: ack?.acknowledgedAt || null,
          hasErrors: false,
        };
      });
      
      setSectionStatuses(statuses);
    } else {
      // Initialize empty statuses
      const statuses: Record<string, SectionStatus> = {};
      SECTIONS.forEach(section => {
        statuses[section.id] = {
          id: section.id,
          name: section.name,
          acknowledged: false,
          acknowledgedAt: null,
          hasErrors: false,
        };
      });
      setSectionStatuses(statuses);
    }
  }, [application?.section_acknowledgments]);

  // Show saved indicator
  useEffect(() => {
    if (lastSaved) {
      setShowSaved(true);
      const timer = setTimeout(() => setShowSaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [lastSaved]);

  // Cleanup save timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (error) {
      console.log('Logout error:', error);
    }
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    });
    toast.success("Logged out successfully");
    window.location.href = '/auth';
  };

  const scrollToSection = useCallback((sectionId: string) => {
    const section = SECTIONS.find(s => s.id === sectionId);
    if (section) {
      setCurrentStep(section.step);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= TOTAL_STEPS) {
      setCurrentStep(step);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const goNext = useCallback(() => goToStep(currentStep + 1), [currentStep, goToStep]);
  const goBack = useCallback(() => goToStep(currentStep - 1), [currentStep, goToStep]);

  // Wrapper for updateField with save status tracking
  const updateFieldWithStatus = useCallback(<K extends keyof ContractingApplication>(
    field: K, 
    value: ContractingApplication[K]
  ) => {
    setSaveStatus('saving');
    
    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Call the original update function
    updateField(field, value);
    
    // Show saved status after a short delay (to account for debounce)
    saveTimeoutRef.current = setTimeout(() => {
      setSaveStatus('saved');
      // Reset to idle after 2 seconds
      saveTimeoutRef.current = setTimeout(() => {
        setSaveStatus('idle');
        saveTimeoutRef.current = null;
      }, 2000);
    }, 900); // Slightly longer than debounce delay to ensure save completes
  }, [updateField]);

  const acknowledgeSection = useCallback(async (sectionId: string) => {
    if (!application?.signature_initials) {
      toast.error('Please enter your initials first');
      scrollToSection('initials');
      return;
    }

    const now = new Date().toISOString();
    const currentAcks = (application?.section_acknowledgments || {}) as Record<string, { acknowledged: boolean; acknowledgedAt: string | null; initials?: string }>;
    const updatedAcks: Record<string, { acknowledged: boolean; acknowledgedAt: string | null; initials?: string }> = {
      ...currentAcks,
      [sectionId]: {
        acknowledged: true,
        acknowledgedAt: now,
        initials: application.signature_initials || undefined,
      },
    };

    updateField('section_acknowledgments', updatedAcks);

    setSectionStatuses(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        acknowledged: true,
        acknowledgedAt: now,
      },
    }));
  }, [application?.signature_initials, application?.section_acknowledgments, updateField, scrollToSection]);

  const handleSubmit = async () => {
    // Ensure signature date is set before validation
    if (!application?.signature_date) {
      await updateField('signature_date', new Date().toISOString());
    }
    
    // ===== DEBUG: Log all form fields as flat JSON at submission time =====
    const flattenObject = (obj: any, prefix = ''): Record<string, any> => {
      const result: Record<string, any> = {};
      for (const [key, value] of Object.entries(obj || {})) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
          Object.assign(result, flattenObject(value, newKey));
        } else if (Array.isArray(value)) {
          result[newKey] = JSON.stringify(value);
        } else if (typeof value === 'string' && value.startsWith('data:image')) {
          result[newKey] = `[BASE64_IMAGE:${value.length} chars]`;
        } else {
          result[newKey] = value;
        }
      }
      return result;
    };
    
    const flatFormData = flattenObject(application);
    console.log('🔍 ===== SUBMISSION DEBUG: ALL FORM FIELDS (FLAT JSON) =====');
    console.log(JSON.stringify(flatFormData, null, 2));
    console.log('🔍 ===== END SUBMISSION DEBUG =====');
    // ===== END DEBUG =====
    
    // In Test Mode: skip validation entirely
    if (testMode) {
      // Clear any previous validation state
      clearValidation();
      setIsSubmitting(true);
      
      try {
        // TEST MODE: Capture snapshot regardless of validation status
        const snapshot: SubmissionSnapshot = {
          timestamp: new Date().toISOString(),
          submissionId: `TEST-${Date.now().toString(36).toUpperCase()}`,
          data: { ...application },
        };
        setLastSubmissionSnapshot(snapshot);
        
        // Generate PDF to get mapping report (don't save to storage in test mode, skip validation)
        const pdfResult = await generatePdf(application, false, true);
        
        // Store PDF data for preview
        setLastPdfData({
          base64: pdfResult.pdf || null,
          filename: pdfResult.filename || null,
          size: pdfResult.size || null,
          error: pdfResult.error || null,
        });
        
        if (pdfResult.mappingReport) {
          setLastMappingReport(pdfResult.mappingReport);
          console.log('📋 Mapping Report:', pdfResult.mappingReport);
        }
        
        // Capture debug logs from PDF generation
        if (pdfResult.debugLogs) {
          setLastDebugLogs(pdfResult.debugLogs);
          console.log('🔧 Debug Logs:', pdfResult.debugLogs);
        }
        
        // Capture signature fields found
        if (pdfResult.signatureFieldsFound) {
          setLastSignatureFields(pdfResult.signatureFieldsFound);
          console.log('✍️ Signature Fields Found:', pdfResult.signatureFieldsFound);
        }
        
        toast.success('Test submission captured! Check the reports below.');
        console.log('📋 Test Mode Submission:', { snapshot, mappingReport: pdfResult.mappingReport });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }
    
    // PRODUCTION MODE: Run validation and block if invalid
    const result = validateForm(application!, sectionStatuses, []);
    if (!result.isFormValid) {
      // Scroll to first error section with smooth animation
      if (result.firstErrorSection) {
        scrollToSection(result.firstErrorSection);
      }
      return;
    }

    // Clear validation state and proceed with submission
    clearValidation();
    setIsSubmitting(true);
    
    try {
      // PRODUCTION: Normal submission
      const success = await submitApplication();
      if (success) {
        // Show success modal instead of redirecting immediately
        setShowSuccess(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-slate-50 to-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
          <p className="text-sm text-slate-500">Loading your application...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-slate-50 to-white">
        <p className="text-slate-500">Unable to load application</p>
      </div>
    );
  }

  // Show submitted state (pending review)
  if (application.status === 'submitted') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-slate-50 to-white">
        <Card 
          className="max-w-lg w-full text-center rounded-2xl shadow-sm border border-slate-200/60"
        >
          <div className="space-y-6 p-10">
            <div className="relative pb-6">
              <img src={tylerLogo} alt="Tyler Insurance Group" className="h-14 mx-auto opacity-80" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-px bg-slate-200" />
            </div>
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center">
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Contracting Under Review</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              Your contracting documents have been submitted and are being reviewed. You'll receive an email once approved.
            </p>
            <button 
              onClick={handleLogout} 
              className="inline-flex items-center gap-2 h-12 px-6 rounded-full border border-slate-200 hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700"
            >
              <LogOut className="h-4 w-4" />
              Log Out
            </button>
          </div>
        </Card>
      </div>
    );
  }

  const initialsEntered = !!application.signature_initials && !!(application.uploaded_documents as Record<string, string>)?.initials_image;

  // Render current step content
  const renderCurrentStep = () => {
    const initialsEntered = !!application.signature_initials;

    switch (currentStep) {
      case 1:
        return (
          <InitialsEntrySection
            fullName={profile?.full_name || application.full_legal_name}
            initials={application.signature_initials}
            initialsImage={(application.uploaded_documents as Record<string, string>)?.initials_image}
            onInitialsChange={(initials) => updateFieldWithStatus('signature_initials', initials)}
            onInitialsImageChange={(image) => {
              const docs = (application.uploaded_documents || {}) as Record<string, string>;
              if (image) {
                updateFieldWithStatus('uploaded_documents', { ...docs, initials_image: image });
              } else {
                const { initials_image, ...rest } = docs;
                updateFieldWithStatus('uploaded_documents', rest);
              }
            }}
            isLocked={initialsEntered && Object.values(sectionStatuses).some(s => s.acknowledged)}
          />
        );
      case 2:
        return (
          <>
            <PersonalInfoSection
              application={application}
              onUpdate={updateFieldWithStatus}
              disabled={!initialsEntered}
              fieldErrors={validationState.fieldErrors}
              showValidation={validationState.hasValidated && !validationState.isFormValid}
              onClearError={clearFieldError}
              testMode={testMode}
            />
            <div className="mt-4">
              <MarketingConsentSection
                application={application}
                onUpdate={updateFieldWithStatus}
                disabled={!initialsEntered}
              />
            </div>
          </>
        );
      case 3:
        return (
          <HomeAddressSection
            application={application}
            onUpdate={updateFieldWithStatus}
            disabled={!initialsEntered}
            fieldErrors={validationState.fieldErrors}
            showValidation={validationState.hasValidated && !validationState.isFormValid}
            onClearError={clearFieldError}
          />
        );
      case 4:
        return (
          <MailingShippingSection
            application={application}
            onUpdate={updateFieldWithStatus}
            disabled={!initialsEntered}
          />
        );
      case 5:
        return (
          <LicensingSection
            application={application}
            onUpdate={updateFieldWithStatus}
            disabled={!initialsEntered}
            fieldErrors={validationState.fieldErrors}
            showValidation={validationState.hasValidated && !validationState.isFormValid}
            onClearError={clearFieldError}
          />
        );
      case 6:
        return (
          <AdditionalLicensesSection
            application={application}
            onUpdate={updateFieldWithStatus}
            disabled={!initialsEntered}
            fieldErrors={validationState.fieldErrors}
            showValidation={validationState.hasValidated && !validationState.isFormValid}
            onClearError={clearFieldError}
          />
        );
      case 7:
        return (
          <BackgroundQuestionsSection1
            application={application}
            onUpdate={updateFieldWithStatus}
            disabled={!initialsEntered}
          />
        );
      case 8:
        return (
          <BackgroundQuestionsSection2
            application={application}
            onUpdate={updateFieldWithStatus}
            onUpload={uploadDocument}
            onRemove={deleteDocument}
            disabled={!initialsEntered}
          />
        );
      case 9:
        return (
          <BankingSection
            application={application}
            onUpdate={updateFieldWithStatus}
            disabled={!initialsEntered}
            fieldErrors={validationState.fieldErrors}
            showValidation={validationState.hasValidated && !validationState.isFormValid}
            onClearError={clearFieldError}
          />
        );
      case 10:
        return (
          <DocumentsSection
            application={application}
            onUpload={uploadDocument}
            onRemove={deleteDocument}
            disabled={!initialsEntered}
            fieldErrors={validationState.fieldErrors}
            showValidation={validationState.hasValidated && !validationState.isFormValid}
            onClearError={clearFieldError}
          />
        );
      case 11:
        return (
          <AgreementsSection
            application={application}
            onUpdate={updateFieldWithStatus}
            disabled={!initialsEntered}
          />
        );
      case 12:
        return (
          <SignSubmitSection
            application={application}
            onUpdate={updateFieldWithStatus}
            disabled={!initialsEntered}
            fieldErrors={validationState.fieldErrors}
            showValidation={validationState.hasValidated && !validationState.isFormValid}
            onClearError={clearFieldError}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Minimal Floating Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-slate-200/50">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Logo - subtle */}
          <img src={tylerLogo} alt="Tyler Insurance" className="h-6 opacity-80" />
          
          {/* Step indicator - minimal */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Step {currentStep} of {TOTAL_STEPS}</span>
              <div className="w-16 h-1 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-slate-900 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
                />
              </div>
            </div>
            {/* Save status indicator */}
            <div className="flex items-center gap-2">
              {saveStatus === 'saving' && (
                <div className="flex items-center gap-1.5 text-slate-400 animate-in fade-in duration-150">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="text-xs">Saving...</span>
                </div>
              )}
              {saveStatus === 'saved' && (
                <div className="flex items-center gap-1.5 text-emerald-600 animate-in fade-in duration-150">
                  <CheckCircle className="h-3 w-3" />
                  <span className="text-xs">Saved</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Logout - ghost */}
          <button 
            onClick={handleLogout}
            className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            Log out
          </button>
        </div>
      </header>


      {/* Validation Banner - shows only after submit attempt with errors (hidden in test mode) */}
      {!testMode && (
        <div className="max-w-2xl mx-auto px-6">
          <ValidationBanner 
            show={validationState.hasValidated && !validationState.isFormValid}
            sectionErrors={validationState.sectionErrors}
            onSectionClick={scrollToSection}
          />
        </div>
      )}

      {/* Test Mode Panels */}
      {testMode && (
        <div className="max-w-2xl mx-auto px-6 py-4 space-y-4">
          {/* Schema Panel - always show in test mode */}
          <TestModeSchemaPanel application={application} />
          
          {/* PDF Preview Panel - show after PDF generation */}
          <TestModePdfPreviewPanel
            pdfBase64={lastPdfData.base64}
            filename={lastPdfData.filename}
            size={lastPdfData.size}
            error={lastPdfData.error}
            onDownload={downloadPdf}
          />
          
          {/* Validation Report - show after validation attempt */}
          {validationState.hasValidated && (
            <TestModeValidationReport 
              sectionErrors={validationState.sectionErrors}
              application={application}
              isFormValid={validationState.isFormValid}
            />
          )}
          
          {/* Snapshot Panel - show after test submission */}
          {lastSubmissionSnapshot && (
            <TestModeSnapshotPanel snapshot={lastSubmissionSnapshot} />
          )}
          
          {/* Mapping Report - show after PDF generation */}
          {lastMappingReport && lastMappingReport.length > 0 && (
            <TestModeMappingReport mappingReport={lastMappingReport} />
          )}
          
          {/* Signature Fields Found - show after PDF generation */}
          {lastSignatureFields && lastSignatureFields.length > 0 && (
            <TestModeSignatureFieldsPanel fields={lastSignatureFields} />
          )}
          
          {/* PDF Debug Log - show after PDF generation */}
          <TestModePdfDebugPanel logs={lastDebugLogs} />
          
          {/* Edge Function Logs Panel */}
          <TestModeEdgeLogsPanel />
        </div>
      )}

      {/* Main Form Content */}
      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* Step Title */}
        <div className="text-center mb-10">
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            {SECTIONS.find(s => s.step === currentStep)?.name}
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            {getStepDescription(currentStep)}
          </p>
        </div>
        
        {/* Step Content with transition */}
        <div 
          key={currentStep}
          className="transition-all duration-300 ease-out"
        >
          {renderCurrentStep()}
        </div>
      </main>

      {/* Fixed Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-200/50">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Back button */}
          {currentStep > 1 ? (
            <button
              onClick={goBack}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Back</span>
            </button>
          ) : (
            <div />
          )}
          
          {/* Continue/Submit button */}
          {currentStep < TOTAL_STEPS ? (
            <button
              onClick={goNext}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98] transition-all duration-200 font-medium text-sm"
            >
              <span>Continue</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-8 py-3 rounded-full bg-emerald-600 text-white hover:bg-emerald-500 active:scale-[0.98] transition-all duration-200 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <span>Submit Application</span>
                  <Check className="h-4 w-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Spacer to prevent content from hiding behind fixed nav */}
      <div className="h-24" />

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccess}
        agentName={application?.full_legal_name || ''}
        onClose={() => {
          setShowSuccess(false);
          // Navigate to dashboard or next step
          window.location.href = '/dashboard';
        }}
      />
    </div>
  );
}
