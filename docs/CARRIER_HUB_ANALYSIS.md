# Carrier Hub Analysis

**Analysis Date:** January 17, 2026
**Feature:** Carrier Resources (`/carrier-resources`)
**Analyst:** Claude Code

---

## Executive Summary

The Carrier Resources feature is **substantially complete and well-designed**. It provides comprehensive carrier information for Kentucky with state-specific contacts, portal links, downloads, and detailed plan documents (SOB, EOC, ANOC, Formulary). The UI is clean and follows the platform's design language. Main gaps are data population for non-Kentucky states and lack of admin editing capability.

**Readiness Score: 7/10** - Ready for Kentucky launch, needs data for other states.

---

## 1. ALL RELATED FILES

### Pages
| File | Description |
|------|-------------|
| `src/pages/CarrierResourcesPage.tsx` | Main carrier hub - state selector + carrier grid + contact/link/download details |
| `src/pages/CarrierPortalsPage.tsx` | Quick-access grid of carrier broker portal login links |
| `src/pages/CarrierPlansPage.tsx` | Plan documents (SOB, EOC, ANOC, Formulary) organized by carrier/state/plan type |

### Data
| File | Description |
|------|-------------|
| `src/data/carriersData.ts` | **897-line** static data file with 6 carriers (Aetna, Anthem, Devoted, Humana, UHC, Wellcare), Kentucky data complete, other states scaffolded |

### Admin Components
| File | Description |
|------|-------------|
| `src/components/admin/CarrierManagement.tsx` | Placeholder card - not functional |
| `src/components/admin/CarrierStatusPanel.tsx` | Per-agent carrier contracting status (different feature) |
| `src/components/admin/StateDefaultsManagement.tsx` | Placeholder card - not functional |

### Database Tables
| Table | Description |
|-------|-------------|
| `carriers` | Master carrier list (code, name, display_name, is_active, product_tags, state_availability) |
| `carrier_statuses` | Per-agent contracting status per carrier |
| `state_carriers` | State-specific carrier availability and defaults |

### Migrations
| File | Description |
|------|-------------|
| `20260115000003_add_bcbs_carrier.sql` | Added BCBS carrier |
| `20260115000004_seed_carriers.sql` | Seed 10 carriers (aetna, anthem, cigna, devoted, essence, humana, molina, uhc, wellcare, bcbs) |
| `20260115000005_fix_carriers_rls.sql` | RLS policy fixes |
| `20260115000006_fix_carrier_statuses_constraint.sql` | Foreign key fixes |
| `20260115000009_add_carrier_rts_aliases.sql` | RTS name matching aliases |

---

## 2. MAIN PAGE ANALYSIS

### CarrierResourcesPage.tsx Structure

```
┌─────────────────────────────────────────────────────┐
│  State Selector (dropdown: KY, TN, OH, IN, WV, GA, VA)  │
├─────────────────────────────────────────────────────┤
│  Carrier Selection Grid (6 carriers with logos)     │
│  [Aetna] [Anthem] [Devoted] [Humana] [UHC] [Wellcare]│
├─────────────────────────────────────────────────────┤
│  Selected Carrier Details                           │
│  ┌─────────────┬───────────────┬───────────────┐   │
│  │ Contacts    │ Quick Links   │ Downloads     │   │
│  │ - Name/Role │ - Portal URL  │ - PDF docs    │   │
│  │ - Phone     │ - External    │ - Training    │   │
│  │ - Email     │   links       │   materials   │   │
│  └─────────────┴───────────────┴───────────────┘   │
│                                                     │
│  [View Plan Documents] → CarrierPlansPage          │
└─────────────────────────────────────────────────────┘
```

### Data Source
- **Static file**: `src/data/carriersData.ts`
- **NOT** from database `carriers` table
- Database carriers are used for contracting (different purpose)

