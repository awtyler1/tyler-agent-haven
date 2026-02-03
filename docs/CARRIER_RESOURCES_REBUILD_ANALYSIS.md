# Carrier Resources Page Rebuild Analysis
**Generated:** February 2, 2026
**Purpose:** Deep analysis for replacing PDF downloads with live CMS plan data

---

## 1. Current Carrier Resources Page Structure

### File Locations
| Page | Path | Purpose |
|------|------|---------|
| CarrierResourcesPage | `src/pages/CarrierResourcesPage.tsx` | Main resources hub |
| CarrierPlansPage | `src/pages/CarrierPlansPage.tsx` | Static PDF document library |
| CarrierPortalsPage | `src/pages/CarrierPortalsPage.tsx` | Quick portal links grid |

### CarrierResourcesPage Layout (Main Page)

```
+--------------------------------------------------+
| HEADER (sticky)                                   |
| TIG | Agent Portal          [Agent Name] [Avatar] |
+--------------------------------------------------+
| ← Back to Dashboard                               |
| Carrier Resources            [Plan Documents →]   |
+--------------------------------------------------+
|          |                                        |
| SIDEBAR  |  CONTENT AREA (9 cols)                |
| (3 cols) |                                        |
|          |  +----------------------------------+  |
| [Aetna]  |  | CONTACTS                         |  |
| [Anthem] |  | 4-column grid                    |  |
| [Devoted]|  | Name, Title, Region, Phone, Email|  |
| [Humana] |  +----------------------------------+  |
| [UHC]    |                                        |
| [Wellcare|  +---------------+ +----------------+  |
|          |  |PORTALS & LINKS| |QUICK DOWNLOADS |  |
|          |  | List items    | | List items     |  |
|          |  | with ext icons| | with dl icons  |  |
|          |  +---------------+ +----------------+  |
+--------------------------------------------------+
| FOOTER                                            |
+--------------------------------------------------+
```

### Current UI Components

**Header:**
- TIG branding with Agent Portal label
- Dual-role toggle (admin/agent view)
- User avatar dropdown

**Left Sidebar (3 cols):**
- Vertical carrier list (buttons)
- Carrier logo + name
- Selected state: `bg-blue-600 text-white`
- Default state: `hover:bg-gray-50`

**Right Content (9 cols):**
1. **Contacts Card** - 4-column grid
   - Contact name (font-medium)
   - Title (text-xs muted)
   - Region (text-xs muted)
   - Phone (tel: link, blue)
   - Email (mailto: link, blue, truncated)

2. **Portals & Links Card** (left half)
   - List of external links
   - Hover: `bg-blue-50 border-blue-200`
   - ExternalLink icon with transition

3. **Quick Downloads Card** (right half)
   - List of documents
   - Download icon
   - Same hover pattern

### CarrierPlansPage Layout (PDF Documents)

```
+--------------------------------------------------+
| HEADER                                            |
+--------------------------------------------------+
| ← Back to Carrier Resources                       |
| Plan Documents                    [Year: 2026 ▼] |
+--------------------------------------------------+
|          |                                        |
| SIDEBAR  |  CONTENT AREA (9 cols)                |
| (3 cols) |                                        |
|          |  [Carrier Logo] Carrier Name          |
| [Carriers]|  2026 Plans • Kentucky               |
|          |                                        |
|          |  +----------------------------------+  |
|          |  | ▶ HMO Plans         [12 plans]  |  |
|          |  +----------------------------------+  |
|          |  | ▶ PPO Plans          [8 plans]  |  |
|          |  +----------------------------------+  |
|          |  | ▶ D-SNP Plans        [4 plans]  |  |
|          |  +----------------------------------+  |
+--------------------------------------------------+
```

**Accordion Content (expanded):**
```
+------------------------------------------+
| Plan Name                    [Non-Comm]  |
| [D-SNP] [Louisville Area]                |
| [SOB] [EOC] [ANOC] [Formulary]           |
+------------------------------------------+
```

### Filtering Currently in Place

| Filter | Location | Implementation |
|--------|----------|----------------|
| **State** | CarrierResourcesPage | Hardcoded to KY only |
| **Carrier** | All pages | `useAgentCarriers()` → agent_certifications |
| **Year** | CarrierPlansPage | Dropdown (2026 only, 2027 disabled) |

