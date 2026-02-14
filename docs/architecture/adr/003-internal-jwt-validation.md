# ADR-003: Edge Functions with Internal JWT Validation

**Status:** Accepted
**Date:** December 2025
**Deciders:** Development team

## Context

Supabase Edge Functions can validate JWTs at the gateway level (before the function code runs) or internally (within the function code). Gateway-level validation had ECC key compatibility issues.

## Decision

Disable gateway JWT verification. Validate tokens inside each edge function using `supabase.auth.getUser()`.

## Rationale

- **Works around key format issues** — ECC key compatibility resolved
- **Function-level auth control** — each function can have different auth requirements (public, authenticated, admin, super admin)
- **Reliable** — `getUser()` is Supabase's own validation, equally secure

## Implementation

```typescript
// Every edge function does its own auth
const authHeader = req.headers.get("Authorization");
const { data: { user }, error } = await supabase.auth.getUser(
  authHeader.replace("Bearer ", "")
);
if (error || !user) throw new Error("Invalid token");

// Then check roles if needed
const { data: roles } = await supabase
  .from("user_roles").select("role").eq("user_id", user.id);
```

## Consequences

### Positive
- Reliable auth that works with Supabase's JWT format
- Fine-grained per-function auth control
- Some functions can be public (validate-password, OAuth callbacks)

### Negative
- More boilerplate per function (auth check in every function)
- Small performance overhead (~50ms per `getUser()` call)
- Must remember to add auth checks when creating new functions
