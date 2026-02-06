# Sync Feature Investigation Report

**Date:** February 5, 2026
**Issue:** Sync completes successfully but dashboard doesn't update

---

## 1. SYNC FEATURE OVERVIEW

The "Smart Sync" feature lets agents upload carrier production reports monthly to track their book of business. It supports 4 carriers (Aetna, WellCare, Humana, Anthem) and parses CSV/XLSX files to extract client counts, effective dates, and policy data.

**Entry point:** `/sync` route (SyncFlow.tsx) — accessed via SyncStatusPill on the dashboard or direct navigation.

---

## 2. COMPLETE DATA FLOW

```
                          SYNC FLOW
                          =========

  Agent Dashboard                    SyncFlow Page
  ┌──────────────┐                   ┌───────────────────────┐
  │SyncStatusPill│──click──────────> │ Phase: SELECT         │
  │  (synced/    │                   │ Choose carriers       │
  │   stale/     │                   ├───────────────────────┤
  │   never)     │                   │ Phase: UPLOAD         │
  └──────────────┘                   │ Upload files per      │
                                     │ carrier               │
                                     │   │                   │
                                     │   ▼                   │
                                     │ parse-production-     │
                                     │ report (Edge Fn)      │
                                     │   │                   │
                                     │   ▼                   │
                                     │ Writes: clients,      │
                                     │ policies,             │
                                     │ production_uploads    │
                                     ├───────────────────────┤
                                     │ handleCompleteSync()  │
                                     │   │                   │
                                     │   ├─ UPSERT monthly_  │
                                     │   │  syncs             │
                                     │   ├─ UPSERT sync_     │
                                     │   │  carrier_uploads   │
                                     │   ├─ UPDATE totals    │
                                     │   └─ Clear session    │
                                     │      storage          │
                                     ├───────────────────────┤
                                     │ Phase: DONE           │
                                     │ "Go to Dashboard" ────┼───> navigate('/')
                                     └───────────────────────┘
                                                                      │
                                                                      ▼
                                                              ┌──────────────┐
                                                              │  Index.tsx   │
                                                              │  Dashboard   │
                                                              │              │
                                                              │useDashboard  │
                                                              │Data() hook   │
                                                              │  │           │
                                                              │  ▼           │
                                                              │TanStack      │
                                                              │Query cache   │
                                                              │check         │
                                                              │  │           │
                                                              │  ▼           │
                                                              │< 5 min old? │
                                                              │YES: STALE ❌ │
                                                              │NO:  FRESH ✓  │
                                                              └──────────────┘
```

---

## 3. FILE INVENTORY (19 files)

### Pages
| File | Lines | Purpose |
|------|-------|---------|
| `src/pages/SyncFlow.tsx` | ~1462 | Main sync orchestration (select → upload → done) |
| `src/pages/Index.tsx` | — | Agent dashboard with SyncStatusPill |
| `src/pages/admin/AgentsBookPage.tsx` | — | Admin: all agents book overview |
| `src/pages/admin/AgentBookDetailPage.tsx` | — | Admin: single agent book detail |
| `src/pages/admin/AdminDashboard.tsx` | — | Admin dashboard (totalAgents, pendingCount) |

### Hooks
| File | Purpose |
|------|---------|
| `src/hooks/useDashboardData.ts` | TanStack Query hook — fetches monthly_syncs + carrier breakdown |
| `src/hooks/useSyncPreferences.ts` | Fetches last sync preferences for returning users |
| `src/hooks/useAgentRTSCarriers.ts` | Fetches agent's contracted carriers from carrier_statuses |

### Components
| File | Purpose |
|------|---------|
| `src/components/dashboard/SyncStatusPill.tsx` | Sync status indicator (synced/stale/never) |
| `src/components/dashboard/NextGoalCard.tsx` | Next milestone countdown |
| `src/components/dashboard/MilestoneJourneyCard.tsx` | Milestone progress visualization |
| `src/components/book-of-business/UploadModal.tsx` | File upload dialog with carrier detection |
| `src/components/book-of-business/GlobalUploadIndicator.tsx` | Background upload progress |

### Libraries
| File | Purpose |
|------|---------|
| `src/lib/sync.ts` | Core sync logic (initialize, complete, milestones) |
| `src/lib/carrier-detection.ts` | Auto-detect carrier from file content |
| `src/lib/rtsImport.ts` | RTS certification import (related) |

### Contexts
| File | Purpose |
|------|---------|
| `src/contexts/UploadContext.tsx` | Upload state management, calls edge function |

### Edge Functions
| File | Purpose |
|------|---------|
| `supabase/functions/parse-production-report/index.ts` | Server-side file parsing → clients/policies tables |

