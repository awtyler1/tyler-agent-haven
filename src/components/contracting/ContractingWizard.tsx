import { useState, useEffect } from 'react';
import { Loader2, LogOut } from 'lucide-react';
import { useContractingApplication } from '@/hooks/useContractingApplication';
import { WizardProgress } from './WizardProgress';
import { WelcomeStep } from './steps/WelcomeStep';
import { PersonalInfoStep } from './steps/PersonalInfoStep';
import { AddressesStep } from './steps/AddressesStep';
import { LicensingStep } from './steps/LicensingStep';
import { LegalQuestionsStep } from './steps/LegalQuestionsStep';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';
import tylerLogo from '@/assets/tyler-logo.png';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function ContractingWizard() {
  const {
    application,
    loading,
    saving,
    updateField,
    goToStep,
    completeStepAndNext,
    uploadDocument,
  } = useContractingApplication();

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayedStep, setDisplayedStep] = useState(1);
  const [transitionDirection, setTransitionDirection] = useState<'forward' | 'backward'>('forward');

  // Handle step transitions with animation
  useEffect(() => {
    if (application && application.current_step !== displayedStep && !isTransitioning) {
      setTransitionDirection(application.current_step > displayedStep ? 'forward' : 'backward');
      setIsTransitioning(true);
      
      // Wait for exit animation, then switch step
      const timer = setTimeout(() => {
        setDisplayedStep(application.current_step);
        // Allow enter animation to play
        setTimeout(() => setIsTransitioning(false), 50);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [application?.current_step, displayedStep, isTransitioning]);

  // Initialize displayedStep when application loads
  useEffect(() => {
    if (application && displayedStep !== application.current_step && !isTransitioning) {
      setDisplayedStep(application.current_step);
    }
  }, [application?.id]);

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your application...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <p>Unable to load application</p>
      </div>
    );
  }

  // Show submitted state
  if (application.status === 'submitted') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="max-w-lg w-full text-center">
          <CardHeader className="space-y-4">
            <img src={tylerLogo} alt="Tyler Insurance Group" className="h-12 mx-auto" />
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
            <CardTitle className="text-2xl">Contracting Under Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Your contracting documents have been submitted and are being reviewed. You'll receive an email once approved.
            </p>
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Log Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderStep = () => {
    switch (displayedStep) {
      case 1:
        return (
          <WelcomeStep
            fullName={application.full_legal_name}
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
          />
        );
      case 3:
        return (
          <AddressesStep
            application={application}
            onUpdate={updateField}
            onBack={() => goToStep(2)}
            onContinue={() => completeStepAndNext(3)}
          />
        );
      case 4:
        return (
          <LicensingStep
            application={application}
            onUpdate={updateField}
            onUpload={uploadDocument}
            onBack={() => goToStep(3)}
            onContinue={() => completeStepAndNext(4)}
          />
        );
      case 5:
        return (
          <LegalQuestionsStep
            application={application}
            onUpdate={updateField}
            onUpload={uploadDocument}
            onBack={() => goToStep(4)}
            onContinue={() => completeStepAndNext(5)}
          />
        );
      default:
        return (
          <Card className="max-w-lg mx-auto text-center">
            <CardHeader>
              <CardTitle>Step {displayedStep} Coming Soon</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Steps 6-10 (Banking, Training, Carriers, Signature, Review) will be built next.
              </p>
              <button onClick={() => goToStep(displayedStep - 1)} className="text-primary underline">
                Go back
              </button>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex flex-col">
      {/* Header with logo and logout */}
      <div className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <img src={tylerLogo} alt="Tyler Insurance Group" className="h-8" />
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4" />
            Log Out
          </Button>
        </div>
      </div>

      <div className="container max-w-5xl mx-auto py-4 px-4 flex flex-col flex-1">
        {/* Progress bar */}
        <WizardProgress
          currentStep={application.current_step}
          completedSteps={application.completed_steps}
          onStepClick={goToStep}
        />

        {/* Saving indicator */}
        {saving && (
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving...
          </div>
        )}

        {/* Current step with Apple-style transitions */}
        <div className="mt-4 flex-1 relative overflow-hidden">
          <div
            className={cn(
              "transition-all duration-300 ease-out",
              isTransitioning && transitionDirection === 'forward' && "opacity-0 translate-x-8",
              isTransitioning && transitionDirection === 'backward' && "opacity-0 -translate-x-8",
              !isTransitioning && "opacity-100 translate-x-0"
            )}
          >
            {renderStep()}
          </div>
        </div>
      </div>
    </div>
  );
}
