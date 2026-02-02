# CMS PBP Data Mapping Guide

**Purpose:** Map CMS PBP 2026 benefit files to the `cms_plans` database table
**Data Source:** https://www.cms.gov/files/zip/pbp-benefits-2026.zip
**Last Updated:** 2026-01-29

---

## 1. Top-Level Structure

The CMS PBP data is **NOT JSON** - it's a collection of **tab-delimited TXT files** with accompanying SAS schema files.

```
pbp-benefits-2026.zip/
├── pbp_Section_A.txt      # Plan identification & classification
├── pbp_Section_C.txt      # Out-of-network & POS costs
├── pbp_Section_D.txt      # Part D (drug) coverage
├── pbp_mrx.txt            # Drug benefit structure
├── pbp_mrx_tier.txt       # Drug tier copays (5 rows per plan)
├── pbp_b1a_inpat_hosp.txt # Inpatient hospital
├── pbp_b4_emerg_urgent.txt# ER & Urgent care
├── pbp_b7_health_prof.txt # PCP & Specialist visits
├── pbp_b13_other_services.txt # OTC, meals, transportation
├── pbp_b16_dental.txt     # Dental benefits
├── pbp_b17_eye_exams_wear.txt # Vision benefits
├── pbp_b18_hearing_exams_aids.txt # Hearing benefits
├── PlanArea.txt           # Service areas (county-level)
└── *.sas                  # SAS schema definitions
```

**File format:** Tab-delimited, first row is header, Windows line endings (CRLF)

---

## 2. Plan Identification Fields

**Source file:** `pbp_Section_A.txt`

| Database Column | CMS Field | Column # | Example |
|-----------------|-----------|----------|---------|
| `contract_id` | `pbp_a_hnumber` | 1 | `H0292` |
| `plan_id` | `pbp_a_plan_identifier` | 2 | `001` |
| `segment_id` | `segment_id` | 3 | `0` |
| `organization_name` | `pbp_a_org_name` | 17 | `HUMANA HEALTH PLAN OF OHIO, INC.` |
| `marketing_name` | `pbp_a_org_marketing_name` | 18 | `Humana` |
| `plan_name` (full) | `pbp_a_plan_name` | 20 | `Humana Gold Plus H0292-003 (HMO)` |

**Composite key:** `(pbp_a_hnumber, pbp_a_plan_identifier, segment_id)`
**BID ID:** `bid_id` (col 7) = `H0292_001_0` (contract_plan_segment)

---

## 3. Plan Classification Fields

**Source file:** `pbp_Section_A.txt`

| Database Column | CMS Field | Column # | Values |
|-----------------|-----------|----------|--------|
| `plan_type` | `pbp_a_plan_type` | 5 (or 22) | See mapping below |
| `snp_type` | `pbp_a_special_need_plan_type` | 34 | `1`=C-SNP, `2`=I-SNP, `3`=D-SNP |

### Plan Type Mapping
```typescript
const PLAN_TYPE_MAP: Record<string, string> = {
  '01': 'HMO',
  '02': 'HMO-POS',    // HMO with Point-of-Service
  '04': 'PPO',        // Local PPO
  '05': 'PFFS',       // Private Fee-for-Service
  '09': 'PFFS',       // PFFS with Part D
  '17': 'HMO-POS',    // HMO-POS with Part D
  '30': 'PDP',        // Stand-alone Part D (not MA)
  '47': 'Regional PPO',
};
```

### SNP Type Mapping
```typescript
const SNP_TYPE_MAP: Record<string, string | null> = {
  '1': 'C-SNP',       // Chronic condition
  '2': 'I-SNP',       // Institutional
  '3': 'D-SNP',       // Dual-eligible
  '4': 'C-SNP',       // Chronic/Disabling
  '': null,           // Not SNP
};
```

**SNP condition codes:** `pbp_a_snp_cond` (col 37) = 30-char bitmask for C-SNP conditions

---

## 4. Cost Fields

### Premium & MOOP

