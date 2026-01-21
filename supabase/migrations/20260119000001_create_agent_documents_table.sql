-- ============================================================================
-- Create agent_documents table for categorized document storage
-- ============================================================================
-- This table allows storing documents keyed by profile_id (not user_id)
-- so admins can upload documents for imported agents without accounts.
-- ============================================================================

-- ============================================================================
-- Step 1: Create the agent_documents table
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Document classification
  category TEXT NOT NULL,        -- 'contracting', 'compliance', 'license', 'banking', 'other'
  document_type TEXT NOT NULL,   -- 'contracting_packet', 'eo_certificate', 'resident_license', etc.
  label TEXT,                    -- Custom label for 'other' docs, or state for non-resident licenses

  -- File info
  file_path TEXT NOT NULL,       -- Storage path: {profile_id}/{category}/{filename}
  file_name TEXT NOT NULL,       -- Original filename for display

  -- Optional metadata
  expires_at TIMESTAMPTZ,        -- For E&O, licenses
  notes TEXT,                    -- Admin notes

  -- Tracking
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add constraints (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'agent_documents_category_check'
  ) THEN
    ALTER TABLE agent_documents ADD CONSTRAINT agent_documents_category_check
      CHECK (category IN ('contracting', 'compliance', 'license', 'banking', 'other'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'agent_documents_document_type_check'
  ) THEN
    ALTER TABLE agent_documents ADD CONSTRAINT agent_documents_document_type_check
      CHECK (document_type IN (
        -- Contracting category
        'contracting_packet',
        -- Compliance category
        'eo_certificate', 'ahip_certificate', 'aml_certificate', 'ce_certificate', 'ltc_certificate',
        -- License category
        'resident_license', 'non_resident_license',
        -- Banking category
        'voided_check', 'direct_deposit_form',
        -- ID category (under 'other' for now)
        'government_id',
        -- Generic
        'other'
      ));
  END IF;
END $$;

-- ============================================================================
-- Step 2: Create indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_agent_documents_profile_id ON agent_documents(profile_id);
CREATE INDEX IF NOT EXISTS idx_agent_documents_category ON agent_documents(category);
CREATE INDEX IF NOT EXISTS idx_agent_documents_document_type ON agent_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_agent_documents_expires_at ON agent_documents(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================================================
-- Step 3: Enable RLS and create policies
-- ============================================================================

ALTER TABLE agent_documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first for idempotency
DROP POLICY IF EXISTS "Admins can manage all agent documents" ON agent_documents;
DROP POLICY IF EXISTS "Agents can view own documents" ON agent_documents;
DROP POLICY IF EXISTS "Agents can insert own documents" ON agent_documents;
DROP POLICY IF EXISTS "Agents can delete own documents" ON agent_documents;

-- Admins can do everything
CREATE POLICY "Admins can manage all agent documents"
  ON agent_documents FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );

-- Agents can view their own documents
CREATE POLICY "Agents can view own documents"
  ON agent_documents FOR SELECT
  TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Agents can upload their own documents
CREATE POLICY "Agents can insert own documents"
  ON agent_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Agents can delete their own documents
CREATE POLICY "Agents can delete own documents"
  ON agent_documents FOR DELETE
  TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- Step 4: Update storage bucket policies for new path structure
-- ============================================================================
-- New path structure: agent-documents/{profile_id}/{category}/{filename}
-- Replaces old structure: agent-documents/ahip-certificates/{user_id}/...

-- Drop old AHIP-specific policies (they'll be replaced with more general ones)
DROP POLICY IF EXISTS "Users can upload own AHIP certs" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own AHIP certs" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own AHIP certs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all agent documents" ON storage.objects;

-- Drop new policies too for idempotency
DROP POLICY IF EXISTS "Admins full access to agent documents" ON storage.objects;
DROP POLICY IF EXISTS "Agents can upload own agent documents" ON storage.objects;
DROP POLICY IF EXISTS "Agents can view own agent documents" ON storage.objects;
DROP POLICY IF EXISTS "Agents can delete own agent documents" ON storage.objects;

-- Admins can do everything with agent documents
CREATE POLICY "Admins full access to agent documents"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'agent-documents'
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    bucket_id = 'agent-documents'
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );

-- Agents can upload to their own profile folder
-- Path must start with their profile_id
CREATE POLICY "Agents can upload own agent documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'agent-documents'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Agents can view their own documents
CREATE POLICY "Agents can view own agent documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'agent-documents'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Agents can delete their own documents
CREATE POLICY "Agents can delete own agent documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'agent-documents'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM profiles WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- Step 5: Create updated_at trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION update_agent_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS agent_documents_updated_at ON agent_documents;
CREATE TRIGGER agent_documents_updated_at
  BEFORE UPDATE ON agent_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_documents_updated_at();

-- ============================================================================
-- Step 6: Add comments for documentation
-- ============================================================================

COMMENT ON TABLE agent_documents IS 'Stores agent documents with categorization. Keyed by profile_id to support imported agents without accounts.';
COMMENT ON COLUMN agent_documents.category IS 'Document category: contracting, compliance, license, banking, other';
COMMENT ON COLUMN agent_documents.document_type IS 'Specific document type within category';
COMMENT ON COLUMN agent_documents.label IS 'Custom label for other docs, or state name for non-resident licenses';
COMMENT ON COLUMN agent_documents.file_path IS 'Storage path: {profile_id}/{category}/{filename}';
COMMENT ON COLUMN agent_documents.expires_at IS 'Expiration date for time-sensitive documents (E&O, licenses)';
COMMENT ON COLUMN agent_documents.uploaded_by IS 'Profile ID of whoever uploaded the document (agent or admin)';
