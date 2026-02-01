-- Migration: CMS Plans Integration
-- Description: Adds tables for CMS PBP plan data, service areas, and plan documents
-- Date: 2026-01-29

-- ============================================================================
-- PART 1: Add CMS aliases to carriers table
-- ============================================================================

ALTER TABLE carriers ADD COLUMN IF NOT EXISTS cms_aliases TEXT[];

COMMENT ON COLUMN carriers.cms_aliases IS 'CMS organization names that map to this carrier (from PBP data)';

-- Populate initial CMS org name mappings for Kentucky carriers
UPDATE carriers SET cms_aliases = ARRAY['Humana Insurance Company', 'Humana Insurance Company of Kentucky', 'Humana Health Plan'] WHERE code = 'humana';
UPDATE carriers SET cms_aliases = ARRAY['Aetna Health Inc', 'Aetna Health Inc (PA)', 'Aetna Life Insurance Company'] WHERE code = 'aetna';
UPDATE carriers SET cms_aliases = ARRAY['Anthem Blue Cross and Blue Shield', 'Anthem Health Plans of Kentucky', 'Anthem Insurance Companies'] WHERE code = 'anthem';
UPDATE carriers SET cms_aliases = ARRAY['UnitedHealthcare Insurance Company', 'UnitedHealthcare of the Midlands', 'UnitedHealthcare Benefits of Texas'] WHERE code = 'uhc';
UPDATE carriers SET cms_aliases = ARRAY['Devoted Health Plan', 'Devoted Health'] WHERE code = 'devoted';
UPDATE carriers SET cms_aliases = ARRAY['WellCare Health Plans', 'WellCare of Kentucky', 'WellCare Health Insurance of Arizona'] WHERE code = 'wellcare';

-- Nevada carriers (for future expansion)
UPDATE carriers SET cms_aliases = ARRAY['Alignment Health Plan'] WHERE code = 'alignment';
UPDATE carriers SET cms_aliases = ARRAY['SCAN Health Plan'] WHERE code = 'scan';
UPDATE carriers SET cms_aliases = ARRAY['SelectHealth'] WHERE code = 'selecthealth';

-- ============================================================================
-- PART 2: CMS Plans table
-- ============================================================================

CREATE TABLE IF NOT EXISTS cms_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  segment_id TEXT,

  -- Organization (link to internal carrier)
  organization_name TEXT NOT NULL,
  marketing_name TEXT,
  carrier_id UUID REFERENCES carriers(id),

  -- Classification
  plan_type TEXT NOT NULL,
  snp_type TEXT,

  -- Costs (DECIMAL for filtering/sorting)
  monthly_premium DECIMAL(10,2),
  annual_deductible DECIMAL(10,2),
  drug_deductible DECIMAL(10,2),
  moop_in_network DECIMAL(10,2),
  moop_combined DECIMAL(10,2),

  -- Medical benefits (TEXT to preserve CMS formatting: "$0", "$25/day", "20%")
  pcp_copay TEXT,
  specialist_copay TEXT,
  er_copay TEXT,
  urgent_care_copay TEXT,
  inpatient_copay TEXT,
  outpatient_copay TEXT,
  telehealth_copay TEXT,

  -- Drug tier copays
  drug_tier1 TEXT,
  drug_tier2 TEXT,
  drug_tier3 TEXT,
  drug_tier4 TEXT,
  drug_tier5 TEXT,

  -- Supplemental benefits
  dental_preventive TEXT,
  dental_comprehensive TEXT,
  dental_max_coverage DECIMAL(10,2),
  vision_exam_copay TEXT,
  vision_allowance DECIMAL(10,2),
  hearing_exam_copay TEXT,
  hearing_aid_allowance DECIMAL(10,2),
  otc_allowance DECIMAL(10,2),
  otc_frequency TEXT,
  fitness_benefit TEXT,
  transportation_trips INT,
  transportation_notes TEXT,
  meal_benefit TEXT,

  -- Full benefits blob for anything not in columns
  raw_benefits JSONB,

  -- Quality & Commission
  star_rating DECIMAL(2,1),
  is_commissionable BOOLEAN DEFAULT true,
  commission_notes TEXT,

  -- Metadata
  year INT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  cms_data_version TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(contract_id, plan_id, segment_id, year)
);

-- Add comments for documentation
COMMENT ON TABLE cms_plans IS 'Medicare Advantage plans imported from CMS PBP data';
COMMENT ON COLUMN cms_plans.contract_id IS 'CMS contract ID (e.g., H0292)';
COMMENT ON COLUMN cms_plans.plan_id IS 'CMS plan ID within contract (e.g., 001)';
COMMENT ON COLUMN cms_plans.segment_id IS 'Optional segment ID for plan variations';
COMMENT ON COLUMN cms_plans.organization_name IS 'Raw organization name from CMS data';
COMMENT ON COLUMN cms_plans.carrier_id IS 'FK to internal carriers table (matched via cms_aliases)';
COMMENT ON COLUMN cms_plans.plan_type IS 'HMO, PPO, PFFS, HMO-POS, Local PPO, Regional PPO';
COMMENT ON COLUMN cms_plans.snp_type IS 'D-SNP, C-SNP, I-SNP, or null for non-SNP plans';
COMMENT ON COLUMN cms_plans.raw_benefits IS 'Complete CMS benefits data as JSONB';
COMMENT ON COLUMN cms_plans.cms_data_version IS 'CMS data release identifier (e.g., PBP_2026_Q1)';

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_cms_plans_year ON cms_plans(year);
CREATE INDEX IF NOT EXISTS idx_cms_plans_carrier ON cms_plans(carrier_id);
CREATE INDEX IF NOT EXISTS idx_cms_plans_type ON cms_plans(plan_type);
CREATE INDEX IF NOT EXISTS idx_cms_plans_snp ON cms_plans(snp_type) WHERE snp_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cms_plans_premium ON cms_plans(monthly_premium);
CREATE INDEX IF NOT EXISTS idx_cms_plans_contract ON cms_plans(contract_id);
CREATE INDEX IF NOT EXISTS idx_cms_plans_lookup ON cms_plans(contract_id, plan_id, year);
CREATE INDEX IF NOT EXISTS idx_cms_plans_active ON cms_plans(year, is_active) WHERE is_active = true;

