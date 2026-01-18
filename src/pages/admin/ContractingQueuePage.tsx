import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';
import {
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  Users,
  Eye,
  Mail,
  FileText,
  MoreHorizontal,
  X,
  ExternalLink,
  Loader2,
  PartyPopper
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { SendToPinnacleModal, PinnacleDocument, SendToPinnacleData } from '@/components/contracting/SendToPinnacleModal';
import { useSendEmail, fileUrlToBase64, EmailAttachment } from '@/hooks/useSendEmail';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { US_STATES } from '@/types/contracting';
import { logActivity, ActivityAction, EntityType } from '@/utils/activityLogger';

// Types
type QueueStatus = 'needs_action' | 'in_progress' | 'sent_to_pinnacle' | 'completed';
type FilterStatus = QueueStatus | 'all';

interface QueueAgent {
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

// Helper to get document label, including non-resident licenses
const getDocumentLabel = (key: string): string | null => {
  if (DOCUMENT_LABELS[key]) {
    return DOCUMENT_LABELS[key];
  }
  // Handle non-resident license pattern: non_resident_license_XX
  if (key.startsWith('non_resident_license_')) {
    const stateCode = key.replace('non_resident_license_', '');
    const stateName = US_STATES.find(s => s.code === stateCode)?.name || stateCode;
    return `${stateName} License`;
  }
  return null;
};

// Names must match RTS import names exactly to avoid duplicates on My Carriers page
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

const STATUS_CONFIG: Record<QueueStatus, { label: string; color: string; bgColor: string }> = {
  needs_action: { label: 'Needs Action', color: 'text-red-700', bgColor: 'bg-red-50 border-red-200' },
  in_progress: { label: 'In Progress', color: 'text-amber-700', bgColor: 'bg-amber-50 border-amber-200' },
  sent_to_pinnacle: { label: 'Sent to Pinnacle', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200' },
  completed: { label: 'Completed', color: 'text-emerald-700', bgColor: 'bg-emerald-50 border-emerald-200' },
};

// Stat Card Component
function StatCard({
  label,
  count,
  icon: Icon,
  color,
  isActive,
  onClick,
}: {
  label: string;
  count: number;
  icon: typeof Clock;
  color: string;
  isActive?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 rounded-lg border transition-all min-w-[140px]",
        isActive
          ? "bg-slate-900 border-slate-900 text-white"
          : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : color)} />
      <div className="text-left">
        <p className={cn("text-xl font-semibold leading-none", isActive ? "text-white" : "text-slate-900")}>
          {count}
        </p>
        <p className={cn("text-xs mt-0.5", isActive ? "text-slate-300" : "text-slate-500")}>
          {label}
        </p>
      </div>
    </button>
  );
}

// Document Preview Modal Component
function DocumentPreview({
  url,
  label,
  onClose,
}: {
  url: string;
  label: string;
  onClose: () => void;
}) {
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url.split('?')[0]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in zoom-in-95 fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h3 className="font-medium text-slate-900">{label}</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => window.open(url, '_blank')}
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Open in Tab
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-slate-100 min-h-[400px]">
          {isImage ? (
            <div className="flex items-center justify-center p-4 h-full">
              <img
                src={url}
                alt={label}
                className="max-w-full max-h-[70vh] object-contain rounded shadow-lg"
              />
            </div>
          ) : (
            <iframe
              src={url}
              title={label}
              className="w-full h-[70vh] border-0"
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Detail Panel Component
function DetailPanel({
  agent,
  onClose,
  onStatusChange,
  onCarriersChange,
  onSendToPinnacle,
}: {
  agent: QueueAgent;
  onClose: () => void;
  onStatusChange: (agentId: string, status: QueueStatus) => void;
  onCarriersChange: (agentId: string, carriers: string[]) => void;
  onSendToPinnacle: (agent: QueueAgent) => void;
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
        .from('contracting-documents')
        .createSignedUrl(path, 300); // URL valid for 5 minutes

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

  const canSendToPinnacle = agent.queue_status === 'needs_action' || agent.queue_status === 'in_progress';

  return (
    <div className="fixed inset-y-0 right-0 w-[400px] bg-white shadow-xl border-l border-slate-200 z-50 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-slate-900 truncate">
            {agent.full_legal_name || 'Unnamed Agent'}
          </h2>
          <p className="text-xs text-slate-500 truncate">
            NPN: {agent.npn_number || 'N/A'} · {agent.resident_state || 'N/A'}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 shrink-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Status & Contact */}
      <div className="px-4 py-3 border-b border-slate-200 space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-500 w-14">Status</span>
          <Select
            value={agent.queue_status}
            onValueChange={(value) => onStatusChange(agent.id, value as QueueStatus)}
          >
            <SelectTrigger className="h-8 flex-1 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                <SelectItem key={value} value={value} className="text-xs">
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {agent.email_address && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-500 w-14">Email</span>
            <span className="text-xs text-slate-700 truncate">{agent.email_address}</span>
          </div>
        )}
        {agent.phone_mobile && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-500 w-14">Phone</span>
            <span className="text-xs text-slate-700">{agent.phone_mobile}</span>
          </div>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Documents */}
        <div className="px-4 py-3 border-b border-slate-200">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
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
                      className="flex flex-col items-center gap-0.5 p-2 rounded border border-slate-200 hover:border-amber-400 hover:bg-amber-50 transition-colors group disabled:opacity-50"
                    >
                      {loadingDoc === docType ? (
                        <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />
                      ) : (
                        <FileText className="h-4 w-4 text-slate-400 group-hover:text-amber-600" />
                      )}
                      <span className="text-[10px] text-slate-500 text-center leading-tight">
                        {getDocumentLabel(docType)?.split(' ')[0]}
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{getDocumentLabel(docType)} - Click to view</TooltipContent>
                </Tooltip>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No documents uploaded</p>
          )}
        </div>

        {/* Carriers */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Carriers
            </h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs px-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
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
                <span className="text-sm text-slate-700 group-hover:text-amber-600">
                  {carrier.name}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t border-slate-200 space-y-2">
        <Button
          className="w-full h-9 bg-amber-500 hover:bg-amber-600 text-white"
          disabled={!canSendToPinnacle}
          onClick={() => onSendToPinnacle(agent)}
        >
          <Send className="h-4 w-4 mr-2" />
          Send to Pinnacle
        </Button>
        <Button
          variant="outline"
          className="w-full h-9 text-slate-600"
          onClick={() => agent.profile_id && (window.location.href = `/admin/agents/${agent.profile_id}`)}
          disabled={!agent.profile_id}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          View Full Profile
        </Button>
      </div>

      {/* Document Preview Modal */}
      {previewDoc && (
        <DocumentPreview
          url={previewDoc.url}
          label={previewDoc.label}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
}

// Main Component
export default function ContractingQueuePage() {
  const [agents, setAgents] = useState<QueueAgent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<QueueAgent | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Modal state
  const [showPinnacleModal, setShowPinnacleModal] = useState(false);
  const [modalCarriers, setModalCarriers] = useState<string[]>([]);
  const [modalDocuments, setModalDocuments] = useState<PinnacleDocument[]>([]);

  const { sendEmail } = useSendEmail();

  // Fetch applications
  const fetchApplications = useCallback(async () => {
    try {
      // Fetch contracting applications
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
        .or('is_test.is.null,is_test.eq.false')
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles to get profile IDs from user IDs
      const userIds = (data || []).map(app => app.user_id).filter(Boolean);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, user_id')
        .in('user_id', userIds);

      // Create user_id -> profile_id lookup map
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

  // Stats
  const stats = useMemo(() => {
    return {
      needsAction: agents.filter((a) => a.queue_status === 'needs_action').length,
      inProgress: agents.filter((a) => a.queue_status === 'in_progress').length,
      sentToPinnacle: agents.filter((a) => a.queue_status === 'sent_to_pinnacle').length,
      completed: agents.filter((a) => a.queue_status === 'completed').length,
      total: agents.length,
    };
  }, [agents]);

  // Filtered agents
  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      // Status filter
      if (filterStatus !== 'all' && agent.queue_status !== filterStatus) {
        return false;
      }
      // Search filter
      if (searchTerm.trim()) {
        const search = searchTerm.toLowerCase();
        const name = (agent.full_legal_name || '').toLowerCase();
        const npn = (agent.npn_number || '').toLowerCase();
        const email = (agent.email_address || '').toLowerCase();
        return name.includes(search) || npn.includes(search) || email.includes(search);
      }
      return true;
    });
  }, [agents, filterStatus, searchTerm]);

  // Handlers
  const handleStatusChange = async (agentId: string, newStatus: QueueStatus) => {
    // Capture previous status for logging
    const previousStatus = agents.find((a) => a.id === agentId)?.queue_status;

    setAgents((prev) =>
      prev.map((agent) =>
        agent.id === agentId ? { ...agent, queue_status: newStatus } : agent
      )
    );
    if (selectedAgent?.id === agentId) {
      setSelectedAgent((prev) => (prev ? { ...prev, queue_status: newStatus } : null));
    }

    const { error } = await supabase
      .from('contracting_applications')
      .update({ queue_status: newStatus })
      .eq('id', agentId);

    if (error) {
      toast.error('Failed to update status');
      fetchApplications();
    } else {
      // Log the status change
      await logActivity(
        ActivityAction.QUEUE_STATUS_CHANGED,
        EntityType.CONTRACTING_APPLICATION,
        agentId,
        { previous_status: previousStatus, new_status: newStatus }
      );
    }
  };

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
            .from('contracting-documents')
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
          sent_to_pinnacle_at: new Date().toISOString(),
          requested_carriers: modalCarriers,
        })
        .eq('id', selectedAgent.id);

      if (updateError) {
        toast.error('Email sent but failed to update status');
      } else {
        toast.success(`Contracting request sent for ${selectedAgent.full_legal_name}`);

        // Log the Send to Pinnacle action
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

        // Create carrier_statuses records so agent sees carriers on My Carriers page
        try {
          // Fetch all carriers and filter case-insensitively (DB has mixed case)
          const { data: allCarriers, error: lookupError } = await supabase
            .from('carriers')
            .select('id, code');

          const modalCarriersLower = modalCarriers.map(c => c.toLowerCase());
          const carrierRecords = allCarriers?.filter(c =>
            modalCarriersLower.includes(c.code.toLowerCase())
          ) || [];

          if (lookupError) {
            console.error('Carrier lookup failed:', lookupError);
          } else if (carrierRecords.length > 0) {
            const { error: carrierStatusError } = await supabase
              .from('carrier_statuses')
              .upsert(
                carrierRecords.map(carrier => ({
                  user_id: selectedAgent.user_id,
                  carrier_id: carrier.id,
                  contracting_status: 'in_progress',
                })),
                { onConflict: 'user_id,carrier_id' }
              );

            if (carrierStatusError) {
              console.error('Failed to create carrier_statuses:', carrierStatusError);
            }
          }
        } catch (carrierErr) {
          console.error('Error creating carrier_statuses:', carrierErr);
        }
      }

      fetchApplications();
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

  const carrierDisplayNames = modalCarriers.map((code) => {
    const carrier = AVAILABLE_CARRIERS.find((c) => c.code === code);
    return carrier?.name || code;
  });

  const handleStatClick = (status: FilterStatus) => {
    setFilterStatus(filterStatus === status ? 'all' : status);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />

      {/* Main Content - Compact Layout */}
      <div className="pt-16">
        {/* Header Row */}
        <div className="px-6 py-3 bg-white border-b border-slate-200">
          <div className="max-w-[1400px] mx-auto flex items-center justify-between">
            <h1 className="text-lg font-semibold text-slate-900">Contracting Hub</h1>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={fetchApplications}>
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="px-6 py-3 bg-white border-b border-slate-200">
          <div className="max-w-[1400px] mx-auto flex items-center gap-3 overflow-x-auto">
            <StatCard
              label="Needs Action"
              count={stats.needsAction}
              icon={AlertCircle}
              color="text-red-500"
              isActive={filterStatus === 'needs_action'}
              onClick={() => handleStatClick('needs_action')}
            />
            <StatCard
              label="In Progress"
              count={stats.inProgress}
              icon={Clock}
              color="text-amber-500"
              isActive={filterStatus === 'in_progress'}
              onClick={() => handleStatClick('in_progress')}
            />
            <StatCard
              label="Sent to Pinnacle"
              count={stats.sentToPinnacle}
              icon={Send}
              color="text-blue-500"
              isActive={filterStatus === 'sent_to_pinnacle'}
              onClick={() => handleStatClick('sent_to_pinnacle')}
            />
            <StatCard
              label="Completed"
              count={stats.completed}
              icon={CheckCircle2}
              color="text-emerald-500"
              isActive={filterStatus === 'completed'}
              onClick={() => handleStatClick('completed')}
            />
            <div className="h-8 w-px bg-slate-200 mx-1" />
            <StatCard
              label="Total"
              count={stats.total}
              icon={Users}
              color="text-slate-500"
              isActive={filterStatus === 'all'}
              onClick={() => handleStatClick('all')}
            />
          </div>
        </div>

        {/* Search/Filter Row */}
        <div className="px-6 py-2 bg-slate-50 border-b border-slate-200">
          <div className="max-w-[1400px] mx-auto flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name, NPN, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-sm bg-white"
              />
            </div>
            {filterStatus !== 'all' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-slate-500"
                onClick={() => setFilterStatus('all')}
              >
                Clear filter
                <X className="h-3 w-3 ml-1" />
              </Button>
            )}
            <span className="text-xs text-slate-500 ml-auto">
              {filteredAgents.length} {filteredAgents.length === 1 ? 'agent' : 'agents'}
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="px-6 py-3">
          <div className="max-w-[1400px] mx-auto bg-white rounded-lg border border-slate-200 overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : filteredAgents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                {agents.length === 0 ? (
                  <>
                    <PartyPopper className="h-10 w-10 text-emerald-400 mb-3" />
                    <p className="text-sm font-medium text-slate-700">All caught up!</p>
                    <p className="text-xs text-slate-500 mt-1">No pending applications.</p>
                  </>
                ) : (
                  <>
                    <Search className="h-10 w-10 text-slate-300 mb-3" />
                    <p className="text-sm font-medium text-slate-700">No matches found</p>
                    <p className="text-xs text-slate-500 mt-1">Try adjusting your search or filter.</p>
                  </>
                )}
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left text-xs font-medium text-slate-500 px-4 py-2">Agent</th>
                    <th className="text-left text-xs font-medium text-slate-500 px-4 py-2">NPN</th>
                    <th className="text-left text-xs font-medium text-slate-500 px-4 py-2">State</th>
                    <th className="text-left text-xs font-medium text-slate-500 px-4 py-2">Status</th>
                    <th className="text-left text-xs font-medium text-slate-500 px-4 py-2">Submitted</th>
                    <th className="text-left text-xs font-medium text-slate-500 px-4 py-2">Docs</th>
                    <th className="text-right text-xs font-medium text-slate-500 px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAgents.map((agent) => {
                    const status = STATUS_CONFIG[agent.queue_status] || STATUS_CONFIG.needs_action;
                    const docCount = Object.values(agent.uploaded_documents || {}).filter(Boolean).length;

                    return (
                      <tr
                        key={agent.id}
                        className={cn(
                          "border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer",
                          selectedAgent?.id === agent.id && "bg-amber-50"
                        )}
                        onClick={() => setSelectedAgent(agent)}
                      >
                        <td className="px-4 py-2">
                          <div>
                            <p className="text-sm font-medium text-slate-900 truncate max-w-[200px]">
                              {agent.full_legal_name || 'Unnamed'}
                            </p>
                            <p className="text-xs text-slate-500 truncate max-w-[200px]">
                              {agent.email_address || 'No email'}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <span className="text-sm text-slate-700 font-mono">
                            {agent.npn_number || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <span className="text-sm text-slate-700">
                            {agent.resident_state || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <Badge
                            variant="outline"
                            className={cn("text-xs px-2 py-0.5 font-medium border", status.bgColor, status.color)}
                          >
                            {status.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-xs text-slate-500 cursor-help">
                                {agent.submitted_at
                                  ? formatDistanceToNow(new Date(agent.submitted_at), { addSuffix: true })
                                  : '—'}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {agent.submitted_at
                                ? format(new Date(agent.submitted_at), 'MMM d, yyyy h:mm a')
                                : 'Not submitted'}
                            </TooltipContent>
                          </Tooltip>
                        </td>
                        <td className="px-4 py-2">
                          <span className={cn(
                            "text-xs font-medium",
                            docCount > 0 ? "text-emerald-600" : "text-slate-400"
                          )}>
                            {docCount}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => setSelectedAgent(agent)}
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>View Details</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  disabled={agent.queue_status !== 'needs_action' && agent.queue_status !== 'in_progress'}
                                  onClick={() => {
                                    setSelectedAgent(agent);
                                    handleSendToPinnacle(agent);
                                  }}
                                >
                                  <Send className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Send to Pinnacle</TooltipContent>
                            </Tooltip>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <MoreHorizontal className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => agent.profile_id && (window.location.href = `/admin/agents/${agent.profile_id}`)}
                                  disabled={!agent.profile_id}
                                >
                                  <ExternalLink className="h-3.5 w-3.5 mr-2" />
                                  View Full Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(agent.id, 'completed')}>
                                  <CheckCircle2 className="h-3.5 w-3.5 mr-2" />
                                  Mark Complete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

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
            onStatusChange={handleStatusChange}
            onCarriersChange={handleCarriersChange}
            onSendToPinnacle={handleSendToPinnacle}
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
    </div>
  );
}
