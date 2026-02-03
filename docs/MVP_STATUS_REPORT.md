# MVP Status Report - Friday Deadline
**Generated:** February 2, 2026
**Purpose:** Comprehensive codebase analysis for MVP deadline assessment

---

## Executive Summary

| Area | Status | Readiness |
|------|--------|-----------|
| Database Schema | **COMPLETE** | Production-ready tables for agents, clients, policies, plans |
| CMS Data Integration | **COMPLETE** | 153 KY plans with full benefits, star ratings, service areas |
| Agent Dashboard | **COMPLETE** | Beacon-style BoB tracker with sync flow |
| Carrier Resources | **COMPLETE** | Contacts, portals, documents with cert filtering |
| Import Functionality | **COMPLETE** | Full CSV/XLSX pipeline with carrier detection |

**Overall Assessment:** Core infrastructure is production-ready. All major components exist and are functional.

---

## 1. Database Schema (Supabase)

### What Exists ✅

#### Agent/Client Tables
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `profiles` | Agent records | id, user_id, email, npn, manager_id, onboarding_status |
| `clients` | Agent's book of business | profile_id, medicare_number, name, dob, address, phone |
| `policies` | Client enrollments | client_id, carrier_id, plan_name, plan_type, effective_date, status |
| `user_roles` | RBAC (5 levels) | user_id, role (super_admin → independent_agent) |

#### Production Tracking Tables
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `production_uploads` | Upload audit trail | profile_id, carrier_id, file_name, stats |
| `monthly_syncs` | Monthly sync records | profile_id, month, total_clients, new_clients |
| `sync_carrier_uploads` | Per-carrier breakdown | sync_id, carrier_id, client_count, new_clients |
| `milestones` | Achievement records | profile_id, milestone_type, milestone_value, achieved_at |

#### Carrier & Certification Tables
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `carriers` | Carrier master data | code, name, rts_aliases, cms_aliases, product_tags |
| `agent_carriers` | Selected carriers for tracking | profile_id, carrier_id |
| `agent_certifications` | RTS certifications | profile_id, carrier_name, product_type, year |
| `carrier_statuses` | Contracting workflow status | user_id, carrier_id, contracting_status |

#### CMS Plan Tables
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `cms_plans` | Medicare Advantage plans | contract_id, plan_id, benefits (40+ columns), star_rating |
| `cms_service_areas` | County-level coverage | cms_plan_id, county_fips, state_code, year |
| `plan_documents` | SOB, EOC, Formulary | cms_plan_id, document_type, file_path, external_url |
| `commission_rates` | CMS commission schedules | year, plan_type, rate_type, amount |

### Key Relationships
```
profiles (agent)
  ├─→ clients (their book of business)
  │    └─→ policies (one per carrier per client)
  ├─→ agent_certifications (which carriers they can sell)
  ├─→ monthly_syncs → sync_carrier_uploads → milestones
  └─→ production_uploads (carrier report files)
```

### Unique Constraints
- `clients`: (profile_id, medicare_number) - one Medicare # per agent
- `policies`: (client_id, carrier_id) - one policy per carrier per client
- `cms_plans`: (contract_id, plan_id, segment_id, year)

### RLS Policies
- Agents see only their own clients, policies, syncs
- Admins see all data
- CMS plans are publicly readable (authenticated users)

---

## 2. CMS Data Integration

### What Exists ✅

#### Data Storage
- **Database:** `cms_plans` table with 153 Kentucky MA plans
- **Service Areas:** 11,165 county-plan mappings in `cms_service_areas`
- **Static Source:** `src/data/kentucky-plans-2026.ts` (CMS PBP 2026 data)

#### Available Plan Fields

**Cost Fields:**
- `monthly_premium`, `annual_deductible`, `drug_deductible`
- `moop_in_network`, `moop_combined`

**Medical Benefits (TEXT for CMS notation):**
- `pcp_copay`, `specialist_copay`, `er_copay`, `urgent_care_copay`
- `inpatient_copay`, `outpatient_copay`, `telehealth_copay`