### User Interactions
1. Select state from dropdown (filters data)
2. Click carrier logo to view details
3. Click phone/email links (native tel:/mailto:)
4. Click external links (opens new tab)
5. Click "View Plan Documents" button (navigates to CarrierPlansPage)

---

## 3. DATABASE SCHEMA

### `carriers` Table
```sql
CREATE TABLE carriers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  display_name TEXT,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  product_tags TEXT[],
  requires_corporate_resolution BOOLEAN DEFAULT false,
  requires_non_resident_states BOOLEAN DEFAULT false,
  rts_aliases TEXT[],
  state_availability TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Current Carriers in DB:** aetna, anthem, cigna, devoted, essence, humana, molina, uhc, wellcare, bcbs

### `state_carriers` Table
```sql
CREATE TABLE state_carriers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_code TEXT NOT NULL,
  carrier_id UUID REFERENCES carriers(id),
  is_available BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Data Architecture Issue
**The Carrier Resources UI does NOT use the database tables.** It uses a static TypeScript file (`carriersData.ts`). This is a design decision trade-off:

| Approach | Pros | Cons |
|----------|------|------|
| Static file (current) | Fast, no API calls, works offline | Requires code deploy to update |
| Database | Admin can edit, dynamic | More complex, requires admin UI |

**Recommendation:** Keep static file for MVP. Build admin editing in Phase 2.

---

## 4. CURRENT FEATURE INVENTORY

### Carrier Information
| Feature | Status | Notes |
|---------|--------|-------|
| Carrier name | ✅ Built | Via carriersData.ts |
| Carrier logo | ✅ Built | PNG/JPG assets in /assets |
| Carrier contact info (phone, email) | ✅ Built | State-specific contacts |
| Carrier portal login URL | ✅ Built | In "Quick Links" section |
| Carrier-specific notes | ✅ Built | Via downloads section |

### Tools & Links
| Feature | Status | Notes |
|---------|--------|-------|
| Quoting tool links | ❌ Not present | Could add to links array |
| CRM link | ❌ Not present | Not carrier-specific |
| Plan documents / SBCs | ✅ Built | Extensive - SOB, EOC, ANOC per plan |
| Formulary lookup links | ✅ Built | Formulary PDFs + search links |
| Provider directory links | ✅ Built | "Find a Provider" links |

### Organization
| Feature | Status | Notes |
|---------|--------|-------|
| Organized by carrier | ✅ Built | Carrier grid with logos |
| Organized by state | ✅ Built | State dropdown filters data |
| Search/filter functionality | ❌ Not present | No search within carriers |
| Favorites or quick access | ❌ Not present | No personalization |

### Data Management
| Feature | Status | Notes |
|---------|--------|-------|
| Admin can add/edit carrier info | 🚧 Scaffolded | CarrierManagement.tsx is placeholder |
| Carrier data is state-aware | ✅ Built | stateData object per carrier |
| Documents can be uploaded | ❌ Not present | PDFs are static in /public/downloads |
| Links can be updated | ❌ Not present | Requires code change |

---

## 5. UI/UX ASSESSMENT

### Agent Experience

**Landing on `/carrier-resources`:**
1. Sees state dropdown (defaults to Kentucky)
2. Sees 6 carrier logos in a clean grid (3 cols mobile, 6 cols desktop)
3. First carrier (Aetna) is selected by default
4. Sees 3-column layout: Contacts | Quick Links | Downloads
5. Gold "View Plan Documents" button at bottom

### Visual Design
- ✅ Clean, minimal layout
- ✅ Consistent with platform design (gold accents, cream backgrounds)
- ✅ Carrier logos are prominent
- ✅ Typography is readable
- ✅ Hover states on buttons and links
- ✅ Mobile-responsive grid (3 cols → 6 cols)

### Usability
| Aspect | Rating | Notes |
|--------|--------|-------|
| Findability | Good | Clear navigation, carrier logos |
| Scanability | Good | 3-column layout, clear headers |
| Action clarity | Good | Clear CTAs for phone/email/links |
| Mobile experience | Good | Responsive grid, readable text |
| Load performance | Excellent | Static data, no API calls |

