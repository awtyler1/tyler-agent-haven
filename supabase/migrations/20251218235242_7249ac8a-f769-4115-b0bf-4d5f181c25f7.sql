-- Add new columns to contracting_applications table
ALTER TABLE public.contracting_applications 
ADD COLUMN IF NOT EXISTS contract_level VARCHAR(50),
ADD COLUMN IF NOT EXISTS upline_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS sent_to_upline_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sent_to_upline_by UUID REFERENCES auth.users(id);

-- Add carrier_statuses table for per-carrier appointment tracking
CREATE TABLE IF NOT EXISTS public.carrier_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.contracting_applications(id) ON DELETE CASCADE,
  carrier_name VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'appointed', 'issue')),
  notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS for carrier_statuses
ALTER TABLE public.carrier_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage carrier statuses"
  ON public.carrier_statuses
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Agents can view their own carrier statuses"
  ON public.carrier_statuses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.contracting_applications
      WHERE contracting_applications.id = carrier_statuses.application_id
      AND contracting_applications.user_id = auth.uid()
    )
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_carrier_statuses_application_id 
  ON public.carrier_statuses(application_id);