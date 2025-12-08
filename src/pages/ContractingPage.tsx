import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle, Clock } from 'lucide-react';
import tylerLogo from '@/assets/tyler-logo.png';

export default function ContractingPage() {
  const { profile, isContractSubmitted } = useAuth();

  if (isContractSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="max-w-lg w-full text-center">
          <CardHeader className="space-y-4">
            <img src={tylerLogo} alt="Tyler Insurance Group" className="h-12 mx-auto" />
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
            <CardTitle className="text-2xl">Contracting Under Review</CardTitle>
            <CardDescription className="text-base">
              Thank you, {profile?.full_name || 'Agent'}! Your contracting documents have been submitted and are being reviewed by our team.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You'll receive an email notification once your account has been approved. This typically takes 1-2 business days.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center space-y-4">
          <img src={tylerLogo} alt="Tyler Insurance Group" className="h-12 mx-auto" />
          <div>
            <CardTitle className="text-2xl">Welcome to Tyler Insurance Group</CardTitle>
            <CardDescription className="text-base mt-2">
              Hi {profile?.full_name || 'there'}! Before you can access the platform, we need you to complete your contracting.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-6 space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              What You'll Need
            </h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                Valid insurance license information
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                E&O insurance documentation
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                Direct deposit information (for commissions)
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                W-9 form
              </li>
            </ul>
          </div>

          <div className="text-center space-y-4">
            <Button size="lg" className="w-full sm:w-auto px-8">
              Start Contracting
            </Button>
            <p className="text-sm text-muted-foreground">
              This process typically takes 10-15 minutes to complete.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
