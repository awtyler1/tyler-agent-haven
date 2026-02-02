# CMS Landscape Data Mapping Guide

**Purpose:** Map CMS Landscape 2026 file to `cms_plans` database table
**Data Source:** `cy2026_landscape_202511.zip` from CMS
**Last Updated:** 2026-01-29

---

## 1. File Structure

```
cy2026_landscape_202511.zip/
├── CY2026_Landscape_202511.csv      # 79MB - Main data file (comma-delimited)
├── CY2026_Landscape_202511.xlsb     # 10MB - Excel binary (same data)
└── CY2026_Landscape_ReadMe.txt      # Column definitions & notes
```

**Total rows:** 138,343 (header + 138,342 data rows)
**Kentucky rows:** 6,789

**Key insight:** One row per plan **per county**. The same plan appears multiple times (once for each county in its service area).

---

## 2. All 52 Column Headers

| # | Column Name | Notes |
|---|-------------|-------|
| 1 | Contract Year | `2026` |
| 2 | Contract Category Type | `MA`, `MA-PD`, `SNP`, `PDP` |
| 3 | US Territory | `No` for states |
| 4 | State Territory Abbreviation | `KY`, `OH`, etc. |
| 5 | State Territory Name | `Kentucky` |
| 6 | County Name | `Jefferson`, `Boone`, etc. |
| 7 | Contract ID | `H1036`, `H5216` |
| 8 | Plan ID | `001`, `320` (padded to 3 digits) |
| 9 | Segment ID | `0`, `2` |
| 10 | ContractPlanID | `H1036_320` |
| 11 | ContractPlanSegmentID | `H1036_320_0` |
| 12 | Sanctioned Plan | `Yes`/`No` |
| 13 | Parent Organization Name | `Humana Inc.`, `Centene Corporation` |
| 14 | Contract Name | `HUMANA MEDICAL PLAN, INC.` |
| 15 | Organization Marketing Name | `Humana`, `Wellcare` |
| 16 | Organization Type | `Local CCP` |
| 17 | Plan Name | `Humana Gold Plus SNP-DE H1036-320 (HMO D-SNP)` |
| 18 | Plan Type | `HMO`, `PPO`, `HMO D-SNP`, `PPO D-SNP`, `HMO I-SNP` |
| 19 | Special Needs Plan (SNP) Indicator | `Yes`/`No` |
| 20 | SNP Type | `Dual-Eligible`, `Institutional`, `Not Applicable` |
| 21 | SNP Institutional Type | `Facility-based Institutional (FI-SNP)`, etc. |
| 22 | SNP Institutional Category | `FI-SNP`, `IE-SNP`, `HI-SNP` |
| 23 | Dual Eligible SNP Integration Status | `HIDE`, `FIDE`, `CO`, `Not Applicable` |
| 24 | D-SNP AIP Identifier | `Yes`/`No`/`Not Applicable` |
| 25 | C-SNP Condition Type | Condition name or `Not Applicable` |
| 26 | Medicare Zero-Dollar Cost Sharing D-SNP | `Yes`/`No`/`Not Applicable` |
| 27 | Part D Coverage Indicator | `Yes`/`No` |
| 28 | National PDP | `Yes`/`No`/`Not Applicable` |
| 29 | Drug Benefit Category | `Basic`, `Enhanced`, `Not Applicable` |
| 30 | Drug Benefit Type | `Defined Standard`, `Basic Alternative`, `Enhanced Alternative` |
| 31 | Voluntary De Minimis Program | `Yes`/`No` |
| 32 | Part D Basic Premium At/Below Benchmark | `Yes`/`No`/`Not Applicable` |
| 33 | LIS Auto Enrollment | `Yes`/`No`/`Not Applicable` |
| 34 | Offers Drug Tier with No Part D Deductible | `Yes`/`No`/`Not Applicable` |
| 35 | Annual Part D Deductible Amount | `$615.00 `, `$300.00 `, `Not Applicable` |
| 36 | Part D Basic Premium | `$38.40 `, `$0.00 `, `($20.80)` |
| 37 | Part D Supplemental Premium | `$0.00 `, `$20.80 ` |
| 38 | Part D Total Premium | `$38.40 `, `$0.00 ` |
| 39 | LIPS Amount | `$38.44 ` |
| 40 | Part D LIPS (CMS Pays) | `$38.40 `, `$0.00 ` |
| 41 | Part D Low Income Beneficiary Premium | `$0.00 `, `$5.60 ` |
| 42 | Part D OOP Threshold | `$2,100.00 ` |
| 43 | Part C Premium | `$0.00 `, `$16.00 `, `$32.00 ` |
| 44 | Monthly Consolidated Premium (C + D) | `$38.40 `, `$16.00 `, `Not Applicable` |
| 45 | In-Network MOOP Amount | `$9,250.00 `, `$6,550.00 `, `Not Applicable` |
| 46 | Part C Summary Star Rating | `4.0`, `3.5`, `2.5` |
| 47 | Part D Summary Star Rating | `4.0`, `3.5`, `3.0` |
| 48 | Overall Star Rating | `4.5`, `4.0`, `3.5` |
| 49 | MA Region Code | `13` (Indiana and Kentucky) |
| 50 | MA Region | `Indiana and Kentucky` |
| 51 | PDP Region Code | `Not Applicable` for MA plans |
| 52 | PDP Region | `Not Applicable` for MA plans |

