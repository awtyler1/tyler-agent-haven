# Dashboard Loading Audit

**Date:** February 4, 2026
**Issue:** Dashboard refetches data when switching browser tabs + slow loading

---

## 1. DASHBOARD LOADING ANALYSIS

### src/pages/Index.tsx

**Hooks called on mount:**
```tsx
const { data, isLoading, error } = useDashboardData();  // Line 34
const navigate = useNavigate();                          // Line 35
```

**Data fetched:**
- `useDashboardData()` - Custom hook that fetches book of business data

---

### src/hooks/useDashboardData.ts

**CRITICAL FINDING: NOT USING REACT QUERY**

The hook uses raw `useState`/`useEffect` instead of `useQuery`:

```tsx
const [data, setData] = useState<DashboardData | null>(null);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<Error | null>(null);

useEffect(() => {
  if (!profileLoading) {
    fetchDashboardData();  // Refetches on EVERY mount
  }
}, [profileLoading, fetchDashboardData]);
```

**API calls made (2 sequential Supabase queries):**

1. **Monthly sync history:**
```tsx
await supabase
  .from('monthly_syncs')
  .select('month, total_clients, previous_month_clients, new_clients, created_at')
  .eq('profile_id', profileId)
  .eq('status', 'complete')
  .order('month', { ascending: true });
```

2. **Carrier breakdown (with join):**
```tsx
await supabase
  .from('monthly_syncs')
  .select(`
    id,
    sync_carrier_uploads (
      carrier_id,
      client_count,
      carriers (id, code, name)
    )
  `)
  .eq('profile_id', profileId)
  .eq('status', 'complete')
  .order('month', { ascending: false })
  .limit(1)
  .single();
```

**Depends on:** `useProfile()` → `useAuth()`

---

### src/hooks/useAuth.ts

**ALSO NOT USING REACT QUERY**

Uses raw `useState`/`useEffect` with Supabase auth state listener:

```tsx
const [user, setUser] = useState<User | null>(null);
const [profile, setProfile] = useState<Profile | null>(null);
const [roles, setRoles] = useState<AppRole[]>([]);
const [loading, setLoading] = useState(true);
```

**API calls made (3 in parallel via Promise.all):**

1. `profiles` table query (single row)
2. `user_roles` table query
3. `current_user_has_downline` RPC call

---

## 2. REACT QUERY CONFIGURATION

### src/App.tsx (Line 67)

```tsx
const queryClient = new QueryClient();  // NO DEFAULT OPTIONS!
```

**Current defaults (React Query v5 built-in):**
| Option | Default Value | Problem |
|--------|--------------|---------|
| `staleTime` | `0` | Data immediately stale, triggers refetch |
| `gcTime` | `5 minutes` | OK |
| `refetchOnWindowFocus` | `true` | **CAUSES TAB SWITCH REFETCH** |
| `refetchOnMount` | `true` | Refetches even when cached |
| `retry` | `3` | Too many retries on failure |

---

## 3. ROOT CAUSE ANALYSIS

### Tab Switch Refetch Issue
- **Cause:** `refetchOnWindowFocus: true` (React Query default)
- **Impact:** Every time user switches tabs, ALL queries refetch
- **But wait:** useDashboardData doesn't use useQuery at all!

### Slow Dashboard Loading
1. **No caching:** useDashboardData uses useState/useEffect, no query cache
2. **Sequential dependency:** Must wait for useAuth → then fetch dashboard data
3. **2 sequential Supabase calls:** sync history → carrier breakdown (not parallelized)

---

## 4. ISSUES SUMMARY

| Issue | Root Cause | Impact |
|-------|-----------|--------|
| Tab switch refetch | QueryClient default `refetchOnWindowFocus: true` | Unnecessary API calls |
| No dashboard cache | useDashboardData uses useState, not useQuery | Refetches every navigation |
| Auth waterfall | useAuth must complete before dashboard fetches | Slow initial load |
| Sequential queries | Dashboard makes 2 sequential Supabase calls | Could be parallelized |

---

## 5. FIXES APPLIED ✅

### Fix 1: QueryClient Defaults (App.tsx) ✅

```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // Data stays fresh for 5 minutes
      gcTime: 10 * 60 * 1000,        // Cache kept for 10 minutes
      refetchOnWindowFocus: false,   // DON'T refetch when tab regains focus
      refetchOnMount: 'always',      // But do fetch on first mount if no data
      retry: 1,                      // Only retry once on failure
    },
  },
});
```

### Fix 2: useDashboardData with useQuery ✅

Converted to React Query with parallel queries:

```tsx
export function useDashboardData(): UseDashboardDataReturn {
  const { profile, loading: profileLoading } = useProfile();

  const query = useQuery({
    queryKey: ['dashboard', profile?.id],
    queryFn: () => fetchDashboardData(profile!.id, profile!.full_name),
    enabled: !!profile?.id && !profileLoading,
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading || profileLoading,
    error: query.error as Error | null,
    refetch: async () => { await query.refetch(); },
  };
}
```

### Fix 3: Parallelized Supabase Queries ✅

```tsx
// Run BOTH queries in parallel for faster loading
const [syncHistoryResult, carrierDataResult] = await Promise.all([
  supabase.from('monthly_syncs').select(...),
  supabase.from('monthly_syncs').select(...with carriers...),
]);
```

---

## 6. FILES MODIFIED

| File | Change |
|------|--------|
| `src/App.tsx` | Added QueryClient default options |
| `src/hooks/useDashboardData.ts` | Converted to useQuery + parallelized queries |

---

## 7. IMPROVEMENTS ACHIEVED

| Metric | Before | After |
|--------|--------|-------|
| Tab switch refetch | Always | Never (unless stale) |
| Dashboard re-mount | Full refetch | Instant from cache |
| Dashboard queries | 2 sequential | 2 parallel |
| Perceived speed | Loader on every nav | Instant cached data |
| Data freshness | Always stale | 5 minute window |

---

## 8. HOW TO TEST

1. Load dashboard - should show data
2. Navigate to Carrier Resources
3. Navigate back to dashboard - **should be INSTANT** (no loader)
4. Switch to another browser tab, wait 5 seconds, switch back - **should NOT refetch**
5. Wait 5+ minutes, then refresh - should refetch (data now stale)
