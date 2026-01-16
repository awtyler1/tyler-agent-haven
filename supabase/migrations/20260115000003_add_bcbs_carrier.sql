-- Add missing 'bcbs' carrier code to match ContractingQueuePage AVAILABLE_CARRIERS
-- The queue uses 'bcbs' but database only had 'bcbs_michigan'

-- Only insert if not exists
INSERT INTO public.carriers (code, name, display_name, notes, is_active, product_tags)
SELECT 'bcbs', 'Blue Cross Blue Shield', 'BCBS', 'Generic BCBS - regional variants exist', true, '{}'
WHERE NOT EXISTS (
  SELECT 1 FROM public.carriers WHERE code = 'bcbs'
);
