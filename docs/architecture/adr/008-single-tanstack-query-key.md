# ADR-008: Single TanStack Query Key Pattern

**Status:** Accepted
**Date:** February 2026
**Deciders:** Development team

## Context

The application uses TanStack Query for server state management. As features were built, only one query key emerged: `['dashboard', profileId]`. Admin pages use plain `useState`/`useEffect` for data fetching.

## Decision

Maintain the single query key pattern for now. Admin pages continue with plain React state.

## Rationale

- **Dashboard is the only cached page** — it's the most-visited page and benefits from caching
- **Admin pages are low-traffic** — admins expect fresh data every time, no need for caching
- **Simple cache invalidation** — only one key to invalidate after mutations
- **Avoids over-engineering** — TanStack Query adds complexity; only use where beneficial

## Implementation

```typescript
// Dashboard (TanStack Query)
const { data } = useQuery({
  queryKey: ['dashboard', profileId],
  queryFn: fetchDashboardData,
});

// After sync completion
queryClient.invalidateQueries({ queryKey: ['dashboard'] });

// Admin pages (plain state)
const [agents, setAgents] = useState([]);
useEffect(() => {
  supabase.from('profiles').select('*').then(({ data }) => setAgents(data));
}, []);
```

## Configuration

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,    // 5 minutes
      gcTime: 10 * 60 * 1000,      // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: 'always',
    }
  }
});
```

## Consequences

### Positive
- Simple mental model — one cached query, everything else is fresh
- Easy to invalidate — `invalidateQueries({ queryKey: ['dashboard'] })` covers it
- No stale data issues on admin pages

### Negative
- Admin pages make fresh DB calls on every mount (could cache if performance becomes an issue)
- If more pages need caching, will need to add more query keys
- Inconsistent patterns between agent and admin pages
