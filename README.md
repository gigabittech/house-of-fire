# House of Fire

Monorepo for the House of Fire product surfaces — mobile PWA, web, tablet, admin, and the shared design system that powers them all.

> **Status:** Early-stage. Currently houses interactive design prototypes in `design/prototypes/`. Production app packages will land in `apps/` and `packages/` as they're built.

---

## Quick start

### Run the prototype (no install needed)

```bash
# Open directly, or serve it
open index.html
# or
npx serve .
```

### Set up the monorepo toolchain

```bash
# Use the pinned Node version
nvm use

# Install workspace deps
pnpm install

# Environment (one file for all apps)
cp .env.local.example .env.local
# Edit .env.local at the repo root — mobile and admin both load it.

# Common tasks (Turbo orchestrates across workspaces)
pnpm dev          # mobile :3000 + admin :3001
pnpm build        # build everything
pnpm lint         # biome lint
pnpm format       # biome format --write
pnpm typecheck    # tsc across packages
pnpm test         # run tests
```

The prototype is a static React 19 + Babel HTML page (see `index.html` import map). Every screen, sheet, and brand artifact lives as a standalone `.jsx` file under `design/prototypes/` and gets pulled in by `index.html`.

### Stack (production monorepo)

| Layer | Version |
|-------|---------|
| Node.js | 24.x (LTS) |
| pnpm | 10.x |
| Next.js | 16.x (Active LTS) |
| React | 19.x |
| TypeScript | 5.9.x |
| Biome | 2.x |
| Postgres (Supabase) | 17 |

---

## Repository structure

```
house-of-fire/
├── index.html              # Prototype entry point — loads all design/prototypes/*.jsx
├── assets/                 # Brand assets used by the prototype (logos, photos)
│
├── apps/                   # Production app surfaces (to come)
│   ├── mobile/             # iOS/Android — React Native or mobile PWA
│   ├── web/                # Marketing site + member web app
│   ├── tablet/             # Door / tablet surface
│   └── admin/              # Admin dashboard
│
├── packages/               # Shared libraries consumed by apps/
│   ├── ui/                 # Component library (productionized from hof-ui)
│   ├── design-tokens/      # Colors, type, spacing, motion, radii
│   ├── brand/              # Logos, wordmarks, sonic & visual brand assets
│   └── icons/              # Icon set
│
├── design/                 # Design artifacts and explorations
│   └── prototypes/         # Interactive .jsx prototypes (current source of truth)
│
└── docs/                   # Design system docs, guidelines, decision records
```

### Why monorepo

- Shared design tokens, components, and brand assets across every surface
- One place for issues, PRs, and design reviews
- Refactors that touch tokens + ui + apps land atomically
- Small team / early stage — splitting later is easier than merging later

### When to split

Extract a surface into its own repo when it gains an independent team, a wildly different stack, or needs separate access/security boundaries. Until then, keep it in here.

---

## Working with the prototype

The current `index.html` is the live design surface. To add a new screen:

1. Create `design/prototypes/screen-<name>.jsx`
2. At the end of the file, expose components: `Object.assign(window, { ScreenName });`
3. Add a `<script type="text/babel" src="design/prototypes/screen-<name>.jsx"></script>` to `index.html`, **before** `app.jsx`
4. Wire it into `app.jsx` (drop it into a `<DCArtboard>` inside the design canvas)

Asset paths inside `.jsx` files are relative to `index.html`, so `<img src="assets/hof-logo.png" />` works from any prototype file.

### File conventions

- `screen-*.jsx` — full screens (one artboard each)
- `*-sheet.jsx` / `*-sheets.jsx` — modal sheets and overlays
- `hof-ui.jsx` — shared primitives (buttons, cards, type, the wordmark)
- `*-artifacts.jsx` — brand artifacts (emails, tickets, social posts)
- `posts-data.jsx`, `system-states.jsx` — data + state fixtures

---

## Production roadmap

When a surface in `apps/` is ready to start, the path is:

1. **Extract tokens** from `hof-ui.jsx` → `packages/design-tokens/`
2. **Productionize components** from `hof-ui.jsx` + screen files → `packages/ui/`
3. **Stand up the app shell** in `apps/<name>/`, consuming `@hof/ui` and `@hof/design-tokens`
4. **Keep the prototype alive** — `design/prototypes/` stays as the place to explore new ideas before they hit production

### Recommended tooling (when we get there)

- **pnpm workspaces** for package management ✅ configured
- **Turborepo** for task orchestration and caching ✅ configured
- **Changesets** for versioning shared packages ✅ configured
- **Biome** for formatting + linting ✅ configured
- **Playwright** for cross-surface visual regression — add when first app lands

---

## Deploy (Vercel)

Both production apps deploy from **one Git repo** on push. Each app is a separate Vercel project (two URLs). See [docs/deploy-vercel.md](./docs/deploy-vercel.md) for the full checklist.

### Local environment

| Location | Purpose |
|----------|---------|
| `.env.local` (repo root) | Secrets for local dev — loaded by `apps/mobile` and `apps/admin` via `loadEnvConfig` in `next.config.ts` |
| `.env.local.example` | Committed template; copy to `.env.local` |

Do not keep per-app `.env.local` files under `apps/*/` — they are ignored and unused.

### Vercel projects (one-time)

Create **two** projects from the same repository:

| Project | Root directory | Build command |
|---------|----------------|---------------|
| Mobile (member PWA) | `apps/mobile` | `cd ../.. && pnpm install && pnpm turbo run build --filter=@hof/mobile` |
| Admin dashboard | `apps/admin` | `cd ../.. && pnpm install && pnpm turbo run build --filter=@hof/admin` |

Install command (both): `pnpm install` from the monorepo root (Vercel detects the pnpm workspace).

Enable Turborepo remote caching in each project (optional). Attach domains (e.g. `app.` / `admin.` subdomains).

### Environment variables on Vercel

**Team → Settings → Environment Variables → Shared** (attach to both projects):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**Mobile project only:**

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- `NEXT_PUBLIC_APP_URL` (production member app URL)
- `QR_HMAC_SECRET`

Admin does not need Stripe, Resend, or `NEXT_PUBLIC_APP_URL` in production.

### Stripe webhooks

Point the Stripe webhook endpoint at the **mobile** deployment only:

`https://<mobile-domain>/api/webhooks/stripe`

Set `STRIPE_WEBHOOK_SECRET` on the mobile Vercel project from the Stripe Dashboard signing secret.

### Supabase database migrations

Apply schema **before or after** first deploy (not part of Vercel):

```bash
# Connection string: Supabase Dashboard → Project Settings → Database → URI (with password)
SUPABASE_DB_URL="postgresql://postgres:[PASSWORD]@db.<ref>.supabase.co:5432/postgres" \
  pnpm db:migrate
```

Migrations live in `supabase/migrations/` and run in filename order via `scripts/run-migrations.mjs`.

---

## Contributing

See [`CLAUDE.md`](./CLAUDE.md) for conventions enforced across the repo. If you're adding to the prototype, follow the file layout above. If you're starting a production package, open an issue first so we can scope it.
