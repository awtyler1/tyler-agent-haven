-- Fix carriers table - ensure carriers exist and are active
-- The table has data but is_active may be false, blocking RLS

-- Add unique constraint on code if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'carriers_code_unique' OR conname = 'carriers_code_key'
  ) THEN
    ALTER TABLE public.carriers ADD CONSTRAINT carriers_code_unique UNIQUE (code);
  END IF;
END $$;

-- Update existing carriers to be active
UPDATE public.carriers SET is_active = true WHERE code IN (
  'aetna', 'anthem', 'cigna', 'devoted', 'essence',
  'humana', 'molina', 'uhc', 'wellcare', 'bcbs'
);

-- Insert any missing carriers
INSERT INTO public.carriers (code, name, display_name, is_active)
VALUES
  ('aetna', 'Aetna', 'Aetna', true),
  ('anthem', 'Anthem', 'Anthem', true),
  ('cigna', 'Cigna', 'Cigna', true),
  ('devoted', 'Devoted Health', 'Devoted', true),
  ('essence', 'Essence Healthcare', 'Essence', true),
  ('humana', 'Humana', 'Humana', true),
  ('molina', 'Molina Healthcare', 'Molina', true),
  ('uhc', 'UnitedHealthcare', 'UHC', true),
  ('wellcare', 'WellCare', 'WellCare', true),
  ('bcbs', 'Blue Cross Blue Shield', 'BCBS', true)
ON CONFLICT (code) DO UPDATE SET is_active = true;
