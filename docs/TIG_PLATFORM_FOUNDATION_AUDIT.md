# TIG Platform Foundation Audit

**Date:** January 17, 2026
**Auditor:** Claude Opus 4.5
**Scope:** 8 Core Platform Pillars

---

## Executive Summary Table

| Pillar | Status | Summary |
|--------|--------|---------|
| 1. Hierarchy | ⚠️ PARTIAL | Has `manager_id`/`upline_user_id` + entity tables, but two systems coexist with no clear canonical model |
| 2. User Management | ✅ SOLID | Complete agent creation flow with new/existing distinction, proper onboarding states |
| 3. Role-Based Access | ✅ SOLID | 5 roles defined, comprehensive RLS policies, agents properly isolated |
| 4. Data Integrity | ❌ CRITICAL | NPN not on profiles, no UNIQUE on email, missing essential constraints |
| 5. Audit Trail | ⚠️ PARTIAL | activity_logs table exists but manual-only, no automatic triggers |
| 6. File Storage | ✅ SOLID | 3 buckets with proper RLS, files linked via columns, signed URLs |
| 7. Email | ✅ SOLID | Resend + Microsoft Graph integration, communication logging exists |
| 8. Environments | ⚠️ PARTIAL | feature_flags table + is_test column exist, but no staging environment |

---

## 1. HIERARCHY

### ✅ SOLID:
- `manager_id` column exists on profiles (UUID FK to profiles.id)
- `upline_user_id` column exists on profiles (UUID FK to auth.users)
- `hierarchy_type` column with CHECK constraint: `('direct', 'team', 'mga', 'ga', 'loa', 'downline')`
- `hierarchy_entity_id` column links profiles to organizational units
- `hierarchy_entities` table created with proper structure (id, name, entity_type, parent_entity_id, is_active)
- `entity_owners` table created for mapping users to entities
- `HierarchyAssignmentPanel.tsx` component is functional with auto-save
- RLS policies use manager_id/upline_user_id for team visibility

### ⚠️ PARTIAL:
- TWO hierarchy systems coexist (`manager_id` vs entity-based hierarchy)
- `HierarchyManagement.tsx` is a placeholder stub (19 lines, no functionality)
- No UI for managing `entity_owners` table
- TypeScript types missing Relationships array for profiles table FKs

### ❌ MISSING:
- `reports_to_id` column never implemented (mentioned in CLAUDE_CONTEXT.md line 46)
- No org chart visualization
- No "My Team" or "My Downline" dedicated views
- No multi-level hierarchy traversal queries

### 📋 ACTIONS NEEDED:
1. **DECIDE**: Choose canonical hierarchy model - either `manager_id` OR entity-based system
2. **ADD**: TypeScript Relationships to `profiles` in `src/integrations/supabase/types.ts`
3. **IMPLEMENT**: HierarchyManagement component for entity owner management
4. **CREATE**: Team view page for managers to see their downline
5. **DOCUMENT**: Hierarchy model in code comments for future developers

---

## 2. USER MANAGEMENT

### ✅ SOLID:
- `NewAgentPage.tsx` provides complete agent creation UI
- `create-agent` edge function handles:
  - Auth user creation with temporary password
  - Profile row insertion with all hierarchy fields
  - Role assignment (independent_agent)
  - Setup email sending via Resend
- Clear distinction between "New Agent" (CONTRACTING_REQUIRED) and "Existing Agent" (APPOINTED)
- `SetPasswordPage.tsx` enforces strong password requirements (12+ chars, mixed case, number, special)
- `ProtectedRoute.tsx` properly routes agents based on onboarding_status
- Onboarding status enum: `CONTRACTING_REQUIRED → CONTRACTING_SUBMITTED → APPOINTED`
- Comprehensive timestamps tracked: `setup_link_sent_at`, `password_created_at`, `first_login_at`, `appointed_at`

### ⚠️ PARTIAL:
- No bulk agent import functionality
- No self-registration option (admin-only creation)
- No password expiration policy

### ❌ MISSING:
- No agent deactivation reason tracking
- No re-activation workflow
- No agent profile edit audit trail

### 📋 ACTIONS NEEDED:
1. **ADD**: Deactivation reason field to profiles (`deactivated_reason`, `deactivated_at`)
2. **CONSIDER**: Bulk agent import from CSV for mass onboarding
3. **LOG**: Profile edits to activity_logs for audit trail

---

