-- ============================================================
-- Book Import Schema
-- Supports bulk book-of-business imports and carrier sync
-- ============================================================

-- 1. book_import_batches — tracks each import session
CREATE TABLE book_import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'staged' CHECK (status IN ('staged', 'committed', 'cancelled')),
  source_mode TEXT NOT NULL CHECK (source_mode IN ('bulk', 'carrier_sync')),
  source_format TEXT,          -- 'connecture', 'sunfire', 'freeform', or carrier code
  detected_format TEXT,        -- what the parser actually detected
  carrier_id UUID REFERENCES carriers(id),  -- null for bulk imports
  file_name TEXT,
  total_records INT DEFAULT 0,
  new_records INT DEFAULT 0,
  updated_records INT DEFAULT 0,
  skipped_records INT DEFAULT 0,
  format_mismatch BOOLEAN DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  committed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

CREATE INDEX idx_book_import_batches_profile ON book_import_batches(profile_id, status);
CREATE INDEX idx_book_import_batches_month ON book_import_batches(profile_id, carrier_id, created_at);


-- 2. book_import_staged_records — parsed rows before agent commits
CREATE TABLE book_import_staged_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES book_import_batches(id) ON DELETE CASCADE,
  row_number INT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'new', 'skipped')),
  skip_reason TEXT,
  raw_data JSONB NOT NULL,     -- original parsed fields
  matched_client_id UUID REFERENCES clients(id),
  match_method TEXT,           -- 'mbi', 'name_dob', 'name_only'
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_staged_records_batch ON book_import_staged_records(batch_id, status);


-- 3. Add manually_edited_fields to clients
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS manually_edited_fields JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN clients.manually_edited_fields IS
  'Array of field names that the agent has manually edited. Import/sync operations skip these fields to preserve agent overrides.';


-- 4. Add source column to clients (tracks how the client entered the system)
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'MANUAL'
    CHECK (source IN ('MANUAL', 'BOOK_IMPORT', 'SMART_SYNC', 'LEAD', 'CONNECTURE', 'SUNFIRE'));


-- 5. Add 'unverified' to clients.status
--    unverified = imported contact awaiting carrier sync confirmation
--    Existing column (added in 20260213) is VARCHAR(20) with no CHECK constraint.
--    We add one now to enforce the allowed lifecycle values.
DO $$
BEGIN
  -- Drop the constraint if it already exists (idempotent)
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'clients_status_check'
    AND conrelid = 'clients'::regclass
  ) THEN
    ALTER TABLE clients DROP CONSTRAINT clients_status_check;
  END IF;

  ALTER TABLE clients ADD CONSTRAINT clients_status_check
    CHECK (status IN ('active', 'inactive', 'lead', 'termed', 'unverified'));
END $$;

COMMENT ON COLUMN clients.status IS 'Client lifecycle: lead, unverified, active, inactive, termed. unverified = imported contact awaiting carrier sync confirmation.';


-- 6. Dedup indexes on clients for efficient matching during imports

-- MBI-based matching (fastest, most reliable)
CREATE INDEX IF NOT EXISTS idx_clients_dedup_mbi
  ON clients(profile_id, medicare_id)
  WHERE medicare_id IS NOT NULL;

-- Name+DOB matching (when MBI unavailable, e.g. Humana)
CREATE INDEX IF NOT EXISTS idx_clients_dedup_name_dob
  ON clients(profile_id, lower(last_name), lower(first_name), date_of_birth)
  WHERE last_name IS NOT NULL;

-- Name-only matching (last resort, e.g. Anthem)
CREATE INDEX IF NOT EXISTS idx_clients_dedup_name_only
  ON clients(profile_id, lower(last_name), lower(first_name))
  WHERE last_name IS NOT NULL;


-- 7. RLS policies — agents can only see their own import data

ALTER TABLE book_import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_import_staged_records ENABLE ROW LEVEL SECURITY;

-- Batches: agents see their own
CREATE POLICY "Agents can view own batches" ON book_import_batches
  FOR SELECT USING (profile_id = auth.uid()::uuid OR EXISTS (
    SELECT 1 FROM profiles WHERE user_id = auth.uid() AND id = book_import_batches.profile_id
  ));

CREATE POLICY "Agents can insert own batches" ON book_import_batches
  FOR INSERT WITH CHECK (profile_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Agents can update own batches" ON book_import_batches
  FOR UPDATE USING (profile_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

-- Staged records: agents see records in their batches
CREATE POLICY "Agents can view own staged records" ON book_import_staged_records
  FOR SELECT USING (batch_id IN (
    SELECT id FROM book_import_batches WHERE profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  ));

-- Service role bypass for edge functions
CREATE POLICY "Service role full access batches" ON book_import_batches
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access staged" ON book_import_staged_records
  FOR ALL USING (auth.role() = 'service_role');


-- 8. Allow multiple active policies per carrier (MA + PDP with same carrier)

DO $$
BEGIN
  -- Drop overly restrictive unique constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'policies_client_carrier_unique'
    AND conrelid = 'policies'::regclass
  ) THEN
    ALTER TABLE policies DROP CONSTRAINT policies_client_carrier_unique;
  END IF;

  -- Add constraint that allows MA + PDP but prevents true duplicates
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'policies_client_carrier_plan_type_unique'
    AND conrelid = 'policies'::regclass
  ) THEN
    ALTER TABLE policies ADD CONSTRAINT policies_client_carrier_plan_type_unique
      UNIQUE (client_id, carrier_id, plan_type);
  END IF;
END $$;
