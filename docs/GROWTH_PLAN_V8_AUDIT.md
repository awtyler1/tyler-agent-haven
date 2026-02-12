# Growth Plan V8 Audit

> Consolidated from GROWTH_PLAN_V8_ANALYSIS.md, GROWTH_PLAN_V8_VISUAL_AUDIT.md — February 2026

**File Under Audit:** `supabase/functions/generate-growth-plan-pdf-v8/index.ts`
**Date:** February 3, 2026

---

## 1. Overview

The Growth Plan V8 edge function generates a personalized 8-page PDF for each Medicare agent. It takes an agent profile (book size, lead sources, income goal, seminar plans, etc.) and produces a strategic plan with:

| Page | Content |
|------|---------|
| 1 | **Your Path to the Goal** — backward math from income goal to monthly sales target, lead sources table, gap/buffer summary, checklist |
| 2 | **Channel Playbook** — cards for each assigned lead channel (Lead Star, MIRA, Client Care, Community) with scripts and targets |
| 3 | **What You're Building** — 5-year trajectory table, stay-vs-quit comparison, compounding income projection |
| 4 | **The Mindset** — 5 numbered principles for AEP success |
| 5 | **Your Week** — rules of engagement, weekly rhythm table, first-week checklist |
| 6 | **Weekly Tracker** — printable form with daily activity rows and behind-pace callout |
| 7 | **Quick Reference** — big-number summary boxes, daily checklist, "When You're Stuck" prompts |
| 8 | **Glossary** — Medicare terms and TIG-specific definitions |

**Key constants:** BLENDED_AVG = $434/sale, RENEWAL_ANNUAL = $347, T65 commission = $694, retention = 85%, Lead Star close rate = 15%, seminar attendance = 18, seminar close rate = 32%.

**Overall visual quality score: 6.5/10** — solid brand palette and logical information architecture, but undermined by a critical encoding bug, inconsistent typography, and spacing without a system.

---

## 2. Logic & Math Findings

### 2.1 Persona Test Results

Five agent profiles were run through the generation logic. The table below summarizes whether each received an actionable, mathematically sound plan.

| Persona | Profile | Sales Goal | Expected | Gap | Verdict |
|---------|---------|-----------|----------|-----|---------|
| Day 1 Agent | book=0, leads=0, no MIRA, no seminars, $2K goal | 5/mo | 0 | 5 | NOT HELPFUL |
| Part-Time Agent | book=15, leads=5, no MIRA, no seminars, $1.5K goal | 3/mo | 2 | 1 | PARTIALLY HELPFUL |
| Career Changer | book=0, leads=20, MIRA, 2 seminars, $5K goal | 12/mo | 3 | 9 | MOSTLY HELPFUL |
| Struggling Y2 | book=40, leads=0, no MIRA, no seminars, $3K goal | 7/mo | 1 | 6 | PARTIALLY HELPFUL |
| Top Producer | book=250, leads=50, MIRA, 4 seminars, $8K goal | 18/mo | 13 | 5 | HELPFUL |

### 2.2 Detailed Persona Findings

**Day 1 Agent (book=0, leads=0, $2,000/mo)**

- Lead sources table renders completely EMPTY — no rows at all.
- The only channel shown is Community & Networking, with a target of 10 conversations/week but no close rate to connect activity to sales.
- The plan presents a 5-sale gap with zero quantifiable path to fill it. This is demoralizing rather than helpful.

**Part-Time Agent (book=15, leads=5, $1,500/mo)**

- Lead Star: 5 x 15% = 1 expected. Client Care: 15 clients -> 12 eligible -> 1 name/mo x 50% = 1 expected. Total 2 expected, gap of 1.
- Checklist says "2-3 hrs/day" for Lead Star inbound. An agent receiving ~1.25 calls/week does not need to block 2-3 hours daily. This instruction does not scale to actual lead volume.
- Combined 8 conversations/week (3 Client Care + 5 Community) is reasonable for part-time.

**Career Changer (book=0, leads=20, MIRA, 2 seminars, $5,000/mo)**

