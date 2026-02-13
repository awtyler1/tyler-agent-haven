# Book of Business Import — Codebase Audit & Architecture Plan

**Date:** 2026-02-13
**Purpose:** Comprehensive discovery for the Book Import feature — schema analysis, gap identification, and architecture recommendation.

---

## Part 1: Codebase Discovery

### 1.1 Client/Enrollment Data Model

#### `clients` table
**Migration:** `supabase/migrations/20260121000000_create_production_tables.sql:10`
**Types:** `src/integrations/supabase/types.ts:820`

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| `id` | UUID | PK | `gen_random_uuid()` |
| `profile_id` | UUID | NOT NULL | FK → `profiles.id` ON DELETE CASCADE |
| `medicare_number` | VARCHAR(15) | DB says NOT NULL, types say nullable | **Schema drift** — original migration has NOT NULL, but Humana/Anthem parsers insert NULL. Likely relaxed in production DB without a tracked migration. |
| `first_name` | TEXT | nullable | |
| `last_name` | TEXT | nullable | |
| `middle_initial` | VARCHAR(5) | nullable | |
| `date_of_birth` | DATE | nullable | |
| `phone` | VARCHAR(20) | nullable | |
| `email` | TEXT | nullable | Present in types but not in tracked migration — schema drift |
| `address_line1` | TEXT | nullable | |
| `address_city` | TEXT | nullable | |
| `address_state` | VARCHAR(2) | nullable | |
| `address_zip` | VARCHAR(10) | nullable | |
| `last_contacted_at` | TIMESTAMPTZ | nullable | Added in `20260210000000_bob_command_center_tables.sql` |
| `county_fips` | VARCHAR(5) | nullable | Added in `20260210000000_bob_command_center_tables.sql` |
| `created_at` | TIMESTAMPTZ | NOT NULL | `DEFAULT now()` |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `DEFAULT now()`, auto-trigger |
| `address` | TEXT | nullable | Legacy — in types but not migration. Unused duplicate of `address_line1` |
| `city` | TEXT | nullable | Legacy — duplicate of `address_city` |
| `state` | TEXT | nullable | Legacy — duplicate of `address_state` |
| `zip` | TEXT | nullable | Legacy — duplicate of `address_zip` |
| `dob` | TEXT | nullable | Legacy — duplicate of `date_of_birth` |

**Constraints:**
- `clients_profile_medicare_unique` — UNIQUE(profile_id, medicare_number) — **PROBLEM: won't work for NULL medicare_number records (Humana, Anthem)**
- `clients_profile_id_fkey` — FK to `profiles`

**Indexes:**
- `idx_clients_profile_id` on `profile_id`
- `idx_clients_medicare_number` on `medicare_number`
- `idx_clients_last_name` on `last_name`
- `idx_clients_last_contacted` on `last_contacted_at` (partial, WHERE NOT NULL)

**RLS Policies:**
- Agent sees own: `profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())`
- Admin sees all: `has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin')`
- Service role full access

**Relationships:**
- `clients.profile_id` → `profiles.id` (agent ownership)
- `policies.client_id` → `clients.id` (one-to-many)

---

#### `policies` table
**Migration:** `supabase/migrations/20260121000000_create_production_tables.sql:125`
**Types:** `src/integrations/supabase/types.ts:1785`

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| `id` | UUID | PK | |
| `client_id` | UUID | NOT NULL | FK → `clients.id` ON DELETE CASCADE |
| `carrier_id` | UUID | NOT NULL | FK → `carriers.id` |
| `profile_id` | UUID | nullable | FK → `profiles.id` ON DELETE CASCADE |
| `carrier_member_id` | TEXT | nullable | Carrier's internal member ID |
| `plan_name` | TEXT | nullable | |
| `plan_type` | TEXT | nullable | 'MA', 'PDP', 'MEDIGAP', 'OTHER' — added in commission migration |
| `effective_date` | DATE | NOT NULL | |
| `term_date` | DATE | nullable | |
| `status` | VARCHAR(20) | DEFAULT 'active' | 'active' or 'termed' |
| `is_t65` | BOOLEAN | DEFAULT false | Added in commission migration |
| `source_upload_id` | UUID | nullable | FK → `production_uploads.id` |
| `last_seen_upload_id` | UUID | nullable | FK → `production_uploads.id` |
| `last_seen_at` | TIMESTAMPTZ | DEFAULT now() | |
| `created_at` | TIMESTAMPTZ | NOT NULL | |
| `updated_at` | TIMESTAMPTZ | NOT NULL | |

**Constraints:**
- `policies_client_carrier_unique` — UNIQUE(client_id, carrier_id) — **PROBLEM: prevents a client from having multiple policies with the same carrier (e.g., MA + PDP with Aetna)**

**Indexes:**
- `idx_policies_client_id`, `idx_policies_carrier_id`, `idx_policies_profile_id`
- `idx_policies_status`, `idx_policies_effective_date`, `idx_policies_plan_type`
- `idx_policies_profile_carrier_status` — composite for `get_carrier_book_stats` RPC

**RLS:** Same pattern as clients (agent sees own, admin sees all, service role full).

---

#### `production_uploads` table
**Migration:** `supabase/migrations/20260121000000_create_production_tables.sql:237`
**Types:** `src/integrations/supabase/types.ts:1920`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK |
| `profile_id` | UUID | NOT NULL, FK → profiles |
| `carrier_id` | UUID | NOT NULL, FK → carriers |
| `file_name` | TEXT | NOT NULL |
| `file_hash` | TEXT | nullable — exists in types but not in migration |
| `status` | VARCHAR(20) | 'pending', 'processing', 'complete', 'error' |
| `records_total` | INTEGER | nullable |
| `records_imported` | INTEGER | nullable |
| `records_updated` | INTEGER | nullable |
| `records_skipped` | INTEGER | nullable |
| `error_message` | TEXT | nullable |
| `completed_at` | TIMESTAMPTZ | nullable |
| `created_at` | TIMESTAMPTZ | NOT NULL |

