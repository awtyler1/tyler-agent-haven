import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SyncCarrierCard } from './SyncCarrierCard';
import { SyncReveal } from './SyncReveal';
import { SyncMilestone } from './SyncMilestone';
import {
  initializeSync,
  getCarrierUploadStatus,
  completeSyncUpload,
  completeSync,
  getMonthName,
  getPreviousMonthName,
  CarrierUploadStatus,
  SyncResult,
} from '@/lib/sync';

interface SyncFlowProps {
  profileId: string;
  onComplete: () => void;
}

type Phase = 'loading' | 'uploading' | 'complete' | 'milestone';

export function SyncFlow({ profileId, onComplete }: SyncFlowProps) {
  const [phase, setPhase] = useState<Phase>('loading');
  const [syncId, setSyncId] = useState<string | null>(null);
  const [previousMonthClients, setPreviousMonthClients] = useState(0);
  const [carrierUploads, setCarrierUploads] = useState<CarrierUploadStatus[]>([]);
  const [uploadingCarrierId, setUploadingCarrierId] = useState<string | null>(null);
  const [runningTotal, setRunningTotal] = useState(0);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  const monthName = getMonthName();
  const prevMonthName = getPreviousMonthName();

  // Initialize sync on mount
  useEffect(() => {
    async function init() {
      try {
        const { syncId: id, previousMonthClients: prevClients } = await initializeSync(profileId);
        setSyncId(id);
        setPreviousMonthClients(prevClients);

        const uploads = await getCarrierUploadStatus(id);
        setCarrierUploads(uploads);

        // Calculate running total from any already-completed uploads
        const completedTotal = uploads
          .filter((u) => u.status === 'complete')
          .reduce((sum, u) => sum + (u.client_count || 0), 0);
        setRunningTotal(completedTotal);

        setPhase('uploading');
      } catch (error) {
        console.error('Failed to initialize sync:', error);
      }
    }
    init();
  }, [profileId]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (carrierId: string, carrierCode: string, file: File) => {
    if (!syncId) return;

    setUploadingCarrierId(carrierId);

    // Update UI to show uploading state
    setCarrierUploads((prev) =>
      prev.map((u) =>
        u.carrier_id === carrierId ? { ...u, status: 'uploading' as const } : u
      )
    );

    try {
      const base64Content = await fileToBase64(file);

      // Call the parse function
      const { data, error: fnError } = await supabase.functions.invoke(
        'parse-production-report',
        {
          body: {
            file: base64Content,
            carrier_code: carrierCode,
            profile_id: profileId,
          },
        }
      );

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      const clientCount = data.stats?.imported + data.stats?.updated || 0;
      const uploadId = data.upload_id;

      // Update sync record
      const { allComplete, runningTotal: newTotal } = await completeSyncUpload(
        syncId,
        carrierId,
        uploadId,
        clientCount
      );

      setRunningTotal(newTotal);

      // Update UI
      setCarrierUploads((prev) =>
        prev.map((u) =>
          u.carrier_id === carrierId
            ? { ...u, status: 'complete' as const, client_count: clientCount }
            : u
        )
      );

      // Check if all carriers are done
      if (allComplete) {
        const result = await completeSync(syncId, profileId);
        setSyncResult(result);

        // Show milestone if achieved, otherwise go straight to reveal
        if (result.milestone) {
          setPhase('milestone');
        } else {
          setPhase('complete');
        }
      }
    } catch (error) {
      console.error('Upload failed:', error);
      // Reset to pending on error
      setCarrierUploads((prev) =>
        prev.map((u) =>
          u.carrier_id === carrierId ? { ...u, status: 'pending' as const } : u
        )
      );
    } finally {
      setUploadingCarrierId(null);
    }
  };

  const handleMilestoneContinue = () => {
    setPhase('complete');
  };

  const handleRevealContinue = () => {
    onComplete();
  };

  // Loading state
  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Milestone celebration
  if (phase === 'milestone' && syncResult?.milestone) {
    return (
      <SyncMilestone
        milestone={syncResult.milestone}
        totalClients={syncResult.totalClients}
        previousTotal={previousMonthClients}
        nextMilestone={syncResult.nextMilestone}
        onContinue={handleMilestoneContinue}
      />
    );
  }

  // Completion reveal
  if (phase === 'complete' && syncResult) {
    const breakdown = carrierUploads
      .filter((u) => u.client_count != null && u.client_count > 0)
      .map((u) => ({
        carrier: u.carrier_name,
        code: u.carrier_code,
        count: u.client_count || 0,
        delta: (u.client_count || 0) - (u.previous_count || 0),
      }));

    return (
      <SyncReveal
        totalClients={syncResult.totalClients}
        previousTotal={previousMonthClients}
        carrierBreakdown={breakdown}
        onContinue={handleRevealContinue}
      />
    );
  }

  // Uploading phase - main sync UI
  const completedCount = carrierUploads.filter((u) => u.status === 'complete').length;
  const totalCarriers = carrierUploads.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-white flex flex-col">
      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-xl w-full">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Time to see your {monthName} progress
            </h1>
            <p className="text-gray-500">
              Upload your latest reports to sync your book
            </p>
          </div>

          {/* Two Column Layout */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left: Previous Month */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <p className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-2">
                {prevMonthName} Book
              </p>
              <p className="text-4xl font-bold text-gray-300">{previousMonthClients}</p>
              <p className="text-sm text-gray-400 mt-1">clients</p>
            </div>

            {/* Right: Current Month (Building) */}
            <div className="bg-white rounded-2xl p-6 border-2 border-primary/20 bg-primary/5">
              <p className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-2">
                Your {monthName} Book
              </p>
              <p className="text-4xl font-bold text-primary">
                {runningTotal > 0 ? runningTotal : '—'}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {runningTotal > 0 ? 'clients so far' : 'uploading...'}
              </p>
            </div>
          </div>

          {/* Progress Text */}
          <p className="text-center text-sm text-gray-500 my-6">
            {completedCount} of {totalCarriers} carriers synced
          </p>

          {/* Carrier Upload Cards */}
          <div className="space-y-3">
            {carrierUploads.map((upload) => (
              <SyncCarrierCard
                key={upload.carrier_id}
                carrier={{
                  id: upload.carrier_id,
                  code: upload.carrier_code,
                  name: upload.carrier_name,
                }}
                status={upload.status}
                clientCount={upload.client_count}
                previousCount={upload.previous_count}
                onFileSelect={(file) =>
                  handleFileSelect(upload.carrier_id, upload.carrier_code, file)
                }
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
