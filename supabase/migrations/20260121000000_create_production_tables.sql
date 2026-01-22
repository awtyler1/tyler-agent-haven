-- Migration: Create/update production tracking tables (clients, policies, production_uploads)
-- Date: 2026-01-21
-- Purpose: Track agent clients and policies from carrier production reports
-- Note: Tables may already exist - this migration is idempotent

-- =============================================================================
-- CLIENTS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  medicare_number VARCHAR(15) NOT NULL,
  first_name TEXT,
  last_name TEXT,
  middle_initial VARCHAR(5),
  date_of_birth DATE,
  phone VARCHAR(20),
  address_line1 TEXT,
  address_city TEXT,
  address_state VARCHAR(2),
  address_zip VARCHAR(10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add columns if they don't exist (for existing tables)
DO $$ BEGIN
  ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS medicare_number VARCHAR(15);
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS first_name TEXT;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS last_name TEXT;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS middle_initial VARCHAR(5);
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS date_of_birth DATE;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS address_line1 TEXT;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS address_city TEXT;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS address_state VARCHAR(2);
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS address_zip VARCHAR(10);
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
EXCEPTION WHEN others THEN NULL; END $$;

-- Unique constraint
DO $$ BEGIN
  ALTER TABLE public.clients ADD CONSTRAINT clients_profile_medicare_unique
    UNIQUE (profile_id, medicare_number);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_clients_profile_id ON public.clients(profile_id);
CREATE INDEX IF NOT EXISTS idx_clients_medicare_number ON public.clients(medicare_number);
CREATE INDEX IF NOT EXISTS idx_clients_last_name ON public.clients(last_name);

-- RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own clients" ON public.clients;
CREATE POLICY "Users can view their own clients"
ON public.clients FOR SELECT
USING (
  profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Admins can view all clients" ON public.clients;
CREATE POLICY "Admins can view all clients"
ON public.clients FOR SELECT
USING (
  has_role(auth.uid(), 'super_admin') OR
  has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Service role can manage clients" ON public.clients;
CREATE POLICY "Service role can manage clients"
ON public.clients FOR ALL
USING (auth.role() = 'service_role');

-- Trigger
DROP TRIGGER IF EXISTS update_clients_updated_at ON public.clients;
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- POLICIES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  carrier_id UUID REFERENCES public.carriers(id),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  carrier_member_id TEXT,
  plan_name TEXT,
  effective_date DATE,
  term_date DATE,
  status VARCHAR(20) DEFAULT 'active',
  source_upload_id UUID,
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add columns if they don't exist
DO $$ BEGIN
  ALTER TABLE public.policies ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.policies ADD COLUMN IF NOT EXISTS carrier_id UUID REFERENCES public.carriers(id);
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.policies ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.policies ADD COLUMN IF NOT EXISTS carrier_member_id TEXT;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.policies ADD COLUMN IF NOT EXISTS plan_name TEXT;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.policies ADD COLUMN IF NOT EXISTS effective_date DATE;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.policies ADD COLUMN IF NOT EXISTS term_date DATE;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.policies ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.policies ADD COLUMN IF NOT EXISTS source_upload_id UUID;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.policies ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT now();
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.policies ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.policies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
EXCEPTION WHEN others THEN NULL; END $$;

-- Unique constraint
DO $$ BEGIN
  ALTER TABLE public.policies ADD CONSTRAINT policies_client_carrier_unique
    UNIQUE (client_id, carrier_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_policies_client_id ON public.policies(client_id);
CREATE INDEX IF NOT EXISTS idx_policies_carrier_id ON public.policies(carrier_id);
CREATE INDEX IF NOT EXISTS idx_policies_profile_id ON public.policies(profile_id);
CREATE INDEX IF NOT EXISTS idx_policies_status ON public.policies(status);
CREATE INDEX IF NOT EXISTS idx_policies_effective_date ON public.policies(effective_date);

-- RLS
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own policies" ON public.policies;
CREATE POLICY "Users can view their own policies"
ON public.policies FOR SELECT
USING (
  profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Admins can view all policies" ON public.policies;
CREATE POLICY "Admins can view all policies"
ON public.policies FOR SELECT
USING (
  has_role(auth.uid(), 'super_admin') OR
  has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Service role can manage policies" ON public.policies;
CREATE POLICY "Service role can manage policies"
ON public.policies FOR ALL
USING (auth.role() = 'service_role');

-- Trigger
DROP TRIGGER IF EXISTS update_policies_updated_at ON public.policies;
CREATE TRIGGER update_policies_updated_at
  BEFORE UPDATE ON public.policies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- PRODUCTION_UPLOADS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.production_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  carrier_id UUID NOT NULL REFERENCES public.carriers(id),
  file_name TEXT NOT NULL,
  file_size_bytes INTEGER,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  error_message TEXT,
  total_rows INTEGER DEFAULT 0,
  imported_count INTEGER DEFAULT 0,
  updated_count INTEGER DEFAULT 0,
  skipped_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  uploaded_by UUID REFERENCES public.profiles(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_production_uploads_profile_id ON public.production_uploads(profile_id);
CREATE INDEX IF NOT EXISTS idx_production_uploads_carrier_id ON public.production_uploads(carrier_id);
CREATE INDEX IF NOT EXISTS idx_production_uploads_status ON public.production_uploads(status);
CREATE INDEX IF NOT EXISTS idx_production_uploads_created_at ON public.production_uploads(created_at DESC);

-- RLS
ALTER TABLE public.production_uploads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own uploads" ON public.production_uploads;
CREATE POLICY "Users can view their own uploads"
ON public.production_uploads FOR SELECT
USING (
  profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Admins can view all uploads" ON public.production_uploads;
CREATE POLICY "Admins can view all uploads"
ON public.production_uploads FOR SELECT
USING (
  has_role(auth.uid(), 'super_admin') OR
  has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Service role can manage uploads" ON public.production_uploads;
CREATE POLICY "Service role can manage uploads"
ON public.production_uploads FOR ALL
USING (auth.role() = 'service_role');

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE public.clients IS 'Client records linked to agents, imported from carrier production reports';
COMMENT ON TABLE public.policies IS 'Policy/enrollment records for clients, one per carrier';
COMMENT ON TABLE public.production_uploads IS 'Tracks carrier production report upload history and processing status';