---

#### Supporting tables

**`client_interactions`** — `20260210000000_bob_command_center_tables.sql:10`
Agent interaction log (calls, emails, texts, meetings, notes). FK to clients and profiles.

**`client_risk_flags`** — `20260210000000_bob_command_center_tables.sql:51`
Computed/manual risk flags for retention tracking. Types: no_contact_90, birthday_upcoming, etc.

**`monthly_syncs`** — Tracks monthly sync sessions. Has `total_clients`, `new_clients`, `termed_clients`, `previous_month_clients`, `status`.

**`sync_carrier_uploads`** — Per-carrier upload records within a monthly sync. Links `sync_id` → `monthly_syncs.id`, `carrier_id`, `production_upload_id`.

**`commission_rates`** — CMS commission rates by year/plan_type. Read-only reference table.

**`cms_plans`** — ~40 benefit columns per plan. Used by Plan Finder. `carrier_id` FK.

---

#### RPC Functions

**`get_carrier_book_stats(p_profile_id, p_carrier_id, p_month_start, p_month_end)`**
Returns JSON: `{ active_count, new_count, termed_count }` from policies table. Used by SyncFlow for accurate post-upload counts.
Migration: `20260205000001_add_carrier_book_stats_rpc.sql`

---

### 1.2 Smart Sync / BOB Report Feature — Full Data Flow

**Files involved:**

| File | Role |
|------|------|
| `src/pages/SyncFlow.tsx` | Multi-step upload UI (~1600 lines) |
| `src/lib/sync.ts` | Sync orchestration (init, status, complete, milestones) |
| `supabase/functions/parse-production-report/index.ts` | Edge function: parse + dedup + write |
| `src/config/carriers.ts` | Carrier definitions (supported: aetna, wellcare, humana, anthem) |

**Flow:**

1. **SyncFlow.tsx** — Agent opens `/sync`. Calls `initializeSync()` which creates a `monthly_syncs` record + `sync_carrier_uploads` placeholders for each contracted carrier.

2. **File selection** — Agent picks a file per carrier. Client-side `parseFileForClientCount()` does a quick header-based row count for instant feedback (no dedup, no DB writes — just line counting).

3. **Background edge function** — `parse-production-report` is invoked with base64-encoded file content + carrier_code + profile_id.

4. **Server-side parsing** — The edge function:
   - Detects file type (CSV vs XLSX magic bytes)
   - Routes to carrier-specific parser (Aetna/WellCare/Humana/Anthem)
   - Each parser maps carrier-specific column names to a normalized `ParsedRow` interface
   - Creates a `production_uploads` record with status='processing'

5. **Dedup + write** — For each parsed row:
   - `findOrCreateClient()` — matching priority:
     1. `medicare_number` match (profile_id + medicare_number) — Aetna, WellCare
     2. `first_name + last_name + date_of_birth` (case-insensitive) — Humana
     3. `carrier_member_id` via policies table, then `first_name + last_name` only — Anthem
   - If found: updates existing client with non-null fields
   - If not found: creates new client record
   - `upsertPolicy()` — matches on `client_id + carrier_id`, creates or updates

6. **Completion** — Updates `production_uploads` with stats, calls `completeSyncUpload()` to mark the carrier done, then `get_carrier_book_stats` RPC for accurate counts.

7. **Sync finalization** — When all carriers are done, `completeSync()` calculates totals, updates `monthly_syncs`, checks milestones.

**Key observation:** The dedup logic lives **entirely inside the edge function** (`findOrCreateClient` at line 577). It's not a shared utility — it's embedded in the parse-production-report handler. Both the matching logic and the DB writes are tightly coupled.

---

### 1.3 RTS Import Feature — Full Data Flow

**Files involved:**

| File | Role |
|------|------|
| `src/pages/admin/RTSImportPage.tsx` | Admin upload UI (file picker, result display) |
| `src/lib/rtsImport.ts` | All import logic (parse, match, upsert) |

**Flow:**

1. **Admin uploads Pinnacle .xlsx** — Simple `<input type="file">` with `.xlsx` filter.
2. **Client-side parsing** — Uses `xlsx` library. Reads "Certs" sheet.
3. **NPN matching** — Builds `NPN → profile` lookup map. Creates stub profiles for unknown NPNs.
4. **Certification processing** — Parses carrier columns (format "Carrier: Product"), upserts to `agent_certifications`.
5. **Carrier status updates** — For current-year certifications, upserts `carrier_statuses` to 'contracted'.
6. **Logging** — Inserts to `rts_import_logs`.

**Pattern established:** 6-phase approach (build lookups → identify gaps → create missing records → batch upsert → update statuses → log). All client-side, no edge function. Good batch processing (500-record batches).

**No preview/review step** — Direct import on file upload.

---

### 1.4 File Upload Patterns

| Feature | Component | Drag & Drop | File Types | Preview Step | CSV Parser |
|---------|-----------|-------------|------------|--------------|------------|
| Smart Sync | UploadModal (`src/components/book-of-business/UploadModal.tsx`) | Yes | .csv, .xlsx | Carrier detection + mismatch dialog | Custom hand-rolled (edge fn) |
| RTS Import | Custom drag-drop in RTSImportPage | Yes | .xlsx | No (direct import) | xlsx library |
| Contracting Docs | FileDropZone (`src/components/contracting/FileDropZone.tsx`) | Yes | .pdf, .jpg, .png | Optional expiration date dialog | N/A |
| Document Upload | Various admin pages | No | Various | No | N/A |

