# Agent Import Planning Document

**Date:** 2026-01-18
**Purpose:** Import 292 agents into the TIG Platform profiles table

---

## 1. Profiles Table Schema

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | UUID | NOT NULL | `gen_random_uuid()` |
| `user_id` | UUID | NOT NULL | - |
| `email` | TEXT | YES | - |
| `full_name` | TEXT | YES | - |
| `onboarding_status` | ENUM | NOT NULL | `'CONTRACTING_REQUIRED'` |
| `appointed_at` | TIMESTAMPTZ | YES | - |
| `created_at` | TIMESTAMPTZ | NOT NULL | `now()` |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `now()` |
| `manager_id` | UUID | YES | - |
| `setup_link_sent_at` | TIMESTAMPTZ | YES | - |
| `password_created_at` | TIMESTAMPTZ | YES | - |
| `first_login_at` | TIMESTAMPTZ | YES | - |
| `is_active` | BOOLEAN | NOT NULL | `true` |
| `developer_access` | BOOLEAN | YES | `false` |
| `is_test` | BOOLEAN | YES | `false` |
| `hierarchy_type` | TEXT | YES | - |
| `hierarchy_entity_id` | UUID | YES | - |
| `upline_user_id` | UUID | YES | - |
| `assigned_carriers` | UUID[] | YES | - |
| `excluded_carriers` | UUID[] | YES | - |
| `contracting_notes` | TEXT | YES | - |
| `ahip_cert_year` | INTEGER | YES | - |
| `ahip_cert_uploaded_at` | TIMESTAMPTZ | YES | - |
| `ahip_cert_file_path` | TEXT | YES | - |
| `npn` | VARCHAR(10) | YES | - |

### Onboarding Status Enum Values
- `CONTRACTING_REQUIRED` (default)
- `CONTRACTING_SUBMITTED`
- `APPOINTED`
- `SUSPENDED`

### Hierarchy Type Check Constraint
Valid values: `'direct'`, `'team'`, `'mga'`, `'ga'`, `'loa'`, `'downline'`, or `NULL`

---

## 2. Table Constraints

| Constraint Name | Type |
|-----------------|------|
| `profiles_pkey` | PRIMARY KEY (`id`) |
| `profiles_user_id_key` | UNIQUE (`user_id`) |
| `profiles_user_id_fkey` | FOREIGN KEY → `auth.users(id)` ON DELETE CASCADE |
| `profiles_manager_id_fkey` | FOREIGN KEY → `profiles(id)` |
| `profiles_hierarchy_entity_id_fkey` | FOREIGN KEY → `hierarchy_entities(id)` |
| `profiles_upline_user_id_fkey` | FOREIGN KEY → `auth.users(id)` |
| `profiles_hierarchy_type_check` | CHECK constraint on `hierarchy_type` values |

### Partial Unique Index
```sql
-- NPN must be unique when not null
CREATE UNIQUE INDEX idx_profiles_npn_unique ON profiles(npn) WHERE npn IS NOT NULL;
```

---

## 3. RLS Policies on `profiles`

| Policy Name | Command | Description |
|-------------|---------|-------------|
| `Users can view their own profile` | SELECT | `auth.uid() = user_id` |
| `Users can update their own profile` | UPDATE | `auth.uid() = user_id` |
| `Admins can view all profiles` | SELECT | `has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'contracting_admin')` |
| `Broker managers can view team profiles` | SELECT | `has_role(auth.uid(), 'broker_manager') AND manager_id = (user's profile id)` |
| `Admins can update profiles` | UPDATE | `has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'contracting_admin')` |
| `Admins can insert profiles` | INSERT | `has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'contracting_admin')` |

---

## 4. Foreign Key Dependencies

| Column | References |
|--------|------------|
| `user_id` | `auth.users(id)` ON DELETE CASCADE |
| `manager_id` | `profiles(id)` |
| `hierarchy_entity_id` | `hierarchy_entities(id)` |
| `upline_user_id` | `auth.users(id)` |

**Critical Note:** Each profile MUST have a corresponding `auth.users` record. You cannot insert a profile without first creating the user in `auth.users`.

---

## 5. Related Tables

### user_roles Table
When creating an agent, you must also insert a role:

```sql
INSERT INTO user_roles (user_id, role) VALUES ('...', 'independent_agent');
```

