-- Fix carrier_statuses RLS - allow admins to insert/update for any user
-- The existing "Admins can manage carrier statuses" policy may not be working

-- Drop existing admin policies to recreate them properly
DROP POLICY IF EXISTS "Admins can manage carrier statuses" ON public.carrier_statuses;
DROP POLICY IF EXISTS "Admins can insert carrier statuses" ON public.carrier_statuses;
DROP POLICY IF EXISTS "Admins can update carrier statuses" ON public.carrier_statuses;

-- Create separate policies for each operation (more explicit)

-- Admins can SELECT all carrier_statuses
CREATE POLICY "Admins can view all carrier statuses" ON public.carrier_statuses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
    )
  );

-- Admins can INSERT carrier_statuses for any user
CREATE POLICY "Admins can insert carrier statuses" ON public.carrier_statuses
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
    )
  );

-- Admins can UPDATE carrier_statuses for any user
CREATE POLICY "Admins can update carrier statuses" ON public.carrier_statuses
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
    )
  );

-- Admins can DELETE carrier_statuses
CREATE POLICY "Admins can delete carrier statuses" ON public.carrier_statuses
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
    )
  );
