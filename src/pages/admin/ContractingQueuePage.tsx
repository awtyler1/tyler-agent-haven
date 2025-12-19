import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  FileText, 
  Search, 
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Send,
  X,
  User,
  Calendar,
  MapPin,
  CreditCard,
  Building,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ContractingSubmission {
  id: string;
  user_id: string;
  full_legal_name: string | null;
  email_address: string | null;
  status: string;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
  npn_number: string | null;
  resident_state: string | null;
  uploaded_documents: unknown;
  selected_carriers: unknown;
  contract_level?: string | null;
  upline_id?: string | null;
  sent_to_upline_at?: string | null;
  sent_to_upline_by?: string | null;
}

interface Manager {
  id: string;
  full_name: string | null;
  email: string | null;
}

const DOCUMENT_LABELS: Record<string, string> = {
  insurance_license: 'Insurance License',
  government_id: 'Government ID',
  voided_check: 'Voided Check',
  eo_certificate: 'E&O Certificate',
  aml_certificate: 'AML Certificate',
  ce_certificate: 'CE Certificate',
  ltc_certificate: 'LTC Certificate',
  corporate_resolution: 'Corporate Resolution',
  background_explanation: 'Background Documentation',
  contracting_packet: 'Contracting Packet',
};

const CONTRACT_LEVELS = [
  { value: 'agent_level', label: 'Agent Level' },
  { value: 'street_level', label: 'Street Level' },
];

const initializeCarrierStatuses = async (applicationId: string, carriers: string[]) => {
  // Check if statuses already exist
  const { data: existing } = await supabase
    .from('carrier_statuses')
    .select('carrier_name')
    .eq('application_id', applicationId);

  const existingCarriers = existing?.map(e => e.carrier_name) || [];
  const newCarriers = carriers.filter(c => !existingCarriers.includes(c));

  if (newCarriers.length > 0) {
    const { error } = await supabase
      .from('carrier_statuses')
      .insert(newCarriers.map(carrier => ({
        application_id: applicationId,
        carrier_name: carrier,
        status: 'pending'
      })));

    if (error) console.error('Error initializing carrier statuses:', error);
  }
};

