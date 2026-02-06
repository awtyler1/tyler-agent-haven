import { useState, useEffect } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
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

interface DeleteAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentName: string;
  userId: string;
  onDeleted: () => void;
}

export function DeleteAgentModal({
  isOpen,
  onClose,
  agentName,
  userId,
  onDeleted,
}: DeleteAgentModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const [status, setStatus] = useState<'idle' | 'deleting' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setConfirmText('');
      setStatus('idle');
      setError(null);
    }
  }, [isOpen]);

  const isConfirmed = confirmText === agentName;

  const handleDelete = async () => {
    if (!isConfirmed) return;

    setStatus('deleting');
    setError(null);

    try {
      const { error: fnError } = await supabase.functions.invoke('delete-user', {
        body: { userId },
      });

      if (fnError) throw fnError;

      onDeleted();
    } catch (err: any) {
      setStatus('error');
      setError(err.message || 'Failed to delete agent');
    }
  };

  const handleClose = () => {
    if (status === 'deleting') return;
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Delete Agent Permanently
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-800">
              This action is <strong>irreversible</strong>. Deleting{' '}
              <strong>{agentName}</strong> will permanently remove:
            </p>
            <ul className="mt-2 text-sm text-red-700 list-disc list-inside space-y-1">
              <li>Their auth account and login credentials</li>
              <li>All uploaded documents</li>
              <li>Contracting applications</li>
              <li>Carrier statuses and certifications</li>
              <li>Their profile and all associated data</li>
            </ul>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-stone-700">
              Type <strong>{agentName}</strong> to confirm
            </label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={`Type ${agentName} to confirm`}
              disabled={status === 'deleting'}
              autoComplete="off"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={status === 'deleting'}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={!isConfirmed || status === 'deleting'}
            className="gap-2 bg-red-600 hover:bg-red-700 text-white"
          >
            {status === 'deleting' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Permanently'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
