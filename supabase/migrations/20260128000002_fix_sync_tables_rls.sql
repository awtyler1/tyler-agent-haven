-- Fix RLS policies for sync tables
-- The original policies incorrectly used profile_id = auth.uid()
-- but profile_id is the profile's UUID, not the auth user's UUID

-- =============================================================================
-- MONTHLY_SYNCS POLICIES
-- =============================================================================

DROP POLICY IF EXISTS "Users can view own syncs" ON monthly_syncs;
CREATE POLICY "Users can view own syncs" ON monthly_syncs FOR SELECT
  USING (profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert own syncs" ON monthly_syncs;
CREATE POLICY "Users can insert own syncs" ON monthly_syncs FOR INSERT
  WITH CHECK (profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update own syncs" ON monthly_syncs;
CREATE POLICY "Users can update own syncs" ON monthly_syncs FOR UPDATE
  USING (profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Admin access for viewing all syncs
DROP POLICY IF EXISTS "Admins can view all syncs" ON monthly_syncs;
CREATE POLICY "Admins can view all syncs" ON monthly_syncs FOR SELECT
  USING (
    has_role(auth.uid(), 'super_admin') OR
    has_role(auth.uid(), 'admin')
  );

-- =============================================================================
-- SYNC_CARRIER_UPLOADS POLICIES
-- =============================================================================

DROP POLICY IF EXISTS "Users can view own sync uploads" ON sync_carrier_uploads;
CREATE POLICY "Users can view own sync uploads" ON sync_carrier_uploads FOR SELECT
  USING (sync_id IN (
    SELECT id FROM monthly_syncs
    WHERE profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  ));

DROP POLICY IF EXISTS "Users can insert own sync uploads" ON sync_carrier_uploads;
CREATE POLICY "Users can insert own sync uploads" ON sync_carrier_uploads FOR INSERT
  WITH CHECK (sync_id IN (
    SELECT id FROM monthly_syncs
    WHERE profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  ));

DROP POLICY IF EXISTS "Users can update own sync uploads" ON sync_carrier_uploads;
CREATE POLICY "Users can update own sync uploads" ON sync_carrier_uploads FOR UPDATE
  USING (sync_id IN (
    SELECT id FROM monthly_syncs
    WHERE profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  ));

-- Admin access
DROP POLICY IF EXISTS "Admins can view all sync uploads" ON sync_carrier_uploads;
CREATE POLICY "Admins can view all sync uploads" ON sync_carrier_uploads FOR SELECT
  USING (
    has_role(auth.uid(), 'super_admin') OR
    has_role(auth.uid(), 'admin')
  );

-- =============================================================================
-- AGENT_CARRIERS POLICIES
-- =============================================================================

DROP POLICY IF EXISTS "Users can manage own carriers" ON agent_carriers;
CREATE POLICY "Users can view own carriers" ON agent_carriers FOR SELECT
  USING (profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own carriers" ON agent_carriers FOR INSERT
  WITH CHECK (profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own carriers" ON agent_carriers FOR UPDATE
  USING (profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own carriers" ON agent_carriers FOR DELETE
  USING (profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Admin access
DROP POLICY IF EXISTS "Admins can view all agent carriers" ON agent_carriers;
CREATE POLICY "Admins can view all agent carriers" ON agent_carriers FOR SELECT
  USING (
    has_role(auth.uid(), 'super_admin') OR
    has_role(auth.uid(), 'admin')
  );

-- =============================================================================
-- MILESTONES POLICIES
-- =============================================================================

DROP POLICY IF EXISTS "Users can view own milestones" ON milestones;
CREATE POLICY "Users can view own milestones" ON milestones FOR SELECT
  USING (profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert own milestones" ON milestones;
CREATE POLICY "Users can insert own milestones" ON milestones FOR INSERT
  WITH CHECK (profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Admin access
DROP POLICY IF EXISTS "Admins can view all milestones" ON milestones;
CREATE POLICY "Admins can view all milestones" ON milestones FOR SELECT
  USING (
    has_role(auth.uid(), 'super_admin') OR
    has_role(auth.uid(), 'admin')
  );
