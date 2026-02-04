# Growth Plan V8 Visual Design Audit

**Date:** February 3, 2026
**File Analyzed:** `supabase/functions/generate-growth-plan-pdf-v8/index.ts`
**Test Profile:** book_size: 75, lead_star_leads: 15, mira_access: true, seminar_eligible: true, seminars_planned: 2, income_goal: $4,000/month

---

## EXECUTIVE SUMMARY

**Overall Quality Score: 6.5/10**

### Top 3 Strengths
1. **Consistent color palette** - Gold (#9E7D2E) and Charcoal (#2E2E2E) used thoughtfully for branding and hierarchy
2. **Logical information flow** - Page 1 "backward math" approach (Income → Sales → Lead Sources) is easy to follow
3. **Good use of semantic color** - Green for positive (buffer/book), Orange for warning (gap), Red for critical

### Top 3 Issues to Fix
1. **CRITICAL: Unicode encoding bug** - Arrow character "→" breaks PDF generation (Line 731)
2. **Typography inconsistency** - Font sizes vary illogically (6pt-28pt with no clear system)
3. **Vertical spacing chaos** - Arbitrary gaps (8px, 10px, 12px, 14px, 16px, 18px) with no rhythm

---

## PART 1: VISUAL HIERARCHY

### Page-by-Page Assessment

| Page | Purpose Clear? | Primary Element | Issue |
|------|----------------|-----------------|-------|
| 1 | ✅ Yes | Income Goal Box (Gold, 28pt) | Good - big number draws eye |
| 2 | ⚠️ Somewhat | Channel cards | All cards equal weight - no priority |
| 3 | ✅ Yes | 5-Year Table | Good - numbers prominent |
| 4 | ⚠️ Somewhat | 5 Principle Cards | All equal - #1 should be different |
| 5 | ⚠️ Somewhat | Rules + Rhythm table | Two competing sections |
| 6 | ✅ Yes | Tracker table | Good - form is obvious |
| 7 | ✅ Yes | Big number boxes | Good - scannable summary |
| 8 | ✅ Yes | Glossary terms | Good - reference format |

### Hierarchy Issues

**Page 2 - Channel Playbook:**
- All 4 channel cards have identical 58px height and styling
- No visual differentiation between "most important" and "supplemental" channels
- Previous "PRIMARY FOCUS" badge was removed but nothing replaced it

**Page 4 - Mindset:**
- All 5 principle cards are visually identical
- First principle ("AEP is everything") should be visually dominant
- Numbers (1-5) at 14pt but titles at 10pt - ratio feels wrong

**Page 5 - Your Week:**
- "THE RULES" and "WEEKLY RHYTHM" compete for attention
- Both sections start at same hierarchy level (10pt bold)
- First Week Checklist at bottom gets lost

---

## PART 2: TYPOGRAPHY AUDIT

### Font Size Inventory

| Element Type | Size(s) Used | Readable? | Consistent? |
|--------------|--------------|-----------|-------------|
| Page header title | 12pt | ✅ Yes | ✅ Yes |
| Page header subtitle | 7pt | ⚠️ Small | ✅ Yes |
| Section headers | 9-10pt | ✅ Yes | ⚠️ Varies |
| Body text | 7-8pt | ⚠️ 7pt is small | ⚠️ Varies |
| Table headers | 7pt | ⚠️ Small | ✅ Yes |
| Table content | 7-8pt | ⚠️ 7pt is small | ⚠️ Varies |
| Labels/captions | 6-7pt | ❌ 6pt too small | ⚠️ Varies |
| Big numbers | 28pt (Page 7), 18pt (book), 14pt | ✅ Yes | ⚠️ Varies |
| Footer text | 6pt | ❌ Too small | ✅ Yes |

### Typography Issues

**Too Many Sizes:**
Current: 6, 7, 8, 9, 10, 12, 14, 16, 18, 28pt (10 different sizes!)
Should be: 7, 9, 12, 18, 28pt (5 sizes max)

**6pt Text (Too Small):**
- Line 562: Page subtitle (7pt, but line 567-568 footer is 6pt)
- Line 567: Footer "Tyler Insurance Group | Confidential" - 6pt
- Line 785: "SEASONALITY NOTE" header - 7pt
- Line 829: "TARGET:" label - 6pt
- Line 908-910: Footnotes - 6pt
- Line 1187: Target labels in tracker - 6pt

**Inconsistent Section Headers:**
- Page 1: "YOUR LEAD SOURCES" - 9pt bold
- Page 2: "YOUR CHANNEL PLAYBOOK" - 10pt bold
- Page 3: "5-YEAR TRAJECTORY" - 9pt bold
- Page 4: "WHAT ACTUALLY MATTERS" - 10pt bold
- Should all be 10pt bold

**Bold Overuse:**
Almost every label is bold. When everything is bold, nothing stands out.
- Source names: bold
- What you have: regular
- Close rate: regular
- Expected: bold
Should reserve bold for actual emphasis.

---

## PART 3: SPACING & WHITESPACE

### Margin Analysis

| Element | Value | Consistent? |
|---------|-------|-------------|
| Page margin | 36px | ✅ Yes |
| Content width | 540px | ✅ Yes |
| Header height | 50px | ✅ Yes |
| Footer position | y=24 | ✅ Yes |

### Vertical Spacing Inventory

The code uses these gap values with no apparent system:
- `y -= 8` (after 5-year table rows)
- `y -= 10` (after lead sources, events)
- `y -= 12` (after glossary sections)
- `y -= 14` (after headers, before sections)
- `y -= 16` (after Starting Position, before table)
- `y -= 18` (after page title, before channels)

**Spacing Issues:**

**Cramped Areas:**
- Checklist items: 26px per item (checkY -= 26) - adequate
- Table rows: 14-18px - slightly cramped for 7-8pt text
- Glossary terms: 20px per term - adequate

**Loose Areas:**
- Page 1 after income box: `y -= incomeBoxH + 14` (72px total gap)
- Page 3 starting position: `y -= startBoxH + 16` (48px gap)

**Inconsistent Gaps Between Sections:**
- After income box: 14px
- After lead sources table: 10px
- After summary box: 12px
- After events box: 10px
- After checklist: 10px
- After review date: 10px (then potentially 36px seasonality)

Should standardize to: 8px (tight), 16px (standard), 24px (section break)

### Card/Box Padding Analysis

| Element | Padding | Issue |
|---------|---------|-------|
| Income Goal Box | 12px left | ✅ Good |
| Lead Source rows | 8px left | ✅ Good |
| Channel cards | 12px left | ✅ Good |
| Principle cards | 10px left | ⚠️ Should be 12px |
| Rules cards | 10px left | ⚠️ Should be 12px |
| Script boxes | 8px left | ⚠️ Inconsistent |

---

## PART 4: ALIGNMENT ISSUES

### Left Edge Alignment
- All content aligns to MARGIN (36px) ✅
- Nested content uses +8, +10, +12 offsets - inconsistent

### Table Column Alignment

**Lead Sources Table (Page 1):**
```
colX = [MARGIN + 8, MARGIN + 110, MARGIN + 280, MARGIN + 360, MARGIN + 450]
```
- "Expected" column at 450 is cut off (content width is 540)
- Numbers should be right-aligned but are left-aligned

**5-Year Trajectory Table (Page 3):**
```
trajColX = [MARGIN + 10, MARGIN + 60, MARGIN + 140, MARGIN + 240, MARGIN + 340, MARGIN + 440]
```
- 6 columns but only 5 headers shown
- Income numbers left-aligned (should be right-aligned for scanning)

**Weekly Tracker Table (Page 6):**
```
trackerColX = [MARGIN + 8, MARGIN + 100, MARGIN + 170, MARGIN + 240, MARGIN + 310, MARGIN + 380, MARGIN + 450]
```
- Day columns too narrow (70px each for writing space)
- Total column starts at 450 (goes past content edge)

### Checkbox/Bullet Alignment
- Checkboxes: `MARGIN + 10, checkY - 8` (10x10 box)
- Text: `MARGIN + 26, checkY - 6`
- 16px gap between checkbox and text ✅
- Vertical alignment: text at -6, checkbox at -8 (2px misalignment)

---

## PART 5: COLOR USAGE

### Color Inventory

| Color | RGB | Hex Approx | Where Used | Purpose |
|-------|-----|------------|------------|---------|
| GOLD | rgb(0.62, 0.49, 0.18) | #9E7D2E | Headers, accents, emphasis | Brand primary |
| GOLD_LIGHT | rgb(0.96, 0.94, 0.90) | #F5F0E6 | Card backgrounds, highlights | Subtle emphasis |
| CHARCOAL | rgb(0.18, 0.18, 0.18) | #2E2E2E | Main text, dark boxes | Primary text |
| DARK_GRAY | rgb(0.29, 0.29, 0.29) | #4A4A4A | Body text | Secondary text |
| MEDIUM_GRAY | rgb(0.42, 0.42, 0.42) | #6B6B6B | Captions, labels | Tertiary text |
| LIGHT_GRAY | rgb(0.91, 0.91, 0.91) | #E8E8E8 | Borders, dividers | Structural |
| WHITE | rgb(1, 1, 1) | #FFFFFF | Backgrounds | Base |
| GREEN_LIGHT | rgb(0.91, 0.96, 0.91) | #E8F5E8 | Buffer/positive states | Success bg |
| GREEN_DARK | rgb(0.18, 0.49, 0.20) | #2E7D33 | Book size, positive text | Success text |
| ORANGE_LIGHT | rgb(1.0, 0.95, 0.88) | #FFF2E0 | Gap/warning states | Warning bg |
| ORANGE_DARK | rgb(0.90, 0.40, 0.0) | #E66600 | Gap text | Warning text |
| RED_LIGHT | rgb(0.96, 0.90, 0.90) | #F5E6E6 | Critical/compliance | Error bg |
| PURPLE_LIGHT | rgb(0.94, 0.92, 0.98) | #F0EBFA | Seminars (one-time) | Special category |
| PURPLE_DARK | rgb(0.40, 0.25, 0.60) | #664099 | Seminar text | Special text |

### Color Analysis

**Strengths:**
- Semantic color system (green=good, orange=warning, red=critical) ✅
- Brand colors (gold) used consistently for emphasis ✅
- Purple for seminars creates clear visual distinction ✅

**Issues:**
- **Too many grays:** CHARCOAL, DARK_GRAY, MEDIUM_GRAY all used for text
- **Insufficient contrast:** 6pt MEDIUM_GRAY text on white may fail WCAG
- **Gold on white:** Some gold text (like expected sales numbers) may be hard to read

**Contrast Check (approximated):**
- GOLD (#9E7D2E) on WHITE: ~4.5:1 ⚠️ Passes AA for large text only
- MEDIUM_GRAY (#6B6B6B) on WHITE: ~5.5:1 ✅ Passes AA
- 6pt text should be 7:1 minimum - FAILS for medium gray

---

## PART 6: TABLES & DATA DISPLAY

### Lead Sources Table (Page 1)

| Aspect | Current | Issue |
|--------|---------|-------|
| Column widths | 102, 170, 80, 90, 90px | "What You Have" too narrow for content |
| Header height | 14px | Adequate |
| Row height | 18px | Slightly cramped for 8pt text |
| Alternating rows | No | Would help scannability |
| Cell padding | 8px left | Adequate |
| Number alignment | Left | Should be right-aligned |

### 5-Year Trajectory Table (Page 3)

| Aspect | Current | Issue |
|--------|---------|-------|
| Column widths | 50, 80, 100, 100, 100px | "Total" column needs more width |
| Header height | 14px | Adequate |
| Row height | 16px | Adequate |
| Alternating rows | No | Would help scannability |
| Number alignment | Left | Should be right-aligned |

### Weekly Tracker Table (Page 6)

| Aspect | Current | Issue |
|--------|---------|-------|
| Column widths | 92, 70, 70, 70, 70, 70, 70px | Day columns too narrow |
| Header height | 16px | ✅ Good |
| Row height | 28px | ✅ Good for writing |
| Cell borders | Vertical lines | ✅ Good for form |
| Activity label bg | Light gray | ✅ Good distinction |

---

## PART 7: PAGE-BY-PAGE AUDIT

### PAGE 1: Your Path to the Goal
**Score: 7/10**

**What Works:**
- Gold income box is eye-catching and prominent
- "Backward math" flow is clear (income → sales → sources)
- Green "Starting Position" box effectively shows existing book value
- Checklist with checkboxes is actionable

**What Needs Improvement:**
- Lead sources table column widths need adjustment
- Summary box text could be larger (currently 9pt for important message)
- Too much content competing on one page
- 7pt footnote text in seasonality note is too small

**Specific Fixes:**
| Line | Issue | Current | Should Be |
|------|-------|---------|-----------|
| 631 | Table column positions | `[MARGIN + 8, MARGIN + 110, MARGIN + 280, MARGIN + 360]` | Redistribute for balance |
| 690-702 | Summary text size | 9pt, 8pt | 10pt, 9pt |
| 786-787 | Seasonality text | 7pt | 8pt |

---

### PAGE 2: Channel Playbook
**Score: 6/10**

**What Works:**
- Consistent card styling with gold accent bar
- Script boxes provide visual variety
- Close rate + velocity on each card

**What Needs Improvement:**
- All cards look identical - no visual priority
- Cards could be taller for more breathing room
- "TARGET:" label at 6pt is too small
- Setup instructions were removed (were only on primary cards)

**Specific Fixes:**
| Line | Issue | Current | Should Be |
|------|-------|---------|-----------|
| 803 | Card height | 58px | 68px for more room |
| 829 | TARGET label size | 6pt | 7pt |
| - | Missing | No differentiation | Add subtle highlight to "best" channel |

---

### PAGE 3: What You're Building
**Score: 8/10**

**What Works:**
- 5-year table is clean and scannable
- Stay vs Quit comparison is emotionally compelling
- "What This Means" gold callout is memorable

**What Needs Improvement:**
- Numbers should be right-aligned in table
- Footnotes at 6pt are too small
- "Stay" box text could be more prominent

**Specific Fixes:**
| Line | Issue | Current | Should Be |
|------|-------|---------|-----------|
| 899-902 | Number alignment | Left-aligned | Right-align numerical columns |
| 908-910 | Footnote size | 6pt | 7pt |
| 930 | Stay income | 8pt bold | 10pt bold (it's the punchline) |

---

### PAGE 4: The Mindset
**Score: 6/10**

**What Works:**
- Numbered principles create clear progression
- Gold "truth" statements stand out
- Detail text provides context

**What Needs Improvement:**
- All 5 cards identical weight
- First principle should be visually dominant
- Card height (50px) feels cramped for 3 lines of text
- Intro text at 7pt is too small

**Specific Fixes:**
| Line | Issue | Current | Should Be |
|------|-------|---------|-----------|
| 963 | Intro text | 7pt | 8pt |
| 976 | Card height | 50px | 56px |
| 989 | Number size | 14pt | 18pt for #1, 14pt for others |

---

### PAGE 5: Your Week
**Score: 5/10**

**What Works:**
- Rules with stats (78%, 80%, 4x, 10x) are memorable
- Weekly rhythm table is practical
- First Week Checklist is actionable

**What Needs Improvement:**
- Two major sections compete for attention
- Rhythm table row height (14px) is cramped
- First Week Checklist gets lost at bottom
- Too much content for one page

**Specific Fixes:**
| Line | Issue | Current | Should Be |
|------|-------|---------|-----------|
| 1046 | Rhythm header | 10pt | 9pt (subordinate to Rules) |
| 1067 | Rhythm row height | 14px | 16px |
| 1104 | Checklist text | 8pt | 9pt (important section) |

---

### PAGE 6: Weekly Tracker
**Score: 7/10**

**What Works:**
- Form format is clear and printable
- "Behind Pace" callout provides help
- Weekly Reflection section encourages habit

**What Needs Improvement:**
- Day columns (70px) too narrow for writing
- Target labels at 6pt are hard to read
- "Behind Pace" header mentions "Client Care" even if agent has no book

**Specific Fixes:**
| Line | Issue | Current | Should Be |
|------|-------|---------|-----------|
| 1125 | Column spacing | 70px per day | 80px per day |
| 1187 | Target label size | 6pt | 7pt |
| 1213 | Conditional text | Always says "Client Care" | Dynamic based on book_size |

---

### PAGE 7: Quick Reference
**Score: 8/10**

**What Works:**
- Big number boxes are immediately scannable
- Daily checklist is clear and actionable
- "When You're Stuck" is helpful
- Final quote is memorable

**What Needs Improvement:**
- Lead sources list could have better spacing
- "When You're Stuck" boxes feel cramped
- Final TIG logo/line could be more prominent

**Specific Fixes:**
| Line | Issue | Current | Should Be |
|------|-------|---------|-----------|
| 1309 | Source row spacing | 14px | 16px |
| 1352 | Stuck box height | 32px | 36px |
| 1376 | Final TIG text | 9pt | 10pt |

---

### PAGE 8: Glossary
**Score: 7/10**

**What Works:**
- Clear term/definition format
- Medicare vs TIG sections separated
- Compliance reminder stands out in red

**What Needs Improvement:**
- Term definitions at 7pt are small
- TIG terms section uses different styling (gray background)
- Could use more visual hierarchy

**Specific Fixes:**
| Line | Issue | Current | Should Be |
|------|-------|---------|-----------|
| 1415 | Definition text | 7pt | 8pt |
| 1447 | TIG definition text | 7pt | 8pt |
| 1443 | TIG term background | Gray | Same white as Medicare (consistency) |

---

## PART 8: CONSISTENCY ACROSS PAGES

### Header Consistency ✅
- All pages: Same position, same styling
- Logo at MARGIN, 28x28px
- "STRATEGIC GROWTH PLAN" 12pt bold
- Page subtitle 7pt gold

### Footer Consistency ✅
- Line at y=24
- "Tyler Insurance Group | Confidential" left
- "Page X of 8" right
- Both 6pt (too small but consistent)

### Section Header Inconsistency ⚠️
| Page | Header | Size | Style |
|------|--------|------|-------|
| 1 | YOUR LEAD SOURCES | 9pt | Bold charcoal |
| 2 | YOUR CHANNEL PLAYBOOK | 10pt | Bold charcoal |
| 3 | STARTING POSITION | 9pt | Bold charcoal |
| 4 | WHAT ACTUALLY MATTERS | 10pt | Bold charcoal |
| 5 | THE RULES | 10pt | Bold charcoal |
| 6 | WEEK OF | 9pt | Bold charcoal |
| 7 | DAILY CHECKLIST | 9pt | Bold charcoal |
| 8 | MEDICARE TERMS | 10pt | Bold charcoal |

**Issue:** Mix of 9pt and 10pt for same element type.

### Box/Card Styling Inconsistency ⚠️
| Element | Border Radius | Border | Background |
|---------|---------------|--------|------------|
| Income box | 0 (sharp) | None | Gold solid |
| Source rows | 0 | 0.5px bottom | White |
| Channel cards | 0 | 1px full | Light gray |
| Principle cards | 0 | 1px full | Light gray |
| Rules cards | 0 | 1px full | Light gray |
| Summary box | 0 | 1px full | Varies (semantic) |

**Note:** PDF lib doesn't support border-radius, so all corners are sharp. This is acceptable.

---

## PART 9: INFORMATION DENSITY

### Overwhelming Pages
- **Page 1:** Too much content - income box, lead sources table, summary, seminars, checklist, review date, AND seasonality note
- **Page 5:** Rules + Rhythm + First Week Checklist all compete

### Sparse Pages
- **Page 2:** Only 4 channel cards - could add more guidance
- **Page 8:** Glossary has lots of whitespace at bottom

### Content That Could Be Removed
- Seasonality Note (Page 1) - duplicates AEP principle on Page 4
- "6-Touch Rule" stat "80%" - unclear what it means

### Content That Could Be Combined
- Pages 5 & 6 could merge (Rules + Tracker)
- First Week Checklist could move to Page 6 (near tracker)

### Unnecessary Repetition
- Income goal shown: Page 1 (3x), Page 7 (1x) - OK
- Sales goal shown: Page 1 (2x), Page 6 (1x), Page 7 (1x) - OK
- Lead sources: Page 1, Page 7 - acceptable for reference page

---

## PART 10: PRINT READINESS

### Text Readability
| Size | Print Readable? | Issue |
|------|-----------------|-------|
| 6pt | ❌ No | Footer, labels - will be illegible |
| 7pt | ⚠️ Marginal | Captions, subtitles - elderly agents may struggle |
| 8pt+ | ✅ Yes | Main content is fine |

### Color Print-Friendliness
| Color | Prints Well? | B&W? |
|-------|--------------|------|
| GOLD | ⚠️ May appear brown | Becomes dark gray |
| GREEN_LIGHT | ✅ Yes | Light gray |
| ORANGE_LIGHT | ✅ Yes | Light gray |
| RED_LIGHT | ✅ Yes | Light gray |
| PURPLE_LIGHT | ✅ Yes | Light gray |

**B&W Printing Concern:** Gold text on white will have low contrast in grayscale.

### Page Break Logic
- All pages have page break checks (`if (y - height < 60)`) ✅
- Footer zone protected (60px from bottom) ✅
- No content should overflow

### Landscape Candidates
- Page 6 (Weekly Tracker) would benefit from landscape for wider day columns
- All other pages work in portrait

---

## CRITICAL FIXES (Must Do)

| Page | Issue | Current | Should Be | Line # |
|------|-------|---------|-----------|--------|
| 1 | **ENCODING BUG** | Unicode arrow "→" | ASCII arrow "->" | 731 |
| All | Footer text size | 6pt | 7pt minimum | 567-568 |
| All | Section header sizes | Mix 9-10pt | All 10pt | Various |
| 1 | Expected column position | MARGIN + 450 | Redistribute columns | 633 |
| 3 | Number alignment | Left | Right-align numbers | 899-902 |
| 6 | Day column width | 70px | 80px | 1125 |

---

## RECOMMENDED FIXES (Should Do)

| Page | Issue | Current | Should Be | Line # |
|------|-------|---------|-----------|--------|
| 1 | Summary text size | 9pt, 8pt | 10pt, 9pt | 690-702 |
| 1 | Seasonality note | 7pt body | 8pt body | 786-787 |
| 2 | Card height | 58px | 68px | 803 |
| 2 | TARGET label | 6pt | 7pt | 829 |
| 4 | Intro text | 7pt | 8pt | 963 |
| 4 | Card height | 50px | 56px | 976 |
| 5 | Rhythm row height | 14px | 16px | 1067 |
| 6 | Target label size | 6pt | 7pt | 1187 |
| 8 | Definition text | 7pt | 8pt | 1415, 1447 |

---

## POLISH FIXES (Nice to Have)

| Page | Issue | Current | Should Be | Line # |
|------|-------|---------|-----------|--------|
| 1 | Alternating row colors | None | Light gray every other | 646-672 |
| 2 | Primary channel highlight | Removed | Add subtle gold bg for best channel | 812 |
| 3 | Stay box income | 8pt bold | 10pt bold | 930 |
| 4 | First principle | Same as others | 18pt number, gold border | 989 |
| 5 | Checklist text | 8pt | 9pt | 1104 |
| 7 | Stuck box height | 32px | 36px | 1352 |
| 7 | Final TIG text | 9pt | 10pt | 1376 |
| 8 | TIG background | Gray | White (match Medicare) | 1443 |

---

## TYPOGRAPHY SYSTEM RECOMMENDATION

**Current:** 10 different font sizes (chaos)
**Recommended:** 5 sizes with clear purpose

| Size | Purpose |
|------|---------|
| 28pt | Hero numbers (income, sales on Page 7) |
| 12pt | Page titles, major emphasis |
| 10pt | Section headers, important labels |
| 8pt | Body text, table content |
| 7pt | Captions, footnotes (absolute minimum) |

**Remove:** 6pt, 9pt, 14pt, 16pt, 18pt (consolidate into above)

---

## SPACING SYSTEM RECOMMENDATION

**Current:** 8px, 10px, 12px, 14px, 16px, 18px (chaos)
**Recommended:** 3 values based on 8px grid

| Gap | Purpose |
|-----|---------|
| 8px | Tight (within a group) |
| 16px | Standard (between items) |
| 24px | Section break |

---

## CONCLUSION

The Growth Plan PDF has a solid foundation with good use of brand colors and logical information architecture. The critical encoding bug must be fixed immediately. After that, the main improvements needed are:

1. **Standardize typography** to 5 sizes
2. **Increase minimum text size** from 6pt to 7pt
3. **Apply consistent spacing** using 8px grid
4. **Right-align numerical data** in tables
5. **Widen tracker columns** for print usability

With these fixes, the PDF would improve from 6.5/10 to approximately 8/10 quality.
