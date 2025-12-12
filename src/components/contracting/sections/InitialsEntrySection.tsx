import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Check, Lock, FileText, Shield, Clock } from 'lucide-react';
import tylerLogo from '@/assets/tyler-logo.png';

interface InitialsEntrySectionProps {
  fullName: string | null;
  initials: string | null;
  onInitialsChange: (initials: string) => void;
  isLocked: boolean;
}

export function InitialsEntrySection({ 
  fullName, 
  initials, 
  onInitialsChange,
  isLocked 
}: InitialsEntrySectionProps) {
  const [localInitials, setLocalInitials] = useState(initials || '');
  const [isConfirmed, setIsConfirmed] = useState(!!initials);

  const handleConfirmInitials = () => {
    if (localInitials.length >= 2) {
      onInitialsChange(localInitials.toUpperCase());
      setIsConfirmed(true);
    }
  };

  if (isConfirmed && initials) {
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
          <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              {isLocked ? (
                <Lock className="h-4 w-4 text-primary" />
              ) : (
                <Check className="h-5 w-5 text-primary" />
              )}
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-foreground/80">
                Initials Confirmed
              </p>
              <p className="text-xs text-muted-foreground/60">
                Your initials <span className="font-semibold">{initials}</span> will be used throughout this document
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
      <CardHeader className="text-center pt-10 pb-6">
        <img src={tylerLogo} alt="Tyler Insurance Group" className="h-16 mx-auto mb-6" />
        <CardTitle className="text-2xl font-serif" style={{ letterSpacing: '0.025em' }}>
          Digital Contracting
        </CardTitle>
        <p className="text-muted-foreground/70 text-sm mt-2 max-w-md mx-auto">
          Complete this form to contract with Tyler Insurance Group. All information is securely saved and your progress is preserved.
        </p>
      </CardHeader>
      <CardContent className="pb-10 px-8">
        {/* Initials Entry */}
        <div className="max-w-sm mx-auto">
          <div className="space-y-3">
            <Label htmlFor="initials" className="text-sm font-medium">
              Enter your initials to begin
            </Label>
            <p className="text-xs text-muted-foreground/60">
              Your initials will be used to acknowledge each section of this form
            </p>
            <div className="flex gap-3">
              <Input
                id="initials"
                value={localInitials}
                onChange={(e) => setLocalInitials(e.target.value.toUpperCase().slice(0, 4))}
                placeholder="e.g. JD"
                className="text-center text-lg font-semibold tracking-widest uppercase h-12 rounded-xl"
                maxLength={4}
              />
              <Button
                onClick={handleConfirmInitials}
                disabled={localInitials.length < 2}
                className="h-12 px-6 rounded-xl bg-primary hover:bg-primary/90"
              >
                Confirm
              </Button>
            </div>
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
