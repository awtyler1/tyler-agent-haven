import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  pdfUrl: string;
}

const PdfPreviewModal = ({ isOpen, onClose, title, pdfUrl }: PdfPreviewModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] h-[85vh] p-0 overflow-hidden">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-border bg-muted">
            <h3 className="font-medium text-foreground">{title}</h3>
            <div className="flex items-center gap-2">
              <Button asChild variant="default" size="sm">
                <a href={pdfUrl} download>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </a>
              </Button>
            </div>
          </div>
          <div className="flex-1 bg-muted">
            <iframe
              src={pdfUrl}
              className="w-full h-full"
              title={title}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PdfPreviewModal;