**Existing reusable components:**
- `src/components/contracting/FileDropZone.tsx` — Drag-and-drop with file type validation, upload progress, remove button. Accepts configurable file types. **Could be generalized** for Book Import.
- `src/components/book-of-business/UploadModal.tsx` — Multi-step wizard (select-carrier → upload-file → processing → success). Has carrier detection built in.
- `src/lib/carrier-detection.ts` — **Header-based carrier auto-detection** with confidence scoring. Already handles Aetna, Humana, WellCare, Anthem signatures. Can be extended for SunFire/Connecture.
- `src/contexts/UploadContext.tsx` — Global upload state that survives modal closes. Tracks reading → processing → saving → complete stages.
- `src/components/book-of-business/UploadProgressAnimated.tsx` — 3-stage animated progress indicator.
- `src/components/book-of-business/GlobalUploadIndicator.tsx` — Floating bottom-right progress pill for background uploads.

**CSV parsing:** Custom hand-rolled parser in the edge function (`parseCSV`, `parseCSVLine`). No PapaParse or similar library. Client-side SyncFlow also has its own `parseCSVLine` copy for fast counting.

**XLSX parsing:** `xlsx` (SheetJS) library — used by both RTS import (client-side) and edge function (Deno import). Loaded dynamically to save ~425KB from initial bundle.

---

### 1.5 Agent-Client Data Model

**Ownership:** `clients.profile_id` → `profiles.id`. Each client belongs to exactly one agent. There is no shared client concept — if two agents have the same human client, they are separate records.

**No junction table** between agents and clients — it's a direct FK.

**`policies.profile_id`** also links to the agent (denormalized from `clients.profile_id` for query convenience in the `get_carrier_book_stats` RPC).

**Agent schema (key columns):** `profiles` has `id`, `user_id` (nullable for imported agents), `full_name`, `email`, `npn`, `manager_id`, `onboarding_status`, `is_active`, `last_sync_at`, `assigned_carriers`, `excluded_carriers`.

---

### 1.6 Admin UI Patterns

**Route structure** (`src/App.tsx:186-201`):
```
/admin                     → AdminDashboard
/admin/agents              → AgentsPage
/admin/agents/new          → NewAgentPage
/admin/agents/book         → AgentsBookPage
/admin/agents/:agentId/book → AgentBookDetailPage
/admin/agents/:profileId   → AgentProfilePage
/admin/users/:userId       → UserDetailPage
/admin/contracting         → ContractingQueuePage
/admin/rts-import          → RTSImportPage        ← closest precedent
/admin/roadmaps            → RoadmapGeneratorPage
/admin/documents           → DocumentManagementPage
/admin/activity-log        → ActivityLogPage (super_admin)
/admin/labs                → LabsPage (super_admin)
/admin/pdf-builder         → PdfBuilderPage (super_admin)
```

**Where Book Import fits:** `/admin/book-import` — parallel to `/admin/rts-import`. Both are admin data import tools.

**Shell:** `AdminShell` wraps all admin routes. Requires `requireAdmin` role.

**Shared components:** Shadcn/ui primitives (`Button`, `Card`, `Table`, etc.) in `src/components/ui/`. No shared admin page layout wrapper beyond the shell.

---

### 1.7 Supabase Edge Functions (27 total)

| Function | Purpose | Writes To |
|----------|---------|-----------|
| `parse-production-report` | **Parse carrier CSVs → clients + policies** | clients, policies, production_uploads |
| `create-agent` | Create new agent profile | profiles |
| `send-setup-link` | Email setup link to agent | — |
| `validate-password` | Password validation | — |
| `create-admin` | Create admin user | profiles, user_roles |
| `delete-user` | Delete user | profiles |
| `reset-user-password` | Reset password | auth.users |
| `generate-contracting-pdf` | PDF generation | — |
| `send-contracting-packet` | Email contracting packet | — |
| `delete-contracting-application` | Delete app | contracting_applications |
| `agent-chat` | AI chat | — |
| `agent-chat-rag` | RAG-powered chat | — |
| `process-document` | Document processing | document_chunks |
| `microsoft-oauth-*` | Outlook integration | — |
| `microsoft-send-email` | Send via Outlook | — |
| `generate-growth-plan-pdf*` | Growth plan PDF | — |
| `generate-pdf-structure` | PDF builder | — |
| `extract-pdf-fields` | PDF field extraction | — |
| `pdf-field-audit` | PDF audit | — |
| `get-invite-link` | Get agent invite link | — |
| `promote-to-admin` | Promote user role | user_roles |
| `reset-contracting-status` | Reset contracting | contracting_applications |
| `send-agent-inquiry` | Send inquiry email | — |
| `fetch-edge-logs` | Fetch logs | — |

Only `parse-production-report` writes to the client/policy data layer.

---

### 1.8 BOB Dashboard

**Agent-facing pages** (`src/pages/book/`):
- `ClientList.tsx` — Master-detail list view. Uses `useBookClients` hook.
- `GrowthIncome.tsx` — Growth & income projections.
- `BookDashboard.tsx` — Dashboard cards (exists but may not be directly routed).

