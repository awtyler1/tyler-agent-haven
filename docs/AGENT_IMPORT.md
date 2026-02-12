# Agent Import
> Consolidated from AGENT_IMPORT_CURRENT_STATE.md, AGENT_IMPORT_PLANNING.md — February 2026

---

## 1. Current Import Flow

### Overview

Agent import targets ~292 agents into the TIG Platform `profiles` table. Today, agents are created one-at-a-time through the `create-agent` edge function or automatically via the `on_auth_user_created` database trigger. No bulk import tooling exists yet.

### Existing Creation Path (`create-agent` Edge Function)

The `create-agent` function performs four steps in sequence:

1. **Create auth user** via `supabaseAdmin.auth.admin.createUser()` with a random temporary password
2. **Insert profile** row (user_id, email, full_name, manager_id, onboarding_status, is_active, is_test)
3. **Assign role** by inserting into `user_roles` (defaults to `independent_agent`)
4. **Optionally send setup email** with a password-reset link

### Auto-Profile Trigger

A database trigger fires on `auth.users` INSERT and auto-creates a profile:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, onboarding_status)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name',
    'CONTRACTING_REQUIRED'
  );
  RETURN NEW;
END;
$$;
```

**Implication for bulk import:** Using `auth.admin.createUser()` fires this trigger, creating a bare profile automatically. A bulk flow must either disable the trigger during import, update the auto-created profiles afterward, or use UPSERT logic.

### Agent Status Logic (UI)

| Status | Condition |
|--------|-----------|
| `active` | `user_id` is set |
| `invited` | `setup_link_sent_at` is set but no `user_id` |
| `imported` | No `user_id` and no `setup_link_sent_at` |

### Current File Structure

```
src/pages/admin/AgentsPage.tsx         # Main page with tab navigation
src/components/admin/AllAgentsTab.tsx   # Table view: search, filters, Quick View panel
src/components/admin/TeamsTab.tsx       # Teams list (MGAs with downline)
supabase/functions/create-agent/       # Single-agent creation edge function
```

**AllAgentsTab features:** search (name/email/NPN), status and upline filters, bulk action placeholders (Send Setup Links, Assign Upline), row-click Quick View panel.

**TeamsTab features:** search, "X agents across Y teams" stats, MGA list with recursive team counts, click-through to filtered All Agents view.

---

## 2. Database Schema

### `profiles` Table

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | UUID | NOT NULL | `gen_random_uuid()` | Primary key |
| `user_id` | UUID | YES | - | FK to `auth.users` — nullable to allow import without auth |
| `email` | TEXT | YES | - | |
| `full_name` | TEXT | YES | - | |
| `npn` | VARCHAR(10) | YES | - | National Producer Number; unique when not null |
| `onboarding_status` | ENUM | NOT NULL | `'CONTRACTING_REQUIRED'` | See enum values below |
| `appointed_at` | TIMESTAMPTZ | YES | - | |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` | |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` | |
| `manager_id` | UUID | YES | - | FK to `profiles(id)` — hierarchy |
| `setup_link_sent_at` | TIMESTAMPTZ | YES | - | |
| `password_created_at` | TIMESTAMPTZ | YES | - | |
| `first_login_at` | TIMESTAMPTZ | YES | - | |
| `is_active` | BOOLEAN | NOT NULL | `true` | |
| `developer_access` | BOOLEAN | YES | `false` | |
| `is_test` | BOOLEAN | YES | `false` | |
| `hierarchy_type` | TEXT | YES | - | Checked: `direct`, `team`, `mga`, `ga`, `loa`, `downline`, or NULL |
| `hierarchy_entity_id` | UUID | YES | - | FK to `hierarchy_entities(id)` |
| `upline_user_id` | UUID | YES | - | FK to `auth.users(id)` |
| `assigned_carriers` | UUID[] | YES | - | |
| `excluded_carriers` | UUID[] | YES | - | |
| `contracting_notes` | TEXT | YES | - | |
| `ahip_cert_year` | INTEGER | YES | - | |
| `ahip_cert_uploaded_at` | TIMESTAMPTZ | YES | - | |
| `ahip_cert_file_path` | TEXT | YES | - | |

#### Pending Migration Columns (Not Yet in Production)

| Migration | Columns Added |
|-----------|---------------|
| `20260118000000_agent_import_columns.sql` | `invited_at`, `phone`, `team_reference` |
| `20260118000001_add_phone_state_columns.sql` | `phone`, `state` |

**Note:** Both migrations add `phone`. They must be consolidated or applied in strict order.

#### Onboarding Status Enum

`CONTRACTING_REQUIRED` | `CONTRACTING_SUBMITTED` | `APPOINTED` | `SUSPENDED`

### Constraints and Indexes

| Name | Type | Detail |
|------|------|--------|
| `profiles_pkey` | PRIMARY KEY | `id` |
| `profiles_user_id_key` | UNIQUE | `user_id` |
| `profiles_user_id_fkey` | FOREIGN KEY | `auth.users(id)` ON DELETE CASCADE |
| `profiles_manager_id_fkey` | FOREIGN KEY | `profiles(id)` |
| `profiles_hierarchy_entity_id_fkey` | FOREIGN KEY | `hierarchy_entities(id)` |
| `profiles_upline_user_id_fkey` | FOREIGN KEY | `auth.users(id)` |
| `profiles_hierarchy_type_check` | CHECK | Validates `hierarchy_type` values |
| `idx_profiles_npn_unique` | PARTIAL UNIQUE | `npn` WHERE `npn IS NOT NULL` |

### RLS Policies on `profiles`

| Policy | Command | Condition |
|--------|---------|-----------|
| Users can view own profile | SELECT | `auth.uid() = user_id` |
| Users can update own profile | UPDATE | `auth.uid() = user_id` |
| Admins can view all profiles | SELECT | `has_role(uid, 'super_admin')` or `has_role(uid, 'contracting_admin')` |
| Broker managers can view team | SELECT | `has_role(uid, 'broker_manager')` and `manager_id` matches |
| Admins can update profiles | UPDATE | super_admin or contracting_admin |
| Admins can insert profiles | INSERT | super_admin or contracting_admin |

### `user_roles` Table

Each agent needs a role row. Available `app_role` values:

`super_admin` | `contracting_admin` | `broker_manager` | `agent` | `admin` | `manager` (deprecated) | `independent_agent` | `internal_tig_agent`

```sql
INSERT INTO user_roles (user_id, role) VALUES ('...', 'independent_agent');
```

### Foreign Key Dependencies

| Column | References | Notes |
|--------|------------|-------|
| `user_id` | `auth.users(id)` | CASCADE delete; each profile needs an auth record |
| `manager_id` | `profiles(id)` | Self-referencing hierarchy |
| `hierarchy_entity_id` | `hierarchy_entities(id)` | Optional org structure |
| `upline_user_id` | `auth.users(id)` | Optional upline reference |

---

## 3. Planned Improvements

### Import Strategy Options

| Option | Approach | Pros | Cons |
|--------|----------|------|------|
| **A. Existing Edge Function** | Loop `create-agent` per agent | Safe, handles full lifecycle | Slow (292 API calls), sends emails |
| **B. Direct SQL + Service Role** | Bulk SQL with `supabaseAdmin` | Fast | Manual trigger management |
| **C. New Bulk Import Function** (recommended) | New `bulk-import-agents` edge function | Batch creation, summary report, deferred emails | Needs development |

### Recommended Approach (Option C)

A new `bulk-import-agents` edge function that:

1. Accepts an array of agent data (JSON)
2. Creates auth users in batch
3. Updates/upserts profiles with all necessary fields
4. Inserts roles in batch
5. Returns success/failure summary
6. Sends setup emails in a separate deferred batch

### Required Data Fields

**Minimum:** `email` (unique), `full_name`

**Recommended:** `npn`, `manager_id` or upline name (mapped to profile ID), `onboarding_status` (likely `APPOINTED` for existing agents)

**Optional:** `ahip_cert_year`, `hierarchy_type`, `is_active` (default true), `phone`, `state`

### Pending Migrations

Apply before import:

```bash
npx supabase db push
```

Then regenerate TypeScript types:

```bash
npx supabase gen types typescript --project-id <project-id> > src/integrations/supabase/types.ts
```

---

## 4. Implementation Notes

### Pre-Import Checklist

- [ ] Obtain agent list with: email, full_name, NPN, upline/hierarchy info
- [ ] Identify MGAs — import first to obtain their profile IDs for `manager_id` references
- [ ] Map hierarchy relationships (who reports to whom)
- [ ] Set onboarding_status (probably `APPOINTED` for existing agents)
- [ ] Decide on setup email timing (batch later, not during import)
- [ ] Check for duplicate emails against existing `auth.users`
- [ ] Consolidate the two pending phone-column migrations
- [ ] Test with a small batch (5-10 agents) before full run

### Sample Bulk SQL

```sql
-- After creating auth.users, bulk-update the auto-created profiles:
UPDATE profiles SET
  manager_id = '...',
  onboarding_status = 'APPOINTED',
  npn = '1234567890',
  is_active = true
