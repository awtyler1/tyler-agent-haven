# CMS Integration Strategy & Carrier Platform Analysis

**Last Updated:** January 29, 2026
**Purpose:** Strategic planning for Medicare Plan Finder enhancement and carrier data management

---

## Executive Summary

This document analyzes the current carrier and plan document infrastructure, identifies gaps compared to Sunfire and Connect4Insurance, and proposes unique value-add features that leverage direct CMS data integration. The goal is to create differentiated value for agents while streamlining multi-state expansion (starting with Nevada).

---

## Part 1: Current State Analysis

### 1.1 Carrier Data Architecture

**Two-Layer System Currently in Place:**

| Layer | Source | Purpose |
|-------|--------|---------|
| Static JSON (`carriersData.ts`) | Manual entry | Contacts, portals, plan PDFs, broker managers |
| Database Tables | Supabase migrations | Dynamic carrier resources, state filtering |

**Database Schema (carrier-related):**
```
carriers                 → Master carrier registry (10 carriers seeded)
carrier_contacts         → State-specific broker managers/support
carrier_links            → Portal URLs, certifications, resources
carrier_documents        → PDFs, guides, forms (by year)
state_carriers           → Which carriers operate in which states
agent_certifications     → RTS certification tracking
carrier_statuses         → Agent-carrier appointment status
```

**Current Kentucky Carriers (6 active):**
- Aetna, Anthem, Devoted Health, Humana, UnitedHealthcare, Wellcare

**Nevada Carriers (seeded but not populated):**
- Alignment, Aetna (MS), Aetna (MA), Anthem, Humana, SCAN, SelectHealth, UHC, Wellcare

### 1.2 Plan Document Management

**Current Approach:**
- PDFs stored in `/downloads/` directory
- Static references in `carriersData.ts`
- Manual document naming: `{Carrier}_{PlanName}_{ContractID}_{DocType}_{Year}.pdf`

**Document Types per Plan:**
| Type | Description | Example |
|------|-------------|---------|
| SOB | Summary of Benefits | `Aetna_Medicare_Signature_Extra_HMO-POS_H0628-007.pdf` |
| ANOC | Annual Notice of Changes | `..._ANOC_2026.pdf` |
| EOC | Evidence of Coverage | `..._EOC_2026.pdf` |
| Formulary | Drug formulary | `..._Formulary_2026.pdf` |

**Pain Points:**
1. Manual PDF uploads for 50+ plans per carrier per state
2. No automatic link to CMS contract IDs
3. No verification PDFs match actual CMS-approved plans
4. Scaling to Nevada requires duplicating manual effort

### 1.3 Medicare Plan Finder (New CMS Integration)

**What's Already Built:**

`src/data/kentucky-plans-2026.ts` - **153 Kentucky MA Plans** from CMS PBP data:
```typescript
interface MAPlan {
  id: string;                 // H0292-001
  contractId: string;         // H0292
  planId: string;             // 001
  organizationName: string;   // "Humana"
  planName: string;           // Full CMS name
  planType: 'HMO' | 'PPO' | 'PFFS' | 'HMO-POS' | 'Local PPO' | 'Regional PPO';
  snpType: 'D-SNP' | 'C-SNP' | 'I-SNP' | null;
  premium: number;
  deductible: number;
  moop: number;
  drugDeductible: number | null;
  starRating: number | null;
  benefits: PlanBenefits;     // 27 detailed fields
}
```

**Benefits Data Captured (27 fields):**
- Medical: PCP, specialist, inpatient, outpatient, ER, urgent care, telehealth
- Drugs: Tier 1-5 copays/coinsurance
- Dental: preventive, comprehensive, max coverage
- Vision: exam copay, eyewear allowance
- Hearing: exam copay, hearing aid allowance
- Supplemental: OTC, fitness, transportation, meals

**Components Built:**
- `PlanComparison.tsx` - Side-by-side comparison with "best value" highlighting
- `PlanFinderPage.tsx` - Admin plan finder with county/ZIP lookup
- County FIPS codes for all 120 Kentucky counties
- ZIP-to-county mapping

---

## Part 2: Competitive Analysis

### 2.1 What Sunfire Offers

| Feature | Description | Available to Agents |
|---------|-------------|---------------------|
| Multi-carrier quoting | Compare MA, PDP, Medigap, Ancillary | Yes (via FMO access) |
| Real-time CMS lookup | Verify eligibility and enrollment history | Yes |
| Electronic enrollment | Digital signatures, auto-submission to carriers | Yes |
| SOA documentation | Built-in Scope of Appointment | Yes |
| Call recording | Compliance for telesales | Yes |
| Provider/drug lookup | Network and formulary search | Yes |
| Integrated CRM | Save client preferences, notes | Yes |
| Side-by-side comparison | Up to 3 plans | Yes |

**Sunfire's Moat:**
- CMS contracted them for network data on Medicare Plan Finder
- 110+ carrier integrations
- End-to-end enrollment flow with carrier submission

### 2.2 What Connect4Insurance (formerly Connect4Medicare) Offers

| Feature | Description | Notes |
|---------|-------------|-------|
| Unified provider/pharmacy lookup | All carriers in one place | Eliminates logging into each carrier |
| Online enrollment via personal URL | Email link to prospect | Self-service enrollment |
| Enrollment reporting | Track completed/incomplete apps | Agent dashboard |
| Plan comparison | See all plans even if not contracted | Research capability |
| Drug formulary aggregation | Cross-carrier drug search | Single interface |

**Connect4Insurance's Position:**
- Created by same company that maintains Medicare.gov (Connecture)
- Now available on both Connecture AND Sunfire platforms
- Free to contracted agents via FMOs like Pinnacle

### 2.3 Gap Analysis - What They DON'T Do Well

| Gap | Description | Opportunity |
|-----|-------------|-------------|
| **Client-specific plan matching** | No deep health needs assessment | AI-driven plan recommendation |
| **Book of business intelligence** | No proactive retention alerts | "At-risk" client detection |
| **Local market context** | Generic national view | County-level competitive insights |
| **Training integration** | Separate from quoting tools | Contextual learning |
| **Production tracking** | No sync with AOR data | Already have Smart Sync |
| **Broker manager access** | Contact info buried | First-class directory |
| **Plan change year-over-year** | Manual comparison | Automated delta reports |
| **Non-commissionable tracking** | Easy to miss | Flagged in comparison |

---

## Part 3: Unique Value Propositions

### 3.1 "Agent's Competitive Edge" - Features Neither Platform Offers

**1. County-Level Market Intelligence**
```
What: Dashboard showing which carriers dominate each county, enrollment trends,
      plan availability gaps, and competitive positioning
Why:  Agents can strategically focus on underserved markets
Data: CMS enrollment data + PBP service areas
```

**2. Plan Change Alert System (Year-over-Year)**
```
What: Auto-detect benefit changes, premium changes, and plan terminations
      for clients in your book of business
Why:  Proactive AEP preparation, client retention
Data: Compare 2025 vs 2026 PBP data, match to BOB
```

**3. "Best Fit" Recommendation Engine**
```
What: Input client's health profile (conditions, drugs, doctors) → get ranked plans
Why:  Personalized recommendations vs generic comparison
Data: CMS PBP benefits + formulary + network data
```

**4. Non-Commissionable Plan Awareness**
```
What: Real-time flagging of non-commissionable plans in comparison
Why:  Avoid quoting plans that don't pay commission
Data: Carrier commission schedules (manual + RTS data)
```

**5. Retention Risk Dashboard**
```
What: Flag clients whose plans have significant negative changes
Why:  Contact at-risk clients before they switch to another agent
Data: BOB + plan change delta + client contact info
```

**6. First-Year vs Renewal Commission Calculator**
```
What: Show commission implications when comparing plans
Why:  Help agents understand financial impact of recommendations
Data: CMS max commission rates + carrier-specific rates
```

### 3.2 Features That Complement (Not Replace) Sunfire/C4I

The goal is NOT to replace enrollment platforms. Instead:

| TIG Platform Does | Sunfire/C4I Does |
|-------------------|------------------|
| Pre-enrollment intelligence | Enrollment processing |
| Client relationship management | Carrier submission |
| Market analysis | Compliance documentation |
| Training & certification tracking | SOA/call recording |
| Production tracking (Smart Sync) | Application status |
| Broker manager directory | Plan quoting |

