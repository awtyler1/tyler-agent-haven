-- Add field to track when sync reminder was sent
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS sync_reminder_sent_at TIMESTAMPTZ;

-- Index for finding agents who need reminders
CREATE INDEX IF NOT EXISTS idx_profiles_sync_reminder
ON profiles(last_sync_at, sync_reminder_sent_at)
WHERE is_active = true;
