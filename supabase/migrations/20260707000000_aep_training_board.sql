-- ============================================
-- AEP TRAINING BOARD
-- Agents vote on preset training topics and write in their own ideas
-- while Austin & Andrew map out the AEP training sessions.
-- One table holds both: kind='vote' rows tally a preset topic,
-- kind='idea' rows are free-text write-ins shown on the board.
-- ============================================

CREATE TABLE IF NOT EXISTS aep_training_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL CHECK (kind IN ('vote', 'idea')),
  topic_key TEXT,
    -- For votes: the preset topic id (defined in the UI, e.g. 'plan-changes')
  idea_text TEXT,
    -- For ideas: the agent's write-in text
  agent_name TEXT,
    -- Optional — agents can submit without a name
  client_token TEXT NOT NULL,
    -- Per-browser token. Shared-login MVP: "remove my own" is enforced
    -- client-side by matching this token, not by auth identity.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT vote_or_idea CHECK (
    (kind = 'vote' AND topic_key IS NOT NULL) OR
    (kind = 'idea' AND idea_text IS NOT NULL)
  )
);

CREATE INDEX idx_aep_training_requests_kind ON aep_training_requests(kind);
CREATE INDEX idx_aep_training_requests_token ON aep_training_requests(client_token);

-- ============================================
-- RLS: any signed-in agent can read the board, add to it, and remove
-- entries (shared-login MVP — ownership is tracked per browser in the UI).
-- ============================================
ALTER TABLE aep_training_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read training requests"
  ON aep_training_requests FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can add training requests"
  ON aep_training_requests FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can remove training requests"
  ON aep_training_requests FOR DELETE
  TO authenticated
  USING (true);
