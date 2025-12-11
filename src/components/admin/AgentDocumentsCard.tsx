import { useState, useEffect } from 'react';
import { FileText, Download, ExternalLink, Loader2, FolderOpen } from 'lucide-react';
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

interface AgentDocumentsCardProps {
  userId: string;
}

export function AgentDocumentsCard({ userId }: AgentDocumentsCardProps) {
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<Record<string, string>>({});
  const [downloadingDoc, setDownloadingDoc] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDocuments() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('contracting_applications')
          .select('uploaded_documents')
          .eq('user_id', userId)
          .maybeSingle();

        if (error) throw error;
        
        if (data?.uploaded_documents) {
          setDocuments(data.uploaded_documents as Record<string, string>);
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

  const documentEntries = Object.entries(documents).filter(([_, path]) => path);
  const hasDocuments = documentEntries.length > 0;

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
              {documentEntries.length} file{documentEntries.length !== 1 ? 's' : ''}
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
            {documentEntries.map(([docType, filePath]) => {
              const label = DOCUMENT_LABELS[docType] || docType.replace(/_/g, ' ');
              const isContractingPacket = docType === 'contracting_packet';
              const isDownloading = downloadingDoc === docType;
              
              return (
                <div 
                  key={docType}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isContractingPacket ? 'bg-primary/5 border-primary/20' : 'bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FileText className={`h-5 w-5 ${isContractingPacket ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div>
                      <p className={`font-medium text-sm ${isContractingPacket ? 'text-primary' : ''}`}>
                        {label}
                      </p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {filePath.split('/').pop()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
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
