import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Form, FormsByCategory, FormCategory } from '@/types/forms';

interface UseFormsReturn {
  forms: Form[];
  formsByCategory: FormsByCategory;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useForms(): UseFormsReturn {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function fetchForms() {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('forms')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (fetchError) throw fetchError;

        setForms((data as Form[]) || []);
      } catch (err) {
        console.error('Error fetching forms:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch forms'));
      } finally {
        setLoading(false);
      }
    }

    fetchForms();
  }, [refreshKey]);

  // Group forms by category
  const formsByCategory: FormsByCategory = {
    compliance: forms.filter(f => f.category === 'compliance'),
    client_intake: forms.filter(f => f.category === 'client_intake'),
    enrollment: forms.filter(f => f.category === 'enrollment'),
    other: forms.filter(f => !['compliance', 'client_intake', 'enrollment'].includes(f.category)),
  };

  const refetch = () => setRefreshKey(k => k + 1);

  return { forms, formsByCategory, loading, error, refetch };
}
