-- Cursor pagination indexes + RPCs for community feed and replies.

CREATE INDEX IF NOT EXISTS idx_posts_feed_cursor
  ON public.posts (moderation_status, channel, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_posts_author_cursor
  ON public.posts (author_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_replies_post_cursor
  ON public.replies (post_id, created_at ASC, id ASC);

CREATE OR REPLACE FUNCTION public.list_community_posts(
  p_channel text DEFAULT NULL,
  p_event_id uuid DEFAULT NULL,
  p_active_event_id uuid DEFAULT NULL,
  p_cursor_created_at timestamptz DEFAULT NULL,
  p_cursor_id uuid DEFAULT NULL,
  p_page_size int DEFAULT 20
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_page_size int := LEAST(GREATEST(coalesce(p_page_size, 20), 1), 50);
  v_fetch int := v_page_size + 1;
  v_rows jsonb;
  v_count int;
BEGIN
  WITH filtered AS (
    SELECT
      p.*,
      jsonb_build_object(
        'handle', pr.handle,
        'display_name', pr.display_name,
        'role', pr.role,
        'avatar_url', pr.avatar_url
      ) AS profiles
    FROM public.posts p
    LEFT JOIN public.profiles pr ON pr.id = p.author_id
    WHERE p.moderation_status = 'approved'
      AND (p_channel IS NULL OR p.channel = p_channel)
      AND (
        (p_event_id IS NOT NULL AND p.event_id = p_event_id)
        OR (
          p_event_id IS NULL
          AND p_active_event_id IS NOT NULL
          AND (p.event_id IS NULL OR p.event_id = p_active_event_id)
        )
        OR (
          p_event_id IS NULL
          AND p_active_event_id IS NULL
          AND p.event_id IS NULL
        )
      )
      AND (
        p_cursor_created_at IS NULL
        OR p_cursor_id IS NULL
        OR (p.created_at, p.id) < (p_cursor_created_at, p_cursor_id)
      )
    ORDER BY p.created_at DESC, p.id DESC
    LIMIT v_fetch
  )
  SELECT coalesce(jsonb_agg(to_jsonb(filtered) - 'profiles' || jsonb_build_object('profiles', filtered.profiles)), '[]'::jsonb),
         count(*)::int
  INTO v_rows, v_count
  FROM (SELECT * FROM filtered) filtered;

  RETURN jsonb_build_object(
    'posts', coalesce((
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

CREATE OR REPLACE FUNCTION public.list_author_posts(
  p_author_id uuid,
  p_cursor_created_at timestamptz DEFAULT NULL,
  p_cursor_id uuid DEFAULT NULL,
  p_page_size int DEFAULT 20
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_page_size int := LEAST(GREATEST(coalesce(p_page_size, 20), 1), 50);
  v_fetch int := v_page_size + 1;
  v_rows jsonb;
  v_count int;
BEGIN
  WITH filtered AS (
    SELECT
      p.*,
      jsonb_build_object(
        'handle', pr.handle,
        'display_name', pr.display_name,
        'role', pr.role,
        'avatar_url', pr.avatar_url
      ) AS profiles
    FROM public.posts p
    LEFT JOIN public.profiles pr ON pr.id = p.author_id
    WHERE p.author_id = p_author_id
      AND (
        p_cursor_created_at IS NULL
        OR p_cursor_id IS NULL
        OR (p.created_at, p.id) < (p_cursor_created_at, p_cursor_id)
      )
    ORDER BY p.created_at DESC, p.id DESC
    LIMIT v_fetch
  )
  SELECT coalesce(jsonb_agg(to_jsonb(filtered) - 'profiles' || jsonb_build_object('profiles', filtered.profiles)), '[]'::jsonb),
         count(*)::int
  INTO v_rows, v_count
  FROM (SELECT * FROM filtered) filtered;

  RETURN jsonb_build_object(
    'posts', coalesce((
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

CREATE OR REPLACE FUNCTION public.list_post_replies(
  p_post_id uuid,
  p_cursor_created_at timestamptz DEFAULT NULL,
  p_cursor_id uuid DEFAULT NULL,
  p_page_size int DEFAULT 30
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_page_size int := LEAST(GREATEST(coalesce(p_page_size, 30), 1), 100);
  v_fetch int := v_page_size + 1;
  v_rows jsonb;
  v_count int;
BEGIN
  WITH filtered AS (
    SELECT
      r.*,
      jsonb_build_object(
        'handle', pr.handle,
        'display_name', pr.display_name,
        'role', pr.role,
        'avatar_url', pr.avatar_url
      ) AS profiles
    FROM public.replies r
    LEFT JOIN public.profiles pr ON pr.id = r.author_id
    WHERE r.post_id = p_post_id
      AND (
        p_cursor_created_at IS NULL
        OR p_cursor_id IS NULL
        OR (r.created_at, r.id) > (p_cursor_created_at, p_cursor_id)
      )
    ORDER BY r.created_at ASC, r.id ASC
    LIMIT v_fetch
  )
  SELECT coalesce(jsonb_agg(to_jsonb(filtered) - 'profiles' || jsonb_build_object('profiles', filtered.profiles)), '[]'::jsonb),
         count(*)::int
  INTO v_rows, v_count
  FROM (SELECT * FROM filtered) filtered;

  RETURN jsonb_build_object(
    'replies', coalesce((
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

GRANT EXECUTE ON FUNCTION public.list_community_posts(text, uuid, uuid, timestamptz, uuid, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_community_posts(text, uuid, uuid, timestamptz, uuid, int) TO anon;
GRANT EXECUTE ON FUNCTION public.list_author_posts(uuid, timestamptz, uuid, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_post_replies(uuid, timestamptz, uuid, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_post_replies(uuid, timestamptz, uuid, int) TO anon;
