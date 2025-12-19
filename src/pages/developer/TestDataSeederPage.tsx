import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  UserPlus, 
  Loader2,
  CheckCircle,
  Trash2,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [createdCount, setCreatedCount] = useState(0);

  const createTestSubmission = async (agent: typeof FAKE_AGENTS[0]) => {
    const fakeUserId = crypto.randomUUID();
    
    const numCarriers = Math.floor(Math.random() * 3) + 2;
    const shuffled = [...CARRIERS].sort(() => 0.5 - Math.random());
    const selectedCarriers = shuffled.slice(0, numCarriers);

    const { error } = await supabase
      .from('contracting_applications')
      .insert({
        user_id: fakeUserId,
        full_legal_name: agent.name,
        email_address: agent.email,
        resident_state: agent.state,
        npn_number: agent.npn,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        selected_carriers: { carriers: selectedCarriers },
        uploaded_documents: {
          eo_certificate: `${fakeUserId}/eo_certificate/fake_eo.pdf`,
          voided_check: `${fakeUserId}/voided_check/fake_check.pdf`,
          insurance_license: `${fakeUserId}/insurance_license/fake_license.pdf`,
        },
        signature_initials: agent.name.split(' ').map(n => n[0]).join(''),
        signature_name: agent.name,
        signature_date: new Date().toISOString(),
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
      const uniqueAgent = {
        ...randomAgent,
        email: `test.${Date.now()}@example.com`,
        npn: String(Math.floor(Math.random() * 90000000) + 10000000),
      };
      await createTestSubmission(uniqueAgent);
      toast.success(`Created test submission for ${uniqueAgent.name}`);
    } catch (err) {
      toast.error('Failed to create test data');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteTestData = async () => {
    if (!confirm('Delete ALL test submissions (emails ending in @example.com)?')) return;
    
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('contracting_applications')
        .delete()
        .like('email_address', '%@example.com');

      if (error) throw error;
      toast.success('Test data deleted');
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
              <p className="text-sm text-amber-700 dark:text-amber-300">
                <strong>Testing Only:</strong> This creates fake data with @example.com emails. 
                These won't have real uploaded documents but will appear in the contracting queue.
              </p>
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

        {/* Cleanup */}
        <Card>
          <CardHeader>
            <CardTitle>Cleanup</CardTitle>
            <CardDescription>
              Remove all test data (submissions with @example.com emails)
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
