-- Fix carrier RTS aliases by matching on name patterns
-- Problem: Previous migration used code-based matching, but existing carriers may have different codes
-- Solution: Match by name patterns and ensure aliases include all RTS import variations

-- Ensure rts_aliases column exists
ALTER TABLE public.carriers
ADD COLUMN IF NOT EXISTS rts_aliases text[] DEFAULT '{}';

-- Update aliases based on name patterns (case-insensitive matching)
-- These aliases are the names that appear in Pinnacle RTS import spreadsheets

-- UnitedHealthcare variants
UPDATE public.carriers
SET rts_aliases = ARRAY['UHC', 'United', 'UnitedHealthcare', 'UnitedHealthcare Medicare', 'United Healthcare']
WHERE LOWER(name) LIKE '%united%' OR LOWER(name) LIKE '%uhc%';

-- Anthem variants (including BCBS combinations)
UPDATE public.carriers
SET rts_aliases = ARRAY['Anthem', 'Anthem BCBS', 'Anthem Blue Cross', 'ABCBS']
WHERE LOWER(name) LIKE '%anthem%';

-- WellCare variants (note: Wellcare vs WellCare casing)
UPDATE public.carriers
SET rts_aliases = ARRAY['Wellcare', 'WellCare', 'WellCare Health Plans', 'Well Care']
WHERE LOWER(name) LIKE '%wellcare%' OR LOWER(name) LIKE '%well care%';

-- Essence Healthcare
UPDATE public.carriers
SET rts_aliases = ARRAY['Essence', 'Essence Healthcare', 'Essence Health']
WHERE LOWER(name) LIKE '%essence%';

-- Aetna variants
UPDATE public.carriers
SET rts_aliases = ARRAY['Aetna', 'Aetna Medicare', 'Aetna Health']
WHERE LOWER(name) LIKE '%aetna%';

-- Humana variants
UPDATE public.carriers
SET rts_aliases = ARRAY['Humana', 'Humana Insurance', 'Humana Medicare']
WHERE LOWER(name) LIKE '%humana%';

-- Cigna variants
UPDATE public.carriers
SET rts_aliases = ARRAY['Cigna', 'Cigna Healthcare', 'Cigna Health']
WHERE LOWER(name) LIKE '%cigna%';

-- Devoted Health
UPDATE public.carriers
SET rts_aliases = ARRAY['Devoted', 'Devoted Health']
WHERE LOWER(name) LIKE '%devoted%';

-- Molina Healthcare
UPDATE public.carriers
SET rts_aliases = ARRAY['Molina', 'Molina Healthcare']
WHERE LOWER(name) LIKE '%molina%';

-- Blue Cross Blue Shield (generic)
UPDATE public.carriers
SET rts_aliases = ARRAY['BCBS', 'Blue Cross', 'BlueCross BlueShield', 'Blue Cross Blue Shield']
WHERE LOWER(name) LIKE '%blue cross%' AND LOWER(name) NOT LIKE '%anthem%';

-- Medica
UPDATE public.carriers
SET rts_aliases = ARRAY['Medica', 'Medica Health']
WHERE LOWER(name) LIKE '%medica%';

-- GTL (ancillary)
UPDATE public.carriers
SET rts_aliases = ARRAY['GTL', 'Guarantee Trust Life']
WHERE LOWER(name) LIKE '%gtl%' OR LOWER(name) LIKE '%guarantee trust%';

-- NCD/Nationwide (ancillary)
UPDATE public.carriers
SET rts_aliases = ARRAY['NCD', 'NCD-Nationwide', 'Nationwide', 'National Career Development']
WHERE LOWER(name) LIKE '%ncd%' OR (LOWER(name) LIKE '%nationwide%' AND LOWER(name) NOT LIKE '%anthem%');

-- SilverScript/CVS/Caremark (PDP)
UPDATE public.carriers
SET rts_aliases = ARRAY['SilverScript', 'SilverScripts', 'CVS', 'Caremark', 'SilverScripts/CVS/Caremark']
WHERE LOWER(name) LIKE '%silver%' OR LOWER(name) LIKE '%cvs%' OR LOWER(name) LIKE '%caremark%';

COMMENT ON COLUMN public.carriers.rts_aliases IS 'Alternative carrier names from Pinnacle RTS reports, used for name normalization on My Carriers page';
