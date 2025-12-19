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
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext';

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
  const [creating, setCreating] = useState(false);
  const [creatingAgents, setCreatingAgents] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [createdCount, setCreatedCount] = useState(0);
  const [testCount, setTestCount] = useState(0);
  const [realCount, setRealCount] = useState(0);
  const [testAgentCount, setTestAgentCount] = useState(0);

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

  const handleDeleteTestData = async () => {
    if (!confirm('Delete ALL test data including test agent accounts?')) return;
    
    setDeleting(true);
    try {
      // Delete carrier statuses for test applications
      await supabase
        .from('carrier_statuses')
        .delete()
        .eq('is_test', true);

      // Delete test contracting applications
      await supabase
        .from('contracting_applications')
        .delete()
        .eq('is_test', true);

      // Get test profiles to delete their user roles
      const { data: testProfiles } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('is_test', true);

      if (testProfiles && testProfiles.length > 0) {
        const userIds = testProfiles.map(p => p.user_id);
        
        await supabase
          .from('user_roles')
          .delete()
          .in('user_id', userIds);
        
        await supabase
          .from('profiles')
          .delete()
          .eq('is_test', true);
      }

      toast.success('Test data deleted');
      fetchCounts();
    } catch (err) {
      console.error('Error deleting test data:', err);
      toast.error('Failed to delete test data');
    } finally {
      setDeleting(false);
    }
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
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div className="text-sm text-amber-700 dark:text-amber-300">
                <p><strong>Testing Only:</strong> This creates fake data with <code>is_test=true</code>.</p>
                <p className="mt-1">These won't have real uploaded documents but will appear in the contracting queue with a TEST badge.</p>
              </div>
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
              Remove all test data including test agents (<code>is_test=true</code>)
            </CardDescription>
          </CardHeader>
          <CardContent>
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
              Delete All Test Data
            </Button>
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
