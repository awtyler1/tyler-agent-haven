# RTS (Ready to Sell) Import Flow Analysis

**Date:** January 19, 2026
**Purpose:** Document the end-to-end flow for importing Pinnacle RTS reports

---

## Overview

The RTS import allows admins to upload Pinnacle "Ready to Sell" Excel reports, which contain agent certification data by carrier. The system matches agents by NPN and updates both certification records and contracting status.

---

## 1. Input: Pinnacle RTS Report Format

### File Requirements
- **Format:** `.xlsx` Excel file
- **Sheet Name:** `Certs` (the import reads this specific sheet)

### Column Structure
| Column | Content | Notes |
|--------|---------|-------|
| A-C | Agent info | Name, details (not used for matching) |
| **D** | **NPN** | **Required for matching** - National Producer Number |
| E+ | Certification columns | Header format: `"Carrier: Product"` |

### Example Headers
```
Column D: NPN
Column E: Aetna: MA
Column F: Humana: PDP
Column G: UHC: MAPD
Column H: Wellcare: PDP
```

### Data Values
- **NPN:** Numeric or alphanumeric (normalized to digits only)
- **Certification cells:** Year values (2025, 2026, 0) indicating when certified
- **Product types:** `MA`, `PDP`, `MEDIGAP`, `ALL_ANCILLARY`, `MAPD`

---

## 2. Matching: How Agents Are Found

### Primary Match: NPN Only

```
RTS Report NPN → contracting_applications.npn_number → profile_id + user_id
```

**Process:**
1. Extract NPN from Column D
2. Normalize: remove all non-numeric characters
3. Look up in `contracting_applications` table by `npn_number`
4. Get associated `profile_id` and `user_id`

### What Happens If No Match?
- Agent is **skipped** (counted in `agents_skipped`)
- No error thrown - import continues
- Skipped agents do NOT get created in the system

### Why Not Email or user_id?
- NPN is the authoritative identifier from Pinnacle
- Email may differ between systems
- user_id is internal and not in the RTS report

---

## 3. Carrier Name Matching

### Alias System
The `carriers` table has an `rts_aliases` column (text array) for name variations:

| Carrier | RTS Aliases |
|---------|-------------|
| UnitedHealthcare | `['UHC', 'United', 'UnitedHealthcare']` |
| Wellcare | `['Wellcare', 'WellCare', 'WellCare Health Plans']` |
| Aetna | `['Aetna', 'Aetna Medicare']` |

### Matching Process
1. Parse carrier name from header (e.g., `"Aetna"` from `"Aetna: MA"`)
2. Lowercase for comparison
3. Look up in carrier alias map
4. If found → get `carrier_id`; if not → skip that certification

---

## 4. Output: What Gets Written to Database

### Table 1: `agent_certifications`

**One row per (agent, carrier, product) combination**

| Field | Value |
|-------|-------|
| `profile_id` | From NPN lookup |
| `carrier_name` | RTS name (e.g., "Aetna") |
| `product_type` | MA, PDP, MEDIGAP, etc. |
| `certification_year` | Year from cell (2026, 2025, 0) |

**Upsert conflict:** `(profile_id, carrier_name, product_type)`

### Table 2: `carrier_statuses`

**Only updated if certification_year == current cert year**

| Field | Value |
|-------|-------|
| `user_id` | From NPN lookup |
| `carrier_id` | From carrier alias lookup |
| `contracting_status` | `'contracted'` |
| `contracted_at` | `NOW()` |

**Upsert conflict:** `(user_id, carrier_id)`

### Table 3: `rts_import_logs`

**Audit trail for each import**

| Field | Value |
|-------|-------|
| `uploaded_by` | Admin's profile_id |
| `file_name` | Original filename |
| `agents_matched` | Count of matched agents |
| `agents_skipped` | Count of unmatched agents |
| `certifications_imported` | Count of cert rows upserted |

---

## 5. Year-Based Logic

### Current Cert Year Calculation
```javascript
const now = new Date();
const month = now.getMonth(); // 0-indexed
const year = now.getFullYear();

// Oct-Dec (months 9-11): Next year (AEP selling period)
// Jan-Sept (months 0-8): Current year
const currentCertYear = month >= 9 ? year + 1 : year;
```

### Certification Year Filtering
- Only imports certs within ±1 year of current cert year
- Year of `0` is accepted (expired/inactive)
- `carrier_statuses` only updated if cert year == current year

---

## 6. Key Files

| File | Purpose |
|------|---------|
| `src/pages/admin/RTSImportPage.tsx` | Upload UI, file selection, results display |
| `src/lib/rtsImport.ts` | Core import logic, Excel parsing, database writes |
| `supabase/migrations/*carriers*` | Carrier table with RTS aliases |

---

## 7. Database Schema

### agent_certifications
```sql
CREATE TABLE agent_certifications (
  id UUID PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id),
  carrier_name TEXT NOT NULL,
  product_type TEXT NOT NULL,
  certification_year INTEGER NOT NULL,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(profile_id, carrier_name, product_type)
);
```

### carrier_statuses
```sql
CREATE TABLE carrier_statuses (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  carrier_id UUID REFERENCES carriers(id),
  contracting_status TEXT DEFAULT 'not_started',
  contracted_at TIMESTAMPTZ,
  contracting_submitted_at TIMESTAMPTZ,
  issue_description TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(user_id, carrier_id)
);
```

### Relationship Diagram
```
profiles (id) ←── agent_certifications (profile_id)
    ↓
 user_id
    ↓
auth.users (id) ←── carrier_statuses (user_id)
                            ↓
                       carrier_id
                            ↓
                    carriers (id) [has rts_aliases]
```

---

## 8. Important Notes

### No Edge Functions
- RTS import runs entirely client-side
- Uses `xlsx` library for Excel parsing
- Direct Supabase client calls for database operations

### Batch Processing
- Certifications upserted in batches of 500
- Carrier statuses upserted in batches of 500
- Prevents request size limits on large reports

### Error Handling
- Per-row errors captured as warnings
- Import continues even if individual rows fail
- Detailed error messages returned to UI

### RLS Policies
- `rts_import_logs`: Admins can INSERT/SELECT only
- `agent_certifications`: Admins can manage; users can view own
- `carrier_statuses`: Admins can manage; users can view own

---

## 9. Result Metrics

After import, the UI displays:

| Metric | Description |
|--------|-------------|
| `matched` | Agents found in database by NPN |
| `skipped` | Agents in RTS not found in database |
| `certifications_imported` | agent_certifications rows upserted |
| `carrier_statuses_updated` | carrier_statuses rows upserted |
| `errors` | Array of warning/error messages |
