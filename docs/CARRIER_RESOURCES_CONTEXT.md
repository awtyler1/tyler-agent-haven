# Carrier Resources Page - Implementation Context

**Generated:** February 3, 2026
**Purpose:** Context for redesigning the Carrier Resources page

---

## 1. DATABASE SCHEMA

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
  phone: string | null;        // Phone number
  email: string | null;        // Email address
  region: string | null;       // Region/territory covered
  is_primary: boolean | null;  // Primary contact flag
  notes: string | null;        // Additional notes
  created_at: string | null;
  updated_at: string | null;
}
```

### carrier_links table (Portal Links)
```typescript
carrier_links: {
  id: string;                    // UUID primary key
  carrier_id: string;            // FK to carriers.id
  state_code: string | null;     // State filter (NULL = nationwide)
  link_type: string;             // 'portal' | 'certification' | 'commission' | 'marketing' | 'resource' | 'provider_search' | 'drug_search'
  name: string;                  // Link display name
  url: string;                   // Full URL
  description: string | null;    // Optional description
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
  description: string | null;    // Optional description
  year: number | null;           // Plan year (e.g., 2026)
  display_order: number | null;  // Sort order
  created_at: string | null;
  updated_at: string | null;
}
```

### Related Tables

**agent_certifications** - Tracks which carriers an agent is certified with:
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

**carrier_statuses** - Tracks agent contracting status per carrier:
```typescript
carrier_statuses: {
  id: string;
  carrier_id: string;              // FK to carriers.id
  profile_id: string | null;       // FK to profiles.id
  contracting_status: string;      // Status enum
  contracting_link_sent_at: string | null;
  contracting_submitted_at: string | null;
  contracted_at: string | null;
  // ... more fields
}
```

---

## 2. EXISTING CARRIER RESOURCES CODE

### Current Page: `src/pages/CarrierResourcesPage.tsx`

**Key Features:**
- Two-column layout: carrier sidebar (3 cols) + tabbed content (9 cols)
- Three tabs: Contacts, Plans, Documents
- Carrier sidebar shows logos + names, blue highlight for selected
- Filters carriers to only show those the agent is certified with
- Kentucky-only MVP (state selector present but limited)

**Current Structure:**
```
┌─────────────────────────────────────────────────────┐
│ Header: TIG | Agent Portal                          │
├──────────┬──────────────────────────────────────────┤
│ Carrier  │ [Contacts] [Plans] [Documents]           │
│ Sidebar  │                                          │
│          │ Tab Content Area                         │
│ • Aetna  │                                          │
│ • Anthem │ - Contacts: 4-col grid of contact cards  │
│ • ...    │ - Plans: CarrierPlansTab component       │
│          │ - Documents: 2-col (Links + Downloads)   │
└──────────┴──────────────────────────────────────────┘
```

**Hooks Used:**
- `useProfile()` - Get current user profile
- `useNavigationContext()` - Home path, view mode toggle
- `useAgentCarriers()` - Get carriers agent is certified with
- `useCarrierDirectory(stateCode)` - Fetch carrier data with contacts/links/docs

### Hook: `src/hooks/useCarrierDirectory.ts`

**Exports:**
- `useCarrierDirectory(stateCode)` - Main data fetching hook
- `getCarrierLogo(code)` - Get logo for carrier code
- `useSupportedCarriers()` - Static list of 6 main carriers
- `useAgentCarriers()` - Dynamic list based on agent certifications

**Logo Mapping:**
```typescript
const CARRIER_LOGOS: Record<string, string> = {
  aetna: aetnaLogo,
  anthem: anthemLogo,
  devoted: devotedLogo,
  humana: humanaLogo,
  uhc: uhcLogo,
  wellcare: wellcareLogo,
};
```

**Data Fetching Logic:**
1. Fetch active carriers with codes in ['aetna', 'anthem', 'devoted', 'humana', 'uhc', 'wellcare']
2. Fetch contacts where state_code matches OR is NULL
3. Fetch links where state_code matches OR is NULL
4. Fetch documents where state_code matches OR is NULL
5. Combine into CarrierWithResources objects

### Hook: `src/hooks/useAgentRTSCarriers.ts`

Fetches carriers where agent has `contracting_status = 'contracted'` in carrier_statuses.

Returns:
- `rtsCarriers` - All carriers agent is RTS for
- `enabledRTSCarriers` - MVP carriers agent is RTS for
- `displayCarriers` - Falls back to all enabled if no RTS data

### Component: `src/components/carrier-resources/CarrierPlansTab.tsx`

Medicare plan finder within carrier resources:
- County selection (dropdown or ZIP lookup)
- Popular county quick buttons (Jefferson, Fayette, Kenton, Warren)
- Plan filtering (type, premium, SNP)
- Plan comparison (up to 4 plans)
- Plan detail modal

---

## 3. ROUTING

### Route Definition in `src/App.tsx`

```typescript
// Line 268
<Route
  path="/carrier-resources"
  element={
    <ProtectedRoute>
      <CarrierResourcesPage />
    </ProtectedRoute>
  }
