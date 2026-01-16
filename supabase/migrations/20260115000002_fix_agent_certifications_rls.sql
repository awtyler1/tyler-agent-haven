-- Fix RLS policy for agent_certifications
-- The original policy incorrectly compared profile_id to auth.uid()
-- But profile_id references profiles.id, while auth.uid() returns the user's auth ID
-- We need to check if the profile belongs to the current user

-- Drop the incorrect policy
DROP POLICY IF EXISTS "Users can view own certifications" ON agent_certifications;

-- Create corrected policy that joins to profiles to verify ownership
CREATE POLICY "Users can view own certifications" ON agent_certifications
  FOR SELECT USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );
