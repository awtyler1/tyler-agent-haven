import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { SyncCarrierGrid, getSyncStats } from './SyncCarrierGrid';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { SyncReveal } from './SyncReveal';
import { SyncMilestone } from './SyncMilestone';
import Navigation from '@/components/Navigation';
import { toast } from 'sonner';
import {
  initializeSync,
  getCarrierUploadStatus,
  completeSyncUpload,
  clearCarrierUpload,
  completeSync,
  getMonthName,
  CarrierUploadStatus,
  SyncResult,
} from '@/lib/sync';

interface SyncFlowProps {
  profileId: string;
  onComplete: () => void;
}

type Phase = 'loading' | 'uploading' | 'complete' | 'milestone';

const SUPPORTED_CARRIERS = ['aetna', 'wellcare', 'humana', 'anthem'];

export function SyncFlow({ profileId, onComplete }: SyncFlowProps) {
  const [phase, setPhase] = useState<Phase>('loading');
  const [syncId, setSyncId] = useState<string | null>(null);
  const [previousMonthClients, setPreviousMonthClients] = useState(0);
  const [carrierUploads, setCarrierUploads] = useState<CarrierUploadStatus[]>([]);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  const monthName = getMonthName();

  // Initialize sync on mount
  useEffect(() => {
    async function init() {
      try {
        const { syncId: id, previousMonthClients: prevClients } = await initializeSync(profileId);
        setSyncId(id);
        setPreviousMonthClients(prevClients);

        const uploads = await getCarrierUploadStatus(id);
        setCarrierUploads(uploads);

        setPhase('uploading');
      } catch (error) {
        console.error('Failed to initialize sync:', error);
        toast.error('Failed to initialize sync. Please try again.');
      }
    }
    init();
  }, [profileId]);

  // Handle successful upload from inline tile
  const handleUploadComplete = async (
    carrierId: string,
    stats: { imported: number; updated: number },
    uploadId: string
  ) => {
    console.log('handleUploadComplete called:', { carrierId, stats, uploadId, syncId });

    if (!syncId) {
      console.log('No syncId, returning');
      return;
    }

    const clientCount = stats.imported + stats.updated;

    try {
      const result = await completeSyncUpload(
        syncId,
        carrierId,
        uploadId,
        clientCount
      );

      console.log('completeSyncUpload result:', result);

      // Update UI
      setCarrierUploads((prev) => {
        const updated = prev.map((u) =>
          u.carrier_id === carrierId
            ? { ...u, status: 'complete' as const, client_count: clientCount }
            : u
        );

        // Only check supported carriers for completion
        const supportedCarriers = updated.filter(u =>
          SUPPORTED_CARRIERS.includes(u.carrier_code.toLowerCase())
        );
        const allDone = supportedCarriers.every(u => u.status === 'complete');

        console.log('Supported carriers status:', supportedCarriers.map(u => ({
          name: u.carrier_name,
          status: u.status
        })));
        console.log('All supported carriers done?', allDone);

        // Trigger completion if all supported carriers are done
        if (allDone) {
          // Use setTimeout to avoid state update during render
          setTimeout(async () => {
            console.log('All complete - transitioning to reveal');
            const syncResult = await completeSync(syncId, profileId);
            setSyncResult(syncResult);
            if (syncResult.milestone) {
              setPhase('milestone');
            } else {
              setPhase('complete');
            }
          }, 100);
        }

        return updated;
      });

    } catch (error) {
      console.error('Failed to complete sync upload:', error);
      toast.error('Failed to update sync. Please try again.');
    }
  };

  // Handle clearing a carrier upload
  const handleClearCarrier = async (carrierId: string, carrierName: string) => {
    if (!syncId) return;

    try {
      await clearCarrierUpload(syncId, carrierId);

      // Update UI - reset this carrier to pending
      setCarrierUploads((prev) =>
        prev.map((c) =>
          c.carrier_id === carrierId
            ? { ...c, status: 'pending' as const, client_count: null, uploaded_at: null }
            : c
        )
      );
    } catch (error) {
      console.error('Failed to clear carrier upload:', error);
      toast.error('Failed to clear upload. Please try again.');
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
      <div className="min-h-screen bg-white dark:bg-background">
        <Navigation />
        <div className="flex items-center justify-center pt-32">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
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

  // Uploading phase - main sync UI with 2x2 grid
  const { completed, total, progress } = getSyncStats(
    carrierUploads.map((u) => ({
      id: u.carrier_id,
      carrier_id: u.carrier_id,
      carrier_code: u.carrier_code,
      carrier_name: u.carrier_name,
      status: u.status,
      client_count: u.client_count,
      previous_count: u.previous_count,
    }))
  );

  const isFirstSync = previousMonthClients === 0;

  return (
    <div className="min-h-screen bg-white dark:bg-background flex flex-col">
      <Navigation />

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 pt-24">
        <div className="max-w-md w-full text-center">
          {/* Header */}
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            {isFirstSync ? "Let's sync your book" : `${monthName} Sync`}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            {isFirstSync
              ? 'Upload your carrier reports to track your clients'
              : 'Upload your latest production reports'}
          </p>

          {/* Progress Ring */}
          <div className="mb-8">
            <ProgressRing
              progress={progress}
              completed={completed}
              total={total}
            />
          </div>

          {/* 2x2 Carrier Grid with inline upload */}
          <SyncCarrierGrid
            carriers={carrierUploads.map((u) => ({
              id: u.carrier_id,
              carrier_id: u.carrier_id,
              carrier_code: u.carrier_code,
              carrier_name: u.carrier_name,
              status: u.status,
              client_count: u.client_count,
              previous_count: u.previous_count,
            }))}
            profileId={profileId}
            onUploadComplete={handleUploadComplete}
            onClearClick={handleClearCarrier}
          />
        </div>
      </div>
    </div>
  );
}
