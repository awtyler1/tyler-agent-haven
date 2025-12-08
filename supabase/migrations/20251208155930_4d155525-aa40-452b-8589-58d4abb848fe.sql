-- Create role enum
CREATE TYPE public.app_role AS ENUM ('super_admin', 'contracting_admin', 'broker_manager', 'agent');

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Add manager_id to profiles for broker manager assignment
ALTER TABLE public.profiles ADD COLUMN manager_id UUID REFERENCES public.profiles(id);

-- Security definer function to check roles (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
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

-- Function to get user's primary role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
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
      WHEN 'contracting_admin' THEN 2
      WHEN 'broker_manager' THEN 3
      WHEN 'agent' THEN 4
    END
  LIMIT 1
$$;

-- RLS policies for user_roles
-- Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (
  public.has_role(auth.uid(), 'super_admin') OR 
  public.has_role(auth.uid(), 'contracting_admin')
);

-- Broker managers can view their team's roles
CREATE POLICY "Broker managers can view team roles"
ON public.user_roles
FOR SELECT
USING (
  public.has_role(auth.uid(), 'broker_manager') AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = user_roles.user_id 
    AND profiles.manager_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  )
);

-- Only super admins can insert/update/delete roles
CREATE POLICY "Super admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Update profiles RLS to allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
  public.has_role(auth.uid(), 'super_admin') OR 
  public.has_role(auth.uid(), 'contracting_admin')
);

-- Broker managers can view their team's profiles
CREATE POLICY "Broker managers can view team profiles"
ON public.profiles
FOR SELECT
USING (
  public.has_role(auth.uid(), 'broker_manager') AND
  manager_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- Admins can update any profile
CREATE POLICY "Admins can update profiles"
ON public.profiles
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'super_admin') OR 
  public.has_role(auth.uid(), 'contracting_admin')
);

-- Admins can insert profiles (for creating agents)
CREATE POLICY "Admins can insert profiles"
ON public.profiles
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'super_admin') OR 
  public.has_role(auth.uid(), 'contracting_admin')
);