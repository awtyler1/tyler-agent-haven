import { CheckCircle, XCircle, Loader2, FlaskConical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSystemStatus } from '@/hooks/useSystemStatus';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'sonner';

export function SystemStatusCard() {
  const { status, userStats } = useSystemStatus();
  const navigate = useNavigate();
  const [resetting, setResetting] = useState(false);

  const handleTestContracting = async () => {
    setResetting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Not authenticated');
        return;
      }

      // Delete existing contracting application for current user
      await supabase
        .from('contracting_applications')
        .delete()
        .eq('user_id', user.id);

      // Reset profile onboarding status
      await supabase
        .from('profiles')
        .update({ onboarding_status: 'CONTRACTING_REQUIRED' })
        .eq('user_id', user.id);

      toast.success('Contracting reset - redirecting...');
      navigate('/contracting');
    } catch (error) {
      console.error('Error resetting contracting:', error);
      toast.error('Failed to reset contracting');
    } finally {
      setResetting(false);
    }
  };

  if (status.loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">System Setup Status</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const statusItems = [
    { label: 'Super Admin Active', value: status.superAdminActive },
    { label: 'Email Sending Configured', value: status.emailConfigured },
    { label: 'Welcome Email Template', value: status.welcomeTemplateExists },
    { label: 'User Creation Flow Ready', value: status.userCreationFlowReady },
  ];

  const onboardingStats = [
    { label: 'Users Created', count: userStats.usersCreated },
    { label: 'Setup Links Sent', count: userStats.setupLinksSent },
    { label: 'Passwords Created', count: userStats.passwordsCreated },
    { label: 'First Logins', count: userStats.firstLogins },
  ];

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">System Setup Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Checklist */}
        <div className="space-y-3">
          {statusItems.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              {item.value ? (
                <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive shrink-0" />
              )}
              <span className={item.value ? 'text-foreground' : 'text-muted-foreground'}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Onboarding Stats */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Onboarding Pipeline</h4>
          <div className="grid grid-cols-2 gap-3">
            {onboardingStats.map((stat) => (
              <div key={stat.label} className="bg-muted/50 rounded-lg p-3">
                <div className="text-2xl font-bold">{stat.count}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Dev Tools */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Dev Tools</h4>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={handleTestContracting}
            disabled={resetting}
          >
            {resetting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FlaskConical className="h-4 w-4 mr-2" />
            )}
            Test Contracting Flow
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
