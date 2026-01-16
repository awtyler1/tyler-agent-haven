-- CARRIERS TABLE CLEANUP
-- Removes duplicates, fixes aliases, adds missing RTS carriers
-- Run after backing up carrier_statuses if needed

-- ============================================================================
-- Step 1: Delete duplicate carrier_statuses pointing to uppercase carriers
-- If user has status for both 'uhc' and 'UHC', delete the uppercase one
-- ============================================================================

-- Delete carrier_statuses pointing to uppercase carriers where user already has lowercase
DELETE FROM carrier_statuses cs1
WHERE cs1.carrier_id IN (SELECT id FROM carriers WHERE code = 'UHC')
  AND EXISTS (
    SELECT 1 FROM carrier_statuses cs2
    JOIN carriers c ON cs2.carrier_id = c.id
    WHERE cs2.user_id = cs1.user_id AND c.code = 'uhc'
  );

DELETE FROM carrier_statuses cs1
WHERE cs1.carrier_id IN (SELECT id FROM carriers WHERE code = 'WELLCARE')
  AND EXISTS (
    SELECT 1 FROM carrier_statuses cs2
    JOIN carriers c ON cs2.carrier_id = c.id
    WHERE cs2.user_id = cs1.user_id AND c.code = 'wellcare'
  );

DELETE FROM carrier_statuses cs1
WHERE cs1.carrier_id IN (SELECT id FROM carriers WHERE code = 'ANTHEM')
  AND EXISTS (
    SELECT 1 FROM carrier_statuses cs2
    JOIN carriers c ON cs2.carrier_id = c.id
    WHERE cs2.user_id = cs1.user_id AND c.code = 'anthem'
  );

DELETE FROM carrier_statuses cs1
WHERE cs1.carrier_id IN (SELECT id FROM carriers WHERE code = 'HUMANA')
  AND EXISTS (
    SELECT 1 FROM carrier_statuses cs2
    JOIN carriers c ON cs2.carrier_id = c.id
    WHERE cs2.user_id = cs1.user_id AND c.code = 'humana'
  );

DELETE FROM carrier_statuses cs1
WHERE cs1.carrier_id IN (SELECT id FROM carriers WHERE code = 'CIGNA')
  AND EXISTS (
    SELECT 1 FROM carrier_statuses cs2
    JOIN carriers c ON cs2.carrier_id = c.id
    WHERE cs2.user_id = cs1.user_id AND c.code = 'cigna'
  );

DELETE FROM carrier_statuses cs1
WHERE cs1.carrier_id IN (SELECT id FROM carriers WHERE code = 'DEVOTED')
  AND EXISTS (
    SELECT 1 FROM carrier_statuses cs2
    JOIN carriers c ON cs2.carrier_id = c.id
    WHERE cs2.user_id = cs1.user_id AND c.code = 'devoted'
  );

DELETE FROM carrier_statuses cs1
WHERE cs1.carrier_id IN (SELECT id FROM carriers WHERE code = 'MOLINA')
  AND EXISTS (
    SELECT 1 FROM carrier_statuses cs2
    JOIN carriers c ON cs2.carrier_id = c.id
    WHERE cs2.user_id = cs1.user_id AND c.code = 'molina'
  );

DELETE FROM carrier_statuses cs1
WHERE cs1.carrier_id IN (SELECT id FROM carriers WHERE code = 'ALIGNMENT')
  AND EXISTS (
    SELECT 1 FROM carrier_statuses cs2
    JOIN carriers c ON cs2.carrier_id = c.id
    WHERE cs2.user_id = cs1.user_id AND c.code = 'alignment'
  );

-- ============================================================================
-- Step 2: Migrate remaining carrier_statuses from uppercase to lowercase carriers
-- ============================================================================

-- UHC: keep lowercase 'uhc', migrate from uppercase 'UHC'
UPDATE carrier_statuses
SET carrier_id = (SELECT id FROM carriers WHERE code = 'uhc' LIMIT 1)
WHERE carrier_id = (SELECT id FROM carriers WHERE code = 'UHC' LIMIT 1)
  AND EXISTS (SELECT 1 FROM carriers WHERE code = 'uhc')
  AND EXISTS (SELECT 1 FROM carriers WHERE code = 'UHC');

