import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ContractingApplication } from '@/types/contracting';
import { Lock, Mail } from 'lucide-react';

interface MarketingConsentSectionProps {
  application: ContractingApplication;
  onUpdate: <K extends keyof ContractingApplication>(field: K, value: ContractingApplication[K]) => void;
  disabled?: boolean;
}

export function MarketingConsentSection({ application, onUpdate, disabled }: MarketingConsentSectionProps) {
  const agreements = application.agreements || {};
  const marketingConsent = agreements.marketing_consent || false;

  const toggleConsent = () => {
    onUpdate('agreements', { 
      ...agreements, 
      marketing_consent: !marketingConsent 
    });
  };

  return (
    <Card 
      className="rounded-[28px] border-0 overflow-hidden"
      style={{ 
        background: 'linear-gradient(180deg, #FFFFFF 0%, #FEFEFE 100%)',
        boxShadow: '0px 1px 0px rgba(255, 255, 255, 0.8) inset, 0px 20px 60px rgba(0, 0, 0, 0.06)'
      }}
    >
      <CardContent className="p-6">
        {disabled && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 text-muted-foreground/60 mb-4">
            <Lock className="h-4 w-4" />
            <span className="text-sm">Enter your initials above to unlock this section</span>
          </div>
        )}

        <div style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
          <label 
            className="flex items-start gap-4 p-4 rounded-xl border border-border/20 cursor-pointer hover:bg-muted/10 transition-colors"
          >
            <div className="pt-0.5">
              <Checkbox
                checked={marketingConsent}
                onCheckedChange={toggleConsent}
                className="h-5 w-5"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Mail className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Marketing Communications</span>
              </div>
              <p className="text-xs text-muted-foreground/70 leading-relaxed">
                Additionally, by checking here, I agree to let Tyler Insurance Group send me information about 
                carriers, products, and lead opportunities.
              </p>
            </div>
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