---

## 3. Key Field Mapping to `cms_plans` Table

### Plan Identification

| Database Column | CSV Column # | CSV Column Name | Example |
|-----------------|--------------|-----------------|---------|
| `contract_id` | 7 | Contract ID | `H1036` |
| `plan_id` | 8 | Plan ID | `320` |
| `segment_id` | 9 | Segment ID | `0` |
| `organization_name` | 14 | Contract Name | `HUMANA MEDICAL PLAN, INC.` |
| `marketing_name` | 15 | Organization Marketing Name | `Humana` |
| `plan_name` | 17 | Plan Name | `Humana Gold Plus SNP-DE H1036-320 (HMO D-SNP)` |

**Composite key:** Columns 7+8+9 → `(H1036, 320, 0)`
**BID ID:** Column 11 → `H1036_320_0`

### Plan Classification

| Database Column | CSV Column # | CSV Column Name | Values |
|-----------------|--------------|-----------------|--------|
| `plan_type` | 18 | Plan Type | `HMO`, `PPO`, `HMO D-SNP`, `PPO D-SNP`, `HMO I-SNP`, `HMO C-SNP` |
| `snp_type` | 20 | SNP Type | `Dual-Eligible`→`D-SNP`, `Institutional`→`I-SNP`, `Chronic`→`C-SNP` |

**Plan Type Mapping:**
```typescript
// Plan Type is already human-readable in Landscape file
// Just need to normalize SNP suffix handling
function normalizeplanType(planType: string): string {
  // "HMO D-SNP" → "HMO" (SNP type stored separately)
  // "PPO D-SNP" → "PPO"
  return planType.replace(/ [DIC]-SNP$/, '');
}
```

**SNP Type Mapping:**
```typescript
const SNP_TYPE_MAP: Record<string, string | null> = {
  'Dual-Eligible': 'D-SNP',
  'Institutional': 'I-SNP',
  'Chronic or Disabling': 'C-SNP',
  'Not Applicable': null,
};
```

### Cost Fields (PRIMARY DATA SOURCE)

| Database Column | CSV Column # | CSV Column Name | Example |
|-----------------|--------------|-----------------|---------|
| `monthly_premium` | 44 | Monthly Consolidated Premium | `$38.40 ` |
| `drug_deductible` | 35 | Annual Part D Deductible | `$615.00 ` |
| `moop_in_network` | 45 | In-Network MOOP Amount | `$9,250.00 ` |

**Part C Only Plans:** Use column 43 (Part C Premium) when column 44 is `Not Applicable`

### Star Ratings

| Database Column | CSV Column # | CSV Column Name | Example |
|-----------------|--------------|-----------------|---------|
| `star_rating` | 48 | Overall Star Rating | `4.5` |
| (optional) part_c_stars | 46 | Part C Summary Star Rating | `4.0` |
| (optional) part_d_stars | 47 | Part D Summary Star Rating | `4.0` |

