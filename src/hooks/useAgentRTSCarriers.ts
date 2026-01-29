/**
 * useAgentRTSCarriers
 *
 * Fetches the current agent's RTS (Ready to Sell) carriers from carrier_statuses.
 * An agent is RTS for a carrier when carrier_statuses.contracting_status = 'contracted'.
 *
 * Returns carriers split by enabled status for the sync flow:
 * - enabledRTSCarriers: Can be selected for sync
 * - comingSoonRTSCarriers: Visible but locked (not yet supported)
 * - displayCarriers: Use this for rendering (falls back to all enabled if no RTS data)
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CARRIERS, CarrierConfig, ENABLED_CARRIERS } from '@/config/carriers';

interface UseAgentRTSCarriersReturn {
  rtsCarriers: CarrierConfig[];
  enabledRTSCarriers: CarrierConfig[];
  comingSoonRTSCarriers: CarrierConfig[];
  displayCarriers: CarrierConfig[];
  hasRTSData: boolean;
  loading: boolean;
  error: Error | null;
}

export function useAgentRTSCarriers(): UseAgentRTSCarriersReturn {
  const { profile } = useAuth();
  const [rtsCarriers, setRtsCarriers] = useState<CarrierConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchRTSCarriers() {
      if (!profile?.id) {
        setLoading(false);
        return;
      }

      try {
        // Get RTS carriers (contracting_status = 'contracted')
        const { data: rtsData, error: rtsError } = await supabase
          .from('carrier_statuses')
          .select(`
            carrier_id,
            carriers!inner(id, code, name)
          `)
          .eq('profile_id', profile.id)
          .eq('contracting_status', 'contracted');

        if (rtsError) throw rtsError;

        // Map to carrier configs using the carrier code
        const rtsCarrierCodes = rtsData
          ?.map(d => (d.carriers as any)?.code)
          .filter(Boolean) || [];

        const rtsCarrierConfigs = CARRIERS.filter(c =>
          rtsCarrierCodes.includes(c.id)
        );

        setRtsCarriers(rtsCarrierConfigs);
      } catch (err) {
        console.error('Failed to fetch RTS carriers:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch RTS carriers'));
      } finally {
        setLoading(false);
      }
    }

    fetchRTSCarriers();
  }, [profile?.id]);

  // Split into enabled vs coming soon
  const enabledRTSCarriers = rtsCarriers.filter(c => c.enabled);
  const comingSoonRTSCarriers = rtsCarriers.filter(c => !c.enabled);

  // Fallback: if no RTS data, show all enabled carriers (new agent flow)
  const hasRTSData = rtsCarriers.length > 0;
  const displayCarriers = !loading && !hasRTSData
    ? ENABLED_CARRIERS
    : enabledRTSCarriers;

  return {
    rtsCarriers,
    enabledRTSCarriers,
    comingSoonRTSCarriers,
    displayCarriers,
    hasRTSData,
    loading,
    error,
  };
}
