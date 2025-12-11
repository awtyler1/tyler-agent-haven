import { useState, useEffect } from 'react';
import { FileText, Download, ExternalLink, Loader2, FolderOpen, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

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
  contracting_packet: 'Contracting Packet (PDF)',
};

interface DocumentWithMeta {
  docType: string;
  filePath: string;
  uploadedAt: string | null;
}

interface AgentDocumentsCardProps {
  userId: string;
}

export function AgentDocumentsCard({ userId }: AgentDocumentsCardProps) {
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<DocumentWithMeta[]>([]);
  const [downloadingDoc, setDownloadingDoc] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDocuments() {
      setLoading(true);
      try {
        // Get document paths from contracting application
        const { data, error } = await supabase
          .from('contracting_applications')
          .select('uploaded_documents')
          .eq('user_id', userId)
          .maybeSingle();

        if (error) throw error;
        
        if (data?.uploaded_documents) {
          const uploadedDocs = data.uploaded_documents as Record<string, string>;
          const docEntries = Object.entries(uploadedDocs).filter(([_, path]) => path);
          
          // Fetch metadata for each document from storage
          const docsWithMeta: DocumentWithMeta[] = await Promise.all(
            docEntries.map(async ([docType, filePath]) => {
              try {
                // Extract folder path and filename
                const pathParts = filePath.split('/');
                const fileName = pathParts.pop() || '';
                const folderPath = pathParts.join('/');
                
                // List files in the folder to get metadata
                const { data: fileList } = await supabase.storage
                  .from('contracting-documents')
                  .list(folderPath);
                
                const fileInfo = fileList?.find(f => f.name === fileName);
                
                return {
                  docType,
                  filePath,
                  uploadedAt: fileInfo?.created_at || null,
                };
              } catch {
                return {
                  docType,
                  filePath,
                  uploadedAt: null,
                };
              }
            })
          );
          
          // Sort by upload date (newest first)
          docsWithMeta.sort((a, b) => {
            if (!a.uploadedAt) return 1;
            if (!b.uploadedAt) return -1;
            return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
          });
          
          setDocuments(docsWithMeta);
        }
      } catch (err) {
        console.error('Error fetching documents:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDocuments();
  }, [userId]);

  const handleViewDocument = async (docType: string, filePath: string) => {
    setDownloadingDoc(docType);
    try {
      const { data, error } = await supabase.storage
        .from('contracting-documents')
        .createSignedUrl(filePath, 300); // 5 min expiry

      if (error) throw error;
      
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (err: any) {
      toast.error(`Failed to open document: ${err.message}`);
    } finally {
      setDownloadingDoc(null);
    }
  };

  const handleDownloadDocument = async (docType: string, filePath: string) => {
    setDownloadingDoc(docType);
    try {
      const { data, error } = await supabase.storage
        .from('contracting-documents')
        .download(filePath);

      if (error) throw error;
      
      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filePath.split('/').pop() || 'document';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Document downloaded');
    } catch (err: any) {
      toast.error(`Failed to download: ${err.message}`);
    } finally {
      setDownloadingDoc(null);
    }
  };

  const formatUploadDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      return format(new Date(dateStr), 'MMM d, yyyy \'at\' h:mm a');
    } catch {
      return null;
    }
  };

  const hasDocuments = documents.length > 0;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Agent Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FolderOpen className="h-5 w-5" />
          Agent Documents
          {hasDocuments && (
            <Badge variant="secondary" className="ml-auto">
              {documents.length} file{documents.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasDocuments ? (
          <div className="text-center py-6 text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No documents uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map(({ docType, filePath, uploadedAt }) => {
              const label = DOCUMENT_LABELS[docType] || docType.replace(/_/g, ' ');
              const isContractingPacket = docType === 'contracting_packet';
              const isDownloading = downloadingDoc === docType;
              const formattedDate = formatUploadDate(uploadedAt);
              
              return (
                <div 
                  key={docType}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isContractingPacket ? 'bg-primary/5 border-primary/20' : 'bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FileText className={`h-5 w-5 flex-shrink-0 ${isContractingPacket ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div className="min-w-0">
                      <p className={`font-medium text-sm ${isContractingPacket ? 'text-primary' : ''}`}>
                        {label}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {formattedDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formattedDate}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDocument(docType, filePath)}
                      disabled={isDownloading}
                      className="h-8 px-2"
                    >
                      {isDownloading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadDocument(docType, filePath)}
                      disabled={isDownloading}
                      className="h-8 px-2"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
