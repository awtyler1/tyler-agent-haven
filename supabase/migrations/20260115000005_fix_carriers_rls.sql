-- Fix carriers RLS - allow all authenticated users to read
-- The existing policy "Anyone can view active carriers" requires is_active = true
-- but this is blocking queries even for active carriers

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Anyone can view active carriers" ON public.carriers;
DROP POLICY IF EXISTS "Anyone can view carriers" ON public.carriers;

-- Create permissive policy - carriers is reference data, all authenticated users can read
CREATE POLICY "Anyone can view carriers" ON public.carriers
  FOR SELECT
  TO authenticated
  USING (true);

-- Keep admin write policy (may already exist)
DROP POLICY IF EXISTS "Admins can manage carriers" ON public.carriers;
CREATE POLICY "Admins can manage carriers" ON public.carriers
  FOR ALL
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));
