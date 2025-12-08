-- Create carriers table for dynamic carrier selection
CREATE TABLE public.carriers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  requires_non_resident_states BOOLEAN NOT NULL DEFAULT true,
  requires_corporate_resolution BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contracting_applications table to store wizard progress
CREATE TABLE public.contracting_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Progress tracking
  current_step INTEGER NOT NULL DEFAULT 1,
  completed_steps INTEGER[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'approved', 'rejected')),
  
  -- Step 1: Personal & Contact Info
  full_legal_name TEXT,
  agency_name TEXT,
  gender TEXT,
  birth_date DATE,
  npn_number TEXT,
  insurance_license_number TEXT,
  tax_id TEXT,
  email_address TEXT,
  phone_mobile TEXT,
  phone_business TEXT,
  phone_home TEXT,
  fax TEXT,
  preferred_contact_methods TEXT[] DEFAULT '{}',
  
  -- Step 2: Addresses
  home_address JSONB DEFAULT '{}',
  mailing_address_same_as_home BOOLEAN DEFAULT true,
  mailing_address JSONB DEFAULT '{}',
  ups_address_same_as_home BOOLEAN DEFAULT true,
  ups_address JSONB DEFAULT '{}',
  previous_addresses JSONB DEFAULT '[]',
  
  -- Step 3: Licensing & IDs
  resident_license_number TEXT,
  resident_state TEXT,
  license_expiration_date DATE,
  non_resident_states TEXT[] DEFAULT '{}',
  drivers_license_number TEXT,
  drivers_license_state TEXT,
  
  -- Step 4: Legal/Background Questions (stored as JSONB for flexibility)
  legal_questions JSONB DEFAULT '{}',
  
  -- Step 5: Banking Info
  bank_routing_number TEXT,
  bank_account_number TEXT,
  bank_branch_name TEXT,
  beneficiary_name TEXT,
  beneficiary_relationship TEXT,
  requesting_commission_advancing BOOLEAN DEFAULT false,
  
  -- Step 6: Training & Certificates
  aml_training_provider TEXT,
  aml_completion_date DATE,
  has_ltc_certification BOOLEAN DEFAULT false,
  state_requires_ce BOOLEAN DEFAULT false,
  
  -- Step 7: Carrier Selection
  selected_carriers JSONB DEFAULT '[]',
  is_corporation BOOLEAN DEFAULT false,
  
  -- Step 8: Agreements
  agreements JSONB DEFAULT '{}',
  signature_name TEXT,
  signature_initials TEXT,
  signature_date TIMESTAMP WITH TIME ZONE,
  
  -- Uploaded documents tracking
  uploaded_documents JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  submitted_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracting_applications ENABLE ROW LEVEL SECURITY;

-- Carriers policies (public read, admin write)
CREATE POLICY "Anyone can view active carriers"
  ON public.carriers FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage carriers"
  ON public.carriers FOR ALL
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

-- Contracting applications policies
CREATE POLICY "Users can view their own applications"
  ON public.contracting_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own applications"
  ON public.contracting_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own applications"
  ON public.contracting_applications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all applications"
  ON public.contracting_applications FOR SELECT
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all applications"
  ON public.contracting_applications FOR UPDATE
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_contracting_applications_updated_at
  BEFORE UPDATE ON public.contracting_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_carriers_updated_at
  BEFORE UPDATE ON public.carriers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for contracting documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('contracting-documents', 'contracting-documents', false);

-- Storage policies for contracting documents
CREATE POLICY "Users can upload their own contracting documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'contracting-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own contracting documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'contracting-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own contracting documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'contracting-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can view all contracting documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'contracting-documents'
    AND (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'))
  );

-- Seed initial carriers
INSERT INTO public.carriers (name, code, requires_corporate_resolution) VALUES
  ('Aetna Medicare Advantage', 'aetna', false),
  ('Anthem Blue Cross Blue Shield', 'anthem', false),
  ('Athene Annuity & Life', 'athene', true),
  ('Devoted Health', 'devoted', false),
  ('Humana', 'humana', false),
  ('UnitedHealthcare', 'uhc', false),
  ('WellCare', 'wellcare', false);