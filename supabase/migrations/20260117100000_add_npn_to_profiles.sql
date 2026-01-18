-- Add NPN column to profiles
-- NPN (National Producer Number) is the universal agent identifier in the insurance industry

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS npn VARCHAR(10);

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.npn IS 'National Producer Number - unique agent identifier across insurance industry';

-- Create partial unique index (allows multiple NULLs, enforces uniqueness for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_npn_unique
ON public.profiles(npn)
WHERE npn IS NOT NULL;
