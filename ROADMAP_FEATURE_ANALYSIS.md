# Strategic Growth Roadmap Generator - Feature Analysis

**Document Purpose:** Complete analysis of the Roadmap Generator feature for planning, development tracking, and AI-assisted ideation.

**Last Updated:** January 16, 2026

---

## 1. Feature Overview

### What It Does
The Strategic Growth Roadmap Generator creates personalized business development plans for insurance brokers. Managers input broker profile data (experience, personality, resources), and the system generates a customized PDF roadmap with:
- Experience phase classification (Foundation/Growth/Expansion)
- Recommended lead generation channels with allocations
- Weekly action plans
- 30-day review dates

### Business Value
- **For Managers:** Standardized onboarding tool, consistent coaching framework
- **For Brokers:** Clear action plan, realistic expectations, measurable goals
- **For TIG:** Scalable training methodology, data on what channels work

---

## 2. What Has Been Built ✅

### Frontend Components

| File | Status | Description |
|------|--------|-------------|
| `src/types/roadmap.ts` | ✅ Complete | TypeScript interfaces for BrokerProfile, GrowthChannel, ExperiencePhase, form options |
| `src/hooks/useRoadmapGenerator.ts` | ✅ Complete | Hook for API calls, CRUD operations, PDF download |
| `src/components/roadmap/BrokerProfileForm.tsx` | ✅ Complete | Form with 4 sections: Broker Info, Goals, Profile Assessment, Resources |
| `src/pages/admin/RoadmapGeneratorPage.tsx` | ✅ Complete | Main page with list/create/edit views, delete confirmation |

### Backend

| File | Status | Description |
|------|--------|-------------|
| `supabase/functions/generate-roadmap-pdf/index.ts` | ✅ Complete | Edge function: phase logic, channel recommendations, PDF generation |

### Routing & Navigation

| Item | Status | Description |
|------|--------|-------------|
| Route in `App.tsx` | ✅ Complete | `/admin/roadmaps` route with `requireAdmin` protection |
| Admin Dashboard link | ✅ Complete | "Roadmaps" button in Quick Actions with Map icon |

---

## 3. What Has NOT Been Built ❌

### Database

| Item | Status | Notes |
|------|--------|-------|
| `broker_roadmaps` table | ❌ NOT CREATED | The Supabase table doesn't exist yet |
| Row Level Security (RLS) | ❌ NOT CREATED | Policies needed for admin access |
| Database types regeneration | ❌ NOT DONE | `src/integrations/supabase/types.ts` needs updating |

### Edge Function Deployment

| Item | Status | Notes |
|------|--------|-------|
| Deploy edge function | ❌ NOT DEPLOYED | Need to run `supabase functions deploy generate-roadmap-pdf` |
| Environment variables | ⚠️ Should exist | Uses existing `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` |

### Storage

| Item | Status | Notes |
|------|--------|-------|
| Storage bucket policy | ⚠️ May need update | PDFs save to `contracting-documents/roadmaps/` - bucket exists but path may need policy |

---

## 4. Database Schema Required

### Table: `broker_roadmaps`

```sql
CREATE TABLE broker_roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Links
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  manager_id UUID,
  created_by UUID REFERENCES auth.users(id),

  -- Broker Information
  broker_name TEXT NOT NULL,
  manager_name TEXT NOT NULL,
  months_in_business INTEGER DEFAULT 0,
  book_size INTEGER DEFAULT 0,

  -- Goals
  monthly_goal INTEGER DEFAULT 6,

  -- Profile Assessment
  personality TEXT CHECK (personality IN ('Introvert', 'Extrovert', 'Ambivert')) DEFAULT 'Ambivert',
  phone_comfort INTEGER CHECK (phone_comfort BETWEEN 1 AND 5) DEFAULT 3,
  community_connections BOOLEAN DEFAULT FALSE,
  strengths TEXT,

  -- Resource Access
  mira_access BOOLEAN DEFAULT FALSE,
  seminar_assigned BOOLEAN DEFAULT FALSE,
  seminar_dates JSONB,

  -- Generated Data
  experience_phase TEXT,
  assigned_channels JSONB,
  last_generated_at TIMESTAMPTZ,
  pdf_storage_path TEXT,
  review_date DATE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by manager
CREATE INDEX idx_broker_roadmaps_manager ON broker_roadmaps(manager_id);
CREATE INDEX idx_broker_roadmaps_created_by ON broker_roadmaps(created_by);

-- Updated_at trigger
CREATE TRIGGER update_broker_roadmaps_updated_at
  BEFORE UPDATE ON broker_roadmaps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### RLS Policies

```sql
-- Enable RLS
ALTER TABLE broker_roadmaps ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins full access to broker_roadmaps"
  ON broker_roadmaps
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin', 'manager')
    )
  );

