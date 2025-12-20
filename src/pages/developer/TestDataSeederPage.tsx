import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  UserPlus, 
  Loader2,
  CheckCircle,
  Trash2,
  Database,
  Eye,
  Users,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useViewMode } from '@/contexts/ViewModeContext';

const SAMPLE_AGENTS = [
  { name: 'Sarah Johnson', state: 'TX' },
  { name: 'Michael Chen', state: 'FL' },
  { name: 'Emily Rodriguez', state: 'CA' },
  { name: 'James Williams', state: 'NY' },
  { name: 'Amanda Foster', state: 'OH' },
];

const CARRIERS = ['Aetna', 'Humana', 'UnitedHealthcare', 'Cigna', 'WellCare', 'Anthem'];

export default function TestDataSeederPage() {
  const navigate = useNavigate();
  const { startImpersonating } = useViewMode();
  
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [lastCreatedAgent, setLastCreatedAgent] = useState<{ 
    name: string; 
    email: string; 
    userId: string 
  } | null>(null);
  
  // Counts
  const [testAgentCount, setTestAgentCount] = useState(0);
  const [testSubmissionCount, setTestSubmissionCount] = useState(0);
  const [realSubmissionCount, setRealSubmissionCount] = useState(0);

  const fetchCounts = async () => {
    const { count: testAgents } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_test', true);

    const { count: testSubs } = await supabase
      .from('contracting_applications')
      .select('*', { count: 'exact', head: true })
      .eq('is_test', true);
    
    const { count: realSubs } = await supabase
      .from('contracting_applications')
      .select('*', { count: 'exact', head: true })
      .eq('is_test', false);
    
    setTestAgentCount(testAgents || 0);
    setTestSubmissionCount(testSubs || 0);
    setRealSubmissionCount(realSubs || 0);
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  const createCompleteTestAgent = async () => {
    setCreating(true);
    setLastCreatedAgent(null);
    
    try {
      const template = SAMPLE_AGENTS[Math.floor(Math.random() * SAMPLE_AGENTS.length)];
      const timestamp = Date.now();
      const uniqueEmail = `test.agent.${timestamp}@example.com`;
      const uniqueNpn = String(Math.floor(Math.random() * 90000000) + 10000000);
      const licenseNumber = `LIC-${Math.floor(Math.random() * 900000) + 100000}`;
      
      // Step 1: Create auth user
      const { data: createResult, error: createError } = await supabase.functions.invoke('create-agent', {
        body: {
          email: uniqueEmail,
          fullName: template.name,
          role: 'independent_agent',
          sendSetupEmail: false,
          isTest: true,
        },
      });

      if (createError || !createResult?.userId) {
        throw new Error(createError?.message || 'Failed to create user');
      }

      const userId = createResult.userId;

      // Step 2: Update profile status
      await supabase
        .from('profiles')
        .update({ 
          onboarding_status: 'CONTRACT_SUBMITTED',
          is_test: true,
        })
        .eq('user_id', userId);

      // Step 3: Select random carriers
      const numCarriers = Math.floor(Math.random() * 3) + 3;
      const shuffled = [...CARRIERS].sort(() => 0.5 - Math.random());
      const selectedCarriers = shuffled.slice(0, numCarriers);

      // Step 4: Create contracting application
      const { data: application, error: appError } = await supabase
        .from('contracting_applications')
        .insert({
          user_id: userId,
          full_legal_name: template.name,
          email_address: uniqueEmail,
          phone_mobile: '(555) 123-4567',
          birth_date: '1985-06-15',
          resident_state: template.state,
          resident_license_number: licenseNumber,
          npn_number: uniqueNpn,
          home_address: {
            street: '123 Test Street',
            city: 'Test City',
            state: template.state,
            zip: '12345',
          },
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          selected_carriers: { carriers: selectedCarriers },
          uploaded_documents: {},
          signature_initials: template.name.split(' ').map(n => n[0]).join(''),
          signature_name: template.name,
          signature_date: new Date().toISOString(),
          is_test: true,
        })
        .select()
        .single();

      if (appError) throw appError;

      // Note: carrier_statuses are now user-based and assigned by Caroline after review
      // Skipping carrier status creation for test data

      setLastCreatedAgent({
        name: template.name,
        email: uniqueEmail,
        userId: userId,
      });
      
      toast.success(`Created test agent: ${template.name}`);
      await fetchCounts();
      
    } catch (err) {
      console.error('Error creating test agent:', err);
      toast.error('Failed to create test agent');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteTestData = async () => {
    if (!confirm('Delete ALL test data?')) return;
    
    setDeleting(true);
    try {
      // Note: carrier_statuses table no longer has is_test column
      // Carrier statuses are now managed separately

      // Delete contracting applications
      await supabase.from('contracting_applications').delete().eq('is_test', true);

      // Get and delete test profiles
      const { data: testProfiles } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('is_test', true);

      if (testProfiles && testProfiles.length > 0) {
        const userIds = testProfiles.map(p => p.user_id);
        await supabase.from('user_roles').delete().in('user_id', userIds);
        await supabase.from('profiles').delete().eq('is_test', true);
      }

      setLastCreatedAgent(null);
      toast.success('Test data deleted');
      
      await new Promise(resolve => setTimeout(resolve, 300));
      await fetchCounts();
    } catch (err) {
      console.error('Error deleting test data:', err);
      toast.error('Failed to delete test data');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/developer')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Test Data Seeder</h1>
            <p className="text-muted-foreground">Create complete test agents for end-to-end testing</p>
          </div>
        </div>

        {/* Stats */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Database className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Current Data</span>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{testAgentCount}</div>
                <div className="text-xs text-muted-foreground">Test Agents</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{testSubmissionCount}</div>
                <div className="text-xs text-muted-foreground">Test Submissions</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-foreground">{realSubmissionCount}</div>
                <div className="text-xs text-muted-foreground">Real Submissions</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Create Test Agent */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Create Test Agent
            </CardTitle>
            <CardDescription>
              Creates a complete agent with profile, contracting application, and carrier statuses
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={createCompleteTestAgent} 
              disabled={creating}
              className="w-full"
              size="lg"
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Test Agent
                </>
              )}
            </Button>
            
            {lastCreatedAgent && (
              <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-950/20 space-y-3">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">Created: {lastCreatedAgent.name}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/admin/agents')}
                  >
                    <Users className="h-3 w-3 mr-1" />
                    Agents
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/admin/contracting')}
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    Queue
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => {
                      startImpersonating({
                        userId: lastCreatedAgent.userId,
                        fullName: lastCreatedAgent.name,
                        email: lastCreatedAgent.email,
                      });
                      navigate('/');
                    }}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View As
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cleanup */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Cleanup</p>
                <p className="text-sm text-muted-foreground">Remove all test data</p>
              </div>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleDeleteTestData}
                disabled={deleting || (testAgentCount === 0 && testSubmissionCount === 0)}
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete All Test Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="flex justify-center gap-4">
          <Button variant="link" size="sm" onClick={() => navigate('/admin/contracting')}>
            Contracting Queue →
          </Button>
          <Button variant="link" size="sm" onClick={() => navigate('/admin/agents')}>
            Manage Agents →
          </Button>
        </div>
      </div>
    </div>
  );
}