**Drug Tiers:**
- `drug_tier1` through `drug_tier5`

**Supplemental Benefits:**
- **Dental:** `dental_preventive`, `dental_comprehensive`, `dental_max_coverage`
- **Vision:** `vision_exam_copay`, `vision_allowance`
- **Hearing:** `hearing_exam_copay`, `hearing_aid_allowance`
- **Other:** `otc_allowance`, `fitness_benefit`, `transportation_trips`, `meal_benefit`

**Quality & Classification:**
- `star_rating` (1.0-5.0 CMS rating)
- `plan_type` (HMO, PPO, PFFS, etc.)
- `snp_type` (D-SNP, C-SNP, I-SNP)
- `is_commissionable`

#### React Hooks (`src/hooks/useCmsPlans.ts`)
| Hook | Purpose |
|------|---------|
| `useCmsPlans(filters)` | Query plans with multiple filters |
| `usePlansByCounty(state, fips, year)` | Plans for specific county |
| `useCmsCounties(state, year)` | Get counties from service areas |
| `usePlanById(id)` | Single plan lookup |
| `useFilteredPlans(plans, options)` | Client-side filtering/sorting |

#### UI Components (`src/components/medicare/`)
| Component | Purpose |
|-----------|---------|
| `PlanDetailModal.tsx` | Full plan details with 8 collapsible sections |
| `PlanComparison.tsx` | Side-by-side comparison (up to 4 plans) |
| Star rating display | 1-5 filled/unfilled stars |

#### Admin Page (`src/pages/admin/PlanFinderPage.tsx`)
- ZIP code → county FIPS lookup (Kentucky)
- Plan search with filters (type, premium, SNP)
- Plan cards with quick view/compare
- Print functionality for comparisons

### File Locations
```
src/types/cms.ts                          # TypeScript interfaces
src/hooks/useCmsPlans.ts                  # Data hooks
src/components/medicare/PlanDetailModal.tsx
src/components/medicare/PlanComparison.tsx
src/pages/admin/PlanFinderPage.tsx
src/data/kentucky-plans-2026.ts           # Static data (153 plans)
scripts/migrate-kentucky-plans.ts         # Import script
```

---

## 3. Agent Dashboard (Current State)

### What Exists ✅

#### Main Dashboard (`src/pages/Index.tsx`)
A **beacon-style book of business tracker** with three core states:

**Primary Display ("The Beacon"):**
- Giant client count (10rem font)
- New clients this month badge (+X this month)
- Growth streak indicator (X mo streak)
- Carrier breakdown pills with color coding
- Milestone progress card with animated bar

**Quick Actions Panel (right sidebar):**
- Sync Book / Sync Now (highlighted when stale)
- Carrier Resources
- Forms Library
- Quick Quote
- Certifications

**States:**
- **Empty:** CTA to start first sync
- **Momentum:** Shows growth metrics
- **Stale:** Amber banner prompting sync

#### Sync Flow (`src/pages/SyncFlow.tsx`)
4-phase wizard:
1. **SELECT:** Choose carriers (first-time users)
2. **CONFIRM:** Summary of previous carriers (returning users)
3. **UPLOAD:** Per-carrier file upload with validation
4. **DONE:** Success screen with stats

**Features:**
- Carrier auto-detection from file headers
- Mismatch warnings and recovery
- New client detection by effective_date
- Support for CSV/XLSX

#### Dashboard Data Hook (`src/hooks/useDashboardData.ts`)
Computes:
- Total clients, new this month, growth streak
- Carrier breakdown from sync_carrier_uploads
- Milestone tracking (10, 25, 50, 100... 1000)
- Sync status (synced/stale/never)
- Best month, projected milestone date

#### Supporting Components
| Component | Purpose |
|-----------|---------|
| `SyncStatusPill.tsx` | Dropdown showing sync health |
| `NextGoalCard.tsx` | Milestone progress with animation |
| `EmptyState.tsx` | Fallback when no syncs exist |

