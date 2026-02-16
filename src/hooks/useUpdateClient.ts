import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ClientDetailData } from '@/hooks/useClientDetail';

/**
 * Fields that should be tracked when hand-edited in the CRM.
 * These are the fields the import pipeline might try to overwrite.
 * Additive content (notes, interactions, doctors) is NOT tracked.
 */
const TRACKABLE_FIELDS = new Set([
  'phone', 'email',
  'address_line1', 'address_city', 'address_state', 'address_zip',
  'date_of_birth', 'medicare_number',
  'part_a_date', 'part_b_date',
  'first_name', 'last_name',
]);

/**
 * Given a current array of manually edited field names and a field being edited,
 * returns the updated array with the field added (if not already present and if trackable).
 */
function appendEditedField(currentFields: string[] | null, fieldName: string): string[] {
  const fields = currentFields ?? [];
  if (!TRACKABLE_FIELDS.has(fieldName)) return fields;
  if (fields.includes(fieldName)) return fields;
  return [...fields, fieldName];
}

interface UpdateClientParams {
  clientId: string;
  field: string;
  value: string | null;
}

export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clientId, field, value }: UpdateClientParams) => {
      const updateData: Record<string, any> = { [field]: value };

      if (TRACKABLE_FIELDS.has(field)) {
        const { data: current } = await supabase
          .from('clients')
          .select('manually_edited_fields')
          .eq('id', clientId)
          .single();

        updateData.manually_edited_fields = appendEditedField(
          (current?.manually_edited_fields as string[]) ?? null,
          field,
        );
      }

      const { error } = await supabase
        .from('clients')
        .update(updateData)
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
          manually_edited_fields: appendEditedField(previous.manually_edited_fields, field),
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
