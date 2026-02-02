-- Migration: Change hearing_aid_allowance to TEXT
-- Description: Allows storing both allowance amounts ("$2,000") and copay formats ("$699 copay/aid")
-- Date: 2026-02-01

-- Change column type from DECIMAL to TEXT
-- This allows flexible display formats for different plan structures
ALTER TABLE cms_plans
ALTER COLUMN hearing_aid_allowance TYPE TEXT
USING CASE
  WHEN hearing_aid_allowance IS NOT NULL
  THEN '$' || TRIM(TRAILING '.' FROM TRIM(TRAILING '0' FROM hearing_aid_allowance::TEXT))
  ELSE NULL
END;

COMMENT ON COLUMN cms_plans.hearing_aid_allowance IS 'Hearing aid benefit - either allowance ("$2,000") or copay ("$699 copay/aid")';
