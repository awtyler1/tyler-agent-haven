import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { SyncFlow } from '@/components/book-of-business/SyncFlow';
import { BookDashboard, FirstTimeState } from '@/components/book-of-business/BookDashboard';
import { useProfile } from '@/hooks/useProfile';
import { checkSyncStatus, SyncStatus } from '@/lib/sync';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BookOfBusinessPage() {
  const { profile, loading: profileLoading } = useProfile();
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (profile?.id) {
      checkSyncStatus(profile.id)
        .then(setSyncStatus)
        .finally(() => setLoading(false));
    }
  }, [profile?.id, refreshKey]);

  const handleSyncComplete = () => {
    // Refresh sync status after completing sync
    setSyncStatus({ required: false, isNew: false });
    setRefreshKey((k) => k + 1);
  };

  // Loading state
  if (profileLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-900 dark:to-stone-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
      </div>
    );
  }

  // No profile state
  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-900 dark:to-stone-950">
        <Navigation />
        <main className="flex-1 pt-24 pb-16">
          <div className="max-w-xl mx-auto px-4 sm:px-6 text-center">
            <p className="text-stone-500 dark:text-stone-400">
              Please sign in to view your book of business.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Not contracted - show message
  if (syncStatus?.notContracted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-900 dark:to-stone-950 flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center px-4 pt-20">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 mx-auto mb-6 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <h1 className="text-2xl font-semibold text-stone-900 dark:text-white mb-2">
              You're not contracted yet
            </h1>
            <p className="text-stone-500 dark:text-stone-400 mb-6">
              To track your book of business, you need to be contracted with at least one carrier.
            </p>
            <Button onClick={() => window.location.href = '/contracting'}>
              Start Contracting
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Sync required (including first-time agents) - show sync flow
  if (syncStatus?.required || syncStatus?.isNew) {
    return <SyncFlow profileId={profile.id} onComplete={handleSyncComplete} />;
  }

  // Dashboard view - the new premium design
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-900 dark:to-stone-950 flex flex-col">
      <Navigation />

      <main className="flex-1 pt-20 pb-12">
        <div className="max-w-xl mx-auto px-4 sm:px-6">
          <BookDashboard
            profileId={profile.id}
            refreshKey={refreshKey}
            lastSyncAt={profile.last_sync_at}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
