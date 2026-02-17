-- ============================================================
-- Book Import Schema Fixup
-- Additive changes not covered by 20260215 migration.
-- Tables and RLS already exist — this adds constraints and
-- missing indexes only.
-- ============================================================

-- 1. Add 'unverified' to clients.status
--    Existing column is VARCHAR(20) with no CHECK constraint.
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


-- 2. MBI dedup index (name+DOB and name-only already exist from 20260215)
CREATE INDEX IF NOT EXISTS idx_clients_dedup_mbi
  ON clients(profile_id, medicare_number)
  WHERE medicare_number IS NOT NULL;


-- 3. Allow multiple active policies per carrier (MA + PDP with same carrier)
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
