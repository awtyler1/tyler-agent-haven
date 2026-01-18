# TIG Platform - Master Context Document

**Last Updated:** January 17, 2026
**Purpose:** Drop this into any new Claude chat to maintain full project continuity

---

## QUICK SUMMARY (Read First)

**What is this?** Agent management platform for Tyler Insurance Group (Medicare FMO)
**Tech Stack:** React + TypeScript, Supabase (database, auth, storage, edge functions), Tailwind CSS
**Who's building:** Austin Tyler (you) using Claude Code and Cursor
**Current Phase:** Foundation hardening before feature development

**The 3 Things Claude Must Know:**
1. We're using `manager_id` for hierarchy (simple parent reference, not complex entity system)
2. NPN is the universal agent identifier (being added to profiles table)
3. Build foundation RIGHT before features — no shortcuts, must scale to 1,000+ agents

---

## BUSINESS CONTEXT

### What TIG Does
- Medicare insurance FMO (Field Marketing Organization)
- ~300 existing agents across Kentucky and Nevada
- Processes 6,000-10,000 applications annually
- Works with 68 insurance carriers
- Upline is Pinnacle Financial Services

### Key People
| Person | Role | Platform Role |
|--------|------|---------------|
| Austin Tyler | Co-owner, Producer | super_admin, building the platform |
| Andrew Horn | Co-owner, A&A partner | admin (or agent with visibility) |
| Caroline Horn | Director of Operations | admin, manages contracting queue |

### The A&A Situation
- Austin + Andrew co-lead "A&A" team
- Agents under A&A should be visible to BOTH Austin and Andrew
- Andrew also has his own separate agents (only he sees those)
- **Solution:** Both have admin access, so visibility handled by role not special logic

---

## TECHNICAL DECISIONS (Why We Chose What)

### Hierarchy: Simple `manager_id` Approach

**We chose:** Single `manager_id` column on profiles (self-referential FK)

**We rejected:** Complex system with `hierarchy_type`, `hierarchy_entity_id`, `entity_owners` tables

**Why:**
- An "MGA" is just an agent with people reporting to them — no special flag needed
- Recursive query gives full downline tree
- Handles any depth naturally
- Less tables = less complexity = fewer bugs

**How it works:**
```
Agent reports to Austin → manager_id = Austin's profile ID
Agent reports to no one → manager_id = NULL (direct to TIG)
```

**Query for downline:**
```sql
WITH RECURSIVE downline AS (
  SELECT * FROM profiles WHERE manager_id = 'some_profile_id'
  UNION ALL
  SELECT p.* FROM profiles p
  JOIN downline d ON p.manager_id = d.id
)
SELECT * FROM downline;
```

### Data Integrity: NPN on Profiles

**Decision:** Add `npn` column to profiles table with UNIQUE constraint

**Why:** NPN is how the entire insurance industry identifies agents. Without it:
- Can't match RTS imports to agents
- Can't prevent duplicates
- Can't integrate with external systems

### Audit Trail: Database Triggers

**Decision:** Automatic change logging via Postgres triggers (not just application code)

**Why:** Developers forget to call logActivity(). Triggers never forget.

---

## CURRENT DATABASE STATE

### Tables That Matter

| Table | Purpose | Status |
|-------|---------|--------|
| `profiles` | Agent/user data | Exists, needs NPN column |
| `user_roles` | Role assignments | Solid |
| `contracting_applications` | Wizard submissions | Working |
| `carrier_statuses` | Per-agent per-carrier status | Working |
| `activity_logs` | Audit trail | Exists but manual-only |
| `hierarchy_entities` | OLD system | DEPRECATED, ignore |
| `entity_owners` | OLD system | DEPRECATED, ignore |

### Key Columns on Profiles

| Column | Type | Purpose | Status |
|--------|------|---------|--------|
| `id` | uuid | Primary key | OK |
| `user_id` | uuid | FK to auth.users | OK |
| `email` | text | Agent email | Needs UNIQUE |
| `full_name` | text | Display name | OK |
| `manager_id` | uuid | FK to profiles.id (upline) | USE THIS |
| `npn` | varchar(10) | National Producer Number | NEEDS ADDING |
| `onboarding_status` | enum | CONTRACTING_REQUIRED/SUBMITTED/APPOINTED | OK |
| `hierarchy_type` | text | OLD - ignore | DEPRECATED |
| `hierarchy_entity_id` | uuid | OLD - ignore | DEPRECATED |
| `upline_user_id` | uuid | OLD - ignore | DEPRECATED |

### Roles (from user_roles table)

