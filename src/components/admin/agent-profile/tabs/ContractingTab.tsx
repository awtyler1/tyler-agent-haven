import React from 'react';
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
  onOpenCarrierRequestModal: () => void;
  isAdmin: boolean;
}

export const ContractingTab: React.FC<ContractingTabProps> = ({
  profileId,
  userId,
  carrierStatuses,
  onOpenCarrierRequestModal,
  isAdmin,
}) => {
  // Fixed: pass object with agentUserId property
  const { requests, isLoading: loadingRequests } = useCarrierRequestHistory({
    agentUserId: userId || null,
  });

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
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

  // Sort carriers: contracted first, then in_progress, then not_started
  const sortedCarriers = [...carrierStatuses].sort((a, b) => {
    const order: Record<string, number> = { contracted: 0, in_progress: 1, issue: 2, not_started: 3 };
    return (order[a.contracting_status] || 3) - (order[b.contracting_status] || 3);
  });

  const contractedCount = carrierStatuses.filter((c) => c.contracting_status === 'contracted').length;

  const lastUpdated = carrierStatuses
    .map(cs => cs.contracted_at || cs.contracting_submitted_at)
    .filter(Boolean)
    .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime())[0];

  return (
    <div className="space-y-4">
      {/* Carrier Status */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200/50">
        <div className="px-4 py-3 flex justify-between items-center border-b border-stone-100">
          <div>
            <h2 className="font-semibold text-stone-900">Carrier Status</h2>
            {carrierStatuses.length > 0 && (
              <p className="text-xs text-stone-500 mt-0.5">
                {contractedCount} of {carrierStatuses.length} contracted
                {lastUpdated && <> · Last updated {formatDate(lastUpdated)}</>}
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
          <div className="max-h-[320px] overflow-y-auto">
            {sortedCarriers.map((carrier) => (
              <div
                key={carrier.id}
                className="px-4 py-2.5 flex items-center gap-3 border-t border-stone-50 first:border-t-0 hover:bg-stone-50/50 transition-colors"
              >
                {getStatusDot(carrier.contracting_status)}
                <span className="text-sm font-medium text-stone-900">{carrier.carrier_name}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-8 text-center text-sm text-stone-500">No carrier statuses yet</div>
        )}
      </div>

      {/* Request History */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200/50">
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
      <div>
        <p className="text-sm font-medium text-stone-900">
          {request.carriers_included?.join(', ') || 'Carrier request'}
        </p>
        <p className="text-xs text-stone-500 mt-1">Sent to {request.recipient_email}</p>
      </div>
      <p className="text-xs text-stone-400 mt-2">
        {formatDate(request.sent_at)} by {request.sent_by_name || 'Unknown'}
      </p>
    </div>
  );
};

export default ContractingTab;
