import { useState, useEffect, useRef, useCallback } from 'react';
import { useContractingApplication } from '@/hooks/useContractingApplication';
import { useProfile } from '@/hooks/useProfile';
import { useFormValidation } from '@/hooks/useFormValidation';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, LogOut, Check, Lock, AlertCircle, ChevronDown, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import tylerLogo from '@/assets/tyler-logo.png';
import { LEGAL_QUESTIONS, type Address } from '@/types/contracting';

// Section components
import { InitialsEntrySection } from './sections/InitialsEntrySection';
import { PersonalInfoSection } from './sections/PersonalInfoSection';
import { MarketingConsentSection } from './sections/MarketingConsentSection';
import { AddressSection } from './sections/AddressSection';
import { LicensingSection } from './sections/LicensingSection';
import { LegalQuestionsSection } from './sections/LegalQuestionsSection';
import { BackgroundSignatureSection } from './sections/BackgroundSignatureSection';
import { BankingSection } from './sections/BankingSection';
import { TrainingSection } from './sections/TrainingSection';
import { CarrierSelectionSection } from './sections/CarrierSelectionSection';
import { SignatureSection } from './sections/SignatureSection';
import { SectionNav } from './SectionNav';
import { SectionAcknowledgment } from './SectionAcknowledgment';
import { ValidationBanner } from './ValidationBanner';

export interface SectionStatus {
  id: string;
  name: string;
  acknowledged: boolean;
  acknowledgedAt: string | null;
  hasErrors: boolean;
}

