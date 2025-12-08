-- Add onboarding event tracking columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS setup_link_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS password_created_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS first_login_at TIMESTAMP WITH TIME ZONE;

-- Create system_config table for tracking system setup status
CREATE TABLE public.system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT UNIQUE NOT NULL,
  config_value JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Only super admins can access system config
CREATE POLICY "Super admins can view system config"
ON public.system_config
FOR SELECT
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can manage system config"
ON public.system_config
FOR ALL
USING (has_role(auth.uid(), 'super_admin'))
WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Insert default config values
INSERT INTO public.system_config (config_key, config_value) VALUES
('email_configured', '{"status": true, "provider": "resend"}'),
('welcome_email_template', '{"exists": true, "last_updated": null}'),
('user_creation_flow', '{"ready": true}')
ON CONFLICT (config_key) DO NOTHING;

-- Add trigger for updated_at
CREATE TRIGGER update_system_config_updated_at
BEFORE UPDATE ON public.system_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();