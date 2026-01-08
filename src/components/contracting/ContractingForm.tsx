import { useState, useEffect, useRef, useCallback } from 'react';
import { useContractingApplication } from '@/hooks/useContractingApplication';
import { useProfile } from '@/hooks/useProfile';
import { useFormValidation } from '@/hooks/useFormValidation';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, LogOut, Check, Lock, AlertCircle, ChevronDown, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import tylerLogo from '@/assets/tyler-logo.png';
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

  // Persist currentStep to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_STEP, currentStep.toString());
    }
  }, [currentStep]);

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
    
    // Run validation and block if invalid
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
          
          {/* Logout - ghost */}
          <button 
            onClick={handleLogout}
            className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            Log out
          </button>
        </div>
      </header>


      {/* Validation Banner - shows only after submit attempt with errors */}
      <div className="max-w-3xl mx-auto px-6">
        <ValidationBanner
          show={validationState.hasValidated && !validationState.isFormValid}
          sectionErrors={validationState.sectionErrors}
          onSectionClick={scrollToSection}
        />
      </div>

      {/* Main Form Content */}
      <main className="max-w-3xl mx-auto px-6 py-4">
        {/* Step Title */}
        <div className="text-center mb-4">
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
            <button
              onClick={goNext}
              disabled={
                (currentStep === 1 && !initialsEntered) ||
                ((currentStep === 7 || currentStep === 8) && !areBackgroundQuestionsComplete(currentStep))
              }
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-full font-medium text-sm transition-all duration-200",
                (currentStep === 1 && !initialsEntered) ||
                ((currentStep === 7 || currentStep === 8) && !areBackgroundQuestionsComplete(currentStep))
                  ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                  : "bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98]"
              )}
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
          // Navigate to contracting hub
          window.location.href = '/contracting-hub';
        }}
      />
    </div>
  );
}
