import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CarrierRequest {
  id: string;
  agent_id: string;
  recipient_email: string;
  subject: string | null;
  body_html: string | null;
  carriers_included: string[] | null;
  sent_at: string;
  sent_by: string;
  /** Joined from profiles table - sender's full name */
  sent_by_name?: string;
}

export interface UseCarrierRequestHistoryOptions {
  /** user_id from profiles table (stored as agent_id in contracting_communications) */
  agentUserId: string | null;
}

export interface UseCarrierRequestHistoryReturn {
  /** List of carrier requests, newest first */
  requests: CarrierRequest[];
  /** Initial loading state */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Manually refetch requests */
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching carrier request history for an agent.
 *
 * Carrier requests are logged to contracting_communications when sent
 * via the carrier request modal with communication_type = 'other'.
 *
 * @example
 * const { requests, isLoading } = useCarrierRequestHistory({
 *   agentUserId: profile.user_id,
 * });
 *
 * // Display
 * {requests.map(req => (
 *   <div key={req.id}>
 *     <span>{req.carriers_included?.join(', ')}</span>
 *     <span>Sent to {req.recipient_email}</span>
 *   </div>
 * ))}
 */
export function useCarrierRequestHistory({
  agentUserId,
}: UseCarrierRequestHistoryOptions): UseCarrierRequestHistoryReturn {
  const [requests, setRequests] = useState<CarrierRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch carrier request history with sender names joined
   */
  const fetchRequests = useCallback(async () => {
    // If no user_id, agent hasn't been created in auth yet - return empty
    if (!agentUserId) {
      setRequests([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    try {
      setError(null);

      // Query contracting_communications for carrier requests
      // Join with profiles to get sender's name
      const { data, error: fetchError } = await supabase
        .from('contracting_communications')
        .select(`
          id,
          agent_id,
          recipient_email,
          subject,
          body_html,
          carriers_included,
          sent_at,
          sent_by,
          sender:profiles!contracting_communications_sent_by_fkey(full_name)
        `)
        .eq('agent_id', agentUserId)
        .eq('communication_type', 'other')
        .not('carriers_included', 'is', null)
        .order('sent_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Transform to flatten sent_by_name
      const transformedRequests: CarrierRequest[] = (data || []).map((req) => ({
        id: req.id,
        agent_id: req.agent_id || '',
        recipient_email: req.recipient_email,
        subject: req.subject,
        body_html: req.body_html,
        carriers_included: req.carriers_included,
        sent_at: req.sent_at || '',
        sent_by: req.sent_by || '',
        sent_by_name: (req.sender as { full_name: string | null } | null)?.full_name || 'Unknown',
      }));

      setRequests(transformedRequests);
    } catch (err) {
      console.error('Error fetching carrier request history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load carrier requests');
    } finally {
      setIsLoading(false);
    }
  }, [agentUserId]);

  // Fetch on mount and when agentUserId changes
  useEffect(() => {
    setIsLoading(true);
    fetchRequests();
  }, [fetchRequests]);

  return {
    requests,
    isLoading,
    error,
    refetch: fetchRequests,
  };
}
