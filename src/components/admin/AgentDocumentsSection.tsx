import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  CheckCircle2,
  Eye,
  Plus,
  Loader2,
  Upload,
  AlertCircle,
  X,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';
import { DocumentPreview } from '@/components/ui/DocumentPreview';

// Document slot definitions
const DOCUMENT_SLOTS = [
  { category: 'contracting', documentType: 'contracting_packet', label: 'Contracting Packet' },
  { category: 'compliance', documentType: 'eo_certificate', label: 'E&O Certificate', hasExpiration: true },
  { category: 'license', documentType: 'resident_license', label: 'Resident License', hasExpiration: true },
  { category: 'banking', documentType: 'voided_check', label: 'Voided Check' },
  { category: 'license', documentType: 'non_resident_license', label: 'Non-Resident License', allowMultiple: true, hasExpiration: true },
] as const;

type DocumentSlot = typeof DOCUMENT_SLOTS[number];

// US States for non-resident license
const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
];

interface AgentDocument {
  id: string;
  profile_id: string;
  category: string;
  document_type: string;
  label: string | null;
  file_path: string;
  file_name: string;
  expires_at: string | null;
  notes: string | null;
  uploaded_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface AgentDocumentsSectionProps {
  profileId: string;
  canUpload?: boolean;  // Can upload to required doc slots (agents + admins)
  isAdmin?: boolean;    // Can see/upload to "Other" section + delete docs
}

export function AgentDocumentsSection({
  profileId,
  canUpload = false,
  isAdmin = false
}: AgentDocumentsSectionProps) {
  const [documents, setDocuments] = useState<AgentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<DocumentSlot | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; label: string } | null>(null);

  // Upload modal state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState<string>('');
  const [uploadDocumentType, setUploadDocumentType] = useState<string>('');
  const [uploadLabel, setUploadLabel] = useState<string>('');
  const [uploadExpiration, setUploadExpiration] = useState<string>('');
  const [uploadState, setUploadState] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('agent_documents')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (err) {
      console.error('Error fetching documents:', err);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Get document for a specific slot
  const getDocumentForSlot = (slot: DocumentSlot): AgentDocument | undefined => {
    return documents.find(
      (doc) => doc.category === slot.category && doc.document_type === slot.documentType
    );
  };

  // Get all documents for slots that allow multiple (non-resident licenses)
  const getDocumentsForMultipleSlot = (slot: DocumentSlot): AgentDocument[] => {
    return documents.filter(
      (doc) => doc.category === slot.category && doc.document_type === slot.documentType
    );
  };

  // Get "other" documents
  const getOtherDocuments = (): AgentDocument[] => {
    return documents.filter((doc) => doc.document_type === 'other');
  };

  // Calculate filled slots
  const calculateFilledSlots = (): { filled: number; total: number } => {
    const singleSlots = DOCUMENT_SLOTS.filter((s) => !s.allowMultiple);
    const filled = singleSlots.filter((slot) => getDocumentForSlot(slot)).length;
    return { filled, total: singleSlots.length };
  };

  // Check if document is expiring soon (within 60 days)
  const isExpiringSoon = (expiresAt: string | null): boolean => {
    if (!expiresAt) return false;
    const daysUntilExpiry = differenceInDays(new Date(expiresAt), new Date());
    return daysUntilExpiry <= 60 && daysUntilExpiry > 0;
  };

  // Check if document is expired
  const isExpired = (expiresAt: string | null): boolean => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  // Upload file to storage
  const uploadToStorage = async (file: File, category: string): Promise<string> => {
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = `${profileId}/${category}/${timestamp}_${safeName}`;

    const { error } = await supabase.storage
      .from('agent-documents')
      .upload(path, file);

    if (error) throw error;
    return path;
  };

  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }

    if (!uploadCategory || !uploadDocumentType) {
      toast.error('Please select a document type');
      return;
    }

    // Validate state for non-resident license
    if (uploadDocumentType === 'non_resident_license' && !uploadState) {
      toast.error('Please select a state');
      return;
    }

    // Validate label for "other" type
    if (uploadDocumentType === 'other' && !uploadLabel.trim()) {
      toast.error('Please enter a document label');
      return;
    }

