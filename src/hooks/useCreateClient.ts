import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CreateClientPayload {
  profile_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  address_zip: string;
  status?: string;
  lead_source?: string | null;
  date_of_birth?: string | null;
  medicare_number?: string | null;
  part_a_date?: string | null;
  part_b_date?: string | null;
  email?: string | null;
  address_line1?: string | null;
  address_city?: string | null;
  address_state?: string | null;
}

export interface CreatedClient {
  id: string;
  first_name: string;
  last_name: string;
}

export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateClientPayload) => {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          profile_id: payload.profile_id,
          first_name: payload.first_name,
          last_name: payload.last_name,
          phone: payload.phone,
          address_zip: payload.address_zip,
          status: payload.status || 'active',
          lead_source: payload.lead_source || null,
          date_of_birth: payload.date_of_birth || null,
          medicare_number: payload.medicare_number || null,
          email: payload.email || null,
          address_line1: payload.address_line1 || null,
          address_city: payload.address_city || null,
          address_state: payload.address_state || null,
        })
        .select('id, first_name, last_name')
        .single();

      if (error) throw error;
      return data as CreatedClient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book-clients'] });
    },
  });
}
