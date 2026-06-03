# Vercel deployment checklist

One Git push can deploy both Next.js apps in parallel. Each app is its own Vercel project with its own URL.

## Prerequisites

- Repository connected to Vercel
- pnpm workspace (already configured)
- **Node.js 24.x** on both Vercel projects (Settings → General → Node.js Version)
- Supabase project with API keys (Postgres 17 — see [postgres-17-upgrade.md](./postgres-17-upgrade.md))
- (Mobile) Stripe and Resend accounts for production

## 1. Create projects

Import the repo twice (or add a second project in the team).

### Mobile (`@hof/mobile`)

- **Root Directory:** `apps/mobile`
- **Framework Preset:** Next.js
- **Install Command:** `pnpm install` (run from repo root; leave default if Vercel runs from root)
- **Build Command:** `cd ../.. && pnpm install && pnpm turbo run build --filter=@hof/mobile`
- **Output Directory:** default (`.next`)

### Admin (`@hof/admin`)

- **Root Directory:** `apps/admin`
- **Build Command:** `cd ../.. && pnpm install && pnpm turbo run build --filter=@hof/admin`
- Same install/output defaults as mobile

Optional: enable **Turborepo** remote cache in Project Settings → General.

Both apps use **Next.js 16** with Turbopack (default bundler). No `--webpack` flag is required.

## 2. Domains

| App | Suggested host |
|-----|----------------|
| Mobile | `app.houseoffire.events` (or your member-facing domain) |
| Admin | `admin.houseoffire.events` |

Add domains in each project’s Settings → Domains.

## 3. Environment variables

### Shared (both projects)

Create under **Team Settings → Environment Variables → Shared**, then link to both projects:

| Variable | Notes |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon / publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only; never expose to client bundles |

### Mobile only

| Variable | Notes |
|----------|--------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_SECRET_KEY` | Server-only |
| `STRIPE_WEBHOOK_SECRET` | From Stripe webhook endpoint (mobile URL) |
| `RESEND_API_KEY` | Email API |
| `RESEND_FROM_EMAIL` | Verified sender |
| `NEXT_PUBLIC_APP_URL` | Production mobile URL (e.g. `https://app.houseoffire.events`) |
| `SUPABASE_AUTH_REDIRECT_URLS` | Optional comma-separated extra redirect URLs (localhost callbacks for dev) |
| `QR_HMAC_SECRET` | Long random string for ticket QR signing |

Do **not** add Stripe/Resend keys to the admin project unless you add features that need them.

### Supabase Auth URLs (magic links)

Hosted Supabase does **not** read Vercel env vars for Site URL / redirect allow list. After setting `NEXT_PUBLIC_APP_URL` on Vercel, push auth URL config once from your machine:

```bash
# In .env.local — use production URL for NEXT_PUBLIC_APP_URL
pnpm configure:auth-urls
pnpm verify:auth-urls
```

This sets `site_url` to `NEXT_PUBLIC_APP_URL` and allows `/auth/callback/client` and `/auth/callback` on that domain (plus localhost for local dev).

Local `supabase start` uses the same vars via `supabase/config.toml`. The CLI reads `.env` (not `.env.local`) — copy or symlink from your `.env.local`:

```bash
cp .env.local .env   # or: ln -sf .env.local .env
```

## 4. Stripe webhook (mobile)

1. Stripe Dashboard → Developers → Webhooks → Add endpoint
2. URL: `https://<mobile-production-domain>/api/webhooks/stripe`
3. Select events your app handles (see `apps/mobile/src/app/api/webhooks/stripe/`)
4. Copy signing secret → `STRIPE_WEBHOOK_SECRET` on the **mobile** Vercel project

## 5. Database migrations

Vercel does not run Postgres migrations. From your machine or CI:

```bash
SUPABASE_DB_URL="postgresql://postgres:[PASSWORD]@db.<project-ref>.supabase.co:5432/postgres" \
  pnpm db:migrate
```

Get the URI from Supabase → Project Settings → Database → Connection string.

## 6. Verify

After deploy:

- Mobile: sign-in, event pages, checkout (if enabled)
- Admin: `/login`, dashboard with admin role
- Stripe: send a test webhook from the Dashboard to the mobile endpoint

## What deploys together

| On each `git push` | Separate |
|--------------------|----------|
| Build/deploy mobile and admin (if files changed) | Two URLs, two Vercel projects |
| Shared Supabase backend | `pnpm db:migrate` (manual/CI) |
| Root `.env.local` for local dev only | Production env in Vercel dashboard |
