# House of Fire — Project Status Report

**Generated:** June 3, 2026  
**Repository:** `house-of-fire` (pnpm monorepo)  
**Product:** Custom PWA for houseoffire.events — replaces Eventbrite for a monthly underground electronic music event in Boulder, CO

---

## Executive Summary

House of Fire has moved well beyond the prototype-only stage. The monorepo now includes **two production Next.js 16 apps** (member PWA + admin dashboard), **shared design system packages**, a **full Supabase Postgres schema**, and **27 interactive design prototypes**. Ticketing, checkout, QR codes, community, door operations, and a 10-section admin console are substantially built.

Recent work (from this development cycle) focused on **deployment infrastructure**, **centralized environment configuration**, and **auth fixes** for both mobile sign-in and admin login.

**Overall readiness:** Core attendee and operator flows are implemented. Several Phase 2/3 features, real notification delivery, and production launch tasks remain before go-live.

---

## Table of Contents

1. [What We Have Done](#1-what-we-have-done)
2. [Completed Features](#2-completed-features)
3. [Aspects Taken Care Of](#3-aspects-taken-care-of)
4. [Options & Configuration Created](#4-options--configuration-created)
5. [Pending Work](#5-pending-work)
6. [Design Handoff vs Built](#6-design-handoff-vs-built)
7. [Architecture Overview](#7-architecture-overview)
8. [Manual Steps Before Production](#8-manual-steps-before-production)

---

## 1. What We Have Done

### 1.1 Monorepo & Toolchain

| Area | Status | Details |
|------|--------|---------|
| pnpm workspaces | ✅ Done | Root `package.json`, `pnpm-workspace.yaml` |
| Turborepo | ✅ Done | `turbo.json` — dev, build, lint, typecheck, test |
| TypeScript | ✅ Done | Strict mode, shared `tsconfig.base.json` |
| Biome | ✅ Done | Lint + format across repo |
| Changesets | ✅ Done | Versioning for shared packages |
| Node.js | ✅ Done | Pinned to 24.x LTS via `.nvmrc` |
| Database migrations | ✅ Done | `pnpm db:migrate` via `scripts/run-migrations.mjs` |

### 1.2 Production Apps Built

| App | Package | Port | Purpose |
|-----|---------|------|---------|
| Mobile PWA | `@hof/mobile` | 3000 | Member-facing app — tickets, community, profile, door |
| Admin dashboard | `@hof/admin` | 3001 | Jordan's operational console |

**Not yet built:** `apps/web` (marketing site), `apps/tablet` (standalone door surface — door UI exists in mobile + admin instead)

### 1.3 Shared Packages

| Package | Status | Contents |
|---------|--------|----------|
| `@hof/design-tokens` | ✅ Done | Colors, typography, spacing, radii, motion, breakpoints, CSS custom properties |
| `@hof/ui` | ✅ Done | 20+ production components with Vitest + Storybook |
| `@hof/brand` | ❌ Not created | Planned for logos, wordmarks, brand assets |
| `@hof/icons` | ❌ Not created | Planned icon set |

### 1.4 Design Prototypes

- **27 interactive `.jsx` files** in `design/prototypes/`
- Static entry via root `index.html` (React 19 + Babel in browser)
- Covers all major screens: home, event, checkout, ticket, profile, archive, community, admin, door/tablet, live night, onboarding, settings, and brand artifacts
- Source of truth for UI exploration before productionization

### 1.5 Database (Supabase Postgres)

- **5 SQL migrations** in `supabase/migrations/` (001–004 + all-in-one)
- **No Prisma** — schema managed via SQL + generated `database.types.ts`
- **Seed data:** Edition 24 "Fireversary" (June 26, 2026), 3 ticket tiers, 3 artists, lineup, `FIREFAMILY` discount code
- Row Level Security enabled on all tables
- Triggers: auto-create profile on signup, increment reply counts, increment discount code uses

### 1.6 Recent Development Work (This Cycle)

Based on git history and session work:

| Work Item | Status |
|-----------|--------|
| Centralized `.env.local` at monorepo root | ✅ Done |
| `loadEnvConfig(monorepoRoot, isDev, undefined, true)` in both `next.config.ts` files | ✅ Done |
| Removed duplicate per-app `.env.local` files | ✅ Done |
| Root `.env.local.example` template | ✅ Done |
| Vercel deployment documentation (`docs/deploy-vercel.md`) | ✅ Done |
| README deploy section | ✅ Done |
| `pnpm db:migrate` script | ✅ Done |
| Mobile sign-in env loading fix (Supabase URL fallback to localhost) | ✅ Done |
| Admin login fix (cookie-backed SSR client vs localStorage mismatch) | ✅ Done |
| Admin shared Supabase browser client singleton | ✅ Done |
| Sign-in / checkout / profile real data wiring | ✅ Done |
| Dashboard UI consistency | ✅ Done |
| LTS stack upgrade (Next.js 16, React 19, Node 24) | ✅ Done |

---

## 2. Completed Features

### 2.1 Mobile App — Member PWA

#### Authentication & Onboarding
- Magic-link email sign-in (`/sign-in`)
- Multi-step onboarding (name, email, phone)
- Auth callback handler (`/auth/callback`)
- Dev login route for testing (`/dev/login`)
- Session refresh via `proxy.ts` (Next 16 network boundary)
- Public vs protected route gating

#### Home & Landing
- Member home dashboard with upcoming event hero, countdown, ticket CTA
- Community feed preview
- Newsletter signup
- Public marketing landing page (`/landing`)

#### Events
- Event detail page: tiers, lineup, FAQ, waitlist, map, community posts
- Upcoming event API
- Past events archive with year filter (`/archive`)
- Sold-out waitlist join flow

#### Ticketing & Checkout
- 3-step checkout: Tickets → Account → Payment
- Guest / signup / sign-in account modes
- Stripe PaymentIntent integration (7% HOF platform fee)
- Discount code validation
- Stripe webhook fulfillment
- QR ticket generation (HMAC-signed)
- Ticket screen: QR display, share, calendar (.ics), print/PDF, PNG download
- Refund request flow (member → admin approval)
- Transfer API + accept-transfer page (email via Resend)
- Live night mode (`/live`) — QR, lineup timeline, announcements

#### Community
- 5 channels: general, lineup, recap, help, crew (crew locked in UI)
- Posts, replies, emoji reactions (fire, eyes, heart, music, pray)
- Composer sheet for new posts
- Thread view with replies (`/community/[postId]`)

#### Profile & Settings
- Profile with attendance stats, tickets, posts, referral program
- Settings: notification toggles, payment methods, privacy, help, logout
- Settings persisted to `profiles.settings` JSONB

#### Photos
- Photo upload via signed Supabase Storage URL
- Pending → admin approve/reject workflow
- Archive screen upload entry point

#### Door Operations
- Full door UI (`/door`): QR scan check-in, walk-up sales, live activity feed

#### PWA
- `manifest.webmanifest`
- Service worker (`sw.js`) — network-first + precache
- Offline fallback page (`/offline`)
- Service worker registration (production only)

---

### 2.2 Admin App — Internal Console

#### Authentication
- Email/password login (`/login`)
- Role-based access: `admin` or `crew` only (via `proxy.ts`)
- Unauthorized page for non-admin users
- Dev login shortcut (`/dev/login?role=admin`)
- Cookie-backed Supabase SSR client (fixed session sync with middleware)

#### Dashboard (`/dashboard`)
- KPIs: revenue, tickets sold, check-ins
- Sales chart, tier bars
- Guest list preview
- Photo moderation preview
- CSV export

#### Events Manager (`/events`)
- Event list with stats
- Filter: all / live / draft / past
- Duplicate event

#### Guest List (`/guests`)
- Searchable by name/email
- Tier + status display

#### Door Operations (`/door`)
- QR scan check-in
- Walk-up sales
- Live stats and activity feed

#### Media Moderation (`/media`)
- Pending photo review — approve/reject

#### Members (`/members`)
- Member lookup
- Stats: total, new, crew, return rate, 90-day active

#### Content Moderation (`/mod`)
- Moderation queue
- Pinned posts
- User reports (dismiss/hide)

#### Announcements (`/announce`)
- Compose announcements
- Channel toggles (feed / email / SMS)
- History view

#### Discount Codes (`/codes`)
- Promo codes
- Comp pools (crew / press / goodwill)

#### Financials (`/financials`)
- Revenue by edition
- Refund queue (approve/reject)

#### Navigation
- Sidebar badges for pending photos + moderation count via `/api/admin/nav-counts`

---

### 2.3 API Surface

#### Mobile API Routes (selected)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/events/upcoming` | Next upcoming event + tiers |
| GET | `/api/events/archive` | Past events by year |
| POST | `/api/checkout/intent` | Create Stripe PaymentIntent |
| POST | `/api/checkout/complete` | Fulfill payment |
| POST | `/api/webhooks/stripe` | Stripe webhook handler |
| GET | `/api/tickets/mine` | User's tickets |
| POST | `/api/tickets/[id]/transfer` | Initiate peer transfer |
| GET/PATCH | `/api/accept-transfer` | View/accept transfer |
| GET/POST | `/api/posts` | Community posts |
| POST | `/api/photos/upload-url` | Signed photo upload |
| POST | `/api/door/scan` | Check in ticket |
| POST | `/api/door/sell` | Walk-up door sale |
| POST | `/api/newsletter/subscribe` | Newsletter signup |
| POST | `/api/push/subscribe` | Save web push subscription |

#### Admin API Routes (selected)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/admin/dashboard/metrics` | Sales chart, tier bars, refund count |
| GET/POST | `/api/admin/events` | List/create/duplicate events |
| GET | `/api/admin/guests` | Guest list |
| GET/PATCH | `/api/admin/media` | Photo moderation |
| GET/PATCH | `/api/admin/refunds` | Refund requests |
| GET/POST | `/api/admin/codes` | Discount codes |
| GET/POST | `/api/admin/announce` | Announcements |
| GET | `/api/admin/nav-counts` | Sidebar badge counts |

---

### 2.4 Design System (`@hof/ui`)

Productionized components with tests and Storybook:

- **Layout:** `HofAppShell`, `HofScreen`, `HofBottomNav`, `HofTopBar`, `useBreakpoint`
- **UI:** `HofButton`, `HofCard`, `HofPill`, `HofConfirm`, `HofToast`, `HofSkeleton`, `Icon`
- **Brand:** `HofWordmark`, `HofLogoMark`, `HofPhoto`, `PhotoPlaceholder`, `FakeQR`
- **Feed:** `FeedPost`, `ReactionStrip`, `ChannelTag`, `Avatar`, `FeedSkeletonCard`
- **States:** `EmptyState`, `ErrorState`

---

## 3. Aspects Taken Care Of

### 3.1 Infrastructure & DevOps

| Aspect | How It's Handled |
|--------|------------------|
| Monorepo orchestration | Turborepo with filter-based builds |
| Environment management | Single root `.env.local` loaded by both apps |
| Database schema | Versioned SQL migrations, `pnpm db:migrate` |
| Deployment docs | `docs/deploy-vercel.md` + README deploy section |
| Two-app Vercel strategy | Documented: one repo, two projects, shared env vars |
| Stripe webhooks | Documented: mobile deployment only |

### 3.2 Authentication & Security

| Aspect | How It's Handled |
|--------|------------------|
| Mobile auth | Supabase magic link + session refresh via `proxy.ts` |
| Admin auth | Email/password + cookie-backed SSR client |
| Role-based access | `profiles.role` — admin/crew for admin app |
| Route protection | Public route allowlists in both apps |
| QR ticket signing | HMAC via `QR_HMAC_SECRET` |
| Rate limiting | Checkout: 10 req/min per IP |
| Service role isolation | Server-only Supabase service client |

### 3.3 Payments & Ticketing

| Aspect | How It's Handled |
|--------|------------------|
| Payment processing | Stripe PaymentIntent + Elements |
| Platform fee | 7% HOF fee baked into checkout |
| Discount codes | Validation + usage tracking |
| Ticket fulfillment | Webhook + manual complete endpoint |
| Refunds | Member request → admin approval workflow |
| Transfers | API + email link + accept page (UI stubbed) |
| Waitlist | Join flow for sold-out events |

### 3.3 Content & Community

| Aspect | How It's Handled |
|--------|------------------|
| Community posts | 5 channels, replies, reactions |
| Photo uploads | Signed URL → pending → admin moderation |
| Content reports | User reports with admin dismiss/hide |
| Post moderation | Status field + admin queue |

### 3.4 Door Operations

| Aspect | How It's Handled |
|--------|------------------|
| QR check-in | Scan API in both mobile and admin |
| Walk-up sales | Door sell API |
| Activity feed | Real-time door activity log |
| Stats | Door KPIs endpoint |

### 3.5 Design & Brand

| Aspect | How It's Handled |
|--------|------------------|
| Dark theme only | Design tokens enforce palette |
| Typography | Clash Display + Inter via tokens |
| Mobile-first | 390px breakpoint primary |
| Component library | `@hof/ui` with Storybook |
| Prototypes | 27 screens remain as design exploration surface |

---

## 4. Options & Configuration Created

### 4.1 Environment Variables

Single template at repo root: `.env.local.example`

| Variable | Used By | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Both apps | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Both apps | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Both apps (server) | Admin/service operations |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Mobile | Stripe client |
| `STRIPE_SECRET_KEY` | Mobile | Stripe server |
| `STRIPE_WEBHOOK_SECRET` | Mobile | Webhook verification |
| `RESEND_API_KEY` | Mobile | Transactional email |
| `RESEND_FROM_EMAIL` | Mobile + Supabase Auth SMTP | Sender address |
| `SUPABASE_ACCESS_TOKEN` | Scripts | One-time SMTP config (`pnpm configure:auth-smtp`) |
| `NEXT_PUBLIC_APP_URL` | Mobile | Transfer links, waitlist emails |
| `QR_HMAC_SECRET` | Mobile | Ticket QR signing |
| `SUPABASE_DB_URL` | Migrations | Direct Postgres for `pnpm db:migrate` |

**Vercel split:**
- **Shared (both projects):** Supabase vars
- **Mobile only:** Stripe, Resend, `NEXT_PUBLIC_APP_URL`, `QR_HMAC_SECRET`

### 4.2 Hardcoded Business Rules

| Setting | Value | Location |
|---------|-------|----------|
| HOF platform fee | 7% | `checkout/intent/route.ts` |
| Checkout rate limit | 10 req/min per IP | `rateLimit.ts` |
| Transfer expiry | 7 days | DB default on `ticket_transfers` |
| Service worker cache | `hof-v2` | `public/sw.js` |

### 4.3 User Settings (`profiles.settings` JSONB)

Persisted via Settings screen:
- Push notification toggle
- Other notification preferences

### 4.4 Role Options

| Role | Access |
|------|--------|
| `member` | Mobile app only |
| `crew` | Mobile + admin (limited) |
| `admin` | Mobile + full admin console |

### 4.5 Dev Login Test Accounts

| Role | Email | Password |
|------|-------|----------|
| admin | `admin@hof.test` | `hof-dev-admin` |
| crew | `crew@hof.test` | `hof-dev-crew` |
| member | `member@hof.test` | (mobile magic link) |

Dev shortcut: `http://localhost:3001/dev/login?role=admin`

### 4.6 Community Channels

| Channel | Access |
|---------|--------|
| general | All members |
| lineup | All members |
| recap | All members |
| help | All members |
| crew | Crew/admin only (locked in UI) |

### 4.7 Ticket Tier Status Pills

Available, Selling Fast, Sold Out, Coming Soon — styled per design handoff

### 4.8 Discount Code Pools

crew, press, goodwill — comp pool types in admin codes section

### 4.9 Announcement Channels

feed, email, SMS — toggles in admin announce (email/SMS delivery stubbed)

---

## 5. Pending Work

### 5.1 High Priority — Before Production Launch

| Item | Current State | What's Needed |
|------|---------------|---------------|
| Vercel deployment | Documented only | Create two Vercel projects, attach domains, set env vars |
| Production DB migrations | Script ready | Run `pnpm db:migrate` against production Supabase |
| Stripe webhook (production) | Not configured | Point to mobile domain, set `STRIPE_WEBHOOK_SECRET` |
| Resend domain verification | Dev sender in example | Verify production domain, update `RESEND_FROM_EMAIL` |
| Supabase Auth SMTP | Script available | Run `pnpm configure:auth-smtp` for magic link emails |
| `QR_HMAC_SECRET` (production) | Dev placeholder | Generate long random string for production |
| Real event photos & assets | Checklist unchecked | Obtain from Jordan (see Section 5.5) |

### 5.2 Feature Gaps — Phase 2

| Feature | Status | Notes |
|---------|--------|-------|
| Peer transfer UI | API done, UI disabled | `TransferSheet` exists; button shows "Coming soon · Phase 2" |
| Ticket Exchange channel | Not built | Structured resale listings per design handoff Screen 08 |
| Photo gallery (full) | Partial | Upload + moderation done; no masonry grid/lightbox |
| Real push notifications | Subscriptions stored | No push send implementation |
| Announcement email delivery | Logs only | `console.log` stub in announce route |
| Announcement SMS delivery | Stub | `console.log` stub in announce route |
| Apple Wallet / Google Pay pass | PNG download only | "Add to Wallet" not native wallet pass |

### 5.3 Feature Gaps — Phase 3

| Feature | Status | Notes |
|---------|--------|-------|
| Artist profiles | Stub pages | API routes exist; UI shows "Phase 3" placeholder |
| Artist list page | Stub | `/artists` — "coming soon" |

### 5.4 Polish & Data Wiring

| Item | Location | Issue |
|------|----------|-------|
| Dashboard "Open requests" KPI | `admin/dashboard/page.tsx` | Hardcoded to `0` despite API returning count |
| Ticket receipt details | `TicketScreen.tsx` | Static order/card/fee values, not from DB |
| Media edition label | `admin/media/page.tsx` | Shows `'Ed ?'` instead of edition number |
| Guest list CSV export | `admin/guests/page.tsx` | Search only — dashboard has CSV, guests page doesn't |
| Guest list tier filter | Design spec | Search by name/email only; no tier filter |
| Multi-ticket swipe | Ticket screen | Partial — handoff specifies swipeable stacked tickets |

### 5.5 Assets Pending from Jordan

From design handoff Section 11 — all unchecked:

- [ ] 10–20 high-quality event photos from past events
- [ ] House of Fire logo or wordmark confirmation
- [ ] Preferred hero event photo
- [ ] First event date confirmation
- [ ] Official ticket tier names and prices
- [ ] Venue exterior photo (Junkyard Social Club)

### 5.6 Planned Surfaces Not Built

| Surface | Status |
|---------|--------|
| `apps/web` | Marketing site — not started |
| `apps/tablet` | Standalone tablet app — door UI duplicated in mobile/admin |
| `packages/brand` | Brand asset package — not extracted |
| `packages/icons` | Icon set package — not extracted |
| Playwright visual regression | Mentioned in README roadmap — not added |

### 5.7 Documentation Drift

| Document | Issue |
|----------|-------|
| Root `README.md` status section | Still says "early-stage / prototypes only" in opening paragraph |
| `apps/README.md` | Says folder "stays empty" |
| `packages/README.md` | Says packages are "empty placeholders" |
| `.env.local.example` | Contains duplicated sections (needs cleanup) |

---

## 6. Design Handoff vs Built

Reference: `uploads/House_of_Fire_Design_Handoff.md`

| Handoff Screen | Built? | Notes |
|----------------|--------|-------|
| 01 — Home (Upcoming Event Hero) | ✅ | `HomeScreen` + `LandingScreen` |
| 02 — Event Detail | ✅ | Tiers, lineup, FAQ, waitlist, map |
| 03 — Ticket Selection + Checkout | ✅ | Full Stripe 3-step flow with guest mode |
| 04 — Ticket Confirmation + QR | ⚠️ Mostly | QR, share, PDF; wallet pass stubbed; multi-ticket swipe partial |
| 05 — Member Profile | ✅ | Stats, tickets, referral, settings |
| 06 — Past Events Archive | ✅ | Year filter, event cards |
| 07 — Event Photo Gallery | ⚠️ Partial | Upload + moderation; no full gallery/lightbox |
| 08 — Community Board | ⚠️ Partial | Community built; Ticket Exchange channel missing |
| 09 — Admin Panel | ✅ | 10 admin sections — exceeds original spec |

**Navigation:** Bottom nav matches handoff (Home · Events · Community · Profile). Community is live, not grayed "Coming soon."

**Theme:** Dark-only theme implemented per handoff palette.

**Copy tone:** Warm, brief, confident — implemented in key screens.

---

## 7. Architecture Overview

```
house-of-fire/
├── apps/
│   ├── mobile/          @hof/mobile — Member PWA (:3000)
│   └── admin/           @hof/admin — Admin dashboard (:3001)
├── packages/
│   ├── design-tokens/   @hof/design-tokens
│   └── ui/              @hof/ui (Storybook + Vitest)
├── design/prototypes/   27 interactive .jsx screens
├── supabase/migrations/ 5 SQL migrations
├── scripts/             Migrations, SMTP config, env helpers
├── docs/                Deploy guides, Postgres upgrade
└── .env.local           Single env file for all apps
```

### Database Entities

| Entity | Purpose |
|--------|---------|
| `profiles` | User identity, role, avatar, settings, referral |
| `events` | Edition, date, venue, capacity, status, FAQs |
| `ticket_tiers` | Per-event pricing and capacity |
| `tickets` | QR codes, holder, Stripe IDs, status |
| `artists` / `event_lineups` | Performer data |
| `posts` / `replies` / `*_reactions` | Community |
| `content_reports` | User reports |
| `ticket_transfers` | Peer transfer workflow |
| `refund_requests` | Refund workflow |
| `event_photos` | Attendee uploads + moderation |
| `notifications` / `push_subscriptions` | In-app + web push |
| `newsletter_subscribers` | Email list |
| `referrals` / `waitlist` | Growth features |
| `discount_codes` | Promo + comp pools |

### Tech Stack

| Layer | Version |
|-------|---------|
| Node.js | 24.x LTS |
| pnpm | 10.x |
| Next.js | 16.x |
| React | 19.x |
| TypeScript | 5.9.x |
| Biome | 2.x |
| Postgres (Supabase) | 17 |
| Stripe | Payment processing |
| Resend | Transactional email |

---

## 8. Manual Steps Before Production

### One-Time Setup

1. **Vercel** — Create two projects per `docs/deploy-vercel.md`
   - Mobile: root `apps/mobile`, domain e.g. `app.houseoffire.events`
   - Admin: root `apps/admin`, domain e.g. `admin.houseoffire.events`

2. **Environment variables** — Set in Vercel dashboard (shared + mobile-only split)

3. **Database** — Run migrations:
   ```bash
   SUPABASE_DB_URL="postgresql://postgres:[PASSWORD]@db.<ref>.supabase.co:5432/postgres" \
     pnpm db:migrate
   ```

4. **Stripe** — Configure webhook to mobile production URL:
   `https://<mobile-domain>/api/webhooks/stripe`

5. **Resend** — Verify domain, configure Supabase Auth SMTP:
   ```bash
   pnpm configure:auth-smtp
   ```

6. **Secrets** — Generate production `QR_HMAC_SECRET`

### Local Development

```bash
nvm use
pnpm install
cp .env.local.example .env.local   # Edit with your keys
pnpm dev                            # mobile :3000 + admin :3001
```

---

## Summary Matrix

| Category | Done | Partial | Pending |
|----------|------|---------|---------|
| Monorepo & toolchain | ✅ | — | Playwright, doc updates |
| Mobile app screens | 12/14 | 2 (artists) | Artist profiles |
| Admin app sections | 10/10 | — | KPI wiring polish |
| Ticketing & payments | ✅ | Multi-ticket swipe | Wallet passes |
| Community | ✅ | — | Ticket Exchange |
| Photos | Upload + mod | Gallery UI | Masonry/lightbox |
| Notifications | In-app storage | — | Push/email/SMS delivery |
| Door operations | ✅ | — | — |
| Design system | ✅ | — | brand/icons packages |
| Deployment | Docs ✅ | — | Vercel projects, prod env |
| Content assets | — | — | Jordan asset checklist |

---

*This report reflects the codebase as of June 3, 2026. For deployment details, see [docs/deploy-vercel.md](./docs/deploy-vercel.md). For design specifications, see [uploads/House_of_Fire_Design_Handoff.md](./uploads/House_of_Fire_Design_Handoff.md).*
