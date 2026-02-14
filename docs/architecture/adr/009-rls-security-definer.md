# ADR-009: RLS with Security Definer Functions

**Status:** Accepted
**Date:** January 2026
**Deciders:** Development team

## Context

PostgreSQL Row Level Security (RLS) policies need to check user roles and profile ownership. Naive approaches cause recursive policy evaluation (e.g., an RLS policy on `profiles` that queries `profiles` to check ownership).

## Decision

Use `SECURITY DEFINER` functions to safely check roles and profile ownership within RLS policies.

## Rationale

- **Prevents recursive RLS** — SECURITY DEFINER functions execute with the definer's privileges, bypassing RLS on the tables they query
- **Centralized logic** — role and ownership checks defined once, reused across all policies
- **PostgreSQL best practice** — standard pattern for RLS helper functions

## Implementation

```sql
-- Bypasses RLS to check roles without recursion
CREATE FUNCTION has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$;

-- Bypasses RLS to get profile ID without recursion
CREATE FUNCTION get_my_profile_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT id FROM profiles WHERE user_id = auth.uid());
END;
$$;

-- Check downline status
CREATE FUNCTION current_user_has_downline()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE manager_id = get_my_profile_id()
  );
END;
$$;
```

### Usage in RLS policies

```sql
-- Example: Profiles table
CREATE POLICY "Admins view all" ON profiles
  FOR SELECT USING (
    has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Managers view team" ON profiles
  FOR SELECT USING (
    has_role(auth.uid(), 'manager') AND manager_id = get_my_profile_id()
  );
```

## Consequences

### Positive
- Eliminates recursive RLS issues
- Clean, readable RLS policies
- Centralized authorization logic
- Performance: function results can be cached within a transaction

### Negative
- SECURITY DEFINER functions must be carefully written (SQL injection risk if dynamic SQL used)
- `SET search_path = public` required to prevent search_path attacks
- Must be owned by a superuser or table owner

## Security Considerations

- All three functions use static SQL (no string interpolation) — safe from SQL injection
- `SET search_path = public` prevents malicious schema override
- Functions only read data (no writes) — limited blast radius