-- ============================================================================
-- PART 3: CMS Service Areas table
-- ============================================================================

CREATE TABLE IF NOT EXISTS cms_service_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cms_plan_id UUID NOT NULL REFERENCES cms_plans(id) ON DELETE CASCADE,
  contract_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  state_code CHAR(2) NOT NULL,
  county_fips TEXT NOT NULL,
  county_name TEXT,
  year INT NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(contract_id, plan_id, county_fips, year)
);

COMMENT ON TABLE cms_service_areas IS 'County-level service areas for CMS plans';
COMMENT ON COLUMN cms_service_areas.county_fips IS '5-digit FIPS code for the county';

-- Indexes for county lookup (primary query pattern)
CREATE INDEX IF NOT EXISTS idx_service_areas_county_lookup ON cms_service_areas(state_code, county_fips, year);
CREATE INDEX IF NOT EXISTS idx_service_areas_plan ON cms_service_areas(cms_plan_id);
CREATE INDEX IF NOT EXISTS idx_service_areas_state_year ON cms_service_areas(state_code, year);

-- ============================================================================
-- PART 4: Plan Documents table
-- ============================================================================

CREATE TABLE IF NOT EXISTS plan_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cms_plan_id UUID NOT NULL REFERENCES cms_plans(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  display_name TEXT,
  file_path TEXT,
  external_url TEXT,
  file_size_bytes INT,
  year INT NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES profiles(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(cms_plan_id, document_type, year)
);

COMMENT ON TABLE plan_documents IS 'Plan-specific documents (SOB, ANOC, EOC, Formulary)';
COMMENT ON COLUMN plan_documents.document_type IS 'SOB, ANOC, EOC, Formulary, SB';
COMMENT ON COLUMN plan_documents.file_path IS 'Supabase storage path (if uploaded)';
COMMENT ON COLUMN plan_documents.external_url IS 'Carrier URL (if externally hosted)';

CREATE INDEX IF NOT EXISTS idx_plan_documents_plan ON plan_documents(cms_plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_documents_type_year ON plan_documents(document_type, year);

-- ============================================================================
-- PART 5: Storage bucket for plan documents
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'plan-documents',
  'plan-documents',
  false,
  20971520,  -- 20MB limit (SOBs can be large)
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PART 6: RLS Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE cms_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_service_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_documents ENABLE ROW LEVEL SECURITY;

-- cms_plans policies
CREATE POLICY "Authenticated users can view plans"
  ON cms_plans FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert plans"
  ON cms_plans FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update plans"
  ON cms_plans FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete plans"
  ON cms_plans FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

-- cms_service_areas policies
CREATE POLICY "Authenticated users can view service areas"
  ON cms_service_areas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert service areas"
  ON cms_service_areas FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update service areas"
  ON cms_service_areas FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete service areas"
  ON cms_service_areas FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

-- plan_documents policies
CREATE POLICY "Authenticated users can view plan documents"
  ON plan_documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert plan documents"
  ON plan_documents FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update plan documents"
  ON plan_documents FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete plan documents"
  ON plan_documents FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

-- Storage policies for plan-documents bucket
CREATE POLICY "Admins can upload plan documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'plan-documents'
    AND (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "Authenticated users can view plan documents storage"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'plan-documents');

CREATE POLICY "Admins can delete plan documents storage"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'plan-documents'
    AND (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'))
  );

-- ============================================================================
-- PART 7: Helper function to match CMS org name to carrier
-- ============================================================================

CREATE OR REPLACE FUNCTION get_carrier_id_from_cms_org(org_name TEXT)
RETURNS UUID AS $$
DECLARE
  carrier_uuid UUID;
BEGIN
  SELECT id INTO carrier_uuid
  FROM carriers
  WHERE org_name = ANY(cms_aliases)
  LIMIT 1;

  RETURN carrier_uuid;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_carrier_id_from_cms_org IS 'Returns carrier ID matching a CMS organization name via cms_aliases array';

-- ============================================================================
-- PART 8: Updated_at trigger for cms_plans
-- ============================================================================

CREATE OR REPLACE FUNCTION update_cms_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cms_plans_updated_at
  BEFORE UPDATE ON cms_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_cms_plans_updated_at();

CREATE TRIGGER plan_documents_updated_at
  BEFORE UPDATE ON plan_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_cms_plans_updated_at();
