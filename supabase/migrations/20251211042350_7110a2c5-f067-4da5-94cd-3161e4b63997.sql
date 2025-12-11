-- Add beneficiary driver's license fields to contracting_applications
ALTER TABLE public.contracting_applications 
ADD COLUMN IF NOT EXISTS beneficiary_drivers_license_number text,
ADD COLUMN IF NOT EXISTS beneficiary_drivers_license_state text;