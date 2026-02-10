-- Migration: BOB Command Center tables
-- Date: 2026-02-10
-- Purpose: Add client_interactions, client_risk_flags tables and new columns on clients
-- Sprint: BOB Command Center Step 1

-- =============================================================================
-- 1A: CLIENT_INTERACTIONS TABLE
-- =============================================================================

CREATE TABLE public.client_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  interaction_type VARCHAR(30) NOT NULL,
    -- 'call', 'email', 'text', 'meeting', 'note', 'follow_up_scheduled', 'follow_up_completed'
  outcome VARCHAR(30),
    -- 'reached', 'voicemail', 'no_answer', 'wrong_number', 'completed', 'cancelled'
  notes TEXT,
  follow_up_date DATE,
  follow_up_completed_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_client_interactions_client ON public.client_interactions(client_id);
CREATE INDEX idx_client_interactions_profile ON public.client_interactions(profile_id);
CREATE INDEX idx_client_interactions_created ON public.client_interactions(created_at DESC);
CREATE INDEX idx_client_interactions_followup ON public.client_interactions(follow_up_date)
  WHERE follow_up_date IS NOT NULL AND follow_up_completed_at IS NULL;

ALTER TABLE public.client_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own interactions"
ON public.client_interactions FOR ALL
USING (profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins view all interactions"
ON public.client_interactions FOR SELECT
USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage interactions"
ON public.client_interactions FOR ALL
USING (auth.role() = 'service_role');

COMMENT ON TABLE public.client_interactions IS 'Agent interaction logs with clients (calls, emails, texts, meetings, notes)';

-- =============================================================================
-- 1B: CLIENT_RISK_FLAGS TABLE
-- =============================================================================

CREATE TABLE public.client_risk_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  flag_type VARCHAR(50) NOT NULL,
    -- 'no_contact_90', 'no_contact_180', 'birthday_upcoming', 'anniversary_upcoming',
    -- 'aep_review_needed', 'plan_benefit_cut', 'carrier_exit', 'plan_discontinued'
  severity VARCHAR(10) NOT NULL DEFAULT 'medium',
    -- 'low', 'medium', 'high', 'critical'
  title TEXT NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
    -- 'active', 'acknowledged', 'resolved', 'dismissed'
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id),
  source VARCHAR(30) NOT NULL DEFAULT 'system',
  metadata JSONB,
  expires_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_risk_flags_client ON public.client_risk_flags(client_id);
CREATE INDEX idx_risk_flags_profile ON public.client_risk_flags(profile_id);
CREATE INDEX idx_risk_flags_active ON public.client_risk_flags(status) WHERE status = 'active';

ALTER TABLE public.client_risk_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own risk flags"
ON public.client_risk_flags FOR ALL
USING (profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins view all risk flags"
ON public.client_risk_flags FOR SELECT
USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage risk flags"
ON public.client_risk_flags FOR ALL
USING (auth.role() = 'service_role');

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_client_risk_flags_updated_at ON public.client_risk_flags;
CREATE TRIGGER update_client_risk_flags_updated_at
  BEFORE UPDATE ON public.client_risk_flags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.client_risk_flags IS 'Computed and manual risk flags for client retention tracking';

-- =============================================================================
-- 1C: ADD COLUMNS TO CLIENTS
-- =============================================================================

ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS county_fips VARCHAR(5);

-- Index for no-contact risk flag queries (Step 5)
CREATE INDEX IF NOT EXISTS idx_clients_last_contacted ON public.clients(last_contacted_at)
  WHERE last_contacted_at IS NOT NULL;
