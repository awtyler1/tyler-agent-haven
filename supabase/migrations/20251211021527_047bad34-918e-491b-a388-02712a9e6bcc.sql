-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can read documents" ON document_chunks;

-- Create new policy that restricts access to appointed agents and admins
CREATE POLICY "Appointed agents and admins can read documents" 
ON document_chunks FOR SELECT
USING (
  has_role(auth.uid(), 'super_admin') 
  OR has_role(auth.uid(), 'admin')
  OR (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.onboarding_status = 'APPOINTED'
    )
  )
);