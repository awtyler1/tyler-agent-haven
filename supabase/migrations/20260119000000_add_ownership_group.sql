-- Add ownership_group for internal team categorization
-- Values: 'a_and_a' (Austin + Andrew shared team), NULL (external/MGA teams or truly independent)
-- Andrew's personal team uses manager_id = andrew_profile_id with NULL ownership_group

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'ownership_group'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN ownership_group TEXT;
  END IF;
END $$;

-- Add comment explaining the field
COMMENT ON COLUMN public.profiles.ownership_group IS
'Internal ownership categorization. Values: a_and_a (Austin + Andrew shared team), NULL (external/MGA teams or truly independent)';
