# Agent Carrier Contracting - Database Schema & Architecture Summary

## Overview

The Tyler Insurance Group platform tracks agent-carrier relationships through multiple interconnected tables that serve different purposes: contracting workflow, RTS (Ready to Sell) certification status, and production/Book of Business tracking.

---

## 1. Database Schema

### Core Tables

#### `carriers`
Master list of insurance carriers.

```sql
CREATE TABLE carriers (
  id UUID PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,           -- 'aetna', 'humana', 'uhc', etc.
  name TEXT NOT NULL,                  -- 'Aetna', 'Humana', 'UnitedHealthcare'
  display_name TEXT,                   -- Short display name
  is_active BOOLEAN DEFAULT true,
  requires_non_resident_states BOOLEAN DEFAULT true,
  requires_corporate_resolution BOOLEAN DEFAULT false,
  rts_aliases TEXT[],                  -- ['UHC', 'United', 'UnitedHealthcare Medicare']
  product_tags TEXT[],
  state_availability TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Current carriers in system:**
- aetna, anthem, cigna, devoted, essence, humana, molina, uhc, wellcare, bcbs

---

#### `carrier_statuses`
Tracks contracting status per agent per carrier. This is the primary table for knowing which carriers an agent is contracted with.

```sql
CREATE TABLE carrier_statuses (
  id UUID PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id),     -- The agent
  user_id UUID,                                -- Legacy: auth user ID (may be null for imported agents)
  carrier_id UUID REFERENCES carriers(id),     -- The carrier
  contracting_status TEXT DEFAULT 'not_started', -- 'not_started' | 'in_progress' | 'contracted' | 'issue'
  contracting_submitted_at TIMESTAMPTZ,
  contracted_at TIMESTAMPTZ,
  contracting_link_sent_at TIMESTAMPTZ,
  contracting_link_url TEXT,
  link_resend_requested_at TIMESTAMPTZ,
  issue_description TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(profile_id, carrier_id)
);
```

**Status values:**
- `not_started` - No contracting initiated
- `in_progress` - Contracting request sent/pending
- `contracted` - Agent is RTS with this carrier
- `issue` - Problem with contracting

---

#### `agent_certifications`
RTS certification data imported from Pinnacle spreadsheets. Tracks certification year per carrier/product combination.

```sql
CREATE TABLE agent_certifications (
  id UUID PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id),
  carrier_name TEXT NOT NULL,          -- e.g., 'Aetna', 'Humana', 'UHC'
  product_type TEXT NOT NULL,          -- 'MA', 'PDP', 'MEDIGAP', 'ALL_ANCILLARY', 'MAPD'
  certification_year INTEGER DEFAULT 0, -- 2026, 2025, or 0
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(profile_id, carrier_name, product_type)
);
```

---

#### `agent_carriers`
Tracks which carriers an agent wants to track in their Book of Business. This is separate from contracting status - it's what the agent explicitly selects to track production for.

```sql
CREATE TABLE agent_carriers (
  id UUID PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id),
  carrier_id UUID REFERENCES carriers(id),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, carrier_id)
);
```

---

### Production Tables (Book of Business)

#### `clients`
Client records linked to agents.

```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id),
  medicare_number VARCHAR(15) NOT NULL,
  first_name TEXT,
  last_name TEXT,
  middle_initial VARCHAR(5),
  date_of_birth DATE,
  phone VARCHAR(20),
  address_line1 TEXT,
  address_city TEXT,
  address_state VARCHAR(2),
  address_zip VARCHAR(10),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(profile_id, medicare_number)
);
```

#### `policies`
Policy/enrollment records for clients.

```sql
CREATE TABLE policies (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES clients(id),
  carrier_id UUID REFERENCES carriers(id),
  profile_id UUID REFERENCES profiles(id),
  carrier_member_id TEXT,
  plan_name TEXT,
  effective_date DATE,
  term_date DATE,
  status VARCHAR(20) DEFAULT 'active',
  source_upload_id UUID,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(client_id, carrier_id)
);
```

#### `production_uploads`
Tracks carrier production report uploads.

```sql
CREATE TABLE production_uploads (
  id UUID PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id),
  carrier_id UUID REFERENCES carriers(id),
  file_name TEXT NOT NULL,
  file_size_bytes INTEGER,
  status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'processing', 'complete', 'error'
  error_message TEXT,
  total_rows INTEGER DEFAULT 0,
  imported_count INTEGER DEFAULT 0,
  updated_count INTEGER DEFAULT 0,
  skipped_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  uploaded_by UUID REFERENCES profiles(id)
);
```

---

## 2. Key Relationships

```
profiles (agent)
    │
    ├──→ carrier_statuses ───→ carriers
    │    (contracting status)
    │
    ├──→ agent_certifications
    │    (RTS certs, uses carrier_name string)
    │
    ├──→ agent_carriers ───→ carriers
    │    (Book of Business tracking)
    │
    ├──→ clients
    │       └──→ policies ───→ carriers
    │            (production data)
    │
    └──→ production_uploads ───→ carriers
         (upload history)
