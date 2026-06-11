# House of Fire — Realtime Architecture

Last updated: June 2026

This document describes how Supabase Realtime is wired across the monorepo after the singleton-client refactor, subscription deduplication, and incremental state patching work.

**Ticket inventory** no longer uses `ticket_tiers` postgres_changes. See [`inventory-architecture.md`](./inventory-architecture.md).

---

## Goals

| Problem (before) | Solution (after) |
|---|---|
| Multiple `createBrowserClient()` calls per tab | One singleton browser client per app (`apps/admin`, `apps/mobile`) |
| Duplicate websocket channels for the same table/filter | `@hof/realtime` channel manager with ref-counted listeners |
| Full `loadData()` / `fetchAll()` on every postgres change | INSERT / UPDATE / DELETE handlers patch local React state |
| `ticket_tiers` UPDATE storms on every sale | Debounced tier handlers; client-side `sold_count` patches; DB trigger emits one row update per sale |
| Unscoped subscriptions | Filters on `event_id`, `user_id` (`holder_id`), `channel`, `resource_id` where applicable |

---

## Package: `@hof/realtime`

Location: `packages/realtime/`

### Singleton Supabase client injection

```
RealtimeProvider (admin: RealtimeShell, mobile: AppChrome)
  └── SupabaseProvider (singleton createClient())
        └── useSupabaseRealtime() → useRealtimeSupabase()
```

- `RealtimeProvider` requires a `supabase` prop.
- Hooks never call `createBrowserClient()` internally; they read from context.
- Auth flows (`login`, `signOut`) may still call `createClient()` — that returns the same singleton instance.

### Channel deduplication

`channelManager.ts` keys channels by `schema:table:filter`:

- First subscriber creates the Supabase channel and attaches postgres listeners.
- Additional subscribers increment `refCount` and share the same channel.
- Unsubscribe decrements; channel is torn down when `refCount` reaches 0.

Example: **Door page** (`useDoorRealtime`) and **DoorLiveGuests** both listen to `tickets` with `event_id=eq.<id>`. They share **one** websocket channel with two listeners.

### Event processing

`useSupabaseRealtime`:

1. **Dedupes** by `(table, rowId, eventType, commit_timestamp)` via `RealtimeDedupe`.
2. **Skips no-op UPDATEs** when `new` and `old` payloads are equal (`rowsEqual`).
3. **Debounces** optional (`debounceMs`) — used for tier inventory (150–400ms) to collapse burst updates.
4. **onResync** runs on reconnect (after first successful subscribe) so pages can run a bounded full fetch as a safety net.

### State patch helpers

`statePatch.ts`: `upsertById`, `updateById`, `removeById`, `clampCount` — immutable array utilities for list UIs.

Admin-specific domain patches live in `apps/admin/src/lib/realtimePatch.ts` (tier bars, event stats, guest rows, tier status groups).

---

## Browser client singletons

| App | File | Pattern |
|---|---|---|
| Admin | `apps/admin/src/lib/supabase.ts` | Module-level `browserClient` lazy init |
| Mobile | `apps/mobile/src/lib/supabase.ts` | Same pattern (added in this refactor) |

---

## Subscription inventory

### Admin (`apps/admin`)

| Hook / component | Table(s) | Filter / scope | Events | Consumer behavior |
|---|---|---|---|---|
| `useNavCountsRealtime` | `event_photos` | `status=eq.pending` | I/U/D | Delta badge counts (`onMediaDelta`) |
| | `posts` | `moderation_status=eq.pending` | I/U/D | Delta mod badge (`onModDelta`) |
| `useDashboardRealtime` | `tickets` | `event_id=eq.<liveEvent>` | I/U | Patch KPIs, sales series, guest preview |
| | *(tiers)* | — | — | Tier bars via 15s metrics poll (no tier realtime) |
| | `refund_requests` | `status=eq.pending` | I/U/D | Patch open refund count |
| | `event_photos` | `status=eq.pending` | I/U/D | Upsert/remove pending photo rows |
| `useGuestsRealtime` | `tickets` | `event_id=eq.<filter>` | I/U/D | Patch guest table + tier status deltas |
| `useDoorRealtime` | `tickets` | `event_id=eq.<selected>` | I/U | Door stat deltas + tier sold on INSERT |
| `DoorLiveGuests` | `tickets` | `event_id=eq.<selected>` | I/U | Prepend checked-in guest (single-ticket fetch) |
| `useEventsRealtime` | `events` | *(none — all events)* | U | Patch event status in list |

**Removed:** `useDoorTierRealtime` (merged into `useDoorRealtime`).

**Reconnect fallback:** Door hooks poll `loadStats` every 60s when global realtime status is `disconnected` or `error`.

### Mobile (`apps/mobile`)

| Hook | Table(s) | Filter / scope | Events | Consumer behavior |
|---|---|---|---|---|
| `useCommunityRealtime` | `posts` | `channel=eq.<name>` | I/U/D | Fetch single post on INSERT; patch reactions/replies on UPDATE |
| `useEventInventory` | — | Poll `GET /api/events/:id/inventory` | — | 4–8s snapshot poll (no tier realtime) |
| `useTicketRealtime` | `tickets` | `holder_id=eq.<userId>` | I/U/D | Patch user's ticket on Ticket screen |
| `useNotificationsRealtime` | `notifications` | `user_id=eq.<userId>` | I | Prepend notification in sheet |