**IMPORTANT:** The PBP benefits files do NOT contain monthly premium or MOOP amounts directly. These are calculated from bid data and published in the separate **CMS Plan Finder** dataset.

For premium/MOOP data, use the Medicare Plan Finder API or the landscape files:
- https://www.medicare.gov/plan-compare/
- Download: "Medicare Plan Finder Download Data"

If you need to calculate from bid data, the relevant fields are in the bid summary files (not in this ZIP).

### Deductibles

**Source file:** `pbp_Section_D.txt`

| Database Column | CMS Field | Column # | Notes |
|-----------------|-----------|----------|-------|
| `annual_deductible` | `pbp_d_ann_deduct_amt` | 11 | Medical deductible |
| `drug_deductible` | `pbp_d_ann_deduct_amt` | 11 | Same field for Part D plans |

**Source file:** `pbp_mrx.txt`

| Database Column | CMS Field | Notes |
|-----------------|-----------|-------|
| `drug_deductible` | `mrx_alt_ded_amount` | Alternative deductible amount |

---

## 5. Medical Benefit Fields

### PCP & Specialist Visits

**Source file:** `pbp_b7_health_prof.txt`

| Database Column | CMS Field | Notes |
|-----------------|-----------|-------|
| `pcp_copay` | `pbp_b7b_copay_mc_amt_min` / `_max` | PCP office visit |
| `specialist_copay` | `pbp_b7c_copay_mc_amt_min` / `_max` | Specialist visit |

**Format logic:**
```typescript
function formatCopay(min: string, max: string): string {
  if (!min && !max) return '$0';
  if (min === max) return `$${min}`;
  return `$${min}-$${max}`;
}
```

### ER & Urgent Care

**Source file:** `pbp_b4_emerg_urgent.txt`

| Database Column | CMS Field | Notes |
|-----------------|-----------|-------|
| `er_copay` | `pbp_b4a_copay_amt_mc_min` / `_max` | Emergency room |
| `urgent_care_copay` | `pbp_b4b_copay_amt_mc_min` / `_max` | Urgent care |

**Waiver flags:**
- `pbp_b4a_copay_wavdia_yn` = ER copay waived if admitted (1=yes)

### Inpatient Hospital

**Source file:** `pbp_b1a_inpat_hosp.txt`

| Database Column | CMS Field | Notes |
|-----------------|-----------|-------|
| `inpatient_copay` | Interval-based | Complex - see below |

Inpatient uses interval-based copays:
- `pbp_b1a_copay_mcs_amt_int1_t1` = Days 1-X copay
- `pbp_b1a_copay_mcs_bgnd_int1_t1` = Start day
- `pbp_b1a_copay_mcs_endd_int1_t1` = End day

**Example format:** `$250/day days 1-5, $0/day days 6+`

---

## 6. Drug Tier Copays

**Source file:** `pbp_mrx_tier.txt`

**Structure:** One row per tier per plan (typically 5 rows per plan)

| Database Column | CMS Field | Notes |
|-----------------|-----------|-------|
| `drug_tier1` | `mrx_tier_rstd_copay_1m` | Preferred Generic (30-day retail) |
| `drug_tier2` | `mrx_tier_rstd_copay_1m` | Generic |
| `drug_tier3` | `mrx_tier_rstd_copay_1m` | Preferred Brand |
| `drug_tier4` | `mrx_tier_rstd_copay_1m` | Non-Preferred |
| `drug_tier5` | `mrx_tier_rstd_copay_1m` | Specialty |

**Key fields per tier row:**
- `mrx_tier_label_list` = Tier name (e.g., "Preferred Generic")
- `mrx_tier_id` = Tier number (1-5)
- `mrx_tier_rstd_copay_1m` = 30-day retail copay
- `mrx_tier_rstd_copay_3m` = 90-day retail copay
- `mrx_tier_mostd_copay_1m` = Mail order copay
- `mrx_tier_rstd_coins_1m` = Coinsurance % (if not copay)

