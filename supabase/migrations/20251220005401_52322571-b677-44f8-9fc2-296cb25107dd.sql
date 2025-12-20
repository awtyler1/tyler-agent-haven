-- Table 1: ahip_certifications
CREATE TABLE public.ahip_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  certification_year integer NOT NULL,
  status text NOT NULL DEFAULT 'not_started',
  completed_at timestamptz,
  certificate_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT ahip_certifications_status_check 
    CHECK (status IN ('not_started', 'in_progress', 'completed')),
  CONSTRAINT ahip_certifications_user_year_unique 
    UNIQUE (user_id, certification_year)
);

CREATE INDEX idx_ahip_certifications_user_id ON public.ahip_certifications(user_id);
CREATE INDEX idx_ahip_certifications_year ON public.ahip_certifications(certification_year);
CREATE INDEX idx_ahip_certifications_status ON public.ahip_certifications(status);

CREATE TRIGGER update_ahip_certifications_updated_at
  BEFORE UPDATE ON public.ahip_certifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Table 2: carrier_certifications
CREATE TABLE public.carrier_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  carrier_id uuid NOT NULL REFERENCES public.carriers(id),
  certification_year integer NOT NULL,
  status text NOT NULL DEFAULT 'not_started',
  completed_at timestamptz,
  certificate_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT carrier_certifications_status_check 
    CHECK (status IN ('not_started', 'in_progress', 'completed')),
  CONSTRAINT carrier_certifications_unique 
    UNIQUE (user_id, carrier_id, certification_year)
);

CREATE INDEX idx_carrier_certifications_user_id ON public.carrier_certifications(user_id);
CREATE INDEX idx_carrier_certifications_carrier_id ON public.carrier_certifications(carrier_id);
CREATE INDEX idx_carrier_certifications_year ON public.carrier_certifications(certification_year);
CREATE INDEX idx_carrier_certifications_status ON public.carrier_certifications(status);
CREATE INDEX idx_carrier_certifications_user_year ON public.carrier_certifications(user_id, certification_year);

CREATE TRIGGER update_carrier_certifications_updated_at
  BEFORE UPDATE ON public.carrier_certifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Table 3: certification_windows
CREATE TABLE public.certification_windows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier_id uuid REFERENCES public.carriers(id),
  certification_year integer NOT NULL,
  opens_at date NOT NULL,
  closes_at date NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT certification_windows_unique 
    UNIQUE (carrier_id, certification_year)
);

CREATE INDEX idx_certification_windows_year ON public.certification_windows(certification_year);

CREATE TRIGGER update_certification_windows_updated_at
  BEFORE UPDATE ON public.certification_windows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE public.ahip_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carrier_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certification_windows ENABLE ROW LEVEL SECURITY;

-- RLS for ahip_certifications
CREATE POLICY "Users can view own ahip certifications"
  ON public.ahip_certifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own ahip certifications"
  ON public.ahip_certifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage ahip certifications"
  ON public.ahip_certifications FOR ALL
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

-- RLS for carrier_certifications
CREATE POLICY "Users can view own carrier certifications"
  ON public.carrier_certifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own carrier certifications"
  ON public.carrier_certifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage carrier certifications"
  ON public.carrier_certifications FOR ALL
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

-- RLS for certification_windows
CREATE POLICY "Authenticated users can view certification windows"
  ON public.certification_windows FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage certification windows"
  ON public.certification_windows FOR ALL
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

-- Create storage bucket for certificates
INSERT INTO storage.buckets (id, name, public) 
VALUES ('certificates', 'certificates', false);

-- Storage policies for certificates bucket
CREATE POLICY "Users can upload own certificates"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'certificates' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own certificates"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'certificates' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can manage all certificates"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'certificates' 
    AND (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'))
  );

-- Comments
COMMENT ON TABLE public.ahip_certifications IS 'Annual AHIP certification tracking - must be completed before carrier certs';
COMMENT ON TABLE public.carrier_certifications IS 'Per-carrier annual certification tracking';
COMMENT ON TABLE public.certification_windows IS 'Defines when certifications open/close each year (NULL carrier_id = AHIP)';