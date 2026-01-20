# UX Audit: Admin Dashboard
**Date:** January 19, 2026
**Auditor:** Claude
**Platform:** Tyler Insurance Group Agent Hub

---

## Executive Summary

The current admin dashboard is a **search-first** design that prioritizes looking up individual agents over operational workflow support. While the search functionality is excellent, the dashboard provides minimal at-a-glance insights and requires Caroline to navigate away to understand the state of her operation.

---

## CURRENT STATE

### Page Layout & Hierarchy

```
┌─────────────────────────────────────────────┐
│  HEADER: Logo + User Name + Avatar          │
├─────────────────────────────────────────────┤
│                                             │
│         "Find an Agent" (H1)                │
│      Search by name, NPN, or email          │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │  🔍 Start typing to search...       │    │
│  └─────────────────────────────────────┘    │
│                                             │
│              Quick Access                   │
│  ┌──────────────┐  ┌──────────────┐        │
│  │ Contracting  │  │ RTS Import   │        │
│  │ [badge: N]   │  │              │        │
│  └──────────────┘  └──────────────┘        │
│  ┌──────────────┐  ┌──────────────┐        │
│  │ All Agents   │  │   (empty)    │        │
│  └──────────────┘  └──────────────┘        │
│                                             │
│       [ Start Agent Contracting ]           │
│                                             │
│  ─────────────────────────────────────────  │
│              288 Total Agents               │
│                                             │
└─────────────────────────────────────────────┘
```

### Elements Inventory

| Element | Type | Data Source | Purpose |
|---------|------|-------------|---------|
| Logo | Static | Asset | Branding, home link |
| User name | Dynamic | `profile.full_name` | Identity |
| Avatar dropdown | Interactive | Auth | Sign out, settings |
| "Find an Agent" | H1 heading | Static | Primary CTA |
| Search input | Interactive | `profiles` table | Agent lookup |
| Search results | Dynamic | Supabase query | Display matches |
| Contracting tile | Navigation | `contracting_applications` | Link + badge count |
| RTS Import tile | Navigation | Static | Link only |
| All Agents tile | Navigation | Static | Link only |
| Start Contracting button | CTA | Static | Opens NewAgentPage |
| Total Agents stat | Metric | `profiles` count | Single KPI |

### Data Being Fetched (on load)

1. **Total agent count** - Excludes admins, test records
2. **Contracting queue count** - `contracting_applications` where `status = 'submitted'`
3. **Search results** (on input) - Name, NPN, email fuzzy match, limited to 8

### Actions Available

| Action | Location | Clicks to Complete |
|--------|----------|-------------------|
| Search for agent | Main search | 1 (type + click result) |
| View contracting queue | Tile | 1 |
| View all agents | Tile | 1 |
| Import RTS data | Tile | 1 |
| Start new agent contracting | Button | 1 |
| Sign out | Avatar dropdown | 2 |

---

## USER JOURNEY ANALYSIS

### Caroline's Typical Day (Inferred)

Based on the existing functionality, Caroline likely:

1. **Checks contracting queue** for new submissions
2. **Processes applications** - reviews documents, sends to Pinnacle
3. **Looks up agents** to answer questions from managers or agents
4. **Adds new agents** when someone needs to start contracting
5. **Imports RTS data** periodically after Pinnacle sends reports
6. **Checks agent status** for carrier appointments, AHIP completion

### Journey Friction Points

#### What Caroline CAN answer immediately:
- ✅ How many total agents do we have? (288)
- ✅ Are there contracting applications to process? (badge count)

#### What Caroline CANNOT answer without clicking away:
- ❌ How many agents are in each status? (Appointed vs Pending vs Contracting)
- ❌ Who submitted contracting this week?
- ❌ Which agents are missing AHIP certification?
- ❌ How many agents report to each manager?
- ❌ What's the breakdown of agent states?
- ❌ Are there agents stuck in contracting?
- ❌ Which agents haven't set up their accounts?
- ❌ What happened recently? (no activity feed)

### Click Depth to Common Tasks

| Task | Clicks Required | Path |
|------|-----------------|------|
| Check contracting queue | 1 | Dashboard → Tile |
| Look up specific agent | 2 | Dashboard → Search → Click result |
| See all agents by manager | 2 | Dashboard → All Agents → Filter |
| Check AHIP status for agent | 3+ | Search → Profile → Scroll |
| Send setup link to new agent | 3+ | All Agents → Find → Quick View → Send |
| See recently joined agents | 2+ | All Agents → Sort (if exists) |

---

## GAPS & PAIN POINTS

### 1. **No Operational Metrics**

The dashboard shows only **one number**: total agents. For a Director of Operations, this is nearly useless for daily decision-making.

**Missing metrics:**
- Agents by onboarding status (funnel view)
- Contracting submissions this week/month
- Agents pending setup link
- Agents without AHIP
- Active vs invited vs imported breakdown

### 2. **No Pipeline Visibility**

Caroline has no view of the agent lifecycle at a glance:
```
[Imported] → [Invited] → [Contracting] → [Submitted] → [Appointed]
   ??           ??           ??             N             ??
```

Only the contracting badge gives a number. Everything else requires drilling down.

