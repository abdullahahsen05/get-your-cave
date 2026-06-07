# GetYourCave — Local-Only Setup (Hosting Removed)

_Last updated: 2026-06-05_

> **Status:** This project is **no longer hosted**. The Vercel deployment and the
> Supabase connection were intentionally removed. The project now runs **locally
> only**, against a local PostgreSQL database. This file replaces the previous
> Vercel/Supabase deployment handoff.

## What was removed

| Item | Action taken |
|------|--------------|
| Vercel project `getyourcave` | **Deleted** (hosted URL `getyourcave.vercel.app` no longer served) |
| GitHub → Vercel auto-deploy | Disconnected (Vercel side deleted) |
| Local `.vercel/` link directory | Removed |
| Build script `prisma generate && next build` | Reverted to `next build` (Vercel-specific step removed) |
| Prisma pg-pool SSL for hosted DB | Reverted (was only needed for Supabase/hosted connections) |

## What was kept / untouched

- **GitHub repository** — intact (nothing force-pushed; local `main` carries the two revert commits locally only).
- **Supabase project** `gdqrsoiarzhfwtjfxjju` — left intact in the Supabase dashboard (kept, just no longer used). Delete manually later if desired via _Dashboard → Project Settings → General → Delete project_ (permanent).
- **Local PostgreSQL database** — never reset, dropped, or migrated.
- **Stripe / SMTP / AUTH** environment values — unchanged.
- **Application bug fixes & all Prisma migrations** — retained.
- Backup branch **`backup-before-revert`** — snapshot of pre-revert state.

## Current local configuration

- `DATABASE_URL` → local PostgreSQL (`localhost:5432/getyourcave`)
- `NEXT_PUBLIC_APP_URL=http://localhost:3000`
- Stripe webhooks for local testing: use ngrok (`npm run ngrok`) and a local webhook secret.

## Required environment variables (names only)

`DATABASE_URL`, `AUTH_SECRET`, `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`,
`STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`,
`SMTP_USER`, `SMTP_APP_PASSWORD`, `SMTP_FROM_EMAIL`.

## Verified working locally (2026-06-05)

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | ✅ PASS |
| `npx next build` | ✅ PASS |
| Local Postgres connectivity (`SELECT 1`) | ✅ OK |

## Run locally

```
npm run dev      # custom server.ts (Socket.IO) → http://localhost:3000
```

Running via `server.ts` means real-time features (notification bells, toasts,
messaging) work locally — these are the features that did **not** work on Vercel
serverless, which was one reason hosting was removed.

## If you want to host again later

Re-link Vercel (`vercel link`), re-add the build-step `prisma generate`, point
`DATABASE_URL` at a hosted Postgres (Supabase/Neon/RDS) with SSL re-enabled, and
register a production-specific Stripe webhook. Until then, none of that is needed.
