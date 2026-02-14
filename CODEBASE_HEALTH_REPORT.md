# TIG Platform — Codebase Health Report
**Date:** 2026-02-14
**Assessed by:** Senior Engineering Consulting Team
**Total Files:** 255 (TypeScript/TSX in `src/`)
**Total Lines of Code:** 72,606 (~55,800 excluding static data files)

---

## Overall Grade: B-

This is a functional, well-organized codebase built by a solo developer with AI assistance. The project structure is clean, hook composition is solid, and code splitting is properly implemented. The two areas that will drag on continued development velocity are (1) TypeScript running with every strictness flag turned off, which means the compiler catches almost nothing, and (2) the competing styling approaches (Tailwind classes vs. Golden Hour inline styles) that create inconsistency and make UI changes slower than they need to be. There is no test coverage whatsoever, which is a risk that scales with feature count. None of these are emergencies — the platform works and ships — but they represent accumulating drag that will compound over time.

---

## Category Grades

### 1. Project Structure & Organization — A-

The folder structure is clean and follows standard React conventions. Pages, components, hooks, lib, types, and config each have a clear purpose. Components are feature-grouped (`book/`, `admin/`, `contracting/`, `dashboard/`), which is the right call at this size. The `@/*` path alias eliminates messy relative imports (only 18 relative imports exist, all within the contracting sections — which makes sense).

- **What's working:**
  - Feature-grouped component directories (`book/`, `admin/`, `contracting/`)
  - 35 custom hooks in a dedicated `hooks/` directory — good extraction
  - Types separated into `types/` with domain-specific files
  - Lazy loading properly splits agent, admin, and book routes
  - Only 2 barrel index files — not over-abstracted
  - Clear separation: `lib/` for business logic, `config/` for constants, `data/` for static data

- **What needs attention:**
  - `kentucky-plans-2026.ts` is 16,753 lines of static plan data sitting in the source tree. This should be a database table or API response, not bundled code. It inflates the codebase metrics and will need yearly replacement.
  - `carriersData.ts` at 897 lines is another large static file that could live in the database.
  - Some components straddle the line between `components/book/` and `components/book-of-business/` — two directories for related features.

- **Urgency:** Low

---

### 2. TypeScript Discipline — D+

This is the weakest area. Every strictness flag is off:

```json
"strict": false,
"noImplicitAny": false,
"noUnusedLocals": false,
"noUnusedParameters": false,
"strictNullChecks": false
```

With `strictNullChecks: false`, TypeScript cannot warn about null/undefined access — the #1 runtime error category in JavaScript applications. With `noImplicitAny: false`, untyped function parameters silently become `any`, defeating the purpose of TypeScript.

There are 80 explicit `any` types in the codebase, many in catch blocks (`catch (err: any)`) and a few in component props. These are the ones that were *intentionally* typed as `any` — the implicit ones from disabled strictness are invisible and more numerous.

The unused-vars rule is also disabled in both TSConfig and ESLint (`@typescript-eslint/no-unused-vars: "off"`), which means dead code accumulates silently.

- **What's working:**
  - Supabase auto-generated types exist at `integrations/supabase/types.ts` (2,476 lines)
  - Domain types are properly defined in `types/` directory (book, contracting, CMS, forms, etc.)
  - Key interfaces like `Profile`, `AppRole`, `OnboardingStatus` are well-defined
  - Hook return types are generally well-shaped

- **What needs attention:**
  - Enable `strictNullChecks` — this is the single highest-impact change. It will surface real bugs.
  - Enable `noImplicitAny` — forces intentional typing decisions
  - Replace `catch (err: any)` with `catch (err: unknown)` + type narrowing (80 instances)
  - Re-enable `@typescript-eslint/no-unused-vars` to catch dead code

- **Urgency:** Medium — not breaking anything today, but every new feature written without strict mode adds more untyped surface area that gets harder to fix later.

---

### 3. Component Architecture — B

