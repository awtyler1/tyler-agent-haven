import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { carriers as CARRIERS_DATA } from '@/data/carriersData';
import type {
  CarrierContact,
  CarrierLink,
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

// ────────────────────────────────────────────────────────────────
// SOURCE OF TRUTH: src/data/carriersData.ts (hardcoded, no database).
// Carrier contacts + portal links change often, so we keep them in a
// static file that's quick to edit instead of a Supabase table.
// ────────────────────────────────────────────────────────────────

const STATE_CODE_TO_NAME: Record<string, string> = {
  KY: 'Kentucky',
  TN: 'Tennessee',
  OH: 'Ohio',
  IN: 'Indiana',
  WV: 'West Virginia',
  GA: 'Georgia',
  VA: 'Virginia',
};

// Contacts whose name/label reads like a support desk are treated as the
// carrier's general broker line (drives the "call support" button).
const SUPPORT_CONTACT_RE = /broker services|broker support|agent support|support team|support unit|help desk|producer help/i;

/** Build the directory (carriers + contacts + links) for a state from the static file. */
function buildDirectory(stateCode: string): CarrierWithResources[] {
  const stateName = STATE_CODE_TO_NAME[stateCode] || 'Kentucky';

  return CARRIERS_DATA.map((carrier) => {
    const sd: any = (carrier as any).stateData?.[stateName] || { contacts: [], links: [] };

    const contacts: CarrierContact[] = (sd.contacts || []).map((c: any, i: number) => {
      const name = c.name ?? c.type ?? '';
      return {
        id: `${carrier.id}-contact-${i}`,
        carrier_id: carrier.id,
        state_code: stateCode,
        contact_type: SUPPORT_CONTACT_RE.test(name) ? 'broker_support' : 'territory_manager',
        name,
        title: c.role ?? null,
        phone: c.number ?? c.phone ?? null,
        email: c.email ?? null,
        region: c.region ?? c.subtitle ?? null,
        is_primary: false,
        notes: null,
      };
    });

    // First link is treated as the primary broker/agent portal; the rest
    // render as resource pills.
    const links: CarrierLink[] = (sd.links || []).map((l: any, i: number) => ({
      id: `${carrier.id}-link-${i}`,
      carrier_id: carrier.id,
      state_code: stateCode,
      link_type: i === 0 ? 'portal' : 'resource',
      name: l.name,
      url: l.url,
      description: l.subtext ?? null,
      display_order: i,
    }));

    return {
      id: carrier.id,
      code: carrier.id,
      name: carrier.name,
      display_name: null,
      is_active: true,
      contacts,
      links,
      documents: [],
    };
  });
}

export function useCarrierDirectory(stateCode: string = 'KY'): CarrierDirectoryData {
  const [carriers, setCarriers] = useState<CarrierWithResources[]>(() => buildDirectory(stateCode));

  useEffect(() => {
    setCarriers(buildDirectory(stateCode));
  }, [stateCode]);

  return {
    carriers,
    loading: false,
    error: null,
    refetch: () => setCarriers(buildDirectory(stateCode)),
  };
}

/**
 * Get the logo for a carrier by code
 */
export function getCarrierLogo(code: string): string {
  return CARRIER_LOGOS[code] || '';
}

/**
 * List of supported carriers with their display info, derived from the static
 * carrier file. `logo` may be '' — callers should fall back to a monogram.
 */
export function useSupportedCarriers() {
  return CARRIERS_DATA.map((c) => ({
    code: c.id,
    name: c.name,
    logo: c.logo,
  }));
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
