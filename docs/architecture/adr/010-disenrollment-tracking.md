# ADR-010: Disenrollment Tracking in Sync

**Status:** Accepted
**Date:** February 2026
**Deciders:** Development team

## Context

The original Book of Business sync only tracked total active clients and new enrollments per month. This gave an incomplete picture — agents couldn't see client losses (disenrollments/terminations) or net growth.

## Decision

Add `termed_clients` and `net_change` columns to both `monthly_syncs` and `sync_carrier_uploads` tables. Update the sync flow to query the policies table for accurate active, new, and termed counts.

## Rationale

- **Accurate business picture** — agents need to see gains AND losses
- **Net change visibility** — dashboard shows meaningful growth metric
- **Admin reporting** — admin pages can show both active and termed for accurate stats
- **Data already exists** — policies table has `status` and `termed_date` fields

## Implementation

### Migration: `20260205000000_add_disenrollment_tracking.sql`

```sql
ALTER TABLE monthly_syncs
  ADD COLUMN termed_clients INTEGER DEFAULT 0,
  ADD COLUMN net_change INTEGER DEFAULT 0;

ALTER TABLE sync_carrier_uploads
  ADD COLUMN termed_clients INTEGER DEFAULT 0;
```

### Sync Flow Changes

```typescript
// After edge function parses upload, query policies for accurate counts:
const { count: activeCount } = await supabase
  .from('policies')
  .select('*', { count: 'exact' })
  .eq('profile_id', profileId)
  .eq('carrier_id', carrierId)
  .eq('status', 'active');

const { count: newCount } = await supabase
  .from('policies')
  .select('*', { count: 'exact' })
  .eq('profile_id', profileId)
  .eq('carrier_id', carrierId)
  .gte('effective_date', monthStart);

const { count: termedCount } = await supabase
  .from('policies')
  .select('*', { count: 'exact' })
  .eq('profile_id', profileId)
  .eq('carrier_id', carrierId)
  .gte('termed_date', monthStart);

// Update sync_carrier_uploads with all three counts
// On completion: net_change = new_clients - termed_clients
```

### Dashboard Changes

- Shows `net_change` instead of just `new_clients`
- Positive net change = green indicator
- Negative net change = red indicator

## Consequences

### Positive
- Complete picture of book growth/decline
- Better agent self-management (see which carriers are losing clients)
- Admin can identify at-risk agents with negative trends

### Negative
- More complex sync completion logic
- Additional DB queries per carrier during sync
- Dashboard card slightly more complex
