-- TEST AGENTS FOR MY CARRIERS PAGE
-- Run this in Supabase SQL Editor to create test scenarios
--
-- IMPORTANT: You need to manually create auth users first via Supabase Auth,
-- then run this script to populate their certification data.
--
-- Test emails to create in Auth:
--   - newagent@test.tylerinsurance.com
--   - ahiponly@test.tylerinsurance.com
--   - partial@test.tylerinsurance.com
--   - fullcert@test.tylerinsurance.com
--   - needsrecert@test.tylerinsurance.com
--   - mixed@test.tylerinsurance.com

-- ============================================================================
-- STEP 1: Clean up existing test data
-- ============================================================================

DELETE FROM agent_certifications WHERE profile_id IN (
  SELECT id FROM profiles WHERE email LIKE '%@test.tylerinsurance.com'
);

DELETE FROM carrier_statuses WHERE user_id IN (
  SELECT user_id FROM profiles WHERE email LIKE '%@test.tylerinsurance.com'
);

DELETE FROM ahip_certifications WHERE user_id IN (
  SELECT user_id FROM profiles WHERE email LIKE '%@test.tylerinsurance.com'
);

-- ============================================================================
-- STEP 2: Verify test profiles exist
-- ============================================================================

-- Run this to see which test profiles exist:
-- SELECT id, user_id, email, first_name, ahip_cert_year FROM profiles WHERE email LIKE '%@test.tylerinsurance.com';

-- ============================================================================
-- SCENARIO A: Brand New Agent
-- No AHIP, no certs, 3 carriers in contracting
-- ============================================================================

DO $$
DECLARE
  v_user_id uuid;
  v_profile_id uuid;
