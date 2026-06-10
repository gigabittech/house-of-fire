# Ticket Inventory Architecture

## Problem

Each ticket sale runs `adjust_tier_sold_count` → `UPDATE ticket_tiers` → Supabase Realtime `postgres_changes` to every subscriber. During a launch with thousands of viewers, this creates:

- WebSocket broadcast storms (O(sales × viewers))
- Supabase Realtime connection pressure
- Redundant client refetches

`sold_count` denormalization (migration 020) fixed **database** load; this design fixes **fan-out**.

## Decision: Hybrid (C)

| Audience | Sync mechanism | Interval / trigger |
|---|---|---|
| **Public** (home, event, checkout) | Poll cached snapshot API | 4–8s by surface |
| **Admin** (door, dashboard, guests) | Ticket `postgres_changes` deltas + snapshot poll | 15s poll for tier bars / manual edits |
| **Checkout fulfillment** | `sold_count` row read (O(1)) | On each intent/complete |

Rejected for public scale:

- **A. Snapshot broadcast channel** — requires a publisher (edge worker/cron); no server publisher in v1.
- **B. Polling alone for admin** — too slow for door ops; ticket realtime retained for admins.

## Database

### `event_inventory_snapshot(p_event_id uuid)`

Migration `022_event_inventory_snapshot.sql`:

- Single indexed read on `ticket_tiers` by `event_id`
- Returns `{ event, tiers[], snapshot_at }` with `sold`, `remaining`, `effective_status`
- Granted to `anon` / `authenticated` / `service_role`

### Realtime publication

```sql
ALTER PUBLICATION supabase_realtime DROP TABLE public.ticket_tiers;
```

`tickets` and `events` remain published. Inventory counts are **not** pushed via postgres_changes.

## HTTP APIs

| Route | Cache | Auth |
|---|---|---|
| `GET /api/events/:eventId/inventory` | `s-maxage=5, stale-while-revalidate=10` | Public |
| `GET /api/admin/events/:id/inventory` | `private, max-age=5` | Admin |

## Client hooks

### `useEventInventory` (mobile)

Replaces `useEventInventoryRealtime`.

```typescript
useEventInventory({
  event,
  onEventChange,
  pollIntervalMs: INVENTORY_POLL_MS.checkout, // 4000 | 6000 | 8000
});
```

- Polls on interval + when tab becomes visible
- Merges snapshot via `applyInventorySnapshot()` (preserves user ticket limits from initial `/api/events/upcoming`)

### Admin

- `useDoorRealtime` — ticket INSERT patches tier sold; `loadStats` every 15s
- `useDashboardRealtime` — no tier subscription; `loadMetrics` every 15s
- `useGuestsRealtime` — ticket deltas + `loadTierStatus` every 15s

## Load model (launch)

**Before** (5000 viewers, 100 sales/sec):

~500,000 realtime messages/sec (tier UPDATE × viewers)

**After** (5000 viewers, poll 6s):

~833 HTTP requests/sec to inventory API (cacheable at CDN → far fewer origin hits)

**Admin** (~20 tabs):

Ticket INSERT realtime only; no tier UPDATE fan-out.

## Accuracy

| Layer | Guarantee |
|---|---|
| Checkout `validateCheckoutRequest` | Reads `sold_count` at intent time |
| `validateTierCapacityForFulfillment` | Re-check before ticket insert |
| UI display | Eventually consistent within poll interval |

Overselling is prevented at **purchase** time, not display time.

## Files

```
supabase/migrations/022_event_inventory_snapshot.sql
apps/mobile/src/app/api/events/[eventId]/inventory/route.ts
apps/mobile/src/hooks/useEventInventory.ts
apps/mobile/src/lib/inventorySnapshot.ts
apps/admin/src/app/api/admin/events/[id]/inventory/route.ts
```

## Deploy

```bash
node scripts/run-migrations.mjs
```

Without migration 022, `/api/events/:id/inventory` returns RPC errors.