export default function ContractingQueuePage() {
  const [submissions, setSubmissions] = useState<ContractingSubmission[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; name: string } | null>(null);
  const [sendingToUpline, setSendingToUpline] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'approve' | 'reject' | null;
  }>({ open: false, action: null });
  const [processingAction, setProcessingAction] = useState(false);

  // Form state for selected submission
  const [contractLevel, setContractLevel] = useState('');
  const [uplineId, setUplineId] = useState('');
  const [carrierStatuses, setCarrierStatuses] = useState<Record<string, string>>({});
  const [updatingCarrier, setUpdatingCarrier] = useState<string | null>(null);

  const selected = submissions.find(s => s.id === selectedId);

  useEffect(() => {
    fetchSubmissions();
    fetchManagers();
  }, []);

  // Update form state when selection changes
  useEffect(() => {
    if (selected) {
      setContractLevel(selected.contract_level || '');
      setUplineId(selected.upline_id || '');
      
      // Initialize and fetch carrier statuses
      const carriers = (selected.selected_carriers as { carriers?: string[] })?.carriers || [];
      if (carriers.length > 0) {
        initializeCarrierStatuses(selected.id, carriers).then(() => {
          fetchCarrierStatuses(selected.id);
        });
      }
    }
  }, [selectedId, selected?.id]);

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('contracting_applications')
        .select('*')
        .order('submitted_at', { ascending: false, nullsFirst: false });

      if (error) throw error;
      setSubmissions(data || []);
      
      // Auto-select first submission
      if (data && data.length > 0 && !selectedId) {
        setSelectedId(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching submissions:', err);
      toast.error('Failed to load contracting submissions');
    } finally {
      setLoading(false);
    }
  };

  const fetchManagers = async () => {
    try {
      const { data: managerRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'manager');

      if (managerRoles && managerRoles.length > 0) {
        const managerIds = managerRoles.map(r => r.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email, user_id')
          .in('user_id', managerIds);
        
        if (profiles) {
          setManagers(profiles as Manager[]);
        }
      }
    } catch (err) {
      console.error('Error fetching managers:', err);
    }
  };

  const fetchCarrierStatuses = async (applicationId: string) => {
    const { data, error } = await supabase
      .from('carrier_statuses')
      .select('*')
      .eq('application_id', applicationId);

    if (error) {
      console.error('Error fetching carrier statuses:', error);
      return;
    }

    const statusMap: Record<string, string> = {};
    data?.forEach(cs => {
      statusMap[cs.carrier_name] = cs.status || 'pending';
    });
    setCarrierStatuses(statusMap);
  };

  const updateCarrierStatus = async (carrierName: string, newStatus: string) => {
    if (!selected) return;
    
    setUpdatingCarrier(carrierName);
    try {
      // Check if record exists
      const { data: existing } = await supabase
        .from('carrier_statuses')
        .select('id')
        .eq('application_id', selected.id)
        .eq('carrier_name', carrierName)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('carrier_statuses')
          .update({ 
            status: newStatus, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('carrier_statuses')
          .insert({
            application_id: selected.id,
            carrier_name: carrierName,
            status: newStatus
          });

        if (error) throw error;
      }

      setCarrierStatuses(prev => ({ ...prev, [carrierName]: newStatus }));
      toast.success(`${carrierName} status updated to ${newStatus}`);
    } catch (err) {
      console.error('Error updating carrier status:', err);
      toast.error('Failed to update carrier status');
    } finally {
      setUpdatingCarrier(null);
    }
  };

  const previewDocument = async (docPath: string, docType: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('contracting-documents')
        .createSignedUrl(docPath, 300);

      if (error) throw error;
      
      if (data?.signedUrl) {
        setPreviewDoc({
          url: data.signedUrl,
          name: DOCUMENT_LABELS[docType] || docType
        });
      }
    } catch (err) {
      console.error('Error previewing document:', err);
      toast.error('Failed to load document preview');
    }
  };

  const handleSendToUpline = async () => {
    if (!selected || !contractLevel || !uplineId) {
      toast.error('Please select contract level and upline');
      return;
    }

    setSendingToUpline(true);
    try {
      // Update the submission with contract level and upline
      const { error } = await supabase
        .from('contracting_applications')
        .update({
          contract_level: contractLevel,
          upline_id: uplineId,
          sent_to_upline_at: new Date().toISOString(),
          status: 'sent_to_upline'
        })
        .eq('id', selected.id);

      if (error) throw error;

      // TODO: Send email to upline (will implement with feature flag)
      
      toast.success('Sent to upline successfully');
      fetchSubmissions();
    } catch (err) {
      console.error('Error sending to upline:', err);
      toast.error('Failed to send to upline');
    } finally {
      setSendingToUpline(false);
    }
  };

  const handleApprove = async () => {
    if (!selected) return;
    
    setProcessingAction(true);
    try {
      const { error: appError } = await supabase
        .from('contracting_applications')
        .update({ status: 'approved' })
        .eq('id', selected.id);

      if (appError) throw appError;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          onboarding_status: 'APPOINTED',
          appointed_at: new Date().toISOString()
        })
        .eq('user_id', selected.user_id);

      if (profileError) throw profileError;

      toast.success(`${selected.full_legal_name || 'Agent'} has been approved`);
      fetchSubmissions();
    } catch (err) {
      console.error('Error approving:', err);
      toast.error('Failed to approve application');
    } finally {
      setProcessingAction(false);
      setConfirmDialog({ open: false, action: null });
    }
  };

  const handleReject = async () => {
    if (!selected) return;
    
    setProcessingAction(true);
    try {
      const { error: appError } = await supabase
        .from('contracting_applications')
        .update({ 
          status: 'rejected',
          signature_name: null,
          signature_date: null,
          section_acknowledgments: {},
        })
        .eq('id', selected.id);

      if (appError) throw appError;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ onboarding_status: 'CONTRACTING_REQUIRED' })
        .eq('user_id', selected.user_id);

      if (profileError) throw profileError;

      toast.success('Application rejected - agent can resubmit');
      fetchSubmissions();
    } catch (err) {
      console.error('Error rejecting:', err);
      toast.error('Failed to reject application');
    } finally {
      setProcessingAction(false);
      setConfirmDialog({ open: false, action: null });
    }
  };

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'submitted': return 'bg-blue-100 text-blue-700';
      case 'sent_to_upline': return 'bg-amber-100 text-amber-700';
      case 'approved': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'submitted': return 'New';
      case 'sent_to_upline': return 'Sent to Upline';
      case 'approved': return 'Appointed';
      case 'rejected': return 'Rejected';
      case 'in_progress': return 'In Progress';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'submitted': return <AlertCircle className="w-4 h-4" />;
      case 'sent_to_upline': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <X className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const filteredSubmissions = submissions.filter(s => {
    const matchesSearch = 
      s.full_legal_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.npn_number?.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: submissions.length,
    submitted: submissions.filter(s => s.status === 'submitted').length,
    sent_to_upline: submissions.filter(s => s.status === 'sent_to_upline').length,
    approved: submissions.filter(s => s.status === 'approved').length,
  };

  const docs = (selected?.uploaded_documents || {}) as Record<string, string | null>;
  const selectedCarriers = selected?.selected_carriers as { carriers?: string[] } | null;
  const carriers = (selectedCarriers?.carriers || []) as string[];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      <main className="flex-1 pt-20">
        <div className="flex h-[calc(100vh-80px)]">

          {/* Left Panel - List */}
          <div className="w-96 border-r border-border flex flex-col bg-card">

            {/* Header */}
            <div className="p-4 border-b border-border space-y-4">

              <h1 className="text-xl font-semibold text-foreground">Contracting Queue</h1>
              
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, NPN..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: 'all', label: 'All', count: statusCounts.all },
                  { value: 'submitted', label: 'New', count: statusCounts.submitted },
                  { value: 'sent_to_upline', label: 'Sent', count: statusCounts.sent_to_upline },
                  { value: 'approved', label: 'Appointed', count: statusCounts.approved },
                ].map(tab => (
                  <button
                    key={tab.value}
                    onClick={() => setStatusFilter(tab.value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                      statusFilter === tab.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>

            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredSubmissions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <FileText className="w-8 h-8 mb-2" />
                  <p className="text-sm">No submissions found</p>
                </div>
              ) : (
                filteredSubmissions.map(submission => (
                  <button
                    key={submission.id}
                    onClick={() => setSelectedId(submission.id)}
                    className={`w-full p-4 border-b border-border text-left transition-colors ${
                      selectedId === submission.id
                        ? 'bg-primary/10 border-l-4 border-l-primary'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-foreground truncate">
                        {submission.full_legal_name || 'Unknown'}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(submission.status)}`}>
                        {getStatusIcon(submission.status)}
                        {getStatusLabel(submission.status)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {submission.resident_state} • NPN: {submission.npn_number || 'N/A'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {submission.submitted_at 
                        ? `Submitted ${format(new Date(submission.submitted_at), 'MMM d, yyyy')}`
                        : 'Not submitted'}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right Panel - Details */}
          <div className="flex-1 overflow-y-auto bg-background">
            {selected ? (
              <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground">
                      {selected.full_legal_name}
                    </h2>
                    <p className="text-muted-foreground">{selected.email_address}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${getStatusStyle(selected.status)}`}>
                    {getStatusIcon(selected.status)}
                    {getStatusLabel(selected.status)}
                  </span>
                </div>

                {/* Quick Info Grid */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                      <CreditCard className="w-4 h-4" />
                      NPN
                    </div>
                    <p className="font-semibold text-foreground">{selected.npn_number || 'N/A'}</p>
                  </div>
                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                      <MapPin className="w-4 h-4" />
                      State
                    </div>
                    <p className="font-semibold text-foreground">{selected.resident_state || 'N/A'}</p>
                  </div>
                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                      <Calendar className="w-4 h-4" />
                      Submitted
                    </div>
                    <p className="font-semibold text-foreground">
                      {selected.submitted_at 
                        ? format(new Date(selected.submitted_at), 'MMM d')
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                      <Building className="w-4 h-4" />
                      Carriers
                    </div>
                    <p className="font-semibold text-foreground">{carriers.length}</p>
                  </div>
                </div>

                {/* Send to Upline Section */}
                {selected.status === 'submitted' && (
                  <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                    <div className="flex items-center gap-2 text-foreground font-medium">
                      <Send className="w-4 h-4" />
                      Ready to Send
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Contract Level
                        </label>
                        <Select value={contractLevel} onValueChange={setContractLevel}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select level..." />
                          </SelectTrigger>
                          <SelectContent>
                            {CONTRACT_LEVELS.map(level => (
                              <SelectItem key={level.value} value={level.value}>
                                {level.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Upline
                        </label>
                        <Select value={uplineId} onValueChange={setUplineId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select upline..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="direct_to_tig">Direct to TIG</SelectItem>
                            {managers.map(manager => (
                              <SelectItem key={manager.id} value={manager.id}>
                                {manager.full_name || manager.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button 
                      onClick={handleSendToUpline}
                      disabled={sendingToUpline || !contractLevel || !uplineId}
                      className="w-full"
                    >
                      {sendingToUpline ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      Send to Upline
                    </Button>
                  </div>
                )}

                {/* Sent Info */}
                {selected.status === 'sent_to_upline' && selected.sent_to_upline_at && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span className="text-amber-800 font-medium">
                        Sent to Upline on {format(new Date(selected.sent_to_upline_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                    {selected.contract_level && (
                      <p className="text-amber-700 text-sm mt-1">
                        {CONTRACT_LEVELS.find(l => l.value === selected.contract_level)?.label} • 
                        {selected.upline_id === 'direct_to_tig' 
                          ? ' Direct to TIG' 
                          : ` ${managers.find(m => m.id === selected.upline_id)?.full_name || 'Manager'}`}
                      </p>
                    )}
                  </div>
                )}

                {/* Documents */}
                <div className="space-y-3">
                  <h3 className="font-medium text-foreground">Documents</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(docs).map(([docType, docPath]) => {
                      if (!docPath) return null;
                      const isPacket = docType === 'contracting_packet';
                      return (
                        <button
                          key={docType}
                          onClick={() => previewDocument(docPath, docType)}
                          className={`flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                            isPacket 
                              ? 'bg-purple-50 hover:bg-purple-100 border border-purple-200'
                              : 'bg-muted/50 hover:bg-muted'
                          }`}
                        >
                          <div className={`p-2 rounded ${isPacket ? 'bg-purple-100' : 'bg-background'}`}>
                            <FileText className={`w-4 h-4 ${isPacket ? 'text-purple-600' : 'text-muted-foreground'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${isPacket ? 'text-purple-700' : 'text-foreground'}`}>
                              {DOCUMENT_LABELS[docType] || docType}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Click to preview
                            </p>
                          </div>
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </button>
                      );
                    })}
                    {Object.keys(docs).filter(k => docs[k]).length === 0 && (
                      <p className="text-muted-foreground text-sm col-span-2">
                        No documents uploaded
                      </p>
                    )}
                  </div>
                </div>

                {/* Carriers */}
                <div className="bg-white rounded-xl border border-[#E5E2DB] p-6 mb-6 shadow-sm">
                  <h3 className="font-semibold text-foreground mb-4">
                    Carrier Appointment Status ({carriers.length})
                  </h3>
                  <div className="space-y-2">
                    {carriers.map(carrier => {
                      const status = carrierStatuses[carrier] || 'pending';
                      return (
                        <div 
                          key={carrier} 
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            status === 'appointed' 
                              ? 'bg-green-50 border border-green-200' 
                              : status === 'issue'
                                ? 'bg-red-50 border border-red-200'
                                : 'bg-muted/50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {status === 'appointed' && <CheckCircle className="w-4 h-4 text-green-600" />}
                            {status === 'issue' && <AlertCircle className="w-4 h-4 text-red-600" />}
                            {status === 'pending' && <Clock className="w-4 h-4 text-amber-600" />}
                            <span className="font-medium text-foreground">{carrier}</span>
                          </div>
                          <Select 
                            value={status} 
                            onValueChange={(value) => updateCarrierStatus(carrier, value)}
                            disabled={updatingCarrier === carrier}
                          >
                            <SelectTrigger className="w-32 h-8 text-xs">
                              {updatingCarrier === carrier ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <SelectValue />
                              )}
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                  Pending
                                </span>
                              </SelectItem>
                              <SelectItem value="appointed">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                  Appointed
                                </span>
                              </SelectItem>
                              <SelectItem value="issue">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                  Issue
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    })}
                    {carriers.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No carriers selected
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-border">
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.href = `/admin/users/${selected.user_id}`}
                  >
                    <User className="w-4 h-4 mr-2" />
                    View Full Profile
                  </Button>
                  
                  {selected.status !== 'approved' && selected.status !== 'rejected' && (
                    <>
                      <Button 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => setConfirmDialog({ open: true, action: 'approve' })}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button 
                        variant="destructive"
                        onClick={() => setConfirmDialog({ open: true, action: 'reject' })}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg">Select a submission to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Document Preview Modal */}
      <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>{previewDoc?.name}</DialogTitle>
          </DialogHeader>
          {previewDoc && (
            <iframe 
              src={previewDoc.url} 
              className="w-full h-full rounded-lg"
              title={previewDoc.name}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog 
        open={confirmDialog.open} 
        onOpenChange={(open) => !open && setConfirmDialog({ open: false, action: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === 'approve' ? 'Approve Application' : 'Reject Application'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action === 'approve' ? (
                <>
                  Are you sure you want to approve <strong>{selected?.full_legal_name}</strong>'s application?
                  This will grant them full platform access.
                </>
              ) : (
                <>
                  Are you sure you want to reject <strong>{selected?.full_legal_name}</strong>'s application?
                  They will need to resubmit.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processingAction}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={confirmDialog.action === 'approve' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-red-600 hover:bg-red-700'}
              disabled={processingAction}
              onClick={() => {
                if (confirmDialog.action === 'approve') {
                  handleApprove();
                } else {
                  handleReject();
                }
              }}
            >
              {processingAction && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {confirmDialog.action === 'approve' ? 'Approve' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
