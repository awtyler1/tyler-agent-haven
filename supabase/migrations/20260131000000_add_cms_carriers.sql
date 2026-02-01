-- Migration: Add CMS Carriers and Update Aliases
-- Description: Adds missing carriers for Kentucky CMS plan data and updates cms_aliases
--              to match exact organization names from kentucky-plans-2026.ts
-- Date: 2026-01-31

-- ============================================================================
-- PART 1: Add missing carriers
-- ============================================================================
-- Note: cigna and essence already exist from 20260115000004_seed_carriers.sql

INSERT INTO public.carriers (code, name, display_name, is_active)
VALUES
  ('signature', 'Signature Advantage', 'Signature', true),
  ('provider_partners', 'Provider Partners Health Plans', 'Provider Partners', true)
ON CONFLICT (code) DO UPDATE SET
  is_active = true,
  name = EXCLUDED.name,
  display_name = EXCLUDED.display_name;

-- ============================================================================
-- PART 2: Update cms_aliases to match exact organization names from plan data
-- ============================================================================
-- These aliases match the organizationName field in kentucky-plans-2026.ts exactly
-- The get_carrier_id_from_cms_org() function uses these for carrier matching

-- Existing carriers - update aliases to include exact matches from our data
UPDATE carriers SET cms_aliases = ARRAY[
  'Humana',
  'Humana Insurance Company',
  'Humana Insurance Company of Kentucky',
  'Humana Health Plan'
] WHERE code = 'humana';

UPDATE carriers SET cms_aliases = ARRAY[
  'Anthem Blue Cross and Blue Shield',
  'Anthem Health Plans of Kentucky',
  'Anthem Insurance Companies'
] WHERE code = 'anthem';

UPDATE carriers SET cms_aliases = ARRAY[
  'Aetna Medicare',
  'Aetna Health Inc',
  'Aetna Health Inc (PA)',
  'Aetna Life Insurance Company'
] WHERE code = 'aetna';

UPDATE carriers SET cms_aliases = ARRAY[
  'UnitedHealthcare',
  'UnitedHealthcare Insurance Company',
  'UnitedHealthcare of the Midlands',
  'UnitedHealthcare Benefits of Texas'
] WHERE code = 'uhc';

UPDATE carriers SET cms_aliases = ARRAY[
  'Wellcare',
  'WellCare',
  'WellCare Health Plans',
  'WellCare of Kentucky',
  'WellCare Health Insurance of Arizona'
] WHERE code = 'wellcare';

UPDATE carriers SET cms_aliases = ARRAY[
  'Devoted Health',
  'Devoted Health Plan'
] WHERE code = 'devoted';

-- New/existing carriers that need aliases set
UPDATE carriers SET cms_aliases = ARRAY[
  'Essence Healthcare'
] WHERE code = 'essence';

UPDATE carriers SET cms_aliases = ARRAY[
  'Cigna Healthcare',
  'Cigna'
] WHERE code = 'cigna';

UPDATE carriers SET cms_aliases = ARRAY[
  'Signature Advantage (HMO SNP)',
  'Signature Advantage'
] WHERE code = 'signature';

UPDATE carriers SET cms_aliases = ARRAY[
  'Provider Partners Health Plans',
  'Provider Partners'
] WHERE code = 'provider_partners';

-- ============================================================================
-- PART 3: Verification query (for manual testing)
-- ============================================================================
-- Run this after migration to verify aliases are set correctly:
-- SELECT code, name, cms_aliases FROM carriers WHERE cms_aliases IS NOT NULL ORDER BY code;
