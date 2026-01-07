import { formatDistanceToNow } from 'date-fns';
import { X, FileText, ExternalLink, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { QueueAgent, QueueStatus } from './AgentList';

interface AgentPanelProps {
  agent: QueueAgent;
  onClose: () => void;
  onStatusChange: (agentId: string, status: QueueStatus) => void;
  onCarriersChange: (agentId: string, carriers: string[]) => void;
  onSendToPinnacle: (agent: QueueAgent) => void;
}

const statusOptions: { value: QueueStatus; label: string }[] = [
  { value: 'needs_action', label: 'Needs Action' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'sent_to_pinnacle', label: 'Sent to Pinnacle' },
  { value: 'completed', label: 'Completed' },
];

const AVAILABLE_CARRIERS = [
  { code: 'aetna', name: 'Aetna' },
  { code: 'humana', name: 'Humana' },
  { code: 'anthem', name: 'Anthem' },
  { code: 'cigna', name: 'Cigna' },
  { code: 'uhc', name: 'UHC' },
  { code: 'wellcare', name: 'Wellcare' },
  { code: 'devoted', name: 'Devoted' },
  { code: 'molina', name: 'Molina' },
  { code: 'bcbs', name: 'BCBS' },
  { code: 'essence', name: 'Essence' },
];

const KY_CARRIER_CODES = ['aetna', 'anthem', 'devoted', 'humana', 'uhc', 'wellcare', 'essence'];

const DOCUMENT_LABELS: Record<string, string> = {
  contracting_packet: 'Packet',
  eo_certificate: 'E&O',
  insurance_license: 'License',
  voided_check: 'Check',
  government_id: 'ID',
  aml_training: 'AML',
  aml_certificate: 'AML',
  ce_certificate: 'CE',
  ltc_certificate: 'LTC',
  corporate_resolution: 'Corp Res',
  background_explanation: 'Background',
};

export function AgentPanel({
  agent,
  onClose,
  onStatusChange,
  onCarriersChange,
  onSendToPinnacle,
}: AgentPanelProps) {
  const documents = agent.uploaded_documents || {};
  const docEntries = Object.entries(documents).filter(
    ([key, value]) => value && DOCUMENT_LABELS[key]
  );

  const handleCarrierToggle = (carrierCode: string, checked: boolean) => {
    const newCarriers = checked
      ? [...agent.requested_carriers, carrierCode]
      : agent.requested_carriers.filter((c) => c !== carrierCode);
    onCarriersChange(agent.id, newCarriers);
  };

  const canSendToPinnacle = agent.queue_status === 'needs_action' || agent.queue_status === 'in_progress';

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header - Compact */}
      <div className="px-4 py-3 border-b border-[#E5E2DB]">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-foreground truncate">
              {agent.full_legal_name || 'Unnamed Agent'}
            </h2>
            <p className="text-xs text-muted-foreground truncate">
              NPN: {agent.npn_number || 'N/A'} · {agent.resident_state || 'N/A'}
              {agent.email_address && ` · ${agent.email_address}`}
              {agent.phone_mobile && ` · ${agent.phone_mobile}`}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Status Row */}
      <div className="px-4 py-3 border-b border-[#E5E2DB] flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Status:</span>
          <Select
            value={agent.queue_status}
            onValueChange={(value) => onStatusChange(agent.id, value as QueueStatus)}
          >
            <SelectTrigger className="h-8 w-[140px] text-xs bg-white border-[#E5E2DB]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value} className="text-xs">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-xs text-muted-foreground">
          <span className="font-medium">Submitted:</span>{' '}
          {agent.submitted_at
            ? formatDistanceToNow(new Date(agent.submitted_at), { addSuffix: true })
            : 'Not submitted'}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Documents Section */}
        <div className="px-4 py-3 border-b border-[#E5E2DB]">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Documents
          </h3>
          {docEntries.length > 0 ? (
            <div className="grid grid-cols-4 gap-2">
              {docEntries.map(([docType]) => (
                <button
                  key={docType}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg border border-[#E5E2DB] hover:border-gold hover:bg-gold/5 transition-colors group"
                >
                  <FileText className="h-5 w-5 text-muted-foreground group-hover:text-gold" />
                  <span className="text-[10px] text-muted-foreground font-medium truncate w-full text-center">
                    {DOCUMENT_LABELS[docType]}
                  </span>
                  <span className="text-[10px] text-gold opacity-0 group-hover:opacity-100 transition-opacity">
                    View
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">No documents uploaded</p>
          )}
        </div>

        {/* Carriers Section */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Carriers to Request
            </h3>
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-xs px-2"
              onClick={() => onCarriersChange(agent.id, KY_CARRIER_CODES)}
            >
              KY Default
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-x-2 gap-y-1">
            {AVAILABLE_CARRIERS.map((carrier) => {
              const isChecked = agent.requested_carriers.includes(carrier.code);
              return (
                <label
                  key={carrier.code}
                  className="inline-flex items-center gap-1.5 cursor-pointer group w-fit py-0.5"
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={(checked) =>
                      handleCarrierToggle(carrier.code, checked as boolean)
                    }
                    className="h-4 w-4"
                  />
                  <span className="text-sm text-foreground group-hover:text-gold transition-colors">
                    {carrier.name}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-4 py-3 border-t border-[#E5E2DB] space-y-2">
        <Button
          className="w-full bg-gold hover:bg-gold/90 text-white"
          disabled={!canSendToPinnacle}
          onClick={() => onSendToPinnacle(agent)}
        >
          <Send className="h-4 w-4 mr-2" />
          Send to Pinnacle
        </Button>
        <Button
          variant="ghost"
          className="w-full text-muted-foreground hover:text-gold"
          onClick={() => window.location.href = `/admin/users/${agent.user_id}`}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          View Full Profile
        </Button>
      </div>
    </div>
  );
}
