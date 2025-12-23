import { useState } from 'react';
import { format } from 'date-fns';
import { 
  FileText, 
  Eye, 
  User, 
  Calendar, 
  MapPin,
  CheckCircle,
  X,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { HierarchyAssignmentPanel } from './HierarchyAssignmentPanel';
import { CarrierStatusPanel } from './CarrierStatusPanel';

interface ContractingSubmission {
  id: string;
  user_id: string;
  full_legal_name: string | null;
  email_address: string | null;
  status: string;
  submitted_at: string | null;
  created_at: string;
  npn_number: string | null;
  resident_state: string | null;
  uploaded_documents: Record<string, string> | null;
  is_test?: boolean;
}

interface ContractingSubmissionDetailProps {
  submission: ContractingSubmission;
  onRefresh: () => void;
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

export function ContractingSubmissionDetail({ submission, onRefresh }: ContractingSubmissionDetailProps) {
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'approve' | 'reject' | null;
  }>({ open: false, action: null });
  const [processing, setProcessing] = useState(false);

  const uploadedDocs = (submission.uploaded_documents || {}) as Record<string, string>;
  const docEntries = Object.entries(uploadedDocs).filter(
    ([key, value]) => value && DOCUMENT_LABELS[key]
  );

  const handleViewDocument = async (docType: string, filePath: string) => {
    const { data } = await supabase.storage
      .from('contracting-documents')
      .createSignedUrl(filePath, 300);

    if (data?.signedUrl) {
      // Open in new tab - Chrome blocks iframes for Supabase signed URLs
      window.open(data.signedUrl, '_blank');
    }
  };

  const handleApprove = async () => {
    setProcessing(true);

    try {
      // Update application status
      const { error: appError } = await supabase
        .from('contracting_applications')
        .update({ status: 'approved' })
        .eq('id', submission.id);

      if (appError) throw appError;

      // Update profile onboarding status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ onboarding_status: 'APPOINTED' })
        .eq('user_id', submission.user_id);

      if (profileError) throw profileError;

      toast.success(`${submission.full_legal_name} has been approved`);
      setConfirmDialog({ open: false, action: null });
      onRefresh();

    } catch (error) {
      console.error('Error approving application:', error);
      toast.error('Failed to approve application');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    setProcessing(true);

    try {
      const { error } = await supabase
        .from('contracting_applications')
        .update({ status: 'rejected' })
        .eq('id', submission.id);

      if (error) throw error;

      toast.success(`${submission.full_legal_name}'s application has been rejected`);
      setConfirmDialog({ open: false, action: null });
      onRefresh();

    } catch (error) {
      console.error('Error rejecting application:', error);
      toast.error('Failed to reject application');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-foreground">
              {submission.full_legal_name || 'Unnamed Agent'}
            </h3>
            {submission.is_test && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                Test
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{submission.email_address}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Submitted</p>
          <p className="text-sm font-medium">
            {submission.submitted_at 
              ? format(new Date(submission.submitted_at), 'MMM d, yyyy h:mm a')
              : 'Not submitted'
            }
          </p>
        </div>
      </div>

      {/* Quick Info */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <User className="h-4 w-4" />
          <span>NPN: {submission.npn_number || 'N/A'}</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>State: {submission.resident_state || 'N/A'}</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Created: {format(new Date(submission.created_at), 'MMM d, yyyy')}</span>
        </div>
      </div>

      {/* Documents */}
      {docEntries.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">
            Documents ({docEntries.length})
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {docEntries.map(([docType, filePath]) => (
              <button
                key={docType}
                onClick={() => handleViewDocument(docType, filePath)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left group"
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm truncate flex-1">
                  {DOCUMENT_LABELS[docType]}
                </span>
                <Eye className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hierarchy Assignment */}
      <HierarchyAssignmentPanel
        userId={submission.user_id}
        currentHierarchyType={null}
        currentEntityId={null}
        currentUplineUserId={null}
        onSave={onRefresh}
      />

      {/* Carrier Status */}
      <CarrierStatusPanel
        userId={submission.user_id}
        residentState={submission.resident_state}
      />

      {/* Actions */}
      {submission.status !== 'approved' && submission.status !== 'rejected' && (
        <div className="flex items-center gap-2 pt-4 border-t border-border">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.location.href = `/admin/users/${submission.user_id}`}
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            View Full Profile
          </Button>
          <Button 
            size="sm" 
            className="bg-green-600 hover:bg-green-700"
            onClick={() => setConfirmDialog({ open: true, action: 'approve' })}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Approve
          </Button>
          <Button 
            size="sm" 
            variant="destructive"
            onClick={() => setConfirmDialog({ open: true, action: 'reject' })}
          >
            <X className="h-4 w-4 mr-1" />
            Reject
          </Button>
        </div>
      )}

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
                  Are you sure you want to approve <strong>{submission.full_legal_name}</strong>'s application?
                  This will grant them full platform access.
                </>
              ) : (
                <>
                  Are you sure you want to reject <strong>{submission.full_legal_name}</strong>'s application?
                  They will need to resubmit.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={confirmDialog.action === 'approve'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700'}
              disabled={processing}
              onClick={(e) => {
                e.preventDefault();
                if (confirmDialog.action === 'approve') {
                  handleApprove();
                } else {
                  handleReject();
                }
              }}
            >
              {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {confirmDialog.action === 'approve' ? 'Approve' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
