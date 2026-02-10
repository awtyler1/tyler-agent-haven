import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ClientPolicy {
  id: string;
  plan_name: string | null;
  effective_date: string | null;
  term_date: string | null;
  status: string | null;
  is_t65: boolean | null;
  carrier: { id: string; name: string } | null;
}

export interface ClientWithPolicies {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  date_of_birth: string | null;
  email: string | null;
  medicare_number: string | null;
  last_contacted_at: string | null;
  policies: ClientPolicy[];
}

export type StatusFilter = 'all' | 'active' | 'termed';

export function useMyClients() {
  const { profile } = useAuth();
  const [clients, setClients] = useState<ClientWithPolicies[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter/search state
  const [searchQuery, setSearchQuery] = useState('');
  const [carrierFilter, setCarrierFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [sortColumn, setSortColumn] = useState<string>('last_name');
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    fetchClients();
  }, [profile?.id]);

  const fetchClients = async () => {
    if (!profile?.id) return;
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('clients')
        .select(`
          id, first_name, last_name, phone, date_of_birth, email,
          medicare_number, last_contacted_at,
          policies!inner (
            id, plan_name, effective_date, term_date, status, is_t65,
            carrier:carriers ( id, name )
          )
        `)
        .eq('profile_id', profile.id)
        .order('last_name', { ascending: true });

      if (queryError) throw queryError;
      setClients((data as unknown as ClientWithPolicies[]) || []);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError(err instanceof Error ? err.message : 'Failed to load clients');
    } finally {
      setIsLoading(false);
    }
  };

  // Get unique carriers from loaded data
  const availableCarriers = useMemo(() => {
    const carrierMap = new Map<string, string>();
    clients.forEach(client => {
      client.policies.forEach(policy => {
        if (policy.carrier?.id && policy.carrier?.name) {
          carrierMap.set(policy.carrier.id, policy.carrier.name);
        }
      });
    });
    return Array.from(carrierMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [clients]);

  // Flatten to one row per client, using their "primary" (most recent active) policy
  const filteredClients = useMemo(() => {
    return clients
      .map(client => {
        // Find the best policy to display (active first, most recent effective date)
        const sortedPolicies = [...client.policies].sort((a, b) => {
          // Active policies first
          if (a.status === 'active' && b.status !== 'active') return -1;
          if (a.status !== 'active' && b.status === 'active') return 1;
          // Then by effective date descending
          return (b.effective_date || '').localeCompare(a.effective_date || '');
        });
        const primaryPolicy = sortedPolicies[0];
        return { ...client, primaryPolicy };
      })
      .filter(client => {
        // Status filter based on primary policy
        if (statusFilter === 'active' && client.primaryPolicy?.status !== 'active') return false;
        if (statusFilter === 'termed' && client.primaryPolicy?.status !== 'termed') return false;

        // Carrier filter
        if (carrierFilter !== 'all' && client.primaryPolicy?.carrier?.id !== carrierFilter) return false;

        // Search filter
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const fullName = `${client.last_name || ''} ${client.first_name || ''}`.toLowerCase();
          const phone = (client.phone || '').replace(/\D/g, '');
          const searchDigits = q.replace(/\D/g, '');

          const matchesName = fullName.includes(q);
          const matchesPhone = searchDigits.length >= 3 && phone.includes(searchDigits);
          if (!matchesName && !matchesPhone) return false;
        }

        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        switch (sortColumn) {
          case 'last_name':
            cmp = (a.last_name || '').localeCompare(b.last_name || '');
            break;
          case 'carrier':
            cmp = (a.primaryPolicy?.carrier?.name || '').localeCompare(b.primaryPolicy?.carrier?.name || '');
            break;
          case 'effective_date':
            cmp = (a.primaryPolicy?.effective_date || '').localeCompare(b.primaryPolicy?.effective_date || '');
            break;
          case 'last_contacted_at':
            cmp = (a.last_contacted_at || '').localeCompare(b.last_contacted_at || '');
            break;
          default:
            cmp = (a.last_name || '').localeCompare(b.last_name || '');
        }
        return sortAsc ? cmp : -cmp;
      });
  }, [clients, searchQuery, carrierFilter, statusFilter, sortColumn, sortAsc]);

  const activeCount = useMemo(() => {
    return clients.filter(c =>
      c.policies.some(p => p.status === 'active')
    ).length;
  }, [clients]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortAsc(!sortAsc);
    } else {
      setSortColumn(column);
      setSortAsc(true);
    }
  };

  return {
    clients: filteredClients,
    allClients: clients,
    isLoading,
    error,
    activeCount,
    availableCarriers,
    searchQuery,
    setSearchQuery,
    carrierFilter,
    setCarrierFilter,
    statusFilter,
    setStatusFilter,
    sortColumn,
    sortAsc,
    handleSort,
    refetch: fetchClients,
  };
}
