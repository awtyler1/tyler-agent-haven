import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, UserPlus, Users, Info } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

interface HierarchyOption {
  id: string;
  label: string;
  type: 'team';
  entityId: string;
}

export default function NewAgentPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hierarchyOptions, setHierarchyOptions] = useState<HierarchyOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    hierarchyId: '',
    agentType: 'new' as 'new' | 'existing',
    sendSetupEmail: true,
  });

  useEffect(() => {
    fetchHierarchyOptions();
  }, []);

  const fetchHierarchyOptions = async () => {
    setLoadingOptions(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if user is admin/super_admin
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['super_admin', 'admin']);

      const isAdmin = (userRoles?.length || 0) > 0;

      let teams;

      if (isAdmin) {
        // Admins see ALL active teams
        const { data, error } = await supabase
          .from('hierarchy_entities')
          .select('id, name')
          .eq('entity_type', 'team')
          .eq('is_active', true);

        if (error) throw error;
        teams = data;
      } else {
        // Non-admins only see teams they own
        const { data: ownerships, error: ownerError } = await supabase
          .from('entity_owners')
          .select('entity_id')
          .eq('user_id', user.id);

        if (ownerError) throw ownerError;

        if (!ownerships || ownerships.length === 0) {
          setHierarchyOptions([]);
          return;
        }

        const entityIds = ownerships.map(o => o.entity_id);

        const { data, error } = await supabase
          .from('hierarchy_entities')
          .select('id, name')
          .in('id', entityIds)
          .eq('entity_type', 'team')
          .eq('is_active', true);

        if (error) throw error;
        teams = data;
      }

      const options: HierarchyOption[] = (teams || []).map(team => ({
        id: `team-${team.id}`,
        label: team.name,
        type: 'team' as const,
        entityId: team.id,
      }));

      setHierarchyOptions(options);
    } catch (err) {
      console.error('Error fetching hierarchy options:', err);
      toast.error('Failed to load hierarchy options');
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.hierarchyId) {
      toast.error('Please select a team');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current user for upline assignment
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Not authenticated. Please sign in again.');
      }

      // Verify user has admin role (for better error message before calling edge function)
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['super_admin', 'admin']);

      if (!userRoles || userRoles.length === 0) {
        throw new Error('You do not have admin permissions. Please contact a system administrator.');
      }

      const selectedOption = hierarchyOptions.find(o => o.id === formData.hierarchyId);

      if (!selectedOption) {
        throw new Error('Invalid team selection');
      }

      const requestBody = {
        email: formData.email,
        fullName: formData.fullName,
        hierarchyType: 'team' as const,
        hierarchyEntityId: selectedOption.entityId,
        uplineUserId: user.id,
        isExistingAgent: formData.agentType === 'existing',
        sendSetupEmail: formData.sendSetupEmail,
      };

      // Invoke the function - Supabase client handles auth automatically
      let { data, error } = await supabase.functions.invoke('create-agent', {
        body: requestBody,
      });

      // Handle 401 errors with single retry after token refresh
      if (error && (error.message?.includes('401') || error.message?.includes('non-2xx'))) {
        console.log('Got 401, attempting token refresh and retry...');
        const { error: refreshError } = await supabase.auth.refreshSession();

        if (refreshError) {
          throw new Error('Session expired. Please sign in again.');
        }

        // Single retry with fresh token
        const retryResult = await supabase.functions.invoke('create-agent', {
          body: requestBody,
        });
        data = retryResult.data;
        error = retryResult.error;

        if (error) {
          throw new Error('Authentication failed after retry. Please sign out and sign back in.');
        }
      } else if (error) {
        // Non-auth error
        console.error('Create agent error:', error);
        const errorMessage = error.message || error.context?.message || 'Failed to create agent';
        throw new Error(errorMessage);
      }

      // Check if the response contains an error
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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]">
      <Navigation />
      
      <main className="flex-1 pt-28 pb-12">
        <div className="max-w-xl mx-auto px-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link to="/admin/agents">
              <Button variant="ghost" size="icon" className="hover:bg-gold/10">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="heading-section">Add Agent</h1>
              <p className="text-sm text-muted-foreground">Create a new agent account</p>
            </div>
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
                  Enter the agent's details and assign their hierarchy
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

              {/* Hierarchy Assignment */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Team Assignment *</Label>
                <Select
                  value={formData.hierarchyId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, hierarchyId: value }))}
                  disabled={loadingOptions}
                >
                  <SelectTrigger className="border-[#E5E2DB]">
                    <SelectValue placeholder={loadingOptions ? "Loading..." : "Select team"} />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    {hierarchyOptions.length === 0 ? (
                      <SelectItem value="__empty__" disabled className="text-muted-foreground">
                        No options available
                      </SelectItem>
                    ) : (
                      hierarchyOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.label}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {hierarchyOptions.length === 0 && !loadingOptions && (
                  <div className="space-y-1">
                    <p className="text-xs text-destructive">
                      No teams found. You must own at least one team to create agents.
                    </p>
                    <Link 
                      to="/admin/hierarchy" 
                      className="text-xs text-gold hover:underline inline-block"
                    >
                      Go to Hierarchy Management →
                    </Link>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Select a team you own to assign this agent to
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
        </div>
      </main>

      <Footer />
    </div>
  );
}
