import { useState, useEffect, useRef, useCallback } from 'react';
import { useContractingApplication } from '@/hooks/useContractingApplication';
import { useFormValidation } from '@/hooks/useFormValidation';
import { toast } from 'sonner';
import { Loader2, Check, ChevronLeft, ChevronRight, CheckCircle, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import tylerLogo from '@/assets/tyler-logo.webp';
import { LEGAL_QUESTIONS, type Address, ContractingApplication } from '@/types/contracting';
import { cn } from '@/lib/utils';

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
import { SuccessModal } from './SuccessModal';
import { useContractingPdf } from '@/hooks/useContractingPdf';

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
const STORAGE_KEY_STEP = 'tig_contracting_current_step';

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

export function ContractingForm() {
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

  const { validationState, validateForm, clearValidation, clearFieldError, onFieldBlur } = useFormValidation();

  const [showSaved, setShowSaved] = useState(false);
  const [sectionStatuses, setSectionStatuses] = useState<Record<string, SectionStatus>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_STEP);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= TOTAL_STEPS) {
          return parsed;
        }
      }
    }
    return 1;
  });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [showSuccess, setShowSuccess] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
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

  // Show saved indicator (extended to 4s for better visibility)
  useEffect(() => {
    if (lastSaved) {
      setShowSaved(true);
      const timer = setTimeout(() => setShowSaved(false), 4000);
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

  // Persist currentStep to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_STEP, currentStep.toString());
    }
  }, [currentStep]);

  // Scroll to top when step changes (after DOM update)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  // Public app: there is no session to log out of. "Start over" clears the
  // in-memory draft and reloads a fresh blank form.
  const handleStartOver = () => {
    localStorage.removeItem(STORAGE_KEY_STEP);
    localStorage.removeItem('tig_contracting_draft_v1');
    window.location.reload();
  };

  const scrollToSection = useCallback((sectionId: string) => {
    const section = SECTIONS.find(s => s.id === sectionId);
    if (section) {
      setCurrentStep(section.step);
      // Scroll handled by useEffect on currentStep change
    }
  }, []);

  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= TOTAL_STEPS) {
      setCurrentStep(step);
      // Scroll handled by useEffect on currentStep change
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
    // Create an updated application object to avoid race condition with state update
    let appToValidate = application!;
    if (!appToValidate.signature_date) {
      const signatureDate = new Date().toISOString();
      updateField('signature_date', signatureDate);
      // Use the updated value for validation (state won't update until next render)
      appToValidate = { ...appToValidate, signature_date: signatureDate };
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

    // Run validation and block if invalid (bypassed in dev with ?skip-validation=true)
    const skipValidation = import.meta.env.DEV && new URLSearchParams(window.location.search).get('skip-validation') === 'true';
    if (!skipValidation) {
      const result = validateForm(appToValidate, sectionStatuses, []);
      if (!result.isFormValid) {
        toast.error('Please complete all required fields before submitting');
        // Scroll to first error section with smooth animation
        if (result.firstErrorSection) {
          scrollToSection(result.firstErrorSection);
        }
        return;
      }
    }

    // Clear validation state and proceed with submission
    clearValidation();
    setIsSubmitting(true);
    
    try {
      // PRODUCTION: Normal submission
      const success = await submitApplication();
      if (success) {
        // Clear step persistence on successful submit
        if (typeof window !== 'undefined') {
          localStorage.removeItem(STORAGE_KEY_STEP);
        }
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

  // Show submitted state (pending review) - but not if success modal is showing
  if (application.status === 'submitted' && !showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-slate-50 to-white">
        <Card
          className="max-w-lg w-full text-center rounded-2xl shadow-sm border border-slate-200/60"
        >
          <div className="space-y-6 p-10">
            <div className="relative pb-6">
              <img src={tylerLogo} alt="Logo" className="h-14 mx-auto opacity-80" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-px bg-slate-200" />
            </div>
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center">
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Packet Submitted</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              Your contracting packet and documents have been emailed to our contracting team. They'll reach out if anything is missing. A confirmation copy was sent to your email.
            </p>
            <button
              onClick={handleStartOver}
              className="inline-flex items-center gap-2 h-12 px-6 rounded-full border border-slate-200 hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700"
            >
              Start a New Packet
            </button>
          </div>
        </Card>
      </div>
    );
  }

  const initialsEntered = !!application.signature_initials && !!(application.uploaded_documents as Record<string, string>)?.initials_image;

  // Helper to check if all background questions on a step are complete
  const QUESTION_HIERARCHY: Record<string, string[]> = {
    '1': ['1a', '1b', '1c', '1d', '1e', '1f', '1g', '1h'],
    '2': ['2a', '2b', '2c', '2d'],
    '5': ['5a', '5b', '5c'],
    '8': ['8a', '8b'],
    '14': ['14a', '14c'],
    '15': ['15a', '15b', '15c'],
  };

  const areBackgroundQuestionsComplete = (step: number): boolean => {
    const legalQuestions = application.legal_questions || {};

    // Get main questions for this step
    const mainQuestions = LEGAL_QUESTIONS.filter(q => !('isSubQuestion' in q && q.isSubQuestion));
    const stepQuestions = step === 7
      ? mainQuestions.slice(0, 10)
      : mainQuestions.slice(10);

    for (const question of stepQuestions) {
      const answer = legalQuestions[question.id]?.answer;
      // Main question must be answered (not null)
      if (answer === null || answer === undefined) {
        return false;
      }
      // If main question is "Yes" and has sub-questions, check those too
      if (answer === true && QUESTION_HIERARCHY[question.id]) {
        for (const subId of QUESTION_HIERARCHY[question.id]) {
          const subAnswer = legalQuestions[subId]?.answer;
          if (subAnswer === null || subAnswer === undefined) {
            return false;
          }
        }
      }
    }
    return true;
  };

  // Helper to check if an address is complete
  const isAddressComplete = (address: Address | null | undefined): boolean => {
    if (!address) return false;
    return !!(address.street?.trim() && address.city?.trim() && address.state && address.zip?.trim());
  };

  // Helper to check if a phone number is valid (10 digits)
  const isValidPhone = (phone: string | null | undefined): boolean => {
    if (!phone) return false;
    return phone.replace(/\D/g, '').length === 10;
  };

  // Helper to check if routing number is valid (9 digits)
  const isValidRouting = (routing: string | null | undefined): boolean => {
    if (!routing) return false;
    return routing.replace(/\D/g, '').length === 9;
  };

  // Check if current step has all required fields completed
  const isStepComplete = (step: number): boolean => {
    // Dev-only validation bypass: ?skip-validation=true
    if (import.meta.env.DEV && new URLSearchParams(window.location.search).get('skip-validation') === 'true') {
      return true;
    }

    const docs = (application.uploaded_documents || {}) as Record<string, string>;

    switch (step) {
      case 1: // Initials
        return !!application.signature_initials && !!docs.initials_image;

      case 2: // Personal Info
        return !!(
          application.full_legal_name?.trim() &&
          application.birth_date &&
          application.gender &&
          application.birth_city?.trim() &&
          application.birth_state &&
          isValidPhone(application.phone_mobile)
        );

      case 3: // Home Address
        return isAddressComplete(application.home_address);

      case 4: // Mailing & Shipping - Optional, always allow proceed
        return true;

      case 5: // Licensing
        return !!(
          application.npn_number?.trim() &&
          application.resident_state &&
          application.insurance_license_number?.trim() &&
          application.tax_id?.replace(/\D/g, '').length === 9 &&
          application.drivers_license_number?.trim() &&
          application.drivers_license_state
        );

      case 6: // Additional Licenses - Optional
        return true;

      case 7: // Background Questions 1
        return areBackgroundQuestionsComplete(7);

      case 8: // Background Questions 2
        return areBackgroundQuestionsComplete(8);

      case 9: // Banking - only routing and account are required
        return !!(
          isValidRouting(application.bank_routing_number) &&
          application.bank_account_number?.trim()
        );

      case 10: // Documents - require all 3: insurance_license, eo_certificate, voided_check
        return !!(docs.insurance_license && docs.eo_certificate && docs.voided_check);

      case 11: // Agreements - allow proceed (acknowledgment tracked separately)
        return true;

      case 12: // Sign & Submit
        return !!(
          application.signature_name?.trim() &&
          docs.final_signature
        );

      default:
        return true;
    }
  };

  // Get missing fields message for tooltip
  const getMissingFieldsHint = (step: number): string | null => {
    const docs = (application.uploaded_documents || {}) as Record<string, string>;
    const missing: string[] = [];

    switch (step) {
      case 1:
        if (!application.signature_initials) missing.push('initials');
        if (!docs.initials_image) missing.push('drawn initials');
        break;
      case 2:
        if (!application.full_legal_name?.trim()) missing.push('full name');
        if (!application.birth_date) missing.push('date of birth');
        if (!application.gender) missing.push('gender');
        if (!application.birth_city?.trim()) missing.push('city of birth');
        if (!application.birth_state) missing.push('state of birth');
        if (!isValidPhone(application.phone_mobile)) missing.push('mobile phone');
        break;
      case 3:
        if (!isAddressComplete(application.home_address)) missing.push('complete address');
        break;
      case 5:
        if (!application.npn_number?.trim()) missing.push('NPN');
        if (!application.resident_state) missing.push('resident state');
        if (!application.insurance_license_number?.trim()) missing.push('license number');
        if (application.tax_id?.replace(/\D/g, '').length !== 9) missing.push('SSN');
        if (!application.drivers_license_number?.trim()) missing.push("driver's license");
        if (!application.drivers_license_state) missing.push("driver's license state");
        break;
      case 9:
        if (!isValidRouting(application.bank_routing_number)) missing.push('routing number');
        if (!application.bank_account_number?.trim()) missing.push('account number');
        break;
      case 10:
        if (!docs.insurance_license) missing.push('resident license');
        if (!docs.eo_certificate) missing.push('E&O certificate');
        if (!docs.voided_check) missing.push('voided check');
        break;
      case 12:
        if (!application.signature_name?.trim()) missing.push('typed signature');
        if (!docs.final_signature) missing.push('drawn signature');
        break;
    }

    if (missing.length === 0) return null;
    return `Missing: ${missing.join(', ')}`;
  };

  // Render current step content
  const renderCurrentStep = () => {
    const initialsEntered = !!application.signature_initials;

    switch (currentStep) {
      case 1:
        return (
          <InitialsEntrySection
            fullName={application.full_legal_name}
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
              fieldSuccess={validationState.fieldSuccess}
              showValidation={validationState.hasValidated && !validationState.isFormValid}
              onClearError={clearFieldError}
              onFieldBlur={onFieldBlur}
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
            fieldSuccess={validationState.fieldSuccess}
            showValidation={validationState.hasValidated && !validationState.isFormValid}
            onClearError={clearFieldError}
            onFieldBlur={onFieldBlur}
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
            fieldSuccess={validationState.fieldSuccess}
            showValidation={validationState.hasValidated && !validationState.isFormValid}
            onClearError={clearFieldError}
            onFieldBlur={onFieldBlur}
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
            fieldSuccess={validationState.fieldSuccess}
            showValidation={validationState.hasValidated && !validationState.isFormValid}
            onClearError={clearFieldError}
            onFieldBlur={onFieldBlur}
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
            fieldSuccess={validationState.fieldSuccess}
            showValidation={validationState.hasValidated && !validationState.isFormValid}
            onClearError={clearFieldError}
            onFieldBlur={onFieldBlur}
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
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
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
          
          {/* Start over - ghost */}
          <button
            onClick={handleStartOver}
            className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            Start over
          </button>
        </div>
      </header>


      {/* Validation Banner - shows only after submit attempt with errors */}
      <div className="max-w-4xl mx-auto px-6">
        <ValidationBanner
          show={validationState.hasValidated && !validationState.isFormValid}
          sectionErrors={validationState.sectionErrors}
          onSectionClick={scrollToSection}
        />
      </div>

      {/* Main Form Content */}
      <main className="max-w-4xl mx-auto px-6 py-2">
        {/* Step Title */}
        <div className="text-center mb-3">
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
            {SECTIONS.find(s => s.step === currentStep)?.name}
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
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
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
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
            <div className="relative group">
              <button
                onClick={goNext}
                disabled={!isStepComplete(currentStep)}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-full font-medium text-sm transition-all duration-200",
                  !isStepComplete(currentStep)
                    ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                    : "bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98]"
                )}
              >
                <span>Continue</span>
                <ChevronRight className="h-4 w-4" />
              </button>
              {/* Tooltip showing missing fields */}
              {!isStepComplete(currentStep) && getMissingFieldsHint(currentStep) && (
                <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {getMissingFieldsHint(currentStep)}
                  <div className="absolute top-full right-4 border-4 border-transparent border-t-slate-800" />
                </div>
              )}
            </div>
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
          // Close the modal; the "Packet Submitted" terminal card takes over.
          setShowSuccess(false);
        }}
      />
    </div>
  );
}
