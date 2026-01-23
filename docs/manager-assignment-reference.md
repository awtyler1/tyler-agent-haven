# Manager Assignment Functionality Reference

## Summary

| Location | Status | Details |
|----------|--------|---------|
| AllAgentsTab - Bulk "Assign Manager" | **Placeholder UI only** | Button exists, logs to console, not wired up |
| AllAgentsTab - Quick View "Assign Manager" | **Placeholder UI only** | Button exists, logs to console |
| AgentProfilePage - Hierarchy card | **Fully working** | Modal with search, saves to DB, has cycle detection |
| HierarchyAssignmentPanel | **Working component, unused** | Standalone component, not currently imported anywhere |

---

## 1. AllAgentsTab.tsx - Assign Manager Buttons

### Bulk Action Button (lines 503-511)
**Status: PLACEHOLDER - just logs to console**

```tsx
const handleAssignManager = () => {
  console.log('Assign manager to:', Array.from(selectedIds));
  // TODO: Implement bulk assign
};

// In the bulk action bar:
<Button
  variant="outline"
  size="sm"
  className="bg-white"
  onClick={handleAssignManager}
>
  Assign Manager...
</Button>
```

### Quick View Panel Button (lines 742-748)
**Status: PLACEHOLDER - just logs to console**

```tsx
<Button
  variant="outline"
  className="w-full"
  onClick={() => console.log('Assign manager for:', selectedAgent.id)}
>
  Assign Manager
</Button>
```

---

## 2. AgentProfilePage.tsx - Hierarchy Card (FULLY WORKING)

### Location in UI
The "Hierarchy" card appears on the agent profile page with:
- "Reports To" section showing current manager (clickable link)
- Pencil icon to open the assignment modal
- "Direct Reports" section showing agents who report to this agent

### State Management (lines 191-202)
```tsx
// Hierarchy assignment modal state
interface AgentOption {
  id: string;
  full_name: string | null;
  manager_id: string | null;
}
const [isHierarchyModalOpen, setIsHierarchyModalOpen] = useState(false);
const [allAgents, setAllAgents] = useState<AgentOption[]>([]);
const [hierarchySearch, setHierarchySearch] = useState('');
const [selectedManagerId, setSelectedManagerId] = useState<string | null>(null);
const [hierarchySaveStatus, setHierarchySaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
const [hierarchyError, setHierarchyError] = useState<string | null>(null);
```

### Save Handler (lines 971-1008)
```tsx
const handleSaveHierarchy = async () => {
  if (!profile) return;

  // Check for circular reference
  if (wouldCreateCycle(selectedManagerId)) {
    setHierarchyError('Cannot assign: this would create a circular reporting structure');
    return;
  }

  setHierarchySaveStatus('saving');
  setHierarchyError(null);

  const originalManagerId = profile.manager_id;

  // Optimistic update
  setProfile({ ...profile, manager_id: selectedManagerId });

  // Update manager display
  if (selectedManagerId) {
    const newMgr = allAgents.find((a) => a.id === selectedManagerId);
    setManager(newMgr ? { id: newMgr.id, full_name: newMgr.full_name, email: null } : null);
  } else {
    setManager(null);
  }

  try {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ manager_id: selectedManagerId })
      .eq('id', profile.id);

    if (updateError) throw updateError;

    setHierarchySaveStatus('saved');
    // Show success briefly before closing
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsHierarchyModalOpen(false);
  } catch (err: any) {
    // Revert on error
    setProfile({ ...profile, manager_id: originalManagerId });
    setHierarchySaveStatus('error');
    setHierarchyError(err.message || 'Failed to save hierarchy');
  }
};
```

### UI Display in Hierarchy Card (lines 1701-1715)
```tsx
{/* Reports To */}
<div className="flex items-center justify-between p-3 rounded-lg border">
  <div>
    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
      Reports To
      {canEdit && (
        <button
          onClick={handleOpenHierarchyModal}
          className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          title="Change manager"
        >
          <Pencil className="h-3 w-3" />
        </button>
      )}
    </p>
    {/* Manager name or "Direct to TIG" displayed below */}
  </div>
</div>
```