    setUploading(true);
    try {
      // Upload file to storage
      const filePath = await uploadToStorage(selectedFile, uploadCategory);

      // Get current user's profile_id for uploaded_by
      const { data: { user } } = await supabase.auth.getUser();
      let uploadedBy: string | null = null;
      if (user) {
        const { data: uploaderProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();
        uploadedBy = uploaderProfile?.id || null;
      }

      // Create document record
      const label = uploadDocumentType === 'non_resident_license'
        ? uploadState
        : uploadDocumentType === 'other'
          ? uploadLabel.trim()
          : null;

      const { error } = await supabase
        .from('agent_documents')
        .insert({
          profile_id: profileId,
          category: uploadCategory,
          document_type: uploadDocumentType,
          label,
          file_path: filePath,
          file_name: selectedFile.name,
          expires_at: uploadExpiration || null,
          uploaded_by: uploadedBy,
        });

      if (error) throw error;

      toast.success('Document uploaded');
      setUploadModalOpen(false);
      resetUploadForm();
      fetchDocuments();
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Reset upload form
  const resetUploadForm = () => {
    setSelectedFile(null);
    setUploadCategory('');
    setUploadDocumentType('');
    setUploadLabel('');
    setUploadExpiration('');
    setUploadState('');
    setSelectedSlot(null);
  };

  // Handle slot click (pre-select category)
  const handleSlotUpload = (slot: DocumentSlot) => {
    setSelectedSlot(slot);
    setUploadCategory(slot.category);
    setUploadDocumentType(slot.documentType);
    setUploadModalOpen(true);
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  // Handle drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadModalOpen(true);
    }
  };

  // Handle download/view
  const handleDownload = async (doc: AgentDocument, label: string) => {
    setDownloadingId(doc.id);
    try {
      const { data, error } = await supabase.storage
        .from('agent-documents')
        .createSignedUrl(doc.file_path, 300); // 5 min expiry

      if (error) throw error;

      if (data?.signedUrl) {
        setPreviewDoc({ url: data.signedUrl, label });
      }
    } catch (err: any) {
      toast.error(`Failed to open document: ${err.message}`);
    } finally {
      setDownloadingId(null);
    }
  };

  // Handle delete
  const handleDelete = async (doc: AgentDocument) => {
    if (!confirm(`Delete ${doc.file_name}?`)) return;

    try {
      // Delete from storage
      await supabase.storage
        .from('agent-documents')
        .remove([doc.file_path]);

      // Delete record
      const { error } = await supabase
        .from('agent_documents')
        .delete()
        .eq('id', doc.id);

      if (error) throw error;

      toast.success('Document deleted');
      fetchDocuments();
    } catch (err: any) {
      toast.error(`Delete failed: ${err.message}`);
    }
  };

  const { filled, total } = calculateFilledSlots();
  const otherDocs = getOtherDocuments();

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-border/50 overflow-hidden">
        <div className="px-5 py-4">
          <h2 className="font-semibold text-foreground">Documents</h2>
        </div>
        <div className="flex items-center justify-center py-12 border-t border-border/50">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-border/50 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4">
          <h2 className="font-semibold text-foreground">Documents</h2>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto max-h-[600px]">
          {/* Required documents */}
          <div className="px-5 py-2 bg-stone-50 border-t border-border/50">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">Required Documents</span>
          </div>
          <div>
          {DOCUMENT_SLOTS.map((slot) => {
            if (slot.allowMultiple) {
              // Render multiple documents for this slot type
              const docs = getDocumentsForMultipleSlot(slot);
              return (
                <div key={slot.documentType}>
                  {docs.map((doc) => {
                    const docLabel = `${slot.label} (${doc.label || 'Unknown'})`;
                    return (
                      <DocumentRow
                        key={doc.id}
                        label={docLabel}
                        document={doc}
                        canDelete={isAdmin}
                        isDownloading={downloadingId === doc.id}
                        onDownload={() => handleDownload(doc, docLabel)}
                        onDelete={() => handleDelete(doc)}
                        isExpiringSoon={isExpiringSoon(doc.expires_at)}
                        isExpired={isExpired(doc.expires_at)}
                      />
                    );
                  })}
                  {/* Always show add row for multiple slots */}
                  {canUpload && (
                    <div
                      className="px-5 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors border-t border-border/30 first:border-t-0 group cursor-pointer"
                      onClick={() => handleSlotUpload(slot)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/20" />
                        <span className="text-sm text-muted-foreground">{slot.label}</span>
                      </div>
                      <Plus className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                    </div>
                  )}
                </div>
              );
            }

            // Single document slot
            const doc = getDocumentForSlot(slot);
            return (
              <DocumentRow
                key={slot.documentType}
                label={slot.label}
                document={doc}
                canDelete={isAdmin}
                isDownloading={doc ? downloadingId === doc.id : false}
                onDownload={doc ? () => handleDownload(doc, slot.label) : undefined}
                onDelete={doc ? () => handleDelete(doc) : undefined}
                onUpload={!doc && canUpload ? () => handleSlotUpload(slot) : undefined}
                isExpiringSoon={doc ? isExpiringSoon(doc.expires_at) : false}
                isExpired={doc ? isExpired(doc.expires_at) : false}
              />
            );
          })}
        </div>

        {/* Other documents section - admin only */}
        {isAdmin && (
          <>
            <div className="px-5 py-2 bg-stone-50 border-t border-stone-200">
              <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">
                Other Documents
              </span>
            </div>
            <div>
              {otherDocs.length > 0 ? (
                otherDocs.map((doc) => {
                  const docLabel = doc.label || doc.file_name;
                  return (
                    <DocumentRow
                      key={doc.id}
                      label={docLabel}
                      document={doc}
                      canDelete={isAdmin}
                      isDownloading={downloadingId === doc.id}
                      onDownload={() => handleDownload(doc, docLabel)}
                      onDelete={() => handleDelete(doc)}
                      isExpiringSoon={false}
                      isExpired={false}
                    />
                  );
                })
              ) : (
                <div className="px-5 py-3 text-sm text-muted-foreground">
                  No other documents
                </div>
              )}
            </div>
          </>
        )}
        </div>

        {/* Drop zone */}
        {canUpload && (
          <div className="px-4 pb-4 pt-2">
            <div
              ref={dropZoneRef}
              className={`border-2 border-dashed rounded-lg py-3 text-center transition-colors cursor-pointer ${
                isDragging ? 'border-primary bg-primary/5' : 'border-border bg-muted/20 hover:border-primary/50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => {
                resetUploadForm();
                setUploadModalOpen(true);
              }}
            >
              <p className="text-sm text-muted-foreground">
                Drop file or <span className="text-primary font-medium hover:text-primary/80">browse</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <Dialog open={uploadModalOpen} onOpenChange={(open) => {
        if (!open) resetUploadForm();
        setUploadModalOpen(open);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* File selection */}
            <div>
              <Label className="text-sm font-medium">File</Label>
              {selectedFile ? (
                <div className="mt-2 flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm flex-1 truncate">{selectedFile.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setSelectedFile(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className="mt-2 border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-gold hover:bg-muted/30 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) setSelectedFile(file);
                  }}
                >
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Click or drag file to upload
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileSelect}
              />
            </div>

            {/* Document type selector */}
            {!selectedSlot && (
              <div>
                <Label className="text-sm font-medium">Document Type</Label>
                <Select
                  value={uploadDocumentType}
                  onValueChange={(value) => {
                    const slot = DOCUMENT_SLOTS.find((s) => s.documentType === value);
                    setUploadDocumentType(value);
                    setUploadCategory(slot?.category || 'other');
                  }}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select document type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_SLOTS.map((slot) => (
                      <SelectItem key={slot.documentType} value={slot.documentType}>
                        {slot.label}
                      </SelectItem>
                    ))}
                    {isAdmin && (
                      <SelectItem value="other">Other</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* State selector for non-resident license */}
            {uploadDocumentType === 'non_resident_license' && (
              <div>
                <Label className="text-sm font-medium">State</Label>
                <Select value={uploadState} onValueChange={setUploadState}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select state..." />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Label for "other" documents */}
            {uploadDocumentType === 'other' && (
              <div>
                <Label className="text-sm font-medium">Document Label</Label>
                <Input
                  className="mt-2"
                  placeholder="Enter a name for this document..."
                  value={uploadLabel}
                  onChange={(e) => setUploadLabel(e.target.value)}
                />
              </div>
            )}

            {/* Expiration date (for applicable types) */}
            {(selectedSlot?.hasExpiration ||
              ['eo_certificate', 'resident_license', 'non_resident_license'].includes(uploadDocumentType)) && (
              <div>
                <Label className="text-sm font-medium">Expiration Date (optional)</Label>
                <Input
                  type="date"
                  className="mt-2"
                  value={uploadExpiration}
                  onChange={(e) => setUploadExpiration(e.target.value)}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadModalOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-gold hover:bg-gold/90 text-white"
              onClick={handleUpload}
              disabled={uploading || !selectedFile}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Preview Modal */}
      <DocumentPreview
        url={previewDoc?.url || ''}
        label={previewDoc?.label || ''}
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
      />
    </>
  );
}

// Document row component
interface DocumentRowProps {
  label: string;
  document?: AgentDocument;
  canDelete: boolean;  // Only admins can delete
  isDownloading: boolean;
  isExpiringSoon: boolean;
  isExpired: boolean;
  onDownload?: () => void;
  onDelete?: () => void;
  onUpload?: () => void;
}

function DocumentRow({
  label,
  document,
  canDelete,
  isDownloading,
  isExpiringSoon,
  isExpired,
  onDownload,
  onDelete,
  onUpload,
}: DocumentRowProps) {
  const handleClick = () => {
    if (document && onDownload) {
      onDownload();
    } else if (!document && onUpload) {
      onUpload();
    }
  };

  return (
    <div
      className="px-5 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors border-t border-border/30 first:border-t-0 group cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex items-center gap-3 min-w-0">
        {document ? (
          isExpired ? (
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          ) : isExpiringSoon ? (
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
          )
        ) : (
          <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/20 flex-shrink-0" />
        )}
        <div className="min-w-0">
          <span className={`text-sm truncate block ${document ? 'text-foreground' : 'text-muted-foreground'}`}>
            {label}
          </span>
          {document?.expires_at && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Exp. {format(new Date(document.expires_at), 'MMM d, yyyy')}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        {document ? (
          <>
            {isDownloading ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            ) : (
              <Eye className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
            )}
            {canDelete && (
              <button
                className="ml-1 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.();
                }}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </>
        ) : onUpload ? (
          <Plus className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
        ) : null}
      </div>
    </div>
  );
}
