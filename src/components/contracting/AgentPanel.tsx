import { X, ExternalLink, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type QueueStatus = 'needs_action' | 'waiting' | 'rts';

export interface AgentDocument {
  type: string;
  label: string;
  url?: string;
}

export interface AgentPanelData {
  id: string;
  name: string;
  npn: string | null;
  state: string | null;
  email: string | null;
  phone: string | null;
  queueStatus: QueueStatus;
  submittedAt: string | null;
  documents: AgentDocument[];
  requestedCarriers: string[];
}

interface AgentPanelProps {
  agent: AgentPanelData;
  onClose: () => void;
  onStatusChange: (status: QueueStatus) => void;
  onSendToPinnacle: () => void;
  onCarrierToggle?: (carrier: string, checked: boolean) => void;
  onViewDocument?: (doc: AgentDocument) => void;
  onViewFullProfile?: () => void;
}

const CARRIERS = [
  'Aetna',
  'Humana',
  'Anthem',
  'Cigna',
  'UHC',
  'Wellcare',
  'Devoted',
  'Molina',
  'BCBS',
  'Essence',
];

const KY_CARRIERS = ['Aetna', 'Anthem', 'Devoted', 'Humana', 'UHC', 'Wellcare', 'Essence'];

const STATUS_CONFIG: Record<QueueStatus, { label: string; color: string }> = {
  needs_action: { label: 'Needs Action', color: 'bg-amber-500' },
  waiting: { label: 'Waiting', color: 'bg-blue-500' },
  rts: { label: 'Ready to Send', color: 'bg-green-500' },
};

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Unknown';

  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function AgentPanel({
  agent,
  onClose,
  onStatusChange,
  onSendToPinnacle,
  onCarrierToggle,
  onViewDocument,
  onViewFullProfile,
}: AgentPanelProps) {
  const statusConfig = STATUS_CONFIG[agent.queueStatus];

  return (
    <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="font-semibold text-lg truncate">{agent.name}</h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 shrink-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Contact Line */}
      <div className="px-4 py-2 bg-muted/50 text-sm text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1">
        {agent.npn && <span>NPN: {agent.npn}</span>}
        {agent.npn && agent.state && <span className="text-muted-foreground/50">·</span>}
        {agent.state && <span>{agent.state}</span>}
        {(agent.npn || agent.state) && agent.email && <span className="text-muted-foreground/50">·</span>}
        {agent.email && <span className="truncate">{agent.email}</span>}
        {agent.email && agent.phone && <span className="text-muted-foreground/50">·</span>}
        {agent.phone && <span>{agent.phone}</span>}
      </div>

      {/* Status Row */}
      <div className="px-4 py-3 flex items-center justify-between gap-4 border-b">
        <Select value={agent.queueStatus} onValueChange={(val) => onStatusChange(val as QueueStatus)}>
          <SelectTrigger className="w-[160px] h-9">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${statusConfig.color}`} />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(STATUS_CONFIG).map(([value, config]) => (
              <SelectItem key={value} value={value}>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${config.color}`} />
                  {config.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          Submitted: {formatTimeAgo(agent.submittedAt)}
        </span>
      </div>

      {/* Documents */}
      <div className="px-4 py-3 border-b">
        <h4 className="text-sm font-medium mb-2">Documents</h4>
        {agent.documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No documents uploaded</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {agent.documents.map((doc) => (
              <div
                key={doc.type}
                className="flex items-center justify-between p-2 rounded-md border bg-muted/30 text-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{doc.label}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 shrink-0"
                  onClick={() => onViewDocument?.(doc)}
                >
                  View
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Carriers */}
      <div className="px-4 py-3 border-b">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium">Carriers</h4>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              // First uncheck all carriers not in KY list
              CARRIERS.forEach((carrier) => {
                if (!KY_CARRIERS.includes(carrier) && agent.requestedCarriers.includes(carrier)) {
                  onCarrierToggle?.(carrier, false);
                }
              });
              // Then check all KY carriers
              KY_CARRIERS.forEach((carrier) => {
                if (!agent.requestedCarriers.includes(carrier)) {
                  onCarrierToggle?.(carrier, true);
                }
              });
            }}
          >
            KY Default
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-x-2 gap-y-1">
          {CARRIERS.map((carrier) => (
            <label
              key={carrier}
              className="inline-flex items-center gap-1.5 text-sm cursor-pointer w-fit py-0.5"
            >
              <Checkbox
                checked={agent.requestedCarriers.includes(carrier)}
                onCheckedChange={(checked) => onCarrierToggle?.(carrier, !!checked)}
              />
              <span>{carrier}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 flex items-center justify-between gap-4 bg-muted/30">
        <Button onClick={onSendToPinnacle} className="gap-2">
          Send to Pinnacle
        </Button>
        <Button
          variant="link"
          className="text-sm gap-1 px-0"
          onClick={onViewFullProfile}
        >
          View Full Profile
          <ExternalLink className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
