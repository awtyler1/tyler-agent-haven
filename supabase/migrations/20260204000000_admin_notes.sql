-- Migration: admin_notes table for threaded agent notes
-- Replaces single-field profiles.contracting_notes with proper timestamped notes

-- Create admin_notes table
CREATE TABLE admin_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES profiles(id),
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for fast lookups by profile
CREATE INDEX idx_admin_notes_profile_id ON admin_notes(profile_id);

-- Index for finding notes by author (useful for "my notes" queries)
CREATE INDEX idx_admin_notes_author_id ON admin_notes(author_id);

-- Enable Row Level Security
ALTER TABLE admin_notes ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is admin or super_admin
-- (reuse existing pattern from other tables if available, otherwise create)
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get current user's profile_id from auth.uid()
CREATE OR REPLACE FUNCTION get_current_profile_id()
RETURNS uuid AS $$
BEGIN
  RETURN (
    SELECT id FROM profiles
    WHERE user_id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies

-- Admins can read all notes
CREATE POLICY "Admins can view all admin notes"
  ON admin_notes FOR SELECT
  TO authenticated
  USING (is_admin_user());

-- Admins can insert notes
CREATE POLICY "Admins can create admin notes"
  ON admin_notes FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_user());

-- Authors can update their own notes
CREATE POLICY "Authors can update own admin notes"
  ON admin_notes FOR UPDATE
  TO authenticated
  USING (author_id = get_current_profile_id())
  WITH CHECK (author_id = get_current_profile_id());

-- Authors can delete their own notes
CREATE POLICY "Authors can delete own admin notes"
  ON admin_notes FOR DELETE
  TO authenticated
  USING (author_id = get_current_profile_id());

-- Trigger to auto-update updated_at on changes
CREATE OR REPLACE FUNCTION update_admin_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER admin_notes_updated_at
  BEFORE UPDATE ON admin_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_notes_updated_at();

-- Grant usage to authenticated users (RLS handles actual access)
GRANT ALL ON admin_notes TO authenticated;
