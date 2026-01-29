/**
 * useSyncPreferences
 *
 * Fetches the agent's last sync preferences for quick repeat syncs.
 * Returns the carriers used in their most recent completed sync.
 *
 * Used by the returning user flow to show "Sync your usual carriers?"
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UseSyncPreferencesReturn {
  preferredCarriers: string[];  // Carrier codes from last sync
  lastSyncDate: string | null;
  isFirstSync: boolean;
  loading: boolean;
}

export function useSyncPreferences(): UseSyncPreferencesReturn {
  const { profile } = useAuth();
  const [preferredCarriers, setPreferredCarriers] = useState<string[]>([]);
  const [lastSyncDate, setLastSyncDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPreferences() {
      if (!profile?.id) {
        // Don't set loading=false yet - we're still waiting for profile
        // This prevents showing first-sync flow while profile loads
        return;
      }

      try {
        // Get most recent completed sync with its carrier uploads
        // Order by month (always populated) instead of completed_at (can be null)
        const { data: lastSync, error: syncError } = await supabase
          .from('monthly_syncs')
          .select(`
            id,
            month,
            completed_at,
            sync_carrier_uploads(
              carrier_id,
              carriers(code)
            )
          `)
          .eq('profile_id', profile.id)
          .eq('status', 'complete')
          .order('month', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (syncError) {
          console.error('Error fetching sync preferences:', syncError);
          setLoading(false);
          return;
        }

        if (lastSync) {
          // Extract carrier codes from the nested response
          const carrierCodes = (lastSync.sync_carrier_uploads as any[])
            ?.map(u => u.carriers?.code)
            .filter(Boolean) || [];

          setPreferredCarriers(carrierCodes);
          setLastSyncDate(lastSync.completed_at);
        }
      } catch (err) {
        console.error('Failed to fetch sync preferences:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPreferences();
  }, [profile?.id]);

  const isFirstSync = preferredCarriers.length === 0;

  return {
    preferredCarriers,
    lastSyncDate,
    isFirstSync,
    loading,
  };
}