- Lead Star: 20 x 15% = 3 expected. MIRA is variable (not counted). Seminars: 2 x 18 x 32% = ~12 one-time sales.
- Gap shows as 9, which looks alarming, but the 2 scheduled seminars would yield ~12 sales — more than covering the gap. The plan does not surface this insight; the agent must figure it out themselves.
- Lead Star is NOT marked as primary because the threshold is `> 20`, not `>= 20` (Line 227). An agent with exactly 20 leads misses primary designation.

**Struggling Year 2 Agent (book=40, leads=0, $3,000/mo)**

- Client Care: 40 clients -> 32 eligible -> 1.6 names/mo -> 2 x 50% = 1 expected. Gap of 6.
- The plan does not suggest requesting Lead Star or MIRA access to close the gap.
- "Community & Networking is your path to fill this gap" — but no math shows how many conversations translate to one sale.

**Top Producer (book=250, leads=50, MIRA, 4 seminars, $8,000/mo)**

- Lead Star: 50 x 15% = 8. Client Care: 250 -> 200 eligible -> 10 names/mo -> 5 expected. Total 13, gap of 5.
- Seminars: 4 x 18 x 32% = ~23 one-time sales, more than covering the gap.
- Lead Star correctly marked as PRIMARY (50 > 20). Client Care target of 25/week (5/day) is well-scaled for a 250-client book.
- Minor: referral formula yields only 5 from 250 clients (2% of book). Industry benchmarks suggest 3-5% is achievable.

### 2.3 Income-to-Sales Math (Validated with Persona 3)

```
$5,000 / $434 = 11.52 -> Math.round() = 12 sales/month

T65 split: Math.floor(12 x 0.25) = 3 T65 sales
Plan Change: 12 - 3 = 9

Verification: (3 x $694) + (9 x $347) = $2,082 + $3,123 = $5,205
```

Slightly above target due to rounding — acceptable.

### 2.4 Five-Year Projection (Validated)

Year 1 (book=0, salesGoal=12):

```
retained = round(0 x 0.85) = 0
new = 12 x 12 = 144
end = 144
newIncome = 144 x $434 = $62,496
renewalIncome = $0
total = $62,496
```

Year 2:

```
retained = round(144 x 0.85) = 122
new = 144
end = 266
newIncome = $62,496
renewalIncome = 122 x $347 = $42,334
total = $104,830
```

Validations: BLENDED_AVG used correctly for new income, 85% retention applied, RENEWAL_ANNUAL used for renewals, compounds correctly year-over-year.

### 2.5 Cross-Page Consistency

| Element | Page 1 | Page 6 | Page 7 | Consistent? |
|---------|--------|--------|--------|-------------|
| Income Goal | $5,000 | - | $5,000 | Yes |
| Sales Goal | 12 | 12 (3/week) | 12 | Yes |
| Lead Sources | Lead Star, MIRA | - | Lead Star, MIRA | Yes |
| Expected Sales | 3 | - | 3 | Yes |

All checklist items from Page 1 appear in the Page 6 tracker. Extra tracker rows (Appointments Set, Sales Closed) are summary rows.

---

## 3. Visual & Typography Findings

### 3.1 Typography Audit

**Current state: 10 different font sizes with no clear system.**

| Element Type | Size(s) Used | Readable? |
|--------------|-------------|-----------|
| Page header title | 12pt | Yes |
| Page header subtitle | 7pt | Marginal |
| Section headers | 9-10pt (inconsistent) | Yes |
| Body text | 7-8pt (varies) | 7pt is marginal |
| Table headers/content | 7-8pt | 7pt is marginal |
| Labels/captions | 6-7pt | 6pt too small |
| Hero numbers | 14-28pt | Yes |
| Footer text | 6pt | Too small |

**Section header inconsistency** — mix of 9pt and 10pt across pages for the same element type:

| Page | Header | Size |
|------|--------|------|
| 1 | YOUR LEAD SOURCES | 9pt |
| 2 | YOUR CHANNEL PLAYBOOK | 10pt |
| 3 | STARTING POSITION | 9pt |
| 4 | WHAT ACTUALLY MATTERS | 10pt |
| 5 | THE RULES | 10pt |
| 6 | WEEK OF | 9pt |
| 7 | DAILY CHECKLIST | 9pt |
| 8 | MEDICARE TERMS | 10pt |

