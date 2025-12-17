-- Add birth_state column to contracting_applications table
ALTER TABLE public.contracting_applications
ADD COLUMN birth_state text;