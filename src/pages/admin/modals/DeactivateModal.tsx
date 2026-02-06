import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Check, Search, AlertTriangle, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AgentProfile {
  id: string;
  user_id: string | null;
  full_name: string | null;
  is_active: boolean;
}

interface DirectReport {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface ManagerOption {
  id: string;
  full_name: string | null;
  manager_id: string | null;
}

interface DeactivateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: AgentProfile;
  directReports: DirectReport[];
  onSuccess: (updatedProfile: AgentProfile) => void;
}

type DeactivateStatus = 'idle' | 'processing' | 'success' | 'error';

export function DeactivateModal({
  open,
  onOpenChange,
  profile,
  directReports,
  onSuccess,
}: DeactivateModalProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [deactivateAllReports, setDeactivateAllReports] = useState(false);
  const [reassignToManagerId, setReassignToManagerId] = useState<string | null | undefined>(undefined);
  const [status, setStatus] = useState<DeactivateStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [availableManagers, setAvailableManagers] = useState<ManagerOption[]>([]);

  // Reset state when modal opens
  useEffect(() => {
    async function fetchManagers() {
      if (!open) return;

      setConfirmed(false);
      setDeactivateAllReports(false);
      setReassignToManagerId(undefined);
      setStatus('idle');
      setError(null);
      setSearch('');

      // Fetch available managers for reassignment
      const { data: managersData, error: managersError } = await supabase
        .from('profiles')
        .select('id, full_name, manager_id')
        .eq('is_active', true)
        .order('full_name');

      if (managersError) {
        console.error('Error fetching managers:', managersError);
        return;
      }

      // Filter out current agent and their direct reports
      const directReportIds = new Set(directReports.map((r) => r.id));
      const filtered = (managersData || []).filter(
        (m) => m.id !== profile.id && !directReportIds.has(m.id)
      );
      setAvailableManagers(filtered);
    }

    fetchManagers();
  }, [open, profile.id, directReports]);

  // Filter available managers for reassignment
  const filteredManagers = availableManagers.filter((m) => {
    if (!search) return true;
    return m.full_name?.toLowerCase().includes(search.toLowerCase());
  });

  const handleClose = () => {
    if (status === 'processing') return;
    onOpenChange(false);
  };

  const handleDeactivate = async () => {
    const hasReports = directReports.length > 0;

    // Validate: if has reports, must either reassign or deactivate all
    if (hasReports && reassignToManagerId === undefined && !deactivateAllReports) {
      setError('Please choose to reassign reports or deactivate all');
      return;
    }

    setStatus('processing');
    setError(null);

    try {
      // If reassigning reports
      if (hasReports && reassignToManagerId !== undefined && !deactivateAllReports) {
        const reportIds = directReports.map((r) => r.id);
        const { error: reassignError } = await supabase
          .from('profiles')
          .update({ manager_id: reassignToManagerId })
          .in('id', reportIds);

        if (reassignError) throw reassignError;
      }

      // If deactivating all reports
      if (hasReports && deactivateAllReports) {
        const reportIds = directReports.map((r) => r.id);
        const { error: deactivateReportsError } = await supabase
          .from('profiles')
          .update({ is_active: false })
          .in('id', reportIds);

        if (deactivateReportsError) throw deactivateReportsError;
      }

      // Deactivate the agent
      const { error: deactivateError } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', profile.id);

      if (deactivateError) throw deactivateError;

      onSuccess({ ...profile, is_active: false });

      setStatus('success');
      await new Promise((resolve) => setTimeout(resolve, 1000));
      onOpenChange(false);
    } catch (err: any) {
      setStatus('error');
      setError(err.message || 'Failed to deactivate agent');
    }
  };

  const handleReactivate = async () => {
    setStatus('processing');
    setError(null);

    try {
      const { error: reactivateError } = await supabase
        .from('profiles')
        .update({ is_active: true })
        .eq('id', profile.id);

      if (reactivateError) throw reactivateError;

      onSuccess({ ...profile, is_active: true });

      setStatus('success');
      await new Promise((resolve) => setTimeout(resolve, 1000));
      onOpenChange(false);
    } catch (err: any) {
      setStatus('error');
      setError(err.message || 'Failed to reactivate agent');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {profile.is_active ? (
              <>
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Deactivate Agent
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5 text-green-500" />
                Reactivate Agent
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {profile.is_active ? (
            // Deactivate flow
            directReports.length === 0 ? (
              // No direct reports - simple deactivation
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                  <p className="text-sm text-amber-800">
                    Are you sure you want to deactivate <strong>{profile.full_name}</strong>? They
                    will no longer appear in active agent lists.
                  </p>
                </div>

                <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-stone-50">
                  <Checkbox
                    checked={confirmed}
                    onCheckedChange={(checked) => setConfirmed(!!checked)}
                    className="mt-0.5"
                  />
                  <span className="text-sm">I understand this will deactivate the agent</span>
                </label>
              </div>
            ) : (
              // Has direct reports - need to handle them
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                  <p className="text-sm text-amber-800 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>{profile.full_name}</strong> has{' '}
                      <strong>{directReports.length}</strong> direct report
                      {directReports.length !== 1 ? 's' : ''}. You must reassign them before
                      deactivating.
                    </span>
                  </p>
                </div>

                {/* Direct reports list */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Direct Reports</Label>
                  <div className="border rounded-md max-h-[150px] overflow-y-auto divide-y">
                    {directReports.map((report) => (
                      <div key={report.id} className="px-3 py-2 flex items-center justify-between">
                        <span className="text-sm">{report.full_name || 'Unnamed Agent'}</span>
                        <Link
                          to={`/admin/agents/${report.id}`}
                          className="text-xs text-amber-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Option A: Reassign to new manager */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Reassign all to:</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                    <Input
                      placeholder="Search for a manager..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9"
                      disabled={deactivateAllReports}
                    />
                  </div>
                  <div
                    className={`border rounded-md max-h-[150px] overflow-y-auto ${deactivateAllReports ? 'opacity-50' : ''}`}
                  >
                    {/* TIG Direct option */}
                    <button
                      onClick={() => !deactivateAllReports && setReassignToManagerId(null)}
                      disabled={deactivateAllReports}
                      className={`w-full text-left px-3 py-2 border-b hover:bg-stone-50 transition-colors flex items-center justify-between ${
                        reassignToManagerId === null ? 'bg-amber-50' : ''
                      }`}
                    >
                      <span className="text-sm">TIG (Direct)</span>
                      {reassignToManagerId === null && <Check className="h-4 w-4 text-amber-500" />}
                    </button>
                    {filteredManagers.length === 0 ? (
                      <div className="px-3 py-4 text-center text-sm text-stone-500">
                        {search ? 'No managers match your search' : 'No managers available'}
                      </div>
                    ) : (
                      filteredManagers.slice(0, 10).map((mgr) => (
                        <button
                          key={mgr.id}
                          onClick={() => !deactivateAllReports && setReassignToManagerId(mgr.id)}
                          disabled={deactivateAllReports}
                          className={`w-full text-left px-3 py-2 border-b last:border-b-0 hover:bg-stone-50 transition-colors flex items-center justify-between ${
                            reassignToManagerId === mgr.id ? 'bg-amber-50' : ''
                          }`}
                        >
                          <span className="text-sm">{mgr.full_name || 'Unnamed'}</span>
                          {reassignToManagerId === mgr.id && (
                            <Check className="h-4 w-4 text-amber-500" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Option B: Deactivate all */}
                <div className="border-t pt-4">
                  <label className="flex items-start gap-3 p-3 rounded-lg border border-red-200 bg-red-50/50 cursor-pointer hover:bg-red-50">
                    <Checkbox
                      checked={deactivateAllReports}
                      onCheckedChange={(checked) => {
                        setDeactivateAllReports(!!checked);
                        if (checked) setReassignToManagerId(null);
                      }}
                      className="mt-0.5"
                    />
                    <div>
                      <span className="text-sm font-medium text-red-700">Deactivate all</span>
                      <p className="text-xs text-red-600 mt-0.5">
                        This will deactivate {profile.full_name} AND all {directReports.length}{' '}
                        direct report{directReports.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </label>
                </div>

                {/* Confirmation */}
                <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-stone-50">
                  <Checkbox
                    checked={confirmed}
                    onCheckedChange={(checked) => setConfirmed(!!checked)}
                    className="mt-0.5"
                  />
                  <span className="text-sm">I understand this action</span>
                </label>
              </div>
            )
          ) : (
            // Reactivate flow
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <p className="text-sm text-green-800">
                  Reactivate <strong>{profile.full_name}</strong>? They will appear in active agent
                  lists again.
                </p>
              </div>

              <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-stone-50">
                <Checkbox
                  checked={confirmed}
                  onCheckedChange={(checked) => setConfirmed(!!checked)}
                  className="mt-0.5"
                />
                <span className="text-sm">I confirm I want to reactivate this agent</span>
              </label>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={status === 'processing' || status === 'success'}
          >
            Cancel
          </Button>
          {profile.is_active ? (
            <Button
              onClick={handleDeactivate}
              disabled={
                status === 'processing' ||
                status === 'success' ||
                !confirmed ||
                (directReports.length > 0 &&
                  reassignToManagerId === undefined &&
                  !deactivateAllReports)
              }
              className={`gap-2 min-w-[100px] ${
                status === 'success' ? 'bg-green-600 hover:bg-green-600' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {status === 'processing' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : status === 'success' ? (
                <>
                  <Check className="h-4 w-4" />
                  Done!
                </>
              ) : (
                'Deactivate'
              )}
            </Button>
          ) : (
            <Button
              onClick={handleReactivate}
              disabled={status === 'processing' || status === 'success' || !confirmed}
              className={`gap-2 min-w-[100px] ${
                status === 'success'
                  ? 'bg-green-600 hover:bg-green-600'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {status === 'processing' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : status === 'success' ? (
                <>
                  <Check className="h-4 w-4" />
                  Done!
                </>
              ) : (
                'Reactivate'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
