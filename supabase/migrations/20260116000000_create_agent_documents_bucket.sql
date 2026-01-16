-- Create storage bucket for agent documents (AHIP certs, etc.)
-- Run this migration to set up the storage bucket and RLS policies

-- ============================================================================
-- Step 1: Create the storage bucket
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'agent-documents',
  'agent-documents',
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];

-- ============================================================================
-- Step 2: RLS Policies for storage.objects
-- ============================================================================

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can upload own AHIP certs" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own AHIP certs" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own AHIP certs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all agent documents" ON storage.objects;

-- Users can upload their own AHIP certificates
-- Path: ahip-certificates/{user_id}/ahip_YYYY.ext
CREATE POLICY "Users can upload own AHIP certs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'agent-documents'
  AND (storage.foldername(name))[1] = 'ahip-certificates'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Users can view their own AHIP certificates
CREATE POLICY "Users can view own AHIP certs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'agent-documents'
  AND (storage.foldername(name))[1] = 'ahip-certificates'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Users can update (replace) their own AHIP certificates
CREATE POLICY "Users can update own AHIP certs"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'agent-documents'
  AND (storage.foldername(name))[1] = 'ahip-certificates'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Admins can view all agent documents
CREATE POLICY "Admins can view all agent documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'agent-documents'
  AND EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('super_admin', 'admin')
  )
);

-- ============================================================================
-- Step 3: Ensure profiles table has AHIP cert columns
-- ============================================================================

-- Add AHIP cert columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'ahip_cert_year'
  ) THEN
    ALTER TABLE profiles ADD COLUMN ahip_cert_year integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'ahip_cert_uploaded_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN ahip_cert_uploaded_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'ahip_cert_file_path'
  ) THEN
    ALTER TABLE profiles ADD COLUMN ahip_cert_file_path text;
  END IF;
END $$;
