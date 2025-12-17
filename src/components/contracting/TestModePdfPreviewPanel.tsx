import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, ExternalLink, Eye, EyeOff, FileWarning } from 'lucide-react';
import { toast } from 'sonner';

interface TestModePdfPreviewPanelProps {
  pdfBase64: string | null;
  filename: string | null;
  size: number | null;
  error: string | null;
  onDownload: (base64: string, filename: string) => void;
}

export function TestModePdfPreviewPanel({ 
  pdfBase64, 
  filename, 
  size, 
  error,
  onDownload 
}: TestModePdfPreviewPanelProps) {
  const [showPreview, setShowPreview] = useState(true);

  // Create blob URL for PDF preview
  const pdfUrl = useMemo(() => {
    if (!pdfBase64) return null;
    try {
      const byteCharacters = atob(pdfBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      return URL.createObjectURL(blob);
    } catch (e) {
      console.error('Failed to create PDF blob:', e);
      return null;
    }
  }, [pdfBase64]);

  const handleDownload = () => {
    if (pdfBase64 && filename) {
      onDownload(pdfBase64, filename);
    }
  };

  const handleOpenInNewTab = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Show error state
  if (error) {
    return (
      <Card className="border-red-300 bg-red-50/50">
        <div className="p-4 border-b border-red-200 bg-red-100/50">
          <div className="flex items-center gap-2">
            <FileWarning className="h-5 w-5 text-red-700" />
            <h3 className="font-semibold text-red-900">PDF Generation Failed</h3>
            <Badge variant="outline" className="border-red-400 text-red-700 bg-red-100">
              Error
            </Badge>
          </div>
        </div>
        <div className="p-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      </Card>
    );
  }

  // Show empty state if no PDF yet
  if (!pdfBase64) {
    return (
      <Card className="border-purple-300 bg-purple-50/50">
        <div className="p-4 border-b border-purple-200 bg-purple-100/50">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-700" />
            <h3 className="font-semibold text-purple-900">Generated PDF Preview</h3>
            <Badge variant="outline" className="border-purple-400 text-purple-700 bg-purple-100">
              Test Mode
            </Badge>
          </div>
        </div>
        <div className="p-8 text-center">
          <FileText className="h-12 w-12 text-purple-300 mx-auto mb-3" />
          <p className="text-purple-700 text-sm">No PDF generated yet</p>
          <p className="text-purple-500 text-xs mt-1">Submit the form to generate and preview the PDF</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-purple-300 bg-purple-50/50">
      <div className="p-4 border-b border-purple-200 bg-purple-100/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-700" />
            <h3 className="font-semibold text-purple-900">Generated PDF Preview</h3>
            <Badge variant="outline" className="border-purple-400 text-purple-700 bg-purple-100">
              Test Mode
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="text-purple-700 hover:bg-purple-100"
            >
              {showPreview ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
              {showPreview ? 'Hide' : 'Show'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenInNewTab}
              className="border-purple-400 text-purple-700 hover:bg-purple-100"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Open
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="border-purple-400 text-purple-700 hover:bg-purple-100"
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-2 text-sm text-purple-700">
          <span className="font-mono text-xs">{filename}</span>
          <span>•</span>
          <span>{formatFileSize(size)}</span>
        </div>
      </div>

      {showPreview && pdfUrl && (
        <div className="p-4">
          <div className="rounded-lg overflow-hidden border border-purple-200 bg-white">
            <iframe
              src={pdfUrl}
              className="w-full h-[600px]"
              title="PDF Preview"
            />
          </div>
        </div>
      )}

      <div className="p-3 border-t border-purple-200 bg-purple-100/30 text-xs text-purple-700 text-center">
        PDF generated without saving to storage • Test Mode only
      </div>
    </Card>
  );
}