-- WellCare: keep lowercase 'wellcare', migrate from uppercase 'WELLCARE'
UPDATE carrier_statuses
SET carrier_id = (SELECT id FROM carriers WHERE code = 'wellcare' LIMIT 1)
WHERE carrier_id = (SELECT id FROM carriers WHERE code = 'WELLCARE' LIMIT 1)
  AND EXISTS (SELECT 1 FROM carriers WHERE code = 'wellcare')
  AND EXISTS (SELECT 1 FROM carriers WHERE code = 'WELLCARE');

-- Anthem: keep lowercase 'anthem', migrate from uppercase 'ANTHEM'
UPDATE carrier_statuses
SET carrier_id = (SELECT id FROM carriers WHERE code = 'anthem' LIMIT 1)
WHERE carrier_id = (SELECT id FROM carriers WHERE code = 'ANTHEM' LIMIT 1)
  AND EXISTS (SELECT 1 FROM carriers WHERE code = 'anthem')
  AND EXISTS (SELECT 1 FROM carriers WHERE code = 'ANTHEM');

-- Humana: keep lowercase, migrate from uppercase
UPDATE carrier_statuses
SET carrier_id = (SELECT id FROM carriers WHERE code = 'humana' LIMIT 1)
WHERE carrier_id = (SELECT id FROM carriers WHERE code = 'HUMANA' LIMIT 1)
  AND EXISTS (SELECT 1 FROM carriers WHERE code = 'humana')
  AND EXISTS (SELECT 1 FROM carriers WHERE code = 'HUMANA');

-- Cigna: keep lowercase, migrate from uppercase
UPDATE carrier_statuses
SET carrier_id = (SELECT id FROM carriers WHERE code = 'cigna' LIMIT 1)
WHERE carrier_id = (SELECT id FROM carriers WHERE code = 'CIGNA' LIMIT 1)
  AND EXISTS (SELECT 1 FROM carriers WHERE code = 'cigna')
  AND EXISTS (SELECT 1 FROM carriers WHERE code = 'CIGNA');

-- Devoted: keep lowercase, migrate from uppercase
UPDATE carrier_statuses
SET carrier_id = (SELECT id FROM carriers WHERE code = 'devoted' LIMIT 1)
WHERE carrier_id = (SELECT id FROM carriers WHERE code = 'DEVOTED' LIMIT 1)
  AND EXISTS (SELECT 1 FROM carriers WHERE code = 'devoted')
  AND EXISTS (SELECT 1 FROM carriers WHERE code = 'DEVOTED');

-- Molina: keep lowercase, migrate from uppercase
UPDATE carrier_statuses
SET carrier_id = (SELECT id FROM carriers WHERE code = 'molina' LIMIT 1)
WHERE carrier_id = (SELECT id FROM carriers WHERE code = 'MOLINA' LIMIT 1)
  AND EXISTS (SELECT 1 FROM carriers WHERE code = 'molina')
  AND EXISTS (SELECT 1 FROM carriers WHERE code = 'MOLINA');

-- Aetna variants: migrate to base 'aetna'
UPDATE carrier_statuses
SET carrier_id = (SELECT id FROM carriers WHERE code = 'aetna' LIMIT 1)
WHERE carrier_id IN (SELECT id FROM carriers WHERE code IN ('aetna_ma', 'aetna_ms', 'AETNA_MA', 'AETNA_MS'))
  AND EXISTS (SELECT 1 FROM carriers WHERE code = 'aetna');

-- Alignment: keep lowercase
UPDATE carrier_statuses
SET carrier_id = (SELECT id FROM carriers WHERE code = 'alignment' LIMIT 1)
WHERE carrier_id = (SELECT id FROM carriers WHERE code = 'ALIGNMENT' LIMIT 1)
  AND EXISTS (SELECT 1 FROM carriers WHERE code = 'alignment')
  AND EXISTS (SELECT 1 FROM carriers WHERE code = 'ALIGNMENT');

-- ============================================================================
-- Step 2: Delete duplicate carriers (uppercase codes and variants)
-- ============================================================================

DELETE FROM carriers WHERE code IN (
  'UHC', 'WELLCARE', 'ANTHEM', 'HUMANA', 'CIGNA', 'DEVOTED', 'MOLINA',
  'ALIGNMENT', 'AMERICAN_EQUITY', 'AMERICO', 'ASSURITY',
  'MUTUAL_OMAHA', 'SIMPLY', 'TRANSAMERICA'
);

