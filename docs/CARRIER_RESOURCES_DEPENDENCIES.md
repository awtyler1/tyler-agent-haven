# CarrierResourcesPage — Component & Dependency Map

Generated: 2026-02-13

---

## Direct Imports (CarrierResourcesPage.tsx)

| Import | Source | Type |
|--------|--------|------|
| `useEffect, useRef, useState, useCallback` | `react` | React hooks |
| `useSearchParams` | `react-router-dom` | URL state |
| `useCarrierDirectory` | `@/hooks/useCarrierDirectory` | Hook — fetches carriers + contacts/links/docs from Supabase |
| `useAgentCarriers` | `@/hooks/useCarrierDirectory` | Hook — filters to agent's certified carriers |
| `CARRIER_BRAND_COLORS` | `@/config/carriers` | Static color map (6 carriers) |
| `PageLoader` | `@/components/ui/PageLoader` | Loading spinner component |
| `GH` | `@/config/golden-hour` | Golden Hour design tokens |
| `GlassPanel` | `@/components/ui/GlassPanel` | Frosted-glass card wrapper |

## Inline Components (defined in CarrierResourcesPage.tsx)

- `PortalIcon` — SVG icon for portal links
- `DollarIcon` — SVG icon for commission links
- `BookIcon` — SVG icon for certification links
- `SearchIcon` — SVG icon for directory links
- `ExternalIcon` — SVG icon fallback
- `FileIcon` — SVG icon for documents
- `linkTypeIcon()` — Maps link_type string to icon component
- `linkIconStyle()` — Maps link_type to gradient bg + shadow

## Route (App.tsx)

```
Line 40:  const CarrierResourcesPage = lazy(() => import("./pages/CarrierResourcesPage"));
Line 168: <Route path="carrier-resources" element={<CarrierResourcesPage />} />
Line 169: <Route path="carrier-resources/plans" element={<CarrierPlansPage />} />
```

Both routes are inside the `<ProtectedRoute><AgentShell /></ProtectedRoute>` wrapper (agent-facing, auth required).

## Related Carrier Pages

| Page | Route | Purpose |
|------|-------|---------|
| `CarrierResourcesPage` | `/carrier-resources` | Contacts, links, documents per carrier |
| `CarrierPlansPage` | `/carrier-resources/plans` | CMS plan finder by county/ZIP |
| `CarrierPortalsPage` | `/carrier-portals` | Quick-access portal link grid |

---

## All Carrier-Related Files

### Config & Data
| File | Purpose |
|------|---------|
| `src/config/carriers.ts` | `CARRIER_BRAND_COLORS` (6 colors), `CARRIERS[]` (42 CarrierConfig entries for sync flow), `ENABLED_CARRIERS`, `COMING_SOON_CARRIERS`, lookup helpers |
| `src/data/carriersData.ts` | **Legacy static data** — full KY contacts, portal links, downloads, and Summary of Benefits per carrier (Aetna, Anthem, Devoted, Humana, UHC, WellCare). 897 lines. Scaffolded for 7 states but only KY populated. |
| `src/config/golden-hour.ts` | Design token object (`GH`) used throughout for colors, fonts, gradients |

### Types
| File | Purpose |
|------|---------|
| `src/types/carrierDirectory.ts` | `Carrier`, `CarrierContact`, `CarrierLink`, `CarrierDocument`, `CarrierWithResources`, `CarrierDisplayInfo`, `CARRIER_LOGOS` |

### Hooks
| File | Purpose |
|------|---------|
| `src/hooks/useCarrierDirectory.ts` | `useCarrierDirectory(stateCode)` — DB fetch carriers+resources; `useAgentCarriers()` — certified carriers for current user; `useSupportedCarriers()` — static list of 6; `getCarrierLogo()` |
| `src/hooks/useAgentRTSCarriers.ts` | RTS certification data for agents |
| `src/hooks/useCarrierRequestHistory.ts` | Carrier request audit trail |
| `src/hooks/useCarrierIncome.ts` | Income data by carrier |

### Lib
| File | Purpose |
|------|---------|
| `src/lib/carrier-detection.ts` | Auto-detect carrier from uploaded file headers (CSV/XLSX), used in sync flow |

### Components
| File | Purpose |
|------|---------|
| `src/components/carrier-resources/CarrierPlansTab.tsx` | CMS plan search by county/ZIP with compare feature (used by CarrierPlansPage) |
| `src/components/admin/CarrierStatusPanel.tsx` | Admin carrier appointment status panel |
| `src/components/book/CarrierBreakdown.tsx` | BOB carrier breakdown chart |
| `src/components/book/CarrierFilterDropdown.tsx` | BOB carrier filter dropdown |
| `src/components/book/IncomeByCarrier.tsx` | BOB income by carrier chart |

### Pages
| File | Purpose |
|------|---------|
| `src/pages/CarrierResourcesPage.tsx` | Main carrier resources (this page) |
| `src/pages/CarrierPortalsPage.tsx` | Quick portal links grid |
| `src/pages/CarrierPlansPage.tsx` | Plan finder wrapper |
| `src/pages/admin/modals/CarrierRequestModal.tsx` | Admin carrier request modal |

---

## Data Flow

```
DB tables: carriers, carrier_contacts, carrier_links, carrier_documents
    │
    ▼
useCarrierDirectory('KY') ──► fetches + joins all 4 tables
    │                          (filtered to 6 active carriers)
    ▼
useAgentCarriers() ──► queries agent_certifications for current user
    │                   maps RTS names → carrier codes
    ▼
CarrierResourcesPage ──► filters carriers to only certified ones
    │                      renders pills, contacts, links, docs
    ▼
CARRIER_BRAND_COLORS ──► pill + avatar accent colors
GH tokens ──► text colors, glass styles, hover states
```

## Notes

- `carriersData.ts` (legacy static) and `useCarrierDirectory` (DB-driven) are **parallel data sources** — the resources page uses DB, the portals page also uses DB, but carriersData.ts still exists with rich KY-specific plan/SOB data
- CarrierPlansTab exists but is NOT imported by CarrierResourcesPage — it's a separate route
- Only KY data is populated in both static and DB sources; other states are scaffolded empty
