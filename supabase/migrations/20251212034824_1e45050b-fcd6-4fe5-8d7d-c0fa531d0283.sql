-- Add missing columns to contracting_applications table for the new single-page form

-- E&O Insurance fields
ALTER TABLE public.contracting_applications 
ADD COLUMN IF NOT EXISTS eo_not_yet_covered boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS eo_provider text,
ADD COLUMN IF NOT EXISTS eo_policy_number text,
ADD COLUMN IF NOT EXISTS eo_expiration_date text;

-- Section acknowledgments for single-page form
ALTER TABLE public.contracting_applications 
ADD COLUMN IF NOT EXISTS section_acknowledgments jsonb DEFAULT '{}'::jsonb;