### 3. **No Activity Feed**

No sense of "what happened today" or "what needs attention":
- No recent agent additions
- No recent contracting submissions
- No status changes
- No alerts for stale items

### 4. **Search-Centric Assumption**

The page assumes Caroline knows **who** she's looking for. But operational work often involves:
- "Who needs attention?"
- "What fell through the cracks?"
- "Who's in X status?"

These require the All Agents page with filters, not search.

### 5. **Quick Access Grid Issues**

- Only 3 tiles in a 2x2 grid (looks incomplete)
- Tiles don't show counts (except Contracting)
- No visual hierarchy - all tiles look equally important
- Missing common destinations (Activity Log, Settings)

### 6. **Underutilized Footer Space**

The footer stat area only shows total agents. This prime real estate could show:
- Agent breakdown by status
- Recent trends
- Pending actions count

### 7. **No Manager/Hierarchy View**

Andrew, Jeremy, or other managers can't quickly see:
- Their direct reports
- Their team's performance
- Downline activity

The Teams feature was removed, but no replacement exists.

### 8. **Mobile Experience Unknown**

Dashboard appears desktop-focused. The Quick Access tiles may stack poorly on mobile.

---

## OPPORTUNITIES

### High Impact, Low Effort

1. **Add status breakdown stats**
   - Replace single "288 Total Agents" with a horizontal stat bar:
   - `Appointed: 245 | Contracting: 18 | Pending: 25`

2. **Add counts to Quick Access tiles**
   - All Agents: "288 agents"
   - RTS Import: "Last: Jan 15" (show freshness)

3. **Add "Needs Attention" section**
   - Agents invited but no password set (> 3 days)
   - Contracting pending > 5 days
   - Missing AHIP for upcoming season

### Medium Impact, Medium Effort

4. **Activity feed widget**
   - "Sarah Jones submitted contracting 2h ago"
   - "John Smith completed AHIP certification"
   - "5 agents imported from RTS"

5. **Quick filter shortcuts**
   - "Show agents missing AHIP"
   - "Show agents pending contracting"
   - "Show agents in KY"

6. **Manager dashboard view**
   - If user has downline, show their team stats
   - Direct reports count
   - Team contracting status

### Higher Effort, Higher Impact

7. **Redesign to workflow-first**
   - Move search to header (persistent)
   - Make main content area about "state of operations"
   - Today's priorities
   - Pipeline visualization
   - Recent activity

8. **Role-based dashboard**
   - Caroline sees ops metrics
   - Austin/Andrew see high-level business stats
   - Managers see team-specific views

---

## COMPETITIVE BENCHMARK

Typical admin dashboards for similar platforms include:

| Feature | TIG Hub | Industry Standard |
|---------|---------|-------------------|
| Search | ✅ Excellent | ✅ |
| Pipeline/Funnel | ❌ Missing | ✅ |
| Activity feed | ❌ Missing | ✅ |
| Status breakdown | ❌ Missing | ✅ |
| Alerts/Attention | ❌ Missing | ✅ |
| Quick filters | ❌ Missing | ✅ |
| Recent items | ❌ Missing | ✅ |
| Time-based metrics | ❌ Missing | ✅ |

---

## RECOMMENDATIONS PRIORITY

### P0 - Critical (Do First)
1. Add agent status breakdown to dashboard
2. Show pending actions count (not just contracting)

### P1 - High Priority
3. Add activity feed (recent 5-10 events)
4. Add "Needs Attention" alerts
5. Fill Quick Access grid meaningfully

### P2 - Medium Priority
6. Add quick filter shortcuts
7. Time-based metrics (this week/month trends)
8. Manager-specific view for users with downline

### P3 - Nice to Have
9. Mobile optimization
10. Customizable dashboard widgets
11. Saved filters/views

---

## FILES REVIEWED

- `src/pages/admin/AdminDashboard.tsx` - Main dashboard component
- `src/pages/admin/ContractingQueuePage.tsx` - Contracting workflow
- `src/pages/admin/AgentsPage.tsx` - Agent list wrapper
- `src/components/admin/AllAgentsTab.tsx` - Full agent table
- `src/pages/admin/RTSImportPage.tsx` - RTS import flow
- `src/pages/admin/NewAgentPage.tsx` - Add agent form

---

## APPENDIX: Data Already Available

The following data exists in the database and could power new dashboard features:

| Data Point | Table | Notes |
|------------|-------|-------|
| Onboarding status | `profiles.onboarding_status` | APPOINTED, CONTRACTING_REQUIRED, etc. |
| Password created | `profiles.password_created_at` | Indicates account activation |
| Setup link sent | `profiles.setup_link_sent_at` | Invitation tracking |
| Manager hierarchy | `profiles.manager_id` | Full org chart available |
| Ownership group | `profiles.ownership_group` | A&A team identification |
| Carrier statuses | `carrier_statuses` | Per-agent carrier appointments |
| AHIP status | `certifications` | Yearly certifications |
| Activity logs | `activity_logs` | Full audit trail |
| Contracting apps | `contracting_applications` | Queue and history |
| RTS imports | `rts_import_logs` | Import history |

All data needed for a more powerful dashboard already exists.
