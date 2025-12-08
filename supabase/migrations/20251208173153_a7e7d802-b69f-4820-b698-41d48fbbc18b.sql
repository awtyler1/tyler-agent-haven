-- Drop the problematic policies that cause recursion
DROP POLICY IF EXISTS "Broker managers can view team profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Recreate policies without recursion using security definer function approach
-- First create a helper function to get manager_id without triggering RLS
CREATE OR REPLACE FUNCTION public.get_my_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM profiles WHERE user_id = auth.uid()
$$;

-- Users can view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Admins (super_admin and contracting_admin) can view all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'contracting_admin'::app_role)
);

-- Admins can update any profile
CREATE POLICY "Admins can update profiles" 
ON public.profiles 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'contracting_admin'::app_role)
);

-- Admins can insert profiles
CREATE POLICY "Admins can insert profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'contracting_admin'::app_role)
);

-- Broker managers can view their team members (using helper function to avoid recursion)
CREATE POLICY "Broker managers can view team profiles" 
ON public.profiles 
FOR SELECT 
USING (
  has_role(auth.uid(), 'broker_manager'::app_role) AND 
  manager_id = get_my_profile_id()
);