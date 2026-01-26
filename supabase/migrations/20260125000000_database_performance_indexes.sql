-- Database Performance Optimization
-- Adds missing indexes for frequently queried columns

-- ============================================
-- PROFILES TABLE INDEXES
-- ============================================

-- Enable pg_trgm extension for trigram text search (ILIKE optimization)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN indexes for admin text search (full_name, email with ILIKE)
-- Trigram indexes allow efficient pattern matching with wildcards
CREATE INDEX IF NOT EXISTS idx_profiles_full_name_trgm
  ON profiles USING gin (full_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_profiles_email_trgm
  ON profiles USING gin (email gin_trgm_ops);

-- Index on manager_id for hierarchy/upline queries
CREATE INDEX IF NOT EXISTS idx_profiles_manager_id
  ON profiles(manager_id)
  WHERE manager_id IS NOT NULL;

-- Composite index for dashboard agent listing (active agents by status)
CREATE INDEX IF NOT EXISTS idx_profiles_active_status
  ON profiles(is_active, onboarding_status);

-- Index for onboarding status filtering
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_status
  ON profiles(onboarding_status);

-- ============================================
-- CONTRACTING_APPLICATIONS TABLE INDEXES
-- ============================================

-- Index on user_id for per-user application lookups
CREATE INDEX IF NOT EXISTS idx_contracting_applications_user_id
  ON contracting_applications(user_id);

-- Index on status for queue filtering (most common: status='submitted')
CREATE INDEX IF NOT EXISTS idx_contracting_applications_status
  ON contracting_applications(status);

-- Composite index for contracting queue: status + submitted_at ordering
CREATE INDEX IF NOT EXISTS idx_contracting_applications_queue
  ON contracting_applications(status, submitted_at DESC)
  WHERE status = 'submitted';

-- Index for submitted_at ordering
CREATE INDEX IF NOT EXISTS idx_contracting_applications_submitted_at
  ON contracting_applications(submitted_at DESC)
  WHERE submitted_at IS NOT NULL;

-- ============================================
-- USER_ROLES TABLE INDEXES
-- ============================================

-- Index for role lookups (admin dashboard, permission checks)
CREATE INDEX IF NOT EXISTS idx_user_roles_role
  ON user_roles(role);

-- Composite index for user+role lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role
  ON user_roles(user_id, role);

-- ============================================
-- CARRIER_STATUSES TABLE (verify existing)
-- ============================================

-- Composite index for agent carrier status lookups
CREATE INDEX IF NOT EXISTS idx_carrier_statuses_user_status
  ON carrier_statuses(user_id, contracting_status);

-- ============================================
-- ACTIVITY_LOGS OPTIMIZATION
-- ============================================

-- Index for activity log time-based queries (already has idx_activity_logs_user_created)
-- Adding index on created_at alone for admin activity viewer sorting
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at
  ON activity_logs(created_at DESC);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON INDEX idx_profiles_full_name_trgm IS 'Trigram index for ILIKE search on agent names';
COMMENT ON INDEX idx_profiles_email_trgm IS 'Trigram index for ILIKE search on agent emails';
COMMENT ON INDEX idx_contracting_applications_queue IS 'Partial index for pending contracting queue';
COMMENT ON INDEX idx_activity_logs_created_at IS 'Index for activity log time-based sorting';