**6pt text locations that will be illegible when printed:**
- Line 567-568: Footer "Tyler Insurance Group | Confidential"
- Line 829: "TARGET:" label on channel cards
- Lines 908-910: Footnotes on 5-year trajectory
- Line 1187: Target labels in weekly tracker

**Bold overuse:** Nearly every label is bold. Source names, expected values, section labels — when everything is bold, nothing stands out. Should reserve bold for actual emphasis only.

### 3.2 Spacing Audit

**Current vertical gaps used (no system):** 8px, 10px, 12px, 14px, 16px, 18px.

| Gap Value | Where Used |
|-----------|-----------|
| 8px | After 5-year table rows |
| 10px | After lead sources, events, checklist |
| 12px | After glossary sections |
| 14px | After headers, before sections |
| 16px | After Starting Position box |
| 18px | After page title, before channels |

**Inconsistent section-to-section gaps on Page 1:**
- After income box: 14px
- After lead sources table: 10px
- After summary box: 12px
- After events box: 10px
- After checklist: 10px

**Card/box padding varies without reason:**
- Income Goal Box: 12px left
- Channel cards: 12px left
- Principle cards: 10px left (should match at 12px)
- Rules cards: 10px left (should match at 12px)
- Script boxes: 8px left

### 3.3 Color System

The palette is well-designed with proper semantic usage:

| Color | Hex | Purpose |
|-------|-----|---------|
| GOLD #9E7D2E | Brand primary — headers, accents |
| GOLD_LIGHT #F5F0E6 | Card backgrounds, highlights |
| CHARCOAL #2E2E2E | Primary text |
| DARK_GRAY #4A4A4A | Secondary text |
| MEDIUM_GRAY #6B6B6B | Tertiary text (captions) |
| GREEN_DARK #2E7D33 | Positive states (book size, buffer) |
| ORANGE_DARK #E66600 | Warning states (gap text) |
| PURPLE_DARK #664099 | Seminar-related text |

**Issues:**
- Three gray tones for text is one too many — CHARCOAL vs DARK_GRAY distinction is subtle
- GOLD on white is ~4.5:1 contrast — passes AA for large text only, fails for small text
- MEDIUM_GRAY at 6pt fails WCAG minimum contrast for that size (needs 7:1)
- Gold text will appear muddy brown in B&W printing

### 3.4 Table Layout Issues

**Lead Sources Table (Page 1):**
- Column positions: `[MARGIN+8, MARGIN+110, MARGIN+280, MARGIN+360, MARGIN+450]`
- "Expected" column at 450 risks content being cut off (content width is 540)
- Numbers are left-aligned; should be right-aligned for scanning
- No alternating row colors

**5-Year Trajectory Table (Page 3):**
- Column positions: `[MARGIN+10, MARGIN+60, MARGIN+140, MARGIN+240, MARGIN+340, MARGIN+440]`
- Income numbers left-aligned (should be right-aligned)
- Footnotes at 6pt too small (Lines 908-910)

**Weekly Tracker Table (Page 6):**
- Day columns at 70px each are too narrow for handwriting
- Total column starts at 450 (overflows content edge)
- Target labels at 6pt (Line 1187) are hard to read

### 3.5 Alignment Issues

- All content aligns to MARGIN (36px) — good.
- Nested content uses inconsistent offsets: +8, +10, +12 from left edge.
- Checkboxes: box at `MARGIN+10, checkY-8` (10x10), text at `MARGIN+26, checkY-6`. There is a 2px vertical misalignment between checkbox and text.

### 3.6 Visual Hierarchy Problems

**Page 2 (Channel Playbook):** All channel cards have identical 58px height and styling. When the "PRIMARY FOCUS" badge was removed, nothing replaced it. There is no visual way to distinguish the most important channel from supplemental ones.

**Page 4 (Mindset):** All 5 principle cards are visually identical. The first principle ("AEP is everything") should be visually dominant. Numbers are 14pt but titles are 10pt — the ratio feels inverted.