-- Delete Aetna duplicates (keep just 'aetna')
DELETE FROM carriers WHERE code IN ('aetna_ma', 'aetna_ms', 'AETNA_MA', 'AETNA_MS');

-- Delete duplicate AGLA (keep lowercase if exists)
DELETE FROM carriers WHERE code = 'AGLA' AND EXISTS (SELECT 1 FROM carriers WHERE code = 'agla');

-- ============================================================================
-- Step 3: Fix carrier names and aliases for remaining carriers
-- ============================================================================

-- Anthem - use shorter name, include all variations as aliases
UPDATE carriers SET
  name = 'Anthem',
  rts_aliases = ARRAY['Anthem', 'Anthem BCBS', 'Anthem Blue Cross Blue Shield', 'ABCBS', 'Anthem Blue Cross']
WHERE code = 'anthem';

-- UnitedHealthcare - name stays, ensure UHC alias works
UPDATE carriers SET
  name = 'UnitedHealthcare',
  rts_aliases = ARRAY['UHC', 'United', 'UnitedHealthcare Medicare', 'United Healthcare']
WHERE code = 'uhc';

-- WellCare - normalize casing
UPDATE carriers SET
  name = 'WellCare',
  rts_aliases = ARRAY['Wellcare', 'WellCare Health Plans', 'Well Care']
WHERE code = 'wellcare';

-- Humana
UPDATE carriers SET
  name = 'Humana',
  rts_aliases = ARRAY['Humana', 'Humana Insurance', 'Humana Medicare']
WHERE code = 'humana';

-- Cigna
UPDATE carriers SET
  name = 'Cigna',
  rts_aliases = ARRAY['Cigna', 'Cigna Healthcare', 'Cigna Health']
WHERE code = 'cigna';

-- Devoted Health
UPDATE carriers SET
  name = 'Devoted Health',
  rts_aliases = ARRAY['Devoted', 'Devoted Health']
WHERE code = 'devoted';

-- Molina
UPDATE carriers SET
  name = 'Molina',
  rts_aliases = ARRAY['Molina', 'Molina Healthcare']
WHERE code = 'molina';

-- Aetna
UPDATE carriers SET
  name = 'Aetna',
  rts_aliases = ARRAY['Aetna', 'Aetna Medicare', 'Aetna Health', 'Aetna Medicare Advantage', 'Aetna Medicare Supplement']
WHERE code = 'aetna';

-- Essence Healthcare
UPDATE carriers SET
  name = 'Essence Healthcare',
  rts_aliases = ARRAY['Essence', 'Essence Healthcare', 'Essence Health']
WHERE code = 'essence';

-- Fix SilverScript carrier (NOT SilverSneakers - different product)
-- SilverSneakers is a fitness program, SilverScript is a PDP carrier
-- If silverscript already exists from previous migration, just update it
UPDATE carriers SET
  name = 'SilverScript',
  rts_aliases = ARRAY['SilverScript', 'SilverScripts', 'SilverScripts/CVS/Caremark', 'CVS Caremark', 'CVS', 'Caremark']
WHERE code = 'silverscript';

-- Remove wrong aliases from silversneakers if it exists
UPDATE carriers SET
  rts_aliases = '{}'
WHERE code = 'silversneakers';

-- Nationwide / NCD
UPDATE carriers SET
  name = 'Nationwide',
  rts_aliases = ARRAY['NCD', 'NCD-Nationwide', 'Nationwide', 'National Career Development']
WHERE code = 'NATIONWIDE';

-- GTL
UPDATE carriers SET
  name = 'GTL',
  rts_aliases = ARRAY['GTL', 'Guarantee Trust Life', 'GTL (Guarantee Trust Life)']
WHERE code = 'GTL';

-- Alignment Health
UPDATE carriers SET
  name = 'Alignment Health',
  rts_aliases = ARRAY['Alignment', 'Alignment Health']
WHERE code = 'alignment';

-- Clover Health
UPDATE carriers SET
  name = 'Clover Health',
  rts_aliases = ARRAY['Clover', 'Clover Health']
WHERE code = 'CLOVER';

-- EmblemHealth
UPDATE carriers SET
  rts_aliases = ARRAY['EmblemHealth', 'Emblem Health', 'Emblem']
