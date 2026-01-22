import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

interface DocumentPreviewProps {
  url: string;
  label: string;
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentPreview({ url, label, isOpen, onClose }: DocumentPreviewProps) {
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url.split('?')[0]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="flex flex-row items-center justify-between px-4 py-3 border-b border-border space-y-0">
          <DialogTitle className="font-medium text-foreground">{label}</DialogTitle>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => window.open(url, '_blank')}
          >
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            Open in New Tab
          </Button>
        </DialogHeader>
        <div className="flex-1 overflow-auto bg-muted min-h-[400px]">
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
      </DialogContent>
    </Dialog>
  );
}
