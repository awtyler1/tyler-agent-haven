-- Allow super_admins to delete test contracting applications
CREATE POLICY "Super admins can delete test applications" 
ON public.contracting_applications 
FOR DELETE 
TO authenticated 
USING (
  is_test = true 
  AND has_role(auth.uid(), 'super_admin')
);

-- Allow super_admins to delete test profiles
CREATE POLICY "Super admins can delete test profiles" 
ON public.profiles 
FOR DELETE 
TO authenticated 
USING (
  is_test = true 
  AND has_role(auth.uid(), 'super_admin')
);

-- Allow super_admins to delete test carrier statuses
CREATE POLICY "Super admins can delete test carrier statuses" 
ON public.carrier_statuses 
FOR DELETE 
TO authenticated 
USING (
  is_test = true 
  AND has_role(auth.uid(), 'super_admin')
);