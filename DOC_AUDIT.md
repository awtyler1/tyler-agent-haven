# Documentation Audit Report

**Date:** 2026-02-11
**Scope:** Every non-code documentation file in the project
**Purpose:** Pre-HOMESTEAD.md cleanup — identify stale, redundant, and bloated docs before introducing new design system

---

## A. File Tree

```
tyler-agent-haven/
├── CLAUDE.md                                          196 lines   CONTEXT
├── DESIGN_SYSTEM.md                                   338 lines   DESIGN
├── README.md                                           62 lines   SETUP
├── PLATFORM_ANALYSIS.md                               402 lines   SPRINT
├── BOB_COMMAND_CENTER_ANALYSIS.md                     724 lines   API
├── UX_AUDIT_EXPORT.md                               1,646 lines   DESIGN
│
└── docs/
    ├── ADMIN_DASHBOARD_REVAMP_AUDIT.md                419 lines   DESIGN
    ├── ADMIN_DESIGN_AUDIT.md                          228 lines   DESIGN
    ├── ADMIN_LOGIN_ONBOARDING_AUDIT.md                319 lines   SPRINT
    ├── ADMIN_STYLE_GUIDE.md                           411 lines   DESIGN
    ├── ADMIN_UX_AUDIT.md                              293 lines   SPRINT
    ├── AGENT_IMPORT_CURRENT_STATE.md                  173 lines   API
    ├── AGENT_IMPORT_PLANNING.md                       268 lines   SPRINT
    ├── AGENT_PROFILE_AUDIT.md                         342 lines   SPRINT
    ├── AGENT_PROFILE_DESIGN_CONTEXT.md              1,013 lines   DESIGN
    ├── AGENT_PROFILE_PAGE_DISCOVERY.md                521 lines   ARCHITECTURE
    ├── AGENT_PROFILE_REDESIGN_PRIORITIES.md           164 lines   SPRINT
    ├── AGENTS_PAGE_REDESIGN.md                        604 lines   SPRINT
    ├── ALL_AGENTS_REVAMP_AUDIT.md                     313 lines   DESIGN
    ├── ARCHITECTURE.md                              1,116 lines   CONTEXT
    ├── ARCHITECTURE_REVIEW.md                         330 lines   CODE_QUALITY
    ├── BRANDING_WORKFLOW_AUDIT.md                     419 lines   SPRINT
    ├── CARRIER_CONTRACTING_SCHEMA_SUMMARY.md          310 lines   DESIGN
    ├── CARRIER_HUB_ANALYSIS.md                        426 lines   SPRINT
    ├── CARRIER_RESOURCES_CONTEXT.md                   488 lines   CONTEXT
    ├── CARRIER_RESOURCES_REBUILD_ANALYSIS.md          682 lines   SPRINT
    ├── CMS_INTEGRATION_STRATEGY.md                    570 lines   DESIGN
    ├── CMS_LANDSCAPE_DATA_MAPPING.md                  419 lines   DESIGN
    ├── CMS_PBP_DATA_MAPPING.md                        430 lines   DESIGN
    ├── CODE_QUALITY_REVIEW.md                         416 lines   CODE_QUALITY
    ├── CODEBASE_SUMMARY.md                            232 lines   CONTEXT
    ├── component-context-reference.md                 285 lines   CONTEXT
    ├── DASHBOARD_ANALYSIS.md                          856 lines   DESIGN
    ├── DASHBOARD_CONTENT_INVENTORY.md                 914 lines   SPRINT
    ├── DASHBOARD_LOADING_AUDIT.md                     222 lines   SPRINT
    ├── DASHBOARD_RESPONSIVE_AUDIT.md                  356 lines   SPRINT
    ├── DESIGN_AUDIT.md                                353 lines   DESIGN
    ├── DEVELOPER_ONBOARDING.md                        584 lines   SETUP
    ├── document-storage-analysis.md                   308 lines   CONTEXT
    ├── GOLDEN_HOUR_MIGRATION_AUDIT.md                 843 lines   DESIGN
    ├── GROWTH_PLAN_V8_ANALYSIS.md                     380 lines   SPRINT
    ├── GROWTH_PLAN_V8_VISUAL_AUDIT.md                 639 lines   SPRINT
    ├── INDEX.md                                       102 lines   OTHER
    ├── LEADS_FEATURE_CONTEXT.md                       308 lines   CONTEXT
    ├── manager-assignment-reference.md                415 lines   CONTEXT
    ├── MEDICARE_PLAN_FINDER_INTEGRATION.md            566 lines   DESIGN
    ├── MEMORY_CLEANUP_REPORT.md                       146 lines   CHANGELOG
    ├── MVP_SPRINT_ANALYSIS.md                         379 lines   SPRINT
    ├── MVP_STATUS_REPORT.md                           426 lines   SPRINT
    ├── NAVIGATION_ANALYSIS.md                       1,270 lines   DESIGN
    ├── PDF_GENERATOR_CONTEXT.md                       343 lines   API
    ├── PLAN_FINDER_UI_AUDIT.md                        670 lines   DESIGN
    ├── PLATFORM_ANALYSIS.md                           533 lines   CONTEXT
    ├── PLATFORM_AUDIT.md                              461 lines   CONTEXT
    ├── rts-import-flow-analysis.md                    241 lines   CONTEXT
    ├── SPRINT_CONTEXT.md                            2,169 lines   OTHER
    ├── STATE_PERSISTENCE_AUDIT.md                     126 lines   SPRINT
    ├── SYNC_INVESTIGATION.md                          374 lines   SPRINT
    ├── teams-page-redesign-reference.md               811 lines   CONTEXT
    ├── UX_AUDIT.md                                    380 lines   DESIGN
    ├── UX_AUDIT_COMPREHENSIVE.md                    1,074 lines   DESIGN
    ├── UX_DESIGN_AUDIT.md                             976 lines   DESIGN
    ├── ux-audit-admin-dashboard-2026-01-19.md         311 lines   DESIGN
    ├── ux-audit-agent-profile-page-2026-01-19.md      294 lines   DESIGN
    └── WEEK1_SENTRY_GUIDE.md                          131 lines   SETUP
```