### Areas for Improvement
1. **No search** - Can't search for specific carrier or plan
2. **No favorites** - Can't save frequently used carriers
3. **State data incomplete** - Shows "not available" for non-KY states
4. **Downloads go to 404** - Some PDF links may not have files uploaded

---

## 6. GAP ANALYSIS

### Must Have (MVP)
| Feature | Status | Priority |
|---------|--------|----------|
| Quick access to carrier portal logins | ✅ Complete | - |
| Quoting tool links (Sunfire, Connecture) | ❌ Missing | **HIGH** |
| Basic carrier contact info | ✅ Complete | - |
| Plan documents (SOB, EOC) | ✅ Complete | - |

### Nice to Have (Phase 2)
| Feature | Status | Priority |
|---------|--------|----------|
| Search across carriers | ❌ Missing | Medium |
| Admin editing capability | 🚧 Placeholder | Medium |
| Favorites/bookmarks | ❌ Missing | Low |
| Certification status integration | ❌ Missing | Medium |
| Data for all 7 states | 🔄 Partial | High |

### Future (Phase 3+)
| Feature | Status | Priority |
|---------|--------|----------|
| AI-powered plan search | ❌ Future | Low |
| Integrated quoting | ❌ Future | Low |
| Plan comparison tool | ❌ Future | Low |

---

## 7. RECOMMENDED ACTIONS

### Polish (Cosmetic, <1 hour each)

1. **Add Sunfire/Connecture quoting links** - Add to Quick Links section
   ```typescript
   { name: "Sunfire Quoting", url: "https://www.sunfirequoting.com" }
   { name: "Connecture", url: "https://www.connecture.com" }
   ```

2. **Add "Coming Soon" state for empty states** - Currently shows generic message

3. **Add page title** - CarrierResourcesPage doesn't have a header like CarrierPortalsPage

4. **Make carrier selection sticky** - Keep selected carrier when changing states

### Fix (Functional Issues, 1-4 hours each)

1. **Verify all PDF download links** - Check that files exist in `/public/downloads/`
   - Estimated: 2 hours to audit all links

2. **Add missing carrier: Cigna, Molina, Essence, BCBS** - Data file has 6, DB has 10
   - Estimated: 4 hours per carrier for full data

### Add (Missing Features, estimate effort)

1. **Quoting tool links section** - 1 hour
   - Add separate "Quoting Tools" section with Sunfire, Connecture links

2. **Data for Nevada (9 carriers)** - 8-12 hours
   - Research contacts, portal links, plan documents
   - Add to carriersData.ts

3. **Search functionality** - 4 hours
   - Filter carriers by name
   - Filter plans by name

4. **Admin editing UI** - 8-16 hours
   - Build CarrierManagement component
   - Move data to database
   - Add CRUD operations

### Skip (Defer to Later)

1. **Favorites/bookmarks** - Requires user preferences storage
2. **AI-powered search** - Over-engineering for MVP
3. **Integrated quoting** - Complex API integration
4. **Plan comparison tool** - Separate feature

---

## 8. NEVADA DATA POPULATION

For Nevada specifically (assuming 9 carriers), here's what would need to be manually entered:

### Data Template Per Carrier

```
Carrier: [Carrier Name]
State: Nevada
────────────────────────────────────────

CONTACTS
- [ ] Primary contact name/title
- [ ] Primary contact phone
- [ ] Primary contact email
- [ ] Regional contact (if different)
- [ ] Broker services phone
- [ ] Broker services email

QUICK LINKS
- [ ] Broker Portal URL
- [ ] Agent Portal URL
- [ ] Provider Search URL
- [ ] Drug Search/Formulary URL
- [ ] Certification URL
- [ ] Kit/Materials Ordering URL

DOWNLOADS
- [ ] Market-specific training PDF
- [ ] Product guide PDF
- [ ] Sales presentation PDF
- [ ] Non-commissionable plans list

PLAN DOCUMENTS (per plan)
- [ ] Plan name
- [ ] Plan ID (H####-###)
- [ ] SOB PDF
- [ ] EOC PDF
- [ ] ANOC PDF
- [ ] Formulary PDF
- [ ] Plan highlights/labels
```