### Navigation Flow

```
Dashboard (/)
    ↓
CarrierResourcesPage (/carrier-resources)
    ├── [Button] Plan Documents →
    │       ↓
    │   CarrierPlansPage (/carrier-resources/plans?carrier=X&state=Y)
    │
    └── (Separate route)
        CarrierPortalsPage (/carrier-portals)
```

---

## 2. Current CMS Integration Components

### PlanFinderPage (Admin Only)

**Location:** `src/pages/admin/PlanFinderPage.tsx`

**UI Flow:**
1. Search bar (ZIP or county name)
2. Quick county buttons (Popular: Jefferson, Fayette, etc.)
3. Results header with filter controls
4. Plan cards in 2-column grid
5. Floating compare tray (bottom)

**Filter Controls:**
| Filter | Type | Options |
|--------|------|---------|
| Plan Type | Select | All, HMO, PPO, HMO-POS |
| Premium | Select | Any, $0 only, $30 or less |
| SNP Only | Checkbox | Boolean toggle |
| Sort By | Select | Premium, Max OOP, Rating |

**ZIP Code Lookup (Kentucky):**
```typescript
const ZIP_TO_COUNTY: Record<string, { fips: string; name: string }> = {
  '400': { fips: '21111', name: 'Jefferson' },  // Louisville
  '403': { fips: '21067', name: 'Fayette' },    // Lexington
  '410': { fips: '21117', name: 'Kenton' },     // Covington
  // ... 12 total prefixes
};
```

### PlanCard Component (Inline in PlanFinderPage)

**Structure:**
```
+------------------------------------------+
| [Org Name] • [H1234-001]                 |
| Plan Marketing Name             $XX/mo   |
| [HMO] [D-SNP]  ⭐⭐⭐⭐☆ 4.0             |
+------------------------------------------+
| Deductible | Max OOP | Drug Deductible   |
| $0         | $3,400  | $0                |
+------------------------------------------+
| PCP Visit     $0  | Specialist    $40   |
| Emergency   $120  | Inpatient  $295/day |
+------------------------------------------+
| [Dental] [Vision] [Hearing] [OTC $50/mo] |
+------------------------------------------+
| [Quick View] [Full Details]  [+ Compare] |
+------------------------------------------+
```

### PlanDetailModal Component

**Location:** `src/components/medicare/PlanDetailModal.tsx`

**Structure:**
- Dialog wrapper (`max-w-2xl max-h-[90vh]`)
- Header: Org name, plan ID, plan name, badges, star rating
- 8 Collapsible sections:
  1. **Costs Overview** (defaultOpen)
  2. **Medical Services** (defaultOpen)
  3. **Prescription Drugs**
  4. **Dental Benefits**
  5. **Vision Benefits**
  6. **Hearing Benefits**
  7. **Additional Benefits**
  8. **Plan Documents** (fetches from `plan_documents` table)
- Footer: Year, status, Compare button, Close button

**Reusable Sub-Components:**
- `StarRating` - 5-star display with numeric value
- `BenefitRow` - Label/value row with highlight support
- `Section` - Collapsible card with icon

### PlanComparison Component

**Location:** `src/components/medicare/PlanComparison.tsx`

**Structure:**
- Header row with print button
- Plan header cards (sticky)
- 7 comparison categories (collapsible)
- Disclaimer card
- Print footer

**Comparison Categories:**
1. Costs (Premium, Deductible, MOOP, Drug Deductible)
2. Medical Services (7 items)
3. Prescription Drugs (5 tiers)
4. Dental (3 items)
5. Vision (2 items)
6. Hearing (2 items)
7. Additional Benefits (4 items)

**Highlighting Logic:**
- `highlight: 'low'` → lowest value is green
- `highlight: 'high'` → highest value is green
- `highlight: 'zero'` → $0 values are green

### CMS Hooks (`src/hooks/useCmsPlans.ts`)

| Hook | Purpose | Key Params |
|------|---------|------------|
| `useCmsPlans(filters)` | Query with multiple filters | year, stateCode, countyFips, planTypes, carrierId |
| `usePlansByCounty(state, fips, year)` | Plans for specific county | Two-step: service_areas → plans |
| `useCmsCounties(state, year)` | Get counties list | Deduplicates by FIPS |
| `usePlanById(id)` | Single plan lookup | Returns transformed CmsPlan |
| `useFilteredPlans(plans, options)` | Client-side filter/sort | Memoized filtering |

