import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ClientDetailData } from '@/hooks/useClientDetail';

interface UpdateClientParams {
  clientId: string;
  field: string;
  value: string | null;
}

export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clientId, field, value }: UpdateClientParams) => {
      const { error } = await supabase
        .from('clients')
        .update({ [field]: value })
        .eq('id', clientId);

      if (error) throw error;
    },
    onMutate: async ({ clientId, field, value }) => {
      await queryClient.cancelQueries({ queryKey: ['client-detail', clientId] });
      const previous = queryClient.getQueryData<ClientDetailData>(['client-detail', clientId]);

      if (previous) {
        queryClient.setQueryData<ClientDetailData>(['client-detail', clientId], {
          ...previous,
          [field]: value,
        });
      }

      return { previous, clientId };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['client-detail', context.clientId], context.previous);
      }
    },
    onSettled: (_data, _err, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client-detail', variables.clientId] });
      queryClient.invalidateQueries({ queryKey: ['book-clients'] });
    },
  });
}
