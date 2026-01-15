-- Create activity_logs table for audit tracking
-- This table records user actions for security auditing and debugging
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for querying by user and time (most common admin query pattern)
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_created
  ON activity_logs(user_id, created_at DESC);

-- Index for filtering by action type (for admin activity viewer)
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type
  ON activity_logs(action_type);

-- Index for looking up actions on specific entities
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity
  ON activity_logs(entity_type, entity_id)
  WHERE entity_type IS NOT NULL;

-- Column documentation
COMMENT ON TABLE activity_logs IS 'Audit log of user actions for security and debugging';
COMMENT ON COLUMN activity_logs.user_id IS 'The user who performed the action';
COMMENT ON COLUMN activity_logs.action_type IS 'Type of action: login, logout, contracting_submitted, carrier_approved, sent_to_pinnacle, etc.';
COMMENT ON COLUMN activity_logs.entity_type IS 'Type of entity affected: contracting_application, carrier_status, profile, etc.';
COMMENT ON COLUMN activity_logs.entity_id IS 'UUID of the specific record affected';
COMMENT ON COLUMN activity_logs.metadata IS 'Additional context (e.g., old/new values, carrier codes, etc.)';
COMMENT ON COLUMN activity_logs.ip_address IS 'Client IP address for security auditing';
COMMENT ON COLUMN activity_logs.created_at IS 'When the action occurred';
