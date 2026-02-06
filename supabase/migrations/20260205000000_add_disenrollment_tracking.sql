-- Add disenrollment tracking columns to support accurate book size changes
-- monthly_syncs: track termed clients and net change at the sync level
-- sync_carrier_uploads: track termed clients per carrier

ALTER TABLE monthly_syncs ADD COLUMN IF NOT EXISTS termed_clients integer DEFAULT 0;
ALTER TABLE monthly_syncs ADD COLUMN IF NOT EXISTS net_change integer DEFAULT 0;

ALTER TABLE sync_carrier_uploads ADD COLUMN IF NOT EXISTS termed_clients integer DEFAULT 0;
