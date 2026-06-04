-- Dynamic ticketing: per-tier service fees, per-event account limits, auto event capacity

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS max_tickets_per_user integer NOT NULL DEFAULT 4
    CHECK (max_tickets_per_user >= 1 AND max_tickets_per_user <= 20);

ALTER TABLE public.ticket_tiers
  ADD COLUMN IF NOT EXISTS fee_cents integer NOT NULL DEFAULT 0
    CHECK (fee_cents >= 0);

-- Backfill service fees from prior 7% platform fee model
UPDATE public.ticket_tiers
SET fee_cents = GREATEST(0, ROUND(price_cents * 0.07))
WHERE fee_cents = 0;

CREATE OR REPLACE FUNCTION public.sync_event_capacity_from_tiers(p_event_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.events e
  SET capacity = COALESCE(
    (
      SELECT SUM(t.capacity)::integer
      FROM public.ticket_tiers t
      WHERE t.event_id = p_event_id
        AND t.status <> 'hidden'
    ),
    0
  )
  WHERE e.id = p_event_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_ticket_tiers_sync_event_capacity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id uuid;
BEGIN
  v_event_id := COALESCE(NEW.event_id, OLD.event_id);
  PERFORM public.sync_event_capacity_from_tiers(v_event_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS ticket_tiers_sync_event_capacity ON public.ticket_tiers;
CREATE TRIGGER ticket_tiers_sync_event_capacity
  AFTER INSERT OR UPDATE OR DELETE ON public.ticket_tiers
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_ticket_tiers_sync_event_capacity();

-- Sync all existing events
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT id FROM public.events LOOP
    PERFORM public.sync_event_capacity_from_tiers(r.id);
  END LOOP;
END;
$$;
