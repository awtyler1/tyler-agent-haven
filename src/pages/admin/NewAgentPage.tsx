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
  type: 'team' | 'downline';
  entityId?: string;
  uplineUserId?: string;
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
      const options: HierarchyOption[] = [];

      // Fetch teams from hierarchy_entities
      const { data: teams, error: teamsError } = await supabase
        .from('hierarchy_entities')
        .select('id, name')
        .eq('entity_type', 'team')
        .eq('is_active', true);

      if (teamsError) throw teamsError;

      if (teams) {
        teams.forEach(team => {
          options.push({
            id: `team-${team.id}`,
            label: team.name,
            type: 'team',
            entityId: team.id,
          });
        });
      }

      // Fetch Andrew for downline option (dynamic by email)
      const { data: andrewProfile, error: andrewError } = await supabase
        .from('profiles')
        .select('id, user_id, full_name')
        .eq('email', 'andrew@tylerinsurancegroup.com')
        .single();

      if (!andrewError && andrewProfile) {
        options.push({
          id: `downline-${andrewProfile.user_id}`,
          label: andrewProfile.full_name || 'Andrew',
          type: 'downline',
          uplineUserId: andrewProfile.user_id,
        });
      }

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
      toast.error('Please select a hierarchy assignment');
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedOption = hierarchyOptions.find(o => o.id === formData.hierarchyId);
      
      if (!selectedOption) {
        throw new Error('Invalid hierarchy selection');
      }

      const { data, error } = await supabase.functions.invoke('create-agent', {
        body: {
          email: formData.email,
          fullName: formData.fullName,
          hierarchyType: selectedOption.type,
          hierarchyEntityId: selectedOption.entityId || null,
          uplineUserId: selectedOption.uplineUserId || null,
          isExistingAgent: formData.agentType === 'existing',
          sendSetupEmail: formData.sendSetupEmail,
        },
      });

      if (error) throw error;

      const message = formData.agentType === 'existing' 
        ? 'Existing agent added successfully!' 
        : 'New agent created! They will receive a welcome email with setup instructions.';
      
      toast.success(message);
      navigate('/admin/agents');
    } catch (err: any) {
      console.error('Error creating agent:', err);
      toast.error(err.message || 'Failed to create agent');
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
                <Label className="text-sm font-medium">Hierarchy Assignment *</Label>
                <Select
                  value={formData.hierarchyId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, hierarchyId: value }))}
                  disabled={loadingOptions}
                >
                  <SelectTrigger className="border-[#E5E2DB]">
                    <SelectValue placeholder={loadingOptions ? "Loading..." : "Select hierarchy"} />
                  </SelectTrigger>
                  <SelectContent>
                    {hierarchyOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Determines which portal(s) can view this agent
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
