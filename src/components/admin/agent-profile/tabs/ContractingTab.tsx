import React, { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCarrierRequestHistory, type CarrierRequest } from '@/hooks/useCarrierRequestHistory';

interface CarrierStatus {
  id: string;
  carrier_id: string;
  carrier_name: string;
  contracting_status: 'not_started' | 'in_progress' | 'contracted' | 'issue';
  contracting_submitted_at?: string | null;
  contracted_at?: string | null;
}

interface ContractingTabProps {
  profileId: string;
  userId?: string | null;
  carrierStatuses: CarrierStatus[];
  contractingNotes: string;
  onUpdateNotes: (notes: string) => Promise<void>;
  onOpenCarrierRequestModal: () => void;
  isAdmin: boolean;
  canEditNotes: boolean;
}

export const ContractingTab: React.FC<ContractingTabProps> = ({
  profileId,
  userId,
  carrierStatuses,
  contractingNotes,
  onUpdateNotes,
  onOpenCarrierRequestModal,
  isAdmin,
  canEditNotes,
}) => {
  const [editingNotes, setEditingNotes] = useState(false);
  const [draftNotes, setDraftNotes] = useState(contractingNotes);
  const [savingNotes, setSavingNotes] = useState(false);

  // Fixed: pass object with agentUserId property
  const { requests, isLoading: loadingRequests } = useCarrierRequestHistory({
    agentUserId: userId || null,
  });

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await onUpdateNotes(draftNotes);
      setEditingNotes(false);
    } catch (error) {
      console.error('Failed to save notes:', error);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleCancelNotes = () => {
    setDraftNotes(contractingNotes);
    setEditingNotes(false);
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      contracted: { bg: 'bg-green-100', text: 'text-green-700', label: 'Contracted' },
      in_progress: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'In Progress' },
      not_started: { bg: 'bg-stone-100', text: 'text-stone-500', label: 'Not Started' },
      issue: { bg: 'bg-red-100', text: 'text-red-700', label: 'Issue' },
    };
    const c = config[status] || config.not_started;
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.bg} ${c.text}`}>{c.label}</span>
    );
  };

  const getStatusDot = (status: string) => {
    const colors: Record<string, string> = {
      contracted: 'bg-green-500',
      in_progress: 'bg-amber-500',
      not_started: 'bg-stone-300',
      issue: 'bg-red-500',
    };
    return <div className={`w-2 h-2 rounded-full flex-shrink-0 ${colors[status] || colors.not_started}`} />;
  };

  const getCarrierDate = (carrier: CarrierStatus) => {
    if (carrier.contracted_at) return formatDate(carrier.contracted_at);
    if (carrier.contracting_submitted_at) return formatDate(carrier.contracting_submitted_at);
    return null;
  };

  // Sort carriers: contracted first, then in_progress, then not_started
  const sortedCarriers = [...carrierStatuses].sort((a, b) => {
    const order: Record<string, number> = { contracted: 0, in_progress: 1, issue: 2, not_started: 3 };
    return (order[a.contracting_status] || 3) - (order[b.contracting_status] || 3);
  });

  const contractedCount = carrierStatuses.filter((c) => c.contracting_status === 'contracted').length;

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Carrier Status */}
      <div className="col-span-2 bg-white rounded-xl shadow-sm border border-stone-200/50">
        <div className="px-4 py-3 flex justify-between items-center border-b border-stone-100">
          <div>
            <h2 className="font-semibold text-stone-900">Carrier Status</h2>
            {carrierStatuses.length > 0 && (
              <p className="text-xs text-stone-500 mt-0.5">
                {contractedCount} of {carrierStatuses.length} contracted
              </p>
            )}
          </div>
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenCarrierRequestModal}
              className="gap-1.5 text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200"
            >
              <Plus className="w-4 h-4" />
              Request Carrier
            </Button>
          )}
        </div>

        {sortedCarriers.length > 0 ? (
          <div>
            {sortedCarriers.map((carrier) => (
              <div
                key={carrier.id}
                className="px-4 py-3 flex justify-between items-center border-t border-stone-50 first:border-t-0 hover:bg-stone-50/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getStatusDot(carrier.contracting_status)}
                  <span className="text-sm font-medium text-stone-900">{carrier.carrier_name}</span>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(carrier.contracting_status)}
                  {getCarrierDate(carrier) && (
                    <span className="text-xs text-stone-400">{getCarrierDate(carrier)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-8 text-center text-sm text-stone-500">No carrier statuses yet</div>
        )}
      </div>

      {/* Contracting Notes */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200/50">
        <div className="px-4 py-3 border-b border-stone-100 flex justify-between items-center">
          <h2 className="font-semibold text-stone-900">Contracting Notes</h2>
          {canEditNotes && !editingNotes && (
            <button onClick={() => setEditingNotes(true)} className="text-xs text-blue-600 hover:text-blue-700">
              Edit
            </button>
          )}
        </div>
        <div className="p-4">
          {editingNotes ? (
            <div>
              <textarea
                value={draftNotes}
                onChange={(e) => setDraftNotes(e.target.value)}
                rows={4}
                autoFocus
                className="w-full p-3 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-300 resize-none"
                placeholder="Add notes about contracting..."
              />
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="ghost" size="sm" onClick={handleCancelNotes} disabled={savingNotes}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="bg-amber-500 hover:bg-amber-600"
                >
                  {savingNotes ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-stone-600">
              {contractingNotes || <span className="text-stone-400 italic">No contracting notes yet</span>}
            </p>
          )}
        </div>
      </div>

      {/* Request History */}
      <div className="col-span-3 bg-white rounded-xl shadow-sm border border-stone-200/50">
        <div className="px-4 py-3 border-b border-stone-100">
          <h2 className="font-semibold text-stone-900">Request History</h2>
        </div>

        {loadingRequests ? (
          <div className="px-4 py-8 text-center">
            <Loader2 className="w-5 h-5 animate-spin mx-auto text-stone-400" />
          </div>
        ) : requests.length > 0 ? (
          <div>
            {requests.map((request) => (
              <RequestHistoryItem key={request.id} request={request} />
            ))}
          </div>
        ) : (
          <div className="px-4 py-8 text-center text-sm text-stone-500">No carrier requests yet</div>
        )}
      </div>
    </div>
  );
};

interface RequestHistoryItemProps {
  request: CarrierRequest;
}

const RequestHistoryItem: React.FC<RequestHistoryItemProps> = ({ request }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="px-4 py-3 border-t border-stone-50 first:border-t-0">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-stone-900">
            {request.carriers_included?.join(', ') || 'Carrier request'}
          </p>
          <p className="text-xs text-stone-500 mt-1">Sent to {request.recipient_email}</p>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Pending</span>
      </div>
      <p className="text-xs text-stone-400 mt-2">
        {formatDate(request.sent_at)} by {request.sent_by_name || 'Unknown'}
      </p>
    </div>
  );
};

export default ContractingTab;
