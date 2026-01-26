# Agent Platform

Medicare agent onboarding and management platform.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** TailwindCSS + Shadcn/ui
- **Backend:** Supabase (PostgreSQL, Auth, Edge Functions, Storage)
- **Monitoring:** Sentry

## Project Structure

```
src/
├── pages/           # Route components
├── components/      # UI components by feature
├── hooks/           # Custom React hooks
├── lib/             # Business logic utilities
└── integrations/    # Supabase client

supabase/
├── functions/       # Edge functions (Deno)
└── migrations/      # Database migrations

docs/                # Documentation
```

## Documentation

| File | Description |
|------|-------------|
| `CLAUDE.md` | Project context for AI assistants |
| `DESIGN_SYSTEM.md` | UI patterns and design tokens |
| `docs/ARCHITECTURE.md` | Full architecture documentation |
| `docs/CODEBASE_SUMMARY.md` | Feature inventory and quick stats |

## Deployment

- **Production:** Auto-deploys to Vercel on push to `main`
- **Edge Functions:** `npm run deploy:functions`

## Environment

Requires Supabase project with:
- PostgreSQL database with schema from migrations
- Auth configured for email/password
- Storage buckets for documents
- Edge functions deployed
