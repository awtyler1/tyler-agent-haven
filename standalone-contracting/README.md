# TIG Contracting — Standalone

A self-contained, **public**, **stateless** version of the contracting packet
flow extracted from the Agent Platform. An agent opens a link, completes the
12-step wizard, and on submit the filled PDF **plus every uploaded document** is
emailed to the contracting team. Nothing is stored — no database rows, no
storage buckets, no login.

```
Public URL → 12-step wizard → (in memory)
  → generate-contracting-pdf  (fills the PDF template, saveToStorage = false)
  → send-contracting-packet   (emails PDF + all documents to the team)
  → "Packet Submitted" screen → state discarded
```

## What it is / isn't

- **No auth.** There's no login; the agent types their own email in Step 2.
- **No persistence.** Form answers are kept in React state, with a light
  localStorage *draft* (typed fields + signature images only) so a refresh
  mid-flow doesn't lose progress. Uploaded files live only in memory and are
  never written anywhere except the outgoing email. Closing the tab loses
  uploaded files.
- **Two edge functions only.** `generate-contracting-pdf` (pdf-lib field
  mapping) and `send-contracting-packet` (Resend email). Both run with
  `verify_jwt = false`.

## Setup

```bash
npm install
cp .env.example .env   # fill in your Supabase URL + anon key
npm run dev            # http://localhost:8080
```

### Edge function environment (set in the Supabase dashboard)

| Variable | Required | Purpose |
|----------|----------|---------|
| `RESEND_API_KEY` | yes | Resend API key used to send the email |
| `CONTRACTING_TEAM_EMAIL` | no | Recipient (default `caroline@tylerinsurancegroup.com`) |
| `CONTRACTING_FROM_ADDRESS` | no | Verified Resend "from" address |
| `CONTRACTING_REPLY_TO` | no | Reply-to address |
| `CONTRACTING_SUBMIT_SECRET` | no | If set, callers must send a matching `x-contracting-secret` header (basic abuse guard) |

Deploy the functions:

```bash
supabase link --project-ref YOUR-PROJECT-REF
npm run deploy:functions    # or: supabase functions deploy generate-contracting-pdf send-contracting-packet
```

## Production checklist

- [ ] Add the deployed app's domain to `ALLOWED_ORIGINS` in
      `supabase/functions/_shared/cors.ts` (localhost:8080 is already allowed
      for dev).
- [ ] Verify the `CONTRACTING_FROM_ADDRESS` domain in Resend.
- [ ] Decide on abuse protection. Total email size (PDF + docs) should stay
      well under ~40MB; each file is capped at 15MB. Consider setting
      `CONTRACTING_SUBMIT_SECRET` or adding a captcha for a fully public link.
- [ ] The PDF template lives at `public/templates/TIG_Contracting_Packet_SIGNATURES_FIXED.pdf`
      and the field mapping in `generate-contracting-pdf` is tied to it — keep
      them in sync.

## Structure

```
src/
├── components/contracting/   # wizard + 12 section components (copied as-is)
├── components/ui/            # shadcn/ui primitives
├── hooks/
│   ├── useContractingApplication.ts  # IN-MEMORY state + submit→email (rewritten)
│   ├── useContractingPdf.ts          # PDF generation (auth/session stripped)
│   └── useFormValidation.ts          # validation rules (copied as-is)
├── types/contracting.ts      # full application shape + legal questions
└── integrations/supabase/    # anon client used only for functions.invoke

supabase/functions/
├── generate-contracting-pdf/ # pdf-lib template fill
├── send-contracting-packet/  # Resend email (requireAdmin removed)
└── _shared/
```
