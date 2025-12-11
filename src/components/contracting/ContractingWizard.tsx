import { Loader2, LogOut } from 'lucide-react';
import { useContractingApplication } from '@/hooks/useContractingApplication';
import { WizardProgress } from './WizardProgress';
import { WelcomeStep } from './steps/WelcomeStep';
import { PersonalInfoStep } from './steps/PersonalInfoStep';
import { LicensingStep } from './steps/LicensingStep';
import { LegalQuestionsStep } from './steps/LegalQuestionsStep';
import { BankingStep } from './steps/BankingStep';
import { TrainingStep } from './steps/TrainingStep';
import { CarrierSelectionStep } from './steps/CarrierSelectionStep';
import { AgreementsStep } from './steps/AgreementsStep';
import { ReviewStep } from './steps/ReviewStep';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';
import tylerLogo from '@/assets/tyler-logo.png';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useProfile } from '@/hooks/useProfile';

export function ContractingWizard() {
  const { profile } = useProfile();
  const {
    application,
    loading,
    saving,
    updateField,
    goToStep,
    completeStepAndNext,
    submitApplication,
    uploadDocument,
  } = useContractingApplication();

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

  // Show submitted state
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
          <CardHeader className="space-y-6 pt-12">
            <div className="relative pb-6">
              <img src={tylerLogo} alt="Tyler Insurance Group" className="h-14 mx-auto" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-border/30 to-transparent" />
            </div>
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center">
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
            <CardTitle className="text-2xl font-serif" style={{ letterSpacing: '0.025em' }}>Contracting Under Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pb-12 px-10">
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
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderStep = () => {
    const progressProps = {
      currentStep: application.current_step,
      completedSteps: application.completed_steps,
      onStepClick: goToStep,
    };

    switch (application.current_step) {
      case 1:
        return (
          <WelcomeStep
            fullName={profile?.full_name || application.full_legal_name}
            onContinue={() => completeStepAndNext(1)}
          />
        );
      case 2:
        return (
          <PersonalInfoStep
            application={application}
            onUpdate={updateField}
            onBack={() => goToStep(1)}
            onContinue={() => completeStepAndNext(2)}
            progressProps={progressProps}
          />
        );
      case 3:
        return (
          <LicensingStep
            application={application}
            onUpdate={updateField}
            onUpload={uploadDocument}
            onBack={() => goToStep(2)}
            onContinue={() => completeStepAndNext(3)}
            progressProps={progressProps}
          />
        );
      case 4:
        return (
          <LegalQuestionsStep
            application={application}
            onUpdate={updateField}
            onUpload={uploadDocument}
            onBack={() => goToStep(3)}
            onContinue={() => completeStepAndNext(4)}
            progressProps={progressProps}
          />
        );
      case 5:
        return (
          <BankingStep
            application={application}
            onUpdate={updateField}
            onUpload={uploadDocument}
            onBack={() => goToStep(4)}
            onContinue={() => completeStepAndNext(5)}
            progressProps={progressProps}
          />
        );
      case 6:
        return (
          <TrainingStep
            application={application}
            onUpdate={updateField}
            onUpload={uploadDocument}
            onBack={() => goToStep(5)}
            onContinue={() => completeStepAndNext(6)}
            progressProps={progressProps}
          />
        );
      case 7:
        return (
          <CarrierSelectionStep
            application={application}
            onUpdate={updateField}
            onUpload={uploadDocument}
            onBack={() => goToStep(6)}
            onContinue={() => completeStepAndNext(7)}
            progressProps={progressProps}
          />
        );
      case 8:
        return (
          <AgreementsStep
            application={application}
            onUpdate={updateField}
            onBack={() => goToStep(7)}
            onContinue={() => completeStepAndNext(8)}
            progressProps={progressProps}
          />
        );
      case 9:
        return (
          <ReviewStep
            application={application}
            onBack={() => goToStep(8)}
            onSubmit={submitApplication}
            progressProps={progressProps}
          />
        );
      default:
        return null;
    }
  };

  const isEarlyStep = application.current_step <= 2;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(0deg, #F3F0EA 0%, #FAFAFA 100%)' }}>
      {/* Header with logo and logout - subtle on early steps */}
      <div className={`border-b backdrop-blur-sm ${isEarlyStep ? 'border-transparent bg-transparent' : 'border-border/20 bg-white/60'}`}>
        <div className="container max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          {isEarlyStep ? (
            <div /> 
          ) : (
            <img src={tylerLogo} alt="Tyler Insurance Group" className="h-8" />
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout} 
            className={`gap-2 ${isEarlyStep ? 'text-muted-foreground/30 hover:text-muted-foreground/60 opacity-60' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <LogOut className="h-3.5 w-3.5" />
            {!isEarlyStep && 'Log Out'}
          </Button>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto py-2 px-4 flex flex-col flex-1">
        {/* Saving indicator - fixed height to prevent layout shift */}
        <div className="h-5 flex items-center justify-center">
          {saving && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving...
            </div>
          )}
        </div>

        {/* Current step - progress is now inside each step card */}
        <div className="flex-1">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}