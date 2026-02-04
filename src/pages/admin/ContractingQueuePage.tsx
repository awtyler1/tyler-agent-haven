import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';
import {
  Search,
  CheckCircle2,
  Send,
  Eye,
  FileText,
  X,
  ExternalLink,
  Loader2,
  PartyPopper,
  ChevronDown,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { PageLoader } from '@/components/ui/PageLoader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SendToPinnacleModal, PinnacleDocument, SendToPinnacleData } from '@/components/contracting/SendToPinnacleModal';
import { useSendEmail, fileUrlToBase64, EmailAttachment } from '@/hooks/useSendEmail';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { US_STATES } from '@/types/contracting';
import { logActivity, ActivityAction, EntityType } from '@/utils/activityLogger';
import { DocumentPreview } from '@/components/ui/DocumentPreview';

// Types
type QueueStatus = 'needs_action' | 'in_progress' | 'sent_to_pinnacle' | 'completed';

interface QueueAgent {
  id: string;
  user_id: string;
  profile_id: string | null;
  full_legal_name: string | null;
  npn_number: string | null;
  resident_state: string | null;
  queue_status: QueueStatus;
  submitted_at: string | null;
  sent_to_pinnacle_at: string | null;
  email_address: string | null;
  phone_mobile: string | null;
  requested_carriers: string[];
  uploaded_documents?: Record<string, string>;
}

// Constants
const DOCUMENT_LABELS: Record<string, string> = {
  contracting_packet: 'Contracting Packet',
  eo_certificate: 'E&O Certificate',
  insurance_license: 'Resident License',
  voided_check: 'Voided Check',
  government_id: 'Government ID',
  aml_certificate: 'AML Certificate',
  ce_certificate: 'CE Certificate',
  ltc_certificate: 'LTC Certificate',
  corporate_resolution: 'Corporate Resolution',
  background_explanation: 'Background Documentation',
};

const getDocumentLabel = (key: string): string | null => {
  if (DOCUMENT_LABELS[key]) {
    return DOCUMENT_LABELS[key];
  }
  if (key.startsWith('non_resident_license_')) {
    const stateCode = key.replace('non_resident_license_', '');
    const stateName = US_STATES.find(s => s.code === stateCode)?.name || stateCode;
    return `${stateName} License`;
  }
  return null;
};

const AVAILABLE_CARRIERS = [
  { code: 'aetna', name: 'Aetna' },
  { code: 'humana', name: 'Humana' },
  { code: 'anthem', name: 'Anthem' },
  { code: 'cigna', name: 'Cigna' },
  { code: 'uhc', name: 'UHC' },
  { code: 'wellcare', name: 'Wellcare' },
  { code: 'devoted', name: 'Devoted Health' },
  { code: 'molina', name: 'Molina' },
  { code: 'bcbs', name: 'BCBS' },
  { code: 'essence', name: 'Essence Healthcare' },
];

const KY_CARRIER_CODES = ['aetna', 'anthem', 'devoted', 'humana', 'uhc', 'wellcare', 'essence'];

// Detail Panel Component
function DetailPanel({
  agent,
  onClose,
  onCarriersChange,
  onSendToPinnacle,
  onMarkComplete,
  onDelete,
}: {
  agent: QueueAgent;
  onClose: () => void;
  onCarriersChange: (agentId: string, carriers: string[]) => void;
  onSendToPinnacle: (agent: QueueAgent) => void;
  onMarkComplete: (agentId: string) => void;
  onDelete: (agentId: string, agentName: string) => void;
}) {
  const [loadingDoc, setLoadingDoc] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; label: string } | null>(null);

  const documents = agent.uploaded_documents || {};
  const docEntries = Object.entries(documents).filter(
    ([key, value]) => value && getDocumentLabel(key)
  );

  const handleViewDocument = async (docType: string, path: string) => {
    setLoadingDoc(docType);
    try {
      const { data, error } = await supabase.storage
        .from('agent-documents')
        .createSignedUrl(path, 300);

      if (error) throw error;
      if (!data?.signedUrl) throw new Error('Failed to create signed URL');

      setPreviewDoc({
        url: data.signedUrl,
        label: getDocumentLabel(docType) || docType,
      });
    } catch (error) {
      console.error('Error viewing document:', error);
      toast.error('Failed to open document');
    } finally {
      setLoadingDoc(null);
    }
  };

  const handleCarrierToggle = (carrierCode: string, checked: boolean) => {
    const newCarriers = checked
      ? [...agent.requested_carriers, carrierCode]
      : agent.requested_carriers.filter((c) => c !== carrierCode);
    onCarriersChange(agent.id, newCarriers);
  };

  const isCompleted = agent.queue_status === 'completed' || agent.queue_status === 'sent_to_pinnacle';

  return (
    <div className="fixed inset-y-0 right-0 w-[400px] bg-white shadow-xl border-l border-border z-50 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-foreground truncate">
            {agent.full_legal_name || 'Unnamed Agent'}
          </h2>
          <p className="text-xs text-muted-foreground truncate">
            NPN: {agent.npn_number || 'N/A'} · {agent.resident_state || 'N/A'}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 shrink-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Contact Info */}
      <div className="px-4 py-3 border-b border-border space-y-2">
        {agent.email_address && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-muted-foreground w-14">Email</span>
            <span className="text-xs text-foreground truncate">{agent.email_address}</span>
          </div>
        )}
        {agent.phone_mobile && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-muted-foreground w-14">Phone</span>
            <span className="text-xs text-foreground">{agent.phone_mobile}</span>
          </div>
        )}
        {agent.submitted_at && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-muted-foreground w-14">Submitted</span>
            <span className="text-xs text-foreground">
              {format(new Date(agent.submitted_at), 'MMM d, yyyy')}
            </span>
          </div>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Documents */}
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Documents ({docEntries.length})
          </h3>
          {docEntries.length > 0 ? (
            <div className="grid grid-cols-4 gap-1.5">
              {docEntries.map(([docType, path]) => (
                <Tooltip key={docType}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleViewDocument(docType, path)}
                      disabled={loadingDoc === docType}
                      className="flex flex-col items-center gap-0.5 p-2 rounded border border-border hover:border-primary hover:bg-primary/5 transition-colors group disabled:opacity-50"
                    >
                      {loadingDoc === docType ? (
                        <Loader2 className="h-4 w-4 text-primary animate-spin" />
                      ) : (
                        <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                      )}
                      <span className="text-[10px] text-muted-foreground text-center leading-tight">
                        {getDocumentLabel(docType)?.split(' ')[0]}
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{getDocumentLabel(docType)} - Click to view</TooltipContent>
                </Tooltip>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">No documents uploaded</p>
          )}
        </div>

        {/* Carriers - only show for non-completed */}
        {!isCompleted && (
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Carriers to Request
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs px-2 text-primary hover:text-primary/90 hover:bg-primary/10"
                onClick={() => onCarriersChange(agent.id, KY_CARRIER_CODES)}
              >
                KY Default
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
              {AVAILABLE_CARRIERS.map((carrier) => (
                <label key={carrier.code} className="flex items-center gap-2 py-1 cursor-pointer group">
                  <Checkbox
                    checked={agent.requested_carriers.includes(carrier.code)}
                    onCheckedChange={(checked) => handleCarrierToggle(carrier.code, checked as boolean)}
                    className="h-3.5 w-3.5"
                  />
                  <span className="text-sm text-foreground group-hover:text-primary">
                    {carrier.name}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Show sent info for completed */}
        {isCompleted && agent.sent_to_pinnacle_at && (
          <div className="px-4 py-3">
            <div className="p-3 rounded-lg bg-green-50 border border-green-200">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">Sent to Pinnacle</span>
              </div>
              <p className="text-xs text-green-600 mt-1">
                {format(new Date(agent.sent_to_pinnacle_at), 'MMMM d, yyyy \'at\' h:mm a')}
              </p>
              {agent.requested_carriers.length > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  Carriers: {agent.requested_carriers.map(code =>
                    AVAILABLE_CARRIERS.find(c => c.code === code)?.name || code
                  ).join(', ')}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t border-border space-y-2">
        {!isCompleted ? (
          <>
            <Button
              className="w-full h-9"
              onClick={() => onSendToPinnacle(agent)}
            >
              <Send className="h-4 w-4 mr-2" />
              Send to Pinnacle
            </Button>
            <Button
              variant="outline"
              className="w-full h-9"
              onClick={() => onMarkComplete(agent.id)}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Mark as Completed
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            className="w-full h-9"
            onClick={() => agent.profile_id && (window.location.href = `/admin/agents/${agent.profile_id}`)}
            disabled={!agent.profile_id}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Full Profile
          </Button>
        )}
        <Button
          variant="ghost"
          className="w-full h-9 text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={() => onDelete(agent.id, agent.full_legal_name || 'this application')}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Application
        </Button>
      </div>

      {/* Document Preview Modal */}
      <DocumentPreview
        url={previewDoc?.url || ''}
        label={previewDoc?.label || ''}
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
      />
    </div>
  );
}

// Agent Row Component
function AgentRow({
  agent,
  onView,
  showSentDate,
}: {
  agent: QueueAgent;
  onView: () => void;
  showSentDate?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3 border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
      onClick={onView}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate">
          {agent.full_legal_name || 'Unnamed Agent'}
        </p>
        {showSentDate && agent.sent_to_pinnacle_at ? (
          <p className="text-xs text-muted-foreground">
            Sent {format(new Date(agent.sent_to_pinnacle_at), 'MMM d, yyyy')}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground truncate">
            {agent.email_address || 'No email'} · {agent.resident_state || 'N/A'}
          </p>
        )}
      </div>
      <Button variant="ghost" size="sm" className="h-8 ml-2" onClick={(e) => { e.stopPropagation(); onView(); }}>
        <Eye className="h-4 w-4 mr-1.5" />
        View
      </Button>
    </div>
  );
}

// Main Component
export default function ContractingQueuePage() {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<QueueAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // URL state persistence
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get('q') || '';
  const showCompleted = searchParams.get('completed') === 'true';
  const selectedAgentId = searchParams.get('agent') || null;

  const updateParams = (updates: Record<string, string | null>) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '') next.delete(key);
        else next.set(key, value);
      });
      return next;
    }, { replace: true });
  };

  // Derive selectedAgent from agents list and URL param
  const selectedAgent = useMemo(() => {
    if (!selectedAgentId) return null;
    return agents.find(a => a.id === selectedAgentId) || null;
  }, [agents, selectedAgentId]);

  const setSelectedAgent = (agent: QueueAgent | null) => {
    updateParams({ agent: agent?.id || null });
  };

  // Modal state
  const [showPinnacleModal, setShowPinnacleModal] = useState(false);
  const [modalCarriers, setModalCarriers] = useState<string[]>([]);
  const [modalDocuments, setModalDocuments] = useState<PinnacleDocument[]>([]);

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { sendEmail } = useSendEmail();

  // Fetch applications
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
          sent_to_pinnacle_at,
          email_address,
          phone_mobile,
          requested_carriers,
          uploaded_documents
        `)
        .eq('status', 'submitted')
        .or('is_test.is.null,is_test.eq.false')
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      const userIds = (data || []).map(app => app.user_id).filter(Boolean);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, user_id')
        .in('user_id', userIds);

      const profileIdMap: Record<string, string> = {};
      (profiles || []).forEach(p => {
        if (p.user_id) profileIdMap[p.user_id] = p.id;
      });

      const mappedAgents: QueueAgent[] = (data || []).map((app) => ({
        id: app.id,
        user_id: app.user_id,
        profile_id: profileIdMap[app.user_id] || null,
        full_legal_name: app.full_legal_name,
        npn_number: app.npn_number,
        resident_state: app.resident_state,
        queue_status: (app.queue_status as QueueStatus) || 'needs_action',
        submitted_at: app.submitted_at,
        sent_to_pinnacle_at: app.sent_to_pinnacle_at,
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

  // Split agents into ready and completed
  const { readyToSend, completed } = useMemo(() => {
    const ready: QueueAgent[] = [];
    const done: QueueAgent[] = [];

    agents.forEach((agent) => {
      // Completed = sent_to_pinnacle or completed status
      if (agent.queue_status === 'completed' || agent.queue_status === 'sent_to_pinnacle') {
        done.push(agent);
      } else {
        ready.push(agent);
      }
    });

    return { readyToSend: ready, completed: done };
  }, [agents]);

  // Filtered by search
  const filteredReadyToSend = useMemo(() => {
    if (!searchTerm.trim()) return readyToSend;
    const search = searchTerm.toLowerCase();
    return readyToSend.filter((agent) => {
      const name = (agent.full_legal_name || '').toLowerCase();
      const email = (agent.email_address || '').toLowerCase();
      const npn = (agent.npn_number || '').toLowerCase();
      return name.includes(search) || email.includes(search) || npn.includes(search);
    });
  }, [readyToSend, searchTerm]);

  const filteredCompleted = useMemo(() => {
    if (!searchTerm.trim()) return completed;
    const search = searchTerm.toLowerCase();
    return completed.filter((agent) => {
      const name = (agent.full_legal_name || '').toLowerCase();
      const email = (agent.email_address || '').toLowerCase();
      const npn = (agent.npn_number || '').toLowerCase();
      return name.includes(search) || email.includes(search) || npn.includes(search);
    });
  }, [completed, searchTerm]);

  // Handlers
  const handleCarriersChange = async (agentId: string, carriers: string[]) => {
    setAgents((prev) =>
      prev.map((agent) =>
        agent.id === agentId ? { ...agent, requested_carriers: carriers } : agent
      )
    );
    if (selectedAgent?.id === agentId) {
      setSelectedAgent((prev) => (prev ? { ...prev, requested_carriers: carriers } : null));
    }

    const { error } = await supabase
      .from('contracting_applications')
      .update({ requested_carriers: carriers })
      .eq('id', agentId);

    if (error) {
      toast.error('Failed to update carriers');
      fetchApplications();
    }
  };

  const handleMarkComplete = async (agentId: string) => {
    const { error } = await supabase
      .from('contracting_applications')
      .update({
        queue_status: 'completed',
        status: 'completed'  // Also update main status to reduce pending counter
      })
      .eq('id', agentId);

    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success('Marked as completed');
      await logActivity(
        ActivityAction.QUEUE_STATUS_CHANGED,
        EntityType.CONTRACTING_APPLICATION,
        agentId,
        { new_status: 'completed' }
      );
      setSelectedAgent(null);
      fetchApplications();
    }
  };

  const handleDelete = (agentId: string, agentName: string) => {
    setDeleteTarget({ id: agentId, name: agentName });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);

    try {
      // Use Supabase's built-in function invocation (handles auth automatically)
      const { data, error } = await supabase.functions.invoke('delete-contracting-application', {
        body: { applicationId: deleteTarget.id },
      });

      if (error) {
        throw new Error(error.message || 'Failed to delete application');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to delete application');
      }

      toast.success('Application deleted');
      await logActivity(
        ActivityAction.CONTRACTING_DELETED,
        EntityType.CONTRACTING_APPLICATION,
        deleteTarget.id,
        { agent_name: deleteTarget.name }
      );
      setSelectedAgent(null);
      fetchApplications();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete application');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  };

  const handleSendToPinnacle = (agent: QueueAgent) => {
    setModalCarriers([...agent.requested_carriers]);
    const docs: PinnacleDocument[] = [];
    const uploadedDocs = agent.uploaded_documents || {};

    for (const [docType, filePath] of Object.entries(uploadedDocs)) {
      const label = getDocumentLabel(docType);
      if (filePath && label) {
        docs.push({
          type: docType,
          label: label,
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
      const attachments: EmailAttachment[] = [];

      for (const doc of modalDocuments) {
        if (data.selectedDocuments.includes(doc.type) && doc.url) {
          const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from('agent-documents')
            .createSignedUrl(doc.url, 300);

          if (signedUrlError || !signedUrlData?.signedUrl) continue;

          const base64Data = await fileUrlToBase64(signedUrlData.signedUrl);
          if (base64Data) {
            const npn = selectedAgent.npn_number || 'Unknown';
            const originalFileName = doc.url.split('/').pop() || '';
            const extension = originalFileName.includes('.') ? originalFileName.split('.').pop() : 'pdf';
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

      const result = await sendEmail({
        to: data.to,
        subject: data.subject,
        body: data.body.replace(/\n/g, '<br>'),
        attachments,
        agentId: selectedAgent.user_id,
        communicationType: 'initial_contracting',
        carriersIncluded: modalCarriers,
      });

      if (!result.success) {
        toast.error(result.error || 'Failed to send email');
        return { success: false };
      }

      const { error: updateError } = await supabase
        .from('contracting_applications')
        .update({
          queue_status: 'sent_to_pinnacle',
          status: 'processing',  // Update main status to reduce pending counter
          sent_to_pinnacle_at: new Date().toISOString(),
          requested_carriers: modalCarriers,
        })
        .eq('id', selectedAgent.id);

      if (updateError) {
        // CRITICAL: Email was sent but status update failed - system is in inconsistent state
        // Return failure so the user knows to manually fix the status
        console.error('Status update failed after email sent:', updateError);
        toast.error('Email sent but failed to update application status. Please manually mark this application as sent.');
        fetchApplications();
        setSelectedAgent(null);
        return { success: false };
      }

      toast.success(`Contracting request sent for ${selectedAgent.full_legal_name}`);

      await logActivity(
        ActivityAction.SENT_TO_PINNACLE,
        EntityType.CONTRACTING_APPLICATION,
        selectedAgent.id,
        {
          agent_name: selectedAgent.full_legal_name,
          carriers: modalCarriers,
          recipient: data.to,
        }
      );

      // Create carrier_statuses records (non-critical, don't fail on error)
      try {
        const { data: allCarriers, error: lookupError } = await supabase
          .from('carriers')
          .select('id, code');

        const modalCarriersLower = modalCarriers.map(c => c.toLowerCase());
        const carrierRecords = allCarriers?.filter(c =>
          modalCarriersLower.includes(c.code.toLowerCase())
        ) || [];

        if (!lookupError && carrierRecords.length > 0) {
          await supabase
            .from('carrier_statuses')
            .upsert(
              carrierRecords.map(carrier => ({
                user_id: selectedAgent.user_id,
                carrier_id: carrier.id,
                contracting_status: 'in_progress',
              })),
              { onConflict: 'user_id,carrier_id' }
            );
        }
      } catch (carrierErr) {
        console.error('Error creating carrier_statuses:', carrierErr);
      }

      fetchApplications();
      setSelectedAgent(null);

      return { success: true };
    } catch (err) {
      console.error('Error sending to Pinnacle:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to send to Pinnacle');
      return { success: false };
    }
  };

  const carrierDisplayNames = modalCarriers.map((code) => {
    const carrier = AVAILABLE_CARRIERS.find((c) => c.code === code);
    return carrier?.name || code;
  });

  // Show PageLoader while initially loading
  if (isLoading) {
    return <PageLoader message="Loading contracting queue..." />;
  }

  return (
    <AdminLayout>
      {/* Header */}
      <h1 className="text-2xl font-serif font-medium text-foreground">Contracting Queue</h1>

      {/* Stat Cards */}
      <div className="flex gap-4 mt-4 mb-6">
        <div className="bg-white border border-border rounded-xl px-5 py-4 flex items-center gap-4">
          <div className="text-3xl font-serif font-medium text-foreground">{readyToSend.length}</div>
          <div className="text-sm text-muted-foreground">Ready to Send</div>
        </div>
        <div className="bg-white border border-border rounded-xl px-5 py-4 flex items-center gap-4">
          <div className="text-3xl font-serif font-medium text-green-600">{completed.length}</div>
          <div className="text-sm text-muted-foreground">Completed</div>
        </div>
      </div>

      {/* Search */}
      {agents.length > 0 && (
        <div className="relative max-w-sm mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, NPN, or email..."
            value={searchTerm}
            onChange={(e) => updateParams({ q: e.target.value || null })}
            className="pl-9 h-9 text-sm"
          />
        </div>
      )}

      {agents.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <PartyPopper className="h-12 w-12 text-green-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-1">All caught up!</h3>
          <p className="text-sm text-muted-foreground">No pending contracting applications.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Ready to Send Section */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Ready to Send ({filteredReadyToSend.length})
            </h2>
            <div className="bg-white rounded-xl border border-border overflow-hidden">
              {filteredReadyToSend.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  {searchTerm ? (
                    <p className="text-sm text-muted-foreground">No matches found</p>
                  ) : (
                    <>
                      <CheckCircle2 className="h-8 w-8 text-green-400 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">All applications have been sent!</p>
                    </>
                  )}
                </div>
              ) : (
                filteredReadyToSend.map((agent) => (
                  <AgentRow
                    key={agent.id}
                    agent={agent}
                    onView={() => setSelectedAgent(agent)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Completed Section */}
          {completed.length > 0 && (
            <div>
              <button
                onClick={() => updateParams({ completed: showCompleted ? null : 'true' })}
                className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 hover:text-foreground transition-colors"
              >
                {showCompleted ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                Completed ({filteredCompleted.length})
              </button>
              {showCompleted && (
                <div className="bg-white rounded-xl border border-border overflow-hidden">
                  {filteredCompleted.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <p className="text-sm text-muted-foreground">No matches found</p>
                    </div>
                  ) : (
                    filteredCompleted.map((agent) => (
                      <AgentRow
                        key={agent.id}
                        agent={agent}
                        onView={() => setSelectedAgent(agent)}
                        showSentDate
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Detail Panel */}
      {selectedAgent && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setSelectedAgent(null)}
          />
          <DetailPanel
            agent={selectedAgent}
            onClose={() => setSelectedAgent(null)}
            onCarriersChange={handleCarriersChange}
            onSendToPinnacle={handleSendToPinnacle}
            onMarkComplete={handleMarkComplete}
            onDelete={handleDelete}
          />
        </>
      )}

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

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={(open) => !open && setShowDeleteModal(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Application</DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to permanently delete the application for{' '}
              <span className="font-semibold text-foreground">"{deleteTarget?.name}"</span>?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. All application data will be permanently removed.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteTarget(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
