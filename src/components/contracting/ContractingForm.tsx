import { useState, useEffect, useRef, useCallback } from 'react';
import { useContractingApplication } from '@/hooks/useContractingApplication';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, LogOut, Check, Lock, AlertCircle, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import tylerLogo from '@/assets/tyler-logo.png';

// Section components
import { InitialsEntrySection } from './sections/InitialsEntrySection';
import { PersonalInfoSection } from './sections/PersonalInfoSection';
import { AddressSection } from './sections/AddressSection';
import { LicensingSection } from './sections/LicensingSection';
import { LegalQuestionsSection } from './sections/LegalQuestionsSection';
import { BankingSection } from './sections/BankingSection';
import { TrainingSection } from './sections/TrainingSection';
import { CarrierSelectionSection } from './sections/CarrierSelectionSection';
import { SignatureSection } from './sections/SignatureSection';
import { SectionNav } from './SectionNav';
import { SectionAcknowledgment } from './SectionAcknowledgment';

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

  const [showSaved, setShowSaved] = useState(false);
  const [sectionStatuses, setSectionStatuses] = useState<Record<string, SectionStatus>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleSubmit = async () => {
    // Validate all sections are acknowledged
    const unacknowledgedSections = SECTIONS.filter(
      s => s.requiresAcknowledgment && !sectionStatuses[s.id]?.acknowledged
    );

    if (unacknowledgedSections.length > 0) {
      toast.error(`Please acknowledge all sections before submitting`);
      scrollToSection(unacknowledgedSections[0].id);
      return;
    }

    // Validate required fields
    // TODO: Add comprehensive validation

    setIsSubmitting(true);
    try {
      const success = await submitApplication();
      if (success) {
        // PDF generation will be handled by edge function
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

  const initialsEntered = !!application.signature_initials;

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
              onInitialsChange={(initials) => updateField('signature_initials', initials)}
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
            />
            <SectionAcknowledgment
              sectionId="personal"
              sectionName="Personal Information"
              initials={application.signature_initials}
              status={sectionStatuses['personal']}
              onAcknowledge={() => acknowledgeSection('personal')}
              disabled={!initialsEntered}
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
            />
            <SectionAcknowledgment
              sectionId="address"
              sectionName="Addresses"
              initials={application.signature_initials}
              status={sectionStatuses['address']}
              onAcknowledge={() => acknowledgeSection('address')}
              disabled={!initialsEntered}
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
            />
            <SectionAcknowledgment
              sectionId="licensing"
              sectionName="Licensing & Identification"
              initials={application.signature_initials}
              status={sectionStatuses['licensing']}
              onAcknowledge={() => acknowledgeSection('licensing')}
              disabled={!initialsEntered}
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
            <SectionAcknowledgment
              sectionId="legal"
              sectionName="Background Questions"
              initials={application.signature_initials}
              status={sectionStatuses['legal']}
              onAcknowledge={() => acknowledgeSection('legal')}
              disabled={!initialsEntered}
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
            />
            <SectionAcknowledgment
              sectionId="banking"
              sectionName="Banking & Direct Deposit"
              initials={application.signature_initials}
              status={sectionStatuses['banking']}
              onAcknowledge={() => acknowledgeSection('banking')}
              disabled={!initialsEntered}
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
            />
            <SectionAcknowledgment
              sectionId="training"
              sectionName="Training & Certifications"
              initials={application.signature_initials}
              status={sectionStatuses['training']}
              onAcknowledge={() => acknowledgeSection('training')}
              disabled={!initialsEntered}
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
            />
            <SectionAcknowledgment
              sectionId="carriers"
              sectionName="Carrier Selection"
              initials={application.signature_initials}
              status={sectionStatuses['carriers']}
              onAcknowledge={() => acknowledgeSection('carriers')}
              disabled={!initialsEntered}
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
            />
          </div>
        </div>
      </main>
    </div>
  );
}