---

## 3. Data Relationships

### Carrier → CMS Plans Mapping

**Database Schema:**

```sql
-- carriers table
carriers (
  id UUID PRIMARY KEY,
  code TEXT UNIQUE,           -- 'humana', 'aetna', etc.
  name TEXT,
  cms_aliases TEXT[]          -- ['Humana Insurance Company', ...]
)

-- cms_plans table
cms_plans (
  id UUID PRIMARY KEY,
  organization_name TEXT,     -- 'Humana Insurance Company'
  carrier_id UUID REFERENCES carriers(id),  -- ← FK to carriers
  ...
)
```

**Existing Function:**
```sql
get_carrier_id_from_cms_org(org_name: string) → string
```

### How to Filter CMS Plans by Carrier

**Option 1: By carrier_id (recommended)**
```typescript
const { plans } = useCmsPlans({
  carrierId: carrier.id,  // UUID from carriers table
  year: 2026,
  stateCode: 'KY',
  countyFips: selectedCounty
});
```

**Option 2: By organization_name (less reliable)**
```typescript
// Requires knowing exact CMS organization name
query.eq('organization_name', 'Humana Insurance Company')
```

### Current Carrier Mapping

| Internal Code | carriers.id | CMS organization_name |
|--------------|-------------|----------------------|
| humana | UUID | Humana Insurance Company |
| aetna | UUID | Aetna Medicare |
| anthem | UUID | Anthem HealthKeepers Plus |
| uhc | UUID | UnitedHealthcare |
| wellcare | UUID | WellCare Health Plans |
| devoted | UUID | Devoted Health |

**Note:** The `cms_aliases` column on `carriers` table maps multiple org names to one carrier.

### Connection: agent_certifications → cms_plans

```
agent_certifications.carrier_name  (TEXT: "Humana", "Aetna", etc.)
         ↓ (via ALL_CARRIERS mapping)
carriers.code                       (TEXT: "humana", "aetna")
         ↓ (database FK)
carriers.id                         (UUID)
         ↓ (cms_plans.carrier_id)
cms_plans                           (filtered by carrier)
```

**New Hook Needed:**
```typescript
// Get carrier UUID from code for CMS filtering
function useCarrierIdFromCode(code: string): string | null
```

---

## 4. UI Component Inventory

### Reusable Components for Rebuild

#### From PlanFinderPage
| Component | Location | Reusable? | Notes |
|-----------|----------|-----------|-------|
| `StarRating` | Inline (line 62-76) | **Yes** | Extract to shared component |
| `PlanCard` | Inline (line 81-287) | **Yes** | Extract to `src/components/medicare/PlanCard.tsx` |
| `PlanCardSkeleton` | Inline (line 293-315) | **Yes** | Loading state |
| ZIP_TO_COUNTY lookup | Inline (line 27-52) | **Yes** | Move to utility |

#### From PlanDetailModal
| Component | Location | Reusable? | Notes |
|-----------|----------|-----------|-------|
| `StarRating` | Line 57-71 | **Yes** | Duplicate - consolidate |
| `BenefitRow` | Line 77-105 | **Yes** | Key/value display |
| `Section` | Line 111-144 | **Yes** | Collapsible card |
| Document fetching | useEffect | **Yes** | Reuse for plan docs |

#### From PlanComparison
| Component | Location | Reusable? | Notes |
|-----------|----------|-----------|-------|
| `COMPARISON_CATEGORIES` | Line 23-86 | **Yes** | Config array |
| `getBestValueIndex` | Line 106-141 | **Yes** | Highlight logic |
| Print layout | Line 339-343 | **Yes** | Print footer |