**`useBookClients` hook** (`src/hooks/useBookClients.ts`):
- Fetches `clients` with nested `policies` and `carriers` for the logged-in agent
- Also fetches `client_risk_flags` for attention indicators
- Computes client-side attention flags (birthday upcoming, no contact 90d)
- Returns filtered + searched client list with carrier filter support

**Admin-facing pages:**
- `AgentsBookPage.tsx` (`/admin/agents/book`) — Admin view of all agents' book metrics
- `AgentBookDetailPage.tsx` (`/admin/agents/:agentId/book`) — Single agent's book detail

**Data source:** Direct Supabase queries on `clients` + `policies` tables. No caching layer beyond TanStack Query.

---

## Part 2: Gap Analysis

### 2.1 Schema Gaps

| Required Field | Current Status | Action Needed |
|----------------|---------------|---------------|
| MBI (Medicare Beneficiary Identifier) | `medicare_number` exists but has NOT NULL constraint (problematic for Humana/Anthem) | **Confirm DB state** — if NOT NULL is still enforced, add migration to DROP NOT NULL. If already relaxed, add tracked migration. |
| DOB | `date_of_birth` exists (DATE) | Already present. Also has legacy `dob` column (TEXT). |
| ZIP | `address_zip` exists (VARCHAR(10)) | Already present. Also has legacy `zip` column. |
| Current plan | `policies.plan_name` exists | Already present via join. |
| Current carrier | `policies.carrier_id` → `carriers` | Already present via join. |
| Effective date | `policies.effective_date` exists | Already present. |
| Part A date | **MISSING** | Need `part_a_date DATE` on `clients` |
| Part B date | **MISSING** | Need `part_b_date DATE` on `clients` |
| Phone | `phone` exists | Already present. |
| Email | `email` exists (in types, likely in DB) | Need tracked migration if not in migrations. |
| Source tracking | **MISSING** | Need `source VARCHAR(30)` on `clients` — 'SMART_SYNC', 'BOOK_IMPORT', 'MANUAL' |
| Source file | `production_uploads.file_name` exists for Smart Sync uploads | Need `import_batch_id` FK on `clients` for Book Import source tracking |
| Imported at | `created_at` exists but is not import-specific | The `source` + `import_batch_id` fields cover this |
| County FIPS | `county_fips` exists | Already present (added in BOB Command Center migration). |

**Legacy column cleanup:** The `address`, `city`, `state`, `zip`, `dob` columns are duplicates. Not blocking but should be cleaned up eventually.

---

### 2.2 Dedup Readiness

**Current state:**
- UNIQUE constraint: `(profile_id, medicare_number)` — **Partial.** Only works for clients with MBI. NULL medicare_number values bypass this constraint (Postgres UNIQUE ignores NULLs).
- No unique constraint on `(profile_id, last_name, date_of_birth)` or any other fallback key.
- No dedup index optimized for name+DOB matching.

**What exists in the edge function** (not DB-enforced):
1. MBI exact match: `WHERE profile_id = X AND medicare_number = Y`
2. Name + DOB: `WHERE profile_id = X AND first_name ILIKE Y AND last_name ILIKE Z AND date_of_birth = D`
3. Carrier member ID: via policies table lookup
4. Name only: `WHERE profile_id = X AND first_name ILIKE Y AND last_name ILIKE Z`

**Indexes needed for Book Import dedup performance:**

```sql
-- For MBI-based matching (already exists)
-- idx_clients_medicare_number ON clients(medicare_number)

-- For name+DOB matching (NEW)
CREATE INDEX idx_clients_dedup_name_dob
  ON clients(profile_id, LOWER(last_name), LOWER(first_name), date_of_birth);

-- For name-only matching (NEW - low priority, fragile strategy)
CREATE INDEX idx_clients_dedup_name_only
  ON clients(profile_id, LOWER(last_name), LOWER(first_name));
```

**Key issue:** The UNIQUE constraint `(profile_id, medicare_number)` with NOT NULL on `medicare_number` means **no Humana or Anthem clients can be stored** if the NOT NULL is still enforced. The edge function's `findOrCreateClient` inserts with `medicare_number: null` for these carriers, which would fail. This confirms the constraint was likely relaxed in production.

---

### 2.3 Smart Sync Refactor Scope

**Current dedup logic location:** `supabase/functions/parse-production-report/index.ts`, lines 577-703 (`findOrCreateClient` + `upsertPolicy`).

**Extraction difficulty: MEDIUM.** The dedup logic is cleanly scoped to two functions but they:
- Take a Supabase client instance as parameter (good — injectable)
- Use carrier-specific branching (MBI path vs name+DOB path vs name-only) based on data presence (good — data-driven, not carrier-driven)
- Are not truly carrier-specific — the matching logic is based on what fields are available, not which carrier

**Recommended approach:**
1. Extract `findOrCreateClient` and `upsertPolicy` into a shared module within the edge function's `_shared/` directory
2. Both `parse-production-report` and a new `import-book` edge function import from the shared module
3. Zero changes needed to the matching logic itself — it already handles all cases

**Refactor scope:** ~150 lines extracted from `parse-production-report/index.ts` into `_shared/clientDedup.ts`. The edge function's `findOrCreateClient` and `upsertPolicy` become thin wrappers.

---

### 2.4 Missing Infrastructure

#### New tables needed:

**`book_import_batches`** — Audit trail + staging container for import sessions:
```
id, profile_id (target agent), uploaded_by (admin who uploaded),
source_format (sunfire|connecture|carrier_report|freeform),
file_name, file_size_bytes, status (staged|reviewing|committed|failed|cancelled),
total_records, new_records, updated_records, skipped_records, duplicate_records,
column_mapping JSONB, validation_errors JSONB,
staged_at, committed_at, created_at
```

