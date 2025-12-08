-- Drop the permissive policies on document_chunks
DROP POLICY IF EXISTS "Allow all access to document_chunks" ON public.document_chunks;

-- Create proper RLS policies for document_chunks
-- Authenticated users can read documents
CREATE POLICY "Authenticated users can read documents" 
ON public.document_chunks 
FOR SELECT 
TO authenticated 
USING (true);

-- Admins can insert documents
CREATE POLICY "Admins can insert documents" 
ON public.document_chunks 
FOR INSERT 
TO authenticated 
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Admins can update documents
CREATE POLICY "Admins can update documents" 
ON public.document_chunks 
FOR UPDATE 
TO authenticated 
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete documents
CREATE POLICY "Admins can delete documents" 
ON public.document_chunks 
FOR DELETE 
TO authenticated 
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Drop the permissive policies on processing_jobs
DROP POLICY IF EXISTS "Allow all access to processing_jobs" ON public.processing_jobs;

-- Create proper RLS policies for processing_jobs (admin-only)
CREATE POLICY "Admins can view processing jobs" 
ON public.processing_jobs 
FOR SELECT 
TO authenticated 
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert processing jobs" 
ON public.processing_jobs 
FOR INSERT 
TO authenticated 
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update processing jobs" 
ON public.processing_jobs 
FOR UPDATE 
TO authenticated 
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete processing jobs" 
ON public.processing_jobs 
FOR DELETE 
TO authenticated 
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));