#### Shadcn/ui Components Used
| Component | Import Path | Usage |
|-----------|-------------|-------|
| `Badge` | `@/components/ui/badge` | Plan type, SNP badges |
| `Card`, `CardContent` | `@/components/ui/card` | Plan cards |
| `Collapsible` | `@/components/ui/collapsible` | Expandable sections |
| `Dialog` | `@/components/ui/dialog` | Modal wrapper |
| `Select` | `@/components/ui/select` | Dropdowns |
| `Skeleton` | `@/components/ui/skeleton` | Loading states |
| `Accordion` | `@/components/ui/accordion` | CarrierPlansPage |
| `Checkbox` | `@/components/ui/checkbox` | SNP filter |
| `Input` | `@/components/ui/input` | Search box |
| `Button` | `@/components/ui/button` | Actions |

#### Icons (Lucide)
```
Star, ChevronDown, FileText, ExternalLink, DollarSign,
Stethoscope, Pill, Eye, Ear, Sparkles, Search, MapPin,
Heart, ArrowRight, X, Loader2, Download, Printer
```

---

## 5. Proposed Architecture

### New Page Structure

**Option A: Tabs within CarrierResourcesPage (Recommended)**

```
+--------------------------------------------------+
| HEADER                                            |
+--------------------------------------------------+
| ← Back to Dashboard                               |
| Carrier Resources                                 |
+--------------------------------------------------+
|          |                                        |
| SIDEBAR  |  [Contacts] [Plans] [Documents]  TABS |
| (3 cols) |                                        |
|          |  ======================================|
| [Carriers]|                                       |
|          |  TAB CONTENT                          |
|          |                                        |
+--------------------------------------------------+
```

**Option B: Integrated Single View**

```
+--------------------------------------------------+
| HEADER                                            |
+--------------------------------------------------+
| ← Back to Dashboard                               |
| Carrier Resources           [County: Jefferson ▼]|
+--------------------------------------------------+
|          |                                        |
| SIDEBAR  |  CONTACTS CARD                        |
| (3 cols) |  +----------------------------------+ |
|          |  | 4-column contact grid            | |
| [Carriers]|  +----------------------------------+ |
|          |                                        |
|          |  PORTALS & LINKS                      |
|          |  +----------------------------------+ |
|          |  | Portal links list                | |
|          |  +----------------------------------+ |
|          |                                        |
|          |  PLANS IN [COUNTY]        [Filters ▼] |
|          |  +----------------------------------+ |
|          |  | Plan Card Grid (2 cols)          | |
|          |  | [PlanCard] [PlanCard]            | |
|          |  | [PlanCard] [PlanCard]            | |
|          |  +----------------------------------+ |
|          |                                        |
+--------------------------------------------------+
```

### Recommended: Tabbed Layout

```
+--------------------------------------------------+
| HEADER (sticky)                                   |
| TIG | Agent Portal          [Agent Name] [Avatar] |
+--------------------------------------------------+
| ← Back to Dashboard                               |
| Carrier Resources               [State: KY ▼]    |
+--------------------------------------------------+
|          |                                        |
| SIDEBAR  |  +---------+---------+---------+      |
| (3 cols) |  |Contacts | Plans   |Documents|      |
|          |  +---------+---------+---------+      |
| [Aetna]  |                                        |
| [Anthem]●|  PLANS TAB CONTENT                    |
| [Devoted]|  +----------------------------------+ |
| [Humana] |  | County: [Jefferson      ▼]       | |
| [UHC]    |  | Type: [All ▼] Premium: [All ▼]   | |
| [Wellcare|  +----------------------------------+ |
|          |                                        |
|          |  24 Anthem Plans in Jefferson County  |
|          |                                        |
|          |  +---------------+ +---------------+  |
|          |  | PlanCard      | | PlanCard      |  |
|          |  | Anthem Blue.. | | Anthem Silver.|  |
|          |  | $0/mo ⭐⭐⭐⭐ | | $29/mo ⭐⭐⭐⭐⭐|  |
|          |  +---------------+ +---------------+  |
|          |                                        |
+--------------------------------------------------+
| COMPARE TRAY (fixed, when plans selected)        |
+--------------------------------------------------+
```

### Components to Build

| Component | Type | Description |
|-----------|------|-------------|
| `CarrierResourcesTabs` | New | Tab navigation (Contacts/Plans/Documents) |
| `PlanCard` | Extract | Reusable plan card from PlanFinderPage |
| `CarrierPlansTab` | New | Plans grid with filters for specific carrier |
| `CountySelector` | New | ZIP/county dropdown component |
| `PlanFilters` | New | Filter bar (type, premium, SNP, sort) |

