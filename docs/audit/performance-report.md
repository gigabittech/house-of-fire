# Performance Report — House of Fire

**Date:** June 11, 2026

---

## Summary

Performance work in migrations 020–024 established the core patterns (denormalized counts, cursor pagination, inventory polling). This audit closed gaps in admin paths that still performed full-table scans or N+1 RPC loops, fixed realtime subscription inefficiencies, and added targeted indexes.

---

## Database Query Performance

### Hot paths (optimized)

| Path | Mechanism | Latency target |
|------|-----------|----------------|
| Public inventory | `event_inventory_snapshot` + CDN 5s | <50ms origin, <10ms edge |
| Checkout capacity | `sold_count` read + `tier_available_count` | <20ms |
| Community feed | `list_community_posts` cursor RPC | <100ms/page |
| Admin members | `admin_list_members` + trigram indexes | <150ms/search |
| Stripe webhook idempotency | Partial index on `stripe_payment_intent_id` | <10ms lookup |

### Fixes applied (migration 028)

```sql
-- sold_count instead of ticket COUNT(*) in display helpers
event_is_sold_out(), event_purchasable_remaining()

-- Indexes
idx_tickets_stripe_payment_intent_id (partial)
idx_tickets_holder_event_status
idx_profiles_display_name_trgm, idx_profiles_handle_trgm (pg_trgm)
```

### Query anti-patterns eliminated

| Before | After | Savings |
|--------|-------|---------|
| Admin events: load ALL tickets + N RPCs | `admin_list_events_with_stats()` | O(events) round-trips → 1 |
| Admin tiers: scan all event tickets | Read `sold_count` column | O(tickets) → O(tiers) |
| Profile: fetch all posts, sum in JS | `profile_author_reaction_totals()` | O(posts) rows → 1 aggregate |
| Media: N `auth.admin.getUserById` | `admin_resolve_user_emails(uuid[])` | N API calls → 1 SQL |
| Email stats: 4 count queries | `admin_email_log_stats()` | 4 round-trips → 1 |

### Remaining query concerns

| Query | Risk | When |
|-------|------|------|
| `admin_list_guests` ILIKE on `metadata->>'holder_email'` | Seq scan | >20k guests per event |
| Push `count_push_recipients` correlated EXISTS | O(n×m) | Campaigns >10k recipients |
| Reactions route: up to 5 sequential queries | Chatty | High reaction velocity threads |
| TicketScreen: full refetch on any ticket UPDATE | Extra HTTP | Users with many tickets |

---

## API Performance

### Caching layers

| Layer | Scope | TTL |
|-------|-------|-----|
| Vercel CDN | `GET /api/events/:id/inventory` | 5s + 10s SWR |
| Browser poll | `useEventInventory` | 4–8s by surface |
| Module cache | `profileCache.ts` | Session |
| localStorage | `useRealtimeCache` (admin door) | Persistent |
| IndexedDB | Door guest offline cache | Until refresh |

### No server-side data cache

Next.js `unstable_cache`, `revalidateTag`, and Redis are **not used**. This is intentional for v1 simplicity; inventory CDN headers provide the primary edge cache.

### Rate limiting

| Endpoint | Limit | Store |
|----------|-------|-------|
| Checkout intent | 10/min/IP | In-memory |
| Promo validate | 20/min/IP | In-memory |
| Receipt resend | Per-order + per-IP | In-memory |

**Gap:** In-memory limits don't coordinate across Vercel instances. Acceptable at 10k; upgrade before 30k.

---

## Realtime Performance

### Architecture wins

- Singleton Supabase client (1 WebSocket/tab)
- Ref-counted channel sharing (door page: 2 hooks → 1 channel)
- `RealtimeDedupe` (max 500 keys) prevents duplicate processing
- Debounced handlers (150–400ms) on admin ticket streams
- `ticket_tiers` removed from publication — eliminates launch storms

### Fixes applied

1. **Status listener fan-out** — all subscribers receive channel status (was first-subscriber only)
2. **Global status aggregation** — worst-status-wins across connections (was last-writer-wins)
3. **`wasConnectedRef` reset** — prevents spurious full resync on channel/filter change
4. **`replies` publication** — PostScreen live replies now functional

### Subscription cleanup

All domain hooks use stable callback refs + effect cleanup. `subscribeChannel` tears down when `refCount` reaches 0. No memory leak patterns found in audited hooks.

### Load comparison (inventory)

| Scenario | Before (realtime tiers) | After (HTTP poll) |
|----------|------------------------|-------------------|
| 5k viewers, 100 sales/sec | ~500k WS msgs/sec | ~833 polls/sec (CDN → ~125 origin) |
| Improvement | — | **~4000× reduction** in realtime fan-out |

---

## Frontend Performance

### Patterns

- Cursor pagination + `useInfiniteScroll` on feeds
- `LazyEventPhoto` for image deferral
- No global state library (lightweight, but more per-screen fetch logic)
- 1s clock intervals on Home/LiveNight — cleaned up on unmount

### PWA (`apps/mobile`)

- Custom `sw.js` (no Workbox)
- Precached shell routes: `/`, `/event`, `/ticket`, `/live`, etc.
- Static assets: cache-first
- Pages: network-first with offline fallback
- **API routes not cached** — ticket data unavailable offline (known gap)

### Memory

- `rateLimit.ts` now prunes stale keys every 60s
- `RealtimeDedupe` capped at 500 entries
- Door sync service returns teardown function (used correctly)

---

## Benchmark Targets (Post-Fix)

| Endpoint | p50 | p95 | p99 |
|----------|-----|-----|-----|
| `GET /api/events/:id/inventory` (edge) | 15ms | 40ms | 80ms |
| `GET /api/events/:id/inventory` (origin) | 30ms | 80ms | 150ms |
| `POST /api/checkout/intent` | 200ms | 500ms | 1s |
| `GET /api/posts` (feed page) | 80ms | 200ms | 400ms |
| `GET /api/profile` | 100ms | 250ms | 500ms |
| Admin `admin_list_events_with_stats` | 50ms | 150ms | 300ms |

*Targets assume Supabase Pro, US-East, warm connections. Validate with load tests.*

---

## Action Items

| Priority | Item | Status |
|----------|------|--------|
| P0 | Migration 028 indexes + RPCs | ✅ Done |
| P0 | Realtime subscription fixes | ✅ Done |
| P1 | Load test inventory + checkout | Pending |
| P2 | Redis rate limiting | Pending |
| P2 | Ticket offline cache in SW | Pending |
| P3 | Reaction route consolidation | Pending |
