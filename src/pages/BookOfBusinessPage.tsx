import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { UploadModal } from '@/components/book-of-business/UploadModal';
import { DashboardView } from '@/components/book-of-business/DashboardView';
import { NudgeBanner } from '@/components/book-of-business/NudgeBanner';
import { SyncFlow } from '@/components/book-of-business/SyncFlow';
import { NewAgentSetup } from '@/components/book-of-business/NewAgentSetup';
import { useProfile } from '@/hooks/useProfile';
import { checkSyncStatus, SyncStatus } from '@/lib/sync';
import { Loader2 } from 'lucide-react';

export default function BookOfBusinessPage() {
  const { profile, loading: profileLoading } = useProfile();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (profile?.id) {
      checkSyncStatus(profile.id)
        .then(setSyncStatus)
        .finally(() => setLoading(false));
    }
  }, [profile?.id]);

  const handleUploadSuccess = () => {
    setRefreshKey((k) => k + 1);
  };

  const handleOpenUploadModal = () => {
    setIsUploadModalOpen(true);
  };

  const handleCloseUploadModal = () => {
    setIsUploadModalOpen(false);
  };

  const handleSetupComplete = () => {
    // After carrier setup, sync is now required
    setSyncStatus({ required: true, isNew: false });
  };

  const handleSyncComplete = () => {
    // After sync, go to dashboard
    setSyncStatus({ required: false, isNew: false });
    setRefreshKey((k) => k + 1);
  };

  // Loading state
  if (profileLoading || loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // No profile state
  if (!profile) {
    return (
      <div className="min-h-screen bg-white dark:bg-background">
        <Navigation />
        <main className="flex-1 pt-24 pb-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-gray-500 dark:text-muted-foreground">
              Please sign in to view your book of business.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // New agent - needs to select carriers first
  if (syncStatus?.isNew) {
    return <NewAgentSetup profileId={profile.id} onComplete={handleSetupComplete} />;
  }

  // Sync required - show sync flow (full screen takeover)
  if (syncStatus?.required) {
    return <SyncFlow profileId={profile.id} onComplete={handleSyncComplete} />;
  }

  // Dashboard view
  return (
    <div className="min-h-screen bg-white dark:bg-background flex flex-col">
      <Navigation />

      <main className="flex-1 pt-20">
        <div className="max-w-5xl mx-auto">
          {/* Nudge Banner */}
          <NudgeBanner onUploadClick={handleOpenUploadModal} />

          {/* Dashboard */}
          <DashboardView
            profileId={profile.id}
            refreshKey={refreshKey}
            onUploadClick={handleOpenUploadModal}
          />
        </div>
      </main>

      <Footer />

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={handleCloseUploadModal}
        onSuccess={handleUploadSuccess}
        profileId={profile.id}
      />
    </div>
  );
}
