-- Migration: Add public read access for CMS plans
-- Description: Allow unauthenticated users to read CMS plan data (public data)
-- Date: 2026-01-31

-- Add public read policy for cms_plans
CREATE POLICY "Public can view plans"
  ON cms_plans FOR SELECT
  TO anon
  USING (true);

-- Add public read policy for cms_service_areas
CREATE POLICY "Public can view service areas"
  ON cms_service_areas FOR SELECT
  TO anon
  USING (true);

-- Note: plan_documents stays authenticated-only (may contain internal notes)