### Hook Additions

```typescript
// New hook: Get plans for a carrier in a county
function usePlansByCarrierAndCounty(
  carrierId: string | null,
  stateCode: string,
  countyFips: string | null,
  year: number
): { plans: CmsPlan[]; isLoading: boolean; error: Error | null }

// New hook: Get carrier UUID from code
function useCarrierId(code: string): string | null
```

### Data Flow

```
CarrierResourcesPage
    │
    ├── useAgentCarriers()           → filtered carrier list
    ├── useCarrierDirectory(state)   → contacts, links, documents
    │
    └── CarrierPlansTab (new)
            │
            ├── useCarrierId(selectedCarrierCode) → carrier UUID
            ├── useCmsCounties(state, year)       → county options
            └── usePlansByCarrierAndCounty(...)   → filtered plans
                    │
                    └── PlanCard (reused)
                            │
                            └── PlanDetailModal (reused)
```

### State Management

```typescript
// CarrierResourcesPage state
const [selectedCarrierCode, setSelectedCarrierCode] = useState<string>('');
const [selectedStateCode, setSelectedStateCode] = useState<string>('KY');
const [activeTab, setActiveTab] = useState<'contacts' | 'plans' | 'documents'>('contacts');

// CarrierPlansTab state (lifted or local)
const [selectedCounty, setSelectedCounty] = useState<{ fips: string; name: string } | null>(null);
const [filters, setFilters] = useState({
  planType: 'all',
  premium: 'all' as 'all' | 'zero' | 'low',
  snpOnly: false,
});
const [sortBy, setSortBy] = useState<'premium' | 'moop' | 'rating'>('premium');
const [comparePlans, setComparePlans] = useState<CmsPlan[]>([]);
```

---

## 6. Implementation Checklist

### Phase 1: Extract Reusable Components
- [ ] Create `src/components/medicare/PlanCard.tsx` from PlanFinderPage
- [ ] Create `src/components/medicare/StarRating.tsx` (consolidate duplicates)
- [ ] Create `src/components/medicare/PlanFilters.tsx`
- [ ] Create `src/lib/zipToCounty.ts` (move ZIP_TO_COUNTY)

### Phase 2: Add Carrier Filtering Hook
- [ ] Create `usePlansByCarrier(carrierId, stateCode, countyFips, year)`
- [ ] Add `useCarrierId(code)` hook to get UUID from carrier code
- [ ] Test carrier → plan filtering with existing data

### Phase 3: Build New Tab Component
- [ ] Create `src/components/carrier-resources/CarrierPlansTab.tsx`
- [ ] Integrate county selector
- [ ] Integrate filter controls
- [ ] Integrate PlanCard grid
- [ ] Add compare functionality

### Phase 4: Update CarrierResourcesPage
- [ ] Add tab navigation UI
- [ ] Keep Contacts as default tab
- [ ] Add Plans tab
- [ ] Keep Documents tab (or remove if replacing entirely)
- [ ] Remove "Plan Documents" button (now integrated)

### Phase 5: Cleanup
- [ ] Remove or deprecate CarrierPlansPage.tsx
- [ ] Update routes if needed
- [ ] Test agent certification filtering

---

## 7. File Changes Summary

### Files to Create
```
src/components/medicare/PlanCard.tsx        (extract from PlanFinderPage)
src/components/medicare/StarRating.tsx      (consolidate)
src/components/medicare/PlanFilters.tsx     (new)
src/components/carrier-resources/CarrierPlansTab.tsx (new)
src/lib/zipToCounty.ts                      (move from PlanFinderPage)
```

### Files to Modify
```
src/pages/CarrierResourcesPage.tsx          (add tabs, integrate plans)
src/hooks/useCmsPlans.ts                    (add usePlansByCarrier hook)
src/pages/admin/PlanFinderPage.tsx          (import extracted components)
```

### Files to Potentially Remove
```
src/pages/CarrierPlansPage.tsx              (replace with live CMS data)
```

---

## 8. ASCII Wireframe: Final Design

