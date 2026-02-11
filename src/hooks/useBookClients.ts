import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { BookClient } from '@/types/book';
import { getCarrierColor } from '@/types/book';

export interface BookClientWithMeta extends BookClient {
  age: number | null;
  carrier_color: string;
}

export function useBookClients() {
  const { profile } = useAuth();
  const [clients, setClients] = useState<BookClientWithMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCarriers, setSelectedCarriers] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);

  useEffect(() => {
    if (!profile?.id) return;
    fetchClients();
  }, [profile?.id]);

  const fetchClients = async () => {
    if (!profile?.id) return;
    setIsLoading(true);
    setError(null);

    try {
      // Fetch clients with policies; also fetch any DB-stored risk flags
      const [clientsRes, flagsRes] = await Promise.all([
        supabase
          .from('clients')
          .select(`
            id, first_name, last_name, date_of_birth, phone, email, last_contacted_at,
            policies (
              id, plan_name, plan_type, effective_date, term_date, status,
              carrier:carriers ( id, name )
            )
          `)
          .eq('profile_id', profile.id)
          .order('last_name', { ascending: true }),

        supabase
          .from('client_risk_flags')
          .select('client_id, flag_type, title, severity')
          .eq('profile_id', profile.id)
          .eq('status', 'active'),
      ]);

      console.log('[useBookClients] querying profile_id:', profile.id);
      console.log('[useBookClients] raw results:', {
        clientsCount: clientsRes.data?.length ?? 0,
        clientsError: clientsRes.error,
        flagsCount: flagsRes.data?.length ?? 0,
        flagsError: flagsRes.error,
      });

      if (clientsRes.error) throw clientsRes.error;

      // Build DB flag lookup (may be empty — that's fine, we compute flags below)
      const dbFlagMap = new Map<string, { flag_type: string; title: string; severity: string }>();
      (flagsRes.data || []).forEach((f: any) => {
        const existing = dbFlagMap.get(f.client_id);
        if (!existing || severityRank(f.severity) > severityRank(existing.severity)) {
          dbFlagMap.set(f.client_id, f);
        }
      });

      // Transform to BookClientWithMeta with computed attention flags
      const now = new Date();
      const result: BookClientWithMeta[] = (clientsRes.data as any[]).map(client => {
        const policies = client.policies || [];
        const sortedPolicies = [...policies].sort((a: any, b: any) => {
          // Active policies first
          if (a.status === 'active' && b.status !== 'active') return -1;
          if (a.status !== 'active' && b.status === 'active') return 1;
          // Among active: MA/MAPD plans first (primary carrier assignment)
          const aIsMA = ['MA', 'MAPD'].includes((a.plan_type || '').toUpperCase());
          const bIsMA = ['MA', 'MAPD'].includes((b.plan_type || '').toUpperCase());
          if (aIsMA && !bIsMA) return -1;
          if (!aIsMA && bIsMA) return 1;
          // Then by most recent effective date
          return (b.effective_date || '').localeCompare(a.effective_date || '');
        });
        const primary = sortedPolicies[0];

        const carrierName = primary?.carrier?.name || '';
        const dob = client.date_of_birth;
        const age = dob ? calculateAge(dob) : null;

        // Compute attention flag (priority: DB flag > birthday > overdue > no phone)
        const dbFlag = dbFlagMap.get(client.id);
        let flagType: string | null = dbFlag?.flag_type || null;
        let flagTitle: string | null = dbFlag?.title || null;
        let flagSeverity: string | null = dbFlag?.severity || null;

        if (!dbFlag) {
          const computed = computeAttentionFlag(client, now);
          if (computed) {
            flagType = computed.flag_type;
            flagTitle = computed.title;
            flagSeverity = computed.severity;
          }
        }

        return {
          id: client.id,
          first_name: client.first_name,
          last_name: client.last_name,
          date_of_birth: client.date_of_birth,
          phone: client.phone,
          email: client.email,
          last_contacted_at: client.last_contacted_at,
          carrier_id: primary?.carrier?.id || undefined,
          carrier_name: carrierName || undefined,
          plan_name: primary?.plan_name || undefined,
          plan_type: primary?.plan_type || undefined,
          effective_date: primary?.effective_date || undefined,
          policy_status: primary?.status || undefined,
          flag_type: flagType,
          flag_title: flagTitle,
          flag_severity: flagSeverity,
          age,
          carrier_color: getCarrierColor(carrierName),
        };
      });

      setClients(result);
    } catch (err) {
      console.error('Error fetching book clients:', err);
      setError(err instanceof Error ? err.message : 'Failed to load clients');
    } finally {
      setIsLoading(false);
    }
  };

  // Get unique carriers from loaded data
  const availableCarriers = useMemo(() => {
    const carrierSet = new Map<string, { id: string; name: string; color: string }>();
    clients.forEach(c => {
      if (c.carrier_id && c.carrier_name) {
        carrierSet.set(c.carrier_id, {
          id: c.carrier_id,
          name: c.carrier_name,
          color: c.carrier_color,
        });
      }
    });
    return Array.from(carrierSet.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [clients]);

  // Filtered + searched clients
  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const fullName = `${c.first_name} ${c.last_name}`.toLowerCase();
        const phone = (c.phone || '').replace(/\D/g, '');
        const searchDigits = q.replace(/\D/g, '');
        const matchesName = fullName.includes(q);
        const matchesPhone = searchDigits.length >= 3 && phone.includes(searchDigits);
        if (!matchesName && !matchesPhone) return false;
      }

      if (selectedCarriers.length > 0 && (!c.carrier_id || !selectedCarriers.includes(c.carrier_id))) {
        return false;
      }

      if (dateFrom || dateTo) {
        if (!c.effective_date) return false;
        const eff = new Date(c.effective_date);
        if (dateFrom && eff < dateFrom) return false;
        if (dateTo && eff > dateTo) return false;
      }

      return true;
    });
  }, [clients, searchQuery, selectedCarriers, dateFrom, dateTo]);

  // Split into flagged and regular
  const flaggedClients = useMemo(() => filteredClients.filter(c => c.flag_type), [filteredClients]);
  const regularClients = useMemo(() => filteredClients.filter(c => !c.flag_type), [filteredClients]);

  return {
    clients: filteredClients,
    flaggedClients,
    regularClients,
    allClients: clients,
    isLoading,
    error,
    availableCarriers,
    searchQuery,
    setSearchQuery,
    selectedCarriers,
    setSelectedCarriers,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    refetch: fetchClients,
  };
}

