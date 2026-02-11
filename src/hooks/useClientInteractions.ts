import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface CreateInteractionParams {
  client_id: string;
  interaction_type: string;
  outcome?: string | null;
  notes: string;
  follow_up_date?: string | null;
}

export function useCreateInteraction() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateInteractionParams) => {
      if (!profile?.id) throw new Error('Not authenticated');

      // Insert the interaction
      const { data, error } = await supabase
        .from('client_interactions')
        .insert({
          client_id: params.client_id,
          profile_id: profile.id,
          interaction_type: params.interaction_type,
          outcome: params.outcome || null,
          notes: params.notes,
          follow_up_date: params.follow_up_date || null,
        })
        .select()
        .single();

      if (error) throw error;

      // If follow-up date is set, create a risk flag as a reminder
      if (params.follow_up_date) {
        await supabase
          .from('client_risk_flags')
          .insert({
            client_id: params.client_id,
            profile_id: profile.id,
            flag_type: 'callback',
            severity: 'medium',
            title: `Follow-up scheduled for ${params.follow_up_date}`,
            description: params.notes,
            source: 'manual',
            expires_at: params.follow_up_date,
          });
      }

      // Update last_contacted_at on the client
      await supabase
        .from('clients')
        .update({ last_contacted_at: new Date().toISOString() })
        .eq('id', params.client_id);

      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['client-detail', variables.client_id] });
      queryClient.invalidateQueries({ queryKey: ['book-clients'] });
      queryClient.invalidateQueries({ queryKey: ['book-summary'] });
      toast.success('Note saved');
    },
    onError: (error) => {
      console.error('Failed to save interaction:', error);
      toast.error('Failed to save note');
    },
  });
}
