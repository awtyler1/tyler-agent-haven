# Book of Business Command Center — Analysis & Design

**Date:** February 9, 2026
**Author:** Claude Code (Opus 4.6) — analysis session
**Status:** DRAFT — awaiting Austin's review before any code is written

---

## Executive Summary

**The foundation is much stronger than expected.** The TIG Platform already has a working client-level data pipeline — `clients`, `policies`, and `production_uploads` tables exist with RLS policies, and a working edge function (`parse-production-report`) extracts individual member records from 4 carrier formats (Aetna, WellCare, Humana, Anthem). The `clients` table stores name, DOB, phone, address, and Medicare number. The `policies` table stores plan name, effective date, term date, status, and carrier member ID. Admin-side pages already show aggregate book stats per agent with carrier breakdowns.

**The gap is NOT the data pipeline — it's the agent-facing experience.** Agents can upload reports and see aggregate client counts, but there is no "My Clients" list view, no individual client detail, no contact logging, no risk flags, and no action queue. The data goes in but agents can't act on it.

**Estimated effort from current state to MVP "I can see my clients and know who to call":** Small. The data model is 80% there. The biggest work is UI.

---

## Phase 1: Deep Discovery — What We Have

### 1.1 Smart Sync & Production Data Pipeline

**This is the crown jewel of the existing codebase for BOB purposes.** The pipeline is production-ready and already extracting client-level data.

#### Edge Function: `parse-production-report`
**File:** `supabase/functions/parse-production-report/index.ts` (1001 lines)

**Supported carriers and field extraction:**

| Carrier | Format | Medicare # | Name | DOB | Phone | Email | Address | Plan | Effective Date | Term Date | Member ID |
|---------|--------|-----------|------|-----|-------|-------|---------|------|----------------|-----------|-----------|
| **Aetna** | CSV | Yes (MBI) | First/Last/MI | Yes | Yes | No | Full | Yes | Yes | Yes | Yes |
| **WellCare** | CSV | Yes (MBI) | First/Last | Yes | Yes | No | Full | Yes | Yes | Yes (empty=active) | Yes (Centene ID) |
| **Humana** | XLSX | **No** | First/Last/MI | Yes | Yes | Yes | **No** | Yes | Yes | Yes | Yes (Humana ID) |
| **Anthem** | CSV | **No** | "Last, First" | **No** | **No** | No | State only | Yes | Yes | Yes (9999=active) | Yes (Client ID) |

