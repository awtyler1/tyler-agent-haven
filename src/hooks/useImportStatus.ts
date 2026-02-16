// Provides carrier sync status for the Import page grid
// and pending batch detection for resume.

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface CarrierSyncStatus {
  carrierId: string;
  carrierCode: string;
  carrierName: string;
  brandColor: string;
  clientCount: number;
  isSyncedThisMonth: boolean;
  lastSyncDate: string | null;
  lastSyncFileName: string | null;
  lastSyncStats: { newRecords: number; updatedRecords: number } | null;
}

export interface PendingBatch {
  id: string;
  fileName: string;
  status: string;
  sourceFormat: string;
  detectedFormat: string | null;
  totalRecords: number;
  newRecords: number;
  updatedRecords: number;
  skippedRecords: number;
  termedRecords: number;
  skipDetails: { row: number; reason: string }[];
  formatMismatch: boolean;
  mismatchDetectedCarrier: string | null;
  carrierId: string | null;
  createdAt: string;
}

const BRAND_COLORS: Record<string, string> = {
  humana: '#3A9A34',
  aetna: '#6B2580',
  anthem: '#0033A0',
  uhc: '#002677',
  wellcare: '#007A72',
  devoted: '#B8292F',
};

export function useImportStatus() {
  const { profile } = useAuth();
  const profileId = profile?.id ? String(profile.id) : null;

  const carriersQuery = useQuery({
    queryKey: ['import-status', profileId],
    queryFn: async () => {
      if (!profileId) return [];

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // Get carriers from agent's policies (distinct carrier_id)
      const { data: policyCarriers } = await supabase
        .from('policies')
        .select('carrier_id, carriers(id, name, code)')
        .eq('profile_id', profileId)
        .eq('status', 'active');

      // Deduplicate carriers
      const carrierMap = new Map<string, { id: string; name: string; code: string }>();
      if (policyCarriers) {
        for (const pc of policyCarriers) {
          const carrier = pc.carriers as any;
          if (carrier?.id && !carrierMap.has(String(carrier.id))) {
            carrierMap.set(String(carrier.id), {
              id: String(carrier.id),
              name: carrier.name || carrier.code,
              code: carrier.code || '',
            });
          }
        }
      }

      const carriers = Array.from(carrierMap.values());

      // Get committed batches for this month
      const { data: monthBatches } = await supabase
        .from('book_import_batches')
        .select('carrier_id, file_name, new_records, updated_records, committed_at')
        .eq('profile_id', profileId)
        .eq('status', 'committed')
        .not('carrier_id', 'is', null)
        .gte('created_at', monthStart)
        .order('committed_at', { ascending: false });

      // Get client counts per carrier
      const { data: clientCounts } = await supabase
        .from('policies')
        .select('carrier_id')
        .eq('profile_id', profileId)
        .eq('status', 'active');

      const countMap = new Map<string, number>();
      if (clientCounts) {
        for (const p of clientCounts) {
          const cid = String(p.carrier_id);
          countMap.set(cid, (countMap.get(cid) || 0) + 1);
        }
      }

      // Build batch lookup (first = most recent)
      const batchMap = new Map<string, any>();
      if (monthBatches) {
        for (const b of monthBatches) {
          const cid = String(b.carrier_id);
          if (!batchMap.has(cid)) batchMap.set(cid, b);
        }
      }

      return carriers.map((c): CarrierSyncStatus => {
        const batch = batchMap.get(c.id);
        return {
          carrierId: c.id,
          carrierCode: c.code,
          carrierName: c.name,
          brandColor: BRAND_COLORS[c.code?.toLowerCase()] || '#A89A84',
          clientCount: countMap.get(c.id) || 0,
          isSyncedThisMonth: !!batch,
          lastSyncDate: batch?.committed_at || null,
          lastSyncFileName: batch?.file_name || null,
          lastSyncStats: batch ? {
            newRecords: batch.new_records || 0,
            updatedRecords: batch.updated_records || 0,
          } : null,
        };
      });
    },
    enabled: !!profileId,
    staleTime: 30_000,
  });

  // Check for pending batches (resume detection)
  const pendingQuery = useQuery({
    queryKey: ['import-pending', profileId],
    queryFn: async (): Promise<PendingBatch | null> => {
      if (!profileId) return null;

      const { data, error } = await supabase.functions.invoke('import-book-of-business', {
        body: { action: 'check_pending', profileId },
      });

      if (error || !data?.pending) return null;

      const p = data.pending;
      return {
        id: p.id,
        fileName: p.file_name,
        status: p.status,
        sourceFormat: p.source_format,
        detectedFormat: p.detected_format,
        totalRecords: p.total_records || 0,
        newRecords: p.new_records || 0,
        updatedRecords: p.updated_records || 0,
        skippedRecords: p.skipped_records || 0,
        termedRecords: p.termed_records || 0,
        skipDetails: p.skip_details || [],
        formatMismatch: p.format_mismatch || false,
        mismatchDetectedCarrier: p.mismatch_detected_carrier,
        carrierId: p.carrier_id ? String(p.carrier_id) : null,
        createdAt: p.created_at,
      };
    },
    enabled: !!profileId,
    staleTime: 60_000,
  });

  return {
    carriers: carriersQuery.data ?? [],
    pendingBatch: pendingQuery.data ?? null,
    isLoading: carriersQuery.isLoading,
    refetch: carriersQuery.refetch,
  };
}