// ── Client-side attention flag computation ──────────────────────────────

function computeAttentionFlag(
  client: { date_of_birth: string | null; last_contacted_at: string | null; phone: string | null },
  now: Date,
): { flag_type: string; title: string; severity: string } | null {
  // Priority 1: Birthday within next 7 days
  if (client.date_of_birth) {
    const dob = new Date(client.date_of_birth);
    const birthdayThisYear = new Date(now.getFullYear(), dob.getMonth(), dob.getDate());
    // If birthday already passed this year, check next year
    if (birthdayThisYear < now) {
      birthdayThisYear.setFullYear(birthdayThisYear.getFullYear() + 1);
    }
    const daysUntil = Math.floor((birthdayThisYear.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil >= 0 && daysUntil <= 7) {
      return { flag_type: 'birthday_upcoming', title: 'Birthday this week', severity: 'low' };
    }
  }

  // Priority 2: No contact in 90+ days (only if we HAVE a date — NULL means no data yet)
  if (client.last_contacted_at) {
    const lastContact = new Date(client.last_contacted_at);
    const daysSince = Math.floor((now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince >= 90) {
      return {
        flag_type: 'no_contact_90',
        title: `No contact in ${daysSince} days`,
        severity: daysSince >= 180 ? 'high' : 'medium',
      };
    }
  }
  // NULL last_contacted_at = agent hasn't started tracking yet — NOT overdue

  return null;
}

function calculateAge(dob: string): number {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function severityRank(severity: string): number {
  switch (severity) {
    case 'critical': return 4;
    case 'high': return 3;
    case 'medium': return 2;
    case 'low': return 1;
    default: return 0;
  }
}
