-- Migration: create_carrier_directory_tables
-- Description: Add tables for Carrier Directory feature (contacts, links, documents)
-- These tables reference the existing carriers table

-- ============================================================================
-- 1. CARRIER_CONTACTS - State-specific broker managers and support contacts
-- ============================================================================

CREATE TABLE public.carrier_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier_id UUID NOT NULL REFERENCES public.carriers(id) ON DELETE CASCADE,
  state_code TEXT, -- NULL means nationwide/default
  contact_type TEXT NOT NULL DEFAULT 'general', -- 'general', 'broker_support', 'sales_manager', 'territory_manager'
  name TEXT NOT NULL,
  title TEXT,
  phone TEXT,
  email TEXT,
  region TEXT, -- optional: "Northern KY", "Louisville Metro", etc.
  is_primary BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_carrier_contacts_carrier ON public.carrier_contacts(carrier_id);
CREATE INDEX idx_carrier_contacts_state ON public.carrier_contacts(state_code);
CREATE INDEX idx_carrier_contacts_carrier_state ON public.carrier_contacts(carrier_id, state_code);

-- ============================================================================
-- 2. CARRIER_LINKS - Portal URLs, certification links, resources
-- ============================================================================

CREATE TABLE public.carrier_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier_id UUID NOT NULL REFERENCES public.carriers(id) ON DELETE CASCADE,
  state_code TEXT, -- NULL means nationwide/default
  link_type TEXT NOT NULL DEFAULT 'portal', -- 'portal', 'certification', 'commission', 'marketing', 'resource', 'provider_search', 'drug_search'
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_carrier_links_carrier ON public.carrier_links(carrier_id);
CREATE INDEX idx_carrier_links_state ON public.carrier_links(state_code);
CREATE INDEX idx_carrier_links_carrier_state ON public.carrier_links(carrier_id, state_code);

-- ============================================================================
-- 3. CARRIER_DOCUMENTS - Downloadable PDFs, guides, forms
-- ============================================================================

CREATE TABLE public.carrier_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier_id UUID NOT NULL REFERENCES public.carriers(id) ON DELETE CASCADE,
  state_code TEXT, -- NULL means nationwide/default
  document_type TEXT NOT NULL DEFAULT 'guide', -- 'guide', 'form', 'flyer', 'training', 'compliance', 'market_highlights'
  name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- path in Supabase storage or external URL
  description TEXT,
  year INT, -- for annual documents (2026, 2027, etc.)
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_carrier_documents_carrier ON public.carrier_documents(carrier_id);
CREATE INDEX idx_carrier_documents_state ON public.carrier_documents(state_code);
CREATE INDEX idx_carrier_documents_carrier_state ON public.carrier_documents(carrier_id, state_code);
CREATE INDEX idx_carrier_documents_year ON public.carrier_documents(year);

-- ============================================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all three tables
ALTER TABLE public.carrier_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carrier_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carrier_documents ENABLE ROW LEVEL SECURITY;

-- CARRIER_CONTACTS policies
CREATE POLICY "Authenticated users can view carrier contacts"
  ON public.carrier_contacts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert carrier contacts"
  ON public.carrier_contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update carrier contacts"
  ON public.carrier_contacts
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete carrier contacts"
  ON public.carrier_contacts
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

-- CARRIER_LINKS policies
CREATE POLICY "Authenticated users can view carrier links"
  ON public.carrier_links
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert carrier links"
  ON public.carrier_links
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update carrier links"
  ON public.carrier_links
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete carrier links"
  ON public.carrier_links
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

-- CARRIER_DOCUMENTS policies
CREATE POLICY "Authenticated users can view carrier documents"
  ON public.carrier_documents
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert carrier documents"
  ON public.carrier_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update carrier documents"
  ON public.carrier_documents
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete carrier documents"
  ON public.carrier_documents
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

-- ============================================================================
-- 5. UPDATED_AT TRIGGERS
-- ============================================================================

-- Reuse existing update_updated_at_column function if it exists, otherwise create it
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_carrier_contacts_updated_at
  BEFORE UPDATE ON public.carrier_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_carrier_links_updated_at
  BEFORE UPDATE ON public.carrier_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_carrier_documents_updated_at
  BEFORE UPDATE ON public.carrier_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
