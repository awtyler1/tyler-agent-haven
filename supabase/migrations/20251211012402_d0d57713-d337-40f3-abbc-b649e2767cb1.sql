-- Add product_tags and notes columns to carriers table
ALTER TABLE public.carriers 
ADD COLUMN IF NOT EXISTS product_tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS notes text;

-- Add comment explaining the tags
COMMENT ON COLUMN public.carriers.product_tags IS 'Flexible product tags: medicare_advantage, medicare_supplement, pdp, aca, life, annuity, dental, ancillary, final_expense';
COMMENT ON COLUMN public.carriers.notes IS 'Internal admin notes about the carrier';