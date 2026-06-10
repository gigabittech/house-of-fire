-- Cursor pagination for event photo galleries (member + admin).

CREATE INDEX IF NOT EXISTS idx_event_photos_event_cursor
  ON public.event_photos (event_id, status, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_event_photos_admin_cursor
  ON public.event_photos (status, created_at DESC, id DESC);

CREATE OR REPLACE FUNCTION public.count_event_photos(
  p_event_id uuid,
  p_status text DEFAULT 'approved'
)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::bigint
  FROM public.event_photos
  WHERE event_id = p_event_id
    AND status = p_status;
$$;

CREATE OR REPLACE FUNCTION public.list_event_photos(
  p_event_id uuid,
  p_status text DEFAULT 'approved',
  p_cursor_created_at timestamptz DEFAULT NULL,
  p_cursor_id uuid DEFAULT NULL,
  p_page_size int DEFAULT 48
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_page_size int := LEAST(GREATEST(coalesce(p_page_size, 48), 1), 100);
  v_fetch int := v_page_size + 1;
  v_rows jsonb;
  v_count int;
BEGIN
  WITH filtered AS (
    SELECT
      id,
      storage_path,
      public_url,
      caption,
      created_at
    FROM public.event_photos
    WHERE event_id = p_event_id
      AND status = p_status
      AND (
        p_cursor_created_at IS NULL
        OR p_cursor_id IS NULL
        OR (created_at, id) < (p_cursor_created_at, p_cursor_id)
      )
    ORDER BY created_at DESC, id DESC
    LIMIT v_fetch
  )
  SELECT coalesce(jsonb_agg(to_jsonb(filtered)), '[]'::jsonb),
         count(*)::int
  INTO v_rows, v_count
  FROM filtered;

  RETURN jsonb_build_object(
    'photos', coalesce((
      SELECT jsonb_agg(elem)
      FROM (
        SELECT elem
        FROM jsonb_array_elements(v_rows) WITH ORDINALITY AS t(elem, ord)
        WHERE ord <= v_page_size
      ) s
    ), '[]'::jsonb),
    'hasMore', v_count > v_page_size
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.list_admin_media_photos(
  p_status text DEFAULT NULL,
  p_event_id uuid DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_uploader_ids uuid[] DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL,
  p_cursor_created_at timestamptz DEFAULT NULL,
  p_cursor_id uuid DEFAULT NULL,
  p_page_size int DEFAULT 25
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_page_size int := LEAST(GREATEST(coalesce(p_page_size, 25), 1), 100);
  v_fetch int := v_page_size + 1;
  v_rows jsonb;
  v_count int;
  v_search text := nullif(trim(coalesce(p_search, '')), '');
  v_email text := nullif(lower(trim(coalesce(p_email, ''))), '');
BEGIN
  WITH filtered AS (
    SELECT
      ep.*,
      jsonb_build_object(
        'edition_number', ev.edition_number,
        'name', ev.name
      ) AS events,
      jsonb_build_object(
        'id', pr.id,
        'handle', pr.handle,
        'display_name', pr.display_name,
        'avatar_url', pr.avatar_url
      ) AS profiles
    FROM public.event_photos ep
    LEFT JOIN public.events ev ON ev.id = ep.event_id
    LEFT JOIN public.profiles pr ON pr.id = ep.uploader_id
    WHERE (p_status IS NULL OR ep.status = p_status)
      AND (p_event_id IS NULL OR ep.event_id = p_event_id)
      AND (p_date_from IS NULL OR ep.created_at >= p_date_from)
      AND (p_date_to IS NULL OR ep.created_at <= p_date_to)
      AND (
        v_search IS NULL
        OR ep.caption ILIKE ('%' || v_search || '%')
        OR ep.storage_path ILIKE ('%' || v_search || '%')
        OR (
          p_uploader_ids IS NOT NULL
          AND cardinality(p_uploader_ids) > 0
          AND ep.uploader_id = ANY(p_uploader_ids)
        )
      )
      AND (
        v_email IS NULL
        OR EXISTS (
          SELECT 1
          FROM auth.users u
          WHERE u.id = ep.uploader_id
            AND lower(coalesce(u.email, '')) LIKE ('%' || v_email || '%')
        )
      )
      AND (
        p_cursor_created_at IS NULL
        OR p_cursor_id IS NULL
        OR (ep.created_at, ep.id) < (p_cursor_created_at, p_cursor_id)
      )
    ORDER BY ep.created_at DESC, ep.id DESC
    LIMIT v_fetch
  )
  SELECT coalesce(
           jsonb_agg(
             to_jsonb(filtered) - 'events' - 'profiles'
             || jsonb_build_object('events', filtered.events, 'profiles', filtered.profiles)
           ),
           '[]'::jsonb
         ),
         count(*)::int
  INTO v_rows, v_count
  FROM filtered;

  RETURN jsonb_build_object(
    'photos', coalesce((
      SELECT jsonb_agg(elem)
      FROM (
        SELECT elem
        FROM jsonb_array_elements(v_rows) WITH ORDINALITY AS t(elem, ord)
        WHERE ord <= v_page_size
      ) s
    ), '[]'::jsonb),
    'hasMore', v_count > v_page_size
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.count_admin_media_photos(
  p_status text DEFAULT NULL,
  p_event_id uuid DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_uploader_ids uuid[] DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL
)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::bigint
  FROM public.event_photos ep
  WHERE (p_status IS NULL OR ep.status = p_status)
    AND (p_event_id IS NULL OR ep.event_id = p_event_id)
    AND (p_date_from IS NULL OR ep.created_at >= p_date_from)
    AND (p_date_to IS NULL OR ep.created_at <= p_date_to)
    AND (
      nullif(trim(coalesce(p_search, '')), '') IS NULL
      OR ep.caption ILIKE ('%' || trim(p_search) || '%')
      OR ep.storage_path ILIKE ('%' || trim(p_search) || '%')
      OR (
        p_uploader_ids IS NOT NULL
        AND cardinality(p_uploader_ids) > 0
        AND ep.uploader_id = ANY(p_uploader_ids)
      )
    )
    AND (
      nullif(lower(trim(coalesce(p_email, ''))), '') IS NULL
      OR EXISTS (
        SELECT 1
        FROM auth.users u
        WHERE u.id = ep.uploader_id
          AND lower(coalesce(u.email, '')) LIKE ('%' || lower(trim(p_email)) || '%')
      )
    );
$$;

GRANT EXECUTE ON FUNCTION public.count_event_photos(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.count_event_photos(uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION public.list_event_photos(uuid, text, timestamptz, uuid, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_event_photos(uuid, text, timestamptz, uuid, int) TO anon;
GRANT EXECUTE ON FUNCTION public.list_admin_media_photos(text, uuid, text, uuid[], text, timestamptz, timestamptz, timestamptz, uuid, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.count_admin_media_photos(text, uuid, text, uuid[], text, timestamptz, timestamptz) TO authenticated;