Components are generally well-scoped. The hook composition pattern (`useAuth = useProfile + useRole + useDownline`) is a good alternative to global state. Most pages follow the same structure: fetch data via hook, render loading/error/content. The largest components are large because of genuine UI complexity (SyncFlow is a multi-step wizard, ContractingQueue is a full admin panel), not because of poor decomposition.

- **What's working:**
  - Hook extraction is strong — 35 hooks covering auth, data fetching, and UI state
  - `useAuth` fetches profile, roles, and downline in parallel — well-optimized
  - `useCarrierDirectory` properly parallelizes 3 Supabase queries
  - Components like `ClientListPanel`, `ClientDetail`, and `DoctorsMedsSection` handle real UI complexity
  - Lazy loading splits the bundle along role boundaries (agent vs admin)

- **What needs attention:**
  - **SyncFlow.tsx (1,609 lines):** This is the largest component and does too much — file parsing, carrier detection, upload orchestration, progress tracking, and UI rendering all in one file. The parsing logic (CSV + XLSX) should be extracted to `lib/`.
  - **ContractingQueuePage.tsx (962 lines):** Defines types, fetches data, manages modals, and renders a complex admin panel inline. The data fetching and type definitions could be extracted.
  - **27 direct `supabase.from()` calls in components/pages** (14 in components, 13 in pages) bypass the hooks pattern. Most are in admin components (`AgentDocumentsSection`, `AllAgentsTab`, `CarrierStatusPanel`). These should be hooks for consistency and testability.
  - **AddClientForm.tsx (540 lines)** uses almost entirely inline styles rather than Tailwind, which makes it inconsistent with the rest of the codebase.

- **Urgency:** Low — the large files are functional. Extract when you need to modify them, not as a standalone cleanup.

---

### 4. Naming & Consistency — B+

Naming is generally clean and predictable. Files are named after their exports, hooks follow `use*` convention, pages follow `*Page.tsx` convention. The codebase leans heavily toward named exports (395) over default exports (51), which is the better pattern for refactoring and tree-shaking. The 51 default exports are almost all page components (expected for lazy loading).

- **What's working:**
  - Consistent `use*` naming for all 35 hooks
  - Page files follow `*Page.tsx` convention
  - Named exports dominate (395 vs 51 default)
  - Path alias `@/*` used consistently — only 18 relative imports exist
  - Type files in `types/` match their domain (`book.ts`, `contracting.ts`, `cms.ts`)

- **What needs attention:**
  - Two formatting utilities exist: `formatPhone` in `lib/utils.ts` AND `formatPhone`/`formatPhoneNumber` in `lib/formatters.ts`. The `utils.ts` version should be removed in favor of the `formatters.ts` canonical version.
  - `components/book/` and `components/book-of-business/` are two directories for closely related features — could be consolidated.

- **Urgency:** Low

---

### 5. Code Hygiene — C+

Hygiene is mixed. There's a moderate amount of cleanup debt, but nothing alarming for a codebase at this stage.

- **What's working:**
  - Only 16 TODO/FIXME comments, and they're legitimate ("TODO: persist to client_doctors table when created") — these are tracking real backend work, not forgotten hacks.
  - Error handling patterns exist in `lib/errors.ts` with typed helpers (`getErrorMessage`, `getUserFriendlyMessage`, `isNetworkError`, etc.)
  - Sentry error boundary catches React crashes with a proper fallback UI.

