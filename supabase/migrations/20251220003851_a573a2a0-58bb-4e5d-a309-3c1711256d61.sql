-- Create state_carriers table
CREATE TABLE public.state_carriers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state_code text NOT NULL,
  carrier_id uuid REFERENCES public.carriers(id) ON DELETE CASCADE,
  is_default boolean DEFAULT false,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (state_code, carrier_id)
);

-- Add index on state_code
CREATE INDEX idx_state_carriers_state_code ON public.state_carriers(state_code);

-- Add trigger for updated_at
CREATE TRIGGER update_state_carriers_updated_at
  BEFORE UPDATE ON public.state_carriers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.state_carriers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can read state_carriers"
  ON public.state_carriers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert state_carriers"
  ON public.state_carriers
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update state_carriers"
  ON public.state_carriers
  FOR UPDATE
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete state_carriers"
  ON public.state_carriers
  FOR DELETE
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

-- Seed Kentucky defaults
INSERT INTO public.state_carriers (state_code, carrier_id, is_default, is_available)
SELECT 'KY', id, true, true FROM public.carriers WHERE code IN ('aetna', 'anthem', 'devoted', 'humana', 'uhc', 'wellcare', 'essence');

-- Seed Nevada defaults
INSERT INTO public.state_carriers (state_code, carrier_id, is_default, is_available)
SELECT 'NV', id, true, true FROM public.carriers WHERE code IN ('aetna_ms', 'aetna_ma', 'alignment', 'anthem', 'humana', 'scan', 'selecthealth', 'uhc', 'wellcare');