const SECTIONS = [
  { id: 'initials', name: 'Get Started', requiresAcknowledgment: false },
  { id: 'personal', name: 'Personal Information', requiresAcknowledgment: true },
  { id: 'address', name: 'Addresses', requiresAcknowledgment: true },
  { id: 'licensing', name: 'Licensing & Identification', requiresAcknowledgment: true },
  { id: 'legal', name: 'Background Questions', requiresAcknowledgment: true },
  { id: 'banking', name: 'Banking & Direct Deposit', requiresAcknowledgment: true },
  { id: 'training', name: 'Training & Certifications', requiresAcknowledgment: true },
  { id: 'carriers', name: 'Carrier Selection', requiresAcknowledgment: true },
  { id: 'signature', name: 'Electronic Signature', requiresAcknowledgment: false },
];

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
    carriers,
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
  const [isFillingTestData, setIsFillingTestData] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

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
    const element = sectionRefs.current[sectionId];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

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

  // Fill form with test data for quick testing
  const fillTestData = useCallback(async () => {
    if (!application || !carriers.length) return;
    
    setIsFillingTestData(true);
    try {
      // Helper for random boolean
      const randomBool = () => Math.random() > 0.5;
      
      // Random selections for checkboxes/radios
      const randomGender = randomBool() ? 'Male' : 'Female';
      const randomMailingSame = randomBool();
      const randomUpsSame = randomBool();
      const randomCommissionAdvancing = randomBool();
      const randomLtcCert = randomBool();
      const randomCeRequired = randomBool();
      const randomEoNotCovered = randomBool();
      const randomFinra = randomBool();
      const randomCorporation = randomBool();
      const randomMarketingConsent = randomBool();
      
      // Random contact method selection (at least 1)
      const allContactMethods = ['email', 'mobile', 'business', 'home', 'fax'];
      const randomContactMethods = allContactMethods.filter(() => randomBool());
      if (randomContactMethods.length === 0) randomContactMethods.push('email'); // Ensure at least one
      
      const testAddress: Address = {
        street: '123 Test Street',
        city: 'Louisville',
        state: 'KY',
        zip: '40202',
        county: 'Jefferson',
      };
      
      const altAddress: Address = {
        street: '456 Different Ave',
        city: 'Lexington',
        state: 'KY',
        zip: '40507',
        county: 'Fayette',
      };

      // Generate all legal questions with random "Yes"/"No" answers
      const legalQuestionsData: Record<string, { answer: boolean; explanation?: string }> = {};
      LEGAL_QUESTIONS.forEach(q => {
        const answer = randomBool();
        legalQuestionsData[q.id] = { 
          answer,
          explanation: answer ? `Test explanation for question ${q.id}` : undefined
        };
      });

      // Pick random 1-4 carriers for testing
      const numCarriers = Math.floor(Math.random() * 4) + 1;
      const shuffledCarriers = [...carriers].sort(() => Math.random() - 0.5);
      const selectedCarriers = shuffledCarriers.slice(0, numCarriers).map(c => ({
        carrier_id: c.id,
        carrier_name: c.name,
        non_resident_states: randomBool() ? ['TN', 'IN'] : [],
      }));

      // Generate section acknowledgments
      const now = new Date().toISOString();
      const sectionAcks: Record<string, { acknowledged: boolean; acknowledgedAt: string | null; initials?: string }> = {};
      SECTIONS.filter(s => s.requiresAcknowledgment).forEach(section => {
        sectionAcks[section.id] = {
          acknowledged: true,
          acknowledgedAt: now,
          initials: 'JT',
        };
      });

      // Generate test images
      const initialsImage = generateTestInitialsImage('JT');
      const signatureImage = generateTestSignatureImage('John Tyler');
      const bgSignatureImage = generateTestSignatureImage('John Tyler');

      // Update all fields at once - comprehensive test data for all mapped PDF fields
      const updates = {
        // Personal Information
        full_legal_name: 'John Tyler',
        gender: randomGender,
        birth_date: '1985-06-15',
        birth_city: 'Louisville',
        birth_state: 'KY',
        
        // Contact Information
        email_address: 'john.tyler@test.com',
        phone_mobile: '(502) 555-1234',
        phone_business: '(502) 555-5678',
        phone_home: '(502) 555-9999',
        fax: '(502) 555-0000',
        preferred_contact_methods: randomContactMethods,
        
        // Addresses (use different address if "same as home" is false)
        home_address: testAddress,
        mailing_address_same_as_home: randomMailingSame,
        mailing_address: randomMailingSame ? testAddress : altAddress,
        ups_address_same_as_home: randomUpsSame,
        ups_address: randomUpsSame ? testAddress : altAddress,
        
        // Licensing & Identification
        npn_number: '12345678',
        insurance_license_number: 'KY123456',
        tax_id: '123-45-6789',
        agency_name: randomCorporation ? 'Test Agency LLC' : '',
        agency_tax_id: randomCorporation ? '98-7654321' : '',
        resident_license_number: 'KY123456',
        resident_state: 'KY',
        drivers_license_number: 'T123456789',
        drivers_license_state: 'KY',
        
        // Legal Questions (randomly answered)
        legal_questions: legalQuestionsData,
        
        // Banking & Direct Deposit
        bank_routing_number: '123456789',
        bank_account_number: '987654321',
        bank_branch_name: 'First National Bank - Louisville Branch',
        beneficiary_name: 'Jane Tyler',
        beneficiary_relationship: 'Spouse',
        beneficiary_birth_date: '1987-03-20',
        beneficiary_drivers_license_number: 'T987654321',
        beneficiary_drivers_license_state: 'KY',
        requesting_commission_advancing: randomCommissionAdvancing,
        
        // Training & Certifications
        aml_training_provider: 'AHIP',
        aml_completion_date: '2024-10-15',
        has_ltc_certification: randomLtcCert,
        state_requires_ce: randomCeRequired,
        
        // E&O Insurance (only fill if not "not yet covered")
        eo_not_yet_covered: randomEoNotCovered,
        eo_provider: randomEoNotCovered ? '' : 'NAPA',
        eo_policy_number: randomEoNotCovered ? '' : 'EO-2024-12345',
        eo_expiration_date: randomEoNotCovered ? '' : '2025-12-31',
        
        // FINRA Registration
        is_finra_registered: randomFinra,
        finra_broker_dealer_name: randomFinra ? 'Test Broker Dealer Inc' : '',
        finra_crd_number: randomFinra ? 'CRD123456' : '',
        
        // Carrier Selection
        selected_carriers: selectedCarriers,
        is_corporation: randomCorporation,
        
        // Signatures & Acknowledgments
        signature_initials: 'JT',
        signature_name: 'John Tyler',
        signature_date: now,
        section_acknowledgments: sectionAcks,
        
        // Agreements (Marketing Consent)
        agreements: {
          marketing_consent: randomMarketingConsent,
          terms_accepted: true,
          privacy_accepted: true,
        },
        
        // Uploaded Documents (test signatures)
        uploaded_documents: {
          initials_image: initialsImage,
          signature_image: signatureImage,
          background_signature_image: bgSignatureImage,
        },
      };

      // Apply each update
      for (const [key, value] of Object.entries(updates)) {
        updateField(key as keyof typeof updates, value as any);
      }

      // Update local section statuses
      setSectionStatuses(prev => {
        const updated = { ...prev };
        SECTIONS.filter(s => s.requiresAcknowledgment).forEach(section => {
          updated[section.id] = {
            ...updated[section.id],
            acknowledged: true,
            acknowledgedAt: now,
          };
        });
        return updated;
      });

      // Log random selections for easy verification
      console.log('🎲 Random Test Data Selections:', {
        gender: randomGender,
        mailingSameAsHome: randomMailingSame,
        upsSameAsHome: randomUpsSame,
        commissionAdvancing: randomCommissionAdvancing,
        ltcCertification: randomLtcCert,
        ceRequired: randomCeRequired,
        eoNotYetCovered: randomEoNotCovered,
        finraRegistered: randomFinra,
        isCorporation: randomCorporation,
        marketingConsent: randomMarketingConsent,
        contactMethods: randomContactMethods,
        carriersSelected: selectedCarriers.length,
        legalYesAnswers: Object.values(legalQuestionsData).filter(q => q.answer).length,
      });

      toast.success(`Test data filled! Gender: ${randomGender}, Corp: ${randomCorporation ? 'Yes' : 'No'}, FINRA: ${randomFinra ? 'Yes' : 'No'}`);
    } catch (error) {
      console.error('Error filling test data:', error);
      toast.error('Failed to fill test data');
    } finally {
      setIsFillingTestData(false);
    }
  }, [application, carriers, updateField]);

  const handleSubmit = async () => {
    // Ensure signature date is set before validation
    if (!application?.signature_date) {
      await updateField('signature_date', new Date().toISOString());
    }
    
    // Run validation
    const result = validateForm(application!, sectionStatuses, carriers);
    
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
      const success = await submitApplication();
      if (success) {
        // PDF generation handled by edge function
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(0deg, #F3F0EA 0%, #FAFAFA 100%)' }}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground/70">Loading your application...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(0deg, #F3F0EA 0%, #FAFAFA 100%)' }}>
        <p className="text-muted-foreground">Unable to load application</p>
      </div>
    );
  }

  // Show submitted state (pending review)
  if (application.status === 'submitted') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(0deg, #F3F0EA 0%, #FAFAFA 100%)' }}>
        <Card 
          className="max-w-lg w-full text-center rounded-[28px] border-0"
          style={{ 
            background: 'linear-gradient(180deg, #FFFFFF 0%, #FEFEFE 100%)',
            boxShadow: '0px 1px 0px rgba(255, 255, 255, 0.8) inset, 0px 20px 60px rgba(0, 0, 0, 0.08), 0px 0px 100px rgba(163, 133, 41, 0.03)'
          }}
        >
          <div className="space-y-6 p-10">
            <div className="relative pb-6">
              <img src={tylerLogo} alt="Tyler Insurance Group" className="h-14 mx-auto" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-border/30 to-transparent" />
            </div>
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center">
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="text-2xl font-serif" style={{ letterSpacing: '0.025em' }}>Contracting Under Review</h2>
            <p className="text-muted-foreground/70 text-[15px] leading-relaxed">
              Your contracting documents have been submitted and are being reviewed. You'll receive an email once approved.
            </p>
            <Button 
              variant="outline" 
              onClick={handleLogout} 
              className="gap-2 h-12 px-6 border-foreground/12 hover:bg-secondary/30 rounded-2xl"
            >
              <LogOut className="h-4 w-4" />
              Log Out
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const initialsEntered = !!application.signature_initials && !!(application.uploaded_documents as Record<string, string>)?.initials_image;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(0deg, #F3F0EA 0%, #FAFAFA 100%)' }}>
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 border-b border-border/20 bg-white/95 backdrop-blur-md">
        <div className="container max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <img src={tylerLogo} alt="Tyler Insurance Group" className="h-8" />
          
          {/* Save indicator */}
          <div className="flex items-center gap-4">
            <div 
              className={`flex items-center gap-1.5 text-xs transition-all duration-300 ${
                saving 
                  ? 'opacity-60 text-muted-foreground/50' 
                  : showSaved 
                    ? 'opacity-100 text-primary/70' 
                    : 'opacity-0'
              }`}
            >
              {saving ? (
                <>
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" />
                  <span>Saving</span>
                </>
              ) : showSaved ? (
                <>
                  <Check className="h-3 w-3" />
                  <span>Saved</span>
                </>
              ) : null}
            </div>
            
            {/* Dev: Fill Test Data button */}
            <Button
              variant="outline"
              size="sm"
              onClick={fillTestData}
              disabled={isFillingTestData}
              className="gap-1.5 text-xs border-dashed border-amber-500/50 text-amber-700 hover:bg-amber-50"
            >
              {isFillingTestData ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <FlaskConical className="h-3 w-3" />
              )}
              Fill Test Data
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout} 
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-3.5 w-3.5" />
              Log Out
            </Button>
          </div>
        </div>
      </header>

      {/* Section Navigation */}
      <SectionNav 
        sections={SECTIONS}
        sectionStatuses={sectionStatuses}
        initialsEntered={initialsEntered}
        onSectionClick={scrollToSection}
      />

      {/* Validation Banner - shows only after submit attempt with errors */}
      <ValidationBanner 
        show={validationState.hasValidated && !validationState.isFormValid}
        sectionErrors={validationState.sectionErrors}
        onSectionClick={scrollToSection}
      />

      {/* Main Form Content */}
      <main className="flex-1 container max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Section 1: Get Started / Initials */}
          <div 
            ref={el => sectionRefs.current['initials'] = el} 
            id="section-initials"
            className="scroll-mt-32"
          >
            <InitialsEntrySection
              fullName={profile?.full_name || application.full_legal_name}
              initials={application.signature_initials}
              initialsImage={(application.uploaded_documents as Record<string, string>)?.initials_image}
              onInitialsChange={(initials) => updateField('signature_initials', initials)}
              onInitialsImageChange={(image) => {
                const docs = (application.uploaded_documents || {}) as Record<string, string>;
                if (image) {
                  updateField('uploaded_documents', { ...docs, initials_image: image });
                } else {
                  const { initials_image, ...rest } = docs;
                  updateField('uploaded_documents', rest);
                }
              }}
              isLocked={initialsEntered && Object.values(sectionStatuses).some(s => s.acknowledged)}
            />
          </div>

          {/* Section 2: Personal Information */}
          <div 
            ref={el => sectionRefs.current['personal'] = el} 
            id="section-personal"
            className="scroll-mt-32"
          >
            <PersonalInfoSection
              application={application}
              onUpdate={updateField}
              disabled={!initialsEntered}
              fieldErrors={validationState.fieldErrors}
              showValidation={validationState.hasValidated && !validationState.isFormValid}
              onClearError={clearFieldError}
            />
            
            {/* Marketing Consent - goes right after personal info */}
            <div className="mt-4">
              <MarketingConsentSection
                application={application}
                onUpdate={updateField}
                disabled={!initialsEntered}
              />
            </div>
            
            <SectionAcknowledgment
              sectionId="personal"
              sectionName="Personal Information"
              initials={application.signature_initials}
              status={sectionStatuses['personal']}
              onAcknowledge={() => acknowledgeSection('personal')}
              disabled={!initialsEntered}
              hasValidationError={validationState.hasValidated && validationState.sectionErrors['personal']?.needsAcknowledgment}
            />
          </div>

          {/* Section 3: Addresses */}
          <div 
            ref={el => sectionRefs.current['address'] = el} 
            id="section-address"
            className="scroll-mt-32"
          >
            <AddressSection
              application={application}
              onUpdate={updateField}
              disabled={!initialsEntered}
              fieldErrors={validationState.fieldErrors}
              showValidation={validationState.hasValidated && !validationState.isFormValid}
              onClearError={clearFieldError}
            />
            <SectionAcknowledgment
              sectionId="address"
              sectionName="Addresses"
              initials={application.signature_initials}
              status={sectionStatuses['address']}
              onAcknowledge={() => acknowledgeSection('address')}
              disabled={!initialsEntered}
              hasValidationError={validationState.hasValidated && validationState.sectionErrors['address']?.needsAcknowledgment}
            />
          </div>

          {/* Section 4: Licensing */}
          <div 
            ref={el => sectionRefs.current['licensing'] = el} 
            id="section-licensing"
            className="scroll-mt-32"
          >
            <LicensingSection
              application={application}
              onUpdate={updateField}
              onUpload={uploadDocument}
              onRemove={deleteDocument}
              disabled={!initialsEntered}
              fieldErrors={validationState.fieldErrors}
              showValidation={validationState.hasValidated && !validationState.isFormValid}
              onClearError={clearFieldError}
            />
            <SectionAcknowledgment
              sectionId="licensing"
              sectionName="Licensing & Identification"
              initials={application.signature_initials}
              status={sectionStatuses['licensing']}
              onAcknowledge={() => acknowledgeSection('licensing')}
              disabled={!initialsEntered}
              hasValidationError={validationState.hasValidated && validationState.sectionErrors['licensing']?.needsAcknowledgment}
            />
          </div>

          {/* Section 5: Legal Questions */}
          <div 
            ref={el => sectionRefs.current['legal'] = el} 
            id="section-legal"
            className="scroll-mt-32"
          >
            <LegalQuestionsSection
              application={application}
              onUpdate={updateField}
              onUpload={uploadDocument}
              onRemove={deleteDocument}
              disabled={!initialsEntered}
            />
            
            {/* Background Questions Signature - required after legal questions */}
            <BackgroundSignatureSection
              application={application}
              onUpdate={updateField}
              disabled={!initialsEntered}
              fieldErrors={validationState.fieldErrors}
              showValidation={validationState.hasValidated && !validationState.isFormValid}
              onClearError={clearFieldError}
            />
            
            <SectionAcknowledgment
              sectionId="legal"
              sectionName="Background Questions"
              initials={application.signature_initials}
              status={sectionStatuses['legal']}
              onAcknowledge={() => acknowledgeSection('legal')}
              disabled={!initialsEntered}
              hasValidationError={validationState.hasValidated && validationState.sectionErrors['legal']?.needsAcknowledgment}
            />
          </div>

          {/* Section 6: Banking */}
          <div 
            ref={el => sectionRefs.current['banking'] = el} 
            id="section-banking"
            className="scroll-mt-32"
          >
            <BankingSection
              application={application}
              onUpdate={updateField}
              onUpload={uploadDocument}
              onRemove={deleteDocument}
              disabled={!initialsEntered}
              fieldErrors={validationState.fieldErrors}
              showValidation={validationState.hasValidated && !validationState.isFormValid}
              onClearError={clearFieldError}
            />
            <SectionAcknowledgment
              sectionId="banking"
              sectionName="Banking & Direct Deposit"
              initials={application.signature_initials}
              status={sectionStatuses['banking']}
              onAcknowledge={() => acknowledgeSection('banking')}
              disabled={!initialsEntered}
              hasValidationError={validationState.hasValidated && validationState.sectionErrors['banking']?.needsAcknowledgment}
            />
          </div>

          {/* Section 7: Training */}
          <div 
            ref={el => sectionRefs.current['training'] = el} 
            id="section-training"
            className="scroll-mt-32"
          >
            <TrainingSection
              application={application}
              onUpdate={updateField}
              onUpload={uploadDocument}
              onRemove={deleteDocument}
              disabled={!initialsEntered}
              fieldErrors={validationState.fieldErrors}
              showValidation={validationState.hasValidated && !validationState.isFormValid}
              onClearError={clearFieldError}
            />
            <SectionAcknowledgment
              sectionId="training"
              sectionName="Training & Certifications"
              initials={application.signature_initials}
              status={sectionStatuses['training']}
              onAcknowledge={() => acknowledgeSection('training')}
              disabled={!initialsEntered}
              hasValidationError={validationState.hasValidated && validationState.sectionErrors['training']?.needsAcknowledgment}
            />
          </div>

          {/* Section 8: Carrier Selection */}
          <div 
            ref={el => sectionRefs.current['carriers'] = el} 
            id="section-carriers"
            className="scroll-mt-32"
          >
            <CarrierSelectionSection
              application={application}
              carriers={carriers}
              onUpdate={updateField}
              onUpload={uploadDocument}
              disabled={!initialsEntered}
              fieldErrors={validationState.fieldErrors}
              showValidation={validationState.hasValidated && !validationState.isFormValid}
              onClearError={clearFieldError}
            />
            <SectionAcknowledgment
              sectionId="carriers"
              sectionName="Carrier Selection"
              initials={application.signature_initials}
              status={sectionStatuses['carriers']}
              onAcknowledge={() => acknowledgeSection('carriers')}
              disabled={!initialsEntered}
              hasValidationError={validationState.hasValidated && validationState.sectionErrors['carriers']?.needsAcknowledgment}
            />
          </div>

          {/* Section 9: Electronic Signature */}
          <div 
            ref={el => sectionRefs.current['signature'] = el} 
            id="section-signature"
            className="scroll-mt-32"
          >
            <SignatureSection
              application={application}
              sectionStatuses={sectionStatuses}
              onUpdate={updateField}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              disabled={!initialsEntered}
              fieldErrors={validationState.fieldErrors}
              sectionErrors={validationState.sectionErrors}
              showValidation={validationState.hasValidated && !validationState.isFormValid}
              onScrollToSection={scrollToSection}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
