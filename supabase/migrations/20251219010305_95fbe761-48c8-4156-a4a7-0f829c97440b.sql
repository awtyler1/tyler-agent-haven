ALTER TABLE public.contracting_applications 
ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT FALSE;

ALTER TABLE public.carrier_statuses 
ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT FALSE;

-- Add the test_mode feature flag if it doesn't exist
INSERT INTO public.feature_flags (flag_key, flag_value, description)
VALUES ('test_mode', false, 'When enabled, all new submissions are marked as test data')
ON CONFLICT (flag_key) DO NOTHING;