**Key observations:**
- Aetna and WellCare provide the richest data (Medicare #, full address, DOB)
- Humana lacks Medicare # and address — uses name+DOB for dedup
- Anthem is the most limited — no Medicare #, no DOB, no phone — uses name-only matching, which is fragile
- All 4 carriers provide effective date and plan name, which are sufficient for the BOB core features

**Matching/dedup logic** (in `findOrCreateClient`, line 577):
1. If Medicare # exists → match by `profile_id + medicare_number` (exact, reliable)
2. If no Medicare # but DOB exists (Humana) → match by `profile_id + first_name + last_name + date_of_birth` (case-insensitive)
3. If neither (Anthem) → match by `profile_id + first_name + last_name` only (fragile — two "John Smith" clients would collide)

**Answer to the critical question: Can we go from carrier report upload → individual client records today?**

**YES.** This already works. The edge function creates/updates `clients` rows and `policies` rows for every member in the report. The data pipeline is functional.

#### Database Tables (Production Data)

**`clients`** — `supabase/migrations/20260121000000_create_production_tables.sql`
```sql
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id),  -- the agent
  medicare_number VARCHAR(15),                         -- nullable (Humana/Anthem)
  first_name TEXT,
  last_name TEXT,
  middle_initial VARCHAR(5),
  date_of_birth DATE,
  phone VARCHAR(20),
  address_line1 TEXT,
  address_city TEXT,
  address_state VARCHAR(2),
  address_zip VARCHAR(10),
  email TEXT,                                          -- from types.ts, added later
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
-- UNIQUE(profile_id, medicare_number) — note: only enforced when medicare_number is NOT NULL
-- RLS: agents see own, admins see all, service_role full access
```

**`policies`** — same migration
```sql
CREATE TABLE public.policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  carrier_id UUID REFERENCES carriers(id),
  profile_id UUID REFERENCES profiles(id),
  carrier_member_id TEXT,
  plan_name TEXT,
  plan_type VARCHAR(20),          -- derived: MA, PDP, MEDIGAP, OTHER
  effective_date DATE,
  term_date DATE,
  status VARCHAR(20) DEFAULT 'active',  -- 'active' | 'termed'
  is_t65 BOOLEAN,                       -- turning 65 flag
  source_upload_id UUID,
  last_seen_upload_id UUID,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
-- UNIQUE(client_id, carrier_id) — one policy per client per carrier
-- RLS: same pattern as clients
```

**`production_uploads`** — upload tracking
```sql
CREATE TABLE public.production_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id),
  carrier_id UUID NOT NULL REFERENCES carriers(id),
  file_name TEXT NOT NULL,
  file_hash TEXT,                    -- for duplicate detection
  status VARCHAR(20) DEFAULT 'pending',  -- pending | processing | complete | error
  records_total INTEGER,
  records_imported INTEGER,
  records_updated INTEGER,
  records_skipped INTEGER,
  error_message TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### Sync Flow (Agent-Facing)
**File:** `src/pages/SyncFlow.tsx` (1600 lines)

The Smart Sync is a polished multi-step flow:
1. **Carrier Selection** — agent picks which carriers to sync (auto-populated from RTS certifications)
2. **File Upload** — drag-drop per carrier, with carrier auto-detection and mismatch warnings
3. **Client-side parsing** — instant row counts shown before the edge function runs
4. **Background reconciliation** — edge function processes in background, updates counts via `get_carrier_book_stats` RPC
5. **Completion** — saves to `monthly_syncs` + `sync_carrier_uploads`, awards milestones

**Carrier config:** `src/config/carriers.ts` defines 4 supported carriers (aetna, wellcare, humana, anthem) with portal URLs, colors, and enabled flags. UHC and Cigna are not yet supported.

**Carrier detection:** `src/lib/carrier-detection.ts` auto-detects which carrier a file belongs to by inspecting headers/content.

#### Existing Hooks (Sync Related)
- `src/hooks/useAgentRTSCarriers.ts` — filters display carriers by agent's RTS certifications
- `src/hooks/useSyncPreferences.ts` — remembers last-synced carriers for returning flow
- `src/hooks/useAdminAgentsBook.ts` — queries all agents with policy counts for admin view
- `src/hooks/useAdminAgentBook.ts` — queries single agent's book with carrier breakdown

#### Existing Admin Book Pages
- `src/pages/admin/AgentsBookPage.tsx` — admin table of all agents with book sizes, sync status, net changes
- `src/pages/admin/AgentBookDetailPage.tsx` — single agent view with book size, carrier breakdown, sync status

These are read-only admin views. There is NO agent-facing client list view.

#### Monthly Sync Tables
- `monthly_syncs` — one row per agent per month (total_clients, new_clients, termed_clients, net_change)
- `sync_carrier_uploads` — one row per carrier per sync (client_count, new_clients, termed_clients)
- `milestones` — achievement records (25, 50, 100, 150, 200, 250, 300, 400, 500, 750, 1000 clients)

### 1.2 Medicare Plan Data (CMS)

**`cms_plans`** table — comprehensive CMS plan data with ~40 columns:

| Category | Fields |
|----------|--------|
| **Identity** | plan_id, contract_id, segment_id, organization_name, marketing_name |
| **Costs** | monthly_premium, annual_deductible, moop_in_network, moop_combined |
| **Medical** | pcp_copay, specialist_copay, er_copay, inpatient_copay, outpatient_copay, urgent_care_copay, telehealth_copay |
| **Drug** | drug_deductible, drug_tier1–5 |
| **Supplemental** | dental_preventive, dental_comprehensive, dental_max_coverage, vision_exam_copay, vision_allowance, hearing_exam_copay, hearing_aid_allowance, fitness_benefit, otc_allowance, otc_frequency, meal_benefit, transportation_trips |
| **Metadata** | plan_type (HMO/PPO/etc), snp_type, star_rating, is_active, is_commissionable, year, carrier_id |
| **Raw** | raw_benefits (JSONB — full CMS data dump) |

**`cms_service_areas`** — county-level availability:
- Links cms_plan_id → county_fips, county_name, state_code
- Can determine which plans are available in a client's county

**`commission_rates`** — CMS FMV rates:
- Stores amount by plan_type (MA/PDP), rate_type (initial/renewal), year, region

**`plan_documents`** — links to plan benefit documents (SOBs, formularies)

**Key finding:** The CMS data is extensive enough for year-over-year plan change detection. We could cross-reference a client's `policies.plan_name` against `cms_plans` to detect:
- Premium increases
- Benefit reductions (dental/vision/OTC changes)
- Plan discontinuation (plan exists in year N but not N+1)
- Service area changes (plan exits a county)

**Gap:** There is no logic yet that links a policy record to a specific `cms_plans` row. The `policies.plan_name` is a free-text string from carrier reports, not a foreign key to `cms_plans.plan_id`. Building that linkage would require fuzzy matching or a carrier→CMS plan mapping table.

**Plan Finder:** `src/pages/PlanFinderPage.tsx` exists and queries `cms_plans` — this confirms the CMS data is populated and queryable.

### 1.3 Agent & Client Data Models

**`profiles`** (agent table) — key fields for BOB:
- `id`, `user_id`, `full_name`, `email`, `phone`, `npn`, `state`
- `manager_id` — for downline relationships
- `last_sync_at` — when agent last synced
- `ownership_group`, `team_reference` — for org hierarchy

**Client data is already in the `clients` table** as described above.

**No existing contact/interaction logging.** There are `admin_notes` (admin notes on agent profiles) and `activity_logs` (audit trail), but nothing for agent-to-client interactions.

### 1.4 Authentication & Permissions

**Role hierarchy:**
```
super_admin > admin > manager > internal_tig_agent > independent_agent
```

**Auth hooks:**
- `src/hooks/useAuth.ts` — combines `useProfile` + `useRole`, provides `user`, `profile`, `isAdmin`, `canAccessAdmin`
- `src/hooks/useRole.ts` — checks `user_roles` table
- `src/components/ProtectedRoute.tsx` — route guards with `requireAdmin`, `requireSuperAdmin`, `requireAgent`, `allowContractingOnly`

**RLS pattern (already established for clients/policies):**
- Agents see their own records: `profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())`
- Admins see all: `has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin')`
- Service role has full access: `auth.role() = 'service_role'`

