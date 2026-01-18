import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';

interface PotentialManager {
  id: string; // profile id
  full_name: string | null;
  email: string | null;
}

interface HierarchyAssignmentPanelProps {
  profileId: string; // The profile.id of the agent being assigned
  currentManagerId: string | null; // Current manager_id value
  onSave: () => void;
}

// Special value for "no manager" option
const NO_MANAGER = '__none__';

export function HierarchyAssignmentPanel({
  profileId,
  currentManagerId,
  onSave,
}: HierarchyAssignmentPanelProps) {
  const [managerId, setManagerId] = useState<string | null>(currentManagerId);
  const [potentialManagers, setPotentialManagers] = useState<PotentialManager[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch potential managers (users who can have downlines)
  useEffect(() => {
    async function fetchPotentialManagers() {
      setLoading(true);

      try {
        // Get users with manager, admin, or super_admin roles
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('user_id')
          .in('role', ['manager', 'admin', 'super_admin']);

        if (roleError) throw roleError;

        const managerUserIds = roleData?.map((r) => r.user_id) || [];

        if (managerUserIds.length === 0) {
          setPotentialManagers([]);
          setLoading(false);
          return;
        }

        // Fetch profiles for these users, excluding the current agent
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('user_id', managerUserIds)
          .neq('id', profileId) // Can't report to yourself
          .eq('is_active', true)
          .order('full_name');

        if (profilesError) throw profilesError;

        setPotentialManagers(profilesData || []);
      } catch (error) {
        console.error('Error fetching potential managers:', error);
        toast.error('Failed to load manager options');
      } finally {
        setLoading(false);
      }
    }

    fetchPotentialManagers();
  }, [profileId]);

  const handleSave = async (newManagerId: string | null) => {
    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ manager_id: newManagerId })
        .eq('id', profileId);

      if (error) throw error;

      toast.success('Manager assignment saved');
      onSave();
    } catch (error) {
      console.error('Error saving manager assignment:', error);
      toast.error('Failed to save manager assignment');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (value: string) => {
    const newManagerId = value === NO_MANAGER ? null : value;
    setManagerId(newManagerId);

    // Auto-save on change
    handleSave(newManagerId);
  };

  // Get the current manager's name for display
  const currentManagerName = managerId
    ? potentialManagers.find((m) => m.id === managerId)?.full_name || 'Unknown'
    : null;

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading manager options...
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h4 className="font-medium text-foreground">Reports To</h4>
        </div>
        {saving && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving...
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="manager-select">Manager / Upline</Label>
        <Select
          value={managerId || NO_MANAGER}
          onValueChange={handleChange}
        >
          <SelectTrigger id="manager-select">
            <SelectValue placeholder="Select manager..." />
          </SelectTrigger>
          <SelectContent>
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
      </div>

      {/* Current Assignment Summary */}
      <div className="pt-2 border-t border-border">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium">Current: </span>
          {currentManagerName ? (
            <>Reports to {currentManagerName}</>
          ) : (
            <>Direct to TIG (no upline)</>
          )}
        </p>
      </div>
    </div>
  );
}