WHERE code = 'EMBLEM';

-- Fix United Home Life (had wrong UHC aliases)
UPDATE carriers SET
  rts_aliases = ARRAY['United Home Life', 'UHL']
WHERE code = 'UNITED_HOME';

-- BCBS Michigan
UPDATE carriers SET
  rts_aliases = ARRAY['BCBS MI', 'BCBS Michigan', 'Blue Cross Michigan', 'Blue Cross Blue Shield Michigan']
WHERE code = 'BCBS_MI';

-- Independence Blue Cross / IBC
UPDATE carriers SET
  rts_aliases = ARRAY['IBC', 'Independence Blue Cross', 'Independence']
WHERE code = 'INDEPENDENCE';

-- Generic BCBS
UPDATE carriers SET
  rts_aliases = ARRAY['BCBS', 'Blue Cross Blue Shield', 'Blue Cross', 'BlueCross BlueShield']
WHERE code = 'bcbs';

-- ============================================================================
-- Step 4: Add missing carriers from RTS import
-- ============================================================================

INSERT INTO carriers (name, code, is_active, rts_aliases) VALUES
  ('Medica', 'medica', true, ARRAY['Medica', 'Medica Health']),
  ('BCBS Arizona', 'bcbs_az', true, ARRAY['BCBS Arizona', 'Blue Cross Arizona']),
  ('BCBS Illinois', 'bcbs_il', true, ARRAY['BCBS Illinois', 'Blue Cross Illinois']),
  ('BCBS Montana', 'bcbs_mt', true, ARRAY['BCBS Montana', 'Blue Cross Montana']),
  ('BCBS New Mexico', 'bcbs_nm', true, ARRAY['BCBS New Mexico', 'Blue Cross New Mexico']),
  ('BCBS Oklahoma', 'bcbs_ok', true, ARRAY['BCBS Oklahoma', 'Blue Cross Oklahoma']),
  ('BCBS Texas', 'bcbs_tx', true, ARRAY['BCBS Texas', 'Blue Cross Texas']),
  ('FL Blue', 'fl_blue', true, ARRAY['FL Blue', 'Florida Blue']),
  ('Highmark', 'highmark', true, ARRAY['Highmark', 'Highmark BCBS']),
  ('Excellus BCBS', 'excellus', true, ARRAY['Excellus BCBS', 'Excellus']),
  ('Freedom Health', 'freedom', true, ARRAY['Freedom Health', 'Freedom']),
  ('HealthSun', 'healthsun', true, ARRAY['HealthSun', 'Health Sun']),
  ('Health First', 'health_first', true, ARRAY['Health First', 'HealthFirst']),
  ('Regence', 'regence', true, ARRAY['Regence', 'Regence BCBS']),
  ('SCAN', 'scan', true, ARRAY['SCAN', 'SCAN Health']),
  ('Select Health', 'select_health', true, ARRAY['Select Health', 'SelectHealth']),
  ('UPMC Health Plan', 'upmc', true, ARRAY['UPMC Health Plan', 'UPMC']),
  ('Geisinger', 'geisinger', true, ARRAY['Geisinger', 'Geisinger Health']),
  ('Connecticare', 'connecticare', true, ARRAY['Connecticare', 'ConnectiCare']),
  ('AmeriHealth Caritas', 'amerihealth', true, ARRAY['AmeriHealth Caritas', 'AmeriHealth']),
  ('Banner Health', 'banner', true, ARRAY['Banner Health', 'Banner']),
  ('Care Partners', 'care_partners', true, ARRAY['Care Partners', 'CarePartners']),
  ('Gold Kidney', 'gold_kidney', true, ARRAY['Gold Kidney']),
  ('Jefferson Health Partners Plans', 'jefferson', true, ARRAY['Jefferson Health Partners Plans', 'Jefferson Health']),
  ('Medigold', 'medigold', true, ARRAY['Medigold', 'MediGold'])
ON CONFLICT (code) DO UPDATE SET
  rts_aliases = EXCLUDED.rts_aliases,
  is_active = true;

-- ============================================================================
-- Step 5: Ensure all KY carriers are active
-- ============================================================================

UPDATE carriers SET is_active = true
WHERE code IN ('aetna', 'anthem', 'cigna', 'devoted', 'essence', 'humana', 'molina', 'uhc', 'wellcare', 'bcbs');
