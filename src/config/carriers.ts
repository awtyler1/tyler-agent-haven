/**
 * Carrier Configuration
 *
 * Central configuration for all carriers supported in the sync flow.
 * - `enabled: true` = MVP carriers that are fully supported
 * - `enabled: false` = Coming soon (visible to RTS agents but not selectable)
 */

/**
 * Official brand colors for carrier pills and UI accents
 */
export const CARRIER_BRAND_COLORS: Record<string, string> = {
  aetna: '#7B2D8E',      // Purple
  humana: '#4B9B4B',     // Green
  uhc: '#002677',        // Navy
  anthem: '#0072CE',     // Blue
  wellcare: '#00A79D',   // Teal
  devoted: '#F97316',    // Orange
  essence: '#6B2C91',    // Purple
};

export interface CarrierConfig {
  id: string;        // matches carriers.code in DB
  name: string;
  color: string;
  portalUrl: string;
  enabled: boolean;  // MVP = true, coming soon = false
}

export const CARRIERS: CarrierConfig[] = [
  // ============================================================
  // MVP ENABLED CARRIERS
  // ============================================================
  {
    id: 'humana',
    name: 'Humana',
    color: '#10b981',
    portalUrl: 'https://www.humana.com/agent',
    enabled: true,
  },
  {
    id: 'wellcare',
    name: 'WellCare',
    color: '#f59e0b',
    portalUrl: 'https://www.wellcare.com/agents',
    enabled: true,
  },
  {
    id: 'anthem',
    name: 'Anthem',
    color: '#3b82f6',
    portalUrl: 'https://www.anthem.com/broker',
    enabled: true,
  },
  {
    id: 'aetna',
    name: 'Aetna',
    color: '#a855f7',
    portalUrl: 'https://www.aetna.com/producers',
    enabled: true,
  },

  // ============================================================
  // COMING SOON CARRIERS
  // ============================================================
  {
    id: 'uhc',
    name: 'UnitedHealthcare',
    color: '#0ea5e9',
    portalUrl: 'https://www.uhc.com/broker',
    enabled: false,
  },
  {
    id: 'cigna',
    name: 'Cigna',
    color: '#ef4444',
    portalUrl: 'https://www.cigna.com/brokers',
    enabled: false,
  },
  {
    id: 'devoted',
    name: 'Devoted Health',
    color: '#ec4899',
    portalUrl: 'https://www.devoted.com',
    enabled: false,
  },
  {
    id: 'molina',
    name: 'Molina Healthcare',
    color: '#14b8a6',
    portalUrl: 'https://www.molinahealthcare.com',
    enabled: false,
  },
  {
    id: 'bcbs',
    name: 'Blue Cross Blue Shield',
    color: '#2563eb',
    portalUrl: 'https://www.bcbs.com',
    enabled: false,
  },
  {
    id: 'essence',
    name: 'Essence Healthcare',
    color: '#7c3aed',
    portalUrl: 'https://www.essencehealthcare.com',
    enabled: false,
  },
  {
    id: 'alignment',
    name: 'Alignment Health',
    color: '#06b6d4',
    portalUrl: 'https://www.alignmenthealthcare.com',
    enabled: false,
  },
  {
    id: 'amerihealth',
    name: 'AmeriHealth Caritas',
    color: '#0891b2',
    portalUrl: 'https://www.amerihealthcaritas.com',
    enabled: false,
  },
  {
    id: 'banner',
    name: 'Banner Health',
    color: '#059669',
    portalUrl: 'https://www.bannerhealth.com',
    enabled: false,
  },
  {
    id: 'bcbs_az',
    name: 'BCBS Arizona',
    color: '#2563eb',
    portalUrl: 'https://www.azblue.com',
    enabled: false,
  },
  {
    id: 'bcbs_il',
    name: 'BCBS Illinois',
    color: '#2563eb',
    portalUrl: 'https://www.bcbsil.com',
    enabled: false,
  },
  {
    id: 'bcbs_mt',
    name: 'BCBS Montana',
    color: '#2563eb',
    portalUrl: 'https://www.bcbsmt.com',
    enabled: false,
  },
  {
    id: 'bcbs_nm',
    name: 'BCBS New Mexico',
    color: '#2563eb',
    portalUrl: 'https://www.bcbsnm.com',
    enabled: false,
  },
  {
    id: 'bcbs_ok',
    name: 'BCBS Oklahoma',
    color: '#2563eb',
    portalUrl: 'https://www.bcbsok.com',
    enabled: false,
  },
  {
    id: 'bcbs_tx',
    name: 'BCBS Texas',
    color: '#2563eb',
    portalUrl: 'https://www.bcbstx.com',
    enabled: false,
  },
  {
    id: 'BCBS_MI',
    name: 'BCBS Michigan',
    color: '#2563eb',
    portalUrl: 'https://www.bcbsm.com',
    enabled: false,
  },
  {
    id: 'care_partners',
    name: 'Care Partners',
    color: '#16a34a',
    portalUrl: 'https://www.carepartnershealthplan.com',
    enabled: false,
  },
  {
    id: 'CLOVER',
    name: 'Clover Health',
    color: '#22c55e',
    portalUrl: 'https://www.cloverhealth.com',
    enabled: false,
  },
  {
    id: 'connecticare',
    name: 'Connecticare',
    color: '#0d9488',
    portalUrl: 'https://www.connecticare.com',
    enabled: false,
  },
  {
    id: 'EMBLEM',
    name: 'EmblemHealth',
    color: '#4f46e5',
    portalUrl: 'https://www.emblemhealth.com',
    enabled: false,
  },
  {
    id: 'excellus',
    name: 'Excellus BCBS',
    color: '#2563eb',
    portalUrl: 'https://www.excellusbcbs.com',
    enabled: false,
  },
  {
    id: 'fl_blue',
    name: 'FL Blue',
    color: '#1d4ed8',
    portalUrl: 'https://www.floridablue.com',
    enabled: false,
  },
  {
    id: 'freedom',
    name: 'Freedom Health',
    color: '#dc2626',
    portalUrl: 'https://www.freedomhealth.com',
    enabled: false,
  },
  {
    id: 'geisinger',
    name: 'Geisinger',
    color: '#166534',
    portalUrl: 'https://www.geisinger.org',
    enabled: false,
  },
  {
    id: 'gold_kidney',
    name: 'Gold Kidney',
    color: '#ca8a04',
    portalUrl: 'https://www.goldkidneyhealth.com',
    enabled: false,
  },
  {
    id: 'GTL',
    name: 'GTL',
    color: '#475569',
    portalUrl: 'https://www.gtlic.com',
    enabled: false,
  },
  {
    id: 'health_first',
    name: 'Health First',
    color: '#0284c7',
    portalUrl: 'https://www.healthfirst.org',
    enabled: false,
  },
  {
    id: 'healthsun',
    name: 'HealthSun',
    color: '#f59e0b',
    portalUrl: 'https://www.healthsun.com',
    enabled: false,
  },
  {
    id: 'highmark',
    name: 'Highmark',
    color: '#1e40af',
    portalUrl: 'https://www.highmark.com',
    enabled: false,
  },
  {
    id: 'INDEPENDENCE',
    name: 'Independence Blue Cross',
    color: '#2563eb',
    portalUrl: 'https://www.ibx.com',
    enabled: false,
  },
  {
    id: 'jefferson',
    name: 'Jefferson Health Partners Plans',
    color: '#7c3aed',
    portalUrl: 'https://www.jeffersonhealth.org',
    enabled: false,
  },
  {
    id: 'medica',
    name: 'Medica',
    color: '#0891b2',
    portalUrl: 'https://www.medica.com',
    enabled: false,
  },
  {
    id: 'medigold',
    name: 'Medigold',
    color: '#eab308',
    portalUrl: 'https://www.medigold.com',
    enabled: false,
  },
  {
    id: 'NATIONWIDE',
    name: 'Nationwide',
    color: '#1e3a8a',
    portalUrl: 'https://www.nationwide.com',
    enabled: false,
  },
  {
    id: 'regence',
    name: 'Regence',
    color: '#1d4ed8',
    portalUrl: 'https://www.regence.com',
    enabled: false,
  },
  {
    id: 'scan',
    name: 'SCAN',
    color: '#0f766e',
    portalUrl: 'https://www.scanhealthplan.com',
    enabled: false,
  },
  {
    id: 'select_health',
    name: 'Select Health',
    color: '#15803d',
    portalUrl: 'https://www.selecthealth.org',
    enabled: false,
  },
  {
    id: 'silverscript',
    name: 'SilverScript',
    color: '#64748b',
    portalUrl: 'https://www.silverscript.com',
    enabled: false,
  },
  {
    id: 'UNITED_HOME',
    name: 'United Home Life',
    color: '#0369a1',
    portalUrl: 'https://www.unitedhomelife.com',
    enabled: false,
  },
  {
    id: 'upmc',
    name: 'UPMC Health Plan',
    color: '#4338ca',
    portalUrl: 'https://www.upmchealthplan.com',
    enabled: false,
  },
  {
    id: 'centene',
    name: 'Centene',
    color: '#f97316',
    portalUrl: 'https://www.centene.com',
    enabled: false,
  },
];

// Pre-filtered lists for convenience
export const ENABLED_CARRIERS = CARRIERS.filter(c => c.enabled);
export const COMING_SOON_CARRIERS = CARRIERS.filter(c => !c.enabled);

// Lookup helpers
export const getCarrierById = (id: string): CarrierConfig | undefined =>
  CARRIERS.find(c => c.id === id);

export const getCarriersByIds = (ids: string[]): CarrierConfig[] =>
  CARRIERS.filter(c => ids.includes(c.id));

export const getEnabledCarriersByIds = (ids: string[]): CarrierConfig[] =>
  CARRIERS.filter(c => ids.includes(c.id) && c.enabled);