### Agent-Accessible Pages
| Page | Route | Purpose |
|------|-------|---------|
| Dashboard | `/` | Book of business beacon |
| Sync Flow | `/sync` | Production report upload |
| Contracting Hub | `/contracting-hub` | Certification status |
| Carrier Resources | `/carrier-resources` | Contacts, portals, docs |
| Forms Library | `/forms-library` | SOA, enrollment forms |
| Training | `/training` | Video library |
| My Profile | `/my-profile` | Profile management |

---

## 4. Carrier Resource Page

### What Exists ✅

#### CarrierResourcesPage (`src/pages/CarrierResourcesPage.tsx`)
**Layout:** Left sidebar (carrier list) + Right content (3 sections)

**Sections:**
1. **Contacts Card** - 4-column grid: name, title, phone, email
2. **Portals & Links** - External links with descriptions
3. **Quick Downloads** - Document downloads

**Filtering:**
- State selector (Kentucky only for MVP)
- Carriers filtered by agent's `agent_certifications`

**Data Sources:**
- `carrier_contacts` table
- `carrier_links` table
- `carrier_documents` table

#### CarrierPlansPage (`src/pages/CarrierPlansPage.tsx`)
- Static plan document library by carrier
- Year selector (2026, 2027 disabled)
- Accordion per plan type
- Documents: SOB, EOC, ANOC, Formulary

#### CarrierPortalsPage (`src/pages/CarrierPortalsPage.tsx`)
- Quick-access grid to broker portals
- 6 supported carriers
- State-filtered portal links

### ZIP Code Filtering
**Implemented in:** `PlanFinderPage.tsx`
- Hardcoded `ZIP_TO_COUNTY` mapping (12 KY areas)
- 3-digit prefix lookup
- Defaults to Jefferson County if not found

**Covered Areas:**
- 400-402: Louisville (Jefferson)
- 403-405: Lexington (Fayette)
- 410-411: Northern KY (Kenton)
- 421: Bowling Green (Warren)
- Plus 5 more regions

### Agent Certification Filtering (`useAgentCarriers` hook)
```
agent_certifications → carrier_name → RTS alias mapping → filtered carrier list
```

Fallback: All carriers if no certifications found

---

## 5. Import Functionality

### What Exists ✅

#### Complete CSV/XLSX Upload Pipeline

**Upload Context** (`src/contexts/UploadContext.tsx`)
- Global state management for uploads
- Multi-stage progress: idle → reading → processing → saving → complete
- Background persistence (survives modal close)
- Stats tracking: imported, updated, skipped, total

**Upload Modal** (`src/components/book-of-business/UploadModal.tsx`)
- Two-step workflow: select carrier → upload file
- Drag-and-drop with validation
- Carrier auto-detection from headers
- Mismatch warnings with recovery
- Success state with stats display

**File Drop Zone** (`src/components/contracting/FileDropZone.tsx`)
- Reusable drag-and-drop component
- Supports: .pdf, .csv, .xlsx
- Upload/uploaded/error states
- Configurable accept types

**Carrier Detection** (`src/lib/carrier-detection.ts`)
- Automatic file-to-carrier matching
- Header signature scoring (unique cols = 2pts, required = 1pt)
- Supported: Aetna (CSV), Humana (XLSX), WellCare (CSV), Anthem (CSV)

**Production Report Parser** (`supabase/functions/parse-production-report/index.ts`)
- Server-side CSV/XLSX parsing
- Carrier-specific format handling
- Date normalization (YYYY-MM-DD, MM/DD/YYYY, Excel serial)
- Phone/name normalization
- Batch operations (500-row chunks)
- Stats returned: total, imported, updated, skipped

**RTS Import System** (`src/lib/rtsImport.ts`)
- Pinnacle Excel certification import
- NPN-based agent matching
- Profile creation for new agents
- Certification upsert with products

#### Progress Indicators
| Component | Purpose |
|-----------|---------|
| `UploadProgressAnimated.tsx` | 3-stage pipeline visualization |
| `GlobalUploadIndicator.tsx` | Floating bottom-right indicator |

