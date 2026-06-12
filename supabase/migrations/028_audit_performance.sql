-- Final audit: sold_count consistency, indexes, realtime replies, admin RPCs.

-- ─── Use denormalized sold_count in display/inventory helpers ───────────────

CREATE OR REPLACE FUNCTION public.event_purchasable_remaining(p_event_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(
    CASE
      WHEN tt.status = 'hidden' THEN 0::bigint
      WHEN tt.status = 'sold_out' THEN 0::bigint
      ELSE GREATEST(
        0::bigint,
        tt.capacity::bigint - GREATEST(0, COALESCE(tt.sold_count, 0))::bigint
      )
    END
  ), 0)::bigint
  FROM public.ticket_tiers tt
  WHERE tt.event_id = p_event_id;
$$;

CREATE OR REPLACE FUNCTION public.event_is_sold_out(p_event_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.ticket_tiers tt
    WHERE tt.event_id = p_event_id
      AND tt.status <> 'hidden'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.ticket_tiers tt
    WHERE tt.event_id = p_event_id
      AND tt.status <> 'hidden'
      AND tt.status <> 'sold_out'
      AND GREATEST(0, tt.capacity - GREATEST(0, COALESCE(tt.sold_count, 0))) > 0
  );
$$;

-- ─── Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_tickets_stripe_payment_intent_id
  ON public.tickets (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tickets_holder_event_status
  ON public.tickets (holder_id, event_id, status);

-- Profile search (admin member list)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_profiles_display_name_trgm
  ON public.profiles USING gin (display_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_profiles_handle_trgm
  ON public.profiles USING gin (handle gin_trgm_ops);

-- ─── Realtime: replies for live post threads ────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE public.replies;

-- ─── Admin events list with stats (single round-trip) ─────────────────────

CREATE OR REPLACE FUNCTION public.admin_list_events_with_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH ticket_agg AS (
    SELECT
      event_id,
      count(*)::int AS sold,
      coalesce(sum(amount_cents), 0)::bigint AS gross_cents
    FROM public.tickets
    WHERE status IN ('valid', 'used')
    GROUP BY event_id
  )
  SELECT coalesce(jsonb_agg(
    to_jsonb(e) || jsonb_build_object(
      'sold', coalesce(ta.sold, 0),
      'gross_cents', coalesce(ta.gross_cents, 0),
      'display_status', public.event_display_status(
        e.status,
        coalesce(e.visibility, 'public'),
        e.id
      )
    )
    ORDER BY e.edition_number DESC
  ), '[]'::jsonb)
  FROM public.events e
  LEFT JOIN ticket_agg ta ON ta.event_id = e.id;
$$;

-- ─── Profile reaction totals (avoids loading all author posts) ────────────────

CREATE OR REPLACE FUNCTION public.profile_author_reaction_totals(p_author_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'fire', coalesce(sum((reaction_counts->>'fire')::int), 0),
    'eyes', coalesce(sum((reaction_counts->>'eyes')::int), 0),
    'heart', coalesce(sum((reaction_counts->>'heart')::int), 0)
  )
  FROM public.posts
  WHERE author_id = p_author_id;
$$;

-- ─── Batch email lookup for admin media ─────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_resolve_user_emails(p_user_ids uuid[])
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(jsonb_object_agg(u.id::text, u.email), '{}'::jsonb)
  FROM auth.users u
  WHERE u.id = ANY(p_user_ids)
    AND u.email IS NOT NULL;
$$;

-- ─── Email log stats (single query) ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_email_log_stats(
  p_date_from timestamptz,
  p_date_to timestamptz,
  p_status text DEFAULT NULL,
  p_app text DEFAULT NULL,
  p_kind text DEFAULT NULL,
  p_project_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total', count(*)::int,
    'sent', count(*) FILTER (WHERE status = 'sent')::int,
    'failed', count(*) FILTER (WHERE status = 'failed')::int,
    'queued', count(*) FILTER (WHERE status = 'queued')::int
  )
  FROM public.email_logs el
  WHERE el.created_at >= p_date_from
    AND el.created_at <= p_date_to
    AND (p_status IS NULL OR el.status = p_status)
    AND (p_app IS NULL OR el.app = p_app)
    AND (p_kind IS NULL OR el.kind = p_kind)
    AND (p_project_id IS NULL OR el.project_id = p_project_id);
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_events_with_stats() TO service_role;
GRANT EXECUTE ON FUNCTION public.profile_author_reaction_totals(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_resolve_user_emails(uuid[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_email_log_stats(timestamptz, timestamptz, text, text, text, uuid) TO service_role;