**Page 5 (Your Week):** "THE RULES" and "WEEKLY RHYTHM" start at the same hierarchy level (10pt bold), competing for attention. The First Week Checklist at the bottom gets lost.

### 3.7 Information Density

**Overcrowded pages:**
- Page 1: income box + lead sources table + summary + seminars + checklist + review date + seasonality note
- Page 5: rules + rhythm table + first-week checklist

**Sparse pages:**
- Page 2: only 4 channel cards — room for more guidance
- Page 8: glossary has excess whitespace at bottom

**Duplicated content:** The seasonality note on Page 1 essentially duplicates the AEP principle on Page 4. Could be removed from Page 1 to reduce density.

### 3.8 Print Readiness

| Size | Print Readable? |
|------|----------------|
| 6pt | No — will be illegible on most printers |
| 7pt | Marginal — older agents may struggle |
| 8pt+ | Yes |

Page 6 (Weekly Tracker) is the strongest landscape candidate; the day columns are too narrow at 70px in portrait. All other pages work in portrait. Page break checks (`if (y - height < 60)`) are in place and footer zone is protected.

---

## 4. Combined Recommendations

### CRITICAL (Must Fix)

| # | Issue | Detail | Location |
|---|-------|--------|----------|
| C1 | **Unicode encoding bug** | Arrow character "\u2192" breaks PDF generation in Deno runtime | Line 731 — change to ASCII "->" |
| C2 | **Empty lead sources table for new agents** | book=0, leads=0, no MIRA produces a table with zero rows — visually broken and demoralizing | Lead sources rendering logic — add placeholder row: "No assigned lead sources yet" |
| C3 | **Community & Networking has no close rate** | This channel is supposed to "fill the gap" but has `close_rate: 0`. Agents with large gaps (5-9 sales) have no math showing whether their activity target is sufficient | Add estimated close rate (5-10%) or guidance: "Every 20 conversations typically yields 1-2 referral opportunities" |
| C4 | **6pt text throughout** | Footer, TARGET labels, footnotes, tracker labels at 6pt will be illegible when printed | Lines 567-568, 829, 908-910, 1187 — raise minimum to 7pt |

### HIGH (Should Fix)