## 3. ROLE-BASED ACCESS

### ✅ SOLID:
- 5 roles defined in `app_role` enum:
  - `super_admin` (highest)
  - `admin`
  - `manager`
  - `internal_tig_agent`
  - `independent_agent`
- Helper functions prevent RLS recursion: `has_role()`, `get_user_role()`, `get_my_profile_id()`
- **Agents CANNOT see other agents' data** - verified across all key tables:
  - `profiles`: users can only view/update their own
  - `user_roles`: users can only view their own
  - `contracting_applications`: strict user_id isolation
  - `carrier_statuses`: strict user_id isolation
  - `agent_certifications`: strict profile_id isolation
- Managers can view direct reports via `manager_id = get_my_profile_id()`
- Only `super_admin` can modify role assignments
- Storage RLS restricts files to `{user_id}/` paths

### ⚠️ PARTIAL:
- `document_chunks` and `processing_jobs` have `ALLOW ALL` policies (intentional for AI features?)
- Activity logs SELECT is super_admin only (agents can't see their own logs)

### ❌ MISSING:
- No role change audit logging
- No permission matrix documentation

### 📋 ACTIONS NEEDED:
1. **VERIFY**: `document_chunks` ALLOW ALL policy is intentional
2. **ADD**: Role change logging to activity_logs
3. **CREATE**: Permission matrix documentation for compliance

---

## 4. DATA INTEGRITY

### ✅ SOLID:
- `user_id` is UNIQUE on profiles (inherits from auth.users FK)
- `onboarding_status` uses proper ENUM type
- CHECK constraints exist on status fields:
  - `contracting_applications.status`: `('in_progress', 'submitted', 'approved', 'rejected')`
  - `carrier_statuses.contracting_status`: `('not_started', 'in_progress', 'contracted', 'issue')`
  - `processing_jobs.status`: `('pending', 'processing', 'completed', 'failed', 'cancelled')`
- Indexes exist on key query fields:
  - `idx_profiles_is_active`
  - `idx_profiles_hierarchy_type`
  - `idx_profiles_hierarchy_entity_id`
  - `idx_profiles_upline_user_id`

### ⚠️ PARTIAL:
- `npn_number` exists only on `contracting_applications`, not on `profiles`
- No NOT NULL constraint on critical fields like `email`, `full_name`

### ❌ MISSING - CRITICAL:
- **NO NPN column on profiles table** - NPN is the agent's unique identifier!
- **NO UNIQUE constraint on email** in profiles
- **NO CHECK constraint on state fields** (no validation for valid US state codes)
- **NO foreign key constraint** from profiles.manager_id to profiles.id in types

### 📋 ACTIONS NEEDED:
1. **CRITICAL**: Add `npn` column to profiles table with UNIQUE NOT NULL constraint
2. **CRITICAL**: Add UNIQUE constraint on `profiles.email`
3. **ADD**: CHECK constraint for valid US state codes where applicable
4. **ADD**: Foreign key definition for profiles.manager_id → profiles.id
5. **ADD**: NOT NULL constraints on `email`, `full_name` with defaults

**Recommended Migration:**
```sql
-- Add NPN to profiles
ALTER TABLE profiles ADD COLUMN npn VARCHAR(10);
ALTER TABLE profiles ADD CONSTRAINT profiles_npn_unique UNIQUE (npn);

-- Add email unique constraint
ALTER TABLE profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);
```

---

## 5. AUDIT TRAIL

### ✅ SOLID:
- `activity_logs` table exists with proper schema:
  - `user_id`, `action_type`, `entity_type`, `entity_id`, `metadata` (JSONB), `created_at`
- Logs are immutable (no UPDATE/DELETE RLS policies)
- `rts_import_logs` table tracks certification imports
- `activityLogger.ts` utility provides fire-and-forget logging
- Predefined action types: LOGIN, LOGOUT, CONTRACTING_SUBMITTED, QUEUE_STATUS_CHANGED, SENT_TO_PINNACLE, etc.
- Activity log viewer exists at `ActivityLogPage.tsx`

### ⚠️ PARTIAL:
- Logging is **manual/application-driven only** - developers must call `logActivity()`
- IP address field exists but not populated
- Coverage gaps - many actions not logged:
  - Document upload/download
  - Profile field changes
  - Password changes
  - Agent approval/rejection

### ❌ MISSING:
- **NO automatic database triggers** for change tracking
- **NO field-level change tracking** (old_value → new_value)
- **NO deletion audit** (hard deletes lose data)
- **NO audit reports** for compliance

### 📋 ACTIONS NEEDED:
1. **ADD**: Database triggers for automatic INSERT/UPDATE/DELETE logging on key tables
2. **EXPAND**: logActivity() calls to cover all document operations
3. **IMPLEMENT**: Field-level change tracking with before/after values
4. **ADD**: IP address capture from request headers
5. **CREATE**: Compliance audit report generator

**Recommended Trigger Example:**
```sql
CREATE OR REPLACE FUNCTION audit_profiles_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activity_logs (user_id, action_type, entity_type, entity_id, metadata)
  VALUES (
    COALESCE(auth.uid(), NEW.user_id),
    CASE TG_OP
      WHEN 'INSERT' THEN 'profile_created'
      WHEN 'UPDATE' THEN 'profile_updated'
      WHEN 'DELETE' THEN 'profile_deleted'
    END,
    'profile',
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW))
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 6. FILE STORAGE

### ✅ SOLID:
- **3 Storage Buckets:**
  - `agent-documents` (AHIP certificates) - 10MB limit, PDF/PNG/JPEG only
  - `certificates` (annual certifications)
  - `contracting-documents` (supporting documents)
- All buckets are **private** (public: false)
- Proper RLS policies:
  - Users can only access `{user_id}/` paths
  - Admins can view all documents
- Files linked via database columns:
  - `profiles.ahip_cert_file_path`
  - `contracting_applications.uploaded_documents` (JSONB)
  - `broker_roadmaps.pdf_storage_path`
- Signed URLs with 5-minute expiry for secure access
- Upload components: `FileDropZone.tsx`, `DocumentsSection.tsx`
- Download with signed URLs in `AgentDocumentsCard.tsx`

### ⚠️ PARTIAL:
- No virus scanning on uploads
- No file versioning
- Storage cleanup is manual (no automatic orphan detection)

### ❌ MISSING:
- No document audit logging (upload/download events)
- No file retention policy
- No storage quota per user

### 📋 ACTIONS NEEDED:
1. **ADD**: File upload/download logging to activity_logs
2. **IMPLEMENT**: Storage cleanup job for orphaned files
3. **CONSIDER**: File versioning for compliance (keep previous versions)

---

## 7. EMAIL

### ✅ SOLID:
- **Resend** integration for transactional emails:
  - `send-agent-inquiry` - public form inquiries
  - `send-setup-link` - account activation
  - `send-contracting-packet` - sends to Pinnacle
  - `create-agent` / `create-admin` - welcome emails
- **Microsoft Graph** integration for user-initiated emails:
  - OAuth 2.0 flow via `microsoft-oauth-start/callback`
  - Token refresh handled automatically
  - `microsoft-send-email` edge function
- **Email logging:**
  - `contracting_communications` table logs all comms to agents
  - Tracks: recipient, subject, body, carriers, attachments, sent_by, sent_at
  - `microsoft_oauth_tokens` stores encrypted OAuth tokens
- `useSendEmail` React hook for frontend email sending
- Proper sender addresses: `caroline@tylerinsurancegroup.com`, `austin@tylerinsurancegroup.com`

### ⚠️ PARTIAL:
- Email templates are hardcoded in edge functions (no template management)
- Token encryption marked as TODO (decryption not implemented)
- Rate limiting only on `send-agent-inquiry` (2/10min)

### ❌ MISSING:
- No email bounce/delivery tracking
- No email template editor UI
- No scheduled/automated emails
- No email analytics dashboard

### 📋 ACTIONS NEEDED:
1. **IMPLEMENT**: Token encryption/decryption properly
2. **ADD**: Resend webhook for delivery status tracking
3. **CREATE**: Email template management system
4. **CONSIDER**: Email scheduling for reminders

---

## 8. ENVIRONMENTS

### ✅ SOLID:
- `feature_flags` table with RLS (developers only can modify):
  - Flags: `new_agent_form`, `pdf_v2`, `dark_mode`, `agent_chat`, `maintenance_mode`, `test_mode`
- `FeatureFlagsContext.tsx` provides `useFeatureFlags()` hook with `isEnabled()`
- `is_test` column on `contracting_applications` and `carrier_statuses`
- Admin pages filter out test data: `.or('is_test.is.null,is_test.eq.false')`
- Test badge displays on test submissions in UI
- Test user seeding script: `supabase/seed_test_agents.sql` with 6 personas
- `profiles.developer_access` gates feature flag management

### ⚠️ PARTIAL:
- `test_mode` flag exists but not wired into submission flow
- Sentry configured with environment but uses single project
- No staging database or environment

### ❌ MISSING:
- **No staging environment** (single Supabase project)
- **No production/development API key separation**
- **No automated test data cleanup**
- **No environment-specific feature flag defaults**

### 📋 ACTIONS NEEDED:
1. **WIRE**: `test_mode` feature flag to automatically mark submissions as test
2. **CREATE**: Staging Supabase project for pre-production testing
3. **ADD**: Test data expiration/cleanup job
4. **SEPARATE**: API keys for dev/staging/production
5. **IMPLEMENT**: Environment-specific feature flag defaults

---

## TOP 10 PRIORITY FIXES FOR PRODUCTION LAUNCH

| Priority | Pillar | Issue | Fix | Impact |
|----------|--------|-------|-----|--------|
| **1** | Data Integrity | No NPN column on profiles | Add `npn` VARCHAR(10) UNIQUE NOT NULL to profiles | CRITICAL - NPN is the universal agent identifier |
| **2** | Data Integrity | No email UNIQUE constraint | Add UNIQUE constraint on `profiles.email` | CRITICAL - Prevents duplicate accounts |
| **3** | Audit Trail | No automatic change tracking | Add database triggers for profiles/applications | HIGH - Required for compliance audits |
| **4** | Hierarchy | Two conflicting hierarchy systems | Choose `manager_id` OR entity-based, deprecate other | HIGH - Causes confusion and bugs |
| **5** | Email | OAuth tokens not encrypted | Implement proper encryption/decryption for tokens | HIGH - Security vulnerability |
| **6** | Environments | No staging environment | Create staging Supabase project | HIGH - Cannot safely test changes |
| **7** | Audit Trail | Missing audit coverage | Add logActivity() calls for document ops, profile edits | MEDIUM - Compliance gaps |
| **8** | File Storage | No document audit logging | Log all upload/download events | MEDIUM - Cannot track who accessed files |
| **9** | User Management | No deactivation tracking | Add `deactivated_reason`, `deactivated_at` columns | MEDIUM - No audit trail for suspensions |
| **10** | Data Integrity | No state code validation | Add CHECK constraint for valid US state codes | LOW - Data quality improvement |

---

## Recommended Migration Script for Critical Fixes

```sql
-- Migration: TIG Platform Critical Fixes
-- Priority 1: Add NPN to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS npn VARCHAR(10);

-- Only add constraint if there's no existing duplicate data
-- In production, clean data first, then add constraint
-- ALTER TABLE public.profiles ADD CONSTRAINT profiles_npn_unique UNIQUE (npn);

-- Priority 2: Add email unique constraint
-- Same caveat - clean duplicates first if any exist
-- ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);

