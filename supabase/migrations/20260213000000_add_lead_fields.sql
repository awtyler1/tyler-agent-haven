-- Add lead support fields to clients table

-- Status field: 'lead', 'active', 'termed'
-- Default to 'active' so all existing clients are unaffected
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active';

-- Lead source: how the agent met this lead
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS lead_source VARCHAR(30);

-- Index for filtering by status (common query path)
CREATE INDEX IF NOT EXISTS idx_clients_status
  ON public.clients(status);

-- Backfill: ensure all existing clients are 'active'
UPDATE public.clients SET status = 'active' WHERE status IS NULL;

COMMENT ON COLUMN public.clients.status IS 'Client lifecycle: lead, active, termed';
COMMENT ON COLUMN public.clients.lead_source IS 'How the lead was acquired: referral, phone_call, community_event, walk_in, other';
