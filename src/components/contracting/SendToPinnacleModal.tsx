import { useState, useEffect } from 'react';
import { Paperclip, Loader2, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

type SendStatus = 'idle' | 'preparing' | 'sending' | 'success' | 'error';

export interface PinnacleDocument {
  type: string;
  label: string;
  url?: string;
}

export interface SendToPinnacleData {
  to: string;
  subject: string;
  body: string;
  selectedDocuments: string[];
}

interface SendToPinnacleModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentName: string;
  agentNpn: string | null;
  agentState: string | null;
  selectedCarriers: string[];
  documents: PinnacleDocument[];
  onSend: (data: SendToPinnacleData) => Promise<{ success: boolean }>;
}

function generateEmailBody(
  agentName: string,
  agentNpn: string | null,
  agentState: string | null,
  selectedCarriers: string[]
): string {
  const firstName = agentName.trim().split(' ')[0];
  const carrierList = selectedCarriers.length > 0
    ? selectedCarriers.map((c) => `  - ${c}`).join('\n')
    : '  (No carriers selected)';

  return `Hey Licensing,

${firstName} will be agent level, direct to TIG, with the following carriers:
${carrierList}

Please process the following contracting request:

Agent: ${agentName}
NPN: ${agentNpn || 'N/A'}
Resident State: ${agentState || 'N/A'}

All required documents are attached.

Thank you,
Tyler Insurance Group`;
}

export function SendToPinnacleModal({
  isOpen,
  onClose,
  agentName,
  agentNpn,
  agentState,
  selectedCarriers,
  documents,
  onSend,
}: SendToPinnacleModalProps) {
  const [to, setTo] = useState('pfslicensing@pfsinsurance.com');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [sendStatus, setSendStatus] = useState<SendStatus>('idle');
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Reset form when modal opens with new agent data
  useEffect(() => {
    if (isOpen) {
      setTo('pfslicensing@pfsinsurance.com');
      setSubject(`Contracting Request - ${agentName}${agentNpn ? ` (NPN: ${agentNpn})` : ''}`);
      setBody(generateEmailBody(agentName, agentNpn, agentState, selectedCarriers));
      setSelectedDocs(documents.map((d) => d.type));
      setSendStatus('idle');
      setIsConfirmed(false);
    }
  }, [isOpen, agentName, agentNpn, agentState, selectedCarriers, documents]);

  const handleDocToggle = (docType: string, checked: boolean) => {
    setSelectedDocs((prev) =>
      checked ? [...prev, docType] : prev.filter((d) => d !== docType)
    );
  };

  const handleSend = async () => {
    const hasAttachments = selectedDocs.length > 0;

    // Show preparing status if there are attachments
    if (hasAttachments) {
      setSendStatus('preparing');
      // Small delay to show the preparing state
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    setSendStatus('sending');

    try {
      const result = await onSend({
        to,
        subject,
        body,
        selectedDocuments: selectedDocs,
      });

      if (result.success) {
        setSendStatus('success');
        // Show success briefly before closing
        await new Promise((resolve) => setTimeout(resolve, 1200));
        onClose();
      } else {
        setSendStatus('error');
        // Reset to idle after error so user can retry
        setTimeout(() => setSendStatus('idle'), 2000);
      }
    } catch {
      setSendStatus('error');
      setTimeout(() => setSendStatus('idle'), 2000);
    }
  };

  const isSending = sendStatus === 'preparing' || sendStatus === 'sending';
  const isSuccess = sendStatus === 'success';

  const getButtonContent = () => {
    switch (sendStatus) {
      case 'preparing':
        return (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Preparing attachments...
          </>
        );
      case 'sending':
        return (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending...
          </>
        );
      case 'success':
        return (
          <>
            <Check className="h-4 w-4" />
            Sent!
          </>
        );
      default:
        return 'Send Email';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSending && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Subtle overlay when sending */}
        {(isSending || isSuccess) && (
          <div className="absolute inset-0 bg-background/50 z-10 rounded-lg" />
        )}

        <DialogHeader>
          <DialogTitle>Send to Pinnacle</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* To Field */}
          <div className="space-y-1.5">
            <Label htmlFor="to">To</Label>
            <Input
              id="to"
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>

          {/* Subject Field */}
          <div className="space-y-1.5">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {/* Carriers Summary */}
          <div className="space-y-1.5">
            <Label>Carriers</Label>
            <div className="flex flex-wrap gap-1.5">
              {selectedCarriers.length === 0 ? (
                <span className="text-sm text-muted-foreground">No carriers selected</span>
              ) : (
                selectedCarriers.map((carrier) => (
                  <Badge key={carrier} variant="secondary">
                    {carrier}
                  </Badge>
                ))
              )}
            </div>
          </div>

          {/* Body */}
          <div className="space-y-1.5">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              className="font-mono text-sm"
            />
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              Attachments
            </Label>
            {documents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No documents available</p>
            ) : (
              <div className="border rounded-md p-3 space-y-2 bg-muted/30">
                {documents.map((doc) => (
                  <label
                    key={doc.type}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedDocs.includes(doc.type)}
                      onCheckedChange={(checked) => handleDocToggle(doc.type, !!checked)}
                    />
                    <span>{doc.label}</span>
                  </label>
                ))}
              </div>
            )}
            {selectedDocs.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {selectedDocs.length} document{selectedDocs.length !== 1 ? 's' : ''} will be attached
              </p>
            )}
          </div>

          {/* Confirmation Summary */}
          <div className="border rounded-lg p-4 bg-slate-50 space-y-3">
            <p className="text-sm font-medium text-slate-700">Confirm Send Details</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Agent:</span>
                <span className="ml-2 font-medium">{agentName}</span>
              </div>
              <div>
                <span className="text-muted-foreground">NPN:</span>
                <span className="ml-2 font-medium">{agentNpn || 'N/A'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Recipient:</span>
                <span className="ml-2 font-medium truncate">{to}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Documents:</span>
                <span className="ml-2 font-medium">{selectedDocs.length} attached</span>
              </div>
            </div>

            {/* Confirmation Checkbox */}
            <label className="flex items-start gap-3 pt-2 border-t cursor-pointer">
              <Checkbox
                checked={isConfirmed}
                onCheckedChange={(checked) => setIsConfirmed(!!checked)}
                className="mt-0.5"
              />
              <span className="text-sm text-slate-700">
                I have reviewed this application and confirm it is ready to submit to Pinnacle.
              </span>
            </label>
          </div>
        </div>

        <DialogFooter className="relative z-20">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSending || isSuccess}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || isSuccess || !isConfirmed}
            className={`gap-2 min-w-[140px] ${isSuccess ? 'bg-green-600 hover:bg-green-600' : ''}`}
            title={!isConfirmed ? 'Please confirm before sending' : undefined}
          >
            {getButtonContent()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
