import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Shield, CreditCard, FileCheck, IdCard, GraduationCap, ChevronRight } from 'lucide-react';
import tylerLogo from '@/assets/tyler-logo.png';

interface WelcomeStepProps {
  fullName: string | null;
  onContinue: () => void;
}

const requirements = [
  {
    icon: IdCard,
    title: 'Government-Issued ID',
    description: "Driver's license or passport",
  },
  {
    icon: FileCheck,
    title: 'Insurance License',
    description: 'Your current state license information',
  },
  {
    icon: GraduationCap,
    title: 'AML Training Certificate',
    description: "We'll guide you if you need to complete this",
  },
  {
    icon: CreditCard,
    title: 'Banking Information',
    description: 'Voided check or direct deposit details',
  },
];

export function WelcomeStep({ fullName, onContinue }: WelcomeStepProps) {
  const firstName = fullName?.split(' ')[0] || 'there';

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="border-0 shadow-lg">
        <CardContent className="p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            <img src={tylerLogo} alt="Tyler Insurance Group" className="h-10 mx-auto" />
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                Welcome, {firstName}
              </h1>
              <p className="text-muted-foreground max-w-md mx-auto">
                Complete your agent setup to activate your account and begin selling with our carrier partners.
              </p>
            </div>
          </div>

          {/* Time & Progress Reassurance */}
          <div className="flex items-center justify-center gap-6 py-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">15 minutes</p>
                <p className="text-xs text-muted-foreground">to complete</p>
              </div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="flex items-center gap-2 text-sm">
              <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                <Shield className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Auto-saved</p>
                <p className="text-xs text-muted-foreground">resume anytime</p>
              </div>
            </div>
          </div>

          {/* What You'll Need */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-center text-muted-foreground uppercase tracking-wide">
              What You'll Need
            </h2>
            <div className="grid gap-2">
              {requirements.map((req, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors"
                >
                  <div className="h-9 w-9 rounded-full bg-background flex items-center justify-center shrink-0 border">
                    <req.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{req.title}</p>
                    <p className="text-xs text-muted-foreground">{req.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="text-center space-y-2 pt-2">
            <div className="flex items-center justify-center gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((step) => (
                <div
                  key={step}
                  className={`h-1.5 rounded-full transition-all ${
                    step === 1 ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/20'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Step 1 of 9</p>
          </div>

          {/* CTA */}
          <div className="pt-2">
            <Button onClick={onContinue} className="w-full h-11 text-base font-medium gap-2">
              Begin Agent Setup
              <ChevronRight className="h-4 w-4" />
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-3">
              Your information is encrypted and securely stored
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
