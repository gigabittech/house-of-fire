-- Inventory helpers for checkout (SECURITY DEFINER bypasses tickets RLS for accurate counts).

CREATE OR REPLACE FUNCTION public.tier_available_count(p_tier_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (t.capacity - count(tk.id))::integer
  FROM public.ticket_tiers t
  LEFT JOIN public.tickets tk
    ON tk.tier_id = t.id
    AND tk.status IN ('valid', 'used')
  WHERE t.id = p_tier_id
  GROUP BY t.capacity;
$$;

CREATE OR REPLACE FUNCTION public.user_event_ticket_count(p_user_id uuid, p_event_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::integer
  FROM public.tickets
  WHERE holder_id = p_user_id
    AND event_id = p_event_id
    AND status IN ('valid', 'used');
$$;

GRANT EXECUTE ON FUNCTION public.tier_available_count(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.user_event_ticket_count(uuid, uuid) TO authenticated, service_role;
