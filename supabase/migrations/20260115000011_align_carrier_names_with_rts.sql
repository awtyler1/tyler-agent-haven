-- Align carrier names with RTS report names
-- Goal: Eliminate duplicates on My Carriers page by making carriers.name match RTS exactly

-- ============================================================================
-- STEP 1: Fix wrong aliases (these were incorrectly applied)
-- ============================================================================

-- United Home Life should NOT have UHC aliases
UPDATE carriers SET rts_aliases = '{}' WHERE code = 'UNITED_HOME';

-- SilverSneakers is NOT SilverScripts - these are different products
UPDATE carriers SET rts_aliases = '{}' WHERE code = 'silversneakers';

-- Aetna carriers should not have Medica aliases
UPDATE carriers SET rts_aliases = ARRAY['Aetna', 'Aetna Medicare']
WHERE code IN ('AETNA_MA', 'AETNA_MS');

-- Independence Blue Cross should have IBC alias, not generic BCBS
UPDATE carriers SET rts_aliases = ARRAY['IBC', 'Independence Blue Cross']
WHERE code = 'INDEPENDENCE';

-- BCBS Michigan needs BCBS MI alias (that's what RTS uses)
UPDATE carriers SET rts_aliases = ARRAY['BCBS MI', 'BCBS Michigan', 'Blue Cross Blue Shield Michigan']
WHERE code = 'BCBS_MI';

-- ============================================================================
-- STEP 2: Rename carriers to match RTS names exactly
-- The contracting queue uses these names, so they must match RTS
-- ============================================================================

-- Anthem: RTS uses "Anthem", not "Anthem Blue Cross Blue Shield"
UPDATE carriers SET name = 'Anthem', rts_aliases = ARRAY['Anthem Blue Cross Blue Shield', 'Anthem BCBS', 'ABCBS']
WHERE code = 'ANTHEM';

-- UHC: RTS uses "UHC", not "UnitedHealthcare"
UPDATE carriers SET name = 'UHC', rts_aliases = ARRAY['UnitedHealthcare', 'United Healthcare', 'United']
WHERE code = 'UHC';
UPDATE carriers SET name = 'UHC', rts_aliases = ARRAY['UnitedHealthcare', 'United Healthcare', 'United']
WHERE code = 'uhc';

-- Wellcare: RTS uses "Wellcare" (one word, lowercase 'c')
UPDATE carriers SET name = 'Wellcare', rts_aliases = ARRAY['WellCare', 'WellCare Health Plans']
WHERE code = 'wellcare';
UPDATE carriers SET name = 'Wellcare', rts_aliases = ARRAY['WellCare', 'WellCare Health Plans']
WHERE code = 'WELLCARE';

-- Molina: RTS uses "Molina", not "Molina Healthcare"
UPDATE carriers SET name = 'Molina', rts_aliases = ARRAY['Molina Healthcare']
WHERE code IN ('molina', 'MOLINA');

-- Essence: RTS uses "Essence Healthcare" - this already matches, just ensure aliases
UPDATE carriers SET rts_aliases = ARRAY['Essence']
WHERE code = 'essence';

-- GTL: RTS uses "GTL", rename from "GTL (Guarantee Trust Life)"
UPDATE carriers SET name = 'GTL', rts_aliases = ARRAY['GTL (Guarantee Trust Life)', 'Guarantee Trust Life']
WHERE code = 'GTL';

-- Clover: RTS uses "Clover", not "Clover Health"
UPDATE carriers SET name = 'Clover', rts_aliases = ARRAY['Clover Health']
WHERE code = 'CLOVER';

-- Alignment: RTS uses "Alignment", not "Alignment Health"
UPDATE carriers SET name = 'Alignment', rts_aliases = ARRAY['Alignment Health']
WHERE code IN ('alignment', 'ALIGNMENT');

-- NCD-Nationwide: RTS uses this exact string
UPDATE carriers SET name = 'NCD-Nationwide', rts_aliases = ARRAY['Nationwide', 'NCD']
WHERE code = 'NATIONWIDE';

-- ============================================================================
-- STEP 3: Add missing carriers that appear in RTS imports
-- ============================================================================

-- Medica (currently missing or has wrong aliases elsewhere)
INSERT INTO carriers (code, name, display_name, is_active, rts_aliases)
VALUES ('medica', 'Medica', 'Medica', true, ARRAY['Medica Health'])
ON CONFLICT (code) DO UPDATE SET
  name = 'Medica',
  rts_aliases = ARRAY['Medica Health'],
  is_active = true;

-- SilverScripts/CVS/Caremark (PDP carrier - different from SilverSneakers!)
INSERT INTO carriers (code, name, display_name, is_active, rts_aliases)
VALUES ('silverscript', 'SilverScripts/CVS/Caremark', 'SilverScript', true, ARRAY['SilverScript', 'CVS Caremark', 'CVS', 'Caremark'])
ON CONFLICT (code) DO UPDATE SET
  name = 'SilverScripts/CVS/Caremark',
  rts_aliases = ARRAY['SilverScript', 'CVS Caremark', 'CVS', 'Caremark'],
  is_active = true;

-- Regional BCBS carriers from RTS
INSERT INTO carriers (code, name, display_name, is_active, rts_aliases) VALUES
  ('bcbs_az', 'BCBS Arizona', 'BCBS AZ', true, '{}'),
  ('bcbs_il', 'BCBS Illinois', 'BCBS IL', true, '{}'),
  ('bcbs_mt', 'BCBS Montana', 'BCBS MT', true, '{}'),
  ('bcbs_nm', 'BCBS New Mexico', 'BCBS NM', true, '{}'),
  ('bcbs_ok', 'BCBS Oklahoma', 'BCBS OK', true, '{}'),
  ('bcbs_tx', 'BCBS Texas', 'BCBS TX', true, '{}'),
  ('excellus', 'Excellus BCBS', 'Excellus', true, '{}'),
  ('fl_blue', 'FL Blue', 'FL Blue', true, ARRAY['Florida Blue']),
  ('highmark', 'Highmark', 'Highmark', true, ARRAY['Highmark BCBS'])
ON CONFLICT (code) DO NOTHING;

-- Other RTS carriers
INSERT INTO carriers (code, name, display_name, is_active, rts_aliases) VALUES
  ('amerihealth', 'AmeriHealth Caritas', 'AmeriHealth', true, '{}'),
  ('banner', 'Banner Health', 'Banner', true, '{}'),
  ('care_partners', 'Care Partners', 'Care Partners', true, '{}'),
  ('connecticare', 'Connecticare', 'Connecticare', true, '{}'),
  ('freedom', 'Freedom Health', 'Freedom', true, '{}'),
  ('geisinger', 'Geisinger', 'Geisinger', true, '{}'),
  ('gold_kidney', 'Gold Kidney', 'Gold Kidney', true, '{}'),
  ('health_first', 'Health First', 'Health First', true, '{}'),
  ('healthsun', 'HealthSun', 'HealthSun', true, '{}'),
  ('jefferson', 'Jefferson Health Partners Plans', 'Jefferson', true, '{}'),
  ('medigold', 'Medigold', 'Medigold', true, '{}'),
  ('regence', 'Regence', 'Regence', true, '{}'),
  ('scan', 'SCAN', 'SCAN', true, '{}'),
  ('select_health', 'Select Health', 'Select Health', true, '{}'),
  ('upmc', 'UPMC Health Plan', 'UPMC', true, '{}')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- STEP 4: Update ContractingQueuePage's AVAILABLE_CARRIERS to match
-- Note: This is handled in code, but ensure the carriers exist with correct names
-- ============================================================================

-- Ensure the KY carriers (main market) are correctly named
-- These are the ones that appear in both contracting queue AND RTS
UPDATE carriers SET
  name = 'Aetna',
  rts_aliases = ARRAY['Aetna Medicare', 'Aetna Health']
WHERE code = 'aetna' AND name != 'Aetna';

UPDATE carriers SET
  name = 'Anthem',
  rts_aliases = ARRAY['Anthem BCBS', 'Anthem Blue Cross']
WHERE code = 'anthem' AND name != 'Anthem';

UPDATE carriers SET
  name = 'Cigna',
  rts_aliases = ARRAY['Cigna Healthcare', 'Cigna Health']
WHERE code IN ('cigna', 'CIGNA') AND name != 'Cigna';

UPDATE carriers SET
  name = 'Devoted Health',
  rts_aliases = ARRAY['Devoted']
WHERE code IN ('devoted', 'DEVOTED');

UPDATE carriers SET
  name = 'Humana',
  rts_aliases = ARRAY['Humana Insurance', 'Humana Medicare']
WHERE code IN ('humana', 'HUMANA');

-- ============================================================================
-- STEP 5: Add Essence Healthcare to common carriers if missing
-- ============================================================================
INSERT INTO carriers (code, name, display_name, is_active, rts_aliases)
VALUES ('essence', 'Essence Healthcare', 'Essence', true, ARRAY['Essence'])
ON CONFLICT (code) DO UPDATE SET is_active = true;