### Nevada Carrier Checklist (Estimated)

| Carrier | Portal | Contacts | Links | Plans | Effort |
|---------|:------:|:--------:|:-----:|:-----:|--------|
| Aetna | [ ] | [ ] | [ ] | [ ] | 2 hrs |
| Anthem | [ ] | [ ] | [ ] | [ ] | 2 hrs |
| Cigna | [ ] | [ ] | [ ] | [ ] | 2 hrs |
| Devoted | [ ] | [ ] | [ ] | [ ] | 1 hr |
| Humana | [ ] | [ ] | [ ] | [ ] | 2 hrs |
| UnitedHealthcare | [ ] | [ ] | [ ] | [ ] | 2 hrs |
| Wellcare | [ ] | [ ] | [ ] | [ ] | 2 hrs |
| Molina | [ ] | [ ] | [ ] | [ ] | 1.5 hrs |
| BCBS | [ ] | [ ] | [ ] | [ ] | 1.5 hrs |

**Total Estimated Effort:** 16-20 hours for Nevada data population

### Data Sources
- Carrier broker portals (for contacts)
- Medicare Plan Finder (for plan IDs)
- Carrier certification portals (for documents)
- State DOI (for plan filings)

---

## Summary

### Overall Assessment: 7/10

| Dimension | Score | Notes |
|-----------|-------|-------|
| Code Quality | 8/10 | Clean, well-structured components |
| UI/UX | 8/10 | Follows design system, clear layout |
| Data Completeness (KY) | 9/10 | Comprehensive for Kentucky |
| Data Completeness (Other) | 2/10 | Empty for 6 other states |
| Admin Capability | 1/10 | Placeholder only |
| Agent Utility | 7/10 | Missing quoting tools |

### Estimated Time to MVP-Ready

| Task | Hours |
|------|-------|
| Add quoting tool links | 1 |
| Verify existing PDFs | 2 |
| Add page header/title | 0.5 |
| Fix sticky carrier selection | 1 |
| **Total (KY-only MVP)** | **4.5 hours** |

For Nevada expansion: +16-20 additional hours

### Top 3 Priorities

1. **Add quoting tool links** (Sunfire, Connecture) - Agents need this daily
2. **Verify all PDF links work** - Broken links hurt credibility
3. **Add Nevada data** - If expanding to NV market

### Blockers / Concerns

1. **PDF storage** - Need to ensure all referenced PDFs exist in `/public/downloads/`
2. **Data maintenance** - Static file requires code deploys to update
3. **Carrier additions** - carriersData.ts only has 6 carriers, DB has 10 (Cigna, Molina, Essence, BCBS missing from UI)

---

## Appendix: File Reference

```
Carrier Hub Feature Files
├── src/pages/
│   ├── CarrierResourcesPage.tsx    ← Main hub page
│   ├── CarrierPortalsPage.tsx      ← Portal quick access
│   └── CarrierPlansPage.tsx        ← Plan documents
│
├── src/data/
│   └── carriersData.ts             ← Static carrier data (897 lines)
│
├── src/assets/
│   ├── aetna-logo.png
│   ├── anthem-logo.jpg
│   ├── devoted-logo.png
│   ├── humana-logo.png
│   ├── uhc-logo.png
│   └── wellcare-logo.jpg
│
├── src/components/admin/
│   ├── CarrierManagement.tsx       ← Placeholder
│   └── StateDefaultsManagement.tsx ← Placeholder
│
└── public/downloads/
    └── [Various PDF documents]     ← ~100+ PDFs referenced
```