WHERE user_id = '...';

-- Bulk insert roles for new agents:
INSERT INTO user_roles (user_id, role)
SELECT user_id, 'independent_agent'::app_role
FROM profiles
WHERE user_id IN ('...', '...', '...');
```

### Diagnostic Queries

```sql
-- Profile counts by auth status
SELECT
  COUNT(*) as total,
  COUNT(user_id) as with_auth,
  COUNT(*) - COUNT(user_id) as without_auth,
  COUNT(setup_link_sent_at) as setup_link_sent
FROM profiles;

-- Check pending migration columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('phone', 'state', 'team_reference', 'invited_at')
ORDER BY column_name;

-- Team distribution
SELECT
  m.full_name as manager,
  COUNT(p.id) as team_size
FROM profiles p
JOIN profiles m ON p.manager_id = m.id
WHERE p.is_active = true
GROUP BY m.id, m.full_name
ORDER BY team_size DESC;
```

### Execution Order

1. Consolidate and apply pending migrations
2. Regenerate Supabase TypeScript types
3. Build and deploy `bulk-import-agents` edge function
4. Import MGAs first (to establish hierarchy IDs)
5. Import remaining agents in batches, referencing MGA profile IDs
6. Verify data integrity (counts, hierarchy, roles)
7. Send setup emails in controlled batches
