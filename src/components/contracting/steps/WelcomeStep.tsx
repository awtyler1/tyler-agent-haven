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
  { icon: Shield, title: 'E&O Policy', hint: "We'll help if you need coverage" },
  { icon: CreditCard, title: 'Banking Details', hint: 'Voided check or direct deposit' },
  { icon: GraduationCap, title: 'AML Certificate', hint: "We'll guide you if needed" },
  { icon: GraduationCap, title: 'CE Certificate', hint: 'If required by your state' },
];

export function WelcomeStep({ fullName, onContinue }: WelcomeStepProps) {
  const firstName = fullName?.split(' ')[0] || 'there';

  return (
    <div className="max-w-xl mx-auto">
      <Card 
        className="border-0 rounded-[28px]"
        style={{ 
          background: 'linear-gradient(180deg, #FFFFFF 0%, #FEFEFE 100%)',
          boxShadow: '0px 1px 0px rgba(255, 255, 255, 0.8) inset, 0px 20px 60px rgba(0, 0, 0, 0.08), 0px 0px 100px rgba(163, 133, 41, 0.03)'
        }}
      >
        <CardContent className="p-8 space-y-5">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="relative pb-5">
              <img src={tylerLogo} alt="Tyler Insurance Group" className="h-11 mx-auto" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-px bg-gradient-to-r from-transparent via-border/30 to-transparent" />
            </div>
            <h1 className="text-[1.75rem] font-serif tracking-tight" style={{ letterSpacing: '0.02em' }}>
              Welcome, {firstName}
            </h1>
            <p className="text-sm text-muted-foreground/70 leading-relaxed">
              Complete your agent setup to activate your account and fulfill the requirements to contract with our carrier partners.
            </p>
          </div>

          {/* Time & Auto-save */}
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground/80">~15 min</span>
            </div>
            <div className="h-4 w-px bg-border/40" />
            <div className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-green-600" />
              <span className="font-medium text-foreground/80">Auto-saved</span>
            </div>
          </div>

          {/* What You'll Need - Compact Grid */}
          <div className="space-y-3">
            <p className="text-[10px] font-medium text-center text-muted-foreground/60 uppercase tracking-widest">
              What You'll Need
            </p>
            <div className="grid grid-cols-2 gap-2">
              {requirements.map((req, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/30 border border-border/20"
                >
                  <req.icon className="h-4 w-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-xs text-foreground/80">{req.title}</p>
                    <p className="text-[10px] text-muted-foreground/60 truncate">{req.hint}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reassurance */}
          <p className="text-xs text-center text-muted-foreground/60 leading-relaxed">
            You'll be guided step by step. You can pause anytime and return without losing progress.
          </p>

          {/* CTA */}
          <div className="pt-2">
            <Button 
              onClick={onContinue} 
              className="w-full h-[52px] font-semibold text-[15px] gap-1.5 rounded-2xl transition-all duration-200 hover:-translate-y-0.5"
              style={{ 
                background: 'linear-gradient(180deg, hsl(43, 55%, 42%) 0%, hsl(43, 58%, 36%) 100%)',
                boxShadow: '0px 1px 0px rgba(255,255,255,0.15) inset, 0px 4px 12px rgba(163, 133, 41, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(180deg, hsl(43, 58%, 38%) 0%, hsl(43, 62%, 30%) 100%)';
                e.currentTarget.style.boxShadow = '0px 1px 0px rgba(255,255,255,0.15) inset, 0px 8px 20px rgba(163, 133, 41, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(180deg, hsl(43, 55%, 42%) 0%, hsl(43, 58%, 36%) 100%)';
                e.currentTarget.style.boxShadow = '0px 1px 0px rgba(255,255,255,0.15) inset, 0px 4px 12px rgba(163, 133, 41, 0.3)';
              }}
            >
              Begin Agent Setup
              <ChevronRight className="h-4 w-4" />
            </Button>
            <p className="text-[10px] text-center text-muted-foreground/50 mt-3">
              Step 1 of 9 · Your information is encrypted and securely stored
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}