-- Managers can see their own created roadmaps
CREATE POLICY "Managers see own roadmaps"
  ON broker_roadmaps
  FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());
```

---

## 5. Deployment Checklist

### Before Going Live

- [ ] **Create database table** - Run the SQL above in Supabase SQL Editor
- [ ] **Add RLS policies** - Run the policy SQL
- [ ] **Deploy edge function** - `supabase functions deploy generate-roadmap-pdf`
- [ ] **Regenerate types** - `supabase gen types typescript --local > src/integrations/supabase/types.ts`
- [ ] **Test the flow** - Create a roadmap, generate PDF, verify download

### Optional Enhancements Before Launch

- [ ] Add storage policy for `roadmaps/` path if needed
- [ ] Add activity logging for roadmap generation
- [ ] Add email notification to broker when roadmap is created

---

## 6. Technical Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  RoadmapGeneratorPage.tsx                                       │
│       │                                                          │
│       ├── BrokerProfileForm.tsx (data entry)                    │
│       │                                                          │
│       └── useRoadmapGenerator.ts (hook)                         │
│               │                                                  │
│               ├── saveBrokerProfile() ──► Supabase DB           │
│               │                                                  │
│               └── generateRoadmap() ──► Edge Function           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Edge Function (Deno)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  generate-roadmap-pdf/index.ts                                  │
│       │                                                          │
│       ├── getExperiencePhase() ──► Foundation/Growth/Expansion  │
│       │                                                          │
│       ├── recommendChannels() ──► Array of GrowthChannel        │
│       │       │                                                  │
│       │       ├── MIRA Portal (if access + phone comfort)       │
│       │       ├── Seminars (if assigned)                        │
│       │       ├── Community (if connections/extrovert)          │
│       │       ├── Referrals (weighted by book size)             │
│       │       ├── Phone Prospecting (if high phone comfort)     │
│       │       ├── Digital Marketing (if introvert)              │
│       │       └── Field Marketing (if extrovert + low phone)    │
│       │                                                          │
│       └── generatePdf() ──► 3-page PDF via pdf-lib              │
│               │                                                  │
│               └── Returns base64 + metadata                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Supabase                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Database: broker_roadmaps table                                │
│  Storage: contracting-documents/roadmaps/{id}/{filename}.pdf    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Channel Recommendation Logic

### Current Algorithm

The `recommendChannels()` function uses a rule-based approach:

```
IF mira_access AND phone_comfort >= 3:
    ADD MIRA Portal (25-40% based on phone comfort)

IF seminar_assigned:
    ADD Seminars (30%)

IF community_connections OR personality == 'Extrovert':
    ADD Community Partnerships (25%)

IF book_size >= 20:
    ADD Referrals (15-35% scaled by book size)
ELSE IF book_size >= 5:
    ADD Referrals (15%)

IF phone_comfort >= 4 AND remaining >= 15:
    ADD Phone Prospecting (20%)

IF personality == 'Introvert' AND remaining >= 15:
    ADD Digital Marketing (20%)

IF personality == 'Extrovert' AND phone_comfort <= 2 AND remaining >= 15:
    ADD Door-to-Door (25%)

