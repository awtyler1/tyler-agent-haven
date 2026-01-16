CREATE TABLE agent_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  carrier_name text NOT NULL,  -- e.g., "Aetna", "Humana", "UHC" (matches RTS spreadsheet)
  product_type text NOT NULL,  -- "MA", "PDP", "MEDIGAP", "ALL_ANCILLARY", "MAPD"
  certification_year integer NOT NULL DEFAULT 0,  -- 2026, 2025, or 0
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT valid_product_type CHECK (product_type IN ('MA', 'PDP', 'MEDIGAP', 'ALL_ANCILLARY', 'MAPD')),
  CONSTRAINT unique_agent_carrier_product UNIQUE (profile_id, carrier_name, product_type)
);

-- Indexes
CREATE INDEX idx_agent_certifications_profile ON agent_certifications(profile_id);
CREATE INDEX idx_agent_certifications_carrier_year ON agent_certifications(carrier_name, certification_year);

-- RLS
ALTER TABLE agent_certifications ENABLE ROW LEVEL SECURITY;

-- Agents can view their own certifications
CREATE POLICY "Users can view own certifications" ON agent_certifications
  FOR SELECT USING (profile_id = auth.uid());

-- Admins can view all certifications
CREATE POLICY "Admins can view all certifications" ON agent_certifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
    )
  );

-- Only admins can insert/update/delete (imports are admin actions)
CREATE POLICY "Admins can manage certifications" ON agent_certifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
    )
  );

-- Add comment explaining purpose
COMMENT ON TABLE agent_certifications IS 'RTS certification status imported from Pinnacle reports. Separate from carrier_certifications (contracting workflow).';
