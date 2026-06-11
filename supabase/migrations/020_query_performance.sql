-- Query performance: indexes, redundant index cleanup, incremental trigger maintenance.

-- ─── New indexes (requested + query-audit additions) ─────────────────────────

-- sold_count sync, tier_available_count, per-tier inventory scans
CREATE INDEX IF NOT EXISTS idx_tickets_tier_status
  ON public.tickets (tier_id, status);

-- List tiers for an event (checkout, door, upcoming)
CREATE INDEX IF NOT EXISTS idx_ticket_tiers_event_id
  ON public.ticket_tiers (event_id);

-- getLiveEvent / getActiveEvent: status filter + edition_number DESC
CREATE INDEX IF NOT EXISTS idx_events_status_edition
  ON public.events (status, edition_number DESC);

-- Community feed, mod queue, nav pending counts: moderation + channel + recency
CREATE INDEX IF NOT EXISTS idx_posts_mod_channel_created
  ON public.posts (moderation_status, channel, created_at DESC);

-- Event photo galleries and admin media filters
CREATE INDEX IF NOT EXISTS idx_event_photos_event_status_created
  ON public.event_photos (event_id, status, created_at DESC);

-- Profile posts, member post-count aggregation
CREATE INDEX IF NOT EXISTS idx_posts_author_created
  ON public.posts (author_id, created_at DESC);

-- Admin refunds queue and status filters
CREATE INDEX IF NOT EXISTS idx_refund_requests_status_created
  ON public.refund_requests (status, created_at DESC);

-- tickets/mine: holder filter + purchased_at DESC
CREATE INDEX IF NOT EXISTS idx_tickets_holder_purchased
  ON public.tickets (holder_id, purchased_at DESC);

-- Feed myReactions: user_id + post_id IN (...)
CREATE INDEX IF NOT EXISTS idx_post_reactions_user_post
  ON public.post_reactions (user_id, post_id);

-- Mod reports queue: open reports by recency
CREATE INDEX IF NOT EXISTS idx_content_reports_status_created
  ON public.content_reports (status, created_at DESC);

-- Archive: past events ordered by date
CREATE INDEX IF NOT EXISTS idx_events_status_date
  ON public.events (status, date DESC);

-- ─── Drop redundant indexes superseded by composites ─────────────────────────

DROP INDEX IF EXISTS public.idx_tickets_event_id;
DROP INDEX IF EXISTS public.idx_posts_moderation_status;
DROP INDEX IF EXISTS public.idx_content_reports_status;

-- ─── sold_count: incremental maintenance (O(1) per ticket change) ───────────