-- Priority 3: Profile change audit trigger
CREATE OR REPLACE FUNCTION audit_profile_changes()
RETURNS TRIGGER AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get current user from Supabase auth context
  current_user_id := auth.uid();

  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.activity_logs (user_id, action_type, entity_type, entity_id, metadata)
    VALUES (
      current_user_id,
      'profile_updated',
      'profile',
      NEW.id,
      jsonb_build_object(
        'changed_fields', (
          SELECT jsonb_object_agg(key, jsonb_build_object('old', old_val, 'new', new_val))
          FROM (
            SELECT key,
                   old.value as old_val,
                   new.value as new_val
            FROM jsonb_each(to_jsonb(OLD)) old
            FULL OUTER JOIN jsonb_each(to_jsonb(NEW)) new USING (key)
            WHERE old.value IS DISTINCT FROM new.value
              AND key NOT IN ('updated_at')
          ) changed
        )
      )
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_audit_profile_changes ON public.profiles;
CREATE TRIGGER trigger_audit_profile_changes
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION audit_profile_changes();

-- Priority 9: Add deactivation tracking
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deactivated_reason TEXT;
```

---

## Next Steps

1. Review and approve this audit
2. Create Jira/Linear tickets for each action item
3. Schedule critical fixes (Priority 1-3) for immediate sprint
4. Plan medium-priority fixes for next sprint
5. Schedule quarterly audit re-run to track progress

---

*Generated by Claude Opus 4.5 on 2026-01-17*
