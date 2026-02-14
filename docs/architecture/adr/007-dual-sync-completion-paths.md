# ADR-007: Dual Sync Completion Paths

**Status:** Accepted (Technical Debt)
**Date:** February 2026
**Deciders:** Development team

## Context

The Book of Business sync feature evolved over multiple iterations. The completion logic now exists in two places:

1. **`SyncFlow.tsx`** — inline `handleCompleteSync()` function
2. **`lib/sync.ts`** — exported `completeSync()` function

These two paths do different things and are not unified.

## Decision

Accept this as known technical debt. Document the divergence and plan to unify in a future sprint.

## Current State

### SyncFlow.tsx `handleCompleteSync()`
- Sums total_clients from carrier uploads
- Calculates net_change (new - termed)
- Updates `monthly_syncs` record to 'complete'
- Updates `profiles.last_sync_at`
- Invalidates TanStack Query cache: `['dashboard']`
- **Does NOT** call milestone checks

### lib/sync.ts `completeSync()`
- Sums total_clients from carrier uploads
- Calculates delta from previous month
- Updates `monthly_syncs` record
- **Calls** `checkAndAwardMilestones()`
- Updates `profiles.last_sync_at`
- **Does NOT** invalidate TanStack Query cache

## Impact

- **Milestones may not be awarded** during SyncFlow completion
- **Dashboard may not refresh** if lib/sync.ts path is used
- Both paths update `last_sync_at`, so sync status checks work correctly

## Recommended Resolution

Unify into a single completion path:
1. Move all completion logic to `lib/sync.ts`
2. Have `SyncFlow.tsx` call `completeSync()` from lib
3. Add cache invalidation to `completeSync()`
4. Ensure milestone checks run in all paths

## Consequences

### Current (tech debt)
- Milestone achievements may be inconsistent
- Two places to update when sync logic changes
- Potential for further divergence

### After resolution
- Single source of truth for sync completion
- Consistent milestone tracking
- Easier to maintain and debug