```
+========================================================================+
| TIG | Agent Portal                           Austin Tyler  [●]         |
+========================================================================+
| ← Back to Dashboard                                                    |
| Carrier Resources                                   State: [Kentucky ▼]|
+------------------------------------------------------------------------+
|            |                                                           |
|  CARRIERS  |   [■ Contacts]  [Plans]  [Documents]                     |
|            |   ─────────────────────────────────────────────────────── |
| ┌────────┐ |                                                           |
| │ Aetna  │ |   CONTACTS                                               |
| └────────┘ |   ┌──────────────────────────────────────────────────┐   |
| ┌────────┐ |   │ John Smith      Jane Doe       Mike Wilson       │   |
| │ Anthem │ |   │ Sales Manager   Support        Territory Mgr     │   |
| └────────┘ |   │ Louisville      Kentucky       Western KY        │   |
| ┌────────┐ |   │ 502-555-1234    800-555-5678   270-555-9999      │   |
| │Devoted │ |   │ john@aetna.com  jane@aetna.com mike@aetna.com    │   |
| └────────┘ |   └──────────────────────────────────────────────────┘   |
| ┌────────┐ |                                                           |
| │ Humana │ |   PORTALS & LINKS                   QUICK DOWNLOADS      |
| └────────┘ |   ┌─────────────────────┐           ┌─────────────────┐  |
| ┌────────┐ |   │ ↗ Aetna Producer... │           │ ↓ 2026 Comp...  │  |
| │  UHC   │ |   │ ↗ Commission Port...│           │ ↓ Marketing...  │  |
| └────────┘ |   │ ↗ Certification...  │           │ ↓ Training...   │  |
| ┌────────┐ |   └─────────────────────┘           └─────────────────┘  |
| │Wellcare│ |                                                           |
| └────────┘ |                                                           |
|            |                                                           |
+------------------------------------------------------------------------+
| Powered by Tyler Insurance Group                                       |
+========================================================================+

When "Plans" tab is selected:
+------------------------------------------------------------------------+
|            |   [Contacts]  [■ Plans]  [Documents]                      |
|            |   ─────────────────────────────────────────────────────── |
|  CARRIERS  |                                                           |
|            |   County: [Jefferson      ▼]    ZIP: [40202     ]        |
| ┌────────┐ |                                                           |
| │ Aetna ●│ |   Type: [All Types ▼]  Premium: [Any ▼]  □ SNP Only     |
| └────────┘ |   Sort by: [Premium ▼]                                   |
|            |   ─────────────────────────────────────────────────────── |
|            |   28 Aetna Plans in Jefferson County                     |
|            |                                                           |
|            |   ┌─────────────────────┐  ┌─────────────────────┐       |
|            |   │ Aetna Medicare      │  │ Aetna Medicare      │       |
|            |   │ [HMO]  ⭐⭐⭐⭐ 4.0    │  │ [PPO] [D-SNP] ⭐⭐⭐⭐⭐│       |
|            |   │ $0/mo               │  │ $29/mo              │       |
|            |   │ Deductible: $0      │  │ Deductible: $0      │       |
|            |   │ Max OOP: $3,400     │  │ Max OOP: $4,200     │       |
|            |   │ [Dental][Vision]    │  │ [Dental][Vision]    │       |
|            |   │ [Details] [Compare] │  │ [Details] [Compare] │       |
|            |   └─────────────────────┘  └─────────────────────┘       |
|            |                                                           |
+------------------------------------------------------------------------+
| Compare (2): Aetna Medicare Plus [×]  Aetna Medicare... [×] [Compare →]|
+========================================================================+
```

---

## Quick Reference: Key Code Snippets

### Filter CMS Plans by Carrier
```typescript
// In useCmsPlans hook - already supports carrierId filter
const { plans } = useCmsPlans({
  carrierId: 'uuid-of-carrier',
  year: 2026,
  stateCode: 'KY',
  countyFips: '21111'
});
```

### Get Carrier ID from Code
```typescript
// New utility needed
async function getCarrierIdByCode(code: string): Promise<string | null> {
  const { data } = await supabase
    .from('carriers')
    .select('id')
    .eq('code', code)
    .single();
  return data?.id || null;
}
```

### Current Agent Carriers with IDs
```typescript
// Extend useAgentCarriers to return carrier IDs
const { carriers } = useAgentCarriers();
// Returns: { code: 'aetna', name: 'Aetna', logo: '...', id?: 'uuid' }
```
