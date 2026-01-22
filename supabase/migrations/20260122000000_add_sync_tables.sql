-- Track monthly sync completion
CREATE TABLE IF NOT EXISTS monthly_syncs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) NOT NULL,
  month DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  total_clients INTEGER,
  previous_month_clients INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, month)
);

-- Track individual carrier uploads within a sync
CREATE TABLE IF NOT EXISTS sync_carrier_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_id UUID REFERENCES monthly_syncs(id) NOT NULL,
  carrier_id UUID REFERENCES carriers(id) NOT NULL,
  production_upload_id UUID REFERENCES production_uploads(id),
  client_count INTEGER,
  previous_count INTEGER,
  uploaded_at TIMESTAMPTZ,
  UNIQUE(sync_id, carrier_id)
);

-- Track which carriers each agent uses
CREATE TABLE IF NOT EXISTS agent_carriers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) NOT NULL,
  carrier_id UUID REFERENCES carriers(id) NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, carrier_id)
);

-- Track milestone achievements
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) NOT NULL,
  milestone_type TEXT NOT NULL,
  milestone_value INTEGER NOT NULL,
  achieved_at TIMESTAMPTZ DEFAULT NOW(),
  sync_id UUID REFERENCES monthly_syncs(id),
  UNIQUE(profile_id, milestone_type, milestone_value)
);

-- RLS Policies
ALTER TABLE monthly_syncs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_carrier_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

-- monthly_syncs policies
DROP POLICY IF EXISTS "Users can view own syncs" ON monthly_syncs;
CREATE POLICY "Users can view own syncs" ON monthly_syncs FOR SELECT USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own syncs" ON monthly_syncs;
CREATE POLICY "Users can insert own syncs" ON monthly_syncs FOR INSERT WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own syncs" ON monthly_syncs;
CREATE POLICY "Users can update own syncs" ON monthly_syncs FOR UPDATE USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "Service role can manage syncs" ON monthly_syncs;
CREATE POLICY "Service role can manage syncs" ON monthly_syncs FOR ALL USING (auth.role() = 'service_role');

-- sync_carrier_uploads policies
DROP POLICY IF EXISTS "Users can view own sync uploads" ON sync_carrier_uploads;
CREATE POLICY "Users can view own sync uploads" ON sync_carrier_uploads FOR SELECT
  USING (sync_id IN (SELECT id FROM monthly_syncs WHERE profile_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert own sync uploads" ON sync_carrier_uploads;
CREATE POLICY "Users can insert own sync uploads" ON sync_carrier_uploads FOR INSERT
  WITH CHECK (sync_id IN (SELECT id FROM monthly_syncs WHERE profile_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update own sync uploads" ON sync_carrier_uploads;
CREATE POLICY "Users can update own sync uploads" ON sync_carrier_uploads FOR UPDATE
  USING (sync_id IN (SELECT id FROM monthly_syncs WHERE profile_id = auth.uid()));

DROP POLICY IF EXISTS "Service role can manage sync uploads" ON sync_carrier_uploads;
CREATE POLICY "Service role can manage sync uploads" ON sync_carrier_uploads FOR ALL USING (auth.role() = 'service_role');

-- agent_carriers policies
DROP POLICY IF EXISTS "Users can manage own carriers" ON agent_carriers;
CREATE POLICY "Users can manage own carriers" ON agent_carriers FOR ALL USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "Service role can manage agent carriers" ON agent_carriers;
CREATE POLICY "Service role can manage agent carriers" ON agent_carriers FOR ALL USING (auth.role() = 'service_role');

-- milestones policies
DROP POLICY IF EXISTS "Users can view own milestones" ON milestones;
CREATE POLICY "Users can view own milestones" ON milestones FOR SELECT USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own milestones" ON milestones;
CREATE POLICY "Users can insert own milestones" ON milestones FOR INSERT WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS "Service role can manage milestones" ON milestones;
CREATE POLICY "Service role can manage milestones" ON milestones FOR ALL USING (auth.role() = 'service_role');

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_monthly_syncs_profile_month ON monthly_syncs(profile_id, month);
CREATE INDEX IF NOT EXISTS idx_sync_carrier_uploads_sync ON sync_carrier_uploads(sync_id);
CREATE INDEX IF NOT EXISTS idx_agent_carriers_profile ON agent_carriers(profile_id);
CREATE INDEX IF NOT EXISTS idx_milestones_profile ON milestones(profile_id);