**`book_import_staged_records`** — Parsed but not-yet-committed records for review:
```
id, batch_id FK, row_number,
raw_data JSONB (original row),
mapped_data JSONB (normalized to client schema),
match_type (new|update_mbi|update_name_dob|update_name|ambiguous),
matched_client_id UUID nullable (existing client this would merge into),
validation_status (valid|warning|error),
validation_messages JSONB,
is_selected BOOLEAN DEFAULT true (user can deselect in review),
created_at
```

#### New edge function:
**`import-book-of-business`** — Server-side parsing for large files + dedup resolution. Shares `_shared/clientDedup.ts` with `parse-production-report`.

#### New RLS policies:
- `book_import_batches` and `book_import_staged_records` need admin-only write + target agent read policies.

---

### 2.5 File Upload UX

**Existing components that can be adapted:**
- `FileDropZone` (contracting) — Has drag-drop + file type validation + progress. Currently scoped to PDFs/images but the interface is generalizable.
- `UploadModal` (book-of-business) — Full multi-step wizard with carrier detection. Close to what Book Import needs but tightly coupled to the Smart Sync flow.
- `carrier-detection.ts` — Header-based carrier auto-detection. Already works for the 4 supported carrier report formats.

**Still need to build:**
- A generalized `FileDropZone` for CSV/XLSX in `src/components/import/` (adapt from contracting version)
- Column mapping UI for freeform imports
- Staged record review table (the main new UX piece — nothing like this exists today)
- File preview (show first few rows of parsed data before committing)

---

## Part 3: Architecture Recommendation

### 3.1 Data Architecture — Migration SQL

```sql
-- Migration: Book of Business Import schema
-- Creates staging tables, adds missing columns, fixes constraints

-- =============================================================================
-- FIX: Ensure medicare_number is nullable (may already be in production)
-- =============================================================================
ALTER TABLE public.clients
  ALTER COLUMN medicare_number DROP NOT NULL;

-- Remove the unique constraint that doesn't work with NULLs
ALTER TABLE public.clients
  DROP CONSTRAINT IF EXISTS clients_profile_medicare_unique;

-- Replace with a partial unique index (only enforced when medicare_number is NOT NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_profile_medicare_unique
  ON public.clients(profile_id, medicare_number)
  WHERE medicare_number IS NOT NULL;

-- =============================================================================
-- ADD: Missing columns on clients
-- =============================================================================
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS part_a_date DATE;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS part_b_date DATE;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS source VARCHAR(30) DEFAULT 'SMART_SYNC';
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS import_batch_id UUID;

COMMENT ON COLUMN public.clients.part_a_date IS 'Medicare Part A effective date';
COMMENT ON COLUMN public.clients.part_b_date IS 'Medicare Part B effective date';
COMMENT ON COLUMN public.clients.source IS 'Data source: SMART_SYNC, BOOK_IMPORT, MANUAL';
COMMENT ON COLUMN public.clients.import_batch_id IS 'FK to book_import_batches if imported via Book Import';

-- =============================================================================
-- ADD: Dedup indexes
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_clients_dedup_name_dob
  ON public.clients(profile_id, LOWER(last_name), LOWER(first_name), date_of_birth)
  WHERE date_of_birth IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clients_dedup_name_only
  ON public.clients(profile_id, LOWER(last_name), LOWER(first_name));

-- =============================================================================
-- FIX: policies unique constraint (allow multiple policies per carrier per client)
-- =============================================================================
-- Current: UNIQUE(client_id, carrier_id) — too restrictive (blocks MA + PDP with same carrier)
-- New: UNIQUE(client_id, carrier_id, plan_type) — allows different plan types
ALTER TABLE public.policies
  DROP CONSTRAINT IF EXISTS policies_client_carrier_unique;

CREATE UNIQUE INDEX IF NOT EXISTS idx_policies_client_carrier_plan_unique
  ON public.policies(client_id, carrier_id, COALESCE(plan_type, 'OTHER'));

-- =============================================================================
-- NEW TABLE: book_import_batches
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.book_import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
  source_format VARCHAR(30) NOT NULL,
    -- 'sunfire', 'connecture', 'carrier_report', 'freeform'
  file_name TEXT NOT NULL,
  file_size_bytes INTEGER,
  status VARCHAR(20) NOT NULL DEFAULT 'staged',
    -- 'parsing', 'staged', 'reviewing', 'committing', 'committed', 'failed', 'cancelled'
  column_mapping JSONB,
    -- For freeform imports: { "source_col": "target_col", ... }
  total_records INTEGER DEFAULT 0,
  new_records INTEGER DEFAULT 0,
  updated_records INTEGER DEFAULT 0,
  skipped_records INTEGER DEFAULT 0,
  duplicate_records INTEGER DEFAULT 0,
  error_message TEXT,
  staged_at TIMESTAMPTZ,
  committed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_import_batches_profile ON public.book_import_batches(profile_id);
CREATE INDEX idx_import_batches_status ON public.book_import_batches(status);
CREATE INDEX idx_import_batches_created ON public.book_import_batches(created_at DESC);

ALTER TABLE public.book_import_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage import batches"
ON public.book_import_batches FOR ALL
USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage import batches"
ON public.book_import_batches FOR ALL
USING (auth.role() = 'service_role');

COMMENT ON TABLE public.book_import_batches IS 'Tracks book of business import sessions with audit trail';

-- =============================================================================
-- NEW TABLE: book_import_staged_records
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.book_import_staged_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.book_import_batches(id) ON DELETE CASCADE,
  row_number INTEGER NOT NULL,
  raw_data JSONB NOT NULL,
    -- Original row as parsed from the file
  mapped_data JSONB NOT NULL,
    -- Normalized to client schema fields
  match_type VARCHAR(20) NOT NULL DEFAULT 'new',
    -- 'new', 'update_mbi', 'update_name_dob', 'update_name', 'ambiguous', 'skip'
  matched_client_id UUID REFERENCES public.clients(id),
    -- If this would merge into an existing client
  validation_status VARCHAR(10) NOT NULL DEFAULT 'valid',
    -- 'valid', 'warning', 'error'
  validation_messages JSONB DEFAULT '[]'::jsonb,
  is_selected BOOLEAN NOT NULL DEFAULT true,
    -- User can deselect rows in the review step
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_staged_records_batch ON public.book_import_staged_records(batch_id);
CREATE INDEX idx_staged_records_match ON public.book_import_staged_records(match_type);
CREATE INDEX idx_staged_records_status ON public.book_import_staged_records(validation_status);

ALTER TABLE public.book_import_staged_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage staged records"
ON public.book_import_staged_records FOR ALL
USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage staged records"
ON public.book_import_staged_records FOR ALL
USING (auth.role() = 'service_role');

COMMENT ON TABLE public.book_import_staged_records IS 'Staged records from book import, pending review before commit';

-- =============================================================================
-- ADD: FK from clients to import batches
-- =============================================================================
ALTER TABLE public.clients
  ADD CONSTRAINT clients_import_batch_fkey
  FOREIGN KEY (import_batch_id)
  REFERENCES public.book_import_batches(id) ON DELETE SET NULL;
```

