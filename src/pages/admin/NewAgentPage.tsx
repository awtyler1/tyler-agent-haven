import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, UserPlus, Users, Search, Check } from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';

interface AgentOption {
  id: string;
  full_name: string | null;
  manager_id: string | null;
}

// Quick pick manager names (same as AssignManagerModal)
const QUICK_PICK_NAMES = [
  'Eric Price',
  'Traci O\'Brien',
  'Jay Eldridge',
  'Andrew Horn',
];

export default function NewAgentPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allAgents, setAllAgents] = useState<AgentOption[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  // Manager selection state (same pattern as AssignManagerModal)
  // undefined = nothing selected, null = Direct to TIG, string = specific manager
  const [selectedManagerId, setSelectedManagerId] = useState<string | null | undefined>(undefined);
  const [isAandA, setIsAandA] = useState(false);

  const hasManagerSelection = isAandA || selectedManagerId !== undefined;

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    setLoadingAgents(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, manager_id')
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      setAllAgents(data || []);
    } catch (err) {
      console.error('Error fetching agents:', err);
      toast.error('Failed to load manager options');
    } finally {
      setLoadingAgents(false);
    }
  };

  // Build quick picks from the agents list
  const quickPicks = useMemo(() => {
    const picks: Array<{ id: string; name: string }> = [];

    QUICK_PICK_NAMES.forEach((name) => {
      const agent = allAgents.find(
        (a) => a.full_name?.toLowerCase() === name.toLowerCase()
      );
      if (agent) {
        picks.push({ id: agent.id, name: agent.full_name || name });
      }
    });

    return picks;
  }, [allAgents]);

  // Filter agents for the list
  const filteredAgents = useMemo(() => {
    if (!searchQuery) return allAgents;
    const search = searchQuery.toLowerCase();
    return allAgents.filter((agent) =>
      agent.full_name?.toLowerCase().includes(search)
    );
  }, [allAgents, searchQuery]);

  // Get manager name for display
  const getManagerDisplayName = (managerId: string | null): string => {
    if (!managerId) return 'Direct to TIG';
    const mgr = allAgents.find((a) => a.id === managerId);
    return mgr?.full_name || 'Unknown';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !email.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!hasManagerSelection) {
      toast.error('Please select a manager assignment');
      return;
    }

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
        throw new Error('You do not have admin permissions.');
      }

      // Build request body based on selection
      const requestBody = {
        email: email.trim(),
        fullName: fullName.trim(),
        managerId: isAandA ? null : selectedManagerId,
        ownershipGroup: isAandA ? 'a_and_a' : null,
        sendSetupEmail: true,
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
        const errorMessage = data?.error || data?.message || `Request failed with status ${response.status}`;
        throw new Error(errorMessage);
      }

      if (data && 'error' in data) {
        throw new Error(data.error || 'Failed to create agent');
      }

      toast.success('Agent created! They will receive a welcome email with setup instructions.');
      navigate('/admin');
    } catch (err: any) {
      console.error('Error creating agent:', err);
      const errorMessage = err?.message || 'Failed to create agent';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout maxWidth="narrow">
      {/* Compact Header */}
      <div className="mb-4">
        <h1 className="text-xl font-serif font-medium text-foreground">Start Agent Contracting</h1>
        <p className="text-sm text-muted-foreground">Add a new agent to begin the contracting process</p>
      </div>

      {/* Form Card */}
      <div className="bg-white border border-stone-200/50 rounded-xl px-5 py-4">
        {/* Card Header - Compact */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-stone-100">
          <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
            <Users className="w-4 h-4 text-gold" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground text-sm">Agent Information</h2>
            <p className="text-xs text-muted-foreground">Enter details and assign manager</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name + Email - Two columns on md+ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-sm font-medium">Full Name *</Label>
              <Input
                id="fullName"
                placeholder="John Smith"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="agent@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Manager Selection - Compact */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Reports To *</Label>

            {/* Quick Picks - Single row */}
            {!loadingAgents && (
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => { setSelectedManagerId(null); setIsAandA(false); }}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                    selectedManagerId === null && !isAandA
                      ? 'bg-gold/10 border-gold text-gold font-medium'
                      : 'border-stone-200/50 hover:border-muted-foreground/50 text-foreground'
                  }`}
                >
                  Direct to TIG
                </button>
                <button
                  type="button"
                  onClick={() => { setIsAandA(true); setSelectedManagerId(undefined); }}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                    isAandA
                      ? 'bg-gold/10 border-gold text-gold font-medium'
                      : 'border-stone-200/50 hover:border-muted-foreground/50 text-foreground'
                  }`}
                >
                  A&A
                </button>
                {quickPicks.map((pick) => {
                  const isSelected = selectedManagerId === pick.id && !isAandA;
                  return (
                    <button
                      type="button"
                      key={pick.id}
                      onClick={() => { setSelectedManagerId(pick.id); setIsAandA(false); }}
                      className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                        isSelected
                          ? 'bg-gold/10 border-gold text-gold font-medium'
                          : 'border-stone-200/50 hover:border-muted-foreground/50 text-foreground'
                      }`}
                    >
                      {pick.name}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Search + Agent List - Compact */}
            <div className="space-y-1.5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search all agents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 text-sm"
                />
              </div>

              <div className="border border-stone-200/50 rounded-xl max-h-[140px] overflow-y-auto">
                {loadingAgents ? (
                  <div className="p-3 flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredAgents.length === 0 ? (
                  <div className="p-3 text-center text-xs text-muted-foreground">
                    {searchQuery ? 'No agents match your search' : 'No agents available'}
                  </div>
                ) : (
                  filteredAgents.map((agent) => {
                    const isSelected = selectedManagerId === agent.id && !isAandA;
                    const managerDisplay = getManagerDisplayName(agent.manager_id);

                    return (
                      <button
                        type="button"
                        key={agent.id}
                        onClick={() => { setSelectedManagerId(agent.id); setIsAandA(false); }}
                        className={`w-full text-left px-3 py-2.5 border-b border-stone-100 last:border-b-0 hover:bg-muted/50 transition-colors flex items-center justify-between ${
                          isSelected ? 'bg-gold/10 border-l-2 border-l-gold' : ''
                        }`}
                      >
                        <div>
                          <p className="font-medium text-xs">{agent.full_name || 'Unnamed Agent'}</p>
                          <p className="text-[10px] text-muted-foreground">under {managerDisplay}</p>
                        </div>
                        {isSelected && <Check className="h-3.5 w-3.5 text-gold" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Submit Buttons - Compact */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !hasManagerSelection}
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
                  Start Contracting
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
