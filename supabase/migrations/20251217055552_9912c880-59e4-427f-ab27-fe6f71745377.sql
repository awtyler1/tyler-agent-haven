ALTER TABLE public.contracting_applications
ADD COLUMN IF NOT EXISTS disciplinary_entries jsonb NOT NULL DEFAULT '{}'::jsonb;