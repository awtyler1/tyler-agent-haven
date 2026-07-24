-- ============================================
-- WHAT'S NEW READS
-- Per-agent read state for the hub's What's New bell, so an agent's
-- read history follows them across devices and survives cleared
-- browser storage. Shared-login MVP: the agent is identified by a
-- normalized name they enter once (same approach as the AEP training
-- board), not by auth identity. localStorage stays as a local cache;
-- this table is the durable source of truth.
-- ============================================

CREATE TABLE IF NOT EXISTS whats_new_reads (
  agent_key TEXT NOT NULL,
    -- Normalized agent name: trimmed, lowercased, single-spaced.
  item_id TEXT NOT NULL,
    -- Feed item id (whatsNew entry id or article slug, prefixed in the UI).
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (agent_key, item_id)
);

CREATE INDEX idx_whats_new_reads_agent ON whats_new_reads(agent_key);

-- ============================================
-- RLS: any signed-in agent can read and write read-state rows
-- (shared-login MVP — identity is the per-agent name key, enforced
-- client-side, matching the AEP training board's trust model).
-- ============================================
ALTER TABLE whats_new_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read whats-new reads"
  ON whats_new_reads FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can add whats-new reads"
  ON whats_new_reads FOR INSERT
  TO authenticated
  WITH CHECK (true);
