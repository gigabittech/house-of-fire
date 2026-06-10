-- Door check-in idempotency + fast guest-list lookup for offline cache.

CREATE TABLE IF NOT EXISTS public.door_check_in_scans (
  client_scan_id uuid PRIMARY KEY,
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  code text NOT NULL,
  scanned_at timestamptz NOT NULL,
  used_at timestamptz NOT NULL,
  outcome text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_door_check_in_scans_event_created
  ON public.door_check_in_scans (event_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tickets_event_status_code
  ON public.tickets (event_id, status, code);

ALTER TABLE public.door_check_in_scans ENABLE ROW LEVEL SECURITY;
