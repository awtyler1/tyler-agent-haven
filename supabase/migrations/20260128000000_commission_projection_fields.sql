-- Migration: Add commission projection fields
-- Date: 2026-01-28
-- Purpose: Add fields for commission calculations and projections

-- =============================================================================
-- POLICIES TABLE UPDATES
-- =============================================================================

-- Add commission-related fields to policies table
ALTER TABLE policies
ADD COLUMN IF NOT EXISTS is_t65 BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS plan_type TEXT;

-- Add index for plan_type queries
CREATE INDEX IF NOT EXISTS idx_policies_plan_type ON policies(plan_type);

-- =============================================================================
-- PROFILES TABLE UPDATES
-- =============================================================================

-- Add last_sync_at to profiles for sync tracking
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ;

-- =============================================================================
-- COMMISSION_RATES TABLE
-- =============================================================================

-- Create commission_rates table for CMS rates by year
CREATE TABLE IF NOT EXISTS commission_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('MA', 'PDP')),
  rate_type TEXT NOT NULL CHECK (rate_type IN ('initial', 'renewal')),
  amount DECIMAL(10,2) NOT NULL,
  region TEXT DEFAULT 'national',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(year, plan_type, rate_type, region)
);

-- Seed 2026 CMS rates (national)
INSERT INTO commission_rates (year, plan_type, rate_type, amount, region) VALUES
  (2026, 'MA', 'initial', 694.00, 'national'),
  (2026, 'MA', 'renewal', 347.00, 'national'),
  (2026, 'PDP', 'initial', 114.00, 'national'),
  (2026, 'PDP', 'renewal', 57.00, 'national')
ON CONFLICT (year, plan_type, rate_type, region) DO NOTHING;

-- Seed 2025 CMS rates for historical data
INSERT INTO commission_rates (year, plan_type, rate_type, amount, region) VALUES
  (2025, 'MA', 'initial', 611.00, 'national'),
  (2025, 'MA', 'renewal', 306.00, 'national'),
  (2025, 'PDP', 'initial', 100.00, 'national'),
  (2025, 'PDP', 'renewal', 50.00, 'national')
ON CONFLICT (year, plan_type, rate_type, region) DO NOTHING;

-- Enable RLS on commission_rates (read-only for all authenticated users)
ALTER TABLE commission_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Commission rates are readable by authenticated users" ON commission_rates;
CREATE POLICY "Commission rates are readable by authenticated users"
ON commission_rates FOR SELECT
TO authenticated
USING (true);

-- =============================================================================
-- BACKFILL PLAN_TYPE
-- =============================================================================

-- Backfill plan_type for existing policies based on plan_name
UPDATE policies SET plan_type =
  CASE
    WHEN LOWER(plan_name) LIKE '%pdp%' THEN 'PDP'
    WHEN LOWER(plan_name) LIKE '%part d%' THEN 'PDP'
    WHEN LOWER(plan_name) LIKE '%prescription%' THEN 'PDP'
    WHEN LOWER(plan_name) LIKE '%plan g%' THEN 'MEDIGAP'
    WHEN LOWER(plan_name) LIKE '%plan f%' THEN 'MEDIGAP'
    WHEN LOWER(plan_name) LIKE '%plan n%' THEN 'MEDIGAP'
    WHEN LOWER(plan_name) LIKE '%medigap%' THEN 'MEDIGAP'
    WHEN LOWER(plan_name) LIKE '%supplement%' THEN 'MEDIGAP'
    WHEN LOWER(plan_name) LIKE '%modernized%' THEN 'MEDIGAP'
    WHEN LOWER(plan_name) LIKE '%innovative%' THEN 'MEDIGAP'
    WHEN LOWER(plan_name) LIKE '%hmo%' THEN 'MA'
    WHEN LOWER(plan_name) LIKE '%ppo%' THEN 'MA'
    WHEN LOWER(plan_name) LIKE '%snp%' THEN 'MA'
    WHEN LOWER(plan_name) LIKE '%ma %' THEN 'MA'
    WHEN LOWER(plan_name) LIKE 'ma %' THEN 'MA'
    WHEN LOWER(plan_name) LIKE '%medicare advantage%' THEN 'MA'
    ELSE 'OTHER'
  END
WHERE plan_type IS NULL AND plan_name IS NOT NULL;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON COLUMN policies.is_t65 IS 'True if this is a T65 (turning 65) initial enrollment';
COMMENT ON COLUMN policies.plan_type IS 'Plan type: MA, PDP, MEDIGAP, or OTHER';
COMMENT ON COLUMN profiles.last_sync_at IS 'Timestamp of last successful book of business sync';
COMMENT ON TABLE commission_rates IS 'CMS commission rates by year and plan type';
