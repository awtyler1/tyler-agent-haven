# AgentProfilePage Redesign - Implementation Priorities

**Date:** February 4, 2026
**Analyst:** Claude
**Target User:** Caroline (primary admin)

---

## Executive Summary

The AgentProfilePage is functional but cognitively overloaded (2,000+ lines, 36 state variables, 7 UI sections). Recommend transitioning to a tabbed interface to reduce cognitive load while maintaining context.

**Design Lens Scores:**
- Focus: 6/10
- Simplicity: 5/10
- Clarity: 6/10
- Delight: 3/10
- **Overall: 5/10** (functional but not elegant)

---

## Implementation Phases

### Phase 1: Quick Wins (No Architecture Change)
*Goal: Improve clarity without refactoring*

| Priority | Task | Effort | Impact |
|----------|------|--------|--------|
| P1.1 | Rename "Notes" card header to "Contracting Notes" | 5 min | High |
| P1.2 | Remove hardcoded E&O/Licensed checkmarks OR make them data-driven | 30 min | Medium |
| P1.3 | Add empty state illustrations to Carriers and Notes cards | 1 hr | Medium |
| P1.4 | Add "last updated" timestamp to contracting notes display | 30 min | Low |

### Phase 2: State Consolidation (Refactor)
*Goal: Reduce complexity from 36 to ~10 state variables*

| Priority | Task | Effort | Impact |
|----------|------|--------|--------|
| P2.1 | Extract inline-edit fields into `useInlineEdit` custom hook | 2 hr | High |
| P2.2 | Extract modal state into separate hooks (`useCarrierRequestModal`, `useDeactivateModal`) | 2 hr | High |
| P2.3 | Move carrier request logic to `useCarrierRequest.ts` hook | 1 hr | Medium |

**Expected result:** AgentProfilePage reduced to ~800-1000 lines

### Phase 3: Tab Architecture (Major Change)
*Goal: Implement tabbed interface*

| Priority | Task | Effort | Impact |
|----------|------|--------|--------|
| P3.1 | Create `AgentProfileTabs` component with routing (`?tab=overview`) | 2 hr | High |
| P3.2 | Move header band to persistent position above tabs | 1 hr | High |
| P3.3 | Create `AgentOverviewTab` (contact info, status, compliance) | 2 hr | High |
| P3.4 | Create `AgentContractingTab` (carriers, request history, notes) | 3 hr | High |
| P3.5 | Move `AgentDocumentsSection` into `AgentDocumentsTab` | 30 min | Medium |
| P3.6 | Create `AgentAdminTab` (role, deactivate, admin-only actions) | 2 hr | Medium |
| P3.7 | Add tab state persistence via URL params | 1 hr | Low |

### Phase 4: New Features
*Goal: Add requested functionality*

| Priority | Task | Effort | Impact |
|----------|------|--------|--------|
| P4.1 | Create `admin_notes` table (id, profile_id, author_id, content, created_at) | 1 hr | High |
| P4.2 | Build `AdminNotesTimeline` component with threaded view | 3 hr | High |
| P4.3 | Create `carrier_requests` table for request tracking | 1 hr | High |
| P4.4 | Build `CarrierRequestHistory` component in Contracting tab | 2 hr | High |
| P4.5 | Auto-log carrier requests to `carrier_requests` table when sent | 30 min | Medium |

### Phase 5: Polish
*Goal: Add delight moments*

| Priority | Task | Effort | Impact |
|----------|------|--------|--------|
| P5.1 | Add smooth tab transitions (Framer Motion or CSS) | 1 hr | Medium |
| P5.2 | Add confetti/celebration when agent becomes fully contracted | 1 hr | Low |
| P5.3 | Add Gravatar/photo upload support for avatar | 3 hr | Low |
| P5.4 | Add keyboard shortcuts (Tab navigation, Cmd+S for save) | 2 hr | Low |

---

## Database Schema Additions

```sql
-- Admin notes (threaded comments)
CREATE TABLE admin_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES profiles(id),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_admin_notes_profile ON admin_notes(profile_id);

-- Carrier request tracking
CREATE TABLE carrier_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL REFERENCES profiles(id),
  recipient_email text NOT NULL,
  carriers text[] NOT NULL,
  email_subject text,
  requested_at timestamptz DEFAULT now(),
  notes text
);

CREATE INDEX idx_carrier_requests_profile ON carrier_requests(profile_id);
```

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Lines of code (main file) | 2,004 | < 500 |
| useState declarations | 36 | < 12 |
| Time to find carrier status | 3-5 sec (scroll/scan) | < 1 sec (Contracting tab) |
| Caroline satisfaction | Unknown | Survey post-launch |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| URL changes break bookmarks | Use query params (`?tab=contracting`) not paths |
| Mobile regression | Test all tabs at 375px before launch |
| Data migration for admin_notes | Migration script with fallback to existing `contracting_notes` |

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-04 | Chose tabs over sub-pages | Preserves context; supports Caroline's sequential workflow |
| 2026-02-04 | Admin tab only for admins | Reduces noise for self-view agents |
| 2026-02-04 | Query params over route segments | Simpler routing, no layout remounts |

---

## Files to Modify/Create

### Modify
- `src/pages/Admin/AgentProfilePage.tsx` → Slim down to tab container
- `src/components/admin/AgentDocumentsSection.tsx` → Minor adjustments for full-page usage

### Create
- `src/components/admin/agent-profile/AgentProfileHeader.tsx`
- `src/components/admin/agent-profile/AgentProfileTabs.tsx`
- `src/components/admin/agent-profile/tabs/OverviewTab.tsx`
- `src/components/admin/agent-profile/tabs/ContractingTab.tsx`
- `src/components/admin/agent-profile/tabs/DocumentsTab.tsx`
- `src/components/admin/agent-profile/tabs/AdminTab.tsx`
- `src/components/admin/agent-profile/AdminNotesTimeline.tsx`
- `src/components/admin/agent-profile/CarrierRequestHistory.tsx`
- `src/hooks/useInlineEdit.ts`
- `src/hooks/useCarrierRequestModal.ts`
- `src/hooks/useDeactivateModal.ts`

---

*"Design is not just what it looks like and feels like. Design is how it works." — Steve Jobs*
