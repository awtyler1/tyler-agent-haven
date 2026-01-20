import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Search, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

interface AgentOption {
  id: string;
  full_name: string | null;
  manager_id: string | null;
}

// Quick pick manager names (looked up from agents list)
const QUICK_PICK_NAMES = [
  'Eric Price',
  'Traci O\'Brien',
  'Jay Eldridge',
  'Andrew Horn',
];

interface AssignManagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentIds: string[];
  agentName?: string; // For display when single agent
  currentManagerId?: string | null; // Only relevant for single agent
  currentOwnershipGroup?: string | null; // Only relevant for single agent
  onSuccess: () => void;
}

export function AssignManagerModal({
  open,
  onOpenChange,
  agentIds,
  agentName,
  currentManagerId,
  currentOwnershipGroup,
  onSuccess,
}: AssignManagerModalProps) {
  const [allAgents, setAllAgents] = useState<AgentOption[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  // undefined = nothing selected yet, null = Direct to TIG, string = specific manager
  const [selectedManagerId, setSelectedManagerId] = useState<string | null | undefined>(undefined);
  const [isAandA, setIsAandA] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isBulk = agentIds.length > 1;
  const isCurrentlyAandA = !isBulk && currentOwnershipGroup === 'a_and_a';

  // Check if user has made a selection
  const hasSelection = isAandA || selectedManagerId !== undefined;

  // Reset state when modal opens - start with nothing selected
  useEffect(() => {
    if (open) {
      setSearchQuery('');
      setSelectedManagerId(undefined); // Nothing selected initially
      setIsAandA(false);
      setSaveStatus('idle');
      setError(null);
      fetchAgents();
    }
  }, [open]);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id, full_name, manager_id')
        .eq('is_active', true)
        .order('full_name');

      if (fetchError) throw fetchError;
      setAllAgents(data || []);
    } catch (err) {
      console.error('Error fetching agents:', err);
      setError('Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  // Get manager name for display in list
  const getManagerDisplayName = (managerId: string | null): string => {
    if (!managerId) return 'Direct to TIG';
    const mgr = allAgents.find((a) => a.id === managerId);
    return mgr?.full_name || 'Unknown';
  };

  // Check if assigning newManagerId would create a circular reference (single agent only)
  const wouldCreateCycle = (newManagerId: string | null): boolean => {
    if (!newManagerId || isBulk) return false;
    const agentId = agentIds[0];

    // Walk up the chain from the new manager to see if we hit the current agent
    const visited = new Set<string>();
    let currentId: string | null = newManagerId;

    while (currentId) {
      if (currentId === agentId) {
        return true; // Found the current agent in the hierarchy - cycle!
      }
      if (visited.has(currentId)) {
        break; // Already visited, prevent infinite loop
      }
      visited.add(currentId);

      const agent = allAgents.find((a) => a.id === currentId);
      currentId = agent?.manager_id || null;
    }

    return false;
  };

  // Build quick picks from the agents list
  const quickPicks = useMemo(() => {
    const picks: Array<{ id: string; name: string }> = [];

    QUICK_PICK_NAMES.forEach((name) => {
      const agent = allAgents.find(
        (a) => a.full_name?.toLowerCase() === name.toLowerCase()
      );
      if (agent && !agentIds.includes(agent.id)) {
        picks.push({ id: agent.id, name: agent.full_name || name });
      }
    });

    return picks;
  }, [allAgents, agentIds]);

  // Filter agents for the list
  const filteredAgents = useMemo(() => {
    return allAgents.filter((agent) => {
      // Exclude agents being assigned (can't assign to self)
      if (agentIds.includes(agent.id)) return false;

      // For single agent, exclude direct reports (simple cycle prevention)
      if (!isBulk) {
        const agentId = agentIds[0];
        if (agent.manager_id === agentId) return false;
      }

      // Apply search filter
      if (searchQuery) {
        const search = searchQuery.toLowerCase();
        return agent.full_name?.toLowerCase().includes(search);
      }
      return true;
    });
  }, [allAgents, agentIds, searchQuery, isBulk]);

  const handleSave = async () => {
    // Check for circular reference (single agent only)
    if (!isBulk && !isAandA && wouldCreateCycle(selectedManagerId)) {
      setError('Cannot assign: this would create a circular reporting structure');
      return;
    }

    setSaveStatus('saving');
    setError(null);

    try {
      // Build the update payload based on selection
      const updatePayload = isAandA
        ? { manager_id: null, ownership_group: 'a_and_a' }
        : { manager_id: selectedManagerId, ownership_group: null };

      // Update all selected agents
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updatePayload)
        .in('id', agentIds);

      if (updateError) throw updateError;

      setSaveStatus('saved');

      // Show toast
      let successMessage: string;
      if (isAandA) {
        successMessage = isBulk
          ? `${agentIds.length} agents assigned to A&A`
          : 'Now part of A&A team';
      } else {
        const managerName = selectedManagerId
          ? allAgents.find((a) => a.id === selectedManagerId)?.full_name || 'Unknown'
          : 'Direct to TIG';
        successMessage = isBulk
          ? `Manager assigned to ${agentIds.length} agents`
          : `Now reports to ${managerName}`;
      }
      toast.success(successMessage);

      // Wait briefly to show success state, then close
      await new Promise((resolve) => setTimeout(resolve, 600));
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      setSaveStatus('error');
      setError(err.message || 'Failed to update manager');
    }
  };

  const handleClose = () => {
    if (saveStatus === 'saving') return;
    onOpenChange(false);
  };

  // Title and subtitle
  const title = isBulk ? 'Assign Manager' : 'Change Reports To';
  const subtitle = isBulk
    ? `Assign a manager to ${agentIds.length} selected agents`
    : `Select who ${agentName || 'this agent'} reports to`;

  // Get current assignment display for single agent
  const getCurrentAssignmentDisplay = (): string => {
    if (isBulk) return '';
    if (isCurrentlyAandA) return 'A&A';
    if (currentManagerId) {
      const mgr = allAgents.find((a) => a.id === currentManagerId);
      return mgr?.full_name || 'Unknown';
    }
    return 'Direct to TIG';
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
          {/* Show current assignment for single agent */}
          {!isBulk && !loading && (
            <p className="text-sm text-muted-foreground mt-1">
              Currently:{' '}
              <span className="font-medium text-foreground">{getCurrentAssignmentDisplay()}</span>
            </p>
          )}
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Quick Picks */}
          {!loading && !searchQuery && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Quick Picks
              </p>
              <div className="flex flex-wrap gap-2">
                {/* Direct to TIG */}
                <button
                  onClick={() => {
                    setSelectedManagerId(null);
                    setIsAandA(false);
                  }}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                    selectedManagerId === null && !isAandA
                      ? 'bg-gold/10 border-gold text-gold font-medium'
                      : 'border-border hover:border-muted-foreground/50 text-foreground'
                  }`}
                >
                  Direct to TIG
                </button>

                {/* A&A - special handling */}
                <button
                  onClick={() => {
                    setIsAandA(true);
                    setSelectedManagerId(undefined);
                  }}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                    isAandA
                      ? 'bg-gold/10 border-gold text-gold font-medium'
                      : 'border-border hover:border-muted-foreground/50 text-foreground'
                  }`}
                >
                  A&A
                </button>

                {/* Manager quick picks */}
                {quickPicks.map((pick) => {
                  const isSelected = selectedManagerId === pick.id && !isAandA;
                  return (
                    <button
                      key={pick.id}
                      onClick={() => {
                        setSelectedManagerId(pick.id);
                        setIsAandA(false);
                      }}
                      className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                        isSelected
                          ? 'bg-gold/10 border-gold text-gold font-medium'
                          : 'border-border hover:border-muted-foreground/50 text-foreground'
                      }`}
                    >
                      {pick.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Agent List */}
          <div>
            {!loading && !searchQuery && (
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                All Agents
              </p>
            )}
            <div className="border rounded-md max-h-[300px] overflow-y-auto">
              {loading ? (
                <div className="p-8 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredAgents.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  {searchQuery ? 'No agents match your search' : 'No agents available'}
                </div>
              ) : (
                filteredAgents.map((agent) => {
                  const isSelected = selectedManagerId === agent.id && !isAandA;
                  const isCurrent = !isBulk && currentManagerId === agent.id && !isCurrentlyAandA;
                  const managerDisplay = getManagerDisplayName(agent.manager_id);

                  return (
                    <button
                      key={agent.id}
                      onClick={() => {
                        setSelectedManagerId(agent.id);
                        setIsAandA(false);
                      }}
                      className={`w-full text-left p-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors flex items-center justify-between ${
                        isSelected ? 'bg-gold/10 border-l-2 border-l-gold' : ''
                      }`}
                    >
                      <div>
                        <p className="font-medium flex items-center gap-2">
                          {agent.full_name || 'Unnamed Agent'}
                          {isCurrent && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              current
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">under {managerDisplay}</p>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-gold" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={saveStatus === 'saving'}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveStatus === 'saving' || saveStatus === 'saved' || loading || !hasSelection}
            className={`gap-2 min-w-[80px] ${saveStatus === 'saved' ? 'bg-green-600 hover:bg-green-600' : ''}`}
          >
            {saveStatus === 'saving' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : saveStatus === 'saved' ? (
              <>
                <Check className="h-4 w-4" />
                Saved!
              </>
            ) : (
              'Save'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
