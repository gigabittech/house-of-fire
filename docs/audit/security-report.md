# Security Report — House of Fire

**Date:** June 11, 2026

---

## Summary

House of Fire follows a defense-in-depth model: Supabase RLS for member data, service-role clients only on server routes with role checks, Stripe webhook signature verification, and admin/crew role gating. No critical vulnerabilities found. Several hardening opportunities documented below.

**Overall risk:** Low–Medium for v1 launch at 10k users.

---

## Authentication & Authorization

### Patterns (correct)

| Surface | Auth mechanism |
|---------|----------------|
| Mobile API | `createServerSupabaseClient()` + `auth.getUser()` |
| Admin API | `requireAdminRole()` on mutations; service role with server checks |
| Crew door | `requireCrewRole()` |
| Stripe webhook | Signature verification via `STRIPE_WEBHOOK_SECRET` |
| Dev login | Gated to dev environment only |

### Service role usage

Service role clients (`createAdminSupabaseClient`, `createServiceRoleClient`) bypass RLS. This is correct for server-side operations but requires every route to enforce authorization before queries.

**Verified:** Admin mutation routes call `requireAdminRole()`. Crew routes call `requireCrewRole()`. Public inventory uses service role for snapshot reads (read-only, no PII).

### Gaps

| Issue | Severity | Recommendation |
|-------|----------|----------------|
| In-memory rate limit bypass (multi-instance) | Medium | Redis-backed limits on checkout/auth |
| `placeholder-service-key` fallback in dev | Low | Ensure production env validation fails fast if keys missing |
| Some admin GET routes lack explicit role check | Low | `admin/events` GET uses service role without `requireAdminRole` — acceptable if admin app is network-restricted, but add check for defense |
| Mobile `/api/admin/*` crew shortcuts | Medium | Verify these routes validate crew/admin role (they use service key proxy) |

---

## Row Level Security (RLS)

### Enabled tables

All public tables have RLS enabled (migrations 001, 004, 012, 026). Key policies:

- **Profiles:** Users read/update own; crew reads all
- **Tickets:** Holders read own; crew reads all
- **Posts:** Moderated read (`moderation_status = 'approved'`) + crew channel gating
- **Orders, refunds, email logs:** Restricted; service role only
- **email_resend_audit:** `USING (false)` — no public access

### Realtime RLS (migration 018)

`is_crew_or_admin()` function gates crew read policies for tickets, refunds, event_photos. Members only receive postgres_changes for rows they can SELECT under RLS.

### Concerns

| Issue | Severity | Notes |
|-------|----------|-------|
| `admin_resolve_user_emails` reads `auth.users` | Low | `SECURITY DEFINER`, service_role only — correct |
| `profile_author_reaction_totals` granted to `authenticated` | Low | Users can only query own `author_id` via API; consider RLS check inside RPC |
| Community crew channel | Low | RLS enforces crew-only read on `channel = 'crew'` |

---

## API Security

### Input validation

- Checkout: tier/event validation, promo code limits, per-user ticket caps
- Profile PATCH: display name length 1–80
- Admin forms: `parseEventPayload`, `parseTierRows` validators
- File uploads: presigned URLs with storage policies

### Rate limiting (present)

| Endpoint | Limit |
|----------|-------|
| `POST /api/checkout/intent` | 10/min/IP |
| `POST /api/checkout/validate-code` | 20/min/IP |
| Receipt resend | Per-order + per-IP limits |

### Missing rate limits (recommended)

| Endpoint | Risk |
|----------|------|
| `POST /api/auth/magic-link` | Email bombing |
| `POST /api/posts` | Spam |
| `POST /api/posts/[id]/reactions` | Abuse |
| `POST /api/newsletter/subscribe` | List bombing |
| `POST /api/push/subscribe` | Subscription flooding |

---

## Payment Security

### Stripe integration

- Webhook signature verified before processing
- `fulfillPaymentIntent` idempotent (checks existing tickets by PI id)
- Partial index on `stripe_payment_intent_id` added (migration 028) — improves idempotency lookup
- PaymentIntent metadata validated server-side
- No card data touches House of Fire servers (Stripe Elements)

### Checkout race conditions

- `sold_count` checked at intent creation and fulfillment
- DB triggers maintain count consistency
- Single-live-event constraint prevents duplicate active events

---

## Data Protection

### PII handling

| Data | Storage | Access |
|------|---------|--------|
| Email | `auth.users` | Server-side only; batch RPC for admin media |
| Phone | `user_metadata` / profile settings | User + server |
| Ticket holder metadata | `tickets.metadata` JSONB | Crew/admin for door |
| Push subscriptions | `push_subscriptions` | User-owned |

### Secrets

- `.env.local` not committed (verify `.gitignore`)
- `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` server-only
- VAPID keys for push notifications

### Audit trails

- `email_resend_audit` — receipt resend compliance
- `moderation_actions` — mod queue actions
- `door_check_in_scans` — door scan log

---

## Supabase Configuration

| Setting | Value | Assessment |
|---------|-------|------------|
| `max_rows` | 1000 | Safe if all queries bounded; audit new queries |
| Auth providers | Google OAuth, magic link | Standard |
| Storage | 50MB limit (migration 014) | Adequate for event photos |
| Realtime publication | Scoped tables only | `ticket_tiers` correctly excluded |

---

## PWA / Client Security

- Service worker scope limited to mobile app origin
- No sensitive data cached in SW (API responses excluded)
- Push notifications require user permission
- CSP: follow Next.js defaults; verify in production headers

---

## Security Checklist for Launch

| Item | Status |
|------|--------|
| RLS enabled on all tables | ✅ |
| Service role only on server | ✅ |
| Stripe webhook signature verification | ✅ |
| Admin mutations require role | ✅ |
| Dev login disabled in production | ⚠️ Verify env gate |
| Secrets not in repo | ✅ |
| HTTPS enforced (Vercel) | ✅ |
| Rate limits on checkout | ✅ |
| Rate limits on auth/posts | ❌ Add before 30k |
| Dependency audit (`pnpm audit`) | ⚠️ Run in CI |
| CORS / CSRF (SameSite cookies) | ✅ Supabase SSR pattern |

---

## Recommendations

1. **Add rate limits** to magic-link, post creation, and newsletter endpoints
2. **Fail fast** if `SUPABASE_SERVICE_ROLE_KEY` is placeholder in production
3. **Add `requireAdminRole`** to admin GET routes that expose operational data
4. **Run `pnpm audit`** and pin critical dependency updates before launch
5. **Enable Supabase Auth rate limiting** in dashboard for brute-force protection
6. **Review** mobile `/api/admin/*` proxy routes for role enforcement
