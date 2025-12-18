-- 1. Add developer_access column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS developer_access BOOLEAN DEFAULT FALSE;

-- 2. Create feature_flags table
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key VARCHAR(100) UNIQUE NOT NULL,
  flag_value BOOLEAN DEFAULT FALSE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add RLS policies for feature_flags
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read feature flags" 
  ON public.feature_flags 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Developers can manage feature flags" 
  ON public.feature_flags 
  FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.developer_access = TRUE
    )
  );

-- 4. Insert default feature flags
INSERT INTO public.feature_flags (flag_key, flag_value, description) VALUES
  ('new_agent_form', FALSE, 'Enable new agent onboarding form redesign'),
  ('pdf_v2', FALSE, 'Enable PDF generation v2'),
  ('dark_mode', FALSE, 'Enable dark mode toggle'),
  ('agent_chat', TRUE, 'Enable agent chat widget'),
  ('maintenance_mode', FALSE, 'Put platform in maintenance mode')
ON CONFLICT (flag_key) DO NOTHING;