**Screens using community realtime:** `CommunityScreen`, `HomeScreen`, `EventScreen`, `LiveNightScreen`.

**Screens using inventory polling:** `HomeScreen`, `EventScreen`, `CheckoutScreen` (`useEventInventory`).

---

## INSERT / UPDATE / DELETE handling patterns

### Tickets (admin)

| Event | Action |
|---|---|
| INSERT | Bump counters; fetch **one** guest via `GET /api/admin/guests?ticketId=`; prepend to page-1 lists |
| UPDATE | `patchGuestTicketRow` / status deltas for tier sold counts / door stat deltas |
| DELETE | `removeById` from lists; decrement pagination total; tier sold delta −1 |

### Ticket tiers (inventory)

| Event | Action |
|---|---|
| UPDATE | Patch `sold_count`, `remaining`, `effective_status` in local event object — **no** `/api/events` refetch |

DB: migration `020_query_performance.sql` uses incremental triggers so each ticket write emits **one** tier UPDATE (not a full recount query in the trigger).

### Posts (community)

| Event | Action |
|---|---|
| INSERT | `GET /api/posts/:id` → prepend if approved |
| UPDATE | Patch `reaction_counts`, `reply_count`; treat hidden/rejected as DELETE |
| DELETE | Filter out of local list |

### Pending moderation / media (admin nav)

| Event | Action |
|---|---|
| INSERT pending | `+1` badge |
| UPDATE away from pending | `−1` badge |
| DELETE pending | `−1` badge |

---

## API additions for incremental updates

| Endpoint | Purpose |
|---|---|
| `GET /api/admin/guests?ticketId=<uuid>` | Single guest row with joins (profile, tier, event, order) |
| `GET /api/posts/:id` | Single post for realtime INSERT prepend (mobile) |

Shared SQL select: `ADMIN_GUEST_SELECT` in `apps/admin/src/lib/guestTicket.ts`.

---

## When full refetch still happens

Full refetch is intentionally **limited** to:

1. **Initial page load** and user-driven pagination/filter changes.
2. **`onResync`** after websocket reconnect.
3. **Guests page** ticket INSERT when text search filters are active (cannot cheaply verify match client-side).
4. **Offline fallback** 60s polling on door surfaces when disconnected.

No realtime handler should call unbounded `loadData()` on every event.

---

## Database & RLS (realtime prerequisites)

See `supabase/migrations/018_realtime.sql`:

- Tables in `supabase_realtime` publication: `events`, `ticket_tiers`, `tickets`, `posts`, `event_photos`, `refund_requests`, `notifications`, …
- Crew/admin RLS policies for ticket and moderation reads.
- `sold_count` on `ticket_tiers` maintained by triggers (optimized in `020_query_performance.sql`).

---

## Connection budget (typical tab)

Approximate **unique channels** (not listeners) when admin user has dashboard + guests + door open:

| Channel key | Source |
|---|---|
| `public:tickets:event_id=eq.<id>` | dashboard / guests / door (shared) |
| `public:ticket_tiers:event_id=eq.<id>` | dashboard / guests / door (shared) |
| `public:refund_requests:status=eq.pending` | dashboard |
| `public:event_photos:status=eq.pending` | dashboard + nav counts (shared) |
| `public:posts:moderation_status=eq.pending` | nav counts |
| `public:events:*` | events page |
| `public:ticket_tiers:*` | events page (all tiers; client-filtered) |

Mobile member tab (home + community): ~4 channels (`events`, `ticket_tiers`, `posts:channel=general`, optional `notifications`).

---

## File map

```
packages/realtime/src/
  channelManager.ts      # Ref-counted channel pool
  dedupe.ts              # Commit-timestamp deduplication
  statePatch.ts          # Generic list patches
  supabaseContext.tsx    # Injected singleton client
  useSupabaseRealtime.ts # Core hook
  RealtimeProvider.tsx   # Status + disconnected banner

apps/admin/src/
  lib/supabase.ts        # Singleton
  lib/realtimePatch.ts   # Domain patch helpers
  lib/fetchGuestTicket.ts
  hooks/use*Realtime.ts
  components/RealtimeShell.tsx

apps/mobile/src/
  lib/supabase.ts        # Singleton
  hooks/use*Realtime.ts
  components/AppChrome.tsx
```

---

## Testing checklist

- [ ] Admin dashboard: sell ticket → KPIs/tier bars update without full metrics reload
- [ ] Admin guests: new ticket on page 1 prepends row; tier status bar updates
- [ ] Admin door: scan ticket → stats + live guest list update without full guest table fetch
- [ ] Mobile checkout: tier remaining decrements on peer purchase (debounced)
- [ ] Mobile community: new post appears without reloading entire feed
- [ ] Disconnect network → reconnect → `onResync` runs once; banner after 30s offline
- [ ] DevTools: one Supabase realtime websocket per tab (not per hook)

---

## Future improvements

1. **Per-tier realtime filters** — Supabase supports `id=eq.<tierId>` if we split tier listeners per visible tier (trade-off: more channels vs. less client filtering).
2. **Guest INSERT filter matching** — server-side `ticketId` RPC that applies the same filters as `admin_list_guests` to avoid text-filter refetch.
3. **Events page** — scope `events` channel to `id=in.(...)` when Supabase filter syntax supports UUID lists for loaded pages only.
