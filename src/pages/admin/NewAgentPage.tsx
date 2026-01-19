import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, UserPlus, Users, Info } from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';

interface PotentialManager {
  id: string; // profile id
  full_name: string | null;
  email: string | null;
}

// Special value for "no manager" option
const NO_MANAGER = '__none__';

export default function NewAgentPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [potentialManagers, setPotentialManagers] = useState<PotentialManager[]>([]);
  const [loadingManagers, setLoadingManagers] = useState(true);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    managerId: NO_MANAGER, // NULL means direct to TIG
    agentType: 'new' as 'new' | 'existing',
    sendSetupEmail: true,
  });

  useEffect(() => {
    fetchPotentialManagers();
  }, []);

  const fetchPotentialManagers = async () => {
    setLoadingManagers(true);
    try {
      // Fetch all active, non-test profiles as potential managers
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('is_active', true)
        .or('is_test.is.null,is_test.eq.false')
        .order('full_name');

      if (profilesError) throw profilesError;

      setPotentialManagers(profilesData || []);
    } catch (err) {
      console.error('Error fetching potential managers:', err);
      toast.error('Failed to load manager options');
    } finally {
      setLoadingManagers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);

    try {
      // Get current user for auth
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Not authenticated. Please sign in again.');
      }

      // Verify user has admin role
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['super_admin', 'admin']);

      if (!userRoles || userRoles.length === 0) {
        throw new Error('You do not have admin permissions. Please contact a system administrator.');
      }

      // Convert NO_MANAGER to null for the actual value
      const managerId = formData.managerId === NO_MANAGER ? null : formData.managerId;

      const requestBody = {
        email: formData.email,
        fullName: formData.fullName,
        managerId: managerId,
        isExistingAgent: formData.agentType === 'existing',
        sendSetupEmail: formData.sendSetupEmail,
      };

      // Invoke the edge function
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No active session. Please sign in again.');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-agent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify(requestBody),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data?.error || data?.message || data?.details || `Request failed with status ${response.status}`;
        console.error('Create agent failed:', errorMessage);
        throw new Error(errorMessage);
      }

      if (data && 'error' in data) {
        throw new Error(data.error || 'Failed to create agent');
      }

      const message = formData.agentType === 'existing'
        ? 'Existing agent added successfully!'
        : 'New agent created! They will receive a welcome email with setup instructions.';

      toast.success(message);
      navigate('/admin/agents');
    } catch (err: any) {
      console.error('Error creating agent:', err);
      const errorMessage = err?.message || err?.error || 'Failed to create agent';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get manager name for display
  const selectedManagerName = formData.managerId !== NO_MANAGER
    ? potentialManagers.find(u => u.id === formData.managerId)?.full_name || 'Unknown'
    : null;

  return (
    <AdminLayout showBackButton backLabel="Agents" onBack={() => navigate('/admin/agents')} maxWidth="narrow">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-serif font-medium text-foreground">Add Agent</h1>
        <p className="text-sm text-muted-foreground">Create a new agent account</p>
      </div>

          {/* Form Card */}
          <div className="bg-white border border-[#E5E2DB] rounded-xl p-6 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
              <div className="w-12 h-12 rounded-full bg-gold/8 flex items-center justify-center">
                <Users className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Agent Information</h2>
                <p className="text-xs text-muted-foreground">
                  Enter the agent's details and assign their manager
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium">Full Name *</Label>
                <Input
                  id="fullName"
                  placeholder="John Smith"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  required
                  className="border-[#E5E2DB] focus:border-gold"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="agent@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                  className="border-[#E5E2DB] focus:border-gold"
                />
              </div>

              {/* Reports To (Manager Assignment) */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Reports To</Label>
                <Select
                  value={formData.managerId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, managerId: value }))}
                  disabled={loadingManagers}
                >
                  <SelectTrigger className="border-[#E5E2DB]">
                    <SelectValue placeholder={loadingManagers ? "Loading..." : "Select manager"} />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    <SelectItem value={NO_MANAGER}>
                      <span className="text-muted-foreground">None (Direct to TIG)</span>
                    </SelectItem>
                    {potentialManagers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        <div className="flex flex-col">
                          <span>{manager.full_name || 'Unnamed'}</span>
                          {manager.email && (
                            <span className="text-xs text-muted-foreground">{manager.email}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {selectedManagerName
                    ? `This agent will report to ${selectedManagerName}`
                    : 'This agent will report directly to TIG (no manager)'}
                </p>
              </div>

              {/* Agent Type */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Agent Type *</Label>
                <RadioGroup
                  value={formData.agentType}
                  onValueChange={(value: 'new' | 'existing') => setFormData(prev => ({ ...prev, agentType: value }))}
                  className="space-y-3"
                >
                  <div className="flex items-start gap-3 p-3 rounded-lg border border-[#E5E2DB] hover:border-gold/30 transition-colors">
                    <RadioGroupItem value="new" id="new" className="mt-0.5" />
                    <div className="flex-1">
                      <Label htmlFor="new" className="font-medium cursor-pointer">New Agent</Label>
                      <p className="text-xs text-muted-foreground">
                        Must complete contracting wizard before accessing the platform
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg border border-[#E5E2DB] hover:border-gold/30 transition-colors">
                    <RadioGroupItem value="existing" id="existing" className="mt-0.5" />
                    <div className="flex-1">
                      <Label htmlFor="existing" className="font-medium cursor-pointer">Existing Agent</Label>
                      <p className="text-xs text-muted-foreground">
                        Already contracted - skips wizard and gets immediate platform access
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Send Setup Email */}
              <div className="flex items-start gap-3 p-3 rounded-lg border border-[#E5E2DB]">
                <Checkbox
                  id="sendSetupEmail"
                  checked={formData.sendSetupEmail}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, sendSetupEmail: checked as boolean }))}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <Label htmlFor="sendSetupEmail" className="font-medium cursor-pointer">Send setup email</Label>
                  <p className="text-xs text-muted-foreground">
                    Agent will receive an email with instructions to set their password and access the platform
                  </p>
                </div>
              </div>

              {/* Info Box for Existing Agents */}
              {formData.agentType === 'existing' && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-700">
                    Existing agents will have immediate access to the platform and will not appear in the contracting queue.
                  </p>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin/agents')}
                  className="border-[#E5E2DB]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-gold hover:bg-gold/90 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      {formData.agentType === 'existing' ? 'Add Existing Agent' : 'Create Agent'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
    </AdminLayout>
  );
}