### Migrations
| File | Purpose |
|------|---------|
| `supabase/migrations/20260122000000_add_sync_tables.sql` | Core sync tables |
| `supabase/migrations/20260128000002_fix_sync_tables_rls.sql` | RLS policy fixes |
| `supabase/migrations/20260128000003_add_new_clients_columns.sql` | new_clients columns |

---

## 4. DATABASE TABLES

### Tables Sync WRITES To

| Table | Written By | Fields Updated |
|-------|-----------|----------------|
| `monthly_syncs` | SyncFlow.tsx `handleCompleteSync()` | status, total_clients, new_clients, completed_at |
| `sync_carrier_uploads` | SyncFlow.tsx `handleCompleteSync()` | client_count, new_clients, uploaded_at |
| `profiles` | lib/sync.ts `completeSync()` | last_sync_at |
| `milestones` | lib/sync.ts `completeSync()` | new milestone records |
| `production_uploads` | Edge function | status, stats, timestamps |
| `clients` | Edge function | client records (create/update) |
| `policies` | Edge function | policy records (create/update) |

### Tables Dashboard READS From

| Table | Read By | Query Key |
|-------|---------|-----------|
| `monthly_syncs` | useDashboardData.ts | `['dashboard', profile.id]` |
| `sync_carrier_uploads` | useDashboardData.ts (joined) | `['dashboard', profile.id]` |
| `carriers` | useDashboardData.ts (joined) | `['dashboard', profile.id]` |

### Relationship Diagram

```
profiles
  │
  ├── monthly_syncs (1:M, key: profile_id + month)
  │    └── sync_carrier_uploads (1:M, key: sync_id + carrier_id)
  │         └── carriers (M:1)
  │
  ├── agent_carriers (1:M)
  ├── milestones (1:M)
  ├── production_uploads (1:M)
  │
  └── clients (1:M)
       └── policies (1:M)
            └── carriers (M:1)
```

### RLS Policies
All sync tables use profile-based isolation:
- Agents: can only read/write their own data (profile_id match via `profiles.user_id = auth.uid()`)
- Admins: can read all data
- Service role: full access (edge functions)
- **RLS was fixed** in migration `20260128000002` — original had incorrect `profile_id = auth.uid()` (should be subquery)

---

## 5. ROOT CAUSE: Dashboard Doesn't Update After Sync

### The Problem

**There is NO `queryClient.invalidateQueries()` call anywhere after sync completion.**

### Evidence

SyncFlow.tsx `handleCompleteSync()` does this:
1. Upserts `monthly_syncs` record
2. Upserts `sync_carrier_uploads` records
3. Recalculates totals
4. Clears session storage
5. Sets `phase = 'done'`

What it does NOT do:
- Call `queryClient.invalidateQueries({ queryKey: ['dashboard'] })`
- Call any refetch mechanism
- Emit any event
- Set any flag

### TanStack Query Configuration (App.tsx)

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 min cache
      gcTime: 10 * 60 * 1000,         // 10 min GC
      refetchOnWindowFocus: false,     // No refetch on tab switch
      refetchOnMount: 'always',        // Fetch on mount if no data
      retry: 1,
    },
  },
});
```

### Dashboard Hook (useDashboardData.ts)

```typescript
const query = useQuery({
  queryKey: ['dashboard', profile?.id],
  queryFn: () => fetchDashboardData(profile!.id, profile!.full_name),
  enabled: !!profile?.id && !profileLoading,
  staleTime: 5 * 60 * 1000,  // 5 minute stale time
});
```

### What Happens

```
User completes sync at 10:00:00
  ↓
Navigates to dashboard at 10:00:05
  ↓
TanStack checks: is ['dashboard', id] query cached?
  ├─ If user visited dashboard < 5 min ago: YES → serves STALE cached data ❌
  └─ If first visit or > 5 min: NO → fetches fresh data ✓
```

**Scenario where it breaks:** User visits dashboard → starts sync → completes sync → returns to dashboard within 5 minutes → sees old numbers.

### Admin Dashboard Is Worse

`AdminDashboard.tsx` doesn't use TanStack Query at all — it uses `useState` + `useEffect` with empty deps. Data loads once on mount, never refreshes.

---

## 6. SECONDARY ISSUES

### A. SyncFlow Doesn't Call `completeSync()` from lib/sync.ts

SyncFlow.tsx has its **own inline** `handleCompleteSync()` that does direct Supabase calls. The `completeSync()` in `lib/sync.ts` (which handles milestone checks and `profiles.last_sync_at` update) appears to NOT be called from SyncFlow.

**Impact:** Milestones may not be awarded. `profiles.last_sync_at` may not update. The SyncStatusPill (which checks `last_sync_at`) could show "stale" even after a successful sync.

### B. parse-production-report Silently Skips Errors

The edge function catches per-row errors and increments `stats.skipped` without surfacing details:
```typescript
catch (rowError) {
  console.error(`Error processing row...`);
  stats.skipped++;  // Silent failure
}
```

### C. production_uploads Status Update Can Fail Silently

The edge function logs but doesn't propagate `production_uploads` status update failures — still returns `success: true`.

### D. Two Different Sync Completion Paths

- `SyncFlow.tsx` has inline `handleCompleteSync()` — writes to monthly_syncs and sync_carrier_uploads directly
- `lib/sync.ts` has `completeSync()` — writes to monthly_syncs, profiles, and milestones

These may be out of sync (pun intended). Need to verify which path is actually used.

---

## 7. RECOMMENDED FIXES (Priority Order)

### Fix 1: Add Query Invalidation After Sync (HIGH — fixes the main bug)

In `SyncFlow.tsx`, after `handleCompleteSync()` succeeds:

```typescript
import { useQueryClient } from '@tanstack/react-query';

