-- Event inventory snapshot RPC + remove ticket_tiers from realtime publication.
-- Stops per-sale postgres_changes storms during ticket launches.
-- Public clients poll GET /api/events/:id/inventory instead.

CREATE OR REPLACE FUNCTION public.event_inventory_snapshot(p_event_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event jsonb;
  v_tiers jsonb;
BEGIN
  SELECT jsonb_build_object(
    'id', e.id,
    'status', e.status,
    'name', e.name,
    'edition_number', e.edition_number,
    'capacity', e.capacity,
    'updated_at', e.updated_at
  )
  INTO v_event
  FROM public.events e
  WHERE e.id = p_event_id;

  IF v_event IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', tt.id,
        'name', tt.name,
        'display_name', tt.display_name,
        'description', tt.description,
        'price_cents', tt.price_cents,
        'fee_cents', coalesce(tt.fee_cents, 0),
        'capacity', tt.capacity,
        'status', tt.status,
        'sort_order', tt.sort_order,
        'sold', GREATEST(0, coalesce(tt.sold_count, 0)),
        'remaining', GREATEST(0, tt.capacity - GREATEST(0, coalesce(tt.sold_count, 0))),
        'effective_status', CASE
          WHEN tt.status = 'hidden' THEN 'hidden'
          WHEN tt.status = 'sold_out'
            OR GREATEST(0, tt.capacity - GREATEST(0, coalesce(tt.sold_count, 0))) <= 0
            THEN 'sold_out'
          ELSE 'available'
        END,
        'updated_at', tt.updated_at
      )
      ORDER BY tt.sort_order
    ),
    '[]'::jsonb
  )
  INTO v_tiers
  FROM public.ticket_tiers tt
  WHERE tt.event_id = p_event_id;

  RETURN jsonb_build_object(
    'event', v_event,
    'tiers', v_tiers,
    'snapshot_at', now()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.event_inventory_snapshot(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.event_inventory_snapshot(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.event_inventory_snapshot(uuid) TO service_role;

-- ticket_tiers updates fire on every sale; exclude from postgres_changes publication.
ALTER PUBLICATION supabase_realtime DROP TABLE public.ticket_tiers;
