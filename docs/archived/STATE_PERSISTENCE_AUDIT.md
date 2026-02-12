# State Persistence Audit

**Date:** February 4, 2026
**Purpose:** Identify useState variables that should persist in URL for better UX

---

## Audit Results

| Page | State Variable | What It Holds | Needs URL Persist? | Priority |
|------|----------------|---------------|-------------------|----------|
| **PlanFinderPage** | `searchInput` | County/zip search text | Yes | High |
| **PlanFinderPage** | `selectedCounty` | Selected county object | Yes | High |
| **PlanFinderPage** | `view` | 'search' \| 'results' \| 'compare' | Yes | High |
| **PlanFinderPage** | `comparePlans` | Array of plan IDs to compare | Yes | Medium |
| **PlanFinderPage** | `detailPlan` | Plan shown in detail modal | No (modal state) | - |
| **PlanFinderPage** | `filters` | Premium/deductible/drug filters | Yes | Medium |
| **PlanFinderPage** | `sortBy` | Sort preference | Yes | Low |
| **FormsLibraryPage** | `searchQuery` | Form search text | Yes | Medium |
| **FormsLibraryPage** | `selectedCategory` | Active category filter | Yes | Medium |
| **FormsLibraryPage** | `previewDoc` | Document in preview modal | No (modal state) | - |
| **ContractingHubPage** | `resourcesOpen` | Accordion open state | No (UI preference) | - |
| **ContractingHubPage** | `uploading` | Upload in progress flag | No (transient) | - |
| **TrainingPage** | `isMobileSidebarOpen` | Mobile nav toggle | No (UI state) | - |
| **TrainingPage** | `videoId` | Selected video | Already in URL | Done |
| **ContractingQueuePage** | `selectedAgent` | Agent in detail view | Yes | High |
| **ContractingQueuePage** | `searchTerm` | Agent search text | Yes | Medium |
| **ContractingQueuePage** | `showCompleted` | Filter toggle | Yes | Low |
| **AgentsBookPage** | `searchQuery` | Agent search text | Yes | Medium |
| **AgentsBookPage** | `statusFilter` | Status filter value | Yes | Medium |
| **ActivityLogPage** | `searchQuery` | Log search text | Yes | Medium |
| **ActivityLogPage** | `actionFilter` | Action type filter | Yes | Medium |
| **AllAgentsTab** | `searchQuery` | Agent search text | Yes | Medium |
| **AllAgentsTab** | `statusFilter` | Status filter | Yes | Medium |
| **AllAgentsTab** | `managerFilter` | Manager filter | Yes | Medium |
| **AllAgentsTab** | `stateFilter` | State filter | Yes | Medium |
| **AllAgentsTab** | `currentPage` | Pagination page | Yes | Medium |
| **AllAgentsTab** | `selectedIds` | Bulk selection | No (transient) | - |
| **AgentProfilePage** | Modal states | Various edit modals | No (modal state) | - |
| **RTSImportPage** | `importing` | Import in progress | No (transient) | - |
| **RTSImportPage** | `importResult` | Import results | No (transient) | - |
| **CarrierResourcesPage** | `selectedCarrierCode` | Selected carrier tab | Already in URL | Done |

---

## Summary

### Completed (February 4, 2026)
- **CarrierResourcesPage** - Carrier selection in URL (`?carrier=humana`)
- **TrainingPage** - Video ID via `useParams`
- **PlanFinderPage.tsx** - County, view, compare, filters, sort all in URL
- **ContractingQueuePage.tsx** - Agent, search, completed filter in URL
- **FormsLibraryPage.tsx** - Search and category in URL
- **AgentsBookPage.tsx** - Search and status filter in URL
- **ActivityLogPage.tsx** - Search and action filter in URL
- **AllAgentsTab.tsx** - All 5 filters + pagination in URL

### High Priority - DONE
| File | Status |
|------|--------|
| **PlanFinderPage.tsx** | Completed |
| **ContractingQueuePage.tsx** | Completed |

### Medium Priority - DONE
| File | Status |
|------|--------|
| **FormsLibraryPage.tsx** | Completed |
| **AgentsBookPage.tsx** | Completed |
| **ActivityLogPage.tsx** | Completed |
| **AllAgentsTab.tsx** | Completed |

### Low Priority / Skip
| File | Reason |
|------|--------|
| **ContractingHubPage.tsx** | Accordion state is UI preference, not critical |
| **AgentProfilePage.tsx** | Modal states are transient, close on navigation is expected |
| **RTSImportPage.tsx** | Import state is transient, should reset on navigation |
| **TrainingPage.tsx** | Mobile sidebar toggle is transient UI state |

---

## Implementation Pattern

Use `useSearchParams` from react-router-dom:

```tsx
// Before (useState)
const [searchQuery, setSearchQuery] = useState('');
const [statusFilter, setStatusFilter] = useState('all');

// After (useSearchParams)
const [searchParams, setSearchParams] = useSearchParams();
const searchQuery = searchParams.get('q') || '';
const statusFilter = searchParams.get('status') || 'all';

const updateFilters = (updates: Record<string, string>) => {
  setSearchParams(prev => {
    const next = new URLSearchParams(prev);
    Object.entries(updates).forEach(([k, v]) => {
      if (v) next.set(k, v);
      else next.delete(k);
    });
    return next;
  });
};
```

---

## Estimated Total Effort

| Priority | Files | Effort |
|----------|-------|--------|
| High | 2 | ~2-3 hours |
| Medium | 4 | ~2-3 hours |
| **Total** | **6 files** | **~4-6 hours** |

---

## Recommendations

1. **Start with PlanFinderPage** - Most user-facing, highest impact for shareability
2. **Then admin pages** - ContractingQueuePage, AgentsBookPage, ActivityLogPage
3. **AllAgentsTab last** - Most complex with pagination logic

All changes follow the same pattern used in CarrierResourcesPage fix.
