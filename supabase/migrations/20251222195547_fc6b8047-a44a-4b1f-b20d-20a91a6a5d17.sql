-- Create a function to get auth user IDs (for checking orphaned profiles)
CREATE OR REPLACE FUNCTION public.get_auth_user_ids()
RETURNS TABLE(id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM auth.users
$$;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION public.get_auth_user_ids() TO authenticated;