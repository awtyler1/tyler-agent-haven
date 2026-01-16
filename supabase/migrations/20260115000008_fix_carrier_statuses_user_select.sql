-- Fix carrier_statuses RLS - allow users to see their own rows
-- The admin SELECT policy exists but users can't see rows where user_id = auth.uid()

-- Drop any existing user select policy
DROP POLICY IF EXISTS "Users can view their own carrier statuses" ON public.carrier_statuses;

-- Create policy allowing users to see their own carrier statuses
CREATE POLICY "Users can view their own carrier statuses" ON public.carrier_statuses
  FOR SELECT
  USING (user_id = auth.uid());
