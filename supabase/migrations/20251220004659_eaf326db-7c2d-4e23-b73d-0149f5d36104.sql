-- Add hierarchy assignment columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN hierarchy_type text,
ADD COLUMN hierarchy_entity_id uuid REFERENCES public.hierarchy_entities(id),
ADD COLUMN upline_user_id uuid REFERENCES auth.users(id),
ADD COLUMN assigned_carriers uuid[],
ADD COLUMN excluded_carriers uuid[],
ADD COLUMN contracting_notes text;

-- Add check constraint for hierarchy_type values
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_hierarchy_type_check 
CHECK (hierarchy_type IN ('direct', 'team', 'mga', 'ga', 'loa', 'downline') OR hierarchy_type IS NULL);

-- Add indexes for efficient querying
CREATE INDEX idx_profiles_hierarchy_type ON public.profiles(hierarchy_type);
CREATE INDEX idx_profiles_hierarchy_entity_id ON public.profiles(hierarchy_entity_id);
CREATE INDEX idx_profiles_upline_user_id ON public.profiles(upline_user_id);

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.hierarchy_type IS 'Type of hierarchy: direct (reports to TIG), team, mga, ga, loa (Licensed Only Agent), downline (under specific person)';
COMMENT ON COLUMN public.profiles.hierarchy_entity_id IS 'References the team/MGA/GA entity when applicable';
COMMENT ON COLUMN public.profiles.upline_user_id IS 'For downline type, the person they report to directly';
COMMENT ON COLUMN public.profiles.assigned_carriers IS 'Array of carrier IDs assigned by Caroline';
COMMENT ON COLUMN public.profiles.excluded_carriers IS 'Carriers the agent opted out of';
COMMENT ON COLUMN public.profiles.contracting_notes IS 'Internal notes from Caroline about this agent contracting';