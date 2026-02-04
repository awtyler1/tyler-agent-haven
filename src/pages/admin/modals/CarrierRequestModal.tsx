import { useState, useEffect } from 'react';
import { Loader2, Check, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface AgentProfile {
  id: string;
  user_id: string | null;
  full_name: string | null;
  npn: string | null;
}

interface CarrierStatus {
  id: string;
  carrier_id: string;
  carrier_name: string;
  contracting_status: string;
}

interface Carrier {
  id: string;
  name: string;
}

interface CarrierRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: AgentProfile;
  carrierStatuses: CarrierStatus[];
  sendEmail: (params: {
    to: string;
    subject: string;
    body: string;
    agentId?: string;
    communicationType: string;
    carriersIncluded?: string[];
  }) => Promise<{ success: boolean; error?: string }>;
  onSuccess: () => Promise<void>;
}

type CarrierRequestStatus = 'idle' | 'sending' | 'success' | 'error';

export function CarrierRequestModal({
  open,
  onOpenChange,
  profile,
  carrierStatuses,
  sendEmail,
  onSuccess,
}: CarrierRequestModalProps) {
  const [allCarriers, setAllCarriers] = useState<Carrier[]>([]);
  const [selectedCarriersForRequest, setSelectedCarriersForRequest] = useState<string[]>([]);
  const [status, setStatus] = useState<CarrierRequestStatus>('idle');
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestTo, setRequestTo] = useState('pfslicensing@pfsinsurance.com');
  const [requestSubject, setRequestSubject] = useState('');
  const [requestBody, setRequestBody] = useState('');

  // Fetch carriers when modal opens
  useEffect(() => {
    async function fetchCarriers() {
      if (!open) return;

      setSelectedCarriersForRequest([]);
      setConfirmed(false);
      setStatus('idle');
      setError(null);
      setRequestTo('pfslicensing@pfsinsurance.com');
      setRequestSubject(`Carrier Request - ${profile.full_name || 'Agent'} (NPN: ${profile.npn || 'N/A'})`);

      const { data: carriersData, error: carriersError } = await supabase
        .from('carriers')
        .select('id, name')
        .order('name');

      if (carriersError) {
        console.error('Error fetching carriers:', carriersError);
        setError('Failed to load carriers');
        return;
      }

      setAllCarriers(carriersData || []);
    }

    fetchCarriers();
  }, [open, profile.full_name, profile.npn]);

  // Get carriers not already in carrier_statuses
  const availableCarriers = allCarriers.filter(
    (carrier) => !carrierStatuses.some((status) => status.carrier_id === carrier.id)
  );

  // Get selected carrier names for display
  const selectedCarrierNames = selectedCarriersForRequest
    .map((id) => allCarriers.find((c) => c.id === id)?.name)
    .filter(Boolean) as string[];

  // Generate carrier request email body
  const generateBody = (carrierNames: string[]) => {
    const carrierList =
      carrierNames.length > 0
        ? carrierNames.map((name) => `- ${name}`).join('\n')
        : '(No carriers selected)';

    return `Hey Support,

Can we start contracting for our agent ${profile.full_name || 'N/A'} with the following carriers:

${carrierList}

NPN: ${profile.npn || 'N/A'}

Thank you,
Caroline Horn
Tyler Insurance Group`;
  };

  // Regenerate body when selected carriers change
  useEffect(() => {
    if (open) {
      setRequestBody(generateBody(selectedCarrierNames));
    }
  }, [selectedCarriersForRequest, open, profile.full_name, profile.npn]);

  const handleCarrierToggle = (carrierId: string, checked: boolean) => {
    setSelectedCarriersForRequest((prev) =>
      checked ? [...prev, carrierId] : prev.filter((id) => id !== carrierId)
    );
  };

  const handleClose = () => {
    if (status === 'sending') return;
    onOpenChange(false);
  };

  const handleSend = async () => {
    if (selectedCarriersForRequest.length === 0) return;

    setStatus('sending');
    setError(null);

    // Convert plain text body to HTML
    const bodyHtml = requestBody
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');

    const result = await sendEmail({
      to: requestTo,
      subject: requestSubject,
      body: bodyHtml,
      agentId: profile.user_id || undefined,
      communicationType: 'other',
      carriersIncluded: selectedCarrierNames,
    });

    if (!result.success) {
      setStatus('error');
      setError(result.error || 'Failed to send email');
      setTimeout(() => setStatus('idle'), 2000);
      return;
    }

    // Create carrier_statuses records for each selected carrier
    const newStatuses = selectedCarriersForRequest.map((carrierId) => ({
      profile_id: profile.id,
      user_id: profile.user_id || null,
      carrier_id: carrierId,
      contracting_status: 'in_progress' as const,
      contracting_submitted_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabase.from('carrier_statuses').insert(newStatuses);

    if (insertError) {
      console.warn('Email sent but failed to create carrier_statuses:', insertError);
    }

    // Refresh carrier statuses
    await onSuccess();

    setStatus('success');
    await new Promise((resolve) => setTimeout(resolve, 1200));
    onOpenChange(false);
  };

  const getButtonContent = () => {
    switch (status) {
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
        return 'Send Request';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-4xl">
        {/* Subtle overlay when sending */}
        {(status === 'sending' || status === 'success') && (
          <div className="absolute inset-0 bg-white/50 z-10 rounded-lg" />
        )}

        <DialogHeader>
          <DialogTitle>Request Additional Carrier</DialogTitle>
          <p className="text-sm text-stone-500">
            Select carriers to request contracting for {profile.full_name || 'this agent'}
          </p>
        </DialogHeader>

        {error && (
          <div className="p-3 rounded-md bg-red-50 border border-red-200">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Two-column layout */}
        <div className="grid grid-cols-2 gap-6 py-2">
          {/* Left Column: To + Carriers */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="carrier-request-to">To</Label>
              <Input
                id="carrier-request-to"
                type="email"
                value={requestTo}
                onChange={(e) => setRequestTo(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="carrier-request-subject">Subject</Label>
              <Input
                id="carrier-request-subject"
                value={requestSubject}
                onChange={(e) => setRequestSubject(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Select Carriers</Label>
              {availableCarriers.length === 0 ? (
                <div className="text-center py-6 text-stone-500 border rounded-md">
                  <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">This agent has all available carriers</p>
                </div>
              ) : (
                <div className="border rounded-md p-3 space-y-2 bg-stone-50 max-h-[300px] overflow-y-auto">
                  {availableCarriers.map((carrier) => (
                    <label
                      key={carrier.id}
                      className="flex items-center gap-2 text-sm cursor-pointer hover:bg-stone-100 p-1 rounded"
                    >
                      <Checkbox
                        checked={selectedCarriersForRequest.includes(carrier.id)}
                        onCheckedChange={(checked) => handleCarrierToggle(carrier.id, !!checked)}
                      />
                      <span>{carrier.name}</span>
                    </label>
                  ))}
                </div>
              )}
              {selectedCarriersForRequest.length > 0 && (
                <p className="text-xs text-stone-500">
                  {selectedCarriersForRequest.length} carrier
                  {selectedCarriersForRequest.length !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>
          </div>

          {/* Right Column: Message */}
          <div className="space-y-1.5">
            <Label htmlFor="carrier-request-body">Message</Label>
            <Textarea
              id="carrier-request-body"
              value={requestBody}
              onChange={(e) => setRequestBody(e.target.value)}
              rows={12}
              className="font-mono text-sm h-full min-h-[300px]"
            />
          </div>
        </div>

        {/* Confirmation Section */}
        {availableCarriers.length > 0 && (
          <div className="border rounded-lg p-4 bg-stone-50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <span className="text-stone-500">Agent:</span>
                  <span className="ml-2 font-medium">{profile.full_name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-stone-500">NPN:</span>
                  <span className="ml-2 font-medium">{profile.npn || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-stone-500">Recipient:</span>
                  <span className="ml-2 font-medium">{requestTo}</span>
                </div>
              </div>
            </div>

            <label className="flex items-start gap-3 pt-2 border-t cursor-pointer">
              <Checkbox
                checked={confirmed}
                onCheckedChange={(checked) => setConfirmed(!!checked)}
                className="mt-0.5"
              />
              <span className="text-sm text-stone-700">
                I confirm this carrier request is ready to send
              </span>
            </label>
          </div>
        )}

        <DialogFooter className="relative z-20">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={status === 'sending' || status === 'success'}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={
              status === 'sending' ||
              status === 'success' ||
              !confirmed ||
              selectedCarriersForRequest.length === 0
            }
            className={`gap-2 min-w-[120px] ${status === 'success' ? 'bg-green-600 hover:bg-green-600' : ''}`}
            title={!confirmed ? 'Please confirm before sending' : undefined}
          >
            {getButtonContent()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