```

---

## 3. RTS Import Flow

**Source:** `src/lib/rtsImport.ts`

1. Admin uploads Pinnacle RTS Excel file (sheet named "Certs")
2. System parses columns in format `Carrier: Product` (e.g., "Aetna: MA")
3. For each row:
   - Extract NPN from column D
   - Match NPN to profile via `profiles.npn`
   - If no profile exists, create stub profile
   - Import certifications to `agent_certifications`
   - For current-year certs, also update `carrier_statuses` to "contracted"
4. Uses `carriers.rts_aliases` for name normalization
5. Logs import to `rts_import_logs`

---

## 4. Existing Carrier Selection Components

### AgentProfilePage.tsx (Admin View)
**Path:** `src/pages/admin/AgentProfilePage.tsx`

- Displays carrier statuses in a card showing contracted carriers
- Shows status indicators (contracted, in_progress, issue, not_started)
- "Request Carrier" modal allows admins to:
  1. Select carriers not yet in `carrier_statuses`
  2. Send email to Pinnacle for contracting
  3. Create `carrier_statuses` records with status "in_progress"

### NewAgentSetup.tsx (Book of Business)
**Path:** `src/components/book-of-business/NewAgentSetup.tsx`

- Shown when agent first accesses Book of Business
- Displays carrier cards for: humana, aetna, anthem, wellcare
- Agent selects carriers they're contracted with
- Saves to `agent_carriers` table
- Currently hardcoded to 4 carriers via `getSupportedCarriers()` in sync.ts

---

## 5. Contracting Status Tracking

| Status | Meaning | Set By |
|--------|---------|--------|
| `not_started` | No contracting action taken | Default |
| `in_progress` | Carrier request email sent to Pinnacle | Admin (Request Carrier modal) |
| `contracted` | Agent is RTS with carrier | RTS Import or Manual update |
| `issue` | Problem with contracting | Admin manual update |

---

## 6. Recommendations for `track_in_book_of_business` Flag

### Current State
There are **two separate systems** for tracking carrier relationships:

1. **Contracting** (`carrier_statuses`) - Which carriers is the agent contracted with?
2. **Book of Business** (`agent_carriers`) - Which carriers does the agent want to track production for?

These currently operate independently.

### Recommended Approach

**Option A: Add flag to `carrier_statuses` (Recommended)**

Add a column to `carrier_statuses`:
```sql
ALTER TABLE carrier_statuses
ADD COLUMN track_in_book_of_business BOOLEAN DEFAULT false;
```

**Benefits:**
- Single source of truth for agent-carrier relationship
- Contracting and production tracking linked
- Admin can toggle flag when approving contracting
- RTS import can auto-set flag to true

**Migration path:**
1. Add column with default false
2. Set true for all existing `contracted` status records
3. Update RTS import to set flag when creating contracted records
4. Update Book of Business to read from `carrier_statuses` instead of `agent_carriers`
5. Deprecate/remove `agent_carriers` table or repurpose it

---

**Option B: Keep `agent_carriers` as-is**

The `agent_carriers` table already serves as a "track in book of business" flag. Each record means "track this carrier".

**To sync with contracting:**
- When `carrier_statuses.contracting_status` becomes "contracted", auto-insert to `agent_carriers`
- Let agents/admins remove from `agent_carriers` if they don't want to track

---

## 7. Files Reference

| Purpose | Path |
|---------|------|
| RTS Import Logic | `src/lib/rtsImport.ts` |
| Agent Profile (Carriers UI) | `src/pages/admin/AgentProfilePage.tsx` |
| Book of Business Sync | `src/lib/sync.ts` |
| New Agent Setup (Carrier Selection) | `src/components/book-of-business/NewAgentSetup.tsx` |
| Supabase Types | `src/integrations/supabase/types.ts` |
| Carriers Seed Migration | `supabase/migrations/20260115000004_seed_carriers.sql` |
| RTS Aliases Migration | `supabase/migrations/20260115000009_add_carrier_rts_aliases.sql` |
| Production Tables Migration | `supabase/migrations/20260121000000_create_production_tables.sql` |
| Sync Tables Migration | `supabase/migrations/20260122000000_add_sync_tables.sql` |

---

*Generated: 2026-01-22*