---

### 3.2 Shared Dedup Service

**Location:** `supabase/functions/_shared/clientDedup.ts`

**Interface:**
```typescript
interface ClientMatchResult {
  clientId: string | null;       // null = no match (new client)
  matchType: 'mbi' | 'name_dob' | 'name_only' | 'carrier_member_id' | 'none';
  confidence: 'exact' | 'high' | 'medium' | 'low';
}

// Find existing client (read-only — no writes)
async function findExistingClient(
  supabase: SupabaseClient,
  profileId: string,
  row: ParsedRow,
  carrierId?: string
): Promise<ClientMatchResult>;

// Create or update client (write)
async function upsertClient(
  supabase: SupabaseClient,
  profileId: string,
  row: ParsedRow,
  matchResult: ClientMatchResult
): Promise<{ clientId: string; isNew: boolean }>;

// Create or update policy (write)
async function upsertPolicy(
  supabase: SupabaseClient,
  clientId: string,
  carrierId: string,
  profileId: string,
  row: ParsedRow,
  sourceUploadId?: string
): Promise<{ isNew: boolean }>;
```

**Why edge function (not client-side or Postgres function):**
- **Not client-side:** Dedup requires querying existing client data. Doing N queries from the browser for N rows would be slow and expose the data model. The edge function has service_role access and can batch efficiently.
- **Not Postgres function:** The matching logic has branching complexity (MBI → name+DOB → carrier_member_id → name_only) that's clearer in TypeScript. Postgres functions are better for set operations, not row-by-row conditional matching.
- **Edge function shared module:** Both `parse-production-report` and `import-book-of-business` import the same `_shared/clientDedup.ts`. The matching logic is defined once. If we improve it (e.g., add fuzzy matching), both flows benefit.

**How they call it:**

- **Smart Sync** (`parse-production-report`): Calls `findExistingClient()` + `upsertClient()` + `upsertPolicy()` per row, same as today but using the shared functions.
- **Book Import** (`import-book-of-business`): Phase 1 calls `findExistingClient()` for all rows to build the staged preview (read-only). Phase 2 (commit) calls `upsertClient()` + `upsertPolicy()` for selected rows.

---

### 3.3 Import Pipeline Architecture

**End-to-end flow:**

```
┌──────────────┐    ┌──────────────┐    ┌──────────────────┐    ┌──────────────┐
│  1. Upload   │───→│  2. Parse +  │───→│  3. Review +     │───→│  4. Commit   │
│  & Detect    │    │  Map + Stage │    │  Resolve         │    │              │
└──────────────┘    └──────────────┘    └──────────────────┘    └──────────────┘
  Client-side         Edge Function       Client-side            Edge Function
  - File drop         - Format detect     - Show staged data     - Write to clients
  - Type check        - Parse CSV/XLSX    - Dedup results        - Write to policies
  - Select agent      - Column mapping    - User selects rows    - Update batch status
  - Upload to EF      - Dedup matching    - Resolve ambiguous    - Return stats
                      - Stage records     - Edit mapped values
                      - Return preview
```

**Step 1 — Upload & Detect (Client-side):**
- Admin selects target agent from dropdown
- Drops/selects file (CSV or XLSX)
- Selects source format: SunFire, Connecture, Carrier Report, or "Custom/Unknown"
- Client reads first 5 rows for quick preview before sending to server
- Sends to `import-book-of-business` edge function

**Step 2 — Parse + Map + Stage (Edge Function `import-book-of-business`):**
- Auto-detects format if not specified (by checking header patterns)
- Parses entire file
- For known formats (SunFire, Connecture, carrier reports): applies known column mapping
- For freeform: returns headers to client for manual mapping → client sends mapping → EF re-processes
- For each row: calls `findExistingClient()` to determine match type
- Writes all rows to `book_import_staged_records`
- Updates `book_import_batches` with stats
- Returns staged data summary to client

