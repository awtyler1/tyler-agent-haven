-- Migration: Add columns for agent import workflow
-- Date: 2026-01-18
-- Purpose: Support bulk import of agents before they have auth accounts

-- =============================================================================
-- Step 1: Make user_id nullable to support imported-but-not-invited profiles
-- =============================================================================

-- First drop the NOT NULL constraint on user_id
ALTER TABLE public.profiles ALTER COLUMN user_id DROP NOT NULL;

-- Drop the existing unique constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_key;

-- Add a partial unique index (unique only when not null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_user_id_unique
ON public.profiles(user_id)
WHERE user_id IS NOT NULL;

-- =============================================================================
-- Step 2: Add invited_at column to track when invite was sent
-- =============================================================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.invited_at IS 'Timestamp when the agent was invited (auth user created and invite email sent)';

-- =============================================================================
-- Step 3: Add phone column
-- =============================================================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

COMMENT ON COLUMN public.profiles.phone IS 'Primary phone number for the agent';

-- =============================================================================
-- Step 4: Add team_reference column for import hierarchy tracking
-- =============================================================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS team_reference TEXT;

COMMENT ON COLUMN public.profiles.team_reference IS 'Text reference to team/MGA name for imported agents before hierarchy is linked via manager_id';

-- =============================================================================
-- Step 5: Create index for efficient filtering by status
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_invited_at ON public.profiles(invited_at);
CREATE INDEX IF NOT EXISTS idx_profiles_team_reference ON public.profiles(team_reference);

-- =============================================================================
-- Step 6: Update RLS policy for viewing profiles without user_id
-- =============================================================================

-- Drop and recreate the "Users can view their own profile" policy to handle null user_id
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (user_id IS NOT NULL AND auth.uid() = user_id);

-- Drop and recreate the "Users can update their own profile" policy
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (user_id IS NOT NULL AND auth.uid() = user_id);