**Available Roles (`app_role` enum):**
- `super_admin`
- `contracting_admin`
- `broker_manager`
- `agent`
- `admin`
- `manager` (deprecated)
- `independent_agent`
- `internal_tig_agent`

---

## 6. Existing Profile Creation Code

### Edge Function: `create-agent` (supabase/functions/create-agent/index.ts)

The existing `create-agent` edge function does the following:

1. **Creates auth.users record:**
```typescript
const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({
  email,
  password: tempPassword,  // Random UUID, user sets their own
  email_confirm: true,
  user_metadata: { full_name: fullName },
});
```

2. **Inserts profile:**
```typescript
await supabaseAdmin.from("profiles").insert({
  user_id: newUser.user.id,
  email: email,
  full_name: fullName,
  manager_id: managerId,  // null = direct to TIG
  onboarding_status: isExistingAgent ? 'APPOINTED' : 'CONTRACTING_REQUIRED',
  is_active: true,
  is_test: isTest || false,
});
```

3. **Assigns role:**
```typescript
await supabaseAdmin.from("user_roles").insert({
  user_id: newUser.user.id,
  role: 'independent_agent'
});
```

4. **Optionally sends setup email** with password reset link

### Trigger: `on_auth_user_created`

There's a database trigger that auto-creates a profile when a user signs up:

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

**Important:** If you use `auth.admin.createUser()`, this trigger will fire and create a profile automatically. You may need to:
- Disable the trigger during bulk import, OR
- Update the auto-created profiles after import, OR
- Use `UPSERT` logic

---

## 7. Import Strategy Options

### Option A: Use Existing Edge Function (Slow but Safe)
Loop through agents and call `create-agent` for each one.
- ✅ Handles user creation, profile, role, and email
- ❌ Slow (one-by-one API calls)
- ❌ Will send 292 setup emails unless modified

### Option B: Direct SQL with Service Role Key (Fast)
Create a SQL script or edge function that does bulk inserts.

**Steps:**
1. Create users in `auth.users` via `supabaseAdmin.auth.admin.createUser()`
2. Insert profiles in batch (or let trigger handle it)
3. Insert roles in batch
4. Optionally update profiles with additional fields (manager_id, onboarding_status, npn)

### Option C: New Bulk Import Edge Function (Recommended)
Create a new edge function `bulk-import-agents` that:
1. Accepts array of agent data
2. Creates users in batch
3. Updates profiles with all necessary fields
4. Inserts roles
5. Returns summary (success/failure counts)
6. Optionally sends emails later in a separate batch

---

## 8. Required Data Fields for Import

### Minimum Required:
- `email` (unique, used for auth)
- `full_name`

### Highly Recommended:
- `npn` (National Producer Number)
- `manager_id` or `upline` (for hierarchy - need to map names to profile IDs)
- `onboarding_status` (likely 'APPOINTED' for existing agents)

### Optional:
- `ahip_cert_year`
- `hierarchy_type`
- `is_active` (default true)

---

## 9. Pre-Import Checklist

- [ ] Get list of 292 agents with: email, full_name, NPN, upline/hierarchy info
- [ ] Identify which agents are MGAs (need to import first to get their profile IDs)
- [ ] Map hierarchy relationships (who reports to whom)
- [ ] Decide on onboarding_status for all (probably 'APPOINTED')
- [ ] Decide whether to send setup emails (probably batch later)
- [ ] Handle duplicate emails (check against existing auth.users)
- [ ] Test with a small batch first (5-10 agents)

---

## 10. Sample Bulk Insert SQL (for reference)

```sql
-- After creating auth.users, you can bulk update profiles like this:
UPDATE profiles SET
  manager_id = '...',
  onboarding_status = 'APPOINTED',
  npn = '1234567890',
  is_active = true
WHERE user_id = '...';

-- Bulk insert roles
INSERT INTO user_roles (user_id, role)
SELECT user_id, 'independent_agent'::app_role
FROM profiles
WHERE user_id IN ('...', '...', '...');
```

---

## Next Steps

1. Provide the agent data (CSV or JSON format)
2. Identify hierarchy structure (who are the MGAs, who reports to whom)
3. Choose import strategy (A, B, or C)
4. Create and test import script
5. Run import in batches
6. Verify data integrity
7. Send setup emails (if needed)