### Service Area (For `cms_service_areas` table)

| Database Column | CSV Column # | CSV Column Name | Example |
|-----------------|--------------|-----------------|---------|
| `state_code` | 4 | State Territory Abbreviation | `KY` |
| `county_name` | 6 | County Name | `Jefferson` |

**Note:** FIPS code NOT in this file. Must be looked up separately or joined with PBP data.

---

## 4. Sample Kentucky Data (3 Plans)

### Plan 1: Humana D-SNP (HMO)
```
Contract ID:        H1036
Plan ID:            320
Segment ID:         0
Plan Name:          Humana Gold Plus SNP-DE H1036-320 (HMO D-SNP)
Organization:       HUMANA MEDICAL PLAN, INC.
Marketing Name:     Humana
Plan Type:          HMO D-SNP
SNP Type:           Dual-Eligible → D-SNP
Monthly Premium:    $38.40
Drug Deductible:    $615.00
MOOP:               $9,250.00
Star Rating:        4.5
Counties:           Adair (and 89+ others)
```

### Plan 2: Wellcare PPO (Non-SNP)
```
Contract ID:        H3975
Plan ID:            001
Segment ID:         0
Plan Name:          Wellcare Simple Open (PPO)
Organization:       WELLCARE HEALTH INSURANCE COMPANY OF KENTUCKY, INC
Marketing Name:     Wellcare
Plan Type:          PPO
SNP Type:           null (Not Applicable)
Monthly Premium:    $0.00
Drug Deductible:    $615.00
MOOP:               $7,500.00
Star Rating:        3.0
Counties:           Adair (and others)
```

### Plan 3: Humana HMO (Non-SNP)
```
Contract ID:        H6622
Plan ID:            055
Segment ID:         0
Plan Name:          Humana Gold Plus H6622-055 (HMO)
Organization:       HUMANA WI HEALTH ORGANIZATION INSURANCE CORP
Marketing Name:     Humana
Plan Type:          HMO
SNP Type:           null (Not Applicable)
Monthly Premium:    $16.00
Drug Deductible:    $200.00
MOOP:               $6,550.00
Star Rating:        3.5
Counties:           Boone, Campbell, Grant, Kenton, Pendleton (Northern KY)
```

---

## 5. Data Format Notes

### Cost Formatting
All currency fields have:
- Dollar sign prefix: `$`
- Comma thousands separator: `$9,250.00`
- Two decimal places
- Trailing space: `$38.40 ` (need to trim)
- Negative values in parentheses: `($20.80)` → `-20.80`

**Parser function:**
```typescript
function parseCurrency(value: string): number | null {
  if (!value || value === 'Not Applicable') return null;

  // Remove $, commas, spaces
  let cleaned = value.replace(/[$,\s]/g, '');

  // Handle negatives: ($20.80) → -20.80
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    cleaned = '-' + cleaned.slice(1, -1);
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}
```

### Null Handling
- `Not Applicable` = null / feature not available
- Empty string = data not provided
- `$0.00` = zero cost (benefit is free)

### Star Ratings
- Decimal format: `4.5`, `4.0`, `3.5`, `3.0`, `2.5`
- Some plans show `Not Applicable` (new plans without ratings)

### Multiple Rows Per Plan
- **Critical:** Same plan appears once per county it serves
- Deduplicate by `(Contract ID, Plan ID, Segment ID)`
- Extract unique counties for `cms_service_areas` table

---

## 6. Contract Category Types

| Category | Description | Has Part D |
|----------|-------------|------------|
| `MA` | Medicare Advantage Only | No |
| `MA-PD` | MA with Prescription Drug | Yes |
| `SNP` | Special Needs Plan (always MA-PD) | Yes |
| `PDP` | Stand-alone Prescription Drug | N/A |

**Filter for Medicare Advantage:** `Contract Category Type IN ('MA', 'MA-PD', 'SNP')`

---

## 7. TypeScript Parser Skeleton

