# TIG Platform TODO

---

## 🎯 Today (Pick ONE)
- [ ] Complete Supabase Migration (Phase 0.5) - BLOCKS EVERYTHING ELSE

---

## Phase 0.5: Migrate Off Lovable to Your Own Supabase
> WHY: Lovable controls your database. You can't access logs, deploy edge functions, 
> or debug issues. PDF generation doesn't work because edge function was never deployed.
> You need full control of your backend.

### Step 1: Create Your Own Supabase Project
- [ ] Go to supabase.com, sign up with austin@tylerinsurancegroup.com
- [ ] Create new project, name it "TIG Platform" 
- [ ] Pick region: US East (closest to Kentucky)
- [ ] Save the new project URL and anon key somewhere safe
- [ ] NOTE: This gives you a fresh, empty database you fully control

### Step 2: Export Schema from Lovable
- [ ] In Lovable, ask: "Export my complete database schema as SQL"
- [ ] Save the SQL file to TIG Platform folder
- [ ] NOTE: Schema = the structure (tables, columns) without data

### Step 3: Create Tables in New Supabase
- [ ] In YOUR Supabase: SQL Editor → paste schema → Run
- [ ] Verify tables appear: profiles, contracting_applications, carriers, etc.
- [ ] NOTE: Now you have the same structure, just empty

### Step 4: Export & Import Data
- [ ] In Lovable, ask: "Export all data from carriers table as CSV"
- [ ] In Lovable, ask: "Export all data from [other tables] as CSV"
- [ ] In YOUR Supabase: Table Editor → Import CSV for each table
- [ ] NOTE: Skip profiles table - we'll create users fresh

### Step 5: Set Up Auth Users
- [ ] In YOUR Supabase: Authentication → Users → Add user
- [ ] Add: austin@tylerinsurancegroup.com (super_admin)
- [ ] Add: andrew@tylerinsurancegroup.com (admin)
- [ ] Add: caroline@tylerinsurancegroup.com (admin)
- [ ] Set temporary passwords, share with Andrew/Caroline
- [ ] NOTE: Can't migrate passwords, so fresh accounts needed

### Step 6: Deploy Edge Functions
- [ ] Install Supabase CLI: npm install -g supabase
- [ ] Run: supabase login
- [ ] Run: supabase link --project-ref [your-new-project-id]
- [ ] Run: supabase functions deploy generate-contracting-pdf
- [ ] NOTE: This deploys the PDF generator that was never deployed in Lovable

### Step 7: Update Your Code
- [ ] Open .env file in Cursor
- [ ] Replace VITE_SUPABASE_PROJECT_ID with new project ID
- [ ] Replace VITE_SUPABASE_URL with new project URL
- [ ] Replace VITE_SUPABASE_PUBLISHABLE_KEY with new anon key
- [ ] NOTE: Now your app talks to YOUR Supabase, not Lovable's

### Step 8: Update Vercel
- [ ] Go to Vercel dashboard → TIG project → Settings → Environment Variables
- [ ] Update the same 3 variables with new values
- [ ] Redeploy the site
- [ ] NOTE: Live site now uses your Supabase too

### Step 9: Test Everything
- [ ] Test login on localhost
- [ ] Test login on tigagenthub.com
- [ ] Test contracting form submission
- [ ] Test PDF generation
- [ ] NOTE: If all works, you're free from Lovable!

### Step 10: Downgrade Lovable
- [ ] Once confirmed working, downgrade Lovable plan
- [ ] Keep code repo on GitHub (you already have this)
- [ ] NOTE: Save money, no longer need Lovable

---

## Phase 0: Verify Current State (AFTER MIGRATION)
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

---

## Done ✓
- [x] Migrated to Cursor + Vercel
- [x] Set up local dev environment
- [x] Fixed PDF storage - pass user_id to edge function
- [x] Fixed document viewer - open in new tab
- [x] Set up test files folder for form testing
- [x] Created workflow system (this TODO!)

---

## Notes
_Quick notes during sessions_

Current blocker: Can't access Supabase dashboard because Lovable owns it.
PDF doesn't generate because edge function was never deployed.
Migration fixes both problems.

---

## Session Startup Checklist
1. Open Cursor
2. Terminal: `git pull`
3. Terminal: `npm run dev`
4. Open Chrome tabs (localhost, Supabase, Table Editor)
5. Open TODO.md - pick ONE task
6. Work until done or stuck
7. Commit working code
8. Update TODO.md

## Session End Checklist
1. Commit any working changes
2. Push if ready for live
3. Update TODO.md
4. Note where you left off
