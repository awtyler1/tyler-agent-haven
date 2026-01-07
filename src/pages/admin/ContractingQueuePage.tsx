import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import Navigation from '@/components/Navigation';
import { AgentList, QueueAgent, QueueStatus } from '@/components/admin/queue/AgentList';
import { AgentPanel } from '@/components/admin/queue/AgentPanel';
import { SendToPinnacleModal, PinnacleDocument, SendToPinnacleData } from '@/components/contracting/SendToPinnacleModal';
import { useSendEmail, fileUrlToBase64, EmailAttachment } from '@/hooks/useSendEmail';
import { supabase } from '@/integrations/supabase/client';

const DOCUMENT_LABELS: Record<string, string> = {
  contracting_packet: 'Contracting Packet',
  eo_certificate: 'E&O Certificate',
  insurance_license: 'Insurance License',
  voided_check: 'Voided Check',
  government_id: 'Government ID',
  aml_certificate: 'AML Certificate',
  ce_certificate: 'CE Certificate',
  ltc_certificate: 'LTC Certificate',
  corporate_resolution: 'Corporate Resolution',
  background_explanation: 'Background Documentation',
};

export default function ContractingQueuePage() {
  const [agents, setAgents] = useState<QueueAgent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<QueueAgent | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal state
  const [showPinnacleModal, setShowPinnacleModal] = useState(false);
  const [modalCarriers, setModalCarriers] = useState<string[]>([]);
  const [modalDocuments, setModalDocuments] = useState<PinnacleDocument[]>([]);

  const { sendEmail } = useSendEmail();

  // Fetch applications from Supabase
  const fetchApplications = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('contracting_applications')
        .select(`
          id,
          user_id,
          full_legal_name,
          npn_number,
          resident_state,
          queue_status,
          submitted_at,
          email_address,
          phone_mobile,
          requested_carriers,
          uploaded_documents
        `)
        .eq('status', 'submitted')
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      const mappedAgents: QueueAgent[] = (data || []).map((app) => ({
        id: app.id,
        user_id: app.user_id,
        full_legal_name: app.full_legal_name,
        npn_number: app.npn_number,
        resident_state: app.resident_state,
        queue_status: (app.queue_status as QueueStatus) || 'needs_action',
        submitted_at: app.submitted_at,
        email_address: app.email_address,
        phone_mobile: app.phone_mobile,
        requested_carriers: (app.requested_carriers as string[]) || [],
        uploaded_documents: (app.uploaded_documents as Record<string, string>) || {},
      }));

      setAgents(mappedAgents);
    } catch (err) {
      console.error('Error fetching applications:', err);
      toast.error('Failed to load contracting queue');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleStatusChange = async (agentId: string, newStatus: QueueStatus) => {
    // Optimistic update
    setAgents((prev) =>
      prev.map((agent) =>
        agent.id === agentId ? { ...agent, queue_status: newStatus } : agent
      )
    );
    if (selectedAgent?.id === agentId) {
      setSelectedAgent((prev) => (prev ? { ...prev, queue_status: newStatus } : null));
    }

    // Persist to database
    const { error } = await supabase
      .from('contracting_applications')
      .update({ queue_status: newStatus })
      .eq('id', agentId);

    if (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
      fetchApplications(); // Revert on error
    }
  };

  const handleCarriersChange = async (agentId: string, carriers: string[]) => {
    // Optimistic update
    setAgents((prev) =>
      prev.map((agent) =>
        agent.id === agentId ? { ...agent, requested_carriers: carriers } : agent
      )
    );
    if (selectedAgent?.id === agentId) {
      setSelectedAgent((prev) => (prev ? { ...prev, requested_carriers: carriers } : null));
    }

    // Persist to database
    const { error } = await supabase
      .from('contracting_applications')
      .update({ requested_carriers: carriers })
      .eq('id', agentId);

    if (error) {
      console.error('Error updating carriers:', error);
      toast.error('Failed to update carriers');
      fetchApplications(); // Revert on error
    }
  };

  const handleSendToPinnacle = (agent: QueueAgent) => {
    // Save carriers and prepare documents for modal
    setModalCarriers([...agent.requested_carriers]);

    // Build documents list from uploaded_documents
    const docs: PinnacleDocument[] = [];
    const uploadedDocs = agent.uploaded_documents || {};

    for (const [docType, filePath] of Object.entries(uploadedDocs)) {
      if (filePath && DOCUMENT_LABELS[docType]) {
        docs.push({
          type: docType,
          label: DOCUMENT_LABELS[docType],
          url: filePath,
        });
      }
    }

    setModalDocuments(docs);
    setShowPinnacleModal(true);
  };

  const handleModalSend = async (data: SendToPinnacleData): Promise<{ success: boolean }> => {
    if (!selectedAgent) return { success: false };

    try {
      // Convert selected documents to base64 attachments
      const attachments: EmailAttachment[] = [];

      for (const doc of modalDocuments) {
        if (data.selectedDocuments.includes(doc.type) && doc.url) {
          // Get signed URL for the document
          const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from('contracting-documents')
            .createSignedUrl(doc.url, 300);

          if (signedUrlError || !signedUrlData?.signedUrl) {
            console.error(`Failed to get signed URL for ${doc.type}:`, signedUrlError);
            continue;
          }

          // Convert to base64
          const base64Data = await fileUrlToBase64(signedUrlData.signedUrl);
          if (base64Data) {
            // Build filename: {NPN}_{DocType}.{extension}
            const npn = selectedAgent.npn_number || 'Unknown';
            const originalFileName = doc.url.split('/').pop() || '';
            const extension = originalFileName.includes('.')
              ? originalFileName.split('.').pop()
              : 'pdf';

            // Map doc type to friendly name
            const docTypeNames: Record<string, string> = {
              contracting_packet: 'Packet',
              eo_certificate: 'EO',
              insurance_license: 'License',
              voided_check: 'VoidedCheck',
              government_id: 'ID',
              aml_certificate: 'AML',
              ce_certificate: 'CE',
              ltc_certificate: 'LTC',
              corporate_resolution: 'CorpResolution',
              background_explanation: 'Background',
            };
            const docTypeName = docTypeNames[doc.type] || doc.type;
            const fileName = `${npn}_${docTypeName}.${extension}`;

            attachments.push({
              name: fileName,
              contentType: base64Data.contentType,
              contentBytes: base64Data.contentBytes,
            });
          }
        }
      }

      // Send the email
      const result = await sendEmail({
        to: data.to,
        subject: data.subject,
        body: data.body.replace(/\n/g, '<br>'), // Convert newlines to HTML breaks
        attachments,
        agentId: selectedAgent.user_id,
        communicationType: 'initial_contracting',
        carriersIncluded: modalCarriers,
      });

      if (!result.success) {
        toast.error(result.error || 'Failed to send email');
        return { success: false };
      }

      // Update database: set queue_status, sent_to_pinnacle_at, requested_carriers
      const { error: updateError } = await supabase
        .from('contracting_applications')
        .update({
          queue_status: 'sent_to_pinnacle',
          sent_to_pinnacle_at: new Date().toISOString(),
          requested_carriers: modalCarriers,
        })
        .eq('id', selectedAgent.id);

      if (updateError) {
        console.error('Error updating application:', updateError);
        toast.error('Email sent but failed to update status');
      } else {
        toast.success(`Contracting request sent to Pinnacle for ${selectedAgent.full_legal_name}`);
      }

      // Refresh list in background (modal will close itself)
      fetchApplications();

      // Update selected agent if still viewing
      setSelectedAgent((prev) =>
        prev ? { ...prev, queue_status: 'sent_to_pinnacle', requested_carriers: modalCarriers } : null
      );

      return { success: true };
    } catch (err) {
      console.error('Error sending to Pinnacle:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to send to Pinnacle');
      return { success: false };
    }
  };

  // Map carrier codes to display names for modal
  const carrierDisplayNames = modalCarriers.map((code) => {
    const carrierMap: Record<string, string> = {
      aetna: 'Aetna',
      humana: 'Humana',
      anthem: 'Anthem',
      cigna: 'Cigna',
      uhc: 'UHC',
      wellcare: 'Wellcare',
      devoted: 'Devoted',
      molina: 'Molina',
      bcbs: 'BCBS',
      essence: 'Essence',
    };
    return carrierMap[code] || code;
  });

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
          {isLoading ? (
            <div className="h-full flex items-center justify-center bg-muted/20">
              <div className="text-center text-muted-foreground">
                <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm">Loading queue...</p>
              </div>
            </div>
          ) : selectedAgent ? (
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

      {/* Send to Pinnacle Modal */}
      <SendToPinnacleModal
        isOpen={showPinnacleModal}
        onClose={() => setShowPinnacleModal(false)}
        agentName={selectedAgent?.full_legal_name || ''}
        agentNpn={selectedAgent?.npn_number || null}
        agentState={selectedAgent?.resident_state || null}
        selectedCarriers={carrierDisplayNames}
        documents={modalDocuments}
        onSend={handleModalSend}
      />
    </div>
  );
}