**Step 3 — Review + Resolve (Client-side):**
- Shows data table with match indicators:
  - Green checkmark: New client (no match found)
  - Blue merge icon: Will update existing (MBI match)
  - Yellow warning: Name-only match (low confidence)
  - Red flag: Validation error (missing required fields)
- User can:
  - Toggle individual rows on/off
  - Fix validation errors inline
  - Resolve ambiguous matches
  - See before/after for update matches
- "Commit Import" button when ready

**Step 4 — Commit (Edge Function):**
- Reads selected staged records
- Calls `upsertClient()` + `upsertPolicy()` for each
- Sets `clients.source = 'BOOK_IMPORT'` and `clients.import_batch_id`
- Updates batch status to 'committed' with final stats
- Returns summary

**Where staged records live:** `book_import_staged_records` table. TTL: staged records from cancelled/expired batches can be cleaned up via a cron or manual cleanup (batches older than 7 days with status 'staged' → auto-cancel).

**Format auto-detection:** Check first row headers against known patterns:
- SunFire: Look for "Beneficiary ID", "Plan ID", "Enrollment Date"
- Connecture: Look for "MBI", "Plan Name", "Effective Date" with Connecture-specific column names
- Carrier reports: Same headers the existing parsers already know (delegates to Aetna/WellCare/Humana/Anthem parsers)
- Freeform: Anything else → column mapping UI

---

### 3.4 Refactoring Plan

**Priority 1 — Must change before Book Import:**

| File | Change | Why |
|------|--------|-----|
| `supabase/functions/_shared/clientDedup.ts` | **CREATE** — Extract `findExistingClient`, `upsertClient`, `upsertPolicy` | Shared dedup service |
| `supabase/functions/parse-production-report/index.ts` | **MODIFY** — Import from `_shared/clientDedup.ts` instead of inline functions | Share dedup logic |
| New migration SQL (see §3.1) | **CREATE** — Schema changes | Data model support |

**Priority 2 — Build with Book Import:**

| File | Change | Why |
|------|--------|-----|
| `supabase/functions/import-book-of-business/index.ts` | **CREATE** — New edge function | Parse + stage + commit pipeline |
| `src/pages/admin/BookImportPage.tsx` | **CREATE** — Multi-step import UI | Admin upload flow |
| `src/components/import/FileDropZone.tsx` | **CREATE** — Reusable file drop component | Shared upload UX |
| `src/components/import/ColumnMapper.tsx` | **CREATE** — Column mapping UI for freeform imports | Map unknown columns |
| `src/components/import/StagedRecordReview.tsx` | **CREATE** — Data table with match indicators | Review before commit |
| `src/components/import/ImportSummary.tsx` | **CREATE** — Post-commit stats display | Completion screen |
| `src/hooks/useBookImport.ts` | **CREATE** — State management for multi-step flow | Hook for import page |
| `src/App.tsx` | **MODIFY** — Add route `/admin/book-import` | Routing |

**Priority 3 — Can refactor later:**

| File | Change | Why |
|------|--------|-----|
| Legacy client columns (`address`, `city`, `state`, `zip`, `dob`) | **MIGRATE** — Data consolidation then drop | Schema cleanup |
| `src/pages/SyncFlow.tsx` client-side parser | **REFACTOR** — Could share CSV parsing logic | DRY (low priority) |

---

### 3.5 Implementation Phases

#### Phase 1: Schema + Shared Dedup Service
**Complexity: Medium**

- [ ] Create and apply migration SQL from §3.1
- [ ] Create `supabase/functions/_shared/clientDedup.ts` with extracted dedup logic
- [ ] Refactor `parse-production-report/index.ts` to use shared module
- [ ] Test Smart Sync still works identically after refactor
- [ ] Regenerate Supabase types (`npx supabase gen types typescript`)

**Files created:**
- `supabase/migrations/20260214000000_book_import_schema.sql`
- `supabase/functions/_shared/clientDedup.ts`

**Files modified:**
- `supabase/functions/parse-production-report/index.ts`
- `src/integrations/supabase/types.ts` (regenerated)

---

#### Phase 2: Book Import UI + Pipeline
**Complexity: Large**

- [ ] Create `import-book-of-business` edge function (parse, stage, commit endpoints)
- [ ] Build format-specific parsers (SunFire, Connecture) + format auto-detection
- [ ] Create `FileDropZone` component
- [ ] Create `BookImportPage` with multi-step flow:
  - Step 1: Select agent + upload file + select/detect format
  - Step 2: Column mapping (for freeform) or auto-map confirmation
  - Step 3: Review staged records with match indicators
  - Step 4: Commit + summary
- [ ] Add admin route and navigation link
- [ ] Add `useBookImport` hook for state management

**Files created:**
- `supabase/functions/import-book-of-business/index.ts`
- `src/pages/admin/BookImportPage.tsx`
- `src/components/import/FileDropZone.tsx`
- `src/components/import/ColumnMapper.tsx`
- `src/components/import/StagedRecordReview.tsx`
- `src/components/import/ImportSummary.tsx`
- `src/hooks/useBookImport.ts`

**Files modified:**
- `src/App.tsx` (add route)

---

#### Phase 3: Refactor Smart Sync to use shared dedup
**Complexity: Small**

Already largely done in Phase 1. This phase is about:
- [ ] Ensuring `parse-production-report` sets `source = 'SMART_SYNC'` on new clients
- [ ] Adding `source` awareness to the BOB dashboard UI
- [ ] Testing cross-flow dedup (import a client via Book Import, then see it matched during Smart Sync)

