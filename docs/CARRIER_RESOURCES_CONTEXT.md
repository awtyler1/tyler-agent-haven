# Carrier Resources Page — Implementation Context

**Generated:** February 2026
**Purpose:** Database schema and key files reference for the Carrier Resources page

---

## Database Schema

### carriers table
```typescript
carriers: {
  id: string;                              // UUID primary key
  code: string;                            // Short code (e.g., 'aetna', 'humana')
  name: string;                            // Display name
  display_name: string | null;             // Optional alternate display name
  is_active: boolean;                      // Whether carrier is active
  cms_aliases: string[] | null;            // CMS organization name aliases
  rts_aliases: string[] | null;            // RTS/Pinnacle name aliases
  product_tags: string[] | null;           // Tags for filtering
  state_availability: string[] | null;     // Available states
  requires_corporate_resolution: boolean;  // Contracting requirement
  requires_non_resident_states: boolean;   // Contracting requirement
  notes: string | null;                    // Admin notes
  created_at: string;
  updated_at: string;
}
```

### carrier_contacts table
```typescript
carrier_contacts: {
  id: string;                  // UUID primary key
  carrier_id: string;          // FK to carriers.id
  state_code: string | null;   // State filter (NULL = nationwide)
  contact_type: string;        // 'general' | 'broker_support' | 'sales_manager' | 'territory_manager'
  name: string;                // Contact name
  title: string | null;        // Job title
  phone: string | null;
  email: string | null;
  region: string | null;       // Region/territory covered
  is_primary: boolean | null;  // Primary contact flag
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}
```

### carrier_links table
```typescript
carrier_links: {
  id: string;                    // UUID primary key
  carrier_id: string;            // FK to carriers.id
  state_code: string | null;     // State filter (NULL = nationwide)
  link_type: string;             // 'portal' | 'certification' | 'commission' | 'marketing' | 'resource' | 'provider_search' | 'drug_search'
  name: string;                  // Link display name
  url: string;                   // Full URL
  description: string | null;
  display_order: number | null;  // Sort order
  created_at: string | null;
  updated_at: string | null;
}
```

### carrier_documents table
```typescript
carrier_documents: {
  id: string;                    // UUID primary key
  carrier_id: string;            // FK to carriers.id
  state_code: string | null;     // State filter (NULL = nationwide)
  document_type: string;         // 'guide' | 'form' | 'flyer' | 'training' | 'compliance' | 'market_highlights'
  name: string;                  // Document display name
  file_path: string;             // Storage path or URL
  description: string | null;
  year: number | null;           // Plan year (e.g., 2026)
  display_order: number | null;  // Sort order
  created_at: string | null;
  updated_at: string | null;
}
```

### Related Tables

**agent_certifications** — Which carriers an agent is certified with:
```typescript
agent_certifications: {
  id: string;
  profile_id: string;        // FK to profiles.id
  carrier_name: string;      // RTS carrier name
  product_type: string;      // Product certification type
  certification_year: number;
  created_at: string | null;
  updated_at: string | null;
}
```

**carrier_statuses** — Agent contracting status per carrier:
```typescript
carrier_statuses: {
  id: string;
  carrier_id: string;              // FK to carriers.id
  profile_id: string | null;       // FK to profiles.id
  contracting_status: string;      // Status enum
  contracting_link_sent_at: string | null;
  contracting_submitted_at: string | null;
  contracted_at: string | null;
}
```

---

## Key Files

| File | Purpose |
|------|---------|
| `src/pages/CarrierResourcesPage.tsx` | Main page component |
| `src/hooks/useCarrierDirectory.ts` | Data fetching hook (`useCarrierDirectory`, `useAgentCarriers`, `getCarrierLogo`) |
| `src/hooks/useAgentRTSCarriers.ts` | Agent certification hook |
| `src/types/carrierDirectory.ts` | TypeScript interfaces (CarrierContact, CarrierLink, CarrierDocument, CarrierWithResources) |
| `src/config/carriers.ts` | Carrier config with brand colors |
| `src/data/carriersData.ts` | Static hardcoded data (legacy/backup) |
| `src/components/carrier-resources/CarrierPlansTab.tsx` | Plans tab — CMS data, county-based filtering |
| `src/integrations/supabase/types.ts` | Database types |

---

## Notes

- **Data sources:** Database tables (`carrier_contacts`, `carrier_links`, `carrier_documents`) via `useCarrierDirectory`. Static `carriersData.ts` is legacy.
- **State filtering:** Tables support `state_code` column. NULL = nationwide/all states.
- **Agent filtering:** Page shows only carriers the agent is certified with via `useAgentCarriers()`.
- **Plans tab:** Uses CMS data from `cms_plans` table, not static data. County-based filtering.
- **MVP scope:** Currently Kentucky-only. State selector exists but limited.
