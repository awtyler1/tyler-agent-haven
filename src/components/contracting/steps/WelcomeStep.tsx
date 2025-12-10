import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Shield, CreditCard, FileCheck, IdCard, GraduationCap, ChevronRight } from 'lucide-react';
import tylerLogo from '@/assets/tyler-logo.png';

interface WelcomeStepProps {
  fullName: string | null;
  onContinue: () => void;
}

const requirements = [
  { icon: IdCard, title: 'Government ID', hint: "Driver's license or passport" },
  { icon: FileCheck, title: 'Insurance License', hint: 'Current state license info' },
  { icon: GraduationCap, title: 'AML Certificate', hint: "We'll guide you if needed" },
  { icon: CreditCard, title: 'Banking Details', hint: 'Voided check or direct deposit' },
];

export function WelcomeStep({ fullName, onContinue }: WelcomeStepProps) {
  const firstName = fullName?.split(' ')[0] || 'there';

  return (
    <div className="max-w-xl mx-auto">
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6 space-y-4">
          {/* Header */}
          <div className="text-center space-y-2">
            <img src={tylerLogo} alt="Tyler Insurance Group" className="h-9 mx-auto" />
            <h1 className="text-xl font-semibold tracking-tight">
              Welcome, {firstName}
            </h1>
            <p className="text-sm text-muted-foreground">
              Complete your setup to activate your account and begin selling with our carrier partners.
            </p>
          </div>

          {/* Time & Auto-save */}
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-primary" />
              <span className="font-medium">~15 min</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-green-600" />
              <span className="font-medium">Auto-saved</span>
            </div>
          </div>

          {/* What You'll Need - Compact Grid */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-center text-muted-foreground uppercase tracking-wide">
              What You'll Need
            </p>
            <div className="grid grid-cols-2 gap-2">
              {requirements.map((req, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/40"
                >
                  <req.icon className="h-4 w-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-xs">{req.title}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{req.hint}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Progress */}
          <div className="flex items-center justify-center gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((step) => (
              <div
                key={step}
                className={`h-1 rounded-full ${
                  step === 1 ? 'w-5 bg-primary' : 'w-1 bg-muted-foreground/20'
                }`}
              />
            ))}
            <span className="text-[10px] text-muted-foreground ml-2">1 of 9</span>
          </div>

          {/* CTA */}
          <Button onClick={onContinue} className="w-full h-10 font-medium gap-1">
            Begin Agent Setup
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <p className="text-[10px] text-center text-muted-foreground">
            Your information is encrypted and securely stored
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
