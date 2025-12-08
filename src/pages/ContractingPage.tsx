import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle, Clock, Upload, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import tylerLogo from '@/assets/tyler-logo.png';

export default function ContractingPage() {
  const { profile, isContractSubmitted, refetch } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showContractForm, setShowContractForm] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmitContracting = async () => {
    if (files.length === 0) {
      toast.error('Please upload your contracting documents');
      return;
    }

    setIsSubmitting(true);
    try {
      // Update the profile onboarding status to CONTRACT_SUBMITTED
      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_status: 'CONTRACT_SUBMITTED' })
        .eq('user_id', profile?.user_id);

      if (error) throw error;

      toast.success('Contracting documents submitted successfully!');
      
      // Refetch the profile to update the UI
      await refetch();
    } catch (error) {
      console.error('Error submitting contracting:', error);
      toast.error('Failed to submit contracting. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  if (showContractForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center space-y-4">
            <img src={tylerLogo} alt="Tyler Insurance Group" className="h-12 mx-auto" />
            <div>
              <CardTitle className="text-2xl">Upload Contracting Documents</CardTitle>
              <CardDescription className="text-base mt-2">
                Please upload the required documents to complete your contracting.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">Drop files here or click to upload</p>
                <p className="text-sm text-muted-foreground">
                  Accepted formats: PDF, DOC, DOCX, JPG, PNG
                </p>
              </label>
            </div>

            {files.length > 0 && (
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Selected Files:</h4>
                <ul className="space-y-1">
                  {files.map((file, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {file.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <Button
                variant="outline"
                onClick={() => setShowContractForm(false)}
                disabled={isSubmitting}
              >
                Back
              </Button>
              <Button
                onClick={handleSubmitContracting}
                disabled={isSubmitting || files.length === 0}
                className="min-w-[150px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Contracting'
                )}
              </Button>
            </div>
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
            <Button 
              size="lg" 
              className="w-full sm:w-auto px-8"
              onClick={() => setShowContractForm(true)}
            >
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