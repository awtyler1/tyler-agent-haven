# ADR-001: React Hook Composition over Redux

**Status:** Accepted
**Date:** December 2025
**Deciders:** Development team

## Context

The application needs state management for authentication, user profiles, role-based permissions, and form state. Options considered:
- Redux (traditional, mature ecosystem)
- Zustand (lightweight, minimal boilerplate)
- React Hook composition (custom hooks combining built-in hooks)

## Decision

Use custom React hooks with composition. `useAuth()` combines `useProfile()` + `useRole()` into a single unified API.

## Rationale

- **Single user per session** — no complex shared state between multiple users
- **Hooks are idiomatic** — natural React pattern, no additional abstractions
- **Simpler mental model** — no actions, reducers, selectors, middleware
- **Smaller bundle** — no additional dependency
- **Easy testing** — hooks can be tested individually

## Implementation

```typescript
// useAuth.ts — Composite hook
export function useAuth() {
  const { user, profile, loading } = useProfile();
  const { roles, primaryRole, ...roleUtils } = useRole();

  return { user, profile, roles, primaryRole, isAdmin: () => ... };
}
```

## Consequences

### Positive
- Cleaner, more readable code
- Smaller bundle size (no Redux/Zustand dependency)
- Easier onboarding for new developers

### Negative
- May need refactoring if multi-user collaboration features are added
- No Redux DevTools for debugging state changes
- State not serializable (harder to persist/replay)

### Risks
- If the app grows to need cross-component state sharing beyond auth, may need to add a state library later
