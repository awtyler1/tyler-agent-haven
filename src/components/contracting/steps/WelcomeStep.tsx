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
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader className="text-center space-y-4">
          <img src={tylerLogo} alt="Tyler Insurance Group" className="h-14 mx-auto" />
          <div>
            <CardTitle className="text-2xl">Welcome to Agent Contracting</CardTitle>
            <CardDescription className="text-base mt-2">
              Hi {fullName || 'there'}! Let's get you set up to sell with Tyler Insurance Group.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
              <Clock className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium">~15 minutes</h4>
                <p className="text-sm text-muted-foreground">Estimated completion time</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
              <Shield className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium">Save Progress</h4>
                <p className="text-sm text-muted-foreground">Your work is saved automatically</p>
              </div>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-6 space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              What You'll Need
            </h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                Copy of your insurance license
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                E&O insurance documentation (if applicable)
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                Voided check for direct deposit
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                AML training certificate
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                Government-issued ID
              </li>
            </ul>
          </div>

          <div className="text-center">
            <Button size="lg" onClick={onContinue} className="px-8">
              Get Started
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}