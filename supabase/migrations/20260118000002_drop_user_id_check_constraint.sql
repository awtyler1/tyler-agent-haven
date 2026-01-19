-- Migration: Drop user_id check constraint to allow agent imports
-- Date: 2026-01-18
-- Purpose: Allow profiles to be created without user_id for import workflow

-- Drop the constraint that requires user_id when is_test is false
-- This allows us to import agents who don't have auth accounts yet
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_user_id_required_if_not_test;

-- Add a comment explaining the workflow
COMMENT ON COLUMN public.profiles.user_id IS 'FK to auth.users - NULL for imported agents who have not yet been invited';