**Missing for BOB:** Manager/downline access. Currently RLS is binary (own data vs admin). A manager should see their downline's client data. The `has_downline` and `current_user_has_downline` functions exist but aren't used in RLS policies for clients/policies.

### 1.5 Existing UI Patterns & Navigation

**Navigation:** `src/components/Navigation.tsx` — sidebar nav with sections:
- Dashboard, Start Here, Sync, Industry Updates
- Carrier Resources, Forms Library, Training
- Admin section (for admin roles)

**No "My Book" or "My Clients" nav item exists yet.**

**Reusable components:**
- Full Shadcn/ui library in `src/components/ui/` (Dialog, Sheet, Tabs, Table, Command, etc.)
- `recharts` for charts (already in `package.json`, used for dashboards)
- `cmdk` for command palette / search
- `react-day-picker` for date pickers
- `lucide-react` for icons

**Existing page patterns:**
- T65ReviewPage (`src/pages/T65ReviewPage.tsx`) — **directly queries policies with joined client data** — a working example of an agent viewing their individual clients
- AgentsBookPage — admin table with search, filters, status badges
- SyncFlow — multi-step flow with file upload, progress, completion

### 1.6 Other Relevant Features

**T65 Review Page** — Already shows individual client records:
```tsx
const { data } = await supabase
  .from('policies')
  .select(`id, plan_name, effective_date, is_t65,
    carrier:carriers(name),
    client:clients(first_name, last_name)`)
  .eq('profile_id', profile.id)
  .eq('status', 'active')
```
This proves the join pattern works and is already in production.

**RPC function:** `get_carrier_book_stats` — returns active_count, new_count, termed_count for a given agent+carrier+date range. This is called during sync reconciliation.

---

## Phase 2: Gap Analysis

### Component A: Client Book Data (the foundation)

