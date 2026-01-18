import { formatDistanceToNow } from 'date-fns';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export type QueueStatus = 'needs_action' | 'in_progress' | 'sent_to_pinnacle' | 'completed';

export interface QueueAgent {
  id: string;
  user_id: string;
  profile_id: string | null;  // Profile ID for linking to agent profile page
  full_legal_name: string | null;
  npn_number: string | null;
  resident_state: string | null;
  queue_status: QueueStatus;
  submitted_at: string | null;
  email_address: string | null;
  phone_mobile: string | null;
  requested_carriers: string[];
  uploaded_documents?: Record<string, string>;
}

interface AgentListProps {
  agents: QueueAgent[];
  selectedId: string | null;
  onSelect: (agent: QueueAgent) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const statusConfig: Record<QueueStatus, { dot: string; label: string }> = {
  needs_action: { dot: 'bg-red-500', label: 'Needs Action' },
  in_progress: { dot: 'bg-yellow-500', label: 'In Progress' },
  sent_to_pinnacle: { dot: 'bg-blue-500', label: 'Sent to Pinnacle' },
  completed: { dot: 'bg-green-500', label: 'Completed' },
};

export function AgentList({
  agents,
  selectedId,
  onSelect,
  searchTerm,
  onSearchChange
}: AgentListProps) {
  const filteredAgents = agents.filter((agent) => {
    const searchLower = searchTerm.toLowerCase();
    const name = (agent.full_legal_name || '').toLowerCase();
    const npn = (agent.npn_number || '').toLowerCase();
    return name.includes(searchLower) || npn.includes(searchLower);
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-[#E5E2DB]">
        <h1 className="text-xl font-semibold text-foreground mb-3">Contracting Queue</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or NPN..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 bg-white border-[#E5E2DB]"
          />
        </div>
      </div>

      {/* Agent List */}
      <div className="flex-1 overflow-y-auto">
        {filteredAgents.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            No agents found
          </div>
        ) : (
          filteredAgents.map((agent) => {
            const status = statusConfig[agent.queue_status] || statusConfig.needs_action;
            const isSelected = selectedId === agent.id;

            return (
              <button
                key={agent.id}
                onClick={() => onSelect(agent)}
                className={`w-full px-4 py-3 flex items-center gap-3 border-b border-[#E5E2DB] text-left transition-colors ${
                  isSelected
                    ? 'bg-gold/5 border-l-2 border-l-gold'
                    : 'hover:bg-muted/50 border-l-2 border-l-transparent'
                }`}
              >
                {/* Status Dot */}
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${status.dot}`} />

                {/* Agent Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-foreground truncate">
                      {agent.full_legal_name || 'Unnamed Agent'}
                    </span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {agent.submitted_at
                        ? formatDistanceToNow(new Date(agent.submitted_at), { addSuffix: true })
                        : 'Not submitted'
                      }
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    NPN: {agent.npn_number || 'N/A'} • {agent.resident_state || 'N/A'}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
