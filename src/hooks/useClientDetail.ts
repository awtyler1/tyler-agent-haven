import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ClientDetailData {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  phone: string | null;
  email: string | null;
  last_contacted_at: string | null;
  medicare_number: string | null;
  address_line1: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  policies: {
    id: string;
    plan_name: string;
    plan_type: string | null;
    effective_date: string;
    term_date: string | null;
    status: string;
    carrier: { id: string; name: string } | null;
  }[];
  interactions: {
    id: string;
    interaction_type: string;
    outcome: string | null;
    notes: string | null;
    follow_up_date: string | null;
    follow_up_completed_at: string | null;
    created_at: string;
  }[];
  risk_flags: {
    id: string;
    flag_type: string;
    severity: string;
    title: string;
    description: string | null;
    status: string;
    created_at: string;
  }[];
}

export function useClientDetail(clientId: string | null) {
  const { profile } = useAuth();

  return useQuery<ClientDetailData | null>({
    queryKey: ['client-detail', clientId],
    enabled: !!clientId && !!profile?.id,
    queryFn: async () => {
      if (!clientId) return null;

      const [clientRes, interactionsRes, flagsRes] = await Promise.all([
        supabase
          .from('clients')
          .select(`
            id, first_name, last_name, date_of_birth, phone, email, last_contacted_at,
            medicare_number, address_line1, address_city, address_state, address_zip,
            policies (
              id, plan_name, plan_type, effective_date, term_date, status,
              carrier:carriers ( id, name )
            )
          `)
          .eq('id', clientId)
          .single(),

        supabase
          .from('client_interactions')
          .select('id, interaction_type, outcome, notes, follow_up_date, follow_up_completed_at, created_at')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false })
          .limit(50),

        supabase
          .from('client_risk_flags')
          .select('id, flag_type, severity, title, description, status, created_at')
          .eq('client_id', clientId)
          .eq('status', 'active')
          .order('created_at', { ascending: false }),
      ]);

      if (clientRes.error) throw clientRes.error;
      const client = clientRes.data as any;

      return {
        ...client,
        interactions: (interactionsRes.data as any[]) || [],
        risk_flags: (flagsRes.data as any[]) || [],
      };
    },
  });
}
