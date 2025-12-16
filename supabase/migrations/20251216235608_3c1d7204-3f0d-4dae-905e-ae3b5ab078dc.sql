-- Add birth_city column to contracting_applications table
ALTER TABLE public.contracting_applications
ADD COLUMN birth_city text;