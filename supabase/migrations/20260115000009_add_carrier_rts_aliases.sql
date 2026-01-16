-- Add RTS name aliases to carriers table for name normalization
-- Problem: agent_certifications.carrier_name comes from RTS imports with names like "UHC",
-- while carrier_statuses joins to carriers.name which has "UnitedHealthcare".
-- Solution: Store known aliases to normalize names on the My Carriers page.

ALTER TABLE public.carriers
ADD COLUMN IF NOT EXISTS rts_aliases text[] DEFAULT '{}';

-- Populate known aliases (these are names that appear in Pinnacle RTS reports)
UPDATE public.carriers SET rts_aliases = ARRAY['UHC', 'United', 'UnitedHealthcare Medicare'] WHERE code = 'uhc';
UPDATE public.carriers SET rts_aliases = ARRAY['Wellcare', 'WellCare Health Plans'] WHERE code = 'wellcare';
UPDATE public.carriers SET rts_aliases = ARRAY['Aetna', 'Aetna Medicare'] WHERE code = 'aetna';
UPDATE public.carriers SET rts_aliases = ARRAY['Anthem', 'Anthem BCBS'] WHERE code = 'anthem';
UPDATE public.carriers SET rts_aliases = ARRAY['Humana', 'Humana Insurance'] WHERE code = 'humana';
UPDATE public.carriers SET rts_aliases = ARRAY['Devoted', 'Devoted Health'] WHERE code = 'devoted';
UPDATE public.carriers SET rts_aliases = ARRAY['Cigna', 'Cigna Healthcare'] WHERE code = 'cigna';
UPDATE public.carriers SET rts_aliases = ARRAY['Molina', 'Molina Healthcare'] WHERE code = 'molina';
UPDATE public.carriers SET rts_aliases = ARRAY['Essence', 'Essence Healthcare'] WHERE code = 'essence';
UPDATE public.carriers SET rts_aliases = ARRAY['BCBS', 'Blue Cross', 'BlueCross BlueShield'] WHERE code = 'bcbs';

COMMENT ON COLUMN public.carriers.rts_aliases IS 'Alternative carrier names from Pinnacle RTS reports, used for name normalization on My Carriers page';
