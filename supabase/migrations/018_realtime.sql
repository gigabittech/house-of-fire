-- Realtime: RLS hardening, inventory denormalization, updated_at, indexes, publication.

-- ─── Helper ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_crew_or_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('crew', 'admin')
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_crew_or_admin() TO authenticated;

-- ─── RLS: crew/admin read access for realtime ───────────────────────────────
CREATE POLICY "crew_read_all_tickets"
  ON public.tickets FOR SELECT
  USING (public.is_crew_or_admin());

CREATE POLICY "crew_read_all_refunds"
  ON public.refund_requests FOR SELECT
  USING (public.is_crew_or_admin());

CREATE POLICY "crew_read_all_photos"
  ON public.event_photos FOR SELECT
  USING (public.is_crew_or_admin());

-- Tighten posts read: approved, own, or crew/admin (crew channel requires crew)
DROP POLICY IF EXISTS "public_read_posts" ON public.posts;

CREATE POLICY "moderated_read_posts"
  ON public.posts FOR SELECT
  USING (
    (
      moderation_status = 'approved'
      AND (channel <> 'crew' OR public.is_crew_or_admin() OR author_id = auth.uid())
    )
    OR author_id = auth.uid()
    OR public.is_crew_or_admin()
  );

-- ─── updated_at columns ─────────────────────────────────────────────────────
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- posts.updated_at already exists

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_updated_at_events ON public.events;
CREATE TRIGGER set_updated_at_events
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_tickets ON public.tickets;
CREATE TRIGGER set_updated_at_tickets
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_orders ON public.orders;
CREATE TRIGGER set_updated_at_orders
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_posts ON public.posts;
CREATE TRIGGER set_updated_at_posts
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── Inventory denormalization on ticket_tiers ──────────────────────────────
ALTER TABLE public.ticket_tiers
  ADD COLUMN IF NOT EXISTS sold_count integer NOT NULL DEFAULT 0;

ALTER TABLE public.ticket_tiers
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS set_updated_at_ticket_tiers ON public.ticket_tiers;
CREATE TRIGGER set_updated_at_ticket_tiers
  BEFORE UPDATE ON public.ticket_tiers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Backfill sold_count from existing tickets
UPDATE public.ticket_tiers tt
SET sold_count = COALESCE((
  SELECT count(*)::integer
  FROM public.tickets tk
  WHERE tk.tier_id = tt.id
    AND tk.status IN ('valid', 'used')
), 0);

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
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.sync_tier_sold_count_for_tier(NEW.tier_id);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.tier_id IS DISTINCT FROM NEW.tier_id THEN
      PERFORM public.sync_tier_sold_count_for_tier(OLD.tier_id);
    END IF;
    PERFORM public.sync_tier_sold_count_for_tier(NEW.tier_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.sync_tier_sold_count_for_tier(OLD.tier_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS tickets_sync_tier_sold_count ON public.tickets;
CREATE TRIGGER tickets_sync_tier_sold_count
  AFTER INSERT OR UPDATE OR DELETE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.sync_tier_sold_count_trigger();

-- ─── Indexes for realtime filters ───────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tickets_event_status
  ON public.tickets (event_id, status);

CREATE INDEX IF NOT EXISTS idx_tickets_event_checked_in
  ON public.tickets (event_id, checked_in_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_posts_event_channel_created
  ON public.posts (event_id, channel, created_at DESC);

-- ─── Realtime publication ───────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_tiers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_photos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.refund_requests;
