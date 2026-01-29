import { supabase } from '@/integrations/supabase/client';

// Milestone thresholds
const MILESTONES = [25, 50, 100, 150, 200, 250, 300, 400, 500, 750, 1000];

export interface SyncStatus {
  required: boolean;
  isNew: boolean;
  /** True if agent has no contracted carriers at all */
  notContracted?: boolean;
  currentSync?: {
    id: string;
    month: string;
    status: string;
    started_at: string | null;
  };
}

export interface CarrierUploadStatus {
  id: string;
  carrier_id: string;
  carrier_code: string;
  carrier_name: string;
  status: 'pending' | 'uploading' | 'complete';
  client_count: number | null;
  previous_count: number | null;
  uploaded_at: string | null;
}

export interface SyncResult {
  totalClients: number;
  delta: number;
  milestone: number | null;
  nextMilestone: number | null;
}

// Get current month as YYYY-MM-01 for DB queries
function getCurrentMonthDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

// Get previous month as YYYY-MM-01
function getPreviousMonthDate(): string {
  const now = new Date();
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}-01`;
}

/**
 * Check if sync is required for the current month
 */
export async function checkSyncStatus(profileId: string): Promise<SyncStatus> {
  // First check if agent has any contracted carriers
  const { data: contractedCarriers, error: contractedError } = await supabase
    .from('carrier_statuses')
    .select('carrier_id')
    .eq('profile_id', profileId)
    .eq('contracting_status', 'contracted')
    .limit(1);

  if (contractedError) {
    console.error('Error checking contracted carriers:', contractedError);
    throw contractedError;
  }

  // No contracted carriers at all - show "not contracted" state
  // This is different from isNew (which means contracted but hasn't selected what to track)
  if (!contractedCarriers || contractedCarriers.length === 0) {
    return { required: false, isNew: true, notContracted: true };
  }

  // Skip the agent_carriers check - we'll use contracted carriers directly
  // and auto-populate agent_carriers on first sync

  const currentMonth = getCurrentMonthDate();
  const dayOfMonth = new Date().getDate();

  // Check for existing sync this month
  const { data: existingSync, error: syncError } = await supabase
    .from('monthly_syncs')
    .select('id, month, status, started_at')
    .eq('profile_id', profileId)
    .eq('month', currentMonth)
    .single();

  if (syncError && syncError.code !== 'PGRST116') {
    // PGRST116 = no rows returned
    console.error('Error checking sync status:', syncError);
    throw syncError;
  }

  // If sync exists and is complete, no sync required
  if (existingSync?.status === 'complete') {
    return { required: false, isNew: false };
  }

  // If we're before the 5th of the month, don't force sync
  // (but if they have an in-progress sync, show it)
  if (dayOfMonth < 5 && !existingSync) {
    return { required: false, isNew: false };
  }

  // Sync is required (either pending/in-progress or needs to be created)
  return {
    required: true,
    isNew: false,
    currentSync: existingSync
      ? {
          id: existingSync.id,
          month: existingSync.month,
          status: existingSync.status,
          started_at: existingSync.started_at,
        }
      : undefined,
  };
}

/**
 * Initialize or get existing sync for current month
 */
export async function initializeSync(profileId: string): Promise<{
  syncId: string;
  previousMonthClients: number;
}> {
  const currentMonth = getCurrentMonthDate();

  // Check for existing sync
  const { data: existingSync } = await supabase
    .from('monthly_syncs')
    .select('id, previous_month_clients')
    .eq('profile_id', profileId)
    .eq('month', currentMonth)
    .single();

  if (existingSync) {
    return {
      syncId: existingSync.id,
      previousMonthClients: existingSync.previous_month_clients || 0,
    };
  }

  // Get previous month's client count
  const previousStats = await getPreviousMonthStats(profileId);

  // Create new sync record
  const { data: newSync, error: createError } = await supabase
    .from('monthly_syncs')
    .insert({
      profile_id: profileId,
      month: currentMonth,
      status: 'in_progress',
      started_at: new Date().toISOString(),
      previous_month_clients: previousStats.totalClients,
    })
    .select('id')
    .single();

  if (createError) {
    console.error('Error creating sync:', createError);
    throw createError;
  }

  // Get agent's carriers (or fall back to contracted carriers for new agents)
  let { data: agentCarriers } = await supabase
    .from('agent_carriers')
    .select('carrier_id')
    .eq('profile_id', profileId);

  // If no agent_carriers yet, use contracted carriers
  if (!agentCarriers || agentCarriers.length === 0) {
    const { data: contracted } = await supabase
      .from('carrier_statuses')
      .select('carrier_id')
      .eq('profile_id', profileId)
      .eq('contracting_status', 'contracted');

    agentCarriers = contracted || [];

    // Auto-populate agent_carriers for future syncs
    if (agentCarriers.length > 0) {
      await supabase
        .from('agent_carriers')
        .upsert(
          agentCarriers.map((c) => ({
            profile_id: profileId,
            carrier_id: c.carrier_id,
          })),
          { onConflict: 'profile_id,carrier_id', ignoreDuplicates: true }
        );
    }
  }

  // Create carrier upload placeholders with previous counts
  if (agentCarriers && agentCarriers.length > 0) {
    const carrierUploads = await Promise.all(
      agentCarriers.map(async (ac) => {
        const prevCount = previousStats.carrierCounts[ac.carrier_id] || 0;
        return {
          sync_id: newSync.id,
          carrier_id: ac.carrier_id,
          previous_count: prevCount,
        };
      })
    );

    await supabase.from('sync_carrier_uploads').insert(carrierUploads);
  }

  return {
    syncId: newSync.id,
    previousMonthClients: previousStats.totalClients,
  };
}

/**
 * Get carrier upload status for a sync
 */
export async function getCarrierUploadStatus(
  syncId: string
): Promise<CarrierUploadStatus[]> {
  const { data, error } = await supabase
    .from('sync_carrier_uploads')
    .select(
      `
      id,
      carrier_id,
      client_count,
      previous_count,
      uploaded_at,
      carriers (code, name)
    `
    )
    .eq('sync_id', syncId);

  if (error) {
    console.error('Error getting carrier upload status:', error);
    throw error;
  }

  return (data || []).map((row) => {
    const carrier = row.carriers as { code: string; name: string } | null;
    return {
      id: row.id,
      carrier_id: row.carrier_id,
      carrier_code: carrier?.code || '',
      carrier_name: carrier?.name || '',
      status: row.uploaded_at ? 'complete' : 'pending',
      client_count: row.client_count,
      previous_count: row.previous_count,
      uploaded_at: row.uploaded_at,
    };
  });
}

/**
 * Complete a carrier upload within a sync
 */
export async function completeSyncUpload(
  syncId: string,
  carrierId: string,
  uploadId: string,
  clientCount: number
): Promise<{ allComplete: boolean; runningTotal: number }> {
  // Update the carrier upload record
  const { error: updateError } = await supabase
    .from('sync_carrier_uploads')
    .update({
      production_upload_id: uploadId,
      client_count: clientCount,
      uploaded_at: new Date().toISOString(),
    })
    .eq('sync_id', syncId)
    .eq('carrier_id', carrierId);

  if (updateError) {
    console.error('Error updating sync upload:', updateError);
    throw updateError;
  }

  // Get all carrier uploads with carrier codes to check completion status
  const supportedCodes = ['aetna', 'wellcare', 'humana', 'anthem'];

  const { data: uploads } = await supabase
    .from('sync_carrier_uploads')
    .select('carrier_id, client_count, uploaded_at, carriers!inner(code)')
    .eq('sync_id', syncId);

  // Filter to only supported carriers
  const supportedUploads = uploads?.filter(u =>
    supportedCodes.includes((u.carriers as { code: string })?.code?.toLowerCase())
  ) || [];

  const completedUploads = supportedUploads.filter((u) => u.uploaded_at);
  const allComplete = supportedUploads.length > 0 &&
    completedUploads.length === supportedUploads.length;
  const runningTotal = completedUploads.reduce(
    (sum, u) => sum + (u.client_count || 0),
    0
  );

  console.log('completeSyncUpload check:', {
    totalUploads: uploads?.length,
    supportedUploads: supportedUploads.length,
    completedUploads: completedUploads.length,
    allComplete,
  });

  return { allComplete, runningTotal };
}

/**
 * Clear a single carrier upload from a sync
 */
export async function clearCarrierUpload(syncId: string, carrierId: string): Promise<void> {
  const { error } = await supabase
    .from('sync_carrier_uploads')
    .update({
      client_count: null,
      uploaded_at: null,
      production_upload_id: null,
    })
    .eq('sync_id', syncId)
    .eq('carrier_id', carrierId);

  if (error) {
    console.error('Error clearing carrier upload:', error);
    throw error;
  }
}

/**
 * Finalize a sync and check for milestones
 */
export async function completeSync(
  syncId: string,
  profileId: string
): Promise<SyncResult> {
  // Get total from carrier uploads
  const { data: uploads } = await supabase
    .from('sync_carrier_uploads')
    .select('client_count')
    .eq('sync_id', syncId);

  const totalClients = uploads?.reduce((sum, u) => sum + (u.client_count || 0), 0) || 0;

  // Get previous month total from sync record
  const { data: syncRecord } = await supabase
    .from('monthly_syncs')
    .select('previous_month_clients')
    .eq('id', syncId)
    .single();

  const previousTotal = syncRecord?.previous_month_clients || 0;
  const delta = totalClients - previousTotal;

  // Update sync as complete
  await supabase
    .from('monthly_syncs')
    .update({
      status: 'complete',
      completed_at: new Date().toISOString(),
      total_clients: totalClients,
    })
    .eq('id', syncId);

  // Update profile's last_sync_at timestamp
  await supabase
    .from('profiles')
    .update({ last_sync_at: new Date().toISOString() })
    .eq('id', profileId);

  // Check for milestone
  let achievedMilestone: number | null = null;
  let nextMilestone: number | null = null;

  for (const milestone of MILESTONES) {
    if (totalClients >= milestone) {
      // Check if this milestone was already achieved
      const { data: existing } = await supabase
        .from('milestones')
        .select('id')
        .eq('profile_id', profileId)
        .eq('milestone_type', 'client_count')
        .eq('milestone_value', milestone)
        .single();

      if (!existing) {
        // New milestone achieved!
        await supabase.from('milestones').insert({
          profile_id: profileId,
          milestone_type: 'client_count',
          milestone_value: milestone,
          sync_id: syncId,
        });
        achievedMilestone = milestone;
      }
    } else {
      // This is the next milestone to reach
      nextMilestone = milestone;
      break;
    }
  }

  return {
    totalClients,
    delta,
    milestone: achievedMilestone,
    nextMilestone,
  };
}

/**
 * Get previous month's stats for comparison
 */
export async function getPreviousMonthStats(profileId: string): Promise<{
  totalClients: number;
  carrierCounts: Record<string, number>;
}> {
  const previousMonth = getPreviousMonthDate();

  // Try to get from previous sync first
  const { data: prevSync } = await supabase
    .from('monthly_syncs')
    .select(
      `
      total_clients,
      sync_carrier_uploads (carrier_id, client_count)
    `
    )
    .eq('profile_id', profileId)
    .eq('month', previousMonth)
    .eq('status', 'complete')
    .single();

  if (prevSync) {
    const carrierCounts: Record<string, number> = {};
    const uploads = prevSync.sync_carrier_uploads as Array<{
      carrier_id: string;
      client_count: number;
    }>;
    uploads?.forEach((u) => {
      carrierCounts[u.carrier_id] = u.client_count || 0;
    });
    return {
      totalClients: prevSync.total_clients || 0,
      carrierCounts,
    };
  }

  // Fallback: count from policies table
  const { data: policies } = await supabase
    .from('policies')
    .select('carrier_id')
    .eq('profile_id', profileId)
    .eq('status', 'active');

  const carrierCounts: Record<string, number> = {};
  policies?.forEach((p) => {
    carrierCounts[p.carrier_id] = (carrierCounts[p.carrier_id] || 0) + 1;
  });

  const totalClients = Object.values(carrierCounts).reduce((sum, c) => sum + c, 0);

  return { totalClients, carrierCounts };
}

/**
 * Add carriers for an agent
 */
export async function addAgentCarriers(
  profileId: string,
  carrierIds: string[]
): Promise<void> {
  const records = carrierIds.map((carrierId) => ({
    profile_id: profileId,
    carrier_id: carrierId,
  }));

  const { error } = await supabase.from('agent_carriers').insert(records);

  if (error) {
    console.error('Error adding agent carriers:', error);
    throw error;
  }
}

/**
 * Get all active carriers
 * @deprecated NewAgentSetup now fetches contracted carriers directly from carrier_statuses
 */
export async function getSupportedCarriers(): Promise<
  Array<{ id: string; code: string; name: string }>
> {
  const { data, error } = await supabase
    .from('carriers')
    .select('id, code, name')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error getting carriers:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get contracted carriers for a specific agent
 */
export async function getContractedCarriers(
  profileId: string
): Promise<Array<{ id: string; code: string; name: string }>> {
  const { data, error } = await supabase
    .from('carrier_statuses')
    .select(`
      carrier_id,
      carriers (id, code, name)
    `)
    .eq('profile_id', profileId)
    .eq('contracting_status', 'contracted');

  if (error) {
    console.error('Error getting contracted carriers:', error);
    throw error;
  }

  return (data || [])
    .filter((cs) => cs.carriers)
    .map((cs) => {
      const carrier = cs.carriers as { id: string; code: string; name: string };
      return carrier;
    });
}

/**
 * Format month name from date
 */
export function getMonthName(date?: Date): string {
  const d = date || new Date();
  return d.toLocaleDateString('en-US', { month: 'long' });
}

/**
 * Get previous month name
 */
export function getPreviousMonthName(): string {
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return prev.toLocaleDateString('en-US', { month: 'long' });
}

/**
 * Get next recommended sync date (7th of month when carrier reports are available)
 * - Before the 7th: sync this month
 * - On or after the 7th: sync next month
 */
export function getNextSyncDate(): string {
  const now = new Date();
  const day = now.getDate();
  const targetDay = 7;

  if (day < targetDay) {
    // Before 7th: sync this month
    return new Date(now.getFullYear(), now.getMonth(), targetDay)
      .toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  } else {
    // On or after 7th: sync next month
    return new Date(now.getFullYear(), now.getMonth() + 1, targetDay)
      .toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  }
}
