# TIG Agent Platform

One-line: The operating system for Medicare agents — onboarding, resources, and tools in one place.

## Stack
- React 18 + TypeScript
- Supabase (auth, database, edge functions, storage)
- Tailwind CSS + shadcn/ui
- Vite

## Commands
- `bun run dev` — Start dev server
- `bun run build` — Build for production
- `bunx supabase functions serve` — Run edge functions locally

## Current Focus
Building the Agent Hub MVP:
- First 90 Days onboarding checklist
- Forms Library (downloadable compliance/enrollment forms)
- Carrier Directory (portals, contacts, phone numbers)
- Certification Tracker (AHIP + carrier certs)
- Dashboard as central hub

## What's Working
- Authentication (login, password reset, set password)
- Contracting Wizard (8-step form, PDF generation)
- Admin Contracting Queue
- RTS Import (Pinnacle Excel → certifications)
- Agent Certifications View (/my-certifications)
- Training Page (video player)
- Role-based access (super_admin, admin, agent)

## What We're NOT Building Yet
- Book of Business (phase 2 — after agents have clients to track)
- Commission Calculator (nice-to-have for recruiting)
- Client storage/CRM features

## Design System
See DESIGN_SYSTEM.md for patterns:
- Cards: rounded-xl, shadow-sm, border-border/50
- List rows: px-5 py-3, hover:bg-muted/30
- Status dots: w-2 h-2 rounded-full (green/amber/red)
- Keep it clean, fast, professional — agents need speed over cleverness

## Database
Key tables: profiles, carrier_appointments, certifications, contracting_submissions
See TIG_PLATFORM_CONTEXT.md for full schema details

## Known Issues
- Microsoft OAuth encryption TODOs (tokens stored unencrypted)
- processing_jobs table exists but unused (can delete or implement later)

## Business Context
See TIG_PLATFORM_CONTEXT.md for:
- Medicare industry terminology
- Role definitions
- Full feature documentation
