-- Add queue management columns to contracting_applications
ALTER TABLE contracting_applications
ADD COLUMN IF NOT EXISTS queue_status TEXT DEFAULT 'needs_action',
ADD COLUMN IF NOT EXISTS sent_to_pinnacle_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS requested_carriers TEXT[];

-- Add comment for documentation
COMMENT ON COLUMN contracting_applications.queue_status IS 'Queue workflow status: needs_action, in_progress, sent_to_pinnacle, completed';
COMMENT ON COLUMN contracting_applications.sent_to_pinnacle_at IS 'Timestamp when application was sent to Pinnacle';
COMMENT ON COLUMN contracting_applications.requested_carriers IS 'Array of carrier codes the agent requested';
