# Scalability Report — House of Fire

**Date:** June 11, 2026  
**Scope:** Full codebase audit (database, APIs, realtime, frontend, caching, PWA, Supabase)

---

## Executive Summary

House of Fire is architected for **single-live-event** operations with deliberate tradeoffs: public inventory uses CDN-cached HTTP polling instead of realtime fan-out; admin/door retains postgres_changes for operational latency. The codebase has strong foundations (denormalized `sold_count`, cursor-paginated feeds, SQL RPCs for admin lists). This audit fixed remaining N+1 paths, inconsistent inventory SQL, realtime subscription bugs, and missing indexes.

**Verdict:** Ready for 10k registered users and launch-scale ticket drops. 30k requires Supabase Pro tuning and Vercel edge caching review. 100k requires dedicated capacity planning (connection pooling, read replicas, rate-limit backend).

---

## Architecture Strengths

| Area | Pattern | Scale benefit |
|------|---------|---------------|
| Inventory | `event_inventory_snapshot` RPC + 5s CDN cache | O(viewers) HTTP, not O(sales × viewers) WS |
| Checkout | `sold_count` denormalization + fulfillment re-check | O(1) capacity reads at payment time |
| Community feed | `list_community_posts` cursor RPC + batch reaction fetch | No N+1 on feed load |
| Admin lists | `admin_list_members`, `admin_list_guests`, `admin_financials_list` | Server-side pagination at SQL layer |
| Realtime | Singleton client + ref-counted channels | One WS per tab, shared listeners |
| Door offline | IndexedDB + 5k guest cache cap | Works when venue WiFi degrades |

---

## Bottlenecks Identified & Fixed

### Fixed in this audit

| Issue | Severity | Fix |
|-------|----------|-----|
| Admin events list: N `event_display_status` RPCs + full ticket scan | High | `admin_list_events_with_stats()` single RPC (migration 028) |
| `event_is_sold_out` / `event_purchasable_remaining` scanned all tickets | High | Rewritten to use `sold_count` (migration 028) |
| Admin tiers GET scanned all tickets per event | Medium | Uses denormalized `sold_count` |
| Profile GET loaded all author posts for reaction sum | Medium | `profile_author_reaction_totals()` RPC |
| Admin media: N Auth Admin API calls per page | Medium | `admin_resolve_user_emails(uuid[])` batch RPC |
| Email stats: 4 parallel count queries | Low | `admin_email_log_stats()` single query |
| Missing index on `stripe_payment_intent_id` | Medium | Partial index (migration 028) |
| Missing `(holder_id, event_id, status)` index | Medium | Composite index (migration 028) |
| `replies` not in realtime publication | Medium | Added to publication (migration 028) |
| Realtime channel manager stale `onStatus` | High | Multi-listener status broadcast |
| Global realtime status last-writer-wins | Medium | Connection registry with aggregate status |
| Spurious `onResync` on filter change | Medium | Reset `wasConnectedRef` on resubscribe |
| Rate limiter `windowMap` memory growth | Low | Periodic stale-key pruning |
| Door guest cache silent truncation | Low | `truncated` + `totalCount` in response |

### Remaining risks (not fixed — acceptable or deferred)

| Issue | Impact at scale | Mitigation |
|-------|-----------------|------------|
| In-memory rate limiter (per serverless instance) | Checkout abuse across instances | Move to Upstash Redis / Vercel KV before high-traffic launch |
| Push campaign `EXISTS` per subscription | Slow at 100k+ subs | Pre-segment or materialize attendee flags |
| Guest list ILIKE on JSONB `metadata` | Slow admin search at 50k+ guests | Denormalize `holder_email` column |
| `max_rows = 1000` in Supabase config | Silent truncation on unbounded queries | All hot paths use `.limit()` or RPCs; audit new queries |
| Door guest cache 5k cap | Events >5k tickets truncate offline lookup | Response now warns; increase cap or shard by tier for mega-events |
| No read replicas | Admin reporting contends with checkout writes | Supabase read replica when financials queries spike |
| Single Supabase project | Blast radius | Acceptable for v1; isolate admin analytics later |

---

## Realtime Connection Budget

Per mobile user tab (typical):

| Subscription | Table | Filter |
|--------------|-------|--------|
| Community (1 screen) | `posts` | `channel=eq.*` |
| Ticket screen | `tickets` | `holder_id=eq.*` |
| Notifications (sheet open) | `notifications` | `user_id=eq.*` |
| Post detail | `posts` + `replies` | scoped |

**~2–4 channels per active tab.** With channel dedup, community + ticket on same tab share infrastructure efficiently.

Admin door page: ~2 shared ticket channels + dashboard hooks when navigating. Peak admin concurrency is low (5–20 crew) — not a scaling concern.

Public inventory: **zero** realtime channels (HTTP poll only).

---

## Database Scaling Path

| Milestone | Action |
|-----------|--------|
| 10k users | Apply migration 028; current indexes sufficient |
| 30k users | Enable Supabase connection pooler (transaction mode); monitor `pg_stat_statements` |
| 100k users | Read replica for admin RPCs; consider partitioning `tickets` by `event_id`; evaluate Neon/Crunchy if Supabase limits hit |

---

## Horizontal Scaling (Vercel)

- **Stateless API routes** — scale naturally on Vercel serverless
- **No shared Redis** — rate limits and profile cache are per-instance (gap)
- **CDN inventory cache** — Vercel edge absorbs 80%+ of inventory poll traffic during drops
- **Stripe webhook** — idempotent `fulfillPaymentIntent`; horizontal-safe

---

## Capacity Estimates

Assumptions: single live event, 4k venue capacity, ticket drop drives peak load, 6s inventory poll interval, 15% concurrent users during drop.

| Metric | 10k users | 30k users | 100k users |
|--------|-----------|-----------|------------|
| Registered users | 10,000 | 30,000 | 100,000 |
| Peak concurrent (drop) | ~1,500 | ~4,500 | ~15,000 |
| Inventory polls/sec | ~250 | ~750 | ~2,500 |
| CDN cache hit rate (est.) | 85% | 85% | 85% |
| Origin inventory RPS | ~40 | ~110 | ~375 |
| Realtime connections | ~1,500 | ~4,500 | ~15,000 |
| Checkout intents/min (peak) | ~200 | ~600 | ~2,000 |
| **Readiness** | ✅ Ready | ⚠️ Tune pooler + monitor | ❌ Needs Redis rate limits, replica, load test |

### 10k users — Ready

- Supabase Pro (default pooler) handles ~40 origin inventory RPS
- ~1,500 realtime connections within Supabase Pro limits
- Vercel Hobby/Pro sufficient for API tier

### 30k users — Ready with tuning

- Enable connection pooler; watch Postgres CPU during drop
- Consider Vercel Pro with increased concurrency
- Add Upstash rate limiting before marketing push to 30k
- Load test checkout path at 600 intents/min

### 100k users — Requires infrastructure investment

- Dedicated rate-limit store (Redis/KV)
- Read replica for admin + reporting
- Load test at 2,500 inventory RPS with CDN
- Push campaign batching refactor
- Consider edge inventory cache (Cloudflare KV) if origin exceeds 500 RPS
- Supabase Enterprise or self-hosted Postgres evaluation

---

## Recommendations (Priority Order)

1. **Apply migration 028** before next deploy
2. **Load test checkout** with k6/Artillery simulating 1,500 concurrent checkout users
3. **Add Upstash Redis** for rate limiting before scaling past 20k registered users
4. **Monitor** Supabase realtime connection count and Postgres connections during first major drop
5. **Denormalize holder_email** on tickets when guest list search becomes slow
