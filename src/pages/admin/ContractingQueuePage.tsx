import { useState } from 'react';
import { toast } from 'sonner';
import Navigation from '@/components/Navigation';
import { AgentList, QueueAgent, QueueStatus } from '@/components/admin/queue/AgentList';
import { AgentPanel } from '@/components/admin/queue/AgentPanel';

// Mock data for development
const MOCK_AGENTS: QueueAgent[] = [
  {
    id: '1',
    user_id: 'user-1',
    full_legal_name: 'Sarah Johnson',
    npn_number: '12345678',
    resident_state: 'TX',
    queue_status: 'needs_action',
    submitted_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    email_address: 'sarah.johnson@email.com',
    phone_mobile: '(555) 123-4567',
    requested_carriers: ['aetna', 'humana', 'uhc'],
    uploaded_documents: {
      contracting_packet: 'path/to/packet.pdf',
      eo_certificate: 'path/to/eo.pdf',
      insurance_license: 'path/to/license.pdf',
      voided_check: 'path/to/check.pdf',
    },
  },
  {
    id: '2',
    user_id: 'user-2',
    full_legal_name: 'Michael Chen',
    npn_number: '87654321',
    resident_state: 'CA',
    queue_status: 'in_progress',
    submitted_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    email_address: 'michael.chen@email.com',
    phone_mobile: '(555) 234-5678',
    requested_carriers: ['anthem', 'cigna'],
    uploaded_documents: {
      contracting_packet: 'path/to/packet.pdf',
      insurance_license: 'path/to/license.pdf',
    },
  },
  {
    id: '3',
    user_id: 'user-3',
    full_legal_name: 'Emily Rodriguez',
    npn_number: '11223344',
    resident_state: 'FL',
    queue_status: 'sent_to_pinnacle',
    submitted_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    email_address: 'emily.rodriguez@email.com',
    phone_mobile: '(555) 345-6789',
    requested_carriers: ['wellcare', 'devoted', 'humana'],
    uploaded_documents: {
      contracting_packet: 'path/to/packet.pdf',
      eo_certificate: 'path/to/eo.pdf',
      insurance_license: 'path/to/license.pdf',
      voided_check: 'path/to/check.pdf',
      government_id: 'path/to/id.pdf',
    },
  },
  {
    id: '4',
    user_id: 'user-4',
    full_legal_name: 'David Thompson',
    npn_number: '55667788',
    resident_state: 'NY',
    queue_status: 'completed',
    submitted_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    email_address: 'david.thompson@email.com',
    phone_mobile: '(555) 456-7890',
    requested_carriers: ['bcbs', 'aetna'],
    uploaded_documents: {
      contracting_packet: 'path/to/packet.pdf',
      insurance_license: 'path/to/license.pdf',
    },
  },
  {
    id: '5',
    user_id: 'user-5',
    full_legal_name: 'Jennifer Martinez',
    npn_number: '99887766',
    resident_state: 'AZ',
    queue_status: 'needs_action',
    submitted_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    email_address: 'jennifer.martinez@email.com',
    phone_mobile: '(555) 567-8901',
    requested_carriers: ['aetna', 'humana', 'uhc'],
    uploaded_documents: {
      contracting_packet: 'path/to/packet.pdf',
      eo_certificate: 'path/to/eo.pdf',
      insurance_license: 'path/to/license.pdf',
      voided_check: 'path/to/check.pdf',
    },
  },
];

export default function ContractingQueuePage() {
  const [agents, setAgents] = useState<QueueAgent[]>(MOCK_AGENTS);
  const [selectedAgent, setSelectedAgent] = useState<QueueAgent | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleStatusChange = (agentId: string, newStatus: QueueStatus) => {
    setAgents((prev) =>
      prev.map((agent) =>
        agent.id === agentId ? { ...agent, queue_status: newStatus } : agent
      )
    );
    if (selectedAgent?.id === agentId) {
      setSelectedAgent((prev) => (prev ? { ...prev, queue_status: newStatus } : null));
    }
  };

  const handleCarriersChange = (agentId: string, carriers: string[]) => {
    setAgents((prev) =>
      prev.map((agent) =>
        agent.id === agentId ? { ...agent, requested_carriers: carriers } : agent
      )
    );
    if (selectedAgent?.id === agentId) {
      setSelectedAgent((prev) => (prev ? { ...prev, requested_carriers: carriers } : null));
    }
  };

  const handleSendToPinnacle = (agent: QueueAgent) => {
    // Update status to sent_to_pinnacle
    handleStatusChange(agent.id, 'sent_to_pinnacle');
    toast.success(`${agent.full_legal_name} sent to Pinnacle`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]">
      <Navigation />

      {/* Fixed layout below nav */}
      <div className="fixed top-20 left-0 right-0 bottom-0 flex">
        {/* Left Panel - Agent List */}
        <div className="w-96 border-r border-[#E5E2DB] bg-white flex-shrink-0">
          <AgentList
            agents={agents}
            selectedId={selectedAgent?.id || null}
            onSelect={setSelectedAgent}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </div>

        {/* Right Panel - Agent Details */}
        <div className="flex-1 overflow-hidden">
          {selectedAgent ? (
            <div className="h-full animate-in slide-in-from-right-4 duration-200">
              <AgentPanel
                agent={selectedAgent}
                onClose={() => setSelectedAgent(null)}
                onStatusChange={handleStatusChange}
                onCarriersChange={handleCarriersChange}
                onSendToPinnacle={handleSendToPinnacle}
              />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center bg-muted/20">
              <div className="text-center text-muted-foreground">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-muted-foreground/50"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <p className="text-sm">Select an agent to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