**Example data:**
```
Tier | Label            | 30-day Copay | 90-day Copay
-----|------------------|--------------|-------------
1    | Preferred Generic| $0           | $0
2    | Generic          | $10          | $20
3    | Preferred Brand  | $47          | $141
4    | Non-Preferred    | 50%          | 50%
5    | Specialty        | 31%          | N/A
```

---

## 7. Supplemental Benefits

### Dental

**Source file:** `pbp_b16_dental.txt`

| Database Column | CMS Field | Notes |
|-----------------|-----------|-------|
| `dental_preventive` | `pbp_b16b_copay_ov_amt` | Preventive copay |
| `dental_comprehensive` | `pbp_b16c_copay_ov_amt` | Comprehensive copay |
| `dental_max_coverage` | `pbp_b16a_maxenr_mc_amt` | Annual maximum |

### Vision

**Source file:** `pbp_b17_eye_exams_wear.txt`

| Database Column | CMS Field | Notes |
|-----------------|-----------|-------|
| `vision_exam_copay` | `pbp_b17a_copay_amt_mc_min` | Routine eye exam |
| `vision_allowance` | `pbp_b17a_maxplan_amt` | Eyewear allowance |

### Hearing

**Source file:** `pbp_b18_hearing_exams_aids.txt`

| Database Column | CMS Field | Notes |
|-----------------|-----------|-------|
| `hearing_exam_copay` | `pbp_b18a_copay_amt` | Hearing exam |
| `hearing_aid_allowance` | `pbp_b18a_maxplan_amt` | Hearing aid allowance |

### OTC, Fitness, Transportation, Meals

**Source file:** `pbp_b13_other_services.txt`

| Database Column | CMS Field | Notes |
|-----------------|-----------|-------|
| `otc_allowance` | `pbp_b13b_maxplan_amt` | OTC allowance amount |
| `otc_frequency` | `pbp_b13b_otc_maxplan_per` | Per month/quarter/year |
| `fitness_benefit` | `pbp_b13a_bendesc_yn` | Fitness benefit (Y/N, then describe) |
| `meal_benefit` | `pbp_b13c_bendesc_service` | Meal benefit description |
| `transportation_trips` | Calculated from `pbp_b10_*` | From ambulance/transport file |

---

## 8. Service Area Data

**Source file:** `PlanArea.txt`

| Database Column | CMS Field | Column # | Example |
|-----------------|-----------|----------|---------|
| `contract_id` | `pbp_a_hnumber` | 1 | `H0292` |
| `plan_id` | `pbp_a_plan_identifier` | 2 | `001` |
| `segment_id` | `segment_id` | 3 | `0` |
| `state_code` | `stcd` | 17 | `KY` |
| `county_fips` | `county_code` | 11 | `18070` |
| `county_name` | `county` | 16 | `Boone` |
| `year` | `contract_year` | 14 | `2026` |

**Join key:** `(pbp_a_hnumber, pbp_a_plan_identifier, segment_id)`

**Example:**
```
H0292  001  0  ...  H0292_001_0  H0292  001  0  18070  0    2026  0  Boone  KY
H0292  001  0  ...  H0292_001_0  H0292  001  0  18180  0    2026  0  Campbell  KY
H0292  001  0  ...  H0292_001_0  H0292  001  0  18580  0    2026  0  Kenton  KY
```

---

## 9. Complete Plan Example

**Plan:** Humana Gold Plus H0292-003 (HMO) - Northern Kentucky

### Section A Data
```
pbp_a_hnumber: H0292
pbp_a_plan_identifier: 003
segment_id: 0
pbp_a_plan_type: 01 (HMO)
pbp_a_org_name: HUMANA HEALTH PLAN OF OHIO, INC.
pbp_a_org_marketing_name: Humana
pbp_a_plan_name: Humana Gold Plus H0292-003 (HMO)
pbp_a_special_need_plan_type: (empty - not SNP)
pbp_a_plan_geog_name: Northern Kentucky Area
```

