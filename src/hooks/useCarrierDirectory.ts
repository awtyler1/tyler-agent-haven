import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
export function useCarrierDirectory(stateCode: string = 'KY'): CarrierDirectoryData {
  const [carriers, setCarriers] = useState<CarrierWithResources[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch active carriers that have logos (our 6 main carriers)
      const { data: carriersData, error: carriersError } = await supabase
        .from('carriers')
        .select('id, code, name, display_name, is_active')
        .eq('is_active', true)
        .in('code', ['aetna', 'anthem', 'devoted', 'humana', 'uhc', 'wellcare'])
        .order('name');

      if (carriersError) throw carriersError;

      // Fetch contacts for state (including nationwide)
      const { data: contactsData, error: contactsError } = await supabase
        .from('carrier_contacts')
        .select('*')
        .or(`state_code.eq.${stateCode},state_code.is.null`);

      if (contactsError) throw contactsError;

      // Fetch links for state (including nationwide)
      const { data: linksData, error: linksError } = await supabase
        .from('carrier_links')
        .select('*')
        .or(`state_code.eq.${stateCode},state_code.is.null`)
        .order('display_order');

      if (linksError) throw linksError;

      // Fetch documents for state (including nationwide)
      const { data: documentsData, error: documentsError } = await supabase
        .from('carrier_documents')
        .select('*')
        .or(`state_code.eq.${stateCode},state_code.is.null`)
        .order('display_order');

      if (documentsError) throw documentsError;

      // Combine data - attach resources to each carrier
      const carriersWithResources: CarrierWithResources[] = (carriersData || []).map((carrier) => ({
        ...carrier,
        logo: CARRIER_LOGOS[carrier.code] || '',
        contacts: (contactsData || []).filter((c) => c.carrier_id === carrier.id) as CarrierContact[],
        links: (linksData || []).filter((l) => l.carrier_id === carrier.id) as CarrierLink[],
        documents: (documentsData || []).filter((d) => d.carrier_id === carrier.id) as CarrierDocument[],
      }));

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
