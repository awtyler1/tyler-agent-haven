import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import type {
  Carrier,
  CarrierContact,
  CarrierLink,
  CarrierDocument,
  CarrierWithResources
} from '@/types/carrierDirectory';

// Import carrier logos statically
import aetnaLogo from '@/assets/aetna-logo.png';
import anthemLogo from '@/assets/anthem-logo.jpg';
import devotedLogo from '@/assets/devoted-logo.png';
import humanaLogo from '@/assets/humana-logo.png';
import uhcLogo from '@/assets/uhc-logo.png';
import wellcareLogo from '@/assets/wellcare-logo.jpg';

// Map carrier codes to their logo imports
const CARRIER_LOGOS: Record<string, string> = {
  aetna: aetnaLogo,
  anthem: anthemLogo,
  devoted: devotedLogo,
  humana: humanaLogo,
  uhc: uhcLogo,
  wellcare: wellcareLogo,
};

export interface CarrierDirectoryData {
  carriers: CarrierWithResources[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Fetch carriers with their contacts, links, and documents for a given state.
 * Includes items where state_code matches OR state_code is NULL (nationwide).
 */
// Module-level cache so re-navigating to the directory is instant (no loader
// flash). Data refreshes in the background each visit.
const directoryCache: Record<string, CarrierWithResources[]> = {};

export function useCarrierDirectory(stateCode: string = 'KY'): CarrierDirectoryData {
  const [carriers, setCarriers] = useState<CarrierWithResources[]>(() => directoryCache[stateCode] || []);
  const [loading, setLoading] = useState(() => !directoryCache[stateCode]);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      // Only show the loader when we have nothing cached to show yet.
      if (!directoryCache[stateCode]) setLoading(true);
      setError(null);

      // Fetch active carriers that have logos (our 6 main carriers)
      const { data: carriersData, error: carriersError } = await supabase
        .from('carriers')
        .select('id, code, name, display_name, is_active')
        .eq('is_active', true)
        .in('code', ['aetna', 'anthem', 'devoted', 'humana', 'uhc', 'wellcare'])
        .order('name');

      if (carriersError) throw carriersError;

      // Fetch contacts, links, and documents in parallel.
      // Each query is independent — if one fails, the others still provide data.
      const [contactsResult, linksResult, documentsResult] = await Promise.all([
        supabase
          .from('carrier_contacts')
          .select('*')
          .or(`state_code.eq.${stateCode},state_code.is.null`)
          .then(res => {
            if (res.error) console.error('Error fetching carrier contacts:', res.error);
            return res.data || [];
          }),
        supabase
          .from('carrier_links')
          .select('*')
          .or(`state_code.eq.${stateCode},state_code.is.null`)
          .order('display_order')
          .then(res => {
            if (res.error) console.error('Error fetching carrier links:', res.error);
            return res.data || [];
          }),
        supabase
          .from('carrier_documents')
          .select('*')
          .or(`state_code.eq.${stateCode},state_code.is.null`)
          .order('display_order')
          .then(res => {
            if (res.error) console.error('Error fetching carrier documents:', res.error);
            return res.data || [];
          }),
      ]);

      // Combine data - attach resources to each carrier
      const carriersWithResources: CarrierWithResources[] = (carriersData || []).map((carrier) => ({
        ...carrier,
        logo: CARRIER_LOGOS[carrier.code] || '',
        contacts: contactsResult.filter((c: any) => c.carrier_id === carrier.id) as CarrierContact[],
        links: linksResult.filter((l: any) => l.carrier_id === carrier.id) as CarrierLink[],
        documents: documentsResult.filter((d: any) => d.carrier_id === carrier.id) as CarrierDocument[],
      }));

      directoryCache[stateCode] = carriersWithResources;
      setCarriers(carriersWithResources);
    } catch (err) {
      console.error('Error fetching carrier directory:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch carrier directory'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [stateCode]);

  return {
    carriers,
    loading,
    error,
    refetch: fetchData,
  };
}

/**
 * Get the logo for a carrier by code
 */
export function getCarrierLogo(code: string): string {
  return CARRIER_LOGOS[code] || '';
}

/**
 * List of supported carriers with their display info
 */
export function useSupportedCarriers() {
  const carriers = [
    { code: 'aetna', name: 'Aetna', logo: aetnaLogo },
    { code: 'anthem', name: 'Anthem', logo: anthemLogo },
    { code: 'devoted', name: 'Devoted', logo: devotedLogo },
    { code: 'humana', name: 'Humana', logo: humanaLogo },
    { code: 'uhc', name: 'United Healthcare', logo: uhcLogo },
    { code: 'wellcare', name: 'Wellcare', logo: wellcareLogo },
  ];

  return carriers;
}

// All carriers with RTS name mapping
const ALL_CARRIERS = [
  { code: 'aetna', name: 'Aetna', logo: aetnaLogo, rtsName: 'Aetna' },
  { code: 'anthem', name: 'Anthem', logo: anthemLogo, rtsName: 'Anthem' },
  { code: 'devoted', name: 'Devoted', logo: devotedLogo, rtsName: 'Devoted Health' },
  { code: 'humana', name: 'Humana', logo: humanaLogo, rtsName: 'Humana' },
  { code: 'uhc', name: 'United Healthcare', logo: uhcLogo, rtsName: 'UHC' },
  { code: 'wellcare', name: 'Wellcare', logo: wellcareLogo, rtsName: 'Wellcare' },
];

/**
 * Get carriers the current agent is certified with (from RTS data in agent_certifications).
 * Falls back to all carriers if agent has no certifications or on error.
 */
export function useAgentCarriers() {
  const { profile } = useProfile();
  const [carriers, setCarriers] = useState<Array<{ code: string; name: string; logo: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgentCarriers = async () => {
      if (!profile?.id) {
        // No profile yet - show all carriers as fallback
        setCarriers(ALL_CARRIERS.map(({ code, name, logo }) => ({ code, name, logo })));
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('agent_certifications')
          .select('carrier_name')
          .eq('profile_id', profile.id);

        if (error) throw error;

        if (!data || data.length === 0) {
          // No certifications - show all carriers
          setCarriers(ALL_CARRIERS.map(({ code, name, logo }) => ({ code, name, logo })));
        } else {
          // Filter to only carriers agent is certified with
          const agentCarrierNames = new Set(data.map(d => d.carrier_name));

          const filtered = ALL_CARRIERS
            .filter(c => agentCarrierNames.has(c.rtsName))
            .map(({ code, name, logo }) => ({ code, name, logo }));

          // If no matches found, fall back to all carriers
          setCarriers(filtered.length > 0 ? filtered : ALL_CARRIERS.map(({ code, name, logo }) => ({ code, name, logo })));
        }
      } catch (err) {
        console.error('Error fetching agent carriers:', err);
        // On error, show all carriers
        setCarriers(ALL_CARRIERS.map(({ code, name, logo }) => ({ code, name, logo })));
      } finally {
        setLoading(false);
      }
    };

    fetchAgentCarriers();
  }, [profile?.id]);

  return { carriers, loading };
}