| # | Issue | Detail | Location |
|---|-------|--------|----------|
| H1 | **Lead Star hours don't scale** | Checklist says "2-3 hrs/day" regardless of lead volume. An agent with 5 leads/month does not need 2-3 hours daily | Scale guidance: 1-10 leads = "Be available when calls come in", 10-30 = "1-2 hrs/day", 30+ = "2-3 hrs/day" |
| H2 | **Section header sizes inconsistent** | Mix of 9pt and 10pt for the same element type across pages | Standardize all section headers to 10pt bold |
| H3 | **Numbers left-aligned in tables** | Lead sources, 5-year trajectory, and tracker tables all left-align numerical data | Right-align all numerical columns (Lines 899-902, 633, etc.) |
| H4 | **Tracker day columns too narrow** | 70px per day column is insufficient for handwriting | Increase to 80px (Line 1125); consider landscape for Page 6 |
| H5 | **Seminars not visible in gap calculation** | Agent with 2 seminars (~12 sales) still sees "Gap: 9" with no indication that seminars cover it | Add note below gap: "Plus ~12 from scheduled seminars" or show total potential |
| H6 | **Lead sources table column widths** | "Expected" column at MARGIN+450 risks overflow; "What You Have" column too narrow | Redistribute column positions (Line 633) |
| H7 | **Summary text too small on Page 1** | The gap/buffer message (the plan's punchline) is only 9pt | Increase to 10pt for main message, 9pt for supporting text (Lines 690-702) |

### MEDIUM (Should Improve)

| # | Issue | Detail | Location |
|---|-------|--------|----------|
| M1 | **Lead Star primary threshold off-by-one** | `> 20` excludes agents with exactly 20 leads | Line 227 — change to `>= 20` |
| M2 | **Behind Pace box references Client Care for book=0 agents** | Page 6 asks "under 3 Client Care calls?" even when agent has no book | Line 1213 — make conditional on book_size |
| M3 | **Weekly rhythm table static** | Mentions "Client Care" on Tue/Thu even for agents with book_size=0 | Make rhythm table dynamic based on assigned channels |
| M4 | **Client Care formula may undervalue large books** | 250-client book produces only 5 expected sales (2%). Industry benchmarks suggest 3-5% is achievable | Review formula coefficients for books > 100 |
| M5 | **Channel cards lack priority indicator** | All cards have identical styling since PRIMARY FOCUS badge was removed | Add subtle gold background or border to the best channel (Line 812) |
| M6 | **Too many font sizes** | 10 distinct sizes (6-28pt) with no system | Consolidate to 5: 28pt (hero), 12pt (page title), 10pt (section header), 8pt (body), 7pt (caption minimum) |
| M7 | **Vertical spacing has no rhythm** | Six different gap values (8-18px) used arbitrarily | Adopt 8px grid: 8px (tight), 16px (standard), 24px (section break) |
| M8 | **Card padding inconsistent** | Principle and rules cards use 10px left; income and channel cards use 12px | Standardize all card padding to 12px left |

### LOW (Polish)

| # | Issue | Detail | Location |
|---|-------|--------|----------|
| L1 | **No alternating row colors in tables** | Lead sources and 5-year tables lack zebra striping | Add light gray every other row (Lines 646-672) |
| L2 | **First mindset principle should be visually dominant** | All 5 principle cards identical; #1 ("AEP is everything") deserves emphasis | Use 18pt number for #1 (14pt for others), add gold border (Line 989) |
| L3 | **Page 5 hierarchy** | "THE RULES" and "WEEKLY RHYTHM" compete at same visual level | Subordinate rhythm header to 9pt; elevate rules |
| L4 | **5-year "Stay" income understated** | The compounding income figure (the emotional hook) is only 8pt bold | Increase to 10pt bold (Line 930) |
| L5 | **Checkbox vertical misalignment** | Checkbox at y-8, text at y-6 — 2px offset | Align both to same baseline |
| L6 | **Glossary TIG section uses different background** | Medicare terms on white, TIG terms on gray — inconsistent | Match styling (Line 1443) |
| L7 | **Seasonality note duplicates Page 4** | The AEP seasonality note on Page 1 repeats content from the Mindset page | Consider removing from Page 1 to reduce density |
| L8 | **Gold contrast in B&W printing** | Gold (#9E7D2E) becomes muddy brown/dark gray in grayscale | No easy fix — acceptable tradeoff for brand |

---

## Appendix A: Recommended Typography System

| Size | Purpose | Replaces |
|------|---------|----------|
| 28pt | Hero numbers (income goal on Page 7) | Keep |
| 12pt | Page titles, major emphasis | Keep |
| 10pt | Section headers, important labels | Absorbs 9pt |
| 8pt | Body text, table content, definitions | Absorbs some 7pt uses |
| 7pt | Captions, footnotes (absolute minimum) | Absorbs 6pt (eliminate 6pt entirely) |

Remove: 6pt, 9pt, 14pt, 16pt, 18pt.

## Appendix B: Recommended Spacing System

| Gap | Purpose | Replaces |
|-----|---------|----------|
| 8px | Tight — within a group of related items | Current 8px uses |
| 16px | Standard — between items or after headers | Current 10px, 12px, 14px uses |
| 24px | Section break — between major sections | Current 16px, 18px uses |

## Appendix C: Persona Scorecard

| Persona | Actionable Plan? | Math Valid? | Would Actually Help? |
|---------|-----------------|-------------|---------------------|
| Day 1 Agent | No — no path shown | Gap unfillable with zero sources | No |
| Part-Time Agent | Mostly — Lead Star hours overscaled | Yes | Partially |
| Career Changer | Yes | Yes | Yes (seminars cover gap) |
| Struggling Y2 Agent | Gap unclear — no path to fill 6-sale deficit | Yes | Partially |
| Top Producer | Yes — well-scaled targets | Yes | Yes |

**Bottom line:** The plan works well for agents who have lead sources (Lead Star, MIRA, existing book). It fails for agents who have nothing — Community & Networking lacks the math to show a concrete path to hitting goals. The top three fixes (C1-C3) address a runtime crash, a broken empty state, and the missing close rate that undermines the plan's core promise.
