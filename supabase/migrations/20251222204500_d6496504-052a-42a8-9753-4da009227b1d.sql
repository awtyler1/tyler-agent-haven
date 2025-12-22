-- Update function to include last_sign_in_at
DROP FUNCTION IF EXISTS public.get_auth_user_details(uuid);

CREATE OR REPLACE FUNCTION public.get_auth_user_details(_user_id uuid)
RETURNS TABLE(
  id uuid,
  email text,
  email_confirmed_at timestamptz,
  banned_until timestamptz,
  created_at timestamptz,
  last_sign_in_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    u.id,
    u.email::text,
    u.email_confirmed_at,
    u.banned_until,
    u.created_at,
    u.last_sign_in_at
  FROM auth.users u
  WHERE u.id = _user_id
$$;