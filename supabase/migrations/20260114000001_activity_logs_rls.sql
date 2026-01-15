-- Enable RLS on activity_logs
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- SELECT: Only super_admin can view activity logs
-- This is for the admin activity log viewer
CREATE POLICY "Super admins can view all activity logs"
ON activity_logs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- INSERT: Authenticated users can insert their own activity logs
-- Service role (used by edge functions) bypasses RLS automatically
-- Users can only insert logs where user_id matches their profile
CREATE POLICY "Users can insert their own activity logs"
ON activity_logs
FOR INSERT
TO authenticated
WITH CHECK (user_id = get_my_profile_id());

-- No UPDATE policy - logs are immutable
-- No DELETE policy - logs cannot be deleted

COMMENT ON POLICY "Super admins can view all activity logs" ON activity_logs IS
  'Only super_admin role can read activity logs for audit purposes';
COMMENT ON POLICY "Users can insert their own activity logs" ON activity_logs IS
  'Users can only create logs for themselves. Server-side logging uses service role which bypasses RLS.';
