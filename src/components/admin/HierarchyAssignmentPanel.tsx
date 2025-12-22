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
import { Loader2, Users, Building2, User, Briefcase } from 'lucide-react';
import { toast } from 'sonner';

type HierarchyType = 'direct' | 'team' | 'downline' | 'mga' | 'ga' | 'loa' | null;

interface HierarchyEntity {
  id: string;
  name: string;
  entity_type: 'team' | 'mga' | 'ga';
  is_active: boolean;
}

interface UplineUser {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
}

interface HierarchyAssignmentPanelProps {
  userId: string;
  currentHierarchyType: HierarchyType;
  currentEntityId: string | null;
  currentUplineUserId: string | null;
  onSave: () => void;
}

const HIERARCHY_OPTIONS = [
  { value: 'direct', label: 'Direct to TIG', icon: Building2, description: 'Reports directly to TIG' },
  { value: 'team', label: 'Team Member', icon: Users, description: 'Member of a team (e.g., A&A)' },
  { value: 'downline', label: 'Downline', icon: User, description: 'Under a specific person' },
  { value: 'mga', label: 'Under MGA', icon: Briefcase, description: 'Under a Managing General Agent' },
  { value: 'ga', label: 'Under GA', icon: Briefcase, description: 'Under a General Agent' },
  { value: 'loa', label: 'LOA', icon: Building2, description: 'Licensed Only Agent (W2)' },
] as const;

