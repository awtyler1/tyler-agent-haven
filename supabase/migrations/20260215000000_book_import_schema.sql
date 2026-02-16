-- =============================================================================
-- Migration: Book of Business Import Schema
-- Date: 2026-02-15
-- Purpose: Creates staging tables, adds manual edit protection, fixes constraints,
--          adds dedup indexes for the Book Import + Monthly Carrier Sync features.
-- =============================================================================

-- =============================================================================
-- FIX: Ensure medicare_number is nullable
-- =============================================================================
ALTER TABLE public.clients
  ALTER COLUMN medicare_number DROP NOT NULL;

ALTER TABLE public.clients
  DROP CONSTRAINT IF EXISTS clients_profile_medicare_unique;

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
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS manually_edited_fields JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.clients.part_a_date IS 'Medicare Part A effective date';
COMMENT ON COLUMN public.clients.part_b_date IS 'Medicare Part B effective date';
COMMENT ON COLUMN public.clients.source IS 'Data source: SMART_SYNC, BOOK_IMPORT, MANUAL';
COMMENT ON COLUMN public.clients.import_batch_id IS 'FK to book_import_batches — links client to the import batch that created or last updated them';
COMMENT ON COLUMN public.clients.manually_edited_fields IS 'JSONB array of field names the agent has hand-edited in the CRM. Import pipeline skips these fields to protect manual edits.';

UPDATE public.clients SET source = 'SMART_SYNC' WHERE source IS NULL;

-- =============================================================================
-- ADD: Dedup indexes
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_clients_dedup_name_dob
  ON public.clients(profile_id, LOWER(last_name), LOWER(first_name), date_of_birth)
  WHERE date_of_birth IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clients_dedup_name_only
  ON public.clients(profile_id, LOWER(last_name), LOWER(first_name));

-- =============================================================================
-- FIX: policies unique constraint
-- =============================================================================
WITH duplicates AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY client_id, carrier_id, COALESCE(plan_type, 'OTHER')
      ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
    ) AS rn
  FROM public.policies
)
DELETE FROM public.policies
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

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
  carrier_id UUID REFERENCES public.carriers(id),
  source_format VARCHAR(30) NOT NULL,
  detected_format VARCHAR(30),
  file_name TEXT NOT NULL,
  file_size_bytes INTEGER,
  status VARCHAR(20) NOT NULL DEFAULT 'uploading',
  total_records INTEGER DEFAULT 0,
  new_records INTEGER DEFAULT 0,
  updated_records INTEGER DEFAULT 0,
  skipped_records INTEGER DEFAULT 0,
  termed_records INTEGER DEFAULT 0,
  error_message TEXT,
  skip_details JSONB DEFAULT '[]'::jsonb,
  format_mismatch BOOLEAN DEFAULT false,
  mismatch_detected_carrier TEXT,
  staged_at TIMESTAMPTZ,
  committed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.book_import_batches IS 'Tracks book import sessions — both bulk imports and per-carrier monthly syncs. Also serves as the monthly sync ledger.';

CREATE INDEX IF NOT EXISTS idx_import_batches_profile ON public.book_import_batches(profile_id);
CREATE INDEX IF NOT EXISTS idx_import_batches_status ON public.book_import_batches(status);
CREATE INDEX IF NOT EXISTS idx_import_batches_carrier ON public.book_import_batches(carrier_id);
CREATE INDEX IF NOT EXISTS idx_import_batches_created ON public.book_import_batches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_import_batches_pending
  ON public.book_import_batches(profile_id, status)
  WHERE status IN ('uploading', 'parsing', 'staged');
CREATE INDEX IF NOT EXISTS idx_import_batches_monthly_sync
  ON public.book_import_batches(profile_id, carrier_id, status, created_at)
  WHERE status = 'committed' AND carrier_id IS NOT NULL;

ALTER TABLE public.book_import_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view own import batches"
  ON public.book_import_batches FOR SELECT
  USING (profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Agents can manage own import batches"
  ON public.book_import_batches FOR ALL
  USING (profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all import batches"
  ON public.book_import_batches FOR ALL
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage import batches"
  ON public.book_import_batches FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================================================
-- NEW TABLE: book_import_staged_records
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.book_import_staged_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.book_import_batches(id) ON DELETE CASCADE,
  row_number INTEGER NOT NULL,
  raw_data JSONB NOT NULL,
  mapped_data JSONB NOT NULL,
  match_type VARCHAR(20) NOT NULL DEFAULT 'new',
  matched_client_id UUID REFERENCES public.clients(id),
  skip_reason TEXT,
  policy_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.book_import_staged_records IS 'Staged records from book import, pending review before commit.';

CREATE INDEX IF NOT EXISTS idx_staged_records_batch ON public.book_import_staged_records(batch_id);
CREATE INDEX IF NOT EXISTS idx_staged_records_match ON public.book_import_staged_records(match_type);

ALTER TABLE public.book_import_staged_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view own staged records"
  ON public.book_import_staged_records FOR SELECT
  USING (batch_id IN (
    SELECT id FROM public.book_import_batches
    WHERE profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  ));

CREATE POLICY "Service role can manage staged records"
  ON public.book_import_staged_records FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Admins can manage all staged records"
  ON public.book_import_staged_records FOR ALL
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

-- =============================================================================
-- ADD: FK from clients to import batches
-- =============================================================================
ALTER TABLE public.clients
  ADD CONSTRAINT clients_import_batch_fkey
  FOREIGN KEY (import_batch_id)
  REFERENCES public.book_import_batches(id) ON DELETE SET NULL;
