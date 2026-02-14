# ADR-006: Feature Flags via Database

**Status:** Accepted
**Date:** January 2026
**Deciders:** Development team

## Context

Need ability to toggle features without redeployment. Options:
- Environment variables (requires redeploy)
- Third-party service (LaunchDarkly, Flagsmith)
- Database table with React Context

## Decision

Implement `feature_flags` table in PostgreSQL with a React Context provider.

## Rationale

- **Runtime toggles** — change flags without deploy
- **Admin-controllable** — toggle via Supabase dashboard
- **No additional service** — uses existing infrastructure
- **Simple** — sufficient for current scale

## Implementation

```sql
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

```typescript
// FeatureFlagsContext.tsx
const { data: flags } = await supabase.from('feature_flags').select('*');

// Usage
const { isEnabled } = useFeatureFlags();
if (isEnabled('plan_finder')) { /* render component */ }
```

## Consequences

### Positive
- Flexible feature management at runtime
- No additional dependencies or costs
- Supports gradual rollout by toggling

### Negative
- Additional database query on every app load
- No per-user targeting (all-or-nothing flags)
- No A/B testing capabilities
- Must manage flag lifecycle (cleanup old flags)