### Database Tables for Imports
- `clients` - Agent's clients (unique by medicare_number per agent)
- `policies` - Enrollments (unique by client + carrier)
- `production_uploads` - Audit trail with stats

### Reusable Patterns
1. UploadContext for state management
2. UploadModal as template component
3. FileDropZone for file input
4. Edge function pattern for parsing
5. Batch processing in 500-row chunks
6. Base64 encoding for client → server

---

## Summary: What's Ready vs. What's Missing

### COMPLETE ✅ (Production-Ready)

| Feature | Files |
|---------|-------|
| Agent/client/policy database schema | 67 migrations |
| CMS plan data (153 KY plans) | `cms_plans`, `cms_service_areas` |
| Agent dashboard with BoB beacon | `Index.tsx`, `useDashboardData.ts` |
| Production sync flow | `SyncFlow.tsx`, `UploadModal.tsx` |
| Carrier resource pages | `CarrierResourcesPage.tsx`, `CarrierPlansPage.tsx` |
| CSV/XLSX import pipeline | Edge function + carrier detection |
| Plan finder with comparison | `PlanFinderPage.tsx`, `PlanComparison.tsx` |
| Agent certification filtering | `useAgentCarriers` hook |
| Milestone tracking | `milestones` table + `NextGoalCard.tsx` |

### PARTIALLY BUILT ⚠️ (Needs Work)

| Feature | Status | What's Needed |
|---------|--------|---------------|
| ZIP code filtering | 12 KY areas only | Expand to full state or add API |
| State support | Kentucky only | Add additional states to CMS data |
| Plan Finder access | Admin-only | Consider agent access |
| Commission projections | Schema exists | UI not built |

### MISSING ENTIRELY ❌

| Feature | Notes |
|---------|-------|
| Multi-state CMS data | Only KY loaded (153 plans) |
| Industry Updates page | Placeholder noted in CLAUDE.md |
| Token encryption | Microsoft OAuth tokens unencrypted |
| Generic BoB import | CSV template for non-carrier imports |

---

## File Reference Quick Index

### Database
```
supabase/migrations/20260121000000_create_production_tables.sql  # clients, policies
supabase/migrations/20260122000000_add_sync_tables.sql           # syncs, milestones
supabase/migrations/20260129000000_cms_plans_integration.sql     # CMS plans
src/integrations/supabase/types.ts                               # TypeScript types
```

### CMS Integration
```
src/types/cms.ts                          # CmsPlan interfaces
src/hooks/useCmsPlans.ts                  # Query hooks
src/components/medicare/PlanDetailModal.tsx
src/components/medicare/PlanComparison.tsx
src/pages/admin/PlanFinderPage.tsx
src/data/kentucky-plans-2026.ts           # 153 plans
```

### Dashboard
```
src/pages/Index.tsx                       # Main dashboard
src/hooks/useDashboardData.ts             # Dashboard data
src/pages/SyncFlow.tsx                    # Sync wizard
src/components/dashboard/SyncStatusPill.tsx
src/components/dashboard/NextGoalCard.tsx
```

### Carrier Resources
```
src/pages/CarrierResourcesPage.tsx
src/pages/CarrierPlansPage.tsx
src/pages/CarrierPortalsPage.tsx
src/hooks/useCarrierDirectory.ts
```

### Import System
```
src/contexts/UploadContext.tsx            # Upload state
src/components/book-of-business/UploadModal.tsx
src/components/contracting/FileDropZone.tsx
src/lib/carrier-detection.ts             # Auto-detect carrier
src/lib/rtsImport.ts                     # Pinnacle import
supabase/functions/parse-production-report/index.ts
```

---

## Recommendations for Friday

1. **If adding states:** Priority is expanding `cms_plans` data beyond KY
2. **If improving UX:** Consider opening Plan Finder to agents (currently admin-only)
3. **If shipping MVP:** Current KY-focused feature set is complete and functional
4. **If adding commission tracking:** Schema exists, need UI components

**Bottom Line:** The core MVP infrastructure is production-ready. All major workflows (onboarding, contracting, sync, resources, plan lookup) are functional.
