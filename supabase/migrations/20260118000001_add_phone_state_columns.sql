-- Migration: Add state column to profiles
-- Date: 2026-01-18
-- Note: phone column is added in 20260118000000_agent_import_columns.sql

-- Add state column (resident state)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS state VARCHAR(50);

COMMENT ON COLUMN profiles.state IS 'Resident state for the agent';