| Role | Level | Who |
|------|-------|-----|
| `super_admin` | Highest | Austin |
| `admin` | High | Caroline, Andrew (maybe) |
| `manager` | Mid | MGAs, GAs with teams |
| `internal_tig_agent` | Agent | TIG W-2 employees |
| `independent_agent` | Agent | 1099 agents |

---

## BUILD PHASES

### COMPLETED
- Contracting wizard (8 steps, generates PDF)
- Admin contracting queue
- RTS import (uploads Pinnacle Excel, updates carrier statuses)
- Agent carrier status page
- File storage (3 buckets, proper RLS)
- Email (Resend + Microsoft Graph)
- Role-based access (5 roles, RLS policies)
- Feature flags system
- Foundation audit completed (Jan 17, 2026)

### IN PROGRESS (Current Sprint)

**Phase 1: Data Integrity**
- [ ] Add NPN column to profiles (UNIQUE)
- [ ] Add email UNIQUE constraint
- [ ] Migrate NPN from contracting_applications

**Phase 2: Hierarchy Cleanup**
- [ ] Confirm manager_id is being used
- [ ] Update HierarchyAssignmentPanel to use manager_id
- [ ] Update NewAgentPage to select upline user
- [ ] Add "My Team" view
- [ ] Deprecate old hierarchy columns

**Phase 3: Audit Trail**
- [ ] Add profiles change trigger
- [ ] Add carrier_statuses change trigger
- [ ] Add deactivation columns

### NEXT (After Foundation)
- Carrier Hub (database-driven, not static files)
- Dashboard improvements
- Agent-facing enhancements

---

## FILE STRUCTURE (Key Files)

```
src/
├── pages/
│   ├── admin/
│   │   ├── NewAgentPage.tsx        # Create agents
│   │   ├── AgentsPage.tsx          # Agent list
│   │   ├── ContractingQueuePage.tsx # Caroline's queue
│   │   └── HierarchyManagementPage.tsx # DELETE THIS
│   ├── ContractingHubPage.tsx      # Agent's carrier status
│   └── ...
├── components/
│   ├── admin/
│   │   ├── HierarchyAssignmentPanel.tsx # UPDATE for manager_id
│   │   └── ...
│   └── ...
├── integrations/
│   └── supabase/
│       └── types.ts                # Regenerate after migrations
└── ...

supabase/
├── migrations/                     # Database migrations
└── functions/                      # Edge functions
```

---

## WORKING STYLE

**How Austin wants to work with Claude:**
1. Small, focused prompts (1-2 tasks max)
2. Explain WHAT and WHY before doing
3. Wait for confirmation before next step
4. No black boxes — understand every piece
5. Build foundation right, no shortcuts

**When starting a new chat:**
1. Drop this document in
2. State what step/phase we're on
3. Share any relevant files if needed

---

## TERMINOLOGY

| Term | Meaning |
|------|---------|
| **NPN** | National Producer Number — unique agent identifier |
| **RTS** | Ready to Sell — agent is contracted + certified for a carrier |
| **Contracted** | Completed carrier's contracting process (one-time) |
| **Certified** | Completed carrier's annual certification |
| **AHIP** | Required certification before any carrier certs (annual) |
| **FMO** | Field Marketing Organization (TIG is one) |
| **MGA** | Managing General Agent — agent with significant downline |
| **GA** | General Agent — agent with small downline |
| **Pinnacle** | TIG's upline FMO |
| **A&A** | Austin & Andrew's shared team |

---

## CURRENT BLOCKERS / DECISIONS NEEDED

1. **None currently** — ready to execute Phase 1

---

## SESSION LOG

| Date | What Was Done | What's Next |
|------|---------------|-------------|
| 2026-01-17 | Full foundation audit completed | Phase 1: Add NPN to profiles |
| | Decided on manager_id approach | |
| | Created this context document | |

---

## HOW TO UPDATE THIS DOCUMENT

After each work session:
1. Move completed items from "In Progress" to "Completed"
2. Update "Session Log" with what was done
3. Update any changed database columns
4. Note any new decisions in "Technical Decisions" section

**Command for Claude:** "Update the TIG_PLATFORM_CONTEXT.md with today's progress"

---

## RELATED DOCUMENTATION

| File | Purpose | Status |
|------|---------|--------|
| `docs/TIG_PLATFORM_FOUNDATION_AUDIT.md` | Detailed 8-pillar audit with action items | Current |
| `LEARNING_LOG.md` | Daily learning journal | Ongoing |
| `docs/CARRIER_HUB_ANALYSIS.md` | Carrier Hub feature planning | Keep for later |
| `docs/ROADMAP_GENERATOR_*.md` | Roadmap feature docs | Keep (feature-specific) |

---

*This document is the single source of truth for TIG Platform development.*