CREATE OR REPLACE FUNCTION public.ticket_status_counts_toward_sold(p_status text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT p_status IN ('valid', 'used');
$$;

CREATE OR REPLACE FUNCTION public.adjust_tier_sold_count(p_tier_id uuid, p_delta integer)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.ticket_tiers
  SET
    sold_count = GREATEST(0, sold_count + p_delta),
    updated_at = now()
  WHERE id = p_tier_id
    AND p_delta <> 0;
$$;

CREATE OR REPLACE FUNCTION public.sync_tier_sold_count_for_tier(p_tier_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.ticket_tiers
  SET sold_count = COALESCE((
    SELECT count(*)::integer
    FROM public.tickets
    WHERE tier_id = p_tier_id
      AND status IN ('valid', 'used')
  ), 0),
  updated_at = now()
  WHERE id = p_tier_id;
$$;

CREATE OR REPLACE FUNCTION public.sync_tier_sold_count_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_counts boolean;
  new_counts boolean;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF public.ticket_status_counts_toward_sold(NEW.status) THEN
      PERFORM public.adjust_tier_sold_count(NEW.tier_id, 1);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF public.ticket_status_counts_toward_sold(OLD.status) THEN
      PERFORM public.adjust_tier_sold_count(OLD.tier_id, -1);
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    old_counts := public.ticket_status_counts_toward_sold(OLD.status);
    new_counts := public.ticket_status_counts_toward_sold(NEW.status);

    IF OLD.tier_id IS DISTINCT FROM NEW.tier_id THEN
      IF old_counts THEN
        PERFORM public.adjust_tier_sold_count(OLD.tier_id, -1);
      END IF;
      IF new_counts THEN
        PERFORM public.adjust_tier_sold_count(NEW.tier_id, 1);
      END IF;
    ELSIF old_counts AND NOT new_counts THEN
      PERFORM public.adjust_tier_sold_count(NEW.tier_id, -1);
    ELSIF NOT old_counts AND new_counts THEN
      PERFORM public.adjust_tier_sold_count(NEW.tier_id, 1);
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Use denormalized sold_count instead of scanning tickets on every checkout check
CREATE OR REPLACE FUNCTION public.tier_available_count(p_tier_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT GREATEST(0, (t.capacity - t.sold_count))::integer
  FROM public.ticket_tiers t
  WHERE t.id = p_tier_id;
$$;

-- ─── reaction_counts: incremental maintenance (O(1) per reaction change) ──────

CREATE OR REPLACE FUNCTION public.adjust_post_reaction_counts(
  p_post_id uuid,
  p_emoji text,
  p_delta integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count integer;
BEGIN
  IF p_delta = 0 OR p_emoji IS NULL THEN
    RETURN;
  END IF;

  SELECT COALESCE((reaction_counts ->> p_emoji)::integer, 0)
  INTO current_count
  FROM public.posts
  WHERE id = p_post_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  current_count := GREATEST(0, current_count + p_delta);

  IF current_count = 0 THEN
    UPDATE public.posts
    SET reaction_counts = COALESCE(reaction_counts, '{}'::jsonb) - p_emoji
    WHERE id = p_post_id;
  ELSE
    UPDATE public.posts
    SET reaction_counts = jsonb_set(
      COALESCE(reaction_counts, '{}'::jsonb),
      ARRAY[p_emoji],
      to_jsonb(current_count),
      true
    )
    WHERE id = p_post_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_post_reaction_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_post_id uuid;
BEGIN
  target_post_id := COALESCE(NEW.post_id, OLD.post_id);

  IF TG_OP = 'INSERT' THEN
    PERFORM public.adjust_post_reaction_counts(target_post_id, NEW.emoji, 1);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.adjust_post_reaction_counts(target_post_id, OLD.emoji, -1);
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.emoji IS DISTINCT FROM NEW.emoji THEN
      PERFORM public.adjust_post_reaction_counts(target_post_id, OLD.emoji, -1);
      PERFORM public.adjust_post_reaction_counts(target_post_id, NEW.emoji, 1);
    END IF;
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;

-- One-time reconcile reaction_counts from source rows (safe after incremental switch)
UPDATE public.posts p
SET reaction_counts = COALESCE(src.counts, '{}'::jsonb)
FROM (
  SELECT
    pr.post_id,
    jsonb_strip_nulls(jsonb_build_object(
      'fire',  NULLIF(count(*) FILTER (WHERE pr.emoji = 'fire'), 0),
      'eyes',  NULLIF(count(*) FILTER (WHERE pr.emoji = 'eyes'), 0),
      'heart', NULLIF(count(*) FILTER (WHERE pr.emoji = 'heart'), 0),
      'music', NULLIF(count(*) FILTER (WHERE pr.emoji = 'music'), 0),
      'pray',  NULLIF(count(*) FILTER (WHERE pr.emoji = 'pray'), 0)
    )) AS counts
  FROM public.post_reactions pr
  GROUP BY pr.post_id
) AS src
WHERE p.id = src.post_id;

UPDATE public.posts
SET reaction_counts = '{}'::jsonb
WHERE id NOT IN (SELECT DISTINCT post_id FROM public.post_reactions);