FILL remaining with Networking/Events based on personality
```

### Potential Improvements

1. **Machine Learning** - Train on actual broker success data
2. **A/B Testing** - Compare different allocation strategies
3. **Market Factors** - Adjust for geographic/seasonal trends
4. **Historical Performance** - Weight channels by past success for similar profiles

---

## 8. PDF Content Structure

### Page 1: Cover & Overview
- Header with TIG branding
- Broker name, manager, date
- Profile summary (experience, book size, goals, traits)
- Experience phase explanation
- 30-day review date callout

### Page 2: Channel Strategy
- Each channel in a card format:
  - Name + allocation percentage + plan count
  - Close rate, velocity, weekly volume
  - Follow-up instructions
  - Personalized rationale

### Page 3: Weekly Action Plan
- Monday-Wednesday: Primary prospecting checklist
- Thursday-Friday: Follow-up & appointments
- Saturday (optional): Relationship building
- Key metrics to track

---

## 9. Known Limitations & Gaps

### Current Limitations

1. **No AI Integration** - Channel recommendations are rule-based, not AI-generated
2. **Static PDF** - No interactive elements, can't track completion
3. **No Broker Access** - Brokers can't view their own roadmaps (admin-only)
4. **No Version History** - Regenerating overwrites previous roadmap
5. **No Progress Tracking** - No way to mark tasks complete or log activities

### Missing Features for Full Product

1. **Broker Portal View** - Let brokers see their roadmap
2. **Progress Tracking** - Checkboxes, weekly check-ins
3. **Analytics Dashboard** - Which channels actually produce results
4. **Email Delivery** - Send PDF to broker automatically
5. **Calendar Integration** - Push review date to Google Calendar
6. **Mobile View** - Responsive roadmap viewer (not just PDF)

---

## 10. Ideas for Future Development

### Near-Term (Quick Wins)

- [ ] Add email delivery when roadmap is generated
- [ ] Show roadmap history (previous generations)
- [ ] Add "duplicate" button to clone a profile
- [ ] Link broker profile to actual `profiles` table user

### Medium-Term (Valuable Additions)

- [ ] Broker self-service portal to view their roadmap
- [ ] Weekly check-in form for brokers to report progress
- [ ] Manager dashboard showing all broker roadmaps
- [ ] Compare actual results vs projected (after 30/60/90 days)

### Long-Term (Product Evolution)

- [ ] AI-powered recommendations using Claude API
- [ ] Dynamic roadmap that adjusts based on weekly results
- [ ] Integration with CRM for automatic activity tracking
- [ ] Gamification (badges, leaderboards, streaks)
- [ ] Mobile app with push notification reminders

---

## 11. Testing Scenarios

### Happy Path
1. Admin navigates to `/admin/roadmaps`
2. Clicks "New Roadmap"
3. Fills in broker details
4. Clicks "Generate Roadmap"
5. PDF downloads automatically
6. Roadmap appears in list with "Generated X ago"

### Edge Cases to Test
- [ ] Broker with 0 months experience
- [ ] Broker with no MIRA access, no seminars, no connections
- [ ] Extrovert with phone comfort = 1
- [ ] Introvert with phone comfort = 5
- [ ] Book size = 0 vs book size = 100+
- [ ] Very long broker name (50+ chars)
- [ ] Special characters in name
- [ ] Generate → Edit → Regenerate flow

### Error Cases
- [ ] Network failure during generation
- [ ] Edge function timeout (large PDF)
- [ ] Database save failure
- [ ] Missing required field validation

---

## 12. Files Reference

### Frontend
```
src/
├── types/
│   └── roadmap.ts                    # TypeScript interfaces
├── hooks/
│   └── useRoadmapGenerator.ts        # API hook
├── components/
│   └── roadmap/
│       └── BrokerProfileForm.tsx     # Form component
├── pages/
│   └── admin/
│       └── RoadmapGeneratorPage.tsx  # Main page
└── App.tsx                           # Route added
```

### Backend
```
supabase/
└── functions/
    └── generate-roadmap-pdf/
        └── index.ts                  # Edge function
```

### Documentation
```
ROADMAP_GENERATOR_CONTEXT.md          # Context for Claude sessions
ROADMAP_FEATURE_ANALYSIS.md           # This file
```

---

## 13. Questions for Product Decisions

1. **Who should see roadmaps?** Just admins/managers, or brokers too?
2. **Should roadmaps link to existing profiles?** Or stay standalone?
3. **How long to keep generated PDFs?** Forever, 1 year, until regenerated?
4. **Should we notify brokers?** Email when roadmap is created/updated?
5. **Review cadence?** Always 30 days, or configurable?
6. **Channel customization?** Can managers override AI recommendations?

---

## 14. Summary

### What Works Now
- Full UI for creating/editing broker profiles
- PDF generation with personalized channel recommendations
- List view with edit/delete/regenerate
- Admin-only access via protected route

### What's Blocking Launch
1. **Database table doesn't exist** - Must create `broker_roadmaps`
2. **Edge function not deployed** - Must deploy to Supabase
3. **Types not regenerated** - Will cause TypeScript errors

### Estimated Effort to Complete
- Database setup: 15 minutes
- Edge function deployment: 5 minutes
- Types regeneration: 5 minutes
- Testing: 30 minutes
- **Total: ~1 hour to production-ready**

---

*This document should be updated as the feature evolves.*
