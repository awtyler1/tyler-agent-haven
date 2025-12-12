import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Lock, FileText, Shield, Clock, PenLine, AlertCircle } from 'lucide-react';
import tylerLogo from '@/assets/tyler-logo.png';
import { InitialsPad } from '../InitialsPad';

interface InitialsEntrySectionProps {
  fullName: string | null;
  initials: string | null;
  initialsImage?: string | null;
  onInitialsChange: (initials: string) => void;
  onInitialsImageChange: (image: string | null) => void;
  isLocked: boolean;
}

export function InitialsEntrySection({ 
  fullName, 
  initials,
  initialsImage,
  onInitialsChange,
  onInitialsImageChange,
  isLocked 
}: InitialsEntrySectionProps) {
  const [isConfirmed, setIsConfirmed] = useState(!!initialsImage);
  const [localInitialsImage, setLocalInitialsImage] = useState<string | null>(initialsImage || null);

  // Check if initials are already confirmed (from saved state)
  useEffect(() => {
    if (initialsImage) {
      setIsConfirmed(true);
      setLocalInitialsImage(initialsImage);
    }
  }, [initialsImage]);

  const handleConfirmInitials = () => {
    if (localInitialsImage) {
      // Generate a placeholder text representation for the initials
      const initialsText = fullName 
        ? fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 3)
        : 'INI';
      onInitialsChange(initialsText);
      onInitialsImageChange(localInitialsImage);
      setIsConfirmed(true);
    }
  };

  const handleInitialsDrawn = (image: string | null) => {
    setLocalInitialsImage(image);
  };

  if (isConfirmed && initialsImage) {
    return (
      <Card 
        className="rounded-[28px] border-0 overflow-hidden"
        style={{ 
          background: 'linear-gradient(180deg, #FFFFFF 0%, #FEFEFE 100%)',
          boxShadow: '0px 1px 0px rgba(255, 255, 255, 0.8) inset, 0px 20px 60px rgba(0, 0, 0, 0.08), 0px 0px 100px rgba(163, 133, 41, 0.03)'
        }}
      >
        <CardHeader className="text-center pt-10 pb-6">
          <img src={tylerLogo} alt="Tyler Insurance Group" className="h-16 mx-auto mb-6" />
          <CardTitle className="text-2xl font-serif" style={{ letterSpacing: '0.025em' }}>
            Welcome{fullName ? `, ${fullName.split(' ')[0]}` : ''}
          </CardTitle>
          <p className="text-muted-foreground/70 text-sm mt-2">
            Complete the contracting form below to get started
          </p>
        </CardHeader>
        <CardContent className="pb-10 px-8">
          <div className="flex items-center justify-center gap-4 p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/30">
            <div className="w-12 h-12 rounded-xl bg-white border border-emerald-200/50 flex items-center justify-center overflow-hidden p-1">
              <img 
                src={initialsImage} 
                alt="Your initials" 
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                {isLocked ? (
                  <Lock className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Check className="h-5 w-5 text-emerald-600" />
                )}
                <p className="text-sm font-medium text-emerald-800">
                  Initials Confirmed
                </p>
              </div>
              <p className="text-xs text-emerald-700/70">
                Your initials will be used throughout this document
              </p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-xl bg-muted/20">
              <FileText className="h-5 w-5 mx-auto text-muted-foreground/60 mb-2" />
              <p className="text-xs text-muted-foreground/70">Single scrollable form</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-muted/20">
              <Shield className="h-5 w-5 mx-auto text-muted-foreground/60 mb-2" />
              <p className="text-xs text-muted-foreground/70">Auto-saved securely</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-muted/20">
              <Clock className="h-5 w-5 mx-auto text-muted-foreground/60 mb-2" />
              <p className="text-xs text-muted-foreground/70">~15 minutes to complete</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="rounded-[28px] border-0 overflow-hidden"
      style={{ 
        background: 'linear-gradient(180deg, #FFFFFF 0%, #FEFEFE 100%)',
        boxShadow: '0px 1px 0px rgba(255, 255, 255, 0.8) inset, 0px 20px 60px rgba(0, 0, 0, 0.08), 0px 0px 100px rgba(163, 133, 41, 0.03)'
      }}
    >
      <CardHeader className="text-center pt-10 pb-4">
        <img src={tylerLogo} alt="Tyler Insurance Group" className="h-16 mx-auto mb-6" />
        <CardTitle className="text-2xl font-serif" style={{ letterSpacing: '0.025em' }}>
          Digital Contracting
        </CardTitle>
        <p className="text-muted-foreground/70 text-sm mt-2 max-w-md mx-auto">
          Complete this form to contract with Tyler Insurance Group. 
          All information is securely saved and your progress is preserved.
        </p>
      </CardHeader>
      <CardContent className="pb-10 px-8">
        {/* Important Notice */}
        <div className="max-w-md mx-auto mb-6 p-4 rounded-xl bg-amber-50/50 border border-amber-200/30">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">First Step: Draw Your Initials</p>
              <p className="text-xs text-amber-700/70 mt-1">
                Your hand-drawn initials will be used to acknowledge each section of this contracting form, 
                similar to initialing a paper document.
              </p>
            </div>
          </div>
        </div>

        {/* Initials Drawing Pad */}
        <div className="max-w-md mx-auto">
          <InitialsPad
            value={localInitialsImage || undefined}
            onChange={handleInitialsDrawn}
          />
          
          {/* Confirm Button */}
          <div className="mt-6">
            <Button
              onClick={handleConfirmInitials}
              disabled={!localInitialsImage}
              className="w-full h-14 text-base font-medium rounded-2xl"
              size="lg"
            >
              {localInitialsImage ? (
                <>
                  <Check className="h-5 w-5 mr-2" />
                  Confirm Initials & Begin Form
                </>
              ) : (
                <>
                  <PenLine className="h-5 w-5 mr-2" />
                  Draw Your Initials Above
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border/10">
          <h3 className="text-sm font-medium text-center mb-4">What you'll need</h3>
          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/20">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-xs text-muted-foreground/70">Insurance License</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/20">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-xs text-muted-foreground/70">E&O Certificate</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/20">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-xs text-muted-foreground/70">Voided Check</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/20">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-xs text-muted-foreground/70">AML Certificate</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