**What we already have:**
- `clients` table with name, DOB, phone, address, Medicare #, email ✅
- `policies` table with plan name, carrier, effective date, term date, status ✅
- Working parser for 4 carriers (Aetna, WellCare, Humana, Anthem) ✅
- Dedup logic (Medicare # → name+DOB → name-only) ✅
- RLS policies (agent sees own, admin sees all) ✅
- T65ReviewPage proving the query pattern works ✅

**What's the gap:**
1. **No agent-facing "My Clients" page** — data exists but there's no UI to browse it (MEDIUM — pure frontend)
2. **No "last contact" tracking** — no `last_contacted_at` on clients, no interaction logging (MEDIUM — new table + UI)
3. **Missing carriers:** UHC and Cigna parsers not implemented (MEDIUM per carrier — follows existing pattern)
4. **Anthem dedup is fragile** — name-only matching can collide. Consider adding carrier_member_id as a fallback match key (SMALL fix)
5. **No email field on some carriers** — only Humana provides email. Agents would need to manually add email/phone for clients from other carriers (acceptable — manual enrichment)

**Matching/dedup risk assessment:**
- Aetna + WellCare: Medicare # match — reliable, no collision risk
- Humana: Name + DOB — reasonably reliable, collision only for same-name same-birthday
- Anthem: Name only — **highest risk**. Two "Robert Johnson" clients would merge. Mitigated by `carrier_member_id` uniqueness per carrier.

**How hard is the gap:** Small for core "see my clients" view. The data layer is done.

### Component B: Risk Flagging Engine

**What we already have:**
- CMS plan data with premiums, benefits, copays for year-over-year comparison ✅
- Client DOB for birthday reminders ✅ (from Aetna/WellCare/Humana)
- Plan effective dates for anniversary tracking ✅
- Active/termed status tracking ✅

**What's the gap:**
1. **No `client_risk_flags` table** — need to create (SMALL — new table)
2. **No plan-to-CMS linkage** — policies.plan_name is free text, not linked to cms_plans.plan_id. Need a mapping approach. (MEDIUM — fuzzy match or lookup table)
3. **No contact logging** — can't detect "no contact in 90 days" without interaction records (MEDIUM — blocked by Component E)
4. **No flag generation logic** — need edge function or cron to compute flags (MEDIUM)
5. **No CMS year-over-year diff** — need to compare cms_plans for year N vs N+1 to detect benefit cuts, premium increases, plan exits (MEDIUM-LARGE — requires loading next year's CMS data and building comparison logic)
6. **No county data on clients** — service area exit detection requires knowing client's county (FIPS code). Address fields exist on some clients but county_fips is not stored. (SMALL to add, but only populated for Aetna/WellCare)

**Risks:**
- CMS plan data may not be loaded for both current and next year simultaneously
- Mapping free-text plan names to CMS plan IDs is inherently fuzzy — expect ~80% accuracy without carrier-specific plan ID in reports
- Anthem clients lack DOB → birthday reminders won't work for them

### Component C: Daily Action Queue

**What we already have:**
- Nothing directly applicable. No task/reminder/scheduling system exists.

**What's the gap:**
1. **Task queue table** — new table needed (SMALL)
2. **Queue generation logic** — rules engine to populate daily tasks (MEDIUM)
3. **Queue UI** — "Call these people today" view (MEDIUM — frontend)

**Design decision:** Computed view vs materialized table?
- **Recommendation:** Computed view (SQL view or frontend logic) for V1. Avoid a cron job creating rows. The rules are simple enough to evaluate at query time for 350 clients. A cron job adds complexity and failure modes.
- For 300 agents × 350 clients = 105K clients, a computed approach may get slow. We can add materialization later if needed.

### Component D: Book Growth Dashboard

**What we already have:**
- `monthly_syncs` with total_clients, new_clients, termed_clients, net_change per month ✅
- `sync_carrier_uploads` with per-carrier counts ✅
- `commission_rates` with CMS FMV amounts ✅
- Recharts library installed ✅
- AgentBookDetailPage showing book size + carrier breakdown (admin view) ✅

**What's the gap:**
1. **No agent-facing dashboard** — admin page exists, agent page doesn't (SMALL-MEDIUM — adapt existing)
2. **No trend chart** — monthly_syncs has the data, just need a recharts line/bar chart (SMALL)
3. **No income projection** — math is simple: clients × FMV rate (SMALL)
4. **History depth depends on sync compliance** — if agent started syncing in January 2026, we only have 1-2 months of data. No way to backfill without historical reports.

**How hard:** Small. Mostly frontend work reusing existing admin patterns.

### Component E: Client Detail & Contact Logging

**What we already have:**
- Client data in `clients` table ✅
- Policy data with carrier + plan details ✅
- CMS plan data for benefit summary ✅
- `admin_notes` pattern (notes on profiles) — adaptable for client notes

**What's the gap:**
1. **No `client_interactions` table** — new table needed (SMALL)
2. **No client detail panel/modal** — new component (MEDIUM — frontend)
3. **No quick-action forms** — "Log a Call", "Schedule Follow-up" (MEDIUM — frontend)
4. **No follow-up scheduling** — need a simple date + note system (SMALL table, MEDIUM UI)

---

## Phase 3: Data Model Proposal

### New Table: `client_interactions`

```sql
CREATE TABLE public.client_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Interaction details
  interaction_type VARCHAR(30) NOT NULL,
    -- 'call', 'email', 'text', 'meeting', 'note', 'follow_up_scheduled', 'follow_up_completed'
  outcome VARCHAR(30),
    -- 'reached', 'voicemail', 'no_answer', 'wrong_number', 'completed', 'cancelled'
  notes TEXT,

  -- Follow-up tracking
  follow_up_date DATE,           -- NULL unless this IS a follow-up or schedules one
  follow_up_completed_at TIMESTAMPTZ,

  -- Metadata
  duration_minutes INTEGER,       -- optional, for calls
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_client_interactions_client_id ON public.client_interactions(client_id);
CREATE INDEX idx_client_interactions_profile_id ON public.client_interactions(profile_id);
CREATE INDEX idx_client_interactions_created_at ON public.client_interactions(created_at DESC);
CREATE INDEX idx_client_interactions_follow_up ON public.client_interactions(follow_up_date)
  WHERE follow_up_date IS NOT NULL AND follow_up_completed_at IS NULL;

-- RLS
ALTER TABLE public.client_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own interactions"
ON public.client_interactions FOR ALL
USING (profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all interactions"
ON public.client_interactions FOR SELECT
USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));
```

### New Table: `client_risk_flags`

```sql
CREATE TABLE public.client_risk_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Flag details
  flag_type VARCHAR(50) NOT NULL,
    -- 'no_contact_90', 'no_contact_180', 'plan_benefit_cut', 'premium_increase',
    -- 'carrier_exit', 'plan_discontinued', 'birthday_upcoming', 'anniversary_upcoming',
    -- 'aep_review_needed'
  severity VARCHAR(10) NOT NULL DEFAULT 'medium',
    -- 'low', 'medium', 'high', 'critical'
  title TEXT NOT NULL,             -- Human-readable: "No contact in 94 days"
  description TEXT,                -- Context: "Last contacted Oct 15, 2025"

  -- Resolution
  status VARCHAR(20) NOT NULL DEFAULT 'active',
    -- 'active', 'acknowledged', 'resolved', 'dismissed'
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id),

  -- Source tracking
  source VARCHAR(30) NOT NULL DEFAULT 'system',
    -- 'system' (auto-generated), 'manual' (agent created)

  -- Metadata
  metadata JSONB,                  -- Flexible: { plan_id, premium_old, premium_new, etc }
  expires_at DATE,                 -- Auto-expire flags (e.g., birthday flag expires after the date)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_risk_flags_client_id ON public.client_risk_flags(client_id);
CREATE INDEX idx_risk_flags_profile_id ON public.client_risk_flags(profile_id);
CREATE INDEX idx_risk_flags_status ON public.client_risk_flags(status) WHERE status = 'active';
CREATE INDEX idx_risk_flags_severity ON public.client_risk_flags(severity);

-- RLS (same pattern)
ALTER TABLE public.client_risk_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own risk flags"
ON public.client_risk_flags FOR ALL
USING (profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all risk flags"
ON public.client_risk_flags FOR SELECT
USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin'));
```

### Modification to Existing Table: `clients`

```sql
-- Add last_contacted_at for quick "no contact" queries without joining interactions
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ;

-- Add county_fips for service area checking
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS county_fips VARCHAR(5);
```

### Design Decisions

**1. Matching logic (carrier report → client record):**
The existing 3-tier approach works. For Anthem's name-only matching risk, I recommend adding a secondary check: if `carrier_member_id` is available, also match by `profile_id + carrier_member_id` on the `policies` table first, then walk to the client. This prevents two-John-Smith collisions.

**2. Plan switches:**
Current schema uses UNIQUE(client_id, carrier_id) — one policy per client per carrier. If a client switches from Humana Plan A to Humana Plan B, the existing record gets updated (plan_name changes). If they switch from Humana to UHC, that's a new policy row. **This is correct behavior** — the old Humana policy gets marked `termed` when Humana's report no longer lists them, and the new UHC policy gets created when UHC's report includes them. History is preserved through `production_uploads` and the `updated_at` timestamps.

**3. Multi-agent:**
The UNIQUE(profile_id, medicare_number) constraint on `clients` means the same person can appear under different agents. This is correct — if a client switches agents, the new agent's upload creates a fresh client record under their profile_id. The old agent's record remains (eventually flagged as termed).

**4. Data freshness:**
If an agent hasn't uploaded in 3 months, their data is stale but still valid — clients don't disappear. The `last_sync_at` on profiles and `last_seen_at` on policies track freshness. The admin view already shows stale/very-stale badges. For the agent view, we should show a "Your data may be outdated — last synced X days ago" banner when stale.

**5. RLS approach:**
Consistent with existing patterns:
- Agent sees own data (WHERE profile_id matches their profile)
- Admin/super_admin sees all
- Service role (edge functions) has full access
- **Future:** Add manager downline access via `profile_id IN (SELECT id FROM profiles WHERE manager_id = current_profile_id)`

### NOT Proposing (Unnecessary for V1)

**`book_snapshots`** — The `monthly_syncs` table already captures monthly snapshots (total_clients, new_clients, termed_clients, net_change). No separate snapshot table needed. If we want daily granularity later, we can add it then.

---

## Phase 4: Implementation Roadmap

### Step 1: Database Schema + Types
**What gets built:**
- Migration: `client_interactions` table
- Migration: `client_risk_flags` table
- Migration: Add `last_contacted_at` and `county_fips` to `clients`
- Regenerate Supabase TypeScript types

**Dependencies:** None
**Austin provides:** Nothing — pure infrastructure
**Scope:** Single session
**Stop point:** Austin reviews migration SQL, confirms table designs

---

### Step 2: "My Clients" List View (Agent-Facing)
**What gets built:**
- New page: `src/pages/MyClientsPage.tsx`
- New hook: `src/hooks/useMyClients.ts` — queries clients + policies with joins
- Navigation: Add "My Clients" or "My Book" nav item
- Route: `/my-clients` (ProtectedRoute)
- Features: Searchable table (name/phone), sortable columns (name, carrier, plan, effective date, last contact), filter by carrier, filter by status (active/termed)

**Dependencies:** Step 1 (for last_contacted_at column, though could proceed without it)
**Austin provides:** Feedback on column priorities, which columns matter most
**Scope:** Single session — follows existing patterns from AgentsBookPage + T65ReviewPage
**Stop point:** Austin uses it for a week with his 350 clients. Reports back on: data accuracy, missing data, UX pain points.

**Claude Code assessment:** Can one-shot this. Existing patterns are clear.

---

### Step 3: Client Detail Panel + Contact Logging
**What gets built:**
- Client detail Sheet/Dialog (click a row → see full client info)
- Interaction log form ("Log a Call" with type, outcome, notes)
- Interaction history timeline on client detail
- Auto-update `clients.last_contacted_at` via trigger or application logic

**Dependencies:** Steps 1 + 2
**Austin provides:** What interaction types matter most (call, email, text, meeting?)
**Scope:** Single session, possibly two if the detail panel is complex
**Stop point:** Austin uses it through a few days of calls. Reports: Is it fast enough? Right fields? Missing anything?

**Claude Code assessment:** Can one-shot this. Standard form + list pattern.

---

### Step 4: Risk Flags — No-Contact Rules
**What gets built:**
- SQL function or edge function to compute no-contact flags
- Rules: 90 days → medium, 180 days → high
- Risk flag badges on client list rows
- Simple risk flag summary card on dashboard or My Clients page header

**Dependencies:** Steps 1–3 (needs last_contacted_at populated)
**Austin provides:** Confirmation of thresholds (90/180 days), whether to auto-generate or manual trigger
**Scope:** Single session
**Stop point:** Austin reviews flags against his actual book — are the 90-day flags right?

**Implementation note:** For V1, compute flags on-demand (when page loads) rather than via cron. For 350 clients, a SQL query checking `WHERE last_contacted_at < now() - interval '90 days'` is instant.

---

### Step 5: Book Growth Dashboard (Agent-Facing)
**What gets built:**
- Dashboard section on agent home or dedicated `/my-book/dashboard` page
- Metrics: Total Clients, Retention Rate, New This Month, Projected Annual Income
- Chart: Book size over time (from monthly_syncs history)
- Income projection: total_clients × commission_rates FMV

**Dependencies:** Existing monthly_syncs data (already populated by Smart Sync)
**Austin provides:** Preferred layout, which metrics matter most
**Scope:** Single session
**Stop point:** Austin reviews with Andrew

**Claude Code assessment:** Can one-shot this. Recharts + existing data.

---

### Step 6: Risk Flags — Birthday + Anniversary Rules
**What gets built:**
- Birthday within 7 days → low severity flag
- Plan anniversary within 30 days → low severity flag
- AEP review not completed (Sept-Dec) → medium escalating to high

**Dependencies:** Steps 1–4
**Austin provides:** Birthday call preferences (how many days before?), AEP review definition
**Scope:** Single session — extends Step 4's flag engine
**Stop point:** Austin reviews flag accuracy

---

### Step 7: Daily Action Queue
**What gets built:**
- `/my-clients/today` or dashboard widget
- Rules-based queue: birthdays, overdue check-ins, active risk flags, scheduled follow-ups
- Complete / Skip / Snooze actions
- Phone number quick-copy or tel: link

**Dependencies:** Steps 1–6
**Austin provides:** Priority ordering preferences, how many actions per day is reasonable
**Scope:** One session for core, possibly a second for polish
**Stop point:** Austin uses it daily for a week

---

### Step 8: Risk Flags — Plan Change Detection (CMS Cross-Reference)
**What gets built:**
- Logic to map `policies.plan_name` → `cms_plans.plan_id` (fuzzy or lookup table)
- Year-over-year CMS comparison: premium changes, benefit cuts, plan discontinuation
- Service area exit detection (requires county_fips on clients)

**Dependencies:** Steps 1–4, CMS data for both current and next plan year loaded
**Austin provides:** Sample plan names from his reports for mapping validation, confirmation that CMS data for 2027 is loaded
**Scope:** Multiple sessions — this is the most complex step
**Stop point:** Austin verifies plan change flags against known changes in his book

**Risks:**
- Plan name → CMS plan ID mapping accuracy may be <100%
- CMS data for next year may not be available until Q3-Q4
- This is the one feature that might not be worth building if the mapping proves unreliable

---

### Step 9: UHC + Cigna Parser Support
**What gets built:**
- UHC parser in `parse-production-report` edge function
- Cigna parser in edge function
- Carrier config entries
- File detection logic

**Dependencies:** Sample reports from Austin
**Austin provides:** Sample UHC and Cigna production reports
**Scope:** One session per carrier — follows established Aetna/WellCare/Humana/Anthem pattern
**Stop point:** Test with real reports

---

### Step 10: Agent Rollout
**What gets built:**
- Feature flag for BOB features
- Onboarding flow for agents (first-time explanation)
- Admin view enhancements (see downline client interactions)
- Manager RLS policies (see downline data)

**Dependencies:** All previous steps stable
**Austin provides:** Pilot agent list, feedback from testing
**Scope:** Multiple sessions
**Stop point:** Pilot with 2-3 agents, collect feedback

---

## Phase 5: Quick Wins — What Can You Use THIS WEEK

### The Fastest Path: "My Clients" List

**The data is already there.** Your 350 clients are already in the `clients` and `policies` tables from your Smart Sync uploads. You just can't see them as individual records from the agent view.

**Quick Win #1: "My Clients" Page (one session)**

Build a page at `/my-clients` that queries:
```sql
SELECT c.first_name, c.last_name, c.phone, c.date_of_birth, c.email,
       p.plan_name, p.effective_date, p.status,
       cr.name as carrier_name
FROM clients c
JOIN policies p ON p.client_id = c.id
JOIN carriers cr ON cr.id = p.carrier_id
WHERE c.profile_id = :your_profile_id
AND p.status = 'active'
ORDER BY c.last_name, c.first_name
```

This gives you: Name, Phone, DOB, Plan, Carrier, Effective Date for every active client. Add search and carrier filter. That's your "who should I call" starting point.

**Quick Win #2: Birthday List (add-on to #1)**

Add a "Birthdays This Week" filter:
```sql
WHERE EXTRACT(MONTH FROM c.date_of_birth) = EXTRACT(MONTH FROM CURRENT_DATE)
AND EXTRACT(DAY FROM c.date_of_birth) BETWEEN EXTRACT(DAY FROM CURRENT_DATE)
AND EXTRACT(DAY FROM CURRENT_DATE + INTERVAL '7 days')
```

**Quick Win #3: Stale Client Check (SQL query)**

Even before any UI, you could run this in Supabase SQL editor to see clients who've been on the same plan the longest (candidates for AEP outreach):
```sql
SELECT c.first_name, c.last_name, c.phone, p.plan_name, cr.name,
       p.effective_date,
       CURRENT_DATE - p.effective_date as days_on_plan
FROM clients c
JOIN policies p ON p.client_id = c.id AND p.status = 'active'
JOIN carriers cr ON cr.id = p.carrier_id
WHERE c.profile_id = 'YOUR_PROFILE_ID'
ORDER BY p.effective_date ASC
LIMIT 50;
```

---

## Risks, Unknowns, and Austin Input Required

### Risks

1. **Anthem name-only matching:** Two clients with the same name under the same agent will be merged into one record. This is a known limitation of Anthem's report format. ~Low probability but high impact when it happens. **Mitigation:** Use carrier_member_id as secondary match key.

2. **CMS plan mapping:** Connecting free-text plan names from carrier reports to CMS plan IDs is inherently fuzzy. The `carriers` table has `cms_aliases` which may help, but individual plan-level mapping doesn't exist yet. This is the hardest technical problem in the entire BOB feature set.

3. **Data completeness varies by carrier:** Humana clients lack addresses. Anthem clients lack DOB and phone. The client list will show gaps for these carriers. This is acceptable but should be communicated clearly in the UI (e.g., "Phone not available from Anthem reports").

4. **Historical data gaps:** Monthly trends only go back as far as Smart Sync has been used. If an agent started syncing in January 2026, there's 1-2 months of history. No way to backfill without historical reports.

### Unknowns Requiring Austin's Input

1. **UHC and Cigna report formats** — Need sample files to build parsers
2. **Contact logging workflow** — How do you actually make calls? From the platform? From phone? Do you want click-to-call? Or just a "mark as called" button?
3. **Priority of risk flag types** — Which flags would actually change your daily behavior?
4. **Plan change data timing** — When does CMS publish next year's plan data? Is it loaded into the platform?
5. **"Who to call today" logic** — What's your actual daily workflow? Do you call a set number per day? Or is it event-driven (birthday, AEP, risk flag)?

### Scope Kill Recommendations

Consider **deferring or killing** these if they prove too complex:
- **CMS plan change detection (Step 8):** High effort, uncertain accuracy. The no-contact and birthday flags alone (Steps 4-6) cover 80% of the "who to call" use case. Plan change detection is a nice-to-have, not essential for V1.
- **Agent rollout (Step 10):** Until you've used it yourself for a month and proven the workflow, don't invest in multi-agent onboarding.

---

## Top 5 Findings Summary

1. **The data pipeline already works.** The `clients` and `policies` tables are populated with individual member records from 4 carrier parsers. Your 350 clients are already in Supabase — they just need a UI to view them.

2. **The gap is UI, not data.** The admin side can see aggregate book stats. The agent side cannot see individual clients. Building a "My Clients" page is a straightforward frontend task using patterns already established in T65ReviewPage and AgentsBookPage.

3. **CMS plan data is extensive.** The `cms_plans` table has detailed benefit data for plan-level comparisons. However, linking carrier report plan names to CMS plan IDs is an unsolved mapping problem that will require careful work.

4. **Contact logging is completely absent.** There's no interaction tracking anywhere in the platform. This is the biggest new table/feature needed for BOB to be useful beyond a read-only client list.

5. **The fastest path to value is Steps 1-3.** Database tables (one session) → "My Clients" list (one session) → Contact logging (one session). After those three steps, you'll have a working client list with search, filters, and the ability to log calls. That's the core of "who should I call today" — and you could have it within a few sessions.