### Modal UI (lines 2038-2110)
```tsx
{/* Hierarchy Assignment Modal */}
<Dialog open={isHierarchyModalOpen} onOpenChange={(open) => !open && handleCloseHierarchyModal()}>
  <DialogContent className="max-w-lg">
    <DialogHeader>
      <DialogTitle>Change Reports To</DialogTitle>
      <p className="text-sm text-muted-foreground">
        Select who {profile?.full_name || 'this agent'} reports to
      </p>
    </DialogHeader>

    <div className="space-y-4 py-2">
      {/* Error display */}
      {hierarchyError && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200">
          <p className="text-sm text-red-700">{hierarchyError}</p>
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search agents..."
          value={hierarchySearch}
          onChange={(e) => setHierarchySearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Agent List */}
      <div className="border rounded-md max-h-[400px] overflow-y-auto">
        {/* TIG (Direct) Option */}
        <button
          onClick={() => setSelectedManagerId(null)}
          className={`w-full text-left p-3 border-b hover:bg-muted/50 transition-colors flex items-center justify-between ${
            selectedManagerId === null ? 'bg-gold/10 border-l-2 border-l-gold' : ''
          }`}
        >
          <div>
            <p className="font-medium flex items-center gap-2">
              TIG (Direct)
              {profile?.manager_id === null && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  current
                </span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">Reports directly to Tyler Insurance Group</p>
          </div>
          {selectedManagerId === null && (
            <Check className="h-4 w-4 text-gold" />
          )}
        </button>

        {/* Agent Options - scrollable list */}
        {filteredAgents.map((agent) => (
          <button
            key={agent.id}
            onClick={() => setSelectedManagerId(agent.id)}
            className={`w-full text-left p-3 border-b last:border-b-0 hover:bg-muted/50 ...`}
          >
            {/* Agent name, their manager, current indicator */}
          </button>
        ))}
      </div>
    </div>

    <DialogFooter>
      <Button variant="outline" onClick={handleCloseHierarchyModal}>
        Cancel
      </Button>
      <Button onClick={handleSaveHierarchy} disabled={hierarchySaveStatus === 'saving'}>
        {hierarchySaveStatus === 'saving' ? 'Saving...' : 'Save'}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## 3. HierarchyAssignmentPanel.tsx (WORKING BUT UNUSED)

**Path:** `src/components/admin/HierarchyAssignmentPanel.tsx`

This is a standalone component that provides a dropdown for assigning managers. It's fully functional but **not currently used anywhere** in the app.

```tsx
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

  // Fetch potential managers (any active profile can be a manager)
  useEffect(() => {
    async function fetchPotentialManagers() {
      setLoading(true);

      try {
        // Fetch all active profiles, excluding the current agent
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
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

  // ... rest of component renders a Select dropdown with "None (Direct to TIG)" option
}
```

**Features:**
- Fetches all active profiles as potential managers
- Excludes the current agent (can't report to yourself)
- Auto-saves on selection change
- Shows loading/saving states
- Shows current assignment summary

**Missing vs AgentProfilePage modal:**
- No search functionality
- No circular reference detection
- No visual indication of current manager

---

## 4. Database: manager_id Column

### Column Definition (migration 20251208155930)
```sql
-- Add manager_id to profiles for broker manager assignment
ALTER TABLE public.profiles ADD COLUMN manager_id UUID REFERENCES public.profiles(id);
```

### Key Points
- **Type:** UUID, nullable
- **Foreign Key:** Self-referential to `profiles.id`
- **No cascade:** Deleting a manager doesn't auto-update agents' manager_id
- **No triggers:** No automatic actions on manager_id changes
- **No unique constraint:** Multiple agents can have the same manager

### RLS Policies Using manager_id
Several policies use `manager_id` for access control:

```sql
-- Managers can view team profiles
CREATE POLICY "Managers can view team profiles" ON public.profiles
  FOR SELECT USING (has_role(auth.uid(), 'manager') AND manager_id = get_my_profile_id());

-- Managers can view their team's user_roles
CREATE POLICY "Managers can view team user_roles" ON public.user_roles
  FOR SELECT USING (
    has_role(auth.uid(), 'manager') AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = user_roles.user_id
      AND profiles.manager_id = get_my_profile_id()
    )
  );
```

### Updating manager_id
Simple UPDATE is all that's needed:

```typescript
const { error } = await supabase
  .from('profiles')
  .update({ manager_id: newManagerId }) // null = Direct to TIG
  .eq('id', profileId);
```

---

## Recommendations for Teams Tab Removal

1. **AllAgentsTab "Assign Manager" buttons need implementation:**
   - Option A: Open the same modal as AgentProfilePage (extract to shared component)
   - Option B: Use HierarchyAssignmentPanel in a dialog
   - Option C: Navigate to agent profile page

2. **The working implementation in AgentProfilePage has:**
   - Search functionality
   - Circular reference detection (`wouldCreateCycle`)
   - Visual indication of current manager
   - "TIG Direct" option
   - Optimistic updates with rollback

3. **HierarchyAssignmentPanel could be enhanced or removed:**
   - It's simpler but lacks search and cycle detection
   - Could be deleted if AgentProfilePage modal is extracted

4. **Bulk assign would need:**
   - Multi-select aware modal
   - Handle case where agents have different current managers
   - Consider if all selected agents should get same manager
