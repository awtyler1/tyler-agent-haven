# Agent Import - Current State Analysis

**Date:** 2026-01-18

---

## 1. Profiles Table Schema (from Supabase Types)

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| `id` | uuid | NOT NULL | Primary key, auto-generated |
| `user_id` | uuid | **YES** | FK to auth.users - NULLABLE (allows import without auth) |
| `email` | text | YES | |
| `full_name` | text | YES | |
| `npn` | varchar(10) | YES | National Producer Number |
| `onboarding_status` | enum | NOT NULL | Default: 'CONTRACTING_REQUIRED' |
| `appointed_at` | timestamptz | YES | |
| `created_at` | timestamptz | NOT NULL | |
| `updated_at` | timestamptz | NOT NULL | |
| `manager_id` | uuid | YES | FK to profiles(id) - hierarchy |
| `setup_link_sent_at` | timestamptz | YES | |
| `password_created_at` | timestamptz | YES | |
| `first_login_at` | timestamptz | YES | |
| `is_active` | boolean | NOT NULL | Default: true |
| `developer_access` | boolean | YES | Default: false |
| `is_test` | boolean | YES | Default: false |
| `assigned_carriers` | uuid[] | YES | |
| `excluded_carriers` | uuid[] | YES | |
| `contracting_notes` | text | YES | |
| `ahip_cert_year` | integer | YES | |
| `ahip_cert_uploaded_at` | timestamptz | YES | |
| `ahip_cert_file_path` | text | YES | |

### Columns NOT Yet in Production (Migrations Not Applied)

These migrations exist locally but haven't been pushed:

| Migration | Columns Added |
|-----------|---------------|
| `20260118000000_agent_import_columns.sql` | `invited_at`, `phone`, `team_reference` |
| `20260118000001_add_phone_state_columns.sql` | `phone`, `state` |

**Note:** There's overlap - both migrations add `phone`. Need to consolidate or apply in order.

---

## 2. Current Files Structure

```
src/pages/admin/
└── AgentsPage.tsx          # Main page with tab navigation

src/components/admin/
├── AllAgentsTab.tsx        # Table view with search, filters, Quick View panel
├── TeamsTab.tsx            # Teams list (MGAs with downline)
├── AgentSearch.tsx         # Search component (may be unused now)
├── AgentStatsLine.tsx      # Stats display (may be unused now)
├── TeamRow.tsx             # Team row component (may be unused now)
└── AgentRow.tsx            # Agent row component (may be unused now)

scripts/
├── deploy-functions.ps1    # PowerShell deploy script
└── deploy-functions.sh     # Bash deploy script
```

**No import scripts exist yet.**

---

## 3. AgentsPage.tsx Structure

```
┌─────────────────────────────────────────────────────────┐
│ Navigation                                               │
├─────────────────────────────────────────────────────────┤
│ ← Back    Agents                        [+ Add Agent]   │
├─────────────────────────────────────────────────────────┤
│ [All Agents] [Teams]                                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Tab Content:                                           │
│  - All Agents: <AllAgentsTab />                         │
│  - Teams: <TeamsTab />                                  │
│                                                         │
│  Click team → switches to All Agents with upline filter │
│                                                         │
└─────────────────────────────────────────────────────────┘
│ Footer                                                  │
└─────────────────────────────────────────────────────────┘
```

---

## 4. AllAgentsTab Features

- **Search:** Name, email, NPN
- **Filters:** Status (imported/invited/active), Upline (manager), State
- **Table columns:** Checkbox, Name, Phone, Email, Upline, Status dot
- **Quick View Panel:** Shows on row click with contact info, NPN, state, upline, status, created date
- **Bulk Actions:** Send Setup Links, Assign Upline (placeholders)
- **Status Logic:**
  - `active` = has user_id
  - `invited` = has setup_link_sent_at but no user_id
  - `imported` = no user_id and no setup_link_sent_at

---

## 5. TeamsTab Features

- **Search:** Filter teams by name/email
- **Stats:** "X agents across Y teams"
- **Team list:** Shows MGAs (profiles with manager_id=null AND have downline)
- **Team size:** Recursive count of all reports
- **Direct to TIG:** Profiles with no manager and no downline
- **Click behavior:** Switches to All Agents tab with upline filter

---

## 6. What's Needed for Agent Import

### Migrations to Apply
```bash
npx supabase db push
```

This will apply:
1. `20260118000000_agent_import_columns.sql` - Makes user_id nullable, adds invited_at, phone, team_reference
2. `20260118000001_add_phone_state_columns.sql` - Adds phone, state

### After Migrations, Regenerate Types
```bash
npx supabase gen types typescript --project-id <project-id> > src/integrations/supabase/types.ts
```

### Import Script Needed
Create a script/edge function to:
1. Accept CSV/JSON of agents
2. Insert profiles WITHOUT creating auth users
3. Set `user_id = null`, `is_active = true`
4. Later: bulk invite (create auth users + send emails)

---

## 7. SQL Queries to Run in Supabase Dashboard

To check current state, run in SQL Editor:

```sql
-- 1. Profile counts
SELECT
  COUNT(*) as total,
  COUNT(user_id) as with_auth,
  COUNT(*) - COUNT(user_id) as without_auth,
  COUNT(setup_link_sent_at) as setup_link_sent
FROM profiles;

-- 2. Check if new columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('phone', 'state', 'team_reference', 'invited_at')
ORDER BY column_name;

-- 3. Team distribution (using manager_id)
SELECT
  m.full_name as manager,
  COUNT(p.id) as team_size
FROM profiles p
JOIN profiles m ON p.manager_id = m.id
WHERE p.is_active = true
GROUP BY m.id, m.full_name
ORDER BY team_size DESC;
```
