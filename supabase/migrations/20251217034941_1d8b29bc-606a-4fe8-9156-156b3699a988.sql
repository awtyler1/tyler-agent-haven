-- Add new AML course fields to contracting_applications
ALTER TABLE public.contracting_applications 
ADD COLUMN IF NOT EXISTS has_aml_course boolean DEFAULT NULL,
ADD COLUMN IF NOT EXISTS aml_course_name text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS aml_course_date date DEFAULT NULL;