// In component:
const queryClient = useQueryClient();

// At end of handleCompleteSync, after all writes succeed:
queryClient.invalidateQueries({ queryKey: ['dashboard'] });
```

### Fix 2: Verify `profiles.last_sync_at` Gets Updated (HIGH)

Check whether SyncFlow calls `completeSync()` from `lib/sync.ts` or if it only does inline writes. If `last_sync_at` isn't updated, SyncStatusPill will always show "stale."

### Fix 3: Verify Milestone Logic Runs (MEDIUM)

Same concern — if `completeSync()` from `lib/sync.ts` isn't called, milestones won't be checked.

### Fix 4: Admin Dashboard Refresh (LOW)

Consider migrating AdminDashboard to TanStack Query, or at minimum add a manual refresh button.

---

## 8. TESTING CHECKLIST

### Before Sync
- [ ] Check `monthly_syncs` for current month: should have no 'complete' record
- [ ] Check `sync_carrier_uploads`: should have no records for this month
- [ ] Check `profiles.last_sync_at`: note current value
- [ ] Note dashboard display: totalClients, newThisMonth, syncStatus

### During Sync
- [ ] Verify `parse-production-report` returns `{ success: true, stats: {...} }`
- [ ] Check `production_uploads` table: status should go pending → processing → complete
- [ ] Check `clients` table: new records should appear
- [ ] Check `policies` table: new records should appear

### After Sync Completion
- [ ] Check `monthly_syncs`: status = 'complete', total_clients populated
- [ ] Check `sync_carrier_uploads`: client_count populated for each carrier
- [ ] Check `profiles.last_sync_at`: should be updated to now
- [ ] Check `milestones`: new records if threshold crossed
- [ ] **Dashboard immediately after navigation**: does it show new data?
- [ ] **Dashboard without page refresh**: does it show new data?
- [ ] **Hard refresh (F5)**: does it show new data now?

### Expected Values
| Table | Field | Expected After Sync |
|-------|-------|---------------------|
| monthly_syncs | status | 'complete' |
| monthly_syncs | total_clients | Sum of all carrier client_counts |
| monthly_syncs | new_clients | Sum of new clients this month |
| monthly_syncs | completed_at | Timestamp of completion |
| sync_carrier_uploads | client_count | Per-carrier total |
| sync_carrier_uploads | new_clients | Per-carrier new count |
| profiles | last_sync_at | Current timestamp |

---

## 9. INVESTIGATION STEPS FOR NEXT SESSION

### Step 1: Confirm the Root Cause
1. Open browser DevTools → Network tab
2. Visit dashboard, note the Supabase query
3. Complete a sync
4. Navigate back to dashboard
5. Check: did a new Supabase query fire? Or was cached data served?
6. Check React Query DevTools (if installed) for `['dashboard', id]` cache state

### Step 2: Verify `profiles.last_sync_at` Updates
1. Before sync: query `SELECT last_sync_at FROM profiles WHERE id = '<your-id>'`
2. Complete a sync
3. After sync: query same — did it change?
4. If not, the inline `handleCompleteSync()` is missing this update

### Step 3: Verify Milestones Fire
1. Check if `completeSync()` from `lib/sync.ts` is ever called by SyncFlow
2. Search for imports: `import { completeSync } from`
3. If not called, milestones never fire from the main sync flow

### Step 4: Implement the Fix
1. Add `queryClient.invalidateQueries({ queryKey: ['dashboard'] })` to SyncFlow
2. Ensure `profiles.last_sync_at` is updated in `handleCompleteSync()`
3. Ensure milestone check runs after sync completion
4. Test the full flow end-to-end

### Step 5: Consider Additional Improvements
1. Add `queryClient.invalidateQueries()` for admin queries too
2. Add a manual "Refresh" button to admin dashboard
3. Consider enabling `refetchOnWindowFocus: true` globally
4. Add error surfacing for skipped rows in parse-production-report
