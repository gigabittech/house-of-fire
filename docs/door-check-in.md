# QR Door Check-In System

Production door check-in for venue staff with camera scanning, offline guest cache, and automatic sync.

## Architecture

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│ DoorQrScanner   │────▶│ @hof/door-checkin    │────▶│ POST …/scan     │
│ (@hof/ui)       │     │ processDoorScan      │     │ performDoorCheckIn
└─────────────────┘     └──────────┬───────────┘     └─────────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    ▼                ▼                ▼
            IndexedDB cache   localStorage queue   recent-scan dedupe
```

## Surfaces

| Surface | URL | APIs |
|---------|-----|------|
| Admin door | `/door` (admin app) | `/api/admin/door/*` |
| Crew mobile | `/door` (member app) | `/api/crew/door/*` |

Both use `@hof/door-checkin` client + shared server `performDoorCheckIn`.

## Features

### Camera QR scanning (`DoorQrScanner`)

- `@zxing/browser` with rear-camera preference (`facingMode: environment`)
- Mobile-safe: `playsInline`, `muted`, `autoPlay`
- 3s duplicate scan cooldown per code
- Manual code entry fallback
- Permission denied → retry button + manual entry

### Offline guest cache

1. **Download** — `GET /api/…/door/guest-cache?eventId=` (up to 5000 valid/used tickets)
2. **Store** — IndexedDB (`hof-door-guest-cache`) + localStorage fallback + in-memory `Map` for O(1) lookup by code
3. **Use offline** — lookup by normalized code; reject unknown tickets when offline

### Offline check-in queue

- Queue in `localStorage` (`hof-door-checkin-queue`)
- Dedupes by `client_scan_id` and normalized ticket code
- Session recent-scan guard (8s) prevents double-tap storms
- Optimistic cache update (`markCachedTicketUsed`)

### Automatic sync

- `startDoorSyncService` — drains queue on `online`, tab visible, and every 30s
- `DoorCheckInQueueBanner` — manual sync + pending count (admin)
- 409 conflicts on sync treated as success (already checked in)

### Server idempotency

Migration `023_door_check_in.sql`:

- `door_check_in_scans(client_scan_id)` — replay safe sync after reconnect
- Atomic check-in: `UPDATE tickets … WHERE status = 'valid' AND used_at IS NULL`
- Index `tickets(event_id, status, code)` for fast guest-cache queries

### Auth

- Admin scan + guest-cache: `requireAdminRole`
- Crew mobile scan + guest-cache: `requireCrewRole` (crew | admin)

## Package: `@hof/door-checkin`

```
packages/door-checkin/src/
  guestStore.ts    # IndexedDB + memory index
  queue.ts         # Offline queue + POST helper
  scanFlow.ts      # processDoorScan orchestration
  syncService.ts   # Background drain
  server/checkIn.ts
```

## Pre-doors checklist

1. Open door page while online
2. Tap **Download guest list** (admin) or **Refresh guest list** (mobile)
3. Confirm guest count + timestamp in offline status bar
4. Test one scan online before doors open

## Deploy

```bash
pnpm install
node scripts/run-migrations.mjs   # includes 023_door_check_in.sql
```
