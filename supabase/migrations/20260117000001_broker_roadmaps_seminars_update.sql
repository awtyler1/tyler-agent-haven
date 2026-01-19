-- Migration: Update seminar fields for business reality
-- Changes seminars_assigned (number) to seminar_eligible (boolean) + seminars_planned (optional number)

-- Step 1: Add new columns
ALTER TABLE broker_roadmaps
ADD COLUMN IF NOT EXISTS seminar_eligible boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS seminars_planned integer DEFAULT 0;

-- Step 2: Migrate existing data from seminars_assigned to new fields
-- If seminars_assigned > 0, they were eligible and had that many planned
UPDATE broker_roadmaps
SET
  seminar_eligible = CASE WHEN seminars_assigned > 0 THEN true ELSE false END,
  seminars_planned = COALESCE(seminars_assigned, 0)
WHERE seminar_eligible IS NULL OR seminar_eligible = false;

-- Step 3: Drop old column
ALTER TABLE broker_roadmaps
DROP COLUMN IF EXISTS seminars_assigned;

-- Step 4: Add comments for documentation
COMMENT ON COLUMN broker_roadmaps.seminar_eligible IS 'Whether agent is eligible for seminar assignments';
COMMENT ON COLUMN broker_roadmaps.seminars_planned IS 'Number of seminars already scheduled (0 if TBA)';
