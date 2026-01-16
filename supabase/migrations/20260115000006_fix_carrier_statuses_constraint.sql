-- Fix carrier_statuses unique constraint for upsert to work
-- The constraint may have been lost when table was recreated

-- First, delete any duplicate rows (keep the oldest)
DELETE FROM public.carrier_statuses a
USING public.carrier_statuses b
WHERE a.id > b.id
  AND a.user_id = b.user_id
  AND a.carrier_id = b.carrier_id;

-- Add the unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'carrier_statuses_user_carrier_unique'
  ) THEN
    ALTER TABLE public.carrier_statuses
    ADD CONSTRAINT carrier_statuses_user_carrier_unique
    UNIQUE (user_id, carrier_id);
  END IF;
END $$;
