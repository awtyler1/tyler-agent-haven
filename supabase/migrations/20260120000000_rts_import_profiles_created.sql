-- Add profiles_created column to rts_import_logs
-- Tracks how many new agent profiles were auto-created during RTS import

ALTER TABLE rts_import_logs
ADD COLUMN IF NOT EXISTS profiles_created integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN rts_import_logs.profiles_created IS 'Number of new agent profiles auto-created from RTS data (NPNs not found in system)';
