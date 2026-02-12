# Book of Business (BOB) — Full System Deep Dive

**Generated:** February 12, 2026
**Scope:** Upload flow, carrier parsers, sync/reconciliation logic, database schema, edge functions

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Upload / Import Flow](#2-upload--import-flow)
3. [Carrier-Specific Parsers & Column Mappings](#3-carrier-specific-parsers--column-mappings)
4. [Edge Function: parse-production-report](#4-edge-function-parse-production-report)
5. [Client Matching & Deduplication](#5-client-matching--deduplication)
6. [Policy Upsert & Status Logic](#6-policy-upsert--status-logic)
7. [Sync Completion & Reconciliation](#7-sync-completion--reconciliation)
8. [Database Schema](#8-database-schema)
9. [Database Functions & Triggers](#9-database-functions--triggers)
10. [Data Flow: What Populates What](#10-data-flow-what-populates-what)
11. [Key File Index](#11-key-file-index)
12. [Known Gaps & Design Decisions](#12-known-gaps--design-decisions)

---

## 1. Architecture Overview

```
Agent uploads CSV/XLSX per carrier
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│  SyncFlow.tsx  (agent-facing monthly sync UI)           │
│  ─────────────────────────────────────────────────────  │
│  Phase 1: SELECT/CONFIRM carriers                       │
│  Phase 2: UPLOAD — per-carrier file drop zones          │
│           ├─ Client-side parse (instant counts)         │
│           └─ Background: edge function + RPC            │
│  Phase 3: DONE — summary + navigate to dashboard        │
└────────────────────────┬────────────────────────────────┘
                         │
          ┌──────────────┼──────────────────┐
          ▼              ▼                  ▼
   parseFileFor     parse-production-   get_carrier_
   ClientCount()    report (edge fn)    book_stats (RPC)
   (instant UI)     (DB writes)         (accurate counts)
          │              │                  │
          │              ▼                  │
          │    ┌──────────────────┐         │
          │    │ findOrCreateClient│         │
          │    │ upsertPolicy     │         │
          │    └──────────────────┘         │
          │              │                  │
          ▼              ▼                  ▼
   Show instant    clients table       Silently update
   counts in UI    policies table      UI with DB truth
                   production_uploads
                         │
                         ▼
              ┌──────────────────────┐
              │ handleCompleteSync() │
              │ ──────────────────── │
              │ monthly_syncs        │
              │ sync_carrier_uploads │
              │ profiles.last_sync_at│
              │ milestones           │
              │ cache invalidation   │
              └──────────────────────┘
```

**Two upload paths exist:**
| Path | Used By | Component | Context |
|------|---------|-----------|---------|
| Monthly Sync | Agents | `SyncFlow.tsx` | Primary flow — `/sync` route |
| Manual Upload | Admins | `UploadModal.tsx` + `UploadContext.tsx` | Book of Business admin page |

Both call the same edge function (`parse-production-report`) and write to the same tables.

---

## 2. Upload / Import Flow

### 2.1 SyncFlow Phases

**File:** `src/pages/SyncFlow.tsx` (~1,610 lines)

| Phase | Screen | Logic |
|-------|--------|-------|
| `CONFIRM` | "Sync your usual carriers?" — shows last-synced carrier pills | Only for returning agents with `preferredCarriers.length > 0` |
| `SELECT` | Carrier tiles (Humana, Aetna, Anthem, WellCare) | New agents or "Add More" path. Shows "Coming Soon" for unsupported carriers |
| `ADD_MORE` | "Your usual carriers" + "Also sync" sections | Lets returning agents add new carriers to their sync |
| `UPLOAD` | Per-carrier drop zones with stats | Core upload phase (see below) |
| `DONE` | "{Month} synced! X active clients" | Summary + "Go to Dashboard" |

### 2.2 Upload Phase Detail

Each carrier gets a collapsible row with:
- Carrier name + color-coded icon
- "Open portal" external link (for downloading the report from the carrier)
- Drag-and-drop zone: "Drop your {Carrier} report here" or "click to browse"
- File type hint: `(.csv, .xlsx)`
- After upload: green checkmark + `X active · Y new · Z termed`
- "Replace" button to re-upload

**Progress:** "X of Y uploaded" counter in top-right

### 2.3 File Validation

```
Accepted formats:   .csv, .xlsx
Max file size:       10 MB
Per-carrier types:   Humana → .xlsx only
                     Aetna  → .csv or .xlsx
                     Anthem → .csv
                     WellCare → .csv
```

**Carrier auto-detection:** Reads file headers and scores against known column signatures. If detected carrier doesn't match the selected carrier, shows a mismatch dialog. If carrier can't be detected at all, shows a "detection failed" dialog.

### 2.4 Three-Step Count Pipeline

After a file is dropped, three things happen:

1. **Instant (client-side):** `parseFileForClientCount()` reads the file locally, counts rows matching the carrier format, identifies new clients by effective date in the current month. Shows counts immediately in UI.

2. **Background (edge function):** File is base64-encoded and sent to `parse-production-report`. This does the real DB work — creating/updating clients and policies. Returns `{ total, imported, updated, skipped }`.

3. **Reconciliation (RPC):** After edge function completes, calls `get_carrier_book_stats()` to get accurate active/new/termed counts from the policies table. Silently updates the UI numbers.

### 2.5 Session Persistence

Sync progress is stored in `sessionStorage` under key `tig-sync-progress`:
- Saved: phase, selectedCarriers, uploadedCarriers
- Restored if agent navigates away mid-sync
- Cleared on successful completion

---

## 3. Carrier-Specific Parsers & Column Mappings

### 3.1 Detection Signatures

**File:** `src/lib/carrier-detection.ts`

| Carrier | Unique Identifiers (2 pts each) | Required Columns (1 pt each) | Min Score |
|---------|--------------------------------|------------------------------|-----------|
| Aetna | `medicare number`, `coverage effective date`, `legacy member id` | `member status` | 2 |
| Humana | `humana id`, `mbrlastname`, `mbrfirstname`, `salesproduct` | — | 2 |
| WellCare | `centene id`, `broker npn`, `mbi` | `member first name` | 2 |
| Anthem | `client name`, `client id`, `writing agent`, `writing tin` | `market` | 2 |

Confidence: `high` (≥4 pts), `medium` (2-3 pts), `low` (<2 pts)

### 3.2 Aetna Parser

**Format:** CSV
**Match key:** Medicare Number
**Status field:** `Member Status` — `'A'` = active, `'T'` = termed

| CSV Column | → Parsed Field | Notes |
|-----------|----------------|-------|
| Medicare Number | `medicare_number` | **Required** — rows without this are skipped |
| First Name | `first_name` | |
| Last Name | `last_name` | |
| Middle Initial | `middle_initial` | |
| Date of Birth | `date_of_birth` | Normalized to YYYY-MM-DD |
| Phone Number | `phone` | Digits only, ≥10 required |
| Address Line 1 | `address_line1` | |
| City | `address_city` | |
| State | `address_state` | |
| Zip Code | `address_zip` | |
| Coverage Effective Date | `effective_date` | Normalized to YYYY-MM-DD |
| Term Date | `term_date` | Normalized to YYYY-MM-DD |
| Member Status | `status` | 'A' → 'active', 'T' → 'termed' |
| Plan Name | `plan_name` | |
| Member ID | `carrier_member_id` | Carrier's internal ID |

### 3.3 WellCare / Centene Parser

**Format:** CSV
**Match key:** MBI (Medicare Beneficiary Identifier)
**Status logic:** Empty `Termination Date` = active; has date = termed

| CSV Column | → Parsed Field | Notes |
|-----------|----------------|-------|
| MBI | `medicare_number` | **Required** — rows without this are skipped |
| Centene ID | `carrier_member_id` | |
| Member First Name | `first_name` | ALL CAPS → Title Case |
| Member Last Name | `last_name` | ALL CAPS → Title Case |
| Member DoB | `date_of_birth` | MM/DD/YYYY → YYYY-MM-DD |
| Phone | `phone` | Digits only, ≥10 required |
| Address | `address_line1` | Surrounding quotes stripped |
| City | `address_city` | Surrounding quotes stripped |
| State | `address_state` | |
| Zip | `address_zip` | |
| Effective Date | `effective_date` | MM/DD/YYYY → YYYY-MM-DD |
| Termination Date | `term_date` | Empty = active, date = termed |
| Plan Name | `plan_name` | |

### 3.4 Humana Parser

**Format:** XLSX
**Match key:** `first_name + last_name + date_of_birth` (case-insensitive) — **NO Medicare number**
**Status field:** `Status` — mapped per table below

| XLSX Column | → Parsed Field | Notes |
|-----------|----------------|-------|
| MbrFirstName | `first_name` | ALL CAPS → Title Case |
| MbrLastName | `last_name` | ALL CAPS → Title Case |
| MbrMiddleInit | `middle_initial` | |
| Birth Date | `date_of_birth` | M/D/YYYY (no leading zeros) |
| Phone | `phone` | "Unavailable" → null |
| Email | `email` | "Unavailable" → null |
| Effective Date | `effective_date` | M/D/YYYY |
| Inactive Date | `term_date` | M/D/YYYY |
| Status | `status` | See mapping below |
| Plan Type + SalesProduct | `plan_name` | Combined with space |
| Humana ID | `carrier_member_id` | |

**Status mapping:**
| Humana Status | → Policy Status | Action |
|--------------|----------------|--------|
| Active Policy | `active` | Import |
| Future Active Policy | `active` | Import |
| Inactive Policy | `termed` | Import |
| Cancelled Application | — | **Skip** |
| In Progress Application | — | **Skip** |

**Missing from Humana reports:** Medicare number, address fields

### 3.5 Anthem Parser

**Format:** CSV
**Match key:** `carrier_member_id` via policies table, fallback to `first_name + last_name` — **NO Medicare number, NO DOB**
**Pre-filter:** `Market = 'Senior'` only (all other markets skipped)
**First row:** Comment line ("List of clients as of...") auto-stripped

| CSV Column | → Parsed Field | Notes |
|-----------|----------------|-------|
| Client Name | `first_name`, `last_name` | Format: "Last, First Middle" — parsed via `parseLastFirstName()` |
| Client ID | `carrier_member_id` | |
| Market | — | **Filter:** must be "Senior" |
| State | `address_state` | State only, no full address |
| Effective Date | `effective_date` | YYYY-MM-DD |
| Cancellation Date | `term_date` | `9999-12-31` → null (active) |
| Status | `status` | See mapping below |
| Plan Name | `plan_name` | |

**Status mapping:**
| Anthem Status | → Policy Status | Action |
|--------------|----------------|--------|
| Active | `active` | Import |
| Future Disenrollment | `active` | Import |
| Inactive | `termed` | Import |
| Other values | — | **Skip** |

**Missing from Anthem reports:** Medicare number, DOB, phone, email, full address

### 3.6 Summary: Carrier Comparison

| Feature | Aetna | Humana | WellCare | Anthem |
|---------|-------|--------|----------|--------|
| File Type | CSV | XLSX | CSV | CSV |
| Medicare # | Yes | **No** | Yes | **No** |
| DOB | Yes | Yes | Yes | **No** |
| Dedup Method | Medicare # | Name+DOB | Medicare # | CarrierID/Name |
| Phone | Yes | Yes | Yes | No |
| Email | No | Yes | No | No |
| Address | Full | None | Full | State only |
| Name Format | Separate fields | ALL CAPS | ALL CAPS | "Last, First M" |
| Status Field | Member Status (A/T) | Status (text) | Term Date (empty=active) | Status (text) |

---

## 4. Edge Function: parse-production-report

**File:** `supabase/functions/parse-production-report/index.ts` (~1,020 lines)

### 4.1 Input / Output

**Request:**
```json
{
  "file": "<base64-encoded CSV or XLSX>",
  "carrier_code": "aetna|wellcare|humana|anthem",
  "profile_id": "<agent UUID>",
  "file_type": "csv|xlsx"  // optional, auto-detected from magic bytes
}
```

**Response:**
```json
{
  "success": true,
  "upload_id": "<production_uploads UUID>",
  "stats": {
    "total": 150,
    "imported": 12,
    "updated": 136,
    "skipped": 2
  }
}
```

### 4.2 Processing Pipeline

```
1. Validate auth token
2. Look up carrier UUID from carriers.code
3. Create production_uploads record (status: 'processing')
4. Detect file type (magic bytes: 0x504B = XLSX, else CSV)
5. Parse file with carrier-specific parser
6. For each parsed row:
   a. findOrCreateClient() → { clientId, isNew }
   b. upsertPolicy() → { isNew }
   c. Track stats: imported (new) / updated (existing) / skipped (error)
7. Update production_uploads with final stats (status: 'complete')
8. Return stats
```

### 4.3 Utility Functions

| Function | Purpose |
|----------|---------|
| `normalizeDate(str)` | Handles YYYY-MM-DD, MM/DD/YYYY, MM-DD-YYYY, M/D/YYYY, M/D/YY. `3000-01-01` → null |
| `normalizePhone(str)` | Strips non-digits, requires ≥10 digits. Returns digit string or null |
| `toTitleCase(str)` | ALL CAPS → Title Case. Handles suffixes like "JR" |
| `parseLastFirstName(str)` | Parses "Last, First Middle" format. Strips quotes |
| `derivePlanType(planName)` | Categorizes plan: MA, PDP, MEDIGAP, or OTHER (see §6.2) |
| `detectFileType(bytes)` | Magic bytes check: ZIP header (0x50 0x4B) = XLSX, else CSV |
| `parseCSVLine(line)` | Handles quoted fields, escaped quotes (`""`), embedded commas |

---

## 5. Client Matching & Deduplication

**File:** `supabase/functions/parse-production-report/index.ts`, function `findOrCreateClient()`

### 5.1 Match Priority

```
1. Medicare number present? (Aetna, WellCare)
   → SELECT FROM clients WHERE profile_id = ? AND medicare_number = ?

2. No Medicare # but DOB present? (Humana)
   → SELECT FROM clients WHERE profile_id = ?
       AND first_name ILIKE ? AND last_name ILIKE ? AND date_of_birth = ?

3. Neither Medicare # nor DOB? (Anthem)
   → First try: SELECT client_id FROM policies
       WHERE carrier_member_id = ? AND carrier_id = ? AND profile_id = ?
   → Fallback: SELECT FROM clients WHERE profile_id = ?
       AND first_name ILIKE ? AND last_name ILIKE ?
```

### 5.2 Update vs Create

**If client found:**
- Updates only non-null incoming fields (doesn't overwrite existing data with nulls)
- Sets `updated_at = now()`
- Returns `{ clientId, isNew: false }`

**If client not found:**
- Inserts all parsed fields (including nulls)
- Returns `{ clientId, isNew: true }`

### 5.3 Duplicate Risk

| Carrier | Risk Level | Why |
|---------|-----------|-----|
| Aetna | Low | Medicare # is unique identifier |
| WellCare | Low | MBI is unique identifier |
| Humana | Medium | Name+DOB match could fail on name variations (e.g., "Bob" vs "Robert") |
| Anthem | **High** | Name-only fallback has no DOB or Medicare # to disambiguate. Common names could match wrong client |

---

## 6. Policy Upsert & Status Logic

### 6.1 Policy Matching

**Unique constraint:** `(client_id, carrier_id)` — one policy per client per carrier

```sql
-- Find existing policy
SELECT id FROM policies WHERE client_id = ? AND carrier_id = ?
```

**If found → UPDATE:**
```sql
UPDATE policies SET
  plan_name = ?,
  plan_type = derivePlanType(?),
  effective_date = ?,
  term_date = ?,
  status = ?,                    -- 'active' or 'termed'
  carrier_member_id = ?,
  source_upload_id = ?,          -- which upload created/updated this
  last_seen_at = now(),
  updated_at = now()
WHERE id = ?
```

**If not found → INSERT** with all fields including `profile_id` and `carrier_id`.

### 6.2 Plan Type Derivation

```
derivePlanType(planName):
  if contains 'pdp' | 'part d' | 'prescription'           → 'PDP'
  if contains 'plan g|f|n' | 'medigap' | 'supplement'     → 'MEDIGAP'
  if contains 'hmo' | 'ppo' | 'snp' | 'ma ' | 'medicare advantage' → 'MA'
  else                                                      → 'OTHER'
```

Used for commission calculations:
```
PLAN_TYPE_RENEWAL rates (annual per policy):
  MA / MAPD  → $347
  PDP        → $47
  MEDIGAP    → $800
  OTHER      → $37
```

### 6.3 source_upload_id vs last_seen_upload_id

| Field | Set When | Purpose |
|-------|----------|---------|
| `source_upload_id` | Every upsert (overwritten each time) | Tracks which upload last touched this policy |
| `last_seen_at` | Every upsert (set to `now()`) | Timestamp of last reconciliation |
| `last_seen_upload_id` | Defined in schema but **not currently set by edge function** | Intended to track most recent upload that included this policy |

**Note:** `source_upload_id` is overwritten on every upload. There is no separate "original upload" vs "latest upload" tracking — `source_upload_id` serves as both.

### 6.4 What Happens to Missing Clients?

**Critical gap:** When a client was on the PREVIOUS report but is MISSING from the new one, **nothing happens**. The edge function only processes rows that are IN the file. It does not:
- Mark missing clients as termed
- Set any "not seen" flag
- Compare against previous upload

The `last_seen_at` timestamp can be used to identify stale policies, but no automated process currently does this.

### 6.5 What Happens to Termed Clients in a Report?

If a carrier report includes a client with a terminated status (e.g., Aetna `Member Status = 'T'`, or Anthem `Status = 'Inactive'`):
- The policy's `status` is set to `'termed'`
- The policy's `term_date` is set from the report
- The client record remains unchanged
- The client will appear in "termed" counts via `get_carrier_book_stats()`

---

## 7. Sync Completion & Reconciliation

### 7.1 SyncFlow's handleCompleteSync()

**File:** `src/pages/SyncFlow.tsx` (~lines 787-910)

This is the inline completion handler (NOT the one in `lib/sync.ts`):

```
1. Upsert monthly_syncs record (profile_id, month, status: 'complete')
2. Map carrier codes → carrier UUIDs
3. For each uploaded carrier:
   a. Upsert sync_carrier_uploads (client_count, new_clients, termed_clients)
4. Re-sum totals across ALL carriers (not just this session)
5. Count unique active clients:
   SELECT DISTINCT client_id FROM policies
   WHERE profile_id = ? AND status = 'active'
6. Update monthly_syncs with:
   - total_clients (unique count)
   - new_clients (sum across carriers)
   - termed_clients (sum across carriers)
   - net_change (new - termed)
   - completed_at
7. Update profiles.last_sync_at
8. Invalidate TanStack Query caches:
   - ['dashboard']
   - ['admin-dashboard']
   - ['admin-agents-book']
9. Set phase = 'done'
```

### 7.2 lib/sync.ts's completeSync()

**File:** `src/lib/sync.ts` (~589 lines)

This is the **separate** completion path with milestone support. **Not called from SyncFlow.**

```
1. Calculate total clients from sync_carrier_uploads
2. Compute delta vs previous month
3. Update monthly_syncs (status: 'complete', total_clients, completed_at)
4. Update profiles.last_sync_at
5. Call checkAndAwardMilestones()
```

**Milestone thresholds:** 25, 50, 100, 150, 200, 250, 300, 400, 500, 750, 1000

### 7.3 Dual Completion Path (Known Issue)

| Feature | SyncFlow.handleCompleteSync() | lib/sync.completeSync() |
|---------|-------------------------------|------------------------|
| Location | `src/pages/SyncFlow.tsx` (inline) | `src/lib/sync.ts` |
| Called from | SyncFlow UI | Not currently called |
| Writes monthly_syncs | Yes | Yes |
| Writes sync_carrier_uploads | Yes | No |
| Updates profiles.last_sync_at | Yes | Yes |
| Invalidates TanStack cache | Yes | No |
| Calls checkAndAwardMilestones | Yes | Yes |
| Tracks termed_clients/net_change | Yes | No |

### 7.4 get_carrier_book_stats RPC

**File:** `supabase/migrations/20260205000001_add_carrier_book_stats_rpc.sql`

```sql
CREATE OR REPLACE FUNCTION get_carrier_book_stats(
  p_profile_id uuid,
  p_carrier_id uuid,
  p_month_start date,
  p_month_end date
) RETURNS json AS $$
  SELECT json_build_object(
    'active_count', COUNT(*) FILTER (WHERE status = 'active'),
    'new_count',    COUNT(*) FILTER (WHERE status = 'active'
                      AND effective_date >= p_month_start
                      AND effective_date < p_month_end),
    'termed_count', COUNT(*) FILTER (WHERE status = 'termed'
                      AND term_date >= p_month_start
                      AND term_date < p_month_end)
  )
  FROM policies
  WHERE profile_id = p_profile_id
    AND carrier_id = p_carrier_id;
$$ LANGUAGE sql SECURITY DEFINER;
```

Called by SyncFlow after edge function completes, to get accurate DB-truth counts.

---

## 8. Database Schema

### 8.1 clients

**Created by:** `supabase/migrations/20260121000000_create_production_tables.sql`
**Modified by:** `supabase/migrations/20260210000000_bob_command_center_tables.sql`

```sql
CREATE TABLE clients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  medicare_number VARCHAR(15),           -- NULL for Humana/Anthem clients
  first_name      TEXT NOT NULL,
  last_name       TEXT NOT NULL,
  middle_initial  VARCHAR(5),
  date_of_birth   DATE,                  -- NULL for Anthem clients
  phone           VARCHAR(20),
  email           TEXT,
  address_line1   TEXT,
  address_city    TEXT,
  address_state   VARCHAR(2),
  address_zip     VARCHAR(10),
  last_contacted_at TIMESTAMPTZ,         -- Added in BOB Command Center migration
  county_fips     VARCHAR(5),            -- Added in BOB Command Center migration
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),

  UNIQUE(profile_id, medicare_number)
);
```

**Indexes:** `profile_id`, `medicare_number`, `last_name`, `last_contacted_at`
**Trigger:** `update_clients_updated_at` → auto-sets `updated_at` on UPDATE

### 8.2 policies

**Created by:** `supabase/migrations/20260121000000_create_production_tables.sql`

```sql
CREATE TABLE policies (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           UUID REFERENCES clients(id) ON DELETE CASCADE,
  carrier_id          UUID REFERENCES carriers(id),
  profile_id          UUID REFERENCES profiles(id) ON DELETE CASCADE,
  carrier_member_id   TEXT,              -- Carrier's internal ID
  plan_name           TEXT,
  plan_type           TEXT,              -- MA, PDP, MEDIGAP, OTHER
  effective_date      DATE,
  term_date           DATE,
  status              VARCHAR(20) DEFAULT 'active',  -- 'active' or 'termed'
  is_t65              BOOLEAN,
  source_upload_id    UUID REFERENCES production_uploads(id),
  last_seen_upload_id UUID REFERENCES production_uploads(id),
  last_seen_at        TIMESTAMPTZ DEFAULT now(),
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),

  UNIQUE(client_id, carrier_id)
);
```

**Indexes:** `client_id`, `carrier_id`, `profile_id`, `status`, `effective_date`, composite `(profile_id, carrier_id, status)`
**Trigger:** `update_policies_updated_at` → auto-sets `updated_at` on UPDATE

### 8.3 production_uploads

**Created by:** `supabase/migrations/20260121000000_create_production_tables.sql`

```sql
CREATE TABLE production_uploads (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  carrier_id       UUID NOT NULL REFERENCES carriers(id),
  file_name        TEXT NOT NULL,
  file_hash        TEXT,
  status           VARCHAR(20) DEFAULT 'pending',  -- pending, processing, complete, error
  error_message    TEXT,
  records_total    INTEGER,
  records_imported INTEGER,
  records_updated  INTEGER,
  records_skipped  INTEGER,
  completed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT now()
);
```

**Indexes:** `profile_id`, `carrier_id`, `status`, `created_at DESC`

### 8.4 monthly_syncs

**Created by:** `supabase/migrations/20260122000000_add_sync_tables.sql`
**Modified by:** `20260128000003` (new_clients), `20260205000000` (termed_clients, net_change)

```sql
CREATE TABLE monthly_syncs (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id             UUID NOT NULL REFERENCES profiles(id),
  month                  DATE NOT NULL,              -- First day of month
  status                 TEXT DEFAULT 'pending',      -- pending, in_progress, complete
  started_at             TIMESTAMPTZ,
  completed_at           TIMESTAMPTZ,
  total_clients          INTEGER,                     -- Unique active clients
  previous_month_clients INTEGER,
  new_clients            INTEGER,                     -- Effective in this month
  termed_clients         INTEGER,                     -- Termed in this month
  net_change             INTEGER,                     -- new - termed
  created_at             TIMESTAMPTZ DEFAULT now(),

  UNIQUE(profile_id, month)
);
```

### 8.5 sync_carrier_uploads

**Created by:** `supabase/migrations/20260122000000_add_sync_tables.sql`
**Modified by:** `20260128000003` (new_clients), `20260205000000` (termed_clients)

```sql
CREATE TABLE sync_carrier_uploads (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_id              UUID NOT NULL REFERENCES monthly_syncs(id),
  carrier_id           UUID NOT NULL REFERENCES carriers(id),
  production_upload_id UUID REFERENCES production_uploads(id),
  client_count         INTEGER,
  previous_count       INTEGER,
  new_clients          INTEGER,
  termed_clients       INTEGER,
  uploaded_at          TIMESTAMPTZ,

  UNIQUE(sync_id, carrier_id)
);
```

### 8.6 client_risk_flags

**Created by:** `supabase/migrations/20260210000000_bob_command_center_tables.sql`

```sql
CREATE TABLE client_risk_flags (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  flag_type   VARCHAR(50) NOT NULL,     -- no_contact_90, birthday_upcoming, etc.
  severity    VARCHAR(10) DEFAULT 'medium',  -- low, medium, high, critical
  title       TEXT NOT NULL,
  description TEXT,
  status      VARCHAR(20) DEFAULT 'active',  -- active, acknowledged, resolved, dismissed
  source      VARCHAR(30) DEFAULT 'system',
  metadata    JSONB,
  expires_at  DATE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);
```

**Flag types defined:** `no_contact_90`, `no_contact_180`, `birthday_upcoming`, `anniversary_upcoming`, `aep_review_needed`, `plan_benefit_cut`, `carrier_exit`, `plan_discontinued`

### 8.7 client_interactions

**Created by:** `supabase/migrations/20260210000000_bob_command_center_tables.sql`

```sql
CREATE TABLE client_interactions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id             UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  profile_id            UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  interaction_type      VARCHAR(30) NOT NULL,  -- call, email, text, meeting, note
  outcome               VARCHAR(30),           -- reached, voicemail, no_answer, etc.
  notes                 TEXT,
  follow_up_date        DATE,
  follow_up_completed_at TIMESTAMPTZ,
  duration_minutes      INTEGER,
  created_at            TIMESTAMPTZ DEFAULT now()
);
```

### 8.8 Supporting tables

| Table | Purpose |
|-------|---------|
| `agent_carriers` | Which carriers an agent tracks (profile_id, carrier_id) |
| `milestones` | Achievement records (profile_id, milestone_type, milestone_value) |
| `carriers` | Carrier definitions (id, name, code, rts_aliases, cms_aliases) |

---

## 9. Database Functions & Triggers

### 9.1 Functions

| Function | Purpose | Used By |
|----------|---------|---------|
| `get_carrier_book_stats(p_profile_id, p_carrier_id, p_month_start, p_month_end)` | Single-query active/new/termed counts per carrier | SyncFlow background reconciliation |
| `update_updated_at_column()` | Generic trigger: sets `updated_at = now()` | Triggers on clients, policies, risk_flags |
| `is_admin_user()` | Check if current user has admin/super_admin role | RLS policies |
| `get_current_profile_id()` | Get profile UUID for authenticated user | RLS policies |

### 9.2 Triggers

All use `update_updated_at_column()` for `BEFORE UPDATE`:

| Table | Trigger |
|-------|---------|
| clients | `update_clients_updated_at` |
| policies | `update_policies_updated_at` |
| client_risk_flags | `update_client_risk_flags_updated_at` |

### 9.3 RLS Pattern

All BOB tables follow the same pattern:
```sql
-- Users see own records
USING (profile_id = get_current_profile_id())

-- Admins see all
USING (is_admin_user())

-- Service role (edge functions) has full access
USING (auth.role() = 'service_role')
```

### 9.4 No Auto-Status Triggers

Policy `status` is NOT automatically updated by database triggers. Status is determined at import time by the edge function based on carrier report data. There is no trigger that auto-terms policies based on date or absence from reports.

---

## 10. Data Flow: What Populates What

### 10.1 Fields Populated from BOB Reports vs Manual Entry

**clients table:**

| Field | Source | Notes |
|-------|--------|-------|
| `first_name` | BOB report | Title-cased from ALL CAPS |
| `last_name` | BOB report | Title-cased from ALL CAPS |
| `middle_initial` | BOB report | Aetna, Humana only |
| `date_of_birth` | BOB report | Not available from Anthem |
| `phone` | BOB report | Not available from Anthem |
| `email` | BOB report | Humana only |
| `medicare_number` | BOB report | Aetna, WellCare only |
| `address_*` | BOB report | Aetna, WellCare (full); Anthem (state only); Humana (none) |
| `last_contacted_at` | **Manual** | Set via client_interactions |
| `county_fips` | **Manual/future** | Not populated by any current flow |

**policies table:**

| Field | Source |
|-------|--------|
| `plan_name` | BOB report |
| `plan_type` | Derived from plan_name via `derivePlanType()` |
| `effective_date` | BOB report |
| `term_date` | BOB report |
| `status` | BOB report (mapped from carrier-specific status codes) |
| `carrier_member_id` | BOB report |
| `source_upload_id` | Set to current production_uploads.id |
| `last_seen_at` | Set to `now()` on each upsert |
| `is_t65` | Not currently populated by any flow |

### 10.2 client_risk_flags: Auto vs Manual

**Currently computed client-side** in `useBookClients.ts`:

| Flag | Trigger | Severity |
|------|---------|----------|
| `birthday_upcoming` | DOB within next 7 days | `low` |
| `no_contact_90` | `last_contacted_at` ≥ 90 days ago | `medium` |
| `no_contact_90` (180+) | `last_contacted_at` ≥ 180 days ago | `high` |

**Not auto-computed:** `NULL last_contacted_at` is NOT treated as overdue (agent hasn't started tracking yet).

**DB-stored flags** (`client_risk_flags` table) are checked first and take priority over computed flags. Currently, no automated process writes to this table — the flag_type values like `aep_review_needed`, `plan_benefit_cut`, `carrier_exit`, `plan_discontinued` are defined but not yet populated.

---

## 11. Key File Index

### Frontend

| File | Purpose |
|------|---------|
| `src/pages/SyncFlow.tsx` | Primary agent sync flow (~1,610 lines) |
| `src/pages/MyClientsPage.tsx` | Agent client list table |
| `src/pages/book/BookDashboard.tsx` | Agent book dashboard |
| `src/pages/book/ClientList.tsx` | Agent client directory |
| `src/pages/book/GrowthIncome.tsx` | Growth & income metrics |
| `src/components/book-of-business/UploadModal.tsx` | Admin upload modal (~590 lines) |
| `src/components/book-of-business/UploadProgressAnimated.tsx` | Upload progress animation |
| `src/components/book-of-business/GlobalUploadIndicator.tsx` | Floating upload indicator |
| `src/contexts/UploadContext.tsx` | Background upload lifecycle |

### Hooks

| File | Purpose |
|------|---------|
| `src/hooks/useBookClients.ts` | Clients + policies + risk flags (with client-side flag computation) |
| `src/hooks/useBookSummary.ts` | Aggregate book stats (TanStack Query) |
| `src/hooks/useMyClients.ts` | Simpler client list (used by MyClientsPage) |
| `src/hooks/useAdminAgentBook.ts` | Single agent book for admin view |
| `src/hooks/useAdminAgentsBook.ts` | All agents' book stats for admin |

### Logic

| File | Purpose |
|------|---------|
| `src/lib/sync.ts` | Sync orchestration, milestones, previous-month stats (~589 lines) |
| `src/lib/carrier-detection.ts` | Auto-detect carrier from file headers |
| `src/config/carriers.ts` | Carrier definitions, colors, enabled status |
| `src/types/book.ts` | BookClient, BookSummary, CarrierIncome types + renewal rates |

### Backend

| File | Purpose |
|------|---------|
| `supabase/functions/parse-production-report/index.ts` | Edge function: parse + import (~1,020 lines) |

### Migrations

| File | Purpose |
|------|---------|
| `supabase/migrations/20260121000000_create_production_tables.sql` | clients, policies, production_uploads |
| `supabase/migrations/20260122000000_add_sync_tables.sql` | monthly_syncs, sync_carrier_uploads, agent_carriers, milestones |
| `supabase/migrations/20260128000002_fix_sync_tables_rls.sql` | RLS fixes |
| `supabase/migrations/20260128000003_add_new_clients_columns.sql` | new_clients tracking |
| `supabase/migrations/20260205000000_add_disenrollment_tracking.sql` | termed_clients, net_change |
| `supabase/migrations/20260205000001_add_carrier_book_stats_rpc.sql` | get_carrier_book_stats() RPC |
| `supabase/migrations/20260210000000_bob_command_center_tables.sql` | client_interactions, client_risk_flags |

---

## 12. Known Gaps & Design Decisions

### 12.1 No "Missing Client" Detection

When a client appears on Report A but is absent from Report B, **nothing happens**. The edge function only processes rows present in the uploaded file. There is no diff against the previous upload. The `last_seen_at` field exists and could be used for stale-policy detection, but no automated process uses it.

### 12.2 Anthem Duplicate Risk

Anthem reports have no Medicare number AND no DOB. Client matching falls back to name-only (case-insensitive), which is prone to false positives for common names like "John Smith". The `carrier_member_id` lookup via policies table helps when re-uploading, but first-time imports for name-collision clients could create duplicates.

### 12.3 source_upload_id Is Overwritten

`policies.source_upload_id` is set on every upsert, so it always points to the most recent upload that touched this policy — not the original upload that created it. There is no separate "created by" upload tracking.

### 12.4 last_seen_upload_id Not Used

The `policies` table has a `last_seen_upload_id` column (FK to production_uploads) but the edge function never sets it. Only `source_upload_id` and `last_seen_at` are written.

### 12.5 Dual Sync Completion Paths

`SyncFlow.tsx` has its own inline `handleCompleteSync()` and `lib/sync.ts` has `completeSync()`. They do overlapping but different things. The `lib/sync.ts` path is not currently called from any UI. Milestone logic in `lib/sync.ts` is duplicated in SyncFlow.

### 12.6 client_risk_flags Mostly Client-Side

The `client_risk_flags` DB table exists with a rich schema (8 flag types, 4 severities, resolution tracking), but flags are currently computed client-side in `useBookClients.ts` (birthday + no-contact only). The DB table is checked first but no process writes to it. Flag types like `aep_review_needed`, `plan_benefit_cut`, `carrier_exit`, `plan_discontinued` are defined but not populated.

### 12.7 is_t65 Not Populated

The `policies.is_t65` column exists but is never set by the edge function or any other flow. T65 (turning 65) detection would need to be computed from client DOB.

### 12.8 One Policy Per Client Per Carrier

The unique constraint `(client_id, carrier_id)` means a client can only have ONE policy per carrier at a time. If a client switches plans within the same carrier, the old policy is overwritten (not preserved as history). Historical plan changes are not tracked.

### 12.9 clients.medicare_number Unique Constraint

The original schema has `UNIQUE(profile_id, medicare_number)` but Humana and Anthem clients have no Medicare number. Later migrations relaxed the NOT NULL constraint, but clients without Medicare numbers bypass this uniqueness check entirely.