**Files modified:**
- `supabase/functions/parse-production-report/index.ts` (add source field)
- `src/hooks/useBookClients.ts` (display source indicator)
- `src/components/book/ClientDetail.tsx` (show import source)

---

#### Phase 4: Enhancements
**Complexity: Medium-Large**

- [ ] Claude API column auto-mapping for freeform CSV (analyze headers + sample data → suggest mapping)
- [ ] Carrier format auto-detection (fingerprint known header patterns)
- [ ] Bulk import progress (WebSocket or polling for large files)
- [ ] Import history page (list past batches, re-download, see stats)
- [ ] Agent-facing import (let agents upload their own book — optional)
- [ ] Fuzzy name matching (Levenshtein distance for typos/variations)

---

### 3.6 Risks & Decisions Needed

#### Product Decisions Required:

1. **Admin-only or agent-facing too?**
   Recommendation: Start admin-only (Phase 2). Agent self-upload can be Phase 4 — it requires different RLS policies and more guardrails.

2. **Should existing clients be backfilled with source='SMART_SYNC'?**
   Recommendation: Yes, via a one-time UPDATE in the migration: `UPDATE clients SET source = 'SMART_SYNC' WHERE source IS NULL`. All existing clients came from Smart Sync.

3. **Agent assignment conflicts — what if the imported book includes clients already assigned to a DIFFERENT agent?**
   Current model: Each client belongs to one agent (profile_id). If Agent B imports a client that Agent A already has, they'd be separate records. This is correct for the use case (agents have independent books). No cross-agent dedup needed unless you want a global client registry (recommend: don't).

4. **File size limits?**
   Recommendation: 10MB max for the edge function (Supabase default). For GA-level bulk imports (thousands of records), consider chunked processing. SunFire exports for a typical agent are 50-500 rows — well within limits.

5. **How to handle carrier_id for imported records?**
   Book imports may not come from a specific carrier report. Options:
   - (a) Require carrier selection per import — restrictive but clean
   - (b) Auto-detect from plan names using `derivePlanType` + carrier name matching
   - (c) Allow "unknown" carrier and let admin assign later

   Recommendation: (b) with fallback to (c). Parse plan names to identify carrier, allow manual override in review step.

6. **How to handle policies from Book Import?**
   Current `policies_client_carrier_unique` constraint = one policy per carrier per client. The migration in §3.1 changes this to `(client_id, carrier_id, plan_type)`. Confirm this is desired — it allows MA + PDP from same carrier.

7. **SunFire/Connecture format specs?**
   I don't have sample files for these formats. Before building parsers, we need sample CSVs from each platform to identify exact column names and data formats. The architecture supports adding new format parsers incrementally.

#### Technical Risks:

1. **Schema drift** — The `clients.medicare_number` NOT NULL situation needs verification against the live database. Run `SELECT is_nullable FROM information_schema.columns WHERE table_name='clients' AND column_name='medicare_number'` to confirm.

2. **Unique constraint change on policies** — Changing from `(client_id, carrier_id)` to `(client_id, carrier_id, plan_type)` requires checking for existing duplicates and backfilling any NULL `plan_type` values first.

3. **Edge function size limits** — The `import-book-of-business` function will handle large files. Supabase edge functions have a ~50MB memory limit and 150-second timeout. For files with 1000+ rows, consider streaming/batch processing.

4. **Staged record cleanup** — `book_import_staged_records` could accumulate if users start imports but never commit. Add a cleanup mechanism (cron job or TTL policy).

---

## Appendix: File Reference

| Path | Lines | Purpose |
|------|-------|---------|
| `supabase/migrations/20260121000000_create_production_tables.sql` | 291 | Creates clients, policies, production_uploads |
| `supabase/migrations/20260128000000_commission_projection_fields.sql` | 101 | Adds plan_type, is_t65, commission_rates |
| `supabase/migrations/20260128000003_add_new_clients_columns.sql` | 14 | Adds new_clients to sync tables |
| `supabase/migrations/20260205000000_add_disenrollment_tracking.sql` | — | Adds termed_clients to sync tables |
| `supabase/migrations/20260205000001_add_carrier_book_stats_rpc.sql` | 25 | get_carrier_book_stats RPC |
| `supabase/migrations/20260210000000_bob_command_center_tables.sql` | 110 | client_interactions, client_risk_flags, new client columns |
| `supabase/functions/parse-production-report/index.ts` | 1021 | Carrier report parser + dedup + writes |
| `supabase/functions/_shared/cors.ts` | — | CORS utilities |
| `supabase/functions/_shared/auth.ts` | — | Auth utilities |
| `src/lib/sync.ts` | 590 | Sync orchestration |
| `src/lib/rtsImport.ts` | 499 | RTS certification import |
| `src/pages/SyncFlow.tsx` | ~1600 | Multi-step sync UI |
| `src/pages/admin/RTSImportPage.tsx` | ~200 | RTS import admin page |
| `src/pages/book/ClientList.tsx` | — | Agent book client list |
| `src/pages/admin/AgentsBookPage.tsx` | — | Admin book overview |
| `src/hooks/useBookClients.ts` | 267 | Client data fetching + filtering |
| `src/integrations/supabase/types.ts` | — | Generated Supabase types |
| `src/lib/carrier-detection.ts` | ~150 | Header-based carrier format auto-detection |
| `src/components/contracting/FileDropZone.tsx` | ~150 | Reusable drag-drop file upload component |
| `src/components/book-of-business/UploadModal.tsx` | ~400 | Multi-step upload wizard with carrier detection |
| `src/contexts/UploadContext.tsx` | ~200 | Global upload state management |
| `src/App.tsx` | — | Route definitions |
