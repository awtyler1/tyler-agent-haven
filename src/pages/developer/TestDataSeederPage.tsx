import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  UserPlus, 
  Loader2,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Database,
  Users,
  Eye,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext';
import { useViewMode } from '@/contexts/ViewModeContext';

const FAKE_AGENTS = [
  { name: 'Sarah Johnson', email: 'sarah.test@example.com', state: 'TX', npn: '11111111' },
  { name: 'Michael Chen', email: 'michael.test@example.com', state: 'FL', npn: '22222222' },
  { name: 'Emily Rodriguez', email: 'emily.test@example.com', state: 'CA', npn: '33333333' },
  { name: 'James Williams', email: 'james.test@example.com', state: 'NY', npn: '44444444' },
  { name: 'Amanda Foster', email: 'amanda.test@example.com', state: 'OH', npn: '55555555' },
];

const CARRIERS = ['Aetna', 'Humana', 'UnitedHealthcare', 'Cigna', 'WellCare', 'Anthem'];

export default function TestDataSeederPage() {
  const navigate = useNavigate();
  const { isEnabled } = useFeatureFlags();
  const { startImpersonating } = useViewMode();
  const [creating, setCreating] = useState(false);
  const [creatingAgents, setCreatingAgents] = useState(false);
  const [creatingCompleteAgent, setCreatingCompleteAgent] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [createdCount, setCreatedCount] = useState(0);
  const [testCount, setTestCount] = useState(0);
  const [realCount, setRealCount] = useState(0);
  const [testAgentCount, setTestAgentCount] = useState(0);
  const [lastCreatedAgent, setLastCreatedAgent] = useState<{ name: string; email: string; userId: string } | null>(null);

  const isTestMode = isEnabled('test_mode');

  const fetchCounts = async () => {
    const { count: testC } = await supabase
      .from('contracting_applications')
      .select('*', { count: 'exact', head: true })
      .eq('is_test', true);
    
    const { count: realC } = await supabase
      .from('contracting_applications')
      .select('*', { count: 'exact', head: true })
      .eq('is_test', false);

    const { count: testAgents } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_test', true);
    
    setTestCount(testC || 0);
    setRealCount(realC || 0);
    setTestAgentCount(testAgents || 0);
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  const createTestSubmission = async (agent: typeof FAKE_AGENTS[0]) => {
    // Get current user's ID (so foreign key constraint is satisfied)
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Not authenticated');
    }
    
    // Random carriers (2-4)
    const numCarriers = Math.floor(Math.random() * 3) + 2;
    const shuffled = [...CARRIERS].sort(() => 0.5 - Math.random());
    const selectedCarriers = shuffled.slice(0, numCarriers);

    // Create unique identifiers for this test submission
    const timestamp = Date.now();
    const uniqueEmail = `test.${timestamp}@example.com`;
    const uniqueNpn = String(Math.floor(Math.random() * 90000000) + 10000000);

    const { error } = await supabase
      .from('contracting_applications')
      .insert({
        user_id: user.id,
        full_legal_name: agent.name,
        email_address: uniqueEmail,
        resident_state: agent.state,
        npn_number: uniqueNpn,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        selected_carriers: { carriers: selectedCarriers },
        uploaded_documents: {
          eo_certificate: `${user.id}/eo_certificate/${timestamp}_fake_eo.pdf`,
          voided_check: `${user.id}/voided_check/${timestamp}_fake_check.pdf`,
          insurance_license: `${user.id}/insurance_license/${timestamp}_fake_license.pdf`,
        },
        signature_initials: agent.name.split(' ').map(n => n[0]).join(''),
        signature_name: agent.name,
        signature_date: new Date().toISOString(),
        is_test: true, // Always mark seeded data as test
      });

    if (error) {
      console.error('Error creating test submission:', error);
      throw error;
    }
  };

  const handleCreateAll = async () => {
    setCreating(true);
    setCreatedCount(0);
    
    try {
      for (const agent of FAKE_AGENTS) {
        await createTestSubmission(agent);
        setCreatedCount(prev => prev + 1);
      }
      toast.success(`Created ${FAKE_AGENTS.length} test submissions`);
      fetchCounts();
    } catch (err) {
      toast.error('Failed to create some test data');
    } finally {
      setCreating(false);
    }
  };

  const handleCreateOne = async () => {
    setCreating(true);
    try {
      const randomAgent = FAKE_AGENTS[Math.floor(Math.random() * FAKE_AGENTS.length)];
      await createTestSubmission(randomAgent);
      toast.success(`Created test submission for ${randomAgent.name}`);
      fetchCounts();
    } catch (err) {
      console.error('Create error:', err);
      toast.error('Failed to create test data');
    } finally {
      setCreating(false);
    }
  };

  const createTestAgent = async (agent: typeof FAKE_AGENTS[0]) => {
    const timestamp = Date.now();
    const uniqueEmail = `test.agent.${timestamp}@example.com`;
    
    const { data, error } = await supabase.functions.invoke('create-agent', {
      body: {
        email: uniqueEmail,
        fullName: agent.name,
        role: 'independent_agent',
        sendSetupEmail: false,
        isTest: true,
      },
    });

    if (error) throw error;
    return data;
  };

  const handleCreateTestAgents = async () => {
    setCreatingAgents(true);
    try {
      for (const agent of FAKE_AGENTS.slice(0, 3)) {
        const result = await createTestAgent(agent);
        
        if (result?.userId) {
          const numCarriers = Math.floor(Math.random() * 3) + 2;
          const shuffled = [...CARRIERS].sort(() => 0.5 - Math.random());
          const selectedCarriers = shuffled.slice(0, numCarriers);
          
          await supabase
            .from('contracting_applications')
            .insert({
              user_id: result.userId,
              full_legal_name: agent.name,
              email_address: `${result.userId}@example.com`,
              resident_state: agent.state,
              npn_number: String(Math.floor(Math.random() * 90000000) + 10000000),
              status: 'submitted',
              submitted_at: new Date().toISOString(),
              selected_carriers: { carriers: selectedCarriers },
              is_test: true,
            });
        }
      }
      toast.success('Created 3 test agents with contracting applications');
      fetchCounts();
    } catch (err) {
      console.error('Error creating test agents:', err);
      toast.error('Failed to create test agents');
    } finally {
      setCreatingAgents(false);
    }
  };

  const createCompleteTestAgent = async () => {
    setCreatingCompleteAgent(true);
    setLastCreatedAgent(null);
    
    try {
      // Pick a random agent template
      const template = FAKE_AGENTS[Math.floor(Math.random() * FAKE_AGENTS.length)];
      const timestamp = Date.now();
      const uniqueEmail = `test.complete.${timestamp}@example.com`;
      const uniqueNpn = String(Math.floor(Math.random() * 90000000) + 10000000);
      const licenseNumber = `LIC-${Math.floor(Math.random() * 900000) + 100000}`;
      
      // Step 1: Create the auth user via edge function
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
      console.log('Created test user:', userId);

      // Step 2: Update profile with onboarding status (simulating submitted state)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          onboarding_status: 'CONTRACT_SUBMITTED',
          is_test: true,
        })
        .eq('user_id', userId);

      if (profileError) {
        console.error('Profile update error:', profileError);
      }

      // Step 3: Select random carriers (3-5)
      const numCarriers = Math.floor(Math.random() * 3) + 3;
      const shuffled = [...CARRIERS].sort(() => 0.5 - Math.random());
      const selectedCarriers = shuffled.slice(0, numCarriers);

      // Step 4: Create contracting application linked to this user
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
          uploaded_documents: {
            eo_certificate: `${userId}/eo_certificate/${timestamp}_test_eo.pdf`,
            voided_check: `${userId}/voided_check/${timestamp}_test_check.pdf`,
            insurance_license: `${userId}/insurance_license/${timestamp}_test_license.pdf`,
          },
          signature_initials: template.name.split(' ').map(n => n[0]).join(''),
          signature_name: template.name,
          signature_date: new Date().toISOString(),
          is_test: true,
        })
        .select()
        .single();

      if (appError) {
        console.error('Application error:', appError);
        throw appError;
      }

      console.log('Created contracting application:', application.id);

      // Step 5: Create carrier statuses for each selected carrier
      const carrierStatusInserts = selectedCarriers.map((carrier, index) => ({
        application_id: application.id,
        carrier_name: carrier,
        status: index === 0 ? 'appointed' : 'pending',
        is_transfer: Math.random() > 0.7,
        is_test: true,
      }));

      const { error: statusError } = await supabase
        .from('carrier_statuses')
        .insert(carrierStatusInserts);

      if (statusError) {
        console.error('Carrier status error:', statusError);
      }

      // Success!
      setLastCreatedAgent({
        name: template.name,
        email: uniqueEmail,
        userId: userId,
      });
      
      toast.success(`Created complete test agent: ${template.name}`);
      fetchCounts();
      
    } catch (err) {
      console.error('Error creating complete test agent:', err);
      toast.error('Failed to create complete test agent');
    } finally {
      setCreatingCompleteAgent(false);
    }
  };

  const handleDeleteTestData = async () => {
    if (!confirm('Delete ALL test data including test agent accounts?')) return;
    
    setDeleting(true);
    try {
      // Step 1: Delete carrier statuses for test applications
      console.log('Deleting test carrier statuses...');
      const { error: carrierError } = await supabase
        .from('carrier_statuses')
        .delete()
        .eq('is_test', true);
      
      if (carrierError) {
        console.error('Carrier status delete error:', carrierError);
      } else {
        console.log('Deleted test carrier statuses');
      }

      // Step 2: Delete test contracting applications
      console.log('Deleting test contracting applications...');
      const { error: appError } = await supabase
        .from('contracting_applications')
        .delete()
        .eq('is_test', true);

      if (appError) {
        console.error('Application delete error:', appError);
        throw appError;
      }
      console.log('Deleted test contracting applications');

      // Step 3: Get test profiles
      const { data: testProfiles } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('is_test', true);

      console.log('Found test profiles:', testProfiles?.length || 0);

      // Step 4: Delete test user roles and profiles
      if (testProfiles && testProfiles.length > 0) {
        const userIds = testProfiles.map(p => p.user_id);
        
        console.log('Deleting user roles for:', userIds);
        const { error: rolesError } = await supabase
          .from('user_roles')
          .delete()
          .in('user_id', userIds);
        
        if (rolesError) {
          console.error('Roles delete error:', rolesError);
        }
        
        console.log('Deleting test profiles...');
        const { error: profilesError } = await supabase
          .from('profiles')
          .delete()
          .eq('is_test', true);
          
        if (profilesError) {
          console.error('Profiles delete error:', profilesError);
        }
      }

      toast.success('Test data deleted');
      
      // Wait a moment for database to sync, then fetch fresh counts
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchCounts();
      
    } catch (err) {
      console.error('Error deleting test data:', err);
      toast.error('Failed to delete test data');
      await fetchCounts();
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteByEmail = async () => {
    if (!confirm('Delete ALL data with @example.com emails? This catches old test data without is_test flag.')) return;
    
    setDeleting(true);
    try {
      // Find applications with example.com emails
      const { data: testApps } = await supabase
        .from('contracting_applications')
        .select('id')
        .like('email_address', '%@example.com');
      
      console.log('Found @example.com applications:', testApps?.length || 0);
      
      if (testApps && testApps.length > 0) {
        const appIds = testApps.map(a => a.id);
        
        // Delete carrier statuses for these applications
        await supabase
          .from('carrier_statuses')
          .delete()
          .in('application_id', appIds);
        
        // Delete the applications
        await supabase
          .from('contracting_applications')
          .delete()
          .like('email_address', '%@example.com');
      }

      // Delete profiles with example.com emails
      const { data: testProfiles } = await supabase
        .from('profiles')
        .select('user_id')
        .like('email', '%@example.com');

      console.log('Found @example.com profiles:', testProfiles?.length || 0);

      if (testProfiles && testProfiles.length > 0) {
        const userIds = testProfiles.map(p => p.user_id);
        
        await supabase
          .from('user_roles')
          .delete()
          .in('user_id', userIds);
        
        await supabase
          .from('profiles')
          .delete()
          .like('email', '%@example.com');
      }

      toast.success('Cleaned up @example.com data');
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchCounts();
    } catch (err) {
      console.error('Error:', err);
      toast.error('Failed to clean up data');
    } finally {
      setDeleting(false);
    }
  };

  const runDiagnostics = async () => {
    console.log('=== DIAGNOSTICS ===');
    
    // Check contracting applications
    const { data: allApps, count: totalApps } = await supabase
      .from('contracting_applications')
      .select('id, email_address, is_test, status', { count: 'exact' });
    
    console.log('Total contracting applications:', totalApps);
    console.log('Applications:', allApps);
    
    const testApps = allApps?.filter(a => a.is_test === true);
    const nonTestApps = allApps?.filter(a => a.is_test !== true);
    const exampleEmails = allApps?.filter(a => a.email_address?.includes('@example.com'));
    
    console.log('With is_test=true:', testApps?.length || 0);
    console.log('Without is_test=true:', nonTestApps?.length || 0);
    console.log('With @example.com email:', exampleEmails?.length || 0);
    
    // Check profiles
    const { data: allProfiles, count: totalProfiles } = await supabase
      .from('profiles')
      .select('id, email, is_test', { count: 'exact' });
    
    console.log('Total profiles:', totalProfiles);
    
    const testProfiles = allProfiles?.filter(p => p.is_test === true);
    console.log('Profiles with is_test=true:', testProfiles?.length || 0);
    
    // Check carrier statuses
    const { count: totalStatuses } = await supabase
      .from('carrier_statuses')
      .select('*', { count: 'exact', head: true });
    
    const { count: testStatuses } = await supabase
      .from('carrier_statuses')
      .select('*', { count: 'exact', head: true })
      .eq('is_test', true);
    
    console.log('Total carrier statuses:', totalStatuses);
    console.log('Carrier statuses with is_test=true:', testStatuses);
    
    console.log('=== END DIAGNOSTICS ===');
    
    toast.info('Check browser console for diagnostics');
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/developer')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Test Data Seeder</h1>
            <p className="text-muted-foreground">Create fake contracting submissions for testing</p>
          </div>
        </div>

        {/* Warning */}
        <Card className="border-amber-500/50 bg-amber-500/10">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div className="text-sm text-amber-700 dark:text-amber-300">
                  <p><strong>Testing Only:</strong> This creates fake data with <code>is_test=true</code>.</p>
                  <p className="mt-1">These won't have real uploaded documents but will appear in the contracting queue with a TEST badge.</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={runDiagnostics}>
                Run Diagnostics
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data Counts */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              <Database className="h-5 w-5 text-muted-foreground" />
              <div className="flex gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{testAgentCount}</div>
                  <div className="text-sm text-muted-foreground">Test agents</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{testCount}</div>
                  <div className="text-sm text-muted-foreground">Test submissions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{realCount}</div>
                  <div className="text-sm text-muted-foreground">Real submissions</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Complete Test Agent - Featured Card */}
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle>Create Complete Test Agent</CardTitle>
            </div>
            <CardDescription>
              Creates a full test agent with profile, contracting application, and carrier statuses - 
              all linked together for end-to-end testing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={createCompleteTestAgent} 
              disabled={creatingCompleteAgent}
              className="w-full sm:w-auto"
            >
              {creatingCompleteAgent ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating complete agent...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Create Complete Test Agent
                </>
              )}
            </Button>
            
            {lastCreatedAgent && (
              <div className="border rounded-lg p-4 bg-background space-y-3">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-medium">Agent Created Successfully</span>
                </div>
                <div className="text-sm space-y-1">
                  <p><strong>Name:</strong> {lastCreatedAgent.name}</p>
                  <p><strong>Email:</strong> {lastCreatedAgent.email}</p>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => navigate('/admin/agents')}
                  >
                    View in Agents
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => navigate('/admin/contracting')}
                  >
                    View in Queue
                  </Button>
                  <Button 
                    size="sm" 
                    variant="secondary"
                    onClick={() => {
                      startImpersonating({
                        userId: lastCreatedAgent.userId,
                        fullName: lastCreatedAgent.name,
                        email: lastCreatedAgent.email,
                      });
                      navigate('/');
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View as Agent
                  </Button>
                </div>
              </div>
            )}
            
            <div className="border rounded-lg p-3 bg-muted/30 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">This creates:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Auth user account</li>
                <li>Profile with CONTRACT_SUBMITTED status</li>
                <li>Contracting application with all fields populated</li>
                <li>3-5 carrier statuses (1 appointed, rest pending)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Create Test Submissions</CardTitle>
            <CardDescription>
              Generate fake contracting submissions to test the admin queue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-4">
              <Button 
                onClick={handleCreateOne} 
                disabled={creating}
                variant="outline"
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                Create 1 Submission
              </Button>
              
              <Button 
                onClick={handleCreateAll} 
                disabled={creating}
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {createdCount} / {FAKE_AGENTS.length}
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Create 5 Submissions
                  </>
                )}
              </Button>
            </div>

            {/* Sample Data Preview */}
            <div className="border rounded-lg p-4 bg-muted/50">
              <p className="text-sm font-medium mb-3">Sample Agents:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {FAKE_AGENTS.map((agent, i) => (
                  <div key={i} className="text-sm p-2 bg-background rounded border">
                    <span className="font-medium">{agent.name}</span>
                    <span className="text-muted-foreground ml-2">
                      {agent.state} • NPN: {agent.npn}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Create Test Agents */}
        <Card>
          <CardHeader>
            <CardTitle>Create Test Agents</CardTitle>
            <CardDescription>
              Generate complete test agent accounts that appear in the Agents page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleCreateTestAgents} 
              disabled={creatingAgents}
              variant="outline"
            >
              {creatingAgents ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Users className="h-4 w-4 mr-2" />
              )}
              Create 3 Test Agents
            </Button>
          </CardContent>
        </Card>

        {/* Cleanup */}
        <Card>
          <CardHeader>
            <CardTitle>Cleanup</CardTitle>
            <CardDescription>
              Remove test data from the system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button 
                variant="destructive" 
                onClick={handleDeleteTestData}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete Test Data (is_test=true)
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleDeleteByEmail}
                disabled={deleting}
                className="border-destructive/50 text-destructive hover:bg-destructive/10"
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Clean @example.com
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Use "Clean @example.com" if old test data wasn't flagged with is_test=true
            </p>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="flex justify-center">
          <Button variant="link" onClick={() => navigate('/admin/contracting')}>
            View Contracting Queue →
          </Button>
        </div>
      </div>
    </div>
  );
}
