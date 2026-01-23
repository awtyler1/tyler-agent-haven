// Carrier Directory types
// Maps to carrier_contacts, carrier_links, carrier_documents tables

export interface CarrierContact {
  id: string;
  carrier_id: string;
  state_code: string | null;
  contact_type: 'general' | 'broker_support' | 'sales_manager' | 'territory_manager';
  name: string;
  title: string | null;
  phone: string | null;
  email: string | null;
  region: string | null;
  is_primary: boolean;
  notes: string | null;
}

export interface CarrierLink {
  id: string;
  carrier_id: string;
  state_code: string | null;
  link_type: 'portal' | 'certification' | 'commission' | 'marketing' | 'resource' | 'provider_search' | 'drug_search';
  name: string;
  url: string;
  description: string | null;
  display_order: number;
}

export interface CarrierDocument {
  id: string;
  carrier_id: string;
  state_code: string | null;
  document_type: 'guide' | 'form' | 'flyer' | 'training' | 'compliance' | 'market_highlights';
  name: string;
  file_path: string;
  description: string | null;
  year: number | null;
  display_order: number;
}

export interface Carrier {
  id: string;
  code: string;
  name: string;
  display_name: string | null;
  is_active: boolean;
}

export interface CarrierWithResources extends Carrier {
  contacts: CarrierContact[];
  links: CarrierLink[];
  documents: CarrierDocument[];
}

// For the UI - carriers with their logo paths
export interface CarrierDisplayInfo {
  id: string;
  code: string;
  name: string;
  logo: string;
}

// Map carrier codes to their logo imports
// This bridges the gap between database carriers and static assets
export const CARRIER_LOGOS: Record<string, string> = {
  aetna: '/src/assets/aetna-logo.png',
  anthem: '/src/assets/anthem-logo.jpg',
  devoted: '/src/assets/devoted-logo.png',
  humana: '/src/assets/humana-logo.png',
  uhc: '/src/assets/uhc-logo.png',
  wellcare: '/src/assets/wellcare-logo.jpg',
};
