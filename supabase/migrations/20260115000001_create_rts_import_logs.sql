CREATE TABLE rts_import_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  agents_matched integer NOT NULL DEFAULT 0,
  agents_skipped integer NOT NULL DEFAULT 0,
  certifications_imported integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Index for querying recent imports
CREATE INDEX idx_rts_import_logs_created ON rts_import_logs(created_at DESC);

-- RLS
ALTER TABLE rts_import_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all import logs
CREATE POLICY "Admins can view import logs" ON rts_import_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
    )
  );

-- Admins can insert import logs
CREATE POLICY "Admins can insert import logs" ON rts_import_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
    )
  );

COMMENT ON TABLE rts_import_logs IS 'Audit log of RTS certification imports from Pinnacle reports.';
