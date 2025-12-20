-- Drop existing carrier_statuses table and recreate with new structure
DROP TABLE IF EXISTS public.carrier_statuses CASCADE;

-- Create new carrier_statuses table for per-agent per-carrier tracking
CREATE TABLE public.carrier_statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  carrier_id uuid NOT NULL REFERENCES public.carriers(id),
  contracting_status text NOT NULL DEFAULT 'not_started',
  contracting_submitted_at timestamptz,
  contracted_at timestamptz,
  issue_description text,
  contracting_link_url text,
  contracting_link_sent_at timestamptz,
  link_resend_requested_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT carrier_statuses_status_check 
    CHECK (contracting_status IN ('not_started', 'in_progress', 'contracted', 'issue')),
  CONSTRAINT carrier_statuses_user_carrier_unique 
    UNIQUE (user_id, carrier_id)
);

-- Add indexes
CREATE INDEX idx_carrier_statuses_user_id ON public.carrier_statuses(user_id);
CREATE INDEX idx_carrier_statuses_carrier_id ON public.carrier_statuses(carrier_id);
CREATE INDEX idx_carrier_statuses_contracting_status ON public.carrier_statuses(contracting_status);

-- Add trigger for updated_at
CREATE TRIGGER update_carrier_statuses_updated_at
  BEFORE UPDATE ON public.carrier_statuses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.carrier_statuses ENABLE ROW LEVEL SECURITY;

-- Users can view their own carrier statuses
CREATE POLICY "Users can view their own carrier statuses"
  ON public.carrier_statuses
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update only link_resend_requested_at on their own records
CREATE POLICY "Users can request link resend"
  ON public.carrier_statuses
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all carrier statuses
CREATE POLICY "Admins can view all carrier statuses"
  ON public.carrier_statuses
  FOR SELECT
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

-- Admins can manage all carrier statuses
CREATE POLICY "Admins can manage carrier statuses"
  ON public.carrier_statuses
  FOR ALL
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

-- Managers can view carrier statuses for their downline
CREATE POLICY "Managers can view downline carrier statuses"
  ON public.carrier_statuses
  FOR SELECT
  USING (
    has_role(auth.uid(), 'manager') 
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = carrier_statuses.user_id 
      AND profiles.upline_user_id = auth.uid()
    )
  );

-- Add comments
COMMENT ON TABLE public.carrier_statuses IS 'Tracks per-agent per-carrier contracting status';
COMMENT ON COLUMN public.carrier_statuses.contracting_status IS 'Status: not_started, in_progress, contracted, issue';
COMMENT ON COLUMN public.carrier_statuses.issue_description IS 'Description of issue if status is issue';
COMMENT ON COLUMN public.carrier_statuses.link_resend_requested_at IS 'When agent requested a new contracting link';