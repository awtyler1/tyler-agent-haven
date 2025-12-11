-- Add beneficiary date of birth field to contracting_applications
ALTER TABLE public.contracting_applications 
ADD COLUMN beneficiary_birth_date date DEFAULT NULL;