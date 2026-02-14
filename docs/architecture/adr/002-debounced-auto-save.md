# ADR-002: Debounced Auto-Save for Forms

**Status:** Accepted
**Date:** December 2025
**Deciders:** Development team

## Context

The contracting wizard is an 8-step form with many fields. Data must persist reliably without excessive API calls. Users may close the browser mid-form and need to resume later.

## Decision

Implement 800ms debounced auto-save with optimistic UI updates using `useRef` for pending updates.

## Rationale

- **Prevents data loss** — saves automatically without explicit "Save" button
- **Reduces server load** — 800ms debounce batches rapid changes
- **Responsive UX** — optimistic updates make the form feel instant
- **Resume support** — data persists to DB, survives browser close

## Implementation

```typescript
const DEBOUNCE_MS = 800;
const pendingUpdatesRef = useRef<Partial<ContractingApplication>>({});

const updateField = (field, value) => {
  // 1. Optimistic update (immediate UI)
  setApplication(prev => ({ ...prev, [field]: value }));

  // 2. Queue for batch write
  pendingUpdatesRef.current[field] = value;

  // 3. Debounce the DB write
  clearTimeout(debounceRef.current);
  debounceRef.current = setTimeout(() => flushUpdates(), DEBOUNCE_MS);
};
```

## Consequences

### Positive
- Reliable data persistence without user friction
- Good UX — no "unsaved changes" dialogs needed
- Efficient network usage via batching

### Negative
- Slight complexity in managing pending updates queue
- Edge case: browser crash within 800ms window = data loss (acceptable)
- Must handle concurrent updates carefully