export function HierarchyAssignmentPanel({
  userId,
  currentHierarchyType,
  currentEntityId,
  currentUplineUserId,
  onSave,
}: HierarchyAssignmentPanelProps) {
  const [hierarchyType, setHierarchyType] = useState<HierarchyType>(currentHierarchyType);
  const [entityId, setEntityId] = useState<string | null>(currentEntityId);
  const [uplineUserId, setUplineUserId] = useState<string | null>(currentUplineUserId);
  
  const [entities, setEntities] = useState<HierarchyEntity[]>([]);
  const [uplineUsers, setUplineUsers] = useState<UplineUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch hierarchy entities and potential upline users
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      try {
        // Fetch hierarchy entities (teams, MGAs, GAs)
        const { data: entitiesData, error: entitiesError } = await supabase
          .from('hierarchy_entities')
          .select('id, name, entity_type, is_active')
          .eq('is_active', true)
          .order('entity_type')
          .order('name');

        if (entitiesError) throw entitiesError;
        setEntities((entitiesData || []) as HierarchyEntity[]);

        // Fetch users who can be uplines (managers and above)
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('id, user_id, full_name, email')
          .eq('is_active', true)
          .order('full_name');

        if (usersError) throw usersError;
        setUplineUsers(usersData || []);

      } catch (error) {
        console.error('Error fetching hierarchy data:', error);
        toast.error('Failed to load hierarchy options');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Reset dependent fields when hierarchy type changes
  useEffect(() => {
    if (hierarchyType !== 'team' && hierarchyType !== 'mga' && hierarchyType !== 'ga') {
      setEntityId(null);
    }
    if (hierarchyType !== 'downline') {
      setUplineUserId(null);
    }
  }, [hierarchyType]);

  const handleSave = async () => {
    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          hierarchy_type: hierarchyType,
          hierarchy_entity_id: entityId,
          upline_user_id: uplineUserId,
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('Hierarchy assignment saved');
      onSave();
    } catch (error) {
      console.error('Error saving hierarchy:', error);
      toast.error('Failed to save hierarchy assignment');
    } finally {
      setSaving(false);
    }
  };

  // Auto-save when selections change
  useEffect(() => {
    // Don't save on initial load
    if (loading) return;
    
    // Check if values have actually changed from props
    const hasChanged = 
      hierarchyType !== currentHierarchyType ||
      entityId !== currentEntityId ||
      uplineUserId !== currentUplineUserId;

    if (hasChanged) {
      const timer = setTimeout(handleSave, 500);
      return () => clearTimeout(timer);
    }
  }, [hierarchyType, entityId, uplineUserId]);

  const teams = entities.filter(e => e.entity_type === 'team');
  const mgas = entities.filter(e => e.entity_type === 'mga');
  const gas = entities.filter(e => e.entity_type === 'ga');

  const showEntityPicker = hierarchyType === 'team' || hierarchyType === 'mga' || hierarchyType === 'ga';
  const showUplinePicker = hierarchyType === 'downline';

  const getEntitiesForType = () => {
    switch (hierarchyType) {
      case 'team': return teams;
      case 'mga': return mgas;
      case 'ga': return gas;
      default: return [];
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading hierarchy options...
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-foreground">Hierarchy Assignment</h4>
        {saving && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving...
          </div>
        )}
      </div>

      {/* Hierarchy Type Selector */}
      <div className="space-y-2">
        <Label>Assignment Type</Label>
        <Select
          value={hierarchyType || ''}
          onValueChange={(value) => setHierarchyType(value as HierarchyType)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select assignment type..." />
          </SelectTrigger>
          <SelectContent>
            {HIERARCHY_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isDisabled = 
                (option.value === 'mga' && mgas.length === 0) ||
                (option.value === 'ga' && gas.length === 0);
              
              return (
                <SelectItem key={option.value} value={option.value} disabled={isDisabled}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="flex items-center gap-1">
                      {option.label}
                      {isDisabled && (
                        <span className="text-xs text-muted-foreground">(none available)</span>
                      )}
                    </span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        {hierarchyType && (
          <p className="text-xs text-muted-foreground">
            {HIERARCHY_OPTIONS.find(o => o.value === hierarchyType)?.description}
          </p>
        )}
      </div>

      {/* Entity Picker (for team/mga/ga) */}
      {showEntityPicker && (
        <div className="space-y-2">
          <Label>
            Select {hierarchyType === 'team' ? 'Team' : hierarchyType?.toUpperCase()}
          </Label>
          <Select value={entityId || ''} onValueChange={setEntityId}>
            <SelectTrigger>
              <SelectValue placeholder={`Select ${hierarchyType}...`} />
            </SelectTrigger>
            <SelectContent>
              {getEntitiesForType().map((entity) => (
                <SelectItem key={entity.id} value={entity.id}>
                  {entity.name}
                </SelectItem>
              ))}
              {getEntitiesForType().length === 0 && (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  No {hierarchyType}s available
                </div>
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Upline User Picker (for downline) */}
      {showUplinePicker && (
        <div className="space-y-2">
          <Label>Select Upline</Label>
          <Select value={uplineUserId || ''} onValueChange={setUplineUserId}>
            <SelectTrigger>
              <SelectValue placeholder="Select upline..." />
            </SelectTrigger>
            <SelectContent>
              {uplineUsers.map((user) => (
                <SelectItem key={user.user_id} value={user.user_id}>
                  <div className="flex flex-col">
                    <span>{user.full_name || 'Unnamed'}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Current Assignment Summary */}
      {hierarchyType && (
        <div className="pt-2 border-t border-border">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Current: </span>
            {hierarchyType === 'direct' && 'Direct to TIG'}
            {hierarchyType === 'loa' && 'LOA (Internal W2)'}
            {hierarchyType === 'team' && entityId && (
              <>Team: {entities.find(e => e.id === entityId)?.name}</>
            )}
            {hierarchyType === 'downline' && uplineUserId && (
              <>Downline of: {uplineUsers.find(u => u.user_id === uplineUserId)?.full_name}</>
            )}
            {hierarchyType === 'mga' && entityId && (
              <>MGA: {entities.find(e => e.id === entityId)?.name}</>
            )}
            {hierarchyType === 'ga' && entityId && (
              <>GA: {entities.find(e => e.id === entityId)?.name}</>
            )}
            {!hierarchyType && 'Not assigned'}
          </p>
        </div>
      )}
    </div>
  );
}