/>

// Line 269 - Separate plans route
<Route
  path="/carrier-resources/plans"
  element={
    <ProtectedRoute>
      <CarrierPlansPage />
    </ProtectedRoute>
  }
/>
```

**Related Routes:**
- `/carrier-portals` - CarrierPortalsPage (separate page)
- `/forms-library` - FormsLibraryPage

---

## 4. SAMPLE DATA

### Carriers in Database (from types + carriersData.ts)

| Code | Name | Logo |
|------|------|------|
| aetna | Aetna | aetna-logo.png |
| anthem | Anthem | anthem-logo.jpg |
| devoted | Devoted | devoted-logo.png |
| humana | Humana | humana-logo.png |
| uhc | United Healthcare | uhc-logo.png |
| wellcare | Wellcare | wellcare-logo.jpg |

### Sample Contact Data (from carriersData.ts - Kentucky)

**Aetna:**
```javascript
{ type: "Jonathan Lemaster - Broker Manager", subtitle: "Greater Lexington / Ashland / Eastern Kentucky", number: "(859) 333-5389", email: "lemasterj1@aetna.com" }
{ type: "Will Coursey - Broker Manager", subtitle: "Greater Bowling Green, Owensboro, Western KY", number: "(270) 816-9531", email: "courseyw@aetna.com" }
{ type: "Nina Grinestaff - Broker Manager", subtitle: "Greater Louisville, Northern KY", number: "(502) 443-5381", email: "grinestaff@aetna.com" }
{ type: "Broker Services", number: "(866) 714-9301", email: "brokersupport@aetna.com" }
```

**Humana:**
```javascript
{ type: "Horace Williams - Broker Relationship Executive", number: "(502) 313-7938", email: "hwilliams41@humana.com" }
{ type: "Chris Baker - Broker Relationship Manager", subtitle: "Eastern Kentucky", number: "(859) 227-9256", email: "cbaker56@humana.com" }
{ type: "Samantha Stevenson - Broker Relationship Manager", subtitle: "Western Kentucky", number: "(502) 438-3816", email: "sjones224@humana.com" }
```

### Sample Portal Links (from carriersData.ts - Kentucky)

**Aetna:**
```javascript
{ name: "Broker Portal", url: "https://www.aetna.com/producer_public/login.fcc" }
{ name: "Kit Ordering Portal", url: "https://aetna-pek-ff-op.memberdoc.com/#/login", subtext: "Username and password are your NPN" }
```

**Anthem:**
```javascript
{ name: "Producer World", url: "https://brokerportal.anthem.com/apps/ptb/login" }
{ name: "mProducer", url: "https://mproducer.anthem.com/mproducer/public/login" }
{ name: "Order Materials", url: "https://custompoint.rrd.com/xs2/prelogin?qwerty=25113007" }
```

**Humana:**
```javascript
{ name: "Vantage", url: "https://account.humana.com/" }
{ name: "Medicare Drug List Search", url: "https://rxcalculator.humana.com/medicaredrugsearch" }
{ name: "Find a Provider", url: "https://findcare.humana.com/" }
```

---

## 5. DESIGN SYSTEM

### Key Design Tokens (from DESIGN_SYSTEM.md)

**Colors:**
```css
--brand: hsl(43, 56%, 41%)     /* Gold - avatars, logo only */
--primary: hsl(217, 91%, 50%)  /* Blue - links, buttons, focus */
```

**Semantic Colors:**
- Green: Success, complete, valid (`text-green-500`, `bg-green-500`)
- Amber: Warning, pending, attention (`text-amber-500`, `bg-amber-500`)
- Red: Error, destructive, urgent (`text-red-500`, `bg-red-500`)
- Gray: Neutral, disabled, secondary (`text-muted-foreground`)

**Card Pattern:**
```tsx
<div className="bg-white rounded-xl shadow-sm border border-border/50 overflow-hidden">
  {/* Header */}
  <div className="px-5 py-4 flex items-center justify-between">
    <h2 className="font-semibold text-foreground">{title}</h2>
  </div>
  {/* Content */}
  <div className="border-t border-border/50">
    {/* ... */}
  </div>
