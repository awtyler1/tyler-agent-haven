
-- Step 1: Update existing 'agent' roles to 'independent_agent' (using text temporarily)
UPDATE public.user_roles SET role = 'agent' WHERE role = 'agent';

-- Step 2: Drop all dependent objects
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Managers can view team profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Managers can view team roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

DROP POLICY IF EXISTS "Super admins can manage system config" ON public.system_config;
DROP POLICY IF EXISTS "Super admins can view system config" ON public.system_config;

DROP FUNCTION IF EXISTS public.has_role(_user_id uuid, _role app_role);
DROP FUNCTION IF EXISTS public.get_user_role(_user_id uuid);

-- Step 3: Create new enum with updated roles
CREATE TYPE public.app_role_new AS ENUM ('super_admin', 'admin', 'manager', 'independent_agent', 'internal_tig_agent');

-- Step 4: Alter user_roles.role column to use new enum
ALTER TABLE public.user_roles 
  ALTER COLUMN role TYPE public.app_role_new 
  USING (
    CASE role::text 
      WHEN 'agent' THEN 'independent_agent'::public.app_role_new
      ELSE role::text::public.app_role_new
    END
  );

-- Step 5: Drop old enum and rename new one
DROP TYPE public.app_role;
ALTER TYPE public.app_role_new RENAME TO app_role;

-- Step 6: Recreate has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Step 7: Recreate get_user_role function with updated hierarchy
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role
      WHEN 'super_admin' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'manager' THEN 3
      WHEN 'internal_tig_agent' THEN 4
      WHEN 'independent_agent' THEN 5
    END
  LIMIT 1
$$;

-- Step 8: Recreate RLS policies for profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update profiles" ON public.profiles
  FOR UPDATE USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers can view team profiles" ON public.profiles
  FOR SELECT USING (has_role(auth.uid(), 'manager') AND manager_id = get_my_profile_id());

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Step 9: Recreate RLS policies for user_roles
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Super admins can manage roles" ON public.user_roles
  FOR ALL USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Managers can view team roles" ON public.user_roles
  FOR SELECT USING (
    has_role(auth.uid(), 'manager') AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = user_roles.user_id 
      AND profiles.manager_id = get_my_profile_id()
    )
  );

CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Step 10: Recreate RLS policies for system_config
CREATE POLICY "Super admins can manage system config" ON public.system_config
  FOR ALL USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can view system config" ON public.system_config
  FOR SELECT USING (has_role(auth.uid(), 'super_admin'));
