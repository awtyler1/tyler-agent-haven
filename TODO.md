# TIG Platform TODO

---

## 🎯 Today (Pick ONE)
- [ ] Test PDF generation with contracting form submission (Phase 0)

---

## Phase 0: Verify Current State
> Before improving anything, confirm what works and what's broken

- [ ] Log in as test agent in Edge/Incognito
- [ ] Complete contracting form (note any issues)
- [ ] Submit the form
- [ ] Log in as admin in Chrome
- [ ] Check contracting queue - does submission appear?
- [ ] Check if PDF is attached
- [ ] Check if documents open in new tab
- [ ] Write down what worked and what didn't

---

## Phase 1: User Routing (Foundation)
> Right people need to see right screens

- [ ] Map current routing logic: where does code decide who sees what?
- [ ] Document what SHOULD happen for each user type
- [ ] Fix routing for admins to skip contracting
- [ ] Fix routing for existing agents to skip contracting
- [ ] Test all three user types

---

## Phase 2: PDF + Documents in Queue
> Caroline can't work without this

- [ ] Verify PDF generates correctly after form submit
- [ ] Verify PDF saves to storage with correct path
- [ ] Verify PDF appears in contracting queue detail view
- [ ] Verify uploaded documents appear
- [ ] Verify documents open in new tab

---

## Phase 3: Form Wizard Redesign
> Better agent experience - break into sub-tasks

### 3A: Planning (do with Claude.ai first)
- [ ] Walk through current form, list every field
- [ ] Group fields into logical pages
- [ ] Define validation rules for each page
- [ ] Write acceptance criteria

### 3B-3J: Build wizard pages (see detailed breakdown when ready)

---

## Phase 4: Contracting Queue Redesign
> Better experience for Caroline

- [ ] Document Caroline's ideal workflow
- [ ] Design and build improvements

---

## Phase 5: UI Cleanup (Polish)
> Do this last

- [ ] Remove "Test Mode" banner
- [ ] Hide dev buttons from non-dev users
- [ ] Clean up placeholder text

---

## Backlog (Future Ideas)
- [ ] Agent profile photo upload
- [ ] Email notifications
- [ ] Auto-fill test data button (dev only)
- [ ] Bulk carrier assignment
- [ ] Explore AI powered search
- [ ] Add Andrew and Caroline as admin users

---

## Done ✓
- [x] Migrated to Cursor + Vercel
- [x] Set up local dev environment
- [x] Fixed PDF storage - pass user_id to edge function
- [x] Fixed document viewer - open in new tab
- [x] Set up test files folder for form testing
- [x] Created workflow system (this TODO!)
- [x] **SUPABASE MIGRATION COMPLETE (Dec 24, 2024)**
  - [x] Created new Supabase project under austin@tylerinsurancegroup.com
  - [x] Enabled pgvector extension
  - [x] Exported and imported schema from Lovable
  - [x] Exported and imported carriers data (68 carriers)
  - [x] Exported and imported system_config (email, PDF field mappings, PDF template fields)
  - [x] Created auth user for Austin (super_admin)
  - [x] Created profile and user_roles entries
  - [x] Set up RLS policies for profiles and user_roles tables
  - [x] Updated local .env with new Supabase credentials
  - [x] Updated Vercel environment variables
  - [x] Deployed generate-contracting-pdf edge function via Supabase CLI
  - [x] Created test agent account (independent_agent role)
  - [x] Verified login works on localhost and tigagenthub.com

---

## Key Project Info

### Supabase Project
- **Project ID:** mgczpsrtkdkkjzmztpyd
- **URL:** https://mgczpsrtkdkkjzmztpyd.supabase.co
- **Dashboard:** https://supabase.com/dashboard/project/mgczpsrtkdkkjzmztpyd

### User Roles (app_role enum)
- super_admin
- admin
- manager
- internal_tig_agent
- independent_agent

### Key Tables
- profiles (user_id links to auth.users)
- user_roles (user_id + role)
- carriers (68 insurance carriers)
- system_config (PDF mappings, email config)
- contracting_submissions

---

## Session Startup Checklist
1. Open Cursor
2. Terminal: `git pull`
3. Terminal: `npm run dev`
4. Open Chrome tabs (localhost, Supabase dashboard, Table Editor)
5. Open TODO.md - pick ONE task
6. Work until done or stuck
7. Commit working code
8. Update TODO.md

## Session End Checklist
1. Commit any working changes
2. Push if ready for live
3. Update TODO.md
4. Note where you left off
