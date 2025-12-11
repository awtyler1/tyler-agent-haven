-- Add FINRA registration fields to contracting_applications
ALTER TABLE public.contracting_applications
ADD COLUMN is_finra_registered boolean DEFAULT false,
ADD COLUMN finra_broker_dealer_name text,
ADD COLUMN finra_crd_number text;