**Value Statement:**
"Use TIG for strategy and client intelligence. Use Sunfire for enrollment execution."

---

## Part 4: CMS Data Sources & Integration

### 4.1 Available CMS Public Data

| Dataset | URL | Format | Contents |
|---------|-----|--------|----------|
| PBP Benefits 2026 | cms.gov/benefits-data/pbp-benefits-2026 | ZIP (JSON, Excel, HTML) | All MA/Part D benefits |
| Service Area Data | MA/Part D enrollment data | CSV | County-level plan availability |
| Enrollment Data | Monthly files | CSV | Plan enrollment counts |
| Star Ratings | Star ratings data | CSV | Quality ratings by contract |
| Formulary Data | Formulary reference file | ZIP | Drug coverage by plan |
| Provider Network | Via SunFire (CMS contracted) | API | In-network providers |

### 4.2 PBP Benefits Data Structure (JSON)

The 2026 PBP data includes:
```
- Plan identification (contract ID, plan ID, segment ID)
- Organization info (legal name, marketing name)
- Plan type (HMO, PPO, PFFS, etc.)
- SNP type (D-SNP, C-SNP, I-SNP)
- Premiums (monthly, annual)
- Deductibles (medical, drug)
- MOOP (in-network, combined)
- Cost sharing for 100+ benefit categories
- Supplemental benefits (dental, vision, hearing, OTC, etc.)
- Service area (county FIPS codes)
```

### 4.3 Data Refresh Cadence

| Data Type | When Updated | Action Required |
|-----------|--------------|-----------------|
| PBP Benefits | Quarterly (Q1-Q4) | Re-parse and update TypeScript file |
| Service Areas | With PBP | Update county mappings |
| Star Ratings | October (before AEP) | Annual update |
| Enrollment | Monthly | Optional - for market intelligence |
| Formulary | Quarterly | For drug lookup feature |

---

## Part 5: Kentucky Carrier Rebuild Plan

### 5.1 Current State Issues

1. **Inconsistent Contract IDs:** `carriersData.ts` uses marketing names, CMS data uses contract IDs
2. **Missing Plans:** Only 11 Aetna plans in static data, CMS shows more
3. **No Programmatic Link:** Can't auto-match PDFs to CMS plans
4. **Manual Updates:** Every year requires re-uploading 100+ documents

### 5.2 Proposed Data Model

**New Schema: `cms_plans` table**
```sql
CREATE TABLE cms_plans (
  id UUID PRIMARY KEY,
  contract_id TEXT NOT NULL,        -- H0292
  plan_id TEXT NOT NULL,            -- 001
  segment_id TEXT,                  -- Optional

  -- Organization
  organization_name TEXT,           -- "Humana Insurance Company"
  marketing_name TEXT,              -- "Humana Gold Plus"
  carrier_id UUID REFERENCES carriers(id),  -- Link to internal carrier

  -- Plan Classification
  plan_type TEXT,                   -- HMO, PPO, etc.
  snp_type TEXT,                    -- D-SNP, C-SNP, I-SNP, null

  -- Costs
  monthly_premium DECIMAL,
  annual_deductible DECIMAL,
  drug_deductible DECIMAL,
  moop_in_network DECIMAL,
  moop_combined DECIMAL,

  -- Benefits (JSONB for flexibility)
  medical_benefits JSONB,           -- PCP, specialist, hospital, etc.
  drug_benefits JSONB,              -- Tier 1-5
  supplemental_benefits JSONB,      -- Dental, vision, hearing, OTC

  -- Metadata
  star_rating DECIMAL,
  year INT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  cms_data_version TEXT,            -- Track which PBP release

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(contract_id, plan_id, segment_id, year)
);
```

**New Schema: `cms_service_areas` table**
```sql
CREATE TABLE cms_service_areas (
  id UUID PRIMARY KEY,
  contract_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  state_code CHAR(2) NOT NULL,
  county_fips TEXT NOT NULL,
  county_name TEXT,
  year INT NOT NULL,

  UNIQUE(contract_id, plan_id, county_fips, year)
);
```