- **What needs attention:**
  - **24 `console.log` statements** — many are debug logs in `SyncFlow.tsx` (14 lines of sync debug output) and `carrier-detection.ts` (3 detection debug logs). These should be removed or gated behind a debug flag before users hit them in production.
  - **Zero test files** — no unit tests, no integration tests, no component tests. For an internal tool with 300 users this is survivable, but it means every deploy is a manual QA pass. As the Book of Business feature grows (it's the most complex feature), bugs will start shipping.
  - **1,662 comment lines** — this number looks high but includes legitimate JSDoc comments, section dividers, and explanatory comments. Not all are dead code. However, a portion are likely commented-out code blocks that should be removed.
  - **`.env` file exists in the repo root** — verify this is in `.gitignore`. If it contains secrets and is committed, that's a security issue.

- **Urgency:** Medium — the console.logs are the quick win. The test gap is a longer-term risk.

---

### 6. Design System Adherence — C

This is where things get messy. There are two competing styling systems operating simultaneously:

1. **Tailwind + Homestead tokens** — used in admin pages, carrier resources, and the shell components. Uses CSS classes and the design system defined in `HOMESTEAD.md`.
2. **Golden Hour (GH) inline styles** — used in Book of Business pages, dashboard, and newer agent-facing features. Uses a JS object (`config/golden-hour.ts`) with inline `style={{}}` props.

The result: **870 inline `style={{}}` usages** and **321 hardcoded hex colors** across the codebase. Components like `AddClientForm`, `ActivityTimeline`, `AttentionQueue`, and `ClientListPanel` are almost entirely inline-styled, while admin components use Tailwind classes.

- **What's working:**
  - The GH token system itself is well-structured — centralized values with semantic naming
  - `GlassPanel` component wraps common glass-morphism patterns
  - Carrier colors are centralized in `config/carriers.ts`
  - CSS variables (`var(--carrier-humana)`) used in some newer components
  - `cn()` utility (clsx + tailwind-merge) available and used where Tailwind is applied

- **What needs attention:**
  - **870 inline styles** — the Book of Business pages use almost no Tailwind. This makes responsive design harder, reduces consistency, and means two mental models for styling.
  - **Hardcoded colors everywhere** — `#A09888`, `#2C2418`, `#5C5347`, `#C8A951`, `#C75A3A` appear raw throughout `components/book/` files. These should be GH tokens at minimum, or Tailwind utility classes.
  - **No single source of truth** — should the team use Tailwind + CSS variables or the GH JS token object? Both are in active use. A decision needs to be made and documented.
  - The 6-line input className pattern is duplicated 6 times verbatim in contracting form sections — a shared class or component would eliminate the repetition.

- **Urgency:** Medium — this won't break anything, but it slows down every UI change because you have to figure out which system a given component uses.

---

### 7. Data Layer & Hooks — B+

The data layer is the strongest part of the architecture. Custom hooks handle data fetching cleanly, and the Supabase client is properly configured. The parallel-fetching patterns in `useAuth` and `useCarrierDirectory` show good performance awareness.

- **What's working:**
  - **35 purpose-built hooks** covering auth, clients, carriers, commissions, sync, forms, and more
  - `useAuth` fetches profile + roles + downline in parallel with `Promise.all`
  - `useCarrierDirectory` parallelizes contacts/links/documents fetches
  - `useContractingApplication` implements 800ms debounced auto-save
  - TanStack Query configured with sensible defaults (5min stale, 10min GC, no refetch on focus)
  - Supabase auto-generated types available at `integrations/supabase/types.ts`
  - Error types and helpers in `lib/errors.ts` with proper categorization

- **What needs attention:**
  - **27 direct `supabase.from()` calls** in components/pages — these bypass the hooks pattern. Admin components are the worst offenders (`AgentDocumentsSection` has 6 direct calls, `AllAgentsTab` has 5). These should be hooks.
  - Several hooks use `useState` + `useEffect` for data fetching instead of TanStack Query. Examples: `useCarrierDirectory`, `useAgentCarriers`, `useBookClients`. TanStack Query would give you caching, deduplication, and loading states for free.
  - `useBookClients.ts` has `console.log` debug statements left in the production fetch path.

- **Urgency:** Low — the current approach works. Migrate to TanStack Query for new hooks; retrofit existing ones when you touch them.

---

### 8. Dependencies & Tooling — B-

Dependencies are reasonable for the feature set. No red flags in the dependency tree — no abandoned packages, no massive unnecessary libraries.

- **What's working:**
  - Core stack is modern and well-chosen: React 18, Vite 5.4, TanStack Query 5, Supabase
  - Shadcn/Radix primitives keep the UI component dependency list large but intentional
  - `xlsx` is presumably loaded dynamically (noted in CLAUDE.md as an optimization)
  - Sentry for monitoring, Zod for validation — both good choices
  - `@` path alias configured in both tsconfig and Vite
  - ESLint with React hooks plugin configured

- **What needs attention:**
  - **ESLint is configured loosely** — `@typescript-eslint/no-unused-vars: "off"` means dead code passes lint. This should be at least `"warn"`.
  - **No Prettier or formatting enforcement** — formatting consistency relies on developer discipline (or AI tools).
  - **`lovable-tagger`** in devDependencies appears to be from the Lovable AI platform. If the project has migrated away from that platform, this dependency can be removed.
  - **`next-themes`** is a Next.js theming package — this is a Vite/React project. If it's not being used, remove it.
  - **No pre-commit hooks** (husky/lint-staged) — means nothing enforces quality before commits.
  - **86 migrations** and **26 edge functions** suggest a mature backend. Migration management should be reviewed periodically for consolidation.

- **Urgency:** Low

---

## Top 5 Files That Need the Most Attention

| File | Lines | Issues |
|------|-------|--------|
| `pages/SyncFlow.tsx` | 1,609 | Monolith — file parsing, upload orchestration, state machine, and UI all in one. 14 console.logs left in. Parsing logic should be extracted to `lib/`. |
| `data/kentucky-plans-2026.ts` | 16,753 | Static plan data hardcoded in source. Inflates bundle, requires yearly manual replacement. Should be database-driven. |
| `components/admin/AgentDocumentsSection.tsx` | 745 | 6 direct Supabase calls, multiple `catch (err: any)` blocks. Data layer should be a hook. |
| `components/book/AddClientForm.tsx` | 540 | Almost entirely inline styles — no Tailwind. Inconsistent with the rest of the codebase. |
| `components/admin/AllAgentsTab.tsx` | 949 | 5 direct Supabase calls, debug console.logs, `catch (err: any)` patterns. |

---

## Recommendation

### TARGETED CLEANUP — Specific areas need work

The codebase is functional and shipping. The architecture is sound — hook composition, lazy loading, feature grouping, and parallel data fetching show good engineering judgment. This is not a codebase that needs to be torn down and rebuilt.

However, two specific areas are creating drag that will compound:

1. **TypeScript strictness is completely disabled.** This means the compiler is not catching null access, implicit any types, or unused variables. Every new feature written under these settings adds more untyped surface area. This is the highest-leverage fix available.

2. **Two competing styling systems** create cognitive overhead on every UI change. The GH inline-style approach and the Tailwind approach need to be reconciled into one pattern, documented, and followed going forward.

The zero-test-coverage gap is a risk but not an emergency at current scale. The console.log cleanup is a 30-minute task.

---

## If Cleanup Is Recommended, Start Here

1. **Enable `strictNullChecks: true` in tsconfig.** This is the single highest-impact change. Fix the resulting compiler errors file by file. Most will be adding `?` operators or null checks. This will surface real bugs and prevent future ones. Do this before writing new features.

2. **Remove debug console.logs.** 24 statements across 6 files. Takes minutes, removes noise from production console. Target `SyncFlow.tsx` (14), `carrier-detection.ts` (3), `useBookClients.ts` (2), `useBookSummary.ts` (2).

3. **Decide on one styling system and document it.** If GH inline styles are the direction for agent-facing pages, make that explicit in `HOMESTEAD.md` and convert the hardcoded hex colors in `components/book/` to GH token references. If Tailwind is the direction, plan a migration for the book components.

4. **Extract SyncFlow.tsx parsing logic.** Move the CSV/XLSX parsing and carrier detection logic into `lib/syncParser.ts`. The component should orchestrate UI state, not parse spreadsheets. This makes the parsing logic testable independently.

5. **Re-enable `@typescript-eslint/no-unused-vars` as `"warn"`.** This catches dead code accumulation at lint time instead of letting it pile up.
