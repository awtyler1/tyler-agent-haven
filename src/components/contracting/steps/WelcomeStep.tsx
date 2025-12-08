import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle, Clock, Shield } from 'lucide-react';
import tylerLogo from '@/assets/tyler-logo.png';

interface WelcomeStepProps {
  fullName: string | null;
  onContinue: () => void;
}

export function WelcomeStep({ fullName, onContinue }: WelcomeStepProps) {
  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader className="text-center py-4">
          <img src={tylerLogo} alt="Tyler Insurance Group" className="h-10 mx-auto" />
          <CardTitle className="text-xl mt-2">Welcome to Agent Contracting</CardTitle>
          <CardDescription>
            Hi {fullName || 'there'}! Let's get you set up to sell with Tyler Insurance Group.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pb-4">
          <div className="grid gap-3 grid-cols-2">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <Clock className="h-4 w-4 text-primary flex-shrink-0" />
              <div>
                <h4 className="font-medium text-sm">~15 minutes</h4>
                <p className="text-xs text-muted-foreground">Estimated time</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <Shield className="h-4 w-4 text-green-500 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-sm">Auto-Save</h4>
                <p className="text-xs text-muted-foreground">Progress saved</p>
              </div>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-primary" />
              What You'll Need
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                Insurance license
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                E&O documentation
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                Voided check
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                AML certificate
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                Government ID
              </div>
            </div>
          </div>

          <div className="text-center pt-2">
            <Button onClick={onContinue} className="px-8">
              Get Started
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
