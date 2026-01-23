-- Migration: create_forms_table
-- Description: Add forms table for Forms Library feature

-- ============================================================================
-- 1. FORMS TABLE
-- ============================================================================

CREATE TABLE public.forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL, -- 'compliance', 'client_intake', 'enrollment', etc.
  name TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  year INT, -- for annual forms (2026, 2027, etc.)
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_forms_category ON public.forms(category);
CREATE INDEX idx_forms_active ON public.forms(is_active);
CREATE INDEX idx_forms_year ON public.forms(year);

-- ============================================================================
-- 2. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;

-- Read: authenticated users can view active forms
CREATE POLICY "Authenticated users can view active forms"
  ON public.forms
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Write: admin only
CREATE POLICY "Admins can insert forms"
  ON public.forms
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update forms"
  ON public.forms
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete forms"
  ON public.forms
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

-- ============================================================================
-- 3. UPDATED_AT TRIGGER
-- ============================================================================

CREATE TRIGGER set_forms_updated_at
  BEFORE UPDATE ON public.forms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
