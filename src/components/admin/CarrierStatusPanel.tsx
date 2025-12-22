import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { 
  Loader2, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Circle,
  Plus,
  Link as LinkIcon,
  ExternalLink,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type ContractingStatus = 'not_started' | 'in_progress' | 'contracted' | 'issue';

interface Carrier {
  id: string;
  name: string;
  code: string;
}

interface CarrierStatus {
  id: string;
  carrier_id: string;
  carrier_name: string;
  contracting_status: ContractingStatus;
  contracted_at: string | null;
  issue_description: string | null;
  contracting_link_url: string | null;
  contracting_link_sent_at: string | null;
}

interface CarrierStatusPanelProps {
  userId: string;
  residentState: string | null;
}

const STATUS_CONFIG: Record<ContractingStatus, { label: string; color: string; icon: typeof Circle }> = {
  not_started: { label: 'Not Started', color: 'text-gray-400', icon: Circle },
  in_progress: { label: 'In Progress', color: 'text-amber-500', icon: Clock },
  contracted: { label: 'Contracted', color: 'text-green-500', icon: CheckCircle },
  issue: { label: 'Issue', color: 'text-red-500', icon: AlertCircle },
};

export function CarrierStatusPanel({ userId, residentState }: CarrierStatusPanelProps) {
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [defaultCarrierIds, setDefaultCarrierIds] = useState<Set<string>>(new Set());
  const [statuses, setStatuses] = useState<CarrierStatus[]>([]);
  const [selectedCarriers, setSelectedCarriers] = useState<Set<string>>(new Set());
  
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [updatingCarrier, setUpdatingCarrier] = useState<string | null>(null);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [linkValue, setLinkValue] = useState('');

  // Fetch carriers, defaults, and existing statuses
  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      try {
        // Fetch all active carriers
        const { data: carriersData, error: carriersError } = await supabase
          .from('carriers')
          .select('id, name, code')
          .eq('is_active', true)
          .order('name');

        if (carriersError) throw carriersError;
        setCarriers(carriersData || []);

        // Fetch state defaults if we have a resident state
        if (residentState) {
          const { data: defaultsData, error: defaultsError } = await supabase
            .from('state_carriers')
            .select('carrier_id')
            .eq('state_code', residentState)
            .eq('is_default', true);

          if (!defaultsError && defaultsData) {
            setDefaultCarrierIds(new Set(defaultsData.map(d => d.carrier_id).filter((id): id is string => id !== null)));
          }
        }

        // Fetch existing carrier statuses for this user
        const { data: statusesData, error: statusesError } = await supabase
          .from('carrier_statuses')
          .select(`
            id,
            carrier_id,
            contracting_status,
            contracted_at,
            issue_description,
            contracting_link_url,
            contracting_link_sent_at,
            carriers (name)
          `)
          .eq('user_id', userId);

        if (statusesError) throw statusesError;

        const mappedStatuses: CarrierStatus[] = (statusesData || []).map(s => ({
          id: s.id,
          carrier_id: s.carrier_id,
          carrier_name: (s.carriers as { name: string })?.name || 'Unknown',
          contracting_status: s.contracting_status as ContractingStatus,
          contracted_at: s.contracted_at,
          issue_description: s.issue_description,
          contracting_link_url: s.contracting_link_url,
          contracting_link_sent_at: s.contracting_link_sent_at,
        }));

        setStatuses(mappedStatuses);
        setSelectedCarriers(new Set(mappedStatuses.map(s => s.carrier_id)));

      } catch (error) {
        console.error('Error fetching carrier data:', error);
        toast.error('Failed to load carrier information');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [userId, residentState]);

  const handleToggleCarrier = (carrierId: string) => {
    setSelectedCarriers(prev => {
      const next = new Set(prev);
      if (next.has(carrierId)) {
        next.delete(carrierId);
      } else {
        next.add(carrierId);
      }
      return next;
    });
  };

  const handleInitializeStatuses = async () => {
    setInitializing(true);

    try {
      // Find carriers that need to be added
      const existingCarrierIds = new Set(statuses.map(s => s.carrier_id));
      const carriersToAdd = Array.from(selectedCarriers)
        .filter(id => !existingCarrierIds.has(id));

      // Find carriers that need to be removed
      const carriersToRemove = statuses
        .filter(s => !selectedCarriers.has(s.carrier_id))
        .map(s => s.id);

      // Remove unselected carriers
      if (carriersToRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('carrier_statuses')
          .delete()
          .in('id', carriersToRemove);

        if (deleteError) throw deleteError;
      }

      // Add new carriers
      if (carriersToAdd.length > 0) {
        const { error: insertError } = await supabase
          .from('carrier_statuses')
          .insert(
            carriersToAdd.map(carrierId => ({
              user_id: userId,
              carrier_id: carrierId,
              contracting_status: 'not_started',
            }))
          );

        if (insertError) throw insertError;
      }

      // Refetch statuses
      const { data: statusesData, error: statusesError } = await supabase
        .from('carrier_statuses')
        .select(`
          id,
          carrier_id,
          contracting_status,
          contracted_at,
          issue_description,
          contracting_link_url,
          contracting_link_sent_at,
          carriers (name)
        `)
        .eq('user_id', userId);

      if (statusesError) throw statusesError;

      const mappedStatuses: CarrierStatus[] = (statusesData || []).map(s => ({
        id: s.id,
        carrier_id: s.carrier_id,
        carrier_name: (s.carriers as { name: string })?.name || 'Unknown',
        contracting_status: s.contracting_status as ContractingStatus,
        contracted_at: s.contracted_at,
        issue_description: s.issue_description,
        contracting_link_url: s.contracting_link_url,
        contracting_link_sent_at: s.contracting_link_sent_at,
      }));

      setStatuses(mappedStatuses);
      toast.success('Carrier assignments updated');

    } catch (error) {
      console.error('Error initializing carrier statuses:', error);
      toast.error('Failed to update carrier assignments');
    } finally {
      setInitializing(false);
    }
  };

  const handleStatusChange = async (statusId: string, newStatus: ContractingStatus) => {
    setUpdatingCarrier(statusId);

    try {
      const updateData: Record<string, unknown> = {
        contracting_status: newStatus,
      };

      // Set contracted_at when moving to contracted
      if (newStatus === 'contracted') {
        updateData.contracted_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('carrier_statuses')
        .update(updateData)
        .eq('id', statusId);

      if (error) throw error;

      // Update local state
      setStatuses(prev => prev.map(s => 
        s.id === statusId 
          ? { ...s, contracting_status: newStatus, contracted_at: newStatus === 'contracted' ? new Date().toISOString() : s.contracted_at }
          : s
      ));

    } catch (error) {
      console.error('Error updating carrier status:', error);
      toast.error('Failed to update status');
    } finally {
      setUpdatingCarrier(null);
    }
  };

  const handleSaveLink = async (statusId: string) => {
    setUpdatingCarrier(statusId);
    try {
      const updates: Record<string, unknown> = {
        contracting_link_url: linkValue || null,
      };
      
      // Set sent timestamp if adding a new link
      const currentStatus = statuses.find(s => s.id === statusId);
      if (linkValue && !currentStatus?.contracting_link_sent_at) {
        updates.contracting_link_sent_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('carrier_statuses')
        .update(updates)
        .eq('id', statusId);

      if (error) throw error;

      setStatuses(prev => prev.map(s => 
        s.id === statusId 
          ? { 
              ...s, 
              contracting_link_url: linkValue || null,
              contracting_link_sent_at: linkValue && !s.contracting_link_sent_at 
                ? new Date().toISOString() 
                : s.contracting_link_sent_at
            }
          : s
      ));
      
      setEditingLinkId(null);
      setLinkValue('');
      toast.success('Contracting link saved');
    } catch (error) {
      console.error('Error saving link:', error);
      toast.error('Failed to save link');
    } finally {
      setUpdatingCarrier(null);
    }
  };

  // Check if carrier selection has changed
  const existingCarrierIds = new Set(statuses.map(s => s.carrier_id));
  const hasChanges = 
    Array.from(selectedCarriers).some(id => !existingCarrierIds.has(id)) ||
    Array.from(existingCarrierIds).some(id => !selectedCarriers.has(id));

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading carrier information...
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      <h4 className="font-medium text-foreground">Carrier Contracting Status</h4>

      {/* Carrier Selection */}
      {statuses.length === 0 || hasChanges ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Select carriers for this agent
              </p>
              {residentState && (
                <p className="text-xs text-muted-foreground">
                  ({residentState} defaults pre-selected)
                </p>
              )}
            </div>
            {hasChanges && (
              <Button size="sm" onClick={handleInitializeStatuses} disabled={initializing}>
                {initializing ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus className="h-3 w-3 mr-1" />
                    Apply Changes
                  </>
                )}
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {carriers.map(carrier => {
              const isDefault = defaultCarrierIds.has(carrier.id);
              const isSelected = selectedCarriers.has(carrier.id);
              
              return (
                <label key={carrier.id} className="flex items-center gap-2 p-2 rounded border border-border hover:bg-accent/50 cursor-pointer">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleToggleCarrier(carrier.id)}
                  />
                  <span className="text-sm">{carrier.name}</span>
                  {isDefault && (
                    <span className="text-xs bg-primary/10 text-primary px-1 rounded">Default</span>
                  )}
                </label>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Status List */}
      {statuses.length > 0 && (
        <div className="space-y-2">
          {!hasChanges && (
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">
                {statuses.length} carrier{statuses.length !== 1 ? 's' : ''} assigned
              </p>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  // Show carrier selection by toggling a carrier
                  // This triggers hasChanges to show the selection UI
                }}
              >
                Edit Carriers
              </Button>
            </div>
          )}

          {statuses.map(status => {
            const config = STATUS_CONFIG[status.contracting_status];
            const Icon = config.icon;
            const isUpdating = updatingCarrier === status.id;
            const isEditingLink = editingLinkId === status.id;

            return (
              <div key={status.id} className="space-y-2 p-3 rounded-lg bg-muted/30 border border-border/50">
                {/* Main row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={cn('h-4 w-4', config.color)} />
                    <span className="text-sm font-medium">{status.carrier_name}</span>
                    {status.contracting_link_url && (
                      <a href={status.contracting_link_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>

                  <Select
                    value={status.contracting_status}
                    onValueChange={(value) => handleStatusChange(status.id, value as ContractingStatus)}
                    disabled={isUpdating}
                  >
                    <SelectTrigger className="w-[140px] h-8">
                      {isUpdating ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <SelectValue />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_CONFIG).map(([value, cfg]) => {
                        const StatusIcon = cfg.icon;
                        return (
                          <SelectItem key={value} value={value}>
                            <div className="flex items-center gap-2">
                              <StatusIcon className={cn('h-3 w-3', cfg.color)} />
                              <span>{cfg.label}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Link row */}
                {isEditingLink ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={linkValue}
                      onChange={(e) => setLinkValue(e.target.value)}
                      placeholder="Paste contracting link URL..."
                      className="h-8 text-sm flex-1"
                      autoFocus
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => {
                        setEditingLinkId(null);
                        setLinkValue('');
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      className="h-8"
                      onClick={() => handleSaveLink(status.id)}
                      disabled={isUpdating}
                    >
                      Save
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs">
                    {status.contracting_link_url ? (
                      <a 
                        href={status.contracting_link_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground flex items-center gap-1 truncate max-w-[200px]"
                      >
                        <LinkIcon className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{status.contracting_link_url}</span>
                      </a>
                    ) : (
                      <span className="text-muted-foreground">No contracting link</span>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => {
                        setEditingLinkId(status.id);
                        setLinkValue(status.contracting_link_url || '');
                      }}
                    >
                      {status.contracting_link_url ? 'Edit' : 'Add Link'}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {statuses.length === 0 && selectedCarriers.size === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No carriers assigned yet. Select carriers above to begin.
        </p>
      )}
    </div>
  );
}
