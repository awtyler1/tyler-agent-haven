-- Create hierarchy_entities table
CREATE TABLE public.hierarchy_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('team', 'mga', 'ga')),
  parent_entity_id uuid REFERENCES public.hierarchy_entities(id) ON DELETE SET NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes
CREATE INDEX idx_hierarchy_entities_entity_type ON public.hierarchy_entities(entity_type);
CREATE INDEX idx_hierarchy_entities_parent_entity_id ON public.hierarchy_entities(parent_entity_id);

-- Add trigger for updated_at
CREATE TRIGGER update_hierarchy_entities_updated_at
  BEFORE UPDATE ON public.hierarchy_entities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.hierarchy_entities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hierarchy_entities
CREATE POLICY "Authenticated users can read hierarchy_entities"
  ON public.hierarchy_entities
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert hierarchy_entities"
  ON public.hierarchy_entities
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update hierarchy_entities"
  ON public.hierarchy_entities
  FOR UPDATE
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete hierarchy_entities"
  ON public.hierarchy_entities
  FOR DELETE
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

-- Create entity_owners table
CREATE TABLE public.entity_owners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES public.hierarchy_entities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE (entity_id, user_id)
);

-- Enable RLS
ALTER TABLE public.entity_owners ENABLE ROW LEVEL SECURITY;

-- RLS Policies for entity_owners
CREATE POLICY "Authenticated users can read entity_owners"
  ON public.entity_owners
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert entity_owners"
  ON public.entity_owners
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update entity_owners"
  ON public.entity_owners
  FOR UPDATE
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete entity_owners"
  ON public.entity_owners
  FOR DELETE
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));

-- Seed A&A team record
INSERT INTO public.hierarchy_entities (name, entity_type) VALUES ('A&A', 'team');