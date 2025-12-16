-- Add agency_tax_id column to contracting_applications table
ALTER TABLE public.contracting_applications 
ADD COLUMN agency_tax_id TEXT;