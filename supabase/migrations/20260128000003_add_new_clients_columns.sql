-- Add new_clients column to track clients with effective dates in current sync month

-- Add to sync_carrier_uploads (per-carrier new clients)
ALTER TABLE sync_carrier_uploads
ADD COLUMN IF NOT EXISTS new_clients INTEGER DEFAULT 0;

-- Add to monthly_syncs (total new clients across all carriers)
ALTER TABLE monthly_syncs
ADD COLUMN IF NOT EXISTS new_clients INTEGER DEFAULT 0;

-- Comment for documentation
COMMENT ON COLUMN sync_carrier_uploads.new_clients IS 'Number of clients with effective date in the sync month';
COMMENT ON COLUMN monthly_syncs.new_clients IS 'Total new clients across all carriers for this sync';