**Totals:** 64 files | ~31,500 lines | 58 in `docs/` + 6 at root

---

## B. Audit Table

### Root-Level Files

| # | Path | Lines | Category | Stale | Verdict | Rationale |
|---|------|------:|----------|:-----:|---------|-----------|
| 1 | `CLAUDE.md` | 196 | CONTEXT | 2/5 | **KEEP + TRIM** | Primary project context. BOB status inaccurate (says "working" but agent UI doesn't exist), doc count wrong (says 26, actual 58+). Fix those lines. |
| 2 | `DESIGN_SYSTEM.md` | 338 | DESIGN | 3/5 | **ARCHIVE** | About to be superseded by HOMESTEAD.md. Core patterns still valid but duplicate. Move to `docs/archived/`. |
| 3 | `README.md` | 62 | SETUP | 1/5 | **KEEP** | Accurate, minimal, correct quick-start. No changes needed. |
| 4 | `PLATFORM_ANALYSIS.md` | 402 | SPRINT | 4/5 | **ARCHIVE** | Time-stamped Feb 9 analysis with prescriptive 90-day roadmap that will drift. Duplicates CLAUDE.md feature inventory. Move to `docs/archived/`. |
| 5 | `BOB_COMMAND_CENTER_ANALYSIS.md` | 724 | API | 3/5 | **KEEP** | Active technical spec for BOB feature. Keep until BOB ships, then archive. |
| 6 | `UX_AUDIT_EXPORT.md` | 1,646 | DESIGN | 5/5 | **DELETE** | Auto-generated export, 80% duplicates DESIGN_SYSTEM.md verbatim. Created for external review — purpose served. |

### docs/ — Admin & Agent Files

| # | Path | Lines | Category | Stale | Verdict | Rationale |
|---|------|------:|----------|:-----:|---------|-----------|
| 7 | `ADMIN_DASHBOARD_REVAMP_AUDIT.md` | 419 | DESIGN | 2/5 | **MERGE** | → Combine with #8 and #10 into `ADMIN_PAGES_AUDIT.md` |
| 8 | `ADMIN_DESIGN_AUDIT.md` | 228 | DESIGN | 2/5 | **MERGE** | → Into `ADMIN_PAGES_AUDIT.md` |
| 9 | `ADMIN_LOGIN_ONBOARDING_AUDIT.md` | 319 | SPRINT | 2/5 | **KEEP** | Unique content covering auth flows, email copy, onboarding. Still actionable. |
| 10 | `ADMIN_STYLE_GUIDE.md` | 411 | DESIGN | 3/5 | **MERGE** | → Trim to ~50-line quick-ref, rest into `ADMIN_PAGES_AUDIT.md`. Shadow guidance contradicts later work. |
| 11 | `ADMIN_UX_AUDIT.md` | 293 | SPRINT | 4/5 | **DELETE** | Superseded by Feb 4-5 audits. References pre-refactor AgentProfilePage (1700→460 lines). |
| 12 | `AGENT_IMPORT_CURRENT_STATE.md` | 173 | API | 4/5 | **MERGE** | → Combine with #13 into `AGENT_IMPORT.md` |
| 13 | `AGENT_IMPORT_PLANNING.md` | 268 | SPRINT | 4/5 | **MERGE** | → Into `AGENT_IMPORT.md`. Schema section partially duplicated between the two. |
| 14 | `AGENT_PROFILE_AUDIT.md` | 342 | SPRINT | 1/5 | **KEEP** | Golden source for post-refactor AgentProfilePage status. Absorb useful bits from #16. |
| 15 | `AGENT_PROFILE_DESIGN_CONTEXT.md` | 1,013 | DESIGN | 1/5 | **DELETE** | 60% redundant with DESIGN_SYSTEM.md. 1,013 lines of design tokens already published elsewhere. |
| 16 | `AGENT_PROFILE_PAGE_DISCOVERY.md` | 521 | ARCHITECTURE | 2/5 | **MERGE** | → Unique data model info into `AGENT_PROFILE_AUDIT.md`, then delete source. |
| 17 | `AGENT_PROFILE_REDESIGN_PRIORITIES.md` | 164 | SPRINT | 3/5 | **DELETE** | Plan doc — plan was executed. AGENT_PROFILE_AUDIT.md confirms completion. |
| 18 | `AGENTS_PAGE_REDESIGN.md` | 604 | SPRINT | 4/5 | **MERGE** | → Combine with #19 into `AGENTS_PAGE_REDESIGN.md` (replace in-place). |
| 19 | `ALL_AGENTS_REVAMP_AUDIT.md` | 313 | DESIGN | 1/5 | **MERGE** | → Into consolidated `AGENTS_PAGE_REDESIGN.md`. Recent Feb 5 visual audit. |

### docs/ — Architecture & Carrier Files

| # | Path | Lines | Category | Stale | Verdict | Rationale |
|---|------|------:|----------|:-----:|---------|-----------|
| 20 | `ARCHITECTURE.md` | 1,116 | CONTEXT | 2/5 | **KEEP** | Primary architecture reference. Absorb content from #21, #30, #31, #24. |
| 21 | `ARCHITECTURE_REVIEW.md` | 330 | CODE_QUALITY | 3/5 | **MERGE** | → Health scorecard + tech debt into `ARCHITECTURE.md` appendix. 70% overlap. |
| 22 | `BRANDING_WORKFLOW_AUDIT.md` | 419 | SPRINT | 2/5 | **KEEP** | Actionable white-label migration checklist. No duplication. Required for rebranding. |
| 23 | `CARRIER_CONTRACTING_SCHEMA_SUMMARY.md` | 310 | DESIGN | 3/5 | **MERGE** | → Schema docs into `ARCHITECTURE.md` data section. |
| 24 | `CARRIER_HUB_ANALYSIS.md` | 426 | SPRINT | 4/5 | **DELETE** | Pre-dates CMS pivot (Jan 19). Describes static-file architecture that no longer exists. Misleading. |
| 25 | `CARRIER_RESOURCES_CONTEXT.md` | 488 | CONTEXT | 3/5 | **TRIM** | Keep DB schema + key files only (~150 lines). Remove outdated component descriptions and design tokens. |
| 26 | `CARRIER_RESOURCES_REBUILD_ANALYSIS.md` | 682 | SPRINT | 2/5 | **KEEP** | Active implementation guide for CMS plans integration. Detailed wireframes and phase checklist. |
| 27 | `CMS_INTEGRATION_STRATEGY.md` | 570 | DESIGN | 1/5 | **KEEP** | Strategic roadmap for CMS data. Competitive analysis, unique value props, multi-phase plan. |
| 28 | `CMS_LANDSCAPE_DATA_MAPPING.md` | 419 | DESIGN | 1/5 | **KEEP** | Technical column-mapping reference for Landscape CSV import. Required for CMS pipeline. |
| 29 | `CMS_PBP_DATA_MAPPING.md` | 430 | DESIGN | 1/5 | **KEEP** | Technical column-mapping for PBP benefit files. Required for CMS pipeline. |
| 30 | `CODE_QUALITY_REVIEW.md` | 416 | CODE_QUALITY | 2/5 | **MERGE** | → ESLint metrics, bundle size, security findings into `ARCHITECTURE.md` appendix. |
| 31 | `CODEBASE_SUMMARY.md` | 232 | CONTEXT | 2/5 | **MERGE** | → Tech stack, routes, tables all duplicate ARCHITECTURE.md. Keep "Known Issues" only. |

### docs/ — Dashboard & UX Files

| # | Path | Lines | Category | Stale | Verdict | Rationale |
|---|------|------:|----------|:-----:|---------|-----------|
| 32 | `component-context-reference.md` | 285 | CONTEXT | 1/5 | **KEEP** | Useful reference for document viewer, carrier status, contracting hub patterns. |
| 33 | `DASHBOARD_ANALYSIS.md` | 856 | DESIGN | 1/5 | **MERGE** | → UX philosophy + 3 redesign options into `DASHBOARD_AUDIT.md`. Heavily overlaps #34 and #36. |
| 34 | `DASHBOARD_CONTENT_INVENTORY.md` | 914 | SPRINT | 1/5 | **MERGE** | → Element-by-element breakdown into `DASHBOARD_AUDIT.md`. |
| 35 | `DASHBOARD_LOADING_AUDIT.md` | 222 | SPRINT | 1/5 | **KEEP** | Documents specific perf bug (tab-switch refetch) + fixes applied. Unique scope. |
| 36 | `DASHBOARD_RESPONSIVE_AUDIT.md` | 356 | SPRINT | 1/5 | **MERGE** | → P0 flyout bug + breakpoint gaps into `DASHBOARD_AUDIT.md`. |
| 37 | `DESIGN_AUDIT.md` | 353 | DESIGN | 1/5 | **KEEP** | Core design token reference (typography, colors, shadows, buttons, cards, dark mode). |
| 38 | `DEVELOPER_ONBOARDING.md` | 584 | SETUP | 1/5 | **KEEP** | High-quality new-developer guide. Setup, workflow, codebase tour. No overlap. |
| 39 | `document-storage-analysis.md` | 308 | CONTEXT | 1/5 | **KEEP** | Storage buckets, RLS policies, JSONB metadata, PDF generation flow. Unique. |
| 40 | `GOLDEN_HOUR_MIGRATION_AUDIT.md` | 843 | DESIGN | 1/5 | **TRIM** | Design tokens repeated across 3 areas internally. Deduplicate, target ~400 lines. |
| 41 | `GROWTH_PLAN_V8_ANALYSIS.md` | 380 | SPRINT | 1/5 | **MERGE** | → Logic/math validation into `GROWTH_PLAN_V8_AUDIT.md`. |
| 42 | `GROWTH_PLAN_V8_VISUAL_AUDIT.md` | 639 | SPRINT | 1/5 | **MERGE** | → Visual design audit into `GROWTH_PLAN_V8_AUDIT.md`. Both analyze same edge function. |
| 43 | `INDEX.md` | 102 | OTHER | 3/5 | **DELETE** | Missing 7+ docs added after Jan 26. CLAUDE.md serves as real source of truth. |
| 44 | `LEADS_FEATURE_CONTEXT.md` | 308 | CONTEXT | 1/5 | **KEEP** | Architecture snapshot for planned Leads feature. DB schema, edge functions. |

### docs/ — Remaining Files

| # | Path | Lines | Category | Stale | Verdict | Rationale |
|---|------|------:|----------|:-----:|---------|-----------|
| 45 | `manager-assignment-reference.md` | 415 | CONTEXT | 2/5 | **KEEP** | Implementation reference for hierarchy modal, bulk assign. Stable feature. |
| 46 | `MEDICARE_PLAN_FINDER_INTEGRATION.md` | 566 | DESIGN | 1/5 | **KEEP** | Complete integration guide: routing, design tokens, Supabase patterns. Accurate. |
| 47 | `MEMORY_CLEANUP_REPORT.md` | 146 | CHANGELOG | 2/5 | **ARCHIVE** | Session log explaining TIG_PLATFORM_CONTEXT.md archival. Historical only. |
| 48 | `MVP_SPRINT_ANALYSIS.md` | 379 | SPRINT | 2/5 | **KEEP** | Most recent sprint doc. 4 actionable items with specific file:line references. |
| 49 | `MVP_STATUS_REPORT.md` | 426 | SPRINT | 4/5 | **DELETE** | Friday deadline passed 9 days ago. Fully superseded by MVP_SPRINT_ANALYSIS.md. |
| 50 | `NAVIGATION_ANALYSIS.md` | 1,270 | DESIGN | 1/5 | **KEEP** | Exhaustive 32-route inventory, role matrix, touch targets, 3 restructuring proposals. |
| 51 | `PDF_GENERATOR_CONTEXT.md` | 343 | API | 1/5 | **KEEP** | pdf-lib patterns, brand colors in RGB, edge function CORS/auth. Specific reference. |
| 52 | `PLAN_FINDER_UI_AUDIT.md` | 670 | DESIGN | 1/5 | **KEEP** | Component architecture, state variables, user flow for Plan Finder. Complete. |
| 53 | `PLATFORM_ANALYSIS.md` | 533 | CONTEXT | 2/5 | **KEEP** | 7-part analysis: feature inventory, value assessment, gap analysis, roadmap. |
| 54 | `PLATFORM_AUDIT.md` | 461 | CONTEXT | 4/5 | **DELETE** | Route inventory and tables entirely superseded by PLATFORM_ANALYSIS.md (6 days later, same scope plus more). |
| 55 | `rts-import-flow-analysis.md` | 241 | CONTEXT | 1/5 | **KEEP** | RTS certification import flow. Stable feature, no duplication. |
| 56 | `SPRINT_CONTEXT.md` | 2,169 | OTHER | 5/5 | **DELETE** | Misnamed. Lines 83-2169 are raw copy of PlanFinderPage.tsx source code. Biggest bloat in docs/. |
| 57 | `STATE_PERSISTENCE_AUDIT.md` | 126 | SPRINT | 3/5 | **ARCHIVE** | Checklist for useSearchParams implementation. Work appears completed. |
| 58 | `SYNC_INVESTIGATION.md` | 374 | SPRINT | 1/5 | **KEEP** | Root cause analysis for missing queryClient.invalidateQueries(). Actionable. |
| 59 | `teams-page-redesign-reference.md` | 811 | CONTEXT | 2/5 | **KEEP** | Full source of TeamsTab.tsx and TeamDetailPage.tsx. Feature reference. |
| 60 | `UX_AUDIT.md` | 380 | DESIGN | 3/5 | **DELETE** | Same findings as UX_DESIGN_AUDIT.md but less thorough. Fully superseded. |
| 61 | `UX_AUDIT_COMPREHENSIVE.md` | 1,074 | DESIGN | 3/5 | **MERGE** | → Unique findings (Phase 2 principles scores) into `UX_DESIGN_AUDIT.md`, then delete. |
| 62 | `UX_DESIGN_AUDIT.md` | 976 | DESIGN | 1/5 | **KEEP** | Winner of the 3-way UX audit. Apple + Robinhood lens, most recent, most actionable. |
| 63 | `ux-audit-admin-dashboard-2026-01-19.md` | 311 | DESIGN | 4/5 | **ARCHIVE** | Point-in-time admin dashboard critique. Findings folded into later audits. |
| 64 | `ux-audit-agent-profile-page-2026-01-19.md` | 294 | DESIGN | 4/5 | **ARCHIVE** | Point-in-time agent profile audit (2200-line monolith). Page since refactored. |
| — | `WEEK1_SENTRY_GUIDE.md` | 131 | SETUP | 4/5 | **DELETE** | Generic Sentry tutorial. Sentry is already integrated. No codebase-specific value. |

---

## Verdict Summary

| Action | Files | Lines | % of Total |
|--------|------:|------:|-----------:|
| **KEEP** | 27 | 13,827 | 43.9% |
| **KEEP + TRIM** | 3 | 1,527 → ~750 | — |
| **MERGE** (source files removed after) | 18 | 8,518 → ~2,500 | — |
| **DELETE** | 11 | 7,211 | 22.9% |
| **ARCHIVE** | 6 | 1,617 | 5.1% |
| | | | |
| **Current total** | **64** | **~31,500** | |
| **After cleanup** | **~33** | **~17,100** | **46% reduction** |

---

## C. Redundancy Clusters

### Cluster 1 — UX Audits (6 files, 4,681 lines)
The worst offender. Six separate attempts at auditing the same UI, each overlapping 60-80%.

```
ux-audit-admin-dashboard-2026-01-19.md  (311)  ─┐
ux-audit-agent-profile-page-2026-01-19.md (294) ─┤ Jan 19-20: point-in-time snapshots
UX_AUDIT_COMPREHENSIVE.md             (1,074)  ─┤ Jan 26: 7.2/10 score, Apple/Google lens
UX_AUDIT.md                              (380)  ─┤ Feb 4: lightweight duplicate
UX_DESIGN_AUDIT.md                       (976)  ─┘ Feb 2: WINNER — most thorough, most recent
UX_AUDIT_EXPORT.md (root)             (1,646)    Feb 11: auto-generated export (purpose served)
```

**Resolution:** Keep `UX_DESIGN_AUDIT.md` only. Merge unique Phase 2 scores from `UX_AUDIT_COMPREHENSIVE.md`. Archive the two Jan 19 snapshots. Delete the rest.

### Cluster 2 — Dashboard Analysis (3 files, 2,126 lines)
Three docs analyzing the same `Index.tsx` page from different angles.

```
DASHBOARD_ANALYSIS.md           (856)  ─┐ UX philosophy, redesign options A/B/C
DASHBOARD_CONTENT_INVENTORY.md  (914)  ─┤ Element-by-element inventory, state machine
DASHBOARD_RESPONSIVE_AUDIT.md   (356)  ─┘ P0 flyout bug, breakpoint gaps
```

**Resolution:** Merge all three → `DASHBOARD_AUDIT.md` (~800 lines target).

### Cluster 3 — Architecture & Code Quality (4 files, 2,094 lines)
Tech stack, schema, route inventory, and quality metrics scattered across four docs.

```
ARCHITECTURE.md          (1,116)  ─── PRIMARY (keep)
ARCHITECTURE_REVIEW.md     (330)  ─┐
CODE_QUALITY_REVIEW.md     (416)  ─┤ Health scorecard, ESLint, bundle, security
CODEBASE_SUMMARY.md        (232)  ─┘ Sprint summary — 90% duplicates ARCHITECTURE.md
```

**Resolution:** Absorb #2, #3, #4 into `ARCHITECTURE.md` as appendix sections. Delete sources.

### Cluster 4 — Admin Design (3 files, 1,058 lines)
Three overlapping visual audits of admin pages.

```
ADMIN_DASHBOARD_REVAMP_AUDIT.md  (419)  ─┐
ADMIN_DESIGN_AUDIT.md            (228)  ─┤ Same pages, same patterns, same findings
ADMIN_STYLE_GUIDE.md             (411)  ─┘ Shadow guidance now outdated
```

**Resolution:** Merge → `ADMIN_PAGES_AUDIT.md` (~400 lines target).

### Cluster 5 — Agent Profile (4 files, 2,040 lines)
Discovery → plan → execution → design context, but the execution doc makes the others obsolete.

```
AGENT_PROFILE_PAGE_DISCOVERY.md    (521)  ─┐ Discovery (data model still useful)
AGENT_PROFILE_REDESIGN_PRIORITIES.md(164) ─┤ Plan (executed, historical only)
AGENT_PROFILE_DESIGN_CONTEXT.md  (1,013)  ─┤ Design tokens (60% duplicates DESIGN_SYSTEM.md)
AGENT_PROFILE_AUDIT.md              (342) ─┘ WINNER — post-refactor status
```

**Resolution:** Keep `AGENT_PROFILE_AUDIT.md`. Absorb useful data model info from Discovery. Delete rest.

### Cluster 6 — Platform Inventories (3 files, 1,396 lines)

```
PLATFORM_AUDIT.md (docs/)         (461)  ─┐ Jan 22: route/table inventory
PLATFORM_ANALYSIS.md (docs/)      (533)  ─┤ Jan 28: same scope + gap analysis + roadmap (WINNER)
PLATFORM_ANALYSIS.md (root)       (402)  ─┘ Feb 9: 90-day roadmap (drift risk)
```

**Resolution:** Keep `docs/PLATFORM_ANALYSIS.md`. Delete `PLATFORM_AUDIT.md`. Archive root `PLATFORM_ANALYSIS.md`.

### Cluster 7 — Sprint Status (2 files, 805 lines)

```
MVP_STATUS_REPORT.md     (426)  ─┐ Feb 2: Friday deadline — deadline passed
MVP_SPRINT_ANALYSIS.md   (379)  ─┘ Feb 9: supersedes with updated priorities
```

**Resolution:** Keep `MVP_SPRINT_ANALYSIS.md`. Delete `MVP_STATUS_REPORT.md`.

### Cluster 8 — Growth Plan (2 files, 1,019 lines)

```
GROWTH_PLAN_V8_ANALYSIS.md     (380)  ─┐ Logic/math validation
GROWTH_PLAN_V8_VISUAL_AUDIT.md (639)  ─┘ Typography/spacing — same edge function
```

**Resolution:** Merge → `GROWTH_PLAN_V8_AUDIT.md` (~500 lines target).

### Cluster 9 — Agent Import (2 files, 441 lines)

```
AGENT_IMPORT_CURRENT_STATE.md  (173)  ─┐ Schema partially duplicated
AGENT_IMPORT_PLANNING.md       (268)  ─┘
```

**Resolution:** Merge → `AGENT_IMPORT.md` (~300 lines target).

### Cluster 10 — Agents Page (2 files, 917 lines)

```
AGENTS_PAGE_REDESIGN.md     (604)  ─┐ Spec + visual audit of same page
ALL_AGENTS_REVAMP_AUDIT.md  (313)  ─┘
```

**Resolution:** Merge → `AGENTS_PAGE_REDESIGN.md` (~500 lines target).

---

## D. Recommended Final Structure

After cleanup, the project should have this documentation layout:

```
tyler-agent-haven/
├── CLAUDE.md                    # Project context for AI assistants (trimmed)
├── README.md                    # Quick-start setup
├── HOMESTEAD.md                 # NEW — design system (replaces DESIGN_SYSTEM.md)
├── BOB_COMMAND_CENTER_ANALYSIS.md  # Active spec (archive when BOB ships)
│
└── docs/
    ├── ARCHITECTURE.md              # Single source: structure + schema + quality metrics
    ├── DEVELOPER_ONBOARDING.md      # New dev setup guide
    ├── BRANDING_WORKFLOW_AUDIT.md   # White-label migration checklist
    ├── MVP_SPRINT_ANALYSIS.md       # Current sprint items (delete when done)
    │
    ├── ADMIN_LOGIN_ONBOARDING_AUDIT.md   # Auth flows, email copy
    ├── ADMIN_PAGES_AUDIT.md              # NEW (merged admin visual audits)
    ├── AGENT_IMPORT.md                   # NEW (merged import docs)
    ├── AGENT_PROFILE_AUDIT.md            # Post-refactor status (absorbs discovery)
    ├── AGENTS_PAGE_REDESIGN.md           # NEW (merged redesign + revamp)
    │
    ├── CARRIER_RESOURCES_CONTEXT.md      # Trimmed to schema + key files
    ├── CARRIER_RESOURCES_REBUILD_ANALYSIS.md  # Active CMS rebuild guide
    ├── CMS_INTEGRATION_STRATEGY.md       # Strategic CMS roadmap
    ├── CMS_LANDSCAPE_DATA_MAPPING.md     # Column mapping reference
    ├── CMS_PBP_DATA_MAPPING.md           # Column mapping reference
    │
    ├── DASHBOARD_AUDIT.md                # NEW (merged 3 dashboard docs)
    ├── DASHBOARD_LOADING_AUDIT.md        # Specific perf bug + fix
    ├── DESIGN_AUDIT.md                   # Core design tokens
    ├── GOLDEN_HOUR_MIGRATION_AUDIT.md    # Trimmed to ~400 lines
    ├── GROWTH_PLAN_V8_AUDIT.md           # NEW (merged logic + visual)
    ├── NAVIGATION_ANALYSIS.md            # 32-route inventory + proposals
    ├── UX_DESIGN_AUDIT.md                # Definitive UX audit (absorbs comprehensive)
    │
    ├── LEADS_FEATURE_CONTEXT.md          # Planned feature spec
    ├── MEDICARE_PLAN_FINDER_INTEGRATION.md  # Integration guide
    ├── PDF_GENERATOR_CONTEXT.md          # pdf-lib patterns
    ├── PLAN_FINDER_UI_AUDIT.md           # Plan Finder component audit
    ├── PLATFORM_ANALYSIS.md              # 7-part platform analysis
    ├── SYNC_INVESTIGATION.md             # Sync bug root cause
    │
    ├── component-context-reference.md    # Component patterns
    ├── document-storage-analysis.md      # Storage buckets + RLS
    ├── manager-assignment-reference.md   # Hierarchy modal reference
    ├── rts-import-flow-analysis.md       # RTS import flow
    ├── teams-page-redesign-reference.md  # Teams feature reference
    │
    └── archived/                         # Historical reference only
        ├── DESIGN_SYSTEM.md              # Superseded by HOMESTEAD.md
        ├── PLATFORM_ANALYSIS_ROOT.md     # Root-level 90-day roadmap
        ├── MEMORY_CLEANUP_REPORT.md      # Session log
        ├── STATE_PERSISTENCE_AUDIT.md    # Completed checklist
        ├── ux-audit-admin-dashboard-2026-01-19.md
        └── ux-audit-agent-profile-page-2026-01-19.md
```

**Final count:** 33 active docs + 6 archived = 39 files (down from 64)
**Final lines:** ~17,100 active (down from ~31,500) — **46% reduction**

---

## E. Action Items

### Phase 1 — Immediate Deletes (11 files, 7,211 lines)

These files are stale, superseded, or contain no unique value. Safe to delete without any content extraction.

```bash
# 1. Delete auto-generated UX export (purpose served)
rm UX_AUDIT_EXPORT.md

# 2. Delete superseded admin audit (references pre-refactor code)
rm docs/ADMIN_UX_AUDIT.md

# 3. Delete agent profile design context (60% duplicates DESIGN_SYSTEM.md)
rm docs/AGENT_PROFILE_DESIGN_CONTEXT.md

# 4. Delete agent profile plan doc (plan was executed)
rm docs/AGENT_PROFILE_REDESIGN_PRIORITIES.md

# 5. Delete carrier hub analysis (describes architecture that no longer exists)
rm docs/CARRIER_HUB_ANALYSIS.md

# 6. Delete stale index (CLAUDE.md is the real index)
rm docs/INDEX.md

# 7. Delete expired sprint report (deadline passed 9 days ago)
rm docs/MVP_STATUS_REPORT.md

# 8. Delete superseded platform audit (PLATFORM_ANALYSIS.md covers same scope + more)
rm docs/PLATFORM_AUDIT.md

# 9. Delete biggest bloat file (2169 lines — raw PlanFinderPage.tsx source code dump)
rm docs/SPRINT_CONTEXT.md

# 10. Delete lightweight UX audit duplicate
rm docs/UX_AUDIT.md

# 11. Delete generic Sentry tutorial (Sentry already integrated)
rm docs/WEEK1_SENTRY_GUIDE.md
```

### Phase 2 — Archive (6 files → `docs/archived/`)

```bash
# 12. Create archived directory
mkdir -p docs/archived

# 13. Archive DESIGN_SYSTEM.md (superseded by HOMESTEAD.md)
mv DESIGN_SYSTEM.md docs/archived/DESIGN_SYSTEM.md

# 14. Archive root PLATFORM_ANALYSIS.md (90-day roadmap, will drift)
mv PLATFORM_ANALYSIS.md docs/archived/PLATFORM_ANALYSIS_ROOT.md

# 15. Archive session cleanup log
mv docs/MEMORY_CLEANUP_REPORT.md docs/archived/

# 16. Archive completed useSearchParams checklist
mv docs/STATE_PERSISTENCE_AUDIT.md docs/archived/

# 17. Archive point-in-time Jan 19 audits
mv docs/ux-audit-admin-dashboard-2026-01-19.md docs/archived/
mv docs/ux-audit-agent-profile-page-2026-01-19.md docs/archived/
```

### Phase 3 — Merges (18 source files → 7 consolidated outputs)

Each merge: read sources, extract unique content, write consolidated file, delete sources.

```
# 18. MERGE: Dashboard Audit (3 → 1, target ~800 lines)
#     Sources: DASHBOARD_ANALYSIS.md + DASHBOARD_CONTENT_INVENTORY.md + DASHBOARD_RESPONSIVE_AUDIT.md
#     Output:  docs/DASHBOARD_AUDIT.md
#     Then:    rm docs/DASHBOARD_ANALYSIS.md docs/DASHBOARD_CONTENT_INVENTORY.md docs/DASHBOARD_RESPONSIVE_AUDIT.md

# 19. MERGE: Admin Pages Audit (3 → 1, target ~400 lines)
#     Sources: ADMIN_DASHBOARD_REVAMP_AUDIT.md + ADMIN_DESIGN_AUDIT.md + ADMIN_STYLE_GUIDE.md
#     Output:  docs/ADMIN_PAGES_AUDIT.md
#     Then:    rm docs/ADMIN_DASHBOARD_REVAMP_AUDIT.md docs/ADMIN_DESIGN_AUDIT.md docs/ADMIN_STYLE_GUIDE.md

# 20. MERGE: Architecture (absorb 4 → 1)
#     Sources: ARCHITECTURE_REVIEW.md + CODE_QUALITY_REVIEW.md + CODEBASE_SUMMARY.md + CARRIER_CONTRACTING_SCHEMA_SUMMARY.md
#     Target:  docs/ARCHITECTURE.md (append as "Code Health" and "Schema Reference" appendix sections)
#     Then:    rm docs/ARCHITECTURE_REVIEW.md docs/CODE_QUALITY_REVIEW.md docs/CODEBASE_SUMMARY.md docs/CARRIER_CONTRACTING_SCHEMA_SUMMARY.md

# 21. MERGE: Growth Plan Audit (2 → 1, target ~500 lines)
#     Sources: GROWTH_PLAN_V8_ANALYSIS.md + GROWTH_PLAN_V8_VISUAL_AUDIT.md
#     Output:  docs/GROWTH_PLAN_V8_AUDIT.md
#     Then:    rm docs/GROWTH_PLAN_V8_ANALYSIS.md docs/GROWTH_PLAN_V8_VISUAL_AUDIT.md

# 22. MERGE: Agent Import (2 → 1, target ~300 lines)
#     Sources: AGENT_IMPORT_CURRENT_STATE.md + AGENT_IMPORT_PLANNING.md
#     Output:  docs/AGENT_IMPORT.md
#     Then:    rm docs/AGENT_IMPORT_CURRENT_STATE.md docs/AGENT_IMPORT_PLANNING.md

# 23. MERGE: Agents Page Redesign (2 → 1, target ~500 lines)
#     Sources: AGENTS_PAGE_REDESIGN.md + ALL_AGENTS_REVAMP_AUDIT.md
#     Output:  docs/AGENTS_PAGE_REDESIGN.md (replace in-place)
#     Then:    rm docs/ALL_AGENTS_REVAMP_AUDIT.md

# 24. MERGE: UX Audit (absorb into existing)
#     Source:  UX_AUDIT_COMPREHENSIVE.md (extract Phase 2 principle scores only)
#     Target:  docs/UX_DESIGN_AUDIT.md (append section)
#     Then:    rm docs/UX_AUDIT_COMPREHENSIVE.md

# 25. MERGE: Agent Profile (absorb into existing)
#     Source:  AGENT_PROFILE_PAGE_DISCOVERY.md (extract data model info)
#     Target:  docs/AGENT_PROFILE_AUDIT.md (append section)
#     Then:    rm docs/AGENT_PROFILE_PAGE_DISCOVERY.md
```

### Phase 4 — Trims (2 files)

```
# 26. TRIM: CARRIER_RESOURCES_CONTEXT.md (488 → ~150 lines)
#     Remove: outdated component descriptions, design tokens duplicated in DESIGN_SYSTEM.md
#     Keep:   DB schema section, key files section

# 27. TRIM: GOLDEN_HOUR_MIGRATION_AUDIT.md (843 → ~400 lines)
#     Remove: repeated design token blocks across Area 1/2/3
#     Keep:   per-area migration status, shared tokens once at top
```

### Phase 5 — CLAUDE.md Fix

```
# 28. Update CLAUDE.md:
#     - Fix BOB status: change "Book of Business | Production tracking with milestone achievements"
#       to note agent-facing view doesn't exist yet
#     - Update doc count: change "26 documentation files" to actual count
#     - Update Documentation Index table to reflect new structure
#     - Add note about HOMESTEAD.md replacing DESIGN_SYSTEM.md
```

---

## Summary

| Metric | Before | After | Change |
|--------|-------:|------:|-------:|
| Total files | 64 | 33 active + 6 archived | -39% |
| Total lines | ~31,500 | ~17,100 | -46% |
| Redundancy clusters | 10 | 0 | eliminated |
| Files > 1,000 lines | 7 | 2 | -71% |
| Stale files (≥4/5) | 12 | 0 | eliminated |

The primary problem is not age but **redundancy**: the same pages get audited repeatedly without consolidating findings, and sprint artifacts accumulate without cleanup. The 10 redundancy clusters account for ~16,500 lines — over half the total documentation. After executing these 28 action items, every remaining doc will be either a unique reference or an active sprint artifact.