BEGIN
  SELECT user_id, id INTO v_user_id, v_profile_id
  FROM profiles
  WHERE email = 'newagent@test.tylerinsurance.com';

  IF v_user_id IS NOT NULL THEN
    -- No AHIP record (new agent hasn't started)
    -- The cleanup step already deleted any existing AHIP records

    -- Add contracting in progress
    INSERT INTO carrier_statuses (user_id, carrier_id, contracting_status, created_at)
    SELECT v_user_id, c.id, 'in_progress', NOW() - interval '5 days'
    FROM carriers c
    WHERE c.code IN ('humana', 'aetna', 'uhc')
    ON CONFLICT (user_id, carrier_id) DO UPDATE SET contracting_status = 'in_progress';

    RAISE NOTICE 'Scenario A (New Agent) created for %', v_user_id;
  ELSE
    RAISE NOTICE 'Scenario A: No profile found for newagent@test.tylerinsurance.com';
  END IF;
END $$;

-- ============================================================================
-- SCENARIO B: AHIP Only
-- Has AHIP completed for 2026, no carrier certs, no contracting
-- ============================================================================

DO $$
DECLARE
  v_user_id uuid;
  v_profile_id uuid;
BEGIN
  SELECT user_id, id INTO v_user_id, v_profile_id
  FROM profiles
  WHERE email = 'ahiponly@test.tylerinsurance.com';

  IF v_user_id IS NOT NULL THEN
    -- Set AHIP complete in ahip_certifications table
    INSERT INTO ahip_certifications (user_id, certification_year, status, completed_at)
    VALUES (v_user_id, 2026, 'completed', NOW())
    ON CONFLICT (user_id, certification_year) DO UPDATE SET status = 'completed', completed_at = NOW();

    RAISE NOTICE 'Scenario B (AHIP Only) created for %', v_profile_id;
  ELSE
    RAISE NOTICE 'Scenario B: No profile found for ahiponly@test.tylerinsurance.com';
  END IF;
END $$;

-- ============================================================================
-- SCENARIO C: Partially Certified
-- AHIP complete (via certs), 4 carriers 2026, 6 carriers 2025
-- ============================================================================

DO $$
DECLARE
  v_profile_id uuid;
BEGIN
  SELECT id INTO v_profile_id
  FROM profiles
  WHERE email = 'partial@test.tylerinsurance.com';

  IF v_profile_id IS NOT NULL THEN
    -- Insert 2026 certifications (complete)
    INSERT INTO agent_certifications (profile_id, carrier_name, product_type, certification_year)
    VALUES
      (v_profile_id, 'Aetna', 'MA', 2026),
      (v_profile_id, 'Aetna', 'PDP', 2026),
      (v_profile_id, 'Humana', 'MA', 2026),
      (v_profile_id, 'Humana', 'PDP', 2026),
      (v_profile_id, 'Humana', 'MEDIGAP', 2026),
      (v_profile_id, 'UHC', 'MA', 2026),
      (v_profile_id, 'UHC', 'MEDIGAP', 2026),
      (v_profile_id, 'UHC', 'PDP', 2026),
      (v_profile_id, 'Wellcare', 'MA', 2026)
    ON CONFLICT (profile_id, carrier_name, product_type) DO UPDATE SET certification_year = 2026;

    -- Insert 2025 certifications (needs recert)
    INSERT INTO agent_certifications (profile_id, carrier_name, product_type, certification_year)
    VALUES
      (v_profile_id, 'Anthem', 'MA', 2025),
      (v_profile_id, 'Anthem', 'MEDIGAP', 2025),
      (v_profile_id, 'Cigna', 'MEDIGAP', 2025),
      (v_profile_id, 'Devoted Health', 'MA', 2025),
      (v_profile_id, 'Medica', 'MA', 2025),
      (v_profile_id, 'GTL', 'ALL_ANCILLARY', 2025),
      (v_profile_id, 'NCD-Nationwide', 'ALL_ANCILLARY', 2025)
    ON CONFLICT (profile_id, carrier_name, product_type) DO UPDATE SET certification_year = 2025;

    RAISE NOTICE 'Scenario C (Partial Cert) created for %', v_profile_id;
  ELSE
    RAISE NOTICE 'Scenario C: No profile found for partial@test.tylerinsurance.com';
  END IF;
END $$;

-- ============================================================================
-- SCENARIO D: Fully Certified
-- All carriers have 2026 certs
-- ============================================================================

DO $$
DECLARE
  v_profile_id uuid;
BEGIN
  SELECT id INTO v_profile_id
  FROM profiles
  WHERE email = 'fullcert@test.tylerinsurance.com';

  IF v_profile_id IS NOT NULL THEN
    INSERT INTO agent_certifications (profile_id, carrier_name, product_type, certification_year)
    VALUES
      (v_profile_id, 'Aetna', 'MA', 2026),
      (v_profile_id, 'Aetna', 'PDP', 2026),
      (v_profile_id, 'Anthem', 'MA', 2026),
      (v_profile_id, 'Anthem', 'MEDIGAP', 2026),
      (v_profile_id, 'Cigna', 'MEDIGAP', 2026),
      (v_profile_id, 'Devoted Health', 'MA', 2026),
      (v_profile_id, 'Humana', 'MA', 2026),
      (v_profile_id, 'Humana', 'PDP', 2026),
      (v_profile_id, 'Humana', 'MEDIGAP', 2026),
      (v_profile_id, 'Medica', 'MA', 2026),
      (v_profile_id, 'UHC', 'MA', 2026),
      (v_profile_id, 'UHC', 'PDP', 2026),
      (v_profile_id, 'UHC', 'MEDIGAP', 2026),
      (v_profile_id, 'Wellcare', 'MA', 2026),
      (v_profile_id, 'GTL', 'ALL_ANCILLARY', 2026),
      (v_profile_id, 'NCD-Nationwide', 'ALL_ANCILLARY', 2026)
    ON CONFLICT (profile_id, carrier_name, product_type) DO UPDATE SET certification_year = 2026;

    RAISE NOTICE 'Scenario D (Full Cert) created for %', v_profile_id;
  ELSE
    RAISE NOTICE 'Scenario D: No profile found for fullcert@test.tylerinsurance.com';
  END IF;
END $$;

-- ============================================================================
-- SCENARIO E: Needs Recertification
-- Simulates January of new year - only has 2025 certs
-- ============================================================================

DO $$
DECLARE
  v_profile_id uuid;
BEGIN
  SELECT id INTO v_profile_id
  FROM profiles
  WHERE email = 'needsrecert@test.tylerinsurance.com';

  IF v_profile_id IS NOT NULL THEN
    -- All 2025 certs (needs recert for 2026)
    INSERT INTO agent_certifications (profile_id, carrier_name, product_type, certification_year)
    VALUES
      (v_profile_id, 'Aetna', 'MA', 2025),
      (v_profile_id, 'Aetna', 'PDP', 2025),
      (v_profile_id, 'Humana', 'MA', 2025),
      (v_profile_id, 'Humana', 'PDP', 2025),
      (v_profile_id, 'UHC', 'MA', 2025),
      (v_profile_id, 'UHC', 'PDP', 2025),
      (v_profile_id, 'Wellcare', 'MA', 2025),
      (v_profile_id, 'Anthem', 'MA', 2025),
      (v_profile_id, 'Cigna', 'MEDIGAP', 2025)
    ON CONFLICT (profile_id, carrier_name, product_type) DO UPDATE SET certification_year = 2025;

    RAISE NOTICE 'Scenario E (Needs Recert) created for %', v_profile_id;
  ELSE
    RAISE NOTICE 'Scenario E: No profile found for needsrecert@test.tylerinsurance.com';
  END IF;
END $$;

-- ============================================================================
-- SCENARIO F: Mixed Status
-- AHIP complete, 5 carriers 2026, 5 carriers 2025, 2 contracting in progress
-- ============================================================================

DO $$
DECLARE
  v_user_id uuid;
  v_profile_id uuid;
BEGIN
  SELECT user_id, id INTO v_user_id, v_profile_id
  FROM profiles
  WHERE email = 'mixed@test.tylerinsurance.com';

  IF v_profile_id IS NOT NULL THEN
    -- 2026 certs
    INSERT INTO agent_certifications (profile_id, carrier_name, product_type, certification_year)
    VALUES
      (v_profile_id, 'Aetna', 'MA', 2026),
      (v_profile_id, 'Aetna', 'PDP', 2026),
      (v_profile_id, 'Humana', 'MA', 2026),
      (v_profile_id, 'Humana', 'PDP', 2026),
      (v_profile_id, 'UHC', 'MA', 2026),
      (v_profile_id, 'UHC', 'PDP', 2026),
      (v_profile_id, 'UHC', 'MEDIGAP', 2026)
    ON CONFLICT (profile_id, carrier_name, product_type) DO UPDATE SET certification_year = 2026;

    -- 2025 certs (needs recert)
    INSERT INTO agent_certifications (profile_id, carrier_name, product_type, certification_year)
    VALUES
      (v_profile_id, 'Anthem', 'MA', 2025),
      (v_profile_id, 'Anthem', 'MEDIGAP', 2025),
      (v_profile_id, 'Cigna', 'MEDIGAP', 2025),
      (v_profile_id, 'Devoted Health', 'MA', 2025),
      (v_profile_id, 'Medica', 'MA', 2025)
    ON CONFLICT (profile_id, carrier_name, product_type) DO UPDATE SET certification_year = 2025;

    -- Contracting in progress (for carriers NOT already certified)
    INSERT INTO carrier_statuses (user_id, carrier_id, contracting_status, created_at)
    SELECT v_user_id, c.id, 'in_progress', NOW() - interval '3 days'
    FROM carriers c
    WHERE c.code IN ('wellcare', 'essence')
    ON CONFLICT (user_id, carrier_id) DO UPDATE SET contracting_status = 'in_progress';

    RAISE NOTICE 'Scenario F (Mixed) created for %', v_profile_id;
  ELSE
    RAISE NOTICE 'Scenario F: No profile found for mixed@test.tylerinsurance.com';
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check all test agents:
SELECT
  p.email,
  ahip.certification_year as ahip_year,
  ahip.status as ahip_status,
  COUNT(DISTINCT ac.id) as cert_count,
  COUNT(DISTINCT CASE WHEN ac.certification_year = 2026 THEN ac.id END) as certs_2026,
  COUNT(DISTINCT CASE WHEN ac.certification_year = 2025 THEN ac.id END) as certs_2025,
  COUNT(DISTINCT cs.id) as contracting_count
FROM profiles p
LEFT JOIN ahip_certifications ahip ON ahip.user_id = p.user_id AND ahip.status = 'completed'
LEFT JOIN agent_certifications ac ON ac.profile_id = p.id
LEFT JOIN carrier_statuses cs ON cs.user_id = p.user_id AND cs.contracting_status = 'in_progress'
WHERE p.email LIKE '%@test.tylerinsurance.com'
GROUP BY p.id, p.email, ahip.certification_year, ahip.status
ORDER BY p.email;

-- Detailed cert breakdown:
SELECT
  p.email,
  ac.carrier_name,
  string_agg(ac.product_type, ', ') as products,
  ac.certification_year
FROM profiles p
JOIN agent_certifications ac ON ac.profile_id = p.id
WHERE p.email LIKE '%@test.tylerinsurance.com'
GROUP BY p.email, ac.carrier_name, ac.certification_year
ORDER BY p.email, ac.certification_year DESC, ac.carrier_name;