**New Schema: `plan_documents` table**
```sql
CREATE TABLE plan_documents (
  id UUID PRIMARY KEY,
  cms_plan_id UUID REFERENCES cms_plans(id),
  document_type TEXT NOT NULL,      -- SOB, ANOC, EOC, Formulary
  file_path TEXT,                   -- Supabase storage or URL
  source_url TEXT,                  -- Original carrier URL if external
  year INT NOT NULL,
  is_verified BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(cms_plan_id, document_type, year)
);
```

### 5.3 Kentucky Rebuild Checklist

- [ ] **Parse CMS PBP 2026 data** → Populate `cms_plans` table
- [ ] **Map contract IDs to carriers** → Link `carrier_id` foreign key
- [ ] **Import service areas** → Populate `cms_service_areas` for KY counties
- [ ] **Migrate existing PDFs** → Create `plan_documents` records
- [ ] **Build admin UI** → Manage documents, verify CMS matches
- [ ] **Update Plan Finder** → Query database instead of static file
- [ ] **Add year-over-year comparison** → Compare 2025 vs 2026 data

### 5.4 Data Validation

**Matching CMS to Internal Carriers:**
```typescript
const CMS_TO_CARRIER_MAP = {
  'Humana Insurance Company': 'humana',
  'Aetna Health Inc': 'aetna',
  'Anthem Blue Cross and Blue Shield': 'anthem',
  'UnitedHealthcare Insurance Company': 'uhc',
  'Devoted Health Plan': 'devoted',
  'WellCare Health Plans': 'wellcare',
  // Add more as needed
};
```

---

## Part 6: Nevada Expansion Efficiency

### 6.1 Current Nevada State in Database

From `state_carriers` migration:
```sql
-- NV carriers (alignment, aetna_ms, aetna_ma, anthem, humana, scan, selecthealth, uhc, wellcare)
```

### 6.2 Nevada-Specific Carriers

| Carrier | Contract IDs (Likely) | Notes |
|---------|----------------------|-------|
| Alignment Health | H5410 | CA/NV regional |
| SCAN Health | H5425 | CA/NV regional |
| SelectHealth | H1994 | UT/ID/NV regional |

### 6.3 Streamlined Nevada Setup

**With CMS Integration:**
1. Download PBP 2026 data
2. Filter by Nevada service areas
3. Auto-populate `cms_plans` for NV
4. Map to internal carriers
5. Only manual step: verify broker manager contacts

**Time Savings:**
- Current approach: 2-3 weeks manual data entry
- CMS approach: 2-3 days (mostly document verification)

---

## Part 7: Implementation Roadmap

### Phase 1: Database Foundation (Week 1)
- [ ] Create `cms_plans`, `cms_service_areas`, `plan_documents` tables
- [ ] Build CMS data parser (Node.js script or Edge Function)
- [ ] Import Kentucky 2026 PBP data
- [ ] Map CMS organizations to internal carrier IDs

### Phase 2: Admin Tooling (Week 2)
- [ ] Admin UI for plan management
- [ ] Bulk document upload with CMS plan matching
- [ ] Verification workflow (is document for correct plan?)
- [ ] Year selector (2025, 2026, 2027...)

### Phase 3: Agent-Facing Features (Week 3-4)
- [ ] Enhanced Plan Finder (database-backed)
- [ ] County/ZIP plan availability
- [ ] Side-by-side comparison (already built, connect to DB)
- [ ] Plan details page with document links

### Phase 4: Intelligence Features (Week 5-6)
- [ ] Year-over-year plan change detection
- [ ] BOB integration (flag at-risk clients)
- [ ] County market share dashboard
- [ ] Recommendation engine (v1 - rule-based)

### Phase 5: Nevada Expansion (Week 7)
- [ ] Import Nevada CMS data
- [ ] Add NV broker manager contacts
- [ ] Verify/upload NV plan documents
- [ ] Enable NV in state selector

---

## Part 8: Technical Considerations

### 8.1 CMS Data Parsing

**PBP Benefits ZIP Structure:**
```
pbp-benefits-2026.zip
├── Benefits/
│   ├── pbp_benefits_[date].json
│   └── pbp_benefits_[date].xlsx
├── ServiceArea/
│   └── service_area_[date].csv
└── README.txt
```

