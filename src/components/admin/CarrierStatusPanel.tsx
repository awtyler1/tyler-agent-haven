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
  ChevronDown,
  ChevronRight,
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
  const [isExpanded, setIsExpanded] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [updatingCarrier, setUpdatingCarrier] = useState<string | null>(null);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [linkValue, setLinkValue] = useState('');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const { data: carriersData, error: carriersError } = await supabase
          .from('carriers')
          .select('id, name, code')
          .eq('is_active', true)
          .order('name');

        if (carriersError) throw carriersError;
        setCarriers(carriersData || []);

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

        const { data: statusesData, error: statusesError } = await supabase
          .from('carrier_statuses')
          .select(`id, carrier_id, contracting_status, contracted_at, issue_description, contracting_link_url, contracting_link_sent_at, carriers (name)`)
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
      if (next.has(carrierId)) next.delete(carrierId);
      else next.add(carrierId);
      return next;
    });
  };

  const handleInitializeStatuses = async () => {
    setInitializing(true);
    try {
      const existingCarrierIds = new Set(statuses.map(s => s.carrier_id));
      const carriersToAdd = Array.from(selectedCarriers).filter(id => !existingCarrierIds.has(id));
      const carriersToRemove = statuses.filter(s => !selectedCarriers.has(s.carrier_id)).map(s => s.id);

      if (carriersToRemove.length > 0) {
        const { error: deleteError } = await supabase.from('carrier_statuses').delete().in('id', carriersToRemove);
        if (deleteError) throw deleteError;
      }

      if (carriersToAdd.length > 0) {
        const { error: insertError } = await supabase.from('carrier_statuses').insert(
          carriersToAdd.map(carrierId => ({ user_id: userId, carrier_id: carrierId, contracting_status: 'not_started' }))
        );
        if (insertError) throw insertError;
      }

      const { data: statusesData, error: statusesError } = await supabase
        .from('carrier_statuses')
        .select(`id, carrier_id, contracting_status, contracted_at, issue_description, contracting_link_url, contracting_link_sent_at, carriers (name)`)
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
      const updateData: Record<string, unknown> = { contracting_status: newStatus };
      if (newStatus === 'contracted') updateData.contracted_at = new Date().toISOString();

      const { error } = await supabase.from('carrier_statuses').update(updateData).eq('id', statusId);
      if (error) throw error;

      setStatuses(prev => prev.map(s => s.id === statusId ? { ...s, contracting_status: newStatus, contracted_at: newStatus === 'contracted' ? new Date().toISOString() : s.contracted_at } : s));
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
      const updates: Record<string, unknown> = { contracting_link_url: linkValue || null };
      const currentStatus = statuses.find(s => s.id === statusId);
      if (linkValue && !currentStatus?.contracting_link_sent_at) updates.contracting_link_sent_at = new Date().toISOString();

      const { error } = await supabase.from('carrier_statuses').update(updates).eq('id', statusId);
      if (error) throw error;

      setStatuses(prev => prev.map(s => s.id === statusId ? { ...s, contracting_link_url: linkValue || null, contracting_link_sent_at: linkValue && !s.contracting_link_sent_at ? new Date().toISOString() : s.contracting_link_sent_at } : s));
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

  const existingCarrierIds = new Set(statuses.map(s => s.carrier_id));
  const hasChanges = Array.from(selectedCarriers).some(id => !existingCarrierIds.has(id)) || Array.from(existingCarrierIds).some(id => !selectedCarriers.has(id));

  const contractedCount = statuses.filter(s => s.contracting_status === 'contracted').length;
  const inProgressCount = statuses.filter(s => s.contracting_status === 'in_progress').length;
  const issueCount = statuses.filter(s => s.contracting_status === 'issue').length;

  if (loading) {
    return (
      <div className="border border-border rounded-lg bg-card">
        <div className="p-3 flex items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading carriers...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      <button onClick={() => setIsExpanded(!isExpanded)} className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-2">
          {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          <span className="font-medium text-sm">Carrier Contracting</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {statuses.length === 0 ? (
            <span className="text-muted-foreground">No carriers</span>
          ) : (
            <>
              {contractedCount > 0 && <span className="flex items-center gap-1 text-green-600"><CheckCircle className="h-3 w-3" />{contractedCount}</span>}
              {inProgressCount > 0 && <span className="flex items-center gap-1 text-amber-500"><Clock className="h-3 w-3" />{inProgressCount}</span>}
              {issueCount > 0 && <span className="flex items-center gap-1 text-red-500"><AlertCircle className="h-3 w-3" />{issueCount}</span>}
              <span className="text-muted-foreground ml-1">{statuses.length} total</span>
            </>
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-border">
          {(statuses.length === 0 || hasChanges) && (
            <div className="p-3 border-b border-border bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs font-medium text-foreground">Select carriers for this agent</p>
                  {residentState && <p className="text-xs text-muted-foreground">({residentState} defaults pre-selected)</p>}
                </div>
                {hasChanges && (
                  <Button size="sm" onClick={handleInitializeStatuses} disabled={initializing} className="h-7 text-xs">
                    {initializing ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Saving...</> : <><Plus className="h-3 w-3 mr-1" />Apply Changes</>}
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {carriers.map(carrier => (
                  <label key={carrier.id} className="flex items-center gap-1.5 text-xs cursor-pointer py-0.5">
                    <Checkbox checked={selectedCarriers.has(carrier.id)} onCheckedChange={() => handleToggleCarrier(carrier.id)} />
                    <span className="truncate">{carrier.name}</span>
                    {defaultCarrierIds.has(carrier.id) && <span className="text-[10px] text-muted-foreground">(Default)</span>}
                  </label>
                ))}
              </div>
            </div>
          )}

          {statuses.length > 0 && (
            <div className="divide-y divide-border">
              {!hasChanges && (
                <div className="px-3 py-2 flex items-center justify-between bg-muted/20">
                  <span className="text-xs text-muted-foreground">{statuses.length} carrier{statuses.length !== 1 ? 's' : ''} assigned</span>
                  <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => { const first = carriers.find(c => !selectedCarriers.has(c.id)); if (first) { handleToggleCarrier(first.id); handleToggleCarrier(first.id); } }}>Edit Carriers</Button>
                </div>
              )}

              {statuses.map(status => {
                const config = STATUS_CONFIG[status.contracting_status];
                const Icon = config.icon;
                const isUpdating = updatingCarrier === status.id;
                const isEditingLink = editingLinkId === status.id;

                return (
                  <div key={status.id} className="px-3 py-2 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Icon className={cn("h-4 w-4 flex-shrink-0", config.color)} />
                        <span className="text-sm font-medium truncate">{status.carrier_name}</span>
                        {status.contracting_link_url && <a href={status.contracting_link_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-muted-foreground hover:text-primary"><ExternalLink className="h-3 w-3" /></a>}
                      </div>
                      <Select value={status.contracting_status} onValueChange={(v) => handleStatusChange(status.id, v as ContractingStatus)} disabled={isUpdating}>
                        <SelectTrigger className="w-[130px] h-7 text-xs">{isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <SelectValue />}</SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_CONFIG).map(([value, cfg]) => {
                            const StatusIcon = cfg.icon;
                            return <SelectItem key={value} value={value} className="text-xs"><div className="flex items-center gap-1.5"><StatusIcon className={cn("h-3 w-3", cfg.color)} />{cfg.label}</div></SelectItem>;
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    {isEditingLink ? (
                      <div className="flex items-center gap-1.5 pl-6">
                        <Input value={linkValue} onChange={(e) => setLinkValue(e.target.value)} placeholder="Paste contracting link URL..." className="h-7 text-xs flex-1" autoFocus />
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setEditingLinkId(null); setLinkValue(''); }}><X className="h-3 w-3" /></Button>
                        <Button size="sm" className="h-7 text-xs" onClick={() => handleSaveLink(status.id)} disabled={isUpdating}>Save</Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 pl-6 text-xs">
                        {status.contracting_link_url ? <a href={status.contracting_link_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate max-w-[200px]"><LinkIcon className="h-3 w-3 inline mr-1" />{status.contracting_link_url}</a> : <span className="text-muted-foreground">No link</span>}
                        <Button variant="ghost" size="sm" className="h-5 text-[10px] px-1.5" onClick={() => { setEditingLinkId(status.id); setLinkValue(status.contracting_link_url || ''); }}>{status.contracting_link_url ? 'Edit' : 'Add Link'}</Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {statuses.length === 0 && selectedCarriers.size === 0 && <div className="p-4 text-center text-sm text-muted-foreground">No carriers assigned. Select carriers above to begin.</div>}
        </div>
      )}
    </div>
  );
}
