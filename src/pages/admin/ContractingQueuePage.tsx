import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  FileText, 
  Download, 
  User, 
  Calendar, 
  Search, 
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  Loader2,
  FolderOpen,
  XCircle,
  Check
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
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
}

interface StorageFile {
  name: string;
  id: string;
  created_at: string;
  metadata: {
    size: number;
    mimetype: string;
  };
}

export default function ContractingQueuePage() {
  const [submissions, setSubmissions] = useState<ContractingSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'in_progress' | 'approved' | 'rejected'>('all');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'approve' | 'reject' | null;
    submission: ContractingSubmission | null;
  }>({ open: false, action: null, submission: null });

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('contracting_applications')
        .select('*')
        .order('submitted_at', { ascending: false, nullsFirst: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (err) {
      console.error('Error fetching submissions:', err);
      toast.error('Failed to load contracting submissions');
    } finally {
      setLoading(false);
    }
  };

  const downloadContractingPacket = async (submission: ContractingSubmission) => {
    const docs = submission.uploaded_documents as Record<string, string> | null;
    const packetPath = docs?.contracting_packet;
    
    if (!packetPath) {
      toast.error('No contracting packet found for this submission');
      return;
    }

    setDownloadingId(submission.id);
    
    try {
      const { data, error } = await supabase.storage
        .from('contracting-documents')
        .createSignedUrl(packetPath, 300); // 5 min expiry

      if (error) throw error;
      
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (err) {
      console.error('Error downloading packet:', err);
      toast.error('Failed to download contracting packet');
    } finally {
      setDownloadingId(null);
    }
  };

  const viewDocument = async (userId: string, docPath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('contracting-documents')
        .createSignedUrl(docPath, 300);

      if (error) throw error;
      
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (err) {
      console.error('Error viewing document:', err);
      toast.error('Failed to open document');
    }
  };

  const handleApprove = async (submission: ContractingSubmission) => {
    setProcessingId(submission.id);
    try {
      // Update contracting application status to approved
      const { error: appError } = await supabase
        .from('contracting_applications')
        .update({ status: 'approved' })
        .eq('id', submission.id);

      if (appError) throw appError;

      // Update agent's profile onboarding status to APPOINTED
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          onboarding_status: 'APPOINTED',
          appointed_at: new Date().toISOString()
        })
        .eq('user_id', submission.user_id);

      if (profileError) throw profileError;

      toast.success(`${submission.full_legal_name || 'Agent'} has been approved and appointed`);
      fetchSubmissions();
    } catch (err) {
      console.error('Error approving application:', err);
      toast.error('Failed to approve application');
    } finally {
      setProcessingId(null);
      setConfirmDialog({ open: false, action: null, submission: null });
    }
  };

  const handleReject = async (submission: ContractingSubmission) => {
    setProcessingId(submission.id);
    try {
      // Update contracting application status to rejected and reset signature fields
      const { error: appError } = await supabase
        .from('contracting_applications')
        .update({ 
          status: 'rejected',
          signature_name: null,
          signature_date: null,
        })
        .eq('id', submission.id);

      if (appError) throw appError;

      // Update profile back to CONTRACTING_REQUIRED so they can resubmit
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ onboarding_status: 'CONTRACTING_REQUIRED' })
        .eq('user_id', submission.user_id);

      if (profileError) throw profileError;

      toast.success(`${submission.full_legal_name || 'Agent'}'s application has been rejected`);
      fetchSubmissions();
    } catch (err) {
      console.error('Error rejecting application:', err);
      toast.error('Failed to reject application');
    } finally {
      setProcessingId(null);
      setConfirmDialog({ open: false, action: null, submission: null });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200"><Clock className="h-3 w-3 mr-1" />Pending Review</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200"><AlertCircle className="h-3 w-3 mr-1" />In Progress</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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

  const approvedCount = submissions.filter(s => s.status === 'approved').length;
  const rejectedCount = submissions.filter(s => s.status === 'rejected').length;

  const submittedCount = submissions.filter(s => s.status === 'submitted').length;
  const inProgressCount = submissions.filter(s => s.status === 'in_progress').length;

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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]">
      <Navigation />
      
      <main className="flex-1 pt-28 pb-12">
        <div className="container-narrow px-6 md:px-12 lg:px-20">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="heading-display mb-2">Contracting Queue</h1>
            <p className="text-body max-w-xl mx-auto">
              Review and manage agent contracting submissions
            </p>
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent mx-auto mt-4"></div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <Card className="text-center">
              <CardContent className="pt-4 pb-3">
                <div className="text-2xl font-serif font-bold text-foreground">{submissions.length}</div>
                <p className="text-xs text-muted-foreground">Total Applications</p>
              </CardContent>
            </Card>
            <Card className="text-center border-amber-200 bg-amber-50/50">
              <CardContent className="pt-4 pb-3">
                <div className="text-2xl font-serif font-bold text-amber-600">{submittedCount}</div>
                <p className="text-xs text-muted-foreground">Pending Review</p>
              </CardContent>
            </Card>
            <Card className="text-center border-blue-200 bg-blue-50/50">
              <CardContent className="pt-4 pb-3">
                <div className="text-2xl font-serif font-bold text-blue-600">{inProgressCount}</div>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or NPN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'submitted' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('submitted')}
              >
                Pending ({submittedCount})
              </Button>
              <Button
                variant={statusFilter === 'in_progress' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('in_progress')}
              >
                In Progress ({inProgressCount})
              </Button>
              <Button
                variant={statusFilter === 'approved' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('approved')}
              >
                Approved ({approvedCount})
              </Button>
              <Button
                variant={statusFilter === 'rejected' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('rejected')}
              >
                Rejected ({rejectedCount})
              </Button>
            </div>
          </div>

          {/* Submissions List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FolderOpen className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">No contracting submissions found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredSubmissions.map((submission) => {
                const docs = (submission.uploaded_documents as Record<string, string>) || {};
                const hasPacket = !!docs.contracting_packet;
                const docCount = Object.keys(docs).filter(k => k !== 'contracting_packet').length;
                const carriers = (submission.selected_carriers as Array<{ carrier_name: string }>) || [];
                
                return (
                  <Card key={submission.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex flex-col lg:flex-row">
                        {/* Main Info */}
                        <div className="flex-1 p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="font-semibold text-lg">{submission.full_legal_name || 'Unknown'}</h3>
                                {getStatusBadge(submission.status)}
                              </div>
                              <p className="text-sm text-muted-foreground">{submission.email_address}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">NPN:</span>
                              <span className="ml-1 font-medium">{submission.npn_number || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">State:</span>
                              <span className="ml-1 font-medium">{submission.resident_state || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Submitted:</span>
                              <span className="ml-1 font-medium">
                                {submission.submitted_at 
                                  ? format(new Date(submission.submitted_at), 'MMM d, yyyy')
                                  : 'Not submitted'}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Carriers:</span>
                              <span className="ml-1 font-medium">{carriers.length}</span>
                            </div>
                          </div>

                          {/* Documents */}
                          {Object.keys(docs).length > 0 && (
                            <div className="mt-4 pt-4 border-t">
                              <p className="text-xs text-muted-foreground mb-2">Uploaded Documents:</p>
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(docs).map(([docType, docPath]) => {
                                  if (!docPath) return null;
                                  const isPacket = docType === 'contracting_packet';
                                  return (
                                    <button
                                      key={docType}
                                      onClick={() => viewDocument(submission.user_id, docPath)}
                                      className={`
                                        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs
                                        transition-colors
                                        ${isPacket 
                                          ? 'bg-primary/10 text-primary hover:bg-primary/20 font-medium' 
                                          : 'bg-muted hover:bg-muted/80 text-foreground'}
                                      `}
                                    >
                                      <FileText className="h-3 w-3" />
                                      {DOCUMENT_LABELS[docType] || docType}
                                      <ExternalLink className="h-2.5 w-2.5 opacity-50" />
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Actions Sidebar */}
                        <div className="lg:w-52 bg-muted/30 p-4 flex flex-row lg:flex-col gap-2 border-t lg:border-t-0 lg:border-l">
                          {hasPacket ? (
                            <Button
                              onClick={() => downloadContractingPacket(submission)}
                              disabled={downloadingId === submission.id}
                              className="flex-1 lg:flex-none gap-2"
                              size="sm"
                            >
                              {downloadingId === submission.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                              View Packet
                            </Button>
                          ) : (
                            <div className="flex-1 lg:flex-none text-center text-xs text-muted-foreground py-2 px-3 bg-muted rounded-md">
                              No packet generated
                            </div>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 lg:flex-none gap-2"
                            onClick={() => window.location.href = `/admin/users/${submission.user_id}`}
                          >
                            <User className="h-4 w-4" />
                            View Profile
                          </Button>
                          
                          {/* Approve/Reject Actions - only show for submitted applications */}
                          {submission.status === 'submitted' && (
                            <div className="flex gap-2 lg:flex-col lg:pt-2 lg:border-t lg:mt-2">
                              <Button
                                size="sm"
                                className="flex-1 gap-1.5 bg-green-600 hover:bg-green-700"
                                disabled={processingId === submission.id}
                                onClick={() => setConfirmDialog({
                                  open: true,
                                  action: 'approve',
                                  submission
                                })}
                              >
                                {processingId === submission.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Check className="h-3.5 w-3.5" />
                                )}
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                disabled={processingId === submission.id}
                                onClick={() => setConfirmDialog({
                                  open: true,
                                  action: 'reject',
                                  submission
                                })}
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Confirmation Dialog */}
      <AlertDialog 
        open={confirmDialog.open} 
        onOpenChange={(open) => !open && setConfirmDialog({ open: false, action: null, submission: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === 'approve' ? 'Approve Application' : 'Reject Application'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action === 'approve' ? (
                <>
                  Are you sure you want to approve <strong>{confirmDialog.submission?.full_legal_name}</strong>'s contracting application?
                  <br /><br />
                  This will update their onboarding status to <strong>APPOINTED</strong> and grant them full platform access.
                </>
              ) : (
                <>
                  Are you sure you want to reject <strong>{confirmDialog.submission?.full_legal_name}</strong>'s contracting application?
                  <br /><br />
                  The agent will need to resubmit their application.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processingId !== null}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={confirmDialog.action === 'approve' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-red-600 hover:bg-red-700'}
              disabled={processingId !== null}
              onClick={() => {
                if (confirmDialog.action === 'approve' && confirmDialog.submission) {
                  handleApprove(confirmDialog.submission);
                } else if (confirmDialog.action === 'reject' && confirmDialog.submission) {
                  handleReject(confirmDialog.submission);
                }
              }}
            >
              {processingId !== null ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {confirmDialog.action === 'approve' ? 'Approve' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