</div>
```

**List Row Pattern:**
```tsx
<div className="px-5 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors border-t border-border/30 first:border-t-0 group cursor-pointer">
  {/* Left: Status + Label */}
  <div className="flex items-center gap-3">
    <div className="w-2 h-2 rounded-full bg-green-500" />
    <span className="text-sm text-foreground">{label}</span>
  </div>
  {/* Right: Action */}
  <Eye className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
</div>
```

**Spacing Scale:**
| Token | Value | Usage |
|-------|-------|-------|
| px-5 py-4 | 20px / 16px | Card headers |
| px-5 py-3 | 20px / 12px | List rows, card footers |
| gap-3 | 12px | Icon + label |
| gap-5 | 20px | Compliance items |

### Carrier Brand Colors (from src/config/carriers.ts)

```typescript
// MVP Enabled Carriers
humana:   '#10b981'  // Green
wellcare: '#f59e0b'  // Amber
anthem:   '#3b82f6'  // Blue
aetna:    '#a855f7'  // Purple

// Coming Soon
uhc:      '#0ea5e9'  // Light Blue
cigna:    '#ef4444'  // Red
devoted:  '#ec4899'  // Pink
molina:   '#14b8a6'  // Teal
bcbs:     '#2563eb'  // Blue
```

---

## 6. TYPES

### Type Definitions (from src/types/carrierDirectory.ts)

```typescript
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
```

### CarrierConfig (from src/config/carriers.ts)

```typescript
export interface CarrierConfig {
  id: string;        // matches carriers.code in DB
  name: string;
  color: string;     // Brand hex color
  portalUrl: string;
  enabled: boolean;  // MVP = true, coming soon = false
}
```

---

## 7. STATIC DATA FILE

### src/data/carriersData.ts

Large static data file with hardcoded Kentucky data:
- Contacts per carrier per state
- Portal links per carrier per state
- Downloads per carrier per state
- Summary of Benefits documents organized by plan type

**Structure:**
```typescript
export const carriers = [
  {
    id: "aetna",
    name: "Aetna",
    logo: aetnaLogo,
    stateData: {
      "Kentucky": {
        contacts: [...],
        links: [...],
        downloads: [...],
      },
      "Tennessee": { contacts: [], links: [], downloads: [] },
      // ... other states
    },
    summaryOfBenefits: {
      "Kentucky": {
        "HMO": [...],
        "PPO": [...],
        "D-SNP": [...],
      },
      // ... other states
    },
  },
  // ... other carriers
];
```

---

## 8. KEY FILES REFERENCE

| File | Purpose |
|------|---------|
| `src/pages/CarrierResourcesPage.tsx` | Main page component |
| `src/hooks/useCarrierDirectory.ts` | Data fetching hook |
| `src/hooks/useAgentRTSCarriers.ts` | Agent certification hook |
| `src/types/carrierDirectory.ts` | TypeScript types |
| `src/config/carriers.ts` | Carrier config with colors |
| `src/data/carriersData.ts` | Static hardcoded data |
| `src/components/carrier-resources/CarrierPlansTab.tsx` | Plans tab component |
| `src/integrations/supabase/types.ts` | Database types |
| `DESIGN_SYSTEM.md` | UI patterns and tokens |

---

## 9. NOTES FOR IMPLEMENTATION

1. **Data Sources**: Currently uses database tables (carrier_contacts, carrier_links, carrier_documents) queried via `useCarrierDirectory`. Static `carriersData.ts` exists but appears to be legacy/backup.

2. **State Filtering**: Tables support `state_code` column for state-specific data. NULL means nationwide/all states.

3. **Agent Filtering**: Page filters carriers to only show those the agent is certified with via `useAgentCarriers()`.

4. **Plans Tab**: Uses CMS data from `cms_plans` table, not static data. Has county-based filtering.

5. **MVP Scope**: Currently Kentucky-only. State selector exists but is limited to KY.

6. **Carrier Logos**: Stored as static imports in `src/assets/`, mapped by carrier code.
