-- Admin list/stats RPCs: pagination, search, sort, SQL aggregation (100k+ scale).

-- ─── Members ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_members_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH ticket_agg AS (
    SELECT
      t.holder_id,
      count(*)::int AS ticket_count,
      max(e.edition_number) AS last_edition,
      max(t.purchased_at) AS latest_purchase
    FROM public.tickets t
    JOIN public.events e ON e.id = t.event_id
    WHERE t.holder_id IS NOT NULL
      AND t.status IN ('valid', 'used', 'transferred')
    GROUP BY t.holder_id
  ),
  holders_with_tickets AS (
    SELECT count(*)::int AS cnt FROM ticket_agg
  ),
  returning_holders AS (
    SELECT count(*)::int AS cnt
    FROM (
      SELECT holder_id
      FROM public.tickets
      WHERE holder_id IS NOT NULL
        AND status IN ('valid', 'used', 'transferred')
      GROUP BY holder_id
      HAVING count(*) >= 2
    ) r
  )
  SELECT jsonb_build_object(
    'total', (SELECT count(*)::int FROM public.profiles),
    'new_this_month', (
      SELECT count(*)::int
      FROM public.profiles
      WHERE member_since >= date_trunc('month', now())
    ),
    'crew_count', (
      SELECT count(*)::int
      FROM public.profiles
      WHERE role IN ('crew', 'admin')
    ),
    'photographer_count', (
      SELECT count(*)::int
      FROM public.profiles
      WHERE coalesce((settings->>'photographer')::boolean, false)
    ),
    'return_rate', CASE
      WHEN (SELECT cnt FROM holders_with_tickets) = 0 THEN 0
      ELSE (
        SELECT round((SELECT cnt FROM returning_holders)::numeric * 100 / (SELECT cnt FROM holders_with_tickets))
      )::int
    END,
    'active_90', (
      SELECT count(*)::int
      FROM public.profiles p
      LEFT JOIN ticket_agg ta ON ta.holder_id = p.id
      WHERE ta.latest_purchase >= now() - interval '90 days'
         OR p.member_since >= now() - interval '90 days'
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.admin_list_members(
  p_page int DEFAULT 1,
  p_page_size int DEFAULT 25,
  p_search text DEFAULT NULL,
  p_sort text DEFAULT 'member_since',
  p_sort_dir text DEFAULT 'desc'
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_page int := GREATEST(coalesce(p_page, 1), 1);
  v_page_size int := LEAST(GREATEST(coalesce(p_page_size, 25), 1), 100);
  v_offset int := (v_page - 1) * v_page_size;
  v_total bigint;
  v_sort text := lower(coalesce(nullif(trim(p_sort), ''), 'member_since'));
  v_dir text := CASE WHEN lower(coalesce(p_sort_dir, 'desc')) = 'asc' THEN 'asc' ELSE 'desc' END;
  v_search text := nullif(trim(coalesce(p_search, '')), '');
  v_rows jsonb;
BEGIN
  SELECT count(*)::bigint INTO v_total
  FROM public.profiles p
  WHERE v_search IS NULL
     OR p.display_name ILIKE '%' || v_search || '%'
     OR p.handle ILIKE '%' || v_search || '%';

  WITH ticket_stats AS (
    SELECT
      t.holder_id,
      count(*)::int AS ticket_count,
      max(e.edition_number) AS last_edition
    FROM public.tickets t
    JOIN public.events e ON e.id = t.event_id
    WHERE t.holder_id IS NOT NULL
      AND t.status IN ('valid', 'used', 'transferred')
    GROUP BY t.holder_id
  ),
  latest_tier AS (
    SELECT DISTINCT ON (t.holder_id)
      t.holder_id,
      coalesce(tt.display_name, tt.name) AS latest_tier_name
    FROM public.tickets t
    JOIN public.ticket_tiers tt ON tt.id = t.tier_id
    WHERE t.holder_id IS NOT NULL
      AND t.status IN ('valid', 'used', 'transferred')
    ORDER BY t.holder_id, t.purchased_at DESC
  ),
  post_stats AS (
    SELECT author_id, count(*)::int AS post_count
    FROM public.posts
    GROUP BY author_id
  ),
  filtered AS (
    SELECT
      p.id,
      p.handle,
      p.display_name,
      p.avatar_url,
      p.member_since,
      p.role,
      p.settings,
      coalesce(ts.ticket_count, 0) AS ticket_count,
      coalesce(ps.post_count, 0) AS post_count,
      ts.last_edition,
      lt.latest_tier_name
    FROM public.profiles p
    LEFT JOIN ticket_stats ts ON ts.holder_id = p.id
    LEFT JOIN latest_tier lt ON lt.holder_id = p.id
    LEFT JOIN post_stats ps ON ps.author_id = p.id
    WHERE v_search IS NULL
       OR p.display_name ILIKE '%' || v_search || '%'
       OR p.handle ILIKE '%' || v_search || '%'
  ),
  sorted AS (
    SELECT *
    FROM filtered f
    ORDER BY
      CASE WHEN v_sort = 'display_name' AND v_dir = 'asc' THEN f.display_name END ASC NULLS LAST,
      CASE WHEN v_sort = 'display_name' AND v_dir = 'desc' THEN f.display_name END DESC NULLS LAST,
      CASE WHEN v_sort = 'handle' AND v_dir = 'asc' THEN f.handle END ASC NULLS LAST,
      CASE WHEN v_sort = 'handle' AND v_dir = 'desc' THEN f.handle END DESC NULLS LAST,
      CASE WHEN v_sort = 'ticket_count' AND v_dir = 'asc' THEN f.ticket_count END ASC NULLS LAST,
      CASE WHEN v_sort = 'ticket_count' AND v_dir = 'desc' THEN f.ticket_count END DESC NULLS LAST,
      CASE WHEN v_sort = 'post_count' AND v_dir = 'asc' THEN f.post_count END ASC NULLS LAST,
      CASE WHEN v_sort = 'post_count' AND v_dir = 'desc' THEN f.post_count END DESC NULLS LAST,
      CASE WHEN v_sort = 'last_edition' AND v_dir = 'asc' THEN f.last_edition END ASC NULLS LAST,
      CASE WHEN v_sort = 'last_edition' AND v_dir = 'desc' THEN f.last_edition END DESC NULLS LAST,
      CASE WHEN v_sort = 'member_since' AND v_dir = 'asc' THEN f.member_since END ASC NULLS LAST,
      CASE WHEN v_sort = 'member_since' AND v_dir = 'desc' THEN f.member_since END DESC NULLS LAST,
      f.id ASC
    OFFSET v_offset
    LIMIT v_page_size
  )
  SELECT coalesce(jsonb_agg(to_jsonb(s)), '[]'::jsonb) INTO v_rows FROM sorted s;

  RETURN jsonb_build_object(
    'members', v_rows,
    'pagination', jsonb_build_object(
      'page', v_page,
      'pageSize', v_page_size,
      'totalCount', v_total,
      'totalPages', GREATEST(1, ceil(v_total::numeric / v_page_size)::int)
    )
  );
END;
$$;

-- ─── Guests (tickets) ────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_list_guests(
  p_page int DEFAULT 1,
  p_page_size int DEFAULT 25,
  p_event_id uuid DEFAULT NULL,
  p_tier_id uuid DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_code text DEFAULT NULL,
  p_name_search text DEFAULT NULL,
  p_sort text DEFAULT 'purchased_at',
  p_sort_dir text DEFAULT 'desc'
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_page int := GREATEST(coalesce(p_page, 1), 1);
  v_page_size int := LEAST(GREATEST(coalesce(p_page_size, 25), 1), 100);
  v_offset int := (v_page - 1) * v_page_size;
  v_total bigint;
  v_sort text := lower(coalesce(nullif(trim(p_sort), ''), 'purchased_at'));
  v_dir text := CASE WHEN lower(coalesce(p_sort_dir, 'desc')) = 'asc' THEN 'asc' ELSE 'desc' END;
  v_email text := nullif(trim(coalesce(p_email, '')), '');
  v_code text := nullif(trim(coalesce(p_code, '')), '');
  v_name text := nullif(trim(coalesce(p_name_search, '')), '');
  v_rows jsonb;
BEGIN
  SELECT count(*)::bigint INTO v_total
  FROM public.tickets t
  LEFT JOIN public.profiles pr ON pr.id = t.holder_id
  WHERE (p_event_id IS NULL OR t.event_id = p_event_id)
    AND (p_tier_id IS NULL OR t.tier_id = p_tier_id)
    AND (v_code IS NULL OR t.code ILIKE '%' || v_code || '%')
    AND (
      v_email IS NULL
      OR coalesce(t.metadata->>'holder_email', '') ILIKE '%' || v_email || '%'
      OR coalesce(t.metadata->>'email', '') ILIKE '%' || v_email || '%'
      OR coalesce(pr.handle, '') ILIKE '%' || v_email || '%'
    )
    AND (
      v_name IS NULL
      OR coalesce(pr.display_name, '') ILIKE '%' || v_name || '%'
      OR coalesce(pr.handle, '') ILIKE '%' || v_name || '%'
      OR coalesce(t.metadata->>'holder_name', '') ILIKE '%' || v_name || '%'
      OR trim(
        coalesce(t.metadata->>'first_name', '') || ' ' || coalesce(t.metadata->>'last_name', '')
      ) ILIKE '%' || v_name || '%'
    );

  WITH base AS (
    SELECT
      t.id,
      t.code,
      t.event_id,
      t.tier_id,
      t.order_id,
      t.amount_cents,
      t.fee_cents,
      t.status,
      t.purchased_at,
      t.used_at,
      t.checked_in_at,
      t.source,
      t.metadata,
      t.qr_data,
      t.stripe_charge_id,
      CASE WHEN pr.id IS NULL THEN NULL ELSE jsonb_build_object(
        'id', pr.id,
        'display_name', pr.display_name,
        'handle', pr.handle,
        'avatar_url', pr.avatar_url
      ) END AS profiles,
      jsonb_build_object(
        'id', tt.id,
        'display_name', tt.display_name,
        'name', tt.name
      ) AS ticket_tiers,
      jsonb_build_object(
        'id', e.id,
        'edition_number', e.edition_number,
        'name', e.name,
        'date', e.date,
        'venue_name', e.venue_name,
        'status', e.status
      ) AS events,
      CASE WHEN o.id IS NULL THEN NULL ELSE jsonb_build_object(
        'id', o.id,
        'subtotal_cents', o.subtotal_cents,
        'discount_cents', o.discount_cents,
        'fee_cents', o.fee_cents,
        'total_cents', o.total_cents,
        'stripe_payment_intent_id', o.stripe_payment_intent_id,
        'status', o.status,
        'created_at', o.created_at
      ) END AS orders
    FROM public.tickets t
    JOIN public.ticket_tiers tt ON tt.id = t.tier_id
    JOIN public.events e ON e.id = t.event_id
    LEFT JOIN public.profiles pr ON pr.id = t.holder_id
    LEFT JOIN public.orders o ON o.id = t.order_id
    WHERE (p_event_id IS NULL OR t.event_id = p_event_id)
      AND (p_tier_id IS NULL OR t.tier_id = p_tier_id)
      AND (v_code IS NULL OR t.code ILIKE '%' || v_code || '%')
      AND (
        v_email IS NULL
        OR coalesce(t.metadata->>'holder_email', '') ILIKE '%' || v_email || '%'
        OR coalesce(t.metadata->>'email', '') ILIKE '%' || v_email || '%'
        OR coalesce(pr.handle, '') ILIKE '%' || v_email || '%'
      )
      AND (
        v_name IS NULL
        OR coalesce(pr.display_name, '') ILIKE '%' || v_name || '%'
        OR coalesce(pr.handle, '') ILIKE '%' || v_name || '%'
        OR coalesce(t.metadata->>'holder_name', '') ILIKE '%' || v_name || '%'
        OR trim(
          coalesce(t.metadata->>'first_name', '') || ' ' || coalesce(t.metadata->>'last_name', '')
        ) ILIKE '%' || v_name || '%'
      )
  ),
  sorted AS (
    SELECT *
    FROM base b
    ORDER BY
      CASE WHEN v_sort = 'code' AND v_dir = 'asc' THEN b.code END ASC NULLS LAST,
      CASE WHEN v_sort = 'code' AND v_dir = 'desc' THEN b.code END DESC NULLS LAST,
      CASE WHEN v_sort = 'status' AND v_dir = 'asc' THEN b.status END ASC NULLS LAST,
      CASE WHEN v_sort = 'status' AND v_dir = 'desc' THEN b.status END DESC NULLS LAST,
      CASE WHEN v_sort = 'amount_cents' AND v_dir = 'asc' THEN b.amount_cents END ASC NULLS LAST,
      CASE WHEN v_sort = 'amount_cents' AND v_dir = 'desc' THEN b.amount_cents END DESC NULLS LAST,
      CASE WHEN v_sort = 'purchased_at' AND v_dir = 'asc' THEN b.purchased_at END ASC NULLS LAST,
      CASE WHEN v_sort = 'purchased_at' AND v_dir = 'desc' THEN b.purchased_at END DESC NULLS LAST,
      b.id ASC
    OFFSET v_offset
    LIMIT v_page_size
  )
  SELECT coalesce(jsonb_agg(to_jsonb(s)), '[]'::jsonb) INTO v_rows FROM sorted s;

  RETURN jsonb_build_object(
    'guests', v_rows,
    'pagination', jsonb_build_object(
      'page', v_page,
      'pageSize', v_page_size,
      'totalCount', v_total,
      'totalPages', GREATEST(1, ceil(v_total::numeric / v_page_size)::int)
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_guests_tier_status(p_event_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH tier_rows AS (
    SELECT
      tt.id AS tier_id,
      tt.event_id,
      tt.name,
      tt.display_name,
      tt.capacity,
      tt.status AS tier_status,
      tt.sort_order,
      GREATEST(0, coalesce(tt.sold_count, 0)) AS sold
    FROM public.ticket_tiers tt
    WHERE tt.status <> 'hidden'
      AND (p_event_id IS NULL OR tt.event_id = p_event_id)
  ),
  grouped AS (
    SELECT
      e.id AS event_id,
      e.edition_number,
      e.name,
      e.status,
      jsonb_agg(
        jsonb_build_object(
          'tier_id', tr.tier_id,
          'name', tr.name,
          'display_name', tr.display_name,
          'capacity', tr.capacity,
          'sold', tr.sold,
          'remaining', GREATEST(0, tr.capacity - tr.sold),
          'tier_status', tr.tier_status
        )
        ORDER BY tr.sort_order
      ) AS tiers
    FROM tier_rows tr
    JOIN public.events e ON e.id = tr.event_id
    GROUP BY e.id, e.edition_number, e.name, e.status
  )
  SELECT coalesce(
    jsonb_agg(
      jsonb_build_object(
        'event_id', g.event_id,
        'edition_number', g.edition_number,
        'name', g.name,
        'status', g.status,
        'tiers', g.tiers
      )
      ORDER BY g.edition_number DESC
    ),
    '[]'::jsonb
  )
  FROM grouped g;
$$;

-- ─── Financials ──────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_financials_list(
  p_page int DEFAULT 1,
  p_page_size int DEFAULT 25,
  p_search text DEFAULT NULL,
  p_sort text DEFAULT 'edition_number',
  p_sort_dir text DEFAULT 'desc'
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_page int := GREATEST(coalesce(p_page, 1), 1);
  v_page_size int := LEAST(GREATEST(coalesce(p_page_size, 25), 1), 100);
  v_offset int := (v_page - 1) * v_page_size;
  v_total bigint;
  v_sort text := lower(coalesce(nullif(trim(p_sort), ''), 'edition_number'));
  v_dir text := CASE WHEN lower(coalesce(p_sort_dir, 'desc')) = 'asc' THEN 'asc' ELSE 'desc' END;
  v_search text := nullif(trim(coalesce(p_search, '')), '');
  v_rows jsonb;
  v_totals jsonb;
BEGIN
  WITH revenue AS (
    SELECT
      t.event_id,
      sum(t.amount_cents)::bigint AS gross_cents,
      count(*)::int AS ticket_count
    FROM public.tickets t
    WHERE t.status IN ('valid', 'used')
    GROUP BY t.event_id
  ),
  joined AS (
    SELECT
      e.id AS event_id,
      e.edition_number,
      e.name,
      e.date,
      e.status,
      coalesce(r.gross_cents, 0)::bigint AS gross_cents,
      coalesce(r.ticket_count, 0)::int AS ticket_count
    FROM public.events e
    LEFT JOIN revenue r ON r.event_id = e.id
    WHERE v_search IS NULL
       OR e.name ILIKE '%' || v_search || '%'
       OR e.edition_number::text ILIKE '%' || v_search || '%'
  )
  SELECT count(*)::bigint INTO v_total FROM joined;

  SELECT jsonb_build_object(
    'gross_cents', coalesce(sum(gross_cents), 0),
    'ticket_count', coalesce(sum(ticket_count), 0)
  ) INTO v_totals
  FROM (
    SELECT
      e.id AS event_id,
      coalesce(r.gross_cents, 0)::bigint AS gross_cents,
      coalesce(r.ticket_count, 0)::int AS ticket_count
    FROM public.events e
    LEFT JOIN (
      SELECT event_id, sum(amount_cents)::bigint AS gross_cents, count(*)::int AS ticket_count
      FROM public.tickets
      WHERE status IN ('valid', 'used')
      GROUP BY event_id
    ) r ON r.event_id = e.id
    WHERE v_search IS NULL
       OR e.name ILIKE '%' || v_search || '%'
       OR e.edition_number::text ILIKE '%' || v_search || '%'
  ) all_rows;

  WITH revenue AS (
    SELECT
      t.event_id,
      sum(t.amount_cents)::bigint AS gross_cents,
      count(*)::int AS ticket_count
    FROM public.tickets t
    WHERE t.status IN ('valid', 'used')
    GROUP BY t.event_id
  ),
  joined AS (
    SELECT
      e.id AS event_id,
      e.edition_number,
      e.name,
      e.date,
      e.status,
      coalesce(r.gross_cents, 0)::bigint AS gross_cents,
      coalesce(r.ticket_count, 0)::int AS ticket_count
    FROM public.events e
    LEFT JOIN revenue r ON r.event_id = e.id
    WHERE v_search IS NULL
       OR e.name ILIKE '%' || v_search || '%'
       OR e.edition_number::text ILIKE '%' || v_search || '%'
  ),
  sorted AS (
    SELECT *
    FROM joined j
    ORDER BY
      CASE WHEN v_sort = 'name' AND v_dir = 'asc' THEN j.name END ASC NULLS LAST,
      CASE WHEN v_sort = 'name' AND v_dir = 'desc' THEN j.name END DESC NULLS LAST,
      CASE WHEN v_sort = 'date' AND v_dir = 'asc' THEN j.date END ASC NULLS LAST,
      CASE WHEN v_sort = 'date' AND v_dir = 'desc' THEN j.date END DESC NULLS LAST,
      CASE WHEN v_sort = 'gross_cents' AND v_dir = 'asc' THEN j.gross_cents END ASC NULLS LAST,
      CASE WHEN v_sort = 'gross_cents' AND v_dir = 'desc' THEN j.gross_cents END DESC NULLS LAST,
      CASE WHEN v_sort = 'ticket_count' AND v_dir = 'asc' THEN j.ticket_count END ASC NULLS LAST,
      CASE WHEN v_sort = 'ticket_count' AND v_dir = 'desc' THEN j.ticket_count END DESC NULLS LAST,
      CASE WHEN v_sort = 'edition_number' AND v_dir = 'asc' THEN j.edition_number END ASC NULLS LAST,
      CASE WHEN v_sort = 'edition_number' AND v_dir = 'desc' THEN j.edition_number END DESC NULLS LAST,
      j.event_id ASC
    OFFSET v_offset
    LIMIT v_page_size
  )
  SELECT coalesce(jsonb_agg(to_jsonb(s)), '[]'::jsonb) INTO v_rows FROM sorted s;

  RETURN jsonb_build_object(
    'financials', v_rows,
    'totals', v_totals,
    'pagination', jsonb_build_object(
      'page', v_page,
      'pageSize', v_page_size,
      'totalCount', v_total,
      'totalPages', GREATEST(1, ceil(v_total::numeric / v_page_size)::int)
    )
  );
END;
$$;

-- ─── Event stats (door + dashboard) ────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_event_ticket_stats(p_event_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH agg AS (
    SELECT
      count(*) FILTER (WHERE status IN ('valid', 'used'))::int AS sold,
      count(*) FILTER (WHERE status = 'used')::int AS scanned,
      count(*) FILTER (
        WHERE status IN ('valid', 'used')
          AND (source = 'door' OR coalesce(stripe_charge_id, '') LIKE 'door-%')
      )::int AS walkup_count,
      coalesce(sum(amount_cents) FILTER (
        WHERE status IN ('valid', 'used')
          AND (source = 'door' OR coalesce(stripe_charge_id, '') LIKE 'door-%')
      ), 0)::bigint AS walkup_gross_cents
    FROM public.tickets
    WHERE event_id = p_event_id
  ),
  tier_sold AS (
    SELECT
      tt.id,
      tt.name,
      tt.display_name,
      tt.description,
      tt.price_cents,
      coalesce(tt.fee_cents, 0) AS fee_cents,
      tt.capacity,
      tt.status,
      tt.sort_order,
      GREATEST(0, coalesce(tt.sold_count, 0)) AS sold
    FROM public.ticket_tiers tt
    WHERE tt.event_id = p_event_id
      AND tt.status <> 'hidden'
    ORDER BY tt.sort_order
  )
  SELECT jsonb_build_object(
    'stats', (
      SELECT jsonb_build_object(
        'sold', a.sold,
        'scanned', a.scanned,
        'walkupCount', a.walkup_count,
        'walkupGrossCents', a.walkup_gross_cents,
        'remaining', GREATEST(0, (SELECT capacity FROM public.events WHERE id = p_event_id) - a.sold),
        'capacity', (SELECT capacity FROM public.events WHERE id = p_event_id)
      )
      FROM agg a
    ),
    'tiers', coalesce((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', ts.id,
          'name', ts.name,
          'display_name', ts.display_name,
          'description', ts.description,
          'price_cents', ts.price_cents,
          'fee_cents', ts.fee_cents,
          'status', ts.status,
          'sold', ts.sold,
          'remaining', GREATEST(0, ts.capacity - ts.sold),
          'purchasable', ts.status = 'available'
            AND GREATEST(0, ts.capacity - ts.sold) > 0
            AND GREATEST(0, (SELECT capacity FROM public.events WHERE id = p_event_id) - (SELECT sold FROM agg)) > 0
        )
        ORDER BY ts.sort_order
      )
      FROM tier_sold ts
    ), '[]'::jsonb)
  );
$$;

CREATE OR REPLACE FUNCTION public.admin_dashboard_event_metrics(p_event_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH daily AS (
    SELECT
      (t.purchased_at AT TIME ZONE 'UTC')::date AS day,
      count(*)::int AS cnt,
      count(*) FILTER (
        WHERE t.source = 'door' OR coalesce(t.stripe_charge_id, '') LIKE 'door-%'
      )::int AS door_cnt,
      count(*) FILTER (
        WHERE NOT (t.source = 'door' OR coalesce(t.stripe_charge_id, '') LIKE 'door-%')
      )::int AS online_cnt
    FROM public.tickets t
    WHERE t.event_id = p_event_id
      AND t.status IN ('valid', 'used')
    GROUP BY 1
  ),
  last_days AS (
    SELECT day, cnt, door_cnt
    FROM daily
    ORDER BY day DESC
    LIMIT 14
  ),
  sales_series AS (
    SELECT coalesce(array_agg(cnt ORDER BY day ASC), ARRAY[0]::int[]) AS arr
    FROM (SELECT day, cnt FROM last_days ORDER BY day ASC) s
  ),
  door_series AS (
    SELECT coalesce(array_agg(door_cnt ORDER BY day ASC), ARRAY[0]::int[]) AS arr
    FROM (SELECT day, door_cnt FROM last_days ORDER BY day ASC) s
  ),
  channel AS (
    SELECT
      coalesce(sum(online_cnt), 0)::int AS online,
      coalesce(sum(door_cnt), 0)::int AS door
    FROM daily
  ),
  tier_bars AS (
    SELECT coalesce(
      jsonb_agg(
        jsonb_build_object(
          'label', coalesce(tt.display_name, tt.name),
          'sold', GREATEST(0, coalesce(tt.sold_count, 0)),
          'cap', tt.capacity
        )
        ORDER BY tt.sort_order
      ),
      '[]'::jsonb
    ) AS bars
    FROM public.ticket_tiers tt
    WHERE tt.event_id = p_event_id
  )
  SELECT jsonb_build_object(
    'salesData', (SELECT to_jsonb(arr) FROM sales_series),
    'doorSalesByDay', (SELECT to_jsonb(arr) FROM door_series),
    'salesByChannel', (SELECT jsonb_build_object('online', online, 'door', door) FROM channel),
    'tierBars', (SELECT bars FROM tier_bars),
    'openRequests', (
      SELECT count(*)::int
      FROM public.refund_requests
      WHERE status = 'pending'
    ),
    'eventStats', (
      SELECT jsonb_build_object(
        'sold', count(*) FILTER (WHERE status IN ('valid', 'used'))::int,
        'scanned', count(*) FILTER (WHERE status = 'used')::int,
        'gross_cents', coalesce(sum(amount_cents) FILTER (WHERE status IN ('valid', 'used')), 0)::bigint
      )
      FROM public.tickets
      WHERE event_id = p_event_id
    )
  );
$$;

GRANT EXECUTE ON FUNCTION public.admin_members_stats() TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_list_members(int, int, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_list_guests(int, int, uuid, uuid, text, text, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_guests_tier_status(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_financials_list(int, int, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_event_ticket_stats(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_dashboard_event_metrics(uuid) TO service_role;