**Parser Pseudocode:**
```typescript
async function importCMSData(year: number, state?: string) {
  // 1. Download and extract PBP ZIP
  const zip = await downloadCMSData(year);

  // 2. Parse benefits JSON
  const benefits = await parseJSON(zip.getFile('Benefits/*.json'));

  // 3. Parse service areas
  const serviceAreas = await parseCSV(zip.getFile('ServiceArea/*.csv'));

  // 4. Filter by state if specified
  const statePlans = state
    ? filterByState(benefits, serviceAreas, state)
    : benefits;

  // 5. Upsert to database
  await upsertPlans(statePlans);
  await upsertServiceAreas(serviceAreas);
}
```

### 8.2 Edge Function for CMS Import

**Recommended Architecture:**
```
supabase/functions/import-cms-data/
├── index.ts          # Main handler
├── parser.ts         # PBP JSON/CSV parsing
├── mapper.ts         # CMS org → internal carrier mapping
└── storage.ts        # Download/cache CMS files
```

### 8.3 Performance Considerations

- **Static File vs Database:** 153 plans = fast static file. 1000+ plans (multi-state) = database preferred
- **County Lookup:** Index on `(state_code, county_fips)` for fast queries
- **Caching:** Cache plan lists by state/county for 24 hours

---

## Part 9: Missing Data to Add

### 9.1 Additional CMS Data Not Yet Used

| Data | Source | Use Case |
|------|--------|----------|
| Star Ratings | CMS Star Ratings file | Quality comparison |
| Enrollment Counts | Monthly enrollment | Market share analysis |
| Formulary Files | CMS formulary data | Drug lookup |
| Network Adequacy | CMS network data | Provider search |
| Special Needs Plan Details | SNP-specific files | D-SNP/C-SNP marketing |

### 9.2 Carrier-Specific Data to Track

| Data Point | Source | Benefit |
|------------|--------|---------|
| Commission rates | Carrier schedules | Comp calculator |
| Non-commissionable plans | Carrier bulletins | Avoid unpaid quotes |
| Certification requirements | Carrier portals | Onboarding workflow |
| Kit ordering links | Carrier marketing | Quick access |
| Scope of Appointment forms | Carrier sites | Compliance |

### 9.3 Agent-Specific Data to Leverage

| Data Point | Source | Feature |
|------------|--------|---------|
| Certifications by carrier | `agent_certifications` | Filter available plans |
| Book of Business | `monthly_syncs` | Client plan matching |
| Contracted carriers | `carrier_statuses` | Commission eligibility |

---

## Part 10: Success Metrics

### 10.1 Agent Value Metrics
- Time saved on plan research (target: 50% reduction)
- AEP preparation efficiency (target: find at-risk clients in minutes)
- Quote accuracy (target: 100% match to CMS data)

### 10.2 Platform Metrics
- Plans in database vs CMS total (target: 100%)
- Document coverage (target: SOB for 90% of plans)
- Data freshness (target: within 1 week of CMS release)

### 10.3 Expansion Metrics
- Time to add new state (target: < 1 week with CMS integration)
- Manual data entry required (target: contacts only)

---

## Appendix A: CMS Data Resources

- **PBP Benefits Download:** https://www.cms.gov/data-research/statistics-trends-and-reports/medicare-advantagepart-d-contract-and-enrollment-data/benefits-data/pbp-benefits-2026
- **MA/Part D Contract Data:** https://www.cms.gov/data-research/statistics-trends-and-reports/medicare-advantagepart-d-contract-and-enrollment-data
- **Star Ratings:** https://www.cms.gov/medicare/quality/star-ratings
- **Formulary Reference File:** https://www.cms.gov/medicare/prescription-drug-coverage/prescriptiondrugcovcontra/formulary-reference-file

## Appendix B: Competitive Platform References

- **Sunfire:** https://www.sunfireinc.com
- **Connect4Insurance:** https://pfsinsurance.com/services/connect4medicare
- **Connecture (DrxPlan):** https://www.connecture.com

---

## Next Steps

1. **Immediate:** Finalize database schema for `cms_plans`
2. **This Week:** Build CMS data parser script
3. **Next Week:** Populate Kentucky 2026 data
4. **Following Week:** Build admin document management UI
5. **Month End:** Launch enhanced Plan Finder to agents

---

*Document prepared for TIG Agent Platform strategic planning*
