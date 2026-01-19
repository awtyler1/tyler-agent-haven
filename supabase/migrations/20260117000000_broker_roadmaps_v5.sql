-- Migration: broker_roadmaps V5 schema update
-- Removes personality-based fields, adds resource-based fields

-- Step 1: Add new columns
ALTER TABLE broker_roadmaps
ADD COLUMN IF NOT EXISTS lead_star_leads integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS seminars_assigned integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS activity_targets jsonb,
ADD COLUMN IF NOT EXISTS economics jsonb;

-- Step 2: Migrate existing seminar_assigned boolean to seminars_assigned integer
UPDATE broker_roadmaps
SET seminars_assigned = CASE WHEN seminar_assigned = true THEN 2 ELSE 0 END
WHERE seminars_assigned IS NULL OR seminars_assigned = 0;

-- Step 3: Drop old columns (personality-based fields we no longer use)
ALTER TABLE broker_roadmaps
DROP COLUMN IF EXISTS personality,
DROP COLUMN IF EXISTS phone_comfort,
DROP COLUMN IF EXISTS community_connections,
DROP COLUMN IF EXISTS strengths,
DROP COLUMN IF EXISTS months_in_business,
DROP COLUMN IF EXISTS seminar_assigned,
DROP COLUMN IF EXISTS experience_phase;

-- Step 4: Add comments for documentation
COMMENT ON COLUMN broker_roadmaps.lead_star_leads IS 'Number of Lead Star leads assigned per month (0 if none)';
COMMENT ON COLUMN broker_roadmaps.seminars_assigned IS 'Number of seminar slots assigned per month (0 if none)';
COMMENT ON COLUMN broker_roadmaps.activity_targets IS 'Calculated activity targets JSON (daily_attempts, weekly_conversations, etc.)';
COMMENT ON COLUMN broker_roadmaps.economics IS 'Calculated economics JSON (monthly_income, annual_income, 3-year projections)';