### Benefits Data (from various files)
```
PCP Copay: $0 (pbp_b7b_copay_mc_amt_min = 0.00)
Specialist Copay: $10-$40 (pbp_b7c_copay_mc_amt_min/max)
ER Copay: $120 (waived if admitted)
Urgent Care: $50

Drug Tiers (pbp_mrx_tier.txt):
  Tier 1 (Preferred Generic): $0
  Tier 2 (Generic): $10
  Tier 3 (Preferred Brand): $47
  Tier 4 (Non-Preferred): 50%
  Tier 5 (Specialty): 31%
```

### Service Areas (PlanArea.txt)
```
Counties: Boone, Campbell, Grant, Kenton, Pendleton (KY)
FIPS codes: 18070, 18180, 18400, 18580, 18932
```

---

## 10. Data Quirks & Gotchas

### Empty vs Zero
- Empty field = benefit not offered
- `0` or `0.00` = $0 copay (benefit is free)
- Check `*_yn` fields first to see if benefit exists

### Min/Max Fields
- Many copays have `_min` and `_max` variants
- If min = max, display single value
- If different, display as range: `$10-$40`

### Coinsurance vs Copay
- `*_coins_yn` = 1 means coinsurance (%)
- `*_copay_yn` = 1 means flat copay ($)
- Some tiers use coinsurance (e.g., specialty drugs at 31%)

### Plan Type Duplicates
- `pbp_a_plan_type` appears in columns 5 AND 22
- Column 22 is the authoritative one

### Drug Tier Structure
- Each plan has 5 rows in `pbp_mrx_tier.txt`
- Filter by `mrx_tier_id` (1-5) to get specific tier
- `mrx_tier_label_list` contains the tier name

### Interval-Based Costs
- Inpatient, SNF use day-based intervals
- `_int1`, `_int2`, `_int3` suffixes for intervals
- `_bgnd` = begin day, `_endd` = end day

### SNP Condition Bitmask
- `pbp_a_snp_cond` is a 30-character string
- Position 1 = Diabetes, Position 5 = CHF, etc.
- `1` at position = plan covers that condition

---

## 11. TypeScript Parser Skeleton

```typescript
import * as fs from 'fs';
import * as readline from 'readline';

interface CMSPlanRow {
  contract_id: string;
  plan_id: string;
  segment_id: string;
  organization_name: string;
  marketing_name: string;
  plan_name: string;
  plan_type: string;
  snp_type: string | null;
  // ... other fields
}

async function parseCMSFile(
  filePath: string,
  columnMap: Record<string, number>
): Promise<Map<string, Record<string, string>>> {
  const plans = new Map<string, Record<string, string>>();

  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let isHeader = true;
  let headers: string[] = [];

  for await (const line of rl) {
    const fields = line.split('\t');

    if (isHeader) {
      headers = fields;
      isHeader = false;
      continue;
    }

    const key = `${fields[0]}_${fields[1]}_${fields[2]}`; // contract_plan_segment
    const row: Record<string, string> = {};

    for (const [dbCol, cmsIdx] of Object.entries(columnMap)) {
      row[dbCol] = fields[cmsIdx] || '';
    }

    plans.set(key, row);
  }

  return plans;
}

// Usage
const SECTION_A_COLUMNS = {
  contract_id: 0,
  plan_id: 1,
  segment_id: 2,
  organization_name: 16,
  marketing_name: 17,
  plan_name: 19,
  plan_type: 21,
  snp_type: 33,
};
```

---

## 12. Import Strategy

1. **Parse Section A first** - Get all plan identifiers and basic info
2. **Join other files by key** - `(contract_id, plan_id, segment_id)`
3. **Handle drug tiers separately** - Pivot 5 rows into columns
4. **Match to carriers** - Use `cms_aliases` on carriers table
5. **Import service areas** - One row per county per plan
6. **Validate** - Check for required fields, valid ranges

**Recommended batch size:** 100-500 plans per transaction