```typescript
import * as fs from 'fs';
import * as readline from 'readline';

interface LandscapePlan {
  contract_id: string;
  plan_id: string;
  segment_id: string;
  organization_name: string;
  marketing_name: string;
  plan_name: string;
  plan_type: string;
  snp_type: string | null;
  monthly_premium: number | null;
  drug_deductible: number | null;
  moop_in_network: number | null;
  star_rating: number | null;
  counties: string[];  // Aggregated from all rows
}

const COLUMN_MAP = {
  contract_id: 6,        // 0-indexed
  plan_id: 7,
  segment_id: 8,
  organization_name: 13,
  marketing_name: 14,
  plan_name: 16,
  plan_type: 17,
  snp_type: 19,
  drug_deductible: 34,
  monthly_premium: 43,
  moop_in_network: 44,
  star_rating: 47,
  state_code: 3,
  county_name: 5,
};

async function parseLandscapeCSV(
  filePath: string,
  stateFilter?: string
): Promise<Map<string, LandscapePlan>> {
  const plans = new Map<string, LandscapePlan>();

  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let isHeader = true;

  for await (const line of rl) {
    if (isHeader) {
      isHeader = false;
      continue;
    }

    // Parse CSV (handle quoted fields with commas)
    const fields = parseCSVLine(line);

    const state = fields[COLUMN_MAP.state_code];
    if (stateFilter && state !== stateFilter) continue;

    const key = `${fields[COLUMN_MAP.contract_id]}_${fields[COLUMN_MAP.plan_id]}_${fields[COLUMN_MAP.segment_id]}`;

    if (!plans.has(key)) {
      plans.set(key, {
        contract_id: fields[COLUMN_MAP.contract_id],
        plan_id: fields[COLUMN_MAP.plan_id],
        segment_id: fields[COLUMN_MAP.segment_id],
        organization_name: fields[COLUMN_MAP.organization_name],
        marketing_name: fields[COLUMN_MAP.marketing_name],
        plan_name: fields[COLUMN_MAP.plan_name],
        plan_type: normalizeplanType(fields[COLUMN_MAP.plan_type]),
        snp_type: mapSNPType(fields[COLUMN_MAP.snp_type]),
        monthly_premium: parseCurrency(fields[COLUMN_MAP.monthly_premium]),
        drug_deductible: parseCurrency(fields[COLUMN_MAP.drug_deductible]),
        moop_in_network: parseCurrency(fields[COLUMN_MAP.moop_in_network]),
        star_rating: parseFloat(fields[COLUMN_MAP.star_rating]) || null,
        counties: [],
      });
    }

    // Add county to service areas
    const plan = plans.get(key)!;
    const county = fields[COLUMN_MAP.county_name];
    if (county && !plan.counties.includes(county)) {
      plan.counties.push(county);
    }
  }

  return plans;
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields;
}
```

---

## 8. Import Strategy

1. **Parse Landscape CSV** → Get premium, MOOP, star ratings, plan classification
2. **Deduplicate by plan key** → `(contract_id, plan_id, segment_id)`
3. **Aggregate counties** → Build service area list per plan
4. **Match to carriers** → Use `marketing_name` against `cms_aliases`
5. **Insert to `cms_plans`** → One row per unique plan
6. **Insert to `cms_service_areas`** → One row per county per plan
7. **Join with PBP data (optional)** → Add copay/benefit details not in Landscape

**Recommended batch size:** 100-500 plans per transaction

---

## 9. Comparison: Landscape vs PBP Files

| Data Element | Landscape | PBP Benefits |
|--------------|-----------|--------------|
| Premium | Yes (primary) | No |
| MOOP | Yes (primary) | Limited |
| Star Ratings | Yes | No |
| Drug Deductible | Yes | Yes |
| Plan Type | Yes (readable) | Yes (coded) |
| SNP Type | Yes (readable) | Yes (coded) |
| Service Areas | Yes (by county name) | Yes (by FIPS) |
| PCP Copay | No | Yes |
| Specialist Copay | No | Yes |
| ER Copay | No | Yes |
| Drug Tier Copays | No | Yes |
| Dental/Vision/Hearing | No | Yes |
| OTC Allowance | No | Yes |

**Recommendation:** Use Landscape as primary source, join PBP for copay details.
