-- =============================================================================
-- House of Fire — ALL-IN-ONE SETUP (schema + seeds + admin user)
-- =============================================================================
-- Run once in Supabase SQL Editor on a fresh project:
--   https://supabase.com/dashboard/project/_/sql
--
-- Includes migrations 001–014 (consolidated) plus demo seed data.
--
-- DEFAULT ADMIN (change password after first login):
--   Email:    admin@houseoffire.co
--   Password: HouseOfFire2026!
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- House of Fire — Initial Schema
-- Run this in the Supabase SQL Editor: https://supabase.com/dashboard/project/cvhopagpeiuzihivvtnm/sql

-- ─── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Tables ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  handle        text UNIQUE NOT NULL,
  display_name  text NOT NULL,
  member_since  timestamptz NOT NULL DEFAULT now(),
  role          text NOT NULL DEFAULT 'member' CHECK (role IN ('member','crew','admin')),
  avatar_url    text,
  settings      jsonb NOT NULL DEFAULT '{}',
  referral_code text UNIQUE,
  referred_by   uuid REFERENCES profiles(id)
);

CREATE TABLE IF NOT EXISTS events (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  edition_number  integer NOT NULL UNIQUE,
  name            text NOT NULL,
  tagline         text,
  date            date NOT NULL,
  doors_open      time NOT NULL,
  doors_close     time NOT NULL,
  venue_name      text NOT NULL,
  venue_address   text NOT NULL,
  venue_lat       numeric,
  venue_lng       numeric,
  capacity        integer NOT NULL DEFAULT 300,
  status          text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming','live','past','cancelled')),
  hero_image_url  text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ticket_tiers (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id      uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name          text NOT NULL,
  display_name  text NOT NULL,
  description   text,
  price_cents   integer NOT NULL,
  capacity      integer NOT NULL,
  doors_start   time,
  doors_end     time,
  status        text NOT NULL DEFAULT 'available' CHECK (status IN ('available','sold_out','hidden')),
  stripe_price_id text,
  sort_order    integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tickets (
  id                        uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code                      text UNIQUE NOT NULL,
  event_id                  uuid NOT NULL REFERENCES events(id),
  tier_id                   uuid NOT NULL REFERENCES ticket_tiers(id),
  holder_id                 uuid REFERENCES profiles(id),
  stripe_payment_intent_id  text,
  stripe_charge_id          text,
  amount_cents              integer NOT NULL,
  fee_cents                 integer NOT NULL DEFAULT 0,
  status                    text NOT NULL DEFAULT 'valid' CHECK (status IN ('valid','used','transferred','refunded','cancelled')),
  purchased_at              timestamptz NOT NULL DEFAULT now(),
  used_at                   timestamptz,
  checked_in_at             timestamptz,
  source                    text NOT NULL DEFAULT 'web',
  metadata                  jsonb NOT NULL DEFAULT '{}',
  qr_data                   text NOT NULL
);

CREATE TABLE IF NOT EXISTS artists (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        text NOT NULL,
  slug        text UNIQUE NOT NULL,
  bio         text,
  photo_url   text,
  instagram   text,
  soundcloud  text,
  genres      text[] NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS event_lineups (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id    uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  artist_id   uuid NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  set_time    text,
  role        text NOT NULL DEFAULT 'performer' CHECK (role IN ('headliner','opener','resident','performer')),
  sort_order  integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS posts (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id        uuid REFERENCES events(id),
  author_id       uuid NOT NULL REFERENCES profiles(id),
  channel         text NOT NULL CHECK (channel IN ('general','lineup','recap','help','crew')),
  title           text NOT NULL,
  body            text,
  is_anonymous    boolean NOT NULL DEFAULT false,
  is_pinned       boolean NOT NULL DEFAULT false,
  reply_count     integer NOT NULL DEFAULT 0,
  reaction_counts jsonb NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS replies (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id         uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id       uuid NOT NULL REFERENCES profiles(id),
  body            text NOT NULL,
  is_anonymous    boolean NOT NULL DEFAULT false,
  reaction_counts jsonb NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS post_reactions (
  id       uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id  uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emoji    text NOT NULL CHECK (emoji IN ('fire','eyes','heart','music','pray')),
  UNIQUE (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS reply_reactions (
  id        uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  reply_id  uuid NOT NULL REFERENCES replies(id) ON DELETE CASCADE,
  user_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emoji     text NOT NULL CHECK (emoji IN ('fire','eyes','heart','music','pray')),
  UNIQUE (reply_id, user_id, emoji)
);

CREATE TABLE IF NOT EXISTS ticket_transfers (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id    uuid NOT NULL REFERENCES tickets(id),
  from_user_id uuid NOT NULL REFERENCES profiles(id),
  to_email     text NOT NULL,
  to_user_id   uuid REFERENCES profiles(id),
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','expired','cancelled')),
  expires_at   timestamptz NOT NULL DEFAULT now() + interval '7 days',
  amount_cents integer NOT NULL DEFAULT 0,
  completed_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS refund_requests (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id        uuid NOT NULL REFERENCES tickets(id),
  user_id          uuid NOT NULL REFERENCES profiles(id),
  reason           text,
  status           text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','processed')),
  stripe_refund_id text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS event_photos (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id     uuid NOT NULL REFERENCES events(id),
  uploader_id  uuid NOT NULL REFERENCES profiles(id),
  storage_path text NOT NULL,
  public_url   text,
  caption      text,
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','inactive')),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type       text NOT NULL,
  title      text NOT NULL,
  body       text,
  read       boolean NOT NULL DEFAULT false,
  link       text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email          text UNIQUE NOT NULL,
  subscribed_at  timestamptz NOT NULL DEFAULT now(),
  source         text NOT NULL DEFAULT 'website'
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint   text NOT NULL,
  p256dh     text NOT NULL,
  auth_key   text NOT NULL,
  platform   text NOT NULL DEFAULT 'web',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, endpoint)
);

CREATE TABLE IF NOT EXISTS referrals (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id uuid NOT NULL REFERENCES profiles(id),
  referee_id  uuid NOT NULL REFERENCES profiles(id),
  event_id    uuid REFERENCES events(id),
  converted   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS waitlist (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id     uuid NOT NULL REFERENCES events(id),
  email        text NOT NULL,
  name         text NOT NULL DEFAULT '',
  position     integer NOT NULL,
  notified_at  timestamptz,
  joined_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, email)
);

CREATE TABLE IF NOT EXISTS discount_codes (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code       text UNIQUE NOT NULL,
  kind       text NOT NULL DEFAULT 'percent' CHECK (kind IN ('percent','fixed')),
  value      numeric NOT NULL,
  max_uses   integer,
  uses       integer NOT NULL DEFAULT 0,
  event_id   uuid REFERENCES events(id),
  active     boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  note       text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Functions ────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION increment_code_uses(code_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE discount_codes SET uses = uses + 1 WHERE id = code_id;
END;
$$;

-- Auto-increment reply_count on posts
CREATE OR REPLACE FUNCTION increment_reply_count()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE posts SET reply_count = reply_count + 1, updated_at = now()
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_reply_insert ON replies;
CREATE TRIGGER on_reply_insert
  AFTER INSERT ON replies
  FOR EACH ROW EXECUTE FUNCTION increment_reply_count();

-- Auto-create profile on auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  base_handle text;
  final_handle text;
  counter integer := 0;
BEGIN
  base_handle := lower(regexp_replace(
    coalesce(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    '[^a-z0-9_]', '', 'g'
  ));
  IF length(base_handle) < 2 THEN base_handle := 'user'; END IF;
  final_handle := base_handle;
  LOOP
    EXIT WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE handle = final_handle);
    counter := counter + 1;
    final_handle := base_handle || counter;
  END LOOP;
  INSERT INTO profiles (id, handle, display_name)
  VALUES (
    NEW.id,
    final_handle,
    coalesce(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_tickets_event_id      ON tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_holder_id     ON tickets(holder_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status        ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_posts_channel         ON posts(channel);
CREATE INDEX IF NOT EXISTS idx_posts_created_at      ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_replies_post_id       ON replies(post_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_photos_status   ON event_photos(status);
CREATE INDEX IF NOT EXISTS idx_event_lineups_event   ON event_lineups(event_id, sort_order);

-- ─── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE events             ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_tiers       ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets            ENABLE ROW LEVEL SECURITY;
ALTER TABLE artists            ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_lineups      ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE replies            ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reactions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE reply_reactions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_transfers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE refund_requests    ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_photos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals          ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist           ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes     ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "public_read_events"       ON events       FOR SELECT USING (true);
CREATE POLICY "public_read_tiers"        ON ticket_tiers FOR SELECT USING (true);
CREATE POLICY "public_read_artists"      ON artists      FOR SELECT USING (true);
CREATE POLICY "public_read_lineups"      ON event_lineups FOR SELECT USING (true);
CREATE POLICY "public_read_profiles"     ON profiles     FOR SELECT USING (true);
CREATE POLICY "public_read_posts"        ON posts        FOR SELECT USING (true);
CREATE POLICY "public_read_replies"      ON replies      FOR SELECT USING (true);
CREATE POLICY "newsletter_insert"        ON newsletter_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "waitlist_insert"          ON waitlist     FOR INSERT WITH CHECK (true);

-- Authenticated user policies
CREATE POLICY "own_profile_update"       ON profiles           FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "own_tickets_read"         ON tickets            FOR SELECT USING (auth.uid() = holder_id);
CREATE POLICY "own_notifications"        ON notifications      FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update"     ON notifications      FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own_push_subs"            ON push_subscriptions FOR ALL   USING (auth.uid() = user_id);
CREATE POLICY "own_refund_requests"      ON refund_requests    FOR ALL   USING (auth.uid() = user_id);
CREATE POLICY "own_transfers"            ON ticket_transfers   FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
CREATE POLICY "authenticated_posts"      ON posts              FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "own_posts_update"         ON posts              FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "authenticated_replies"    ON replies            FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "authenticated_reactions"  ON post_reactions     FOR ALL   USING (auth.uid() = user_id);
CREATE POLICY "authenticated_r_reactions"ON reply_reactions    FOR ALL   USING (auth.uid() = user_id);
CREATE POLICY "own_photos"              ON event_photos        FOR INSERT WITH CHECK (auth.uid() = uploader_id);
CREATE POLICY "read_approved_photos"    ON event_photos        FOR SELECT USING (status = 'approved' OR (auth.uid() = uploader_id AND status = 'pending'));
CREATE POLICY "own_referrals"           ON referrals           FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referee_id);
CREATE POLICY "discount_codes_read"     ON discount_codes      FOR SELECT USING (active = true);

-- ─── 003: Fix new-user trigger ───
-- House of Fire — Fix handle_new_user trigger
-- The original function referenced `profiles` unqualified and had no explicit
-- search_path, so when Supabase's auth system invoked it (SECURITY DEFINER)
-- the table failed to resolve and aborted signup with
-- "Database error creating new user". This hardens it.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_handle text;
  final_handle text;
  counter integer := 0;
BEGIN
  base_handle := lower(regexp_replace(
    coalesce(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    '[^a-z0-9_]', '', 'g'
  ));
  IF length(base_handle) < 2 THEN base_handle := 'user'; END IF;
  final_handle := base_handle;
  LOOP
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE handle = final_handle);
    counter := counter + 1;
    final_handle := base_handle || counter;
  END LOOP;

  INSERT INTO public.profiles (id, handle, display_name)
  VALUES (
    NEW.id,
    final_handle,
    coalesce(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block auth signup if profile creation hiccups.
  RAISE WARNING 'handle_new_user failed for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- ─── 004: Moderation + FAQs ───
-- Moderation, FAQs, comp pools

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'approved'
  CHECK (moderation_status IN ('pending', 'approved', 'hidden', 'draft'));

CREATE TABLE IF NOT EXISTS content_reports (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  post_id     uuid REFERENCES posts(id) ON DELETE CASCADE,
  reply_id    uuid REFERENCES replies(id) ON DELETE CASCADE,
  reason      text NOT NULL,
  status      text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'dismissed', 'resolved')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS faqs jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE discount_codes
  ADD COLUMN IF NOT EXISTS pool text CHECK (pool IS NULL OR pool IN ('crew', 'press', 'goodwill'));

CREATE INDEX IF NOT EXISTS idx_posts_moderation_status ON posts(moderation_status);
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);

ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

-- ─── 006: Storage buckets (50 MB limit) ───
-- Post media attachments (community compose, admin announce)
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS media_urls jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Supabase Storage buckets for uploads (service-role signed URLs + public CDN URLs)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'event-photos',
    'event-photos',
    true,
    52428800,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']::text[]
  ),
  (
    'event-heroes',
    'event-heroes',
    true,
    52428800,
    ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public read for hero and event/member photos
DROP POLICY IF EXISTS "Public read event-photos" ON storage.objects;
CREATE POLICY "Public read event-photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-photos' AND NOT (name LIKE 'inactive/%'));

DROP POLICY IF EXISTS "Public read event-heroes" ON storage.objects;
CREATE POLICY "Public read event-heroes"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-heroes');

-- ─── 007: Orders ───
-- Orders group tickets from a single checkout / PaymentIntent.
-- Enforces multi-ticket purchase with idempotent fulfillment keyed on stripe_payment_intent_id.

CREATE TABLE IF NOT EXISTS public.orders (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   uuid NOT NULL REFERENCES public.profiles(id),
  event_id                  uuid NOT NULL REFERENCES public.events(id),
  tier_id                   uuid NOT NULL REFERENCES public.ticket_tiers(id),
  quantity                  integer NOT NULL CHECK (quantity >= 1 AND quantity <= 4),
  subtotal_cents            integer NOT NULL,
  discount_cents            integer NOT NULL DEFAULT 0,
  fee_cents                 integer NOT NULL DEFAULT 0,
  total_cents               integer NOT NULL,
  stripe_payment_intent_id  text NOT NULL UNIQUE,
  status                    text NOT NULL DEFAULT 'completed'
    CHECK (status IN ('pending', 'completed', 'refunded', 'cancelled')),
  created_at                timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_user_id_idx ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS orders_event_id_idx ON public.orders (event_id);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own orders"
  ON public.orders FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Crew can read all orders"
  ON public.orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('crew', 'admin')
    )
  );

CREATE POLICY "Service role can manage orders"
  ON public.orders FOR ALL
  USING (true)
  WITH CHECK (true);

-- Link tickets to orders; payment intent lives on the order only.
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES public.orders(id);

CREATE INDEX IF NOT EXISTS tickets_order_id_idx ON public.tickets (order_id);

-- Drop per-ticket PI uniqueness (multi-ticket orders use orders.stripe_payment_intent_id).
ALTER TABLE public.tickets
  DROP CONSTRAINT IF EXISTS tickets_stripe_payment_intent_id_key;

-- Count active tickets a user holds for an event (anti-scalping).
CREATE OR REPLACE FUNCTION public.user_event_ticket_count(p_user_id uuid, p_event_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
AS $$
  SELECT count(*)::integer
  FROM public.tickets
  WHERE holder_id = p_user_id
    AND event_id = p_event_id
    AND status NOT IN ('transferred', 'refunded', 'cancelled');
$$;

-- ─── 008: Inventory functions ───
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

-- ─── 009: Dynamic ticketing ───
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

-- ─── 010: Promo code usage ───
-- Promo code usage tracking: orders.discount_code_id + automatic use count sync.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS discount_code_id uuid REFERENCES public.discount_codes(id);

CREATE INDEX IF NOT EXISTS orders_discount_code_id_idx
  ON public.orders (discount_code_id)
  WHERE discount_code_id IS NOT NULL;

-- Drop trigger before functions (dependency order).
DROP TRIGGER IF EXISTS orders_discount_code_uses ON public.orders;

-- Postgres cannot change return type via CREATE OR REPLACE; drop first.
DROP FUNCTION IF EXISTS public.increment_code_uses(uuid);
DROP FUNCTION IF EXISTS public.decrement_code_uses(uuid);
DROP FUNCTION IF EXISTS public.sync_discount_code_uses();

-- Atomic increment (respects max_uses); returns true when a row was updated.
CREATE FUNCTION public.increment_code_uses(code_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.discount_codes
  SET uses = uses + 1
  WHERE id = code_id
    AND active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_uses IS NULL OR uses < max_uses);
  RETURN FOUND;
END;
$$;

CREATE FUNCTION public.decrement_code_uses(code_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.discount_codes
  SET uses = GREATEST(0, uses - 1)
  WHERE id = code_id;
  RETURN FOUND;
END;
$$;

-- Reconcile discount_codes.uses from completed orders (idempotent backfill).
CREATE FUNCTION public.sync_discount_code_uses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.discount_codes dc
  SET uses = COALESCE(stats.cnt, 0)
  FROM (
    SELECT discount_code_id, COUNT(*)::integer AS cnt
    FROM public.orders
    WHERE discount_code_id IS NOT NULL
      AND status = 'completed'
    GROUP BY discount_code_id
  ) stats
  WHERE dc.id = stats.discount_code_id;

  UPDATE public.discount_codes dc
  SET uses = 0
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.discount_code_id = dc.id
      AND o.status = 'completed'
  )
  AND dc.uses <> 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.orders_discount_code_uses_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.discount_code_id IS NOT NULL AND NEW.status = 'completed' THEN
      PERFORM public.increment_code_uses(NEW.discount_code_id);
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.discount_code_id IS NOT NULL
      AND OLD.status = 'completed'
      AND NEW.status IN ('refunded', 'cancelled')
    THEN
      PERFORM public.decrement_code_uses(NEW.discount_code_id);
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER orders_discount_code_uses
  AFTER INSERT OR UPDATE OF status, discount_code_id ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.orders_discount_code_uses_trigger();

GRANT EXECUTE ON FUNCTION public.increment_code_uses(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.decrement_code_uses(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.sync_discount_code_uses() TO service_role;

-- One-time reconcile for existing completed orders (discount_cents only; no code id until new checkouts).
SELECT public.sync_discount_code_uses();

-- ─── 011: Email logs ───
-- Email logs for all Resend-based outbound emails (admin + mobile apps).
-- Tracks queued/sent/failed status and basic metadata for auditing.

CREATE TABLE IF NOT EXISTS public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  status text NOT NULL CHECK (status IN ('queued', 'sent', 'failed')),
  provider text NOT NULL DEFAULT 'resend',
  provider_message_id text,
  app text NOT NULL CHECK (app IN ('mobile', 'admin')),
  kind text,
  project_id uuid REFERENCES public.events (id) ON DELETE SET NULL,
  to_address text NOT NULL,
  subject text NOT NULL,
  text_body text,
  html_body text,
  from_email text,
  reply_to text,
  error_message text,
  meta jsonb
);

CREATE INDEX IF NOT EXISTS email_logs_created_at_idx ON public.email_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS email_logs_status_idx ON public.email_logs (status);
CREATE INDEX IF NOT EXISTS email_logs_project_id_idx ON public.email_logs (project_id);
CREATE INDEX IF NOT EXISTS email_logs_to_address_idx ON public.email_logs (to_address);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- No public access; admin routes use service-role keys.
CREATE POLICY "no_public_access_email_logs"
ON public.email_logs
AS RESTRICTIVE
FOR ALL
TO public
USING (false)
WITH CHECK (false);


-- ─── 012: Community moderation ───
-- Community moderation: rejected status, audit log, reaction count sync, report inserts

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS moderation_note text;

ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_moderation_status_check;
ALTER TABLE posts
  ADD CONSTRAINT posts_moderation_status_check
  CHECK (moderation_status IN ('pending', 'approved', 'hidden', 'draft', 'rejected'));

CREATE TABLE IF NOT EXISTS moderation_actions (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id      uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  moderator_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action       text NOT NULL CHECK (action IN ('approved', 'rejected', 'hidden', 'deleted', 'pinned', 'unpinned')),
  reason       text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_moderation_actions_post_id ON moderation_actions(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_created_at ON moderation_actions(created_at DESC);

ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;

-- Keep reaction_counts in sync when reactions are toggled
CREATE OR REPLACE FUNCTION public.sync_post_reaction_counts()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  counts jsonb;
BEGIN
  SELECT jsonb_build_object(
    'fire',  count(*) FILTER (WHERE emoji = 'fire'),
    'eyes',  count(*) FILTER (WHERE emoji = 'eyes'),
    'heart', count(*) FILTER (WHERE emoji = 'heart'),
    'music', count(*) FILTER (WHERE emoji = 'music'),
    'pray',  count(*) FILTER (WHERE emoji = 'pray')
  ) INTO counts
  FROM public.post_reactions
  WHERE post_id = COALESCE(NEW.post_id, OLD.post_id);

  UPDATE public.posts
  SET reaction_counts = counts
  WHERE id = COALESCE(NEW.post_id, OLD.post_id);

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_post_reaction_change ON public.post_reactions;
CREATE TRIGGER on_post_reaction_change
  AFTER INSERT OR UPDATE OR DELETE ON public.post_reactions
  FOR EACH ROW
  EXECUTE PROCEDURE public.sync_post_reaction_counts();

-- Members can submit content reports
DROP POLICY IF EXISTS "authenticated_report_content" ON content_reports;
CREATE POLICY "authenticated_report_content"
  ON content_reports
  FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- ─── 013: Single live event ───
-- Only one event may be live at a time.
CREATE UNIQUE INDEX IF NOT EXISTS events_single_live_idx ON events ((1)) WHERE status = 'live';

-- ─── 018: Realtime (RLS, inventory, publication) ───
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

CREATE POLICY "crew_read_all_tickets"
  ON public.tickets FOR SELECT
  USING (public.is_crew_or_admin());

CREATE POLICY "crew_read_all_refunds"
  ON public.refund_requests FOR SELECT
  USING (public.is_crew_or_admin());

CREATE POLICY "crew_read_all_photos"
  ON public.event_photos FOR SELECT
  USING (public.is_crew_or_admin());

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

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.ticket_tiers
  ADD COLUMN IF NOT EXISTS sold_count integer NOT NULL DEFAULT 0;

ALTER TABLE public.ticket_tiers
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

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

DROP TRIGGER IF EXISTS set_updated_at_ticket_tiers ON public.ticket_tiers;
CREATE TRIGGER set_updated_at_ticket_tiers
  BEFORE UPDATE ON public.ticket_tiers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

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

CREATE INDEX IF NOT EXISTS idx_tickets_event_status
  ON public.tickets (event_id, status);

CREATE INDEX IF NOT EXISTS idx_tickets_event_checked_in
  ON public.tickets (event_id, checked_in_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_posts_event_channel_created
  ON public.posts (event_id, channel, created_at DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_photos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.refund_requests;

-- ─── 020: Query performance indexes + incremental triggers ───────────────────

CREATE INDEX IF NOT EXISTS idx_tickets_tier_status
  ON public.tickets (tier_id, status);

CREATE INDEX IF NOT EXISTS idx_ticket_tiers_event_id
  ON public.ticket_tiers (event_id);

CREATE INDEX IF NOT EXISTS idx_events_status_edition
  ON public.events (status, edition_number DESC);

CREATE INDEX IF NOT EXISTS idx_posts_mod_channel_created
  ON public.posts (moderation_status, channel, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_event_photos_event_status_created
  ON public.event_photos (event_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_author_created
  ON public.posts (author_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_refund_requests_status_created
  ON public.refund_requests (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tickets_holder_purchased
  ON public.tickets (holder_id, purchased_at DESC);

CREATE INDEX IF NOT EXISTS idx_post_reactions_user_post
  ON public.post_reactions (user_id, post_id);

CREATE INDEX IF NOT EXISTS idx_content_reports_status_created
  ON public.content_reports (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_events_status_date
  ON public.events (status, date DESC);

DROP INDEX IF EXISTS public.idx_tickets_event_id;
DROP INDEX IF EXISTS public.idx_posts_moderation_status;
DROP INDEX IF EXISTS public.idx_content_reports_status;

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


-- ─── 021: Admin query RPCs ─────────────────────────────────────────────────
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

-- ─── 022: Event inventory snapshot + drop ticket_tiers from realtime ─────────

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

-- ticket_tiers intentionally omitted from supabase_realtime (see 022 / docs/inventory-architecture.md)

-- ─── 023: Door check-in idempotency + guest cache index ─────────────────────

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

-- ─── SEED: Artists, event, tiers, lineup, discount ───
-- House of Fire — Seed Data (Edition 24 — Fireversary)
-- Run AFTER 001_initial_schema.sql

-- ─── Artists ──────────────────────────────────────────────────────────────────
INSERT INTO artists (id, name, slug, bio, genres) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'IGNYTE', 'ignyte', 'Resident DJ. Sets the tone every month.', ARRAY['house','techno']),
  ('a1000000-0000-0000-0000-000000000002', 'M3DIUM', 'm3dium', 'Deep house and atmospheric techno.', ARRAY['deep house','techno']),
  ('a1000000-0000-0000-0000-000000000003', 'HEX',    'hex',    'Late night closer. Dark, relentless.', ARRAY['techno','industrial'])
ON CONFLICT (slug) DO NOTHING;

-- ─── Event ────────────────────────────────────────────────────────────────────
INSERT INTO events (id, edition_number, name, tagline, date, doors_open, doors_close, venue_name, venue_address, venue_lat, venue_lng, capacity, status) VALUES
  (
    'e2400000-0000-0000-0000-000000000024',
    24,
    'Fireversary',
    '2-Year Anniversary. The room that keeps the floor full.',
    '2026-06-26',
    '20:00',
    '02:00',
    'Junkyard Social Club',
    '1935 55th St, Boulder, CO 80301',
    40.0232,
    -105.2519,
    300,
    'upcoming'
  )
ON CONFLICT (edition_number) DO NOTHING;

-- ─── Ticket Tiers ─────────────────────────────────────────────────────────────
INSERT INTO ticket_tiers (id, event_id, name, display_name, description, price_cents, capacity, status, sort_order) VALUES
  ('70000000-0000-0000-0000-000000000001', 'e2400000-0000-0000-0000-000000000024', 'early', 'Early Bird', 'First 80 tickets. Limited.',          2000,  80, 'sold_out',  0),
  ('70000000-0000-0000-0000-000000000002', 'e2400000-0000-0000-0000-000000000024', 'ga',    'General',    'Standard entry.',                     2800, 180, 'available', 1),
  ('70000000-0000-0000-0000-000000000003', 'e2400000-0000-0000-0000-000000000024', 'vip',   'VIP',        'Early entry + reserved standing area.', 5500,  40, 'available', 2)
ON CONFLICT DO NOTHING;

-- ─── Lineup ───────────────────────────────────────────────────────────────────
INSERT INTO event_lineups (event_id, artist_id, set_time, role, sort_order) VALUES
  ('e2400000-0000-0000-0000-000000000024', 'a1000000-0000-0000-0000-000000000001', '21:00', 'resident',   0),
  ('e2400000-0000-0000-0000-000000000024', 'a1000000-0000-0000-0000-000000000002', '22:30', 'performer',  1),
  ('e2400000-0000-0000-0000-000000000024', 'a1000000-0000-0000-0000-000000000003', '00:00', 'headliner',  2)
ON CONFLICT DO NOTHING;

-- ─── Discount Code ────────────────────────────────────────────────────────────
INSERT INTO discount_codes (code, kind, value, max_uses, event_id, active, note) VALUES
  ('FIREFAMILY', 'percent', 20, 50, 'e2400000-0000-0000-0000-000000000024', true, '20% off for friends and family')
ON CONFLICT (code) DO NOTHING;

-- ─── SEED: Edition 24 FAQs ───
-- Ensure default Edition 24 exists with FAQs (runs after 004 adds faqs column)

INSERT INTO events (
  id,
  edition_number,
  name,
  tagline,
  date,
  doors_open,
  doors_close,
  venue_name,
  venue_address,
  venue_lat,
  venue_lng,
  capacity,
  status,
  faqs
) VALUES (
  'e2400000-0000-0000-0000-000000000024',
  24,
  'Fireversary',
  '2-Year Anniversary. The room that keeps the floor full.',
  '2026-06-26',
  '20:00',
  '02:00',
  'Junkyard Social Club',
  '1935 55th St, Boulder, CO 80301',
  40.0232,
  -105.2519,
  300,
  'upcoming',
  '[
    {"q": "What time do doors open?", "a": "Doors at 8 PM. We open the floor at 9."},
    {"q": "Is there a dress code?", "a": "Come as you are. No phones on the dance floor."},
    {"q": "Can I get a refund?", "a": "Refunds available up to 48 hours before the event in the app."}
  ]'::jsonb
)
ON CONFLICT (edition_number) DO UPDATE SET
  faqs = EXCLUDED.faqs,
  tagline = COALESCE(NULLIF(events.tagline, ''), EXCLUDED.tagline),
  venue_address = EXCLUDED.venue_address,
  venue_lat = EXCLUDED.venue_lat,
  venue_lng = EXCLUDED.venue_lng;

-- ─── SEED: Admin user ─────────────────────────────────────────────────────────
-- Login: admin@houseoffire.co / HouseOfFire2026!
-- Change the password in production.

-- 024_community_cursors.sql
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

-- 025_event_photo_cursors.sql
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

DO $$
DECLARE
  v_admin_id uuid := 'a0000000-0000-0000-0000-000000000001';
  v_email text := 'admin@houseoffire.co';
  v_password text := 'HouseOfFire2026!';
BEGIN
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_admin_id,
    'authenticated',
    'authenticated',
    v_email,
    crypt(v_password, gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"House of Fire Admin"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    encrypted_password = EXCLUDED.encrypted_password,
    email_confirmed_at = EXCLUDED.email_confirmed_at,
    updated_at = now();

  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    v_admin_id,
    v_admin_id,
    jsonb_build_object('sub', v_admin_id::text, 'email', v_email),
    'email',
    v_admin_id::text,
    now(),
    now(),
    now()
  )
  ON CONFLICT (provider_id, provider) DO UPDATE SET
    identity_data = EXCLUDED.identity_data,
    updated_at = now();

  INSERT INTO public.profiles (id, handle, display_name, role)
  VALUES (v_admin_id, 'hofadmin', 'House of Fire Admin', 'admin')
  ON CONFLICT (id) DO UPDATE SET
    handle = EXCLUDED.handle,
    display_name = EXCLUDED.display_name,
    role = 'admin';
END $$;

-- ─── 026 Phase 1 launch ───────────────────────────────────────────────────────

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS dress_code text,
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'hidden'));

CREATE INDEX IF NOT EXISTS idx_events_visibility_status_edition
  ON public.events (visibility, status, edition_number DESC);

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
        tt.capacity::bigint - COALESCE(sold.c, 0)::bigint
      )
    END
  ), 0)::bigint
  FROM public.ticket_tiers tt
  LEFT JOIN (
    SELECT tier_id, COUNT(*)::int AS c
    FROM public.tickets
    WHERE event_id = p_event_id
      AND status IN ('valid', 'used')
    GROUP BY tier_id
  ) sold ON sold.tier_id = tt.id
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
    LEFT JOIN (
      SELECT tier_id, COUNT(*)::int AS c
      FROM public.tickets
      WHERE event_id = p_event_id
        AND status IN ('valid', 'used')
      GROUP BY tier_id
    ) sold ON sold.tier_id = tt.id
    WHERE tt.event_id = p_event_id
      AND tt.status <> 'hidden'
      AND tt.status <> 'sold_out'
      AND GREATEST(0, tt.capacity - COALESCE(sold.c, 0)) > 0
  );
$$;

CREATE OR REPLACE FUNCTION public.event_display_status(
  p_status text,
  p_visibility text,
  p_event_id uuid
)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN COALESCE(p_visibility, 'public') = 'hidden' THEN 'hidden'
    WHEN p_status = 'live' THEN 'live'
    WHEN public.event_is_sold_out(p_event_id) THEN 'sold_out'
    WHEN p_status = 'upcoming' THEN 'upcoming'
    ELSE 'upcoming'
  END;
$$;

CREATE TABLE IF NOT EXISTS public.email_resend_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  email_log_id uuid REFERENCES public.email_logs(id) ON DELETE SET NULL,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_type text NOT NULL CHECK (actor_type IN ('admin', 'member', 'system')),
  recipient text NOT NULL,
  source text NOT NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS email_resend_audit_order_id_idx
  ON public.email_resend_audit (order_id, created_at DESC);

CREATE INDEX IF NOT EXISTS email_resend_audit_created_at_idx
  ON public.email_resend_audit (created_at DESC);

ALTER TABLE public.email_resend_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "no_public_access_email_resend_audit" ON public.email_resend_audit;
CREATE POLICY "no_public_access_email_resend_audit"
ON public.email_resend_audit
AS RESTRICTIVE
FOR ALL
TO public
USING (false)
WITH CHECK (false);

-- ─── 027 Push notifications ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.push_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  body text NOT NULL,
  url text,
  segment text NOT NULL CHECK (segment IN ('all_members', 'event_attendees', 'vip_members')),
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'sending', 'completed', 'partial', 'failed')),
  target_count integer NOT NULL DEFAULT 0,
  sent_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  expired_count integer NOT NULL DEFAULT 0,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS push_campaigns_created_at_idx
  ON public.push_campaigns (created_at DESC);

CREATE INDEX IF NOT EXISTS push_campaigns_status_idx
  ON public.push_campaigns (status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.push_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.push_campaigns(id) ON DELETE CASCADE,
  subscription_id uuid NOT NULL REFERENCES public.push_subscriptions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed', 'expired')),
  error_message text,
  attempt_count integer NOT NULL DEFAULT 0,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, subscription_id)
);

CREATE INDEX IF NOT EXISTS push_deliveries_campaign_status_idx
  ON public.push_deliveries (campaign_id, status);

CREATE INDEX IF NOT EXISTS push_deliveries_subscription_idx
  ON public.push_deliveries (subscription_id);

ALTER TABLE public.push_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "no_public_access_push_campaigns" ON public.push_campaigns;
CREATE POLICY "no_public_access_push_campaigns"
ON public.push_campaigns
AS RESTRICTIVE
FOR ALL
TO public
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS "no_public_access_push_deliveries" ON public.push_deliveries;
CREATE POLICY "no_public_access_push_deliveries"
ON public.push_deliveries
AS RESTRICTIVE
FOR ALL
TO public
USING (false)
WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.profile_push_enabled(p_settings jsonb)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE((p_settings->>'push_notifications')::boolean, true);
$$;

CREATE OR REPLACE FUNCTION public.count_push_recipients(
  p_segment text,
  p_event_id uuid DEFAULT NULL
)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::bigint
  FROM public.push_subscriptions ps
  INNER JOIN public.profiles p ON p.id = ps.user_id
  WHERE public.profile_push_enabled(p.settings)
    AND CASE
      WHEN p_segment = 'all_members' THEN true
      WHEN p_segment = 'event_attendees' AND p_event_id IS NOT NULL THEN EXISTS (
        SELECT 1
        FROM public.tickets t
        WHERE t.holder_id = ps.user_id
          AND t.event_id = p_event_id
          AND t.status IN ('valid', 'used')
      )
      WHEN p_segment = 'vip_members' AND p_event_id IS NOT NULL THEN EXISTS (
        SELECT 1
        FROM public.tickets t
        INNER JOIN public.ticket_tiers tt ON tt.id = t.tier_id
        WHERE t.holder_id = ps.user_id
          AND t.event_id = p_event_id
          AND t.status IN ('valid', 'used')
          AND (tt.name = 'vip' OR lower(tt.display_name) LIKE '%vip%')
      )
      WHEN p_segment = 'vip_members' AND p_event_id IS NULL THEN EXISTS (
        SELECT 1
        FROM public.tickets t
        INNER JOIN public.ticket_tiers tt ON tt.id = t.tier_id
        WHERE t.holder_id = ps.user_id
          AND t.status IN ('valid', 'used')
          AND (tt.name = 'vip' OR lower(tt.display_name) LIKE '%vip%')
      )
      ELSE false
    END;
$$;

CREATE OR REPLACE FUNCTION public.list_push_recipients(
  p_segment text,
  p_event_id uuid DEFAULT NULL,
  p_cursor_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 100
)
RETURNS TABLE (
  subscription_id uuid,
  user_id uuid,
  endpoint text,
  p256dh text,
  auth_key text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ps.id AS subscription_id,
    ps.user_id,
    ps.endpoint,
    ps.p256dh,
    ps.auth_key
  FROM public.push_subscriptions ps
  INNER JOIN public.profiles p ON p.id = ps.user_id
  WHERE public.profile_push_enabled(p.settings)
    AND (p_cursor_id IS NULL OR ps.id > p_cursor_id)
    AND CASE
      WHEN p_segment = 'all_members' THEN true
      WHEN p_segment = 'event_attendees' AND p_event_id IS NOT NULL THEN EXISTS (
        SELECT 1
        FROM public.tickets t
        WHERE t.holder_id = ps.user_id
          AND t.event_id = p_event_id
          AND t.status IN ('valid', 'used')
      )
      WHEN p_segment = 'vip_members' AND p_event_id IS NOT NULL THEN EXISTS (
        SELECT 1
        FROM public.tickets t
        INNER JOIN public.ticket_tiers tt ON tt.id = t.tier_id
        WHERE t.holder_id = ps.user_id
          AND t.event_id = p_event_id
          AND t.status IN ('valid', 'used')
          AND (tt.name = 'vip' OR lower(tt.display_name) LIKE '%vip%')
      )
      WHEN p_segment = 'vip_members' AND p_event_id IS NULL THEN EXISTS (
        SELECT 1
        FROM public.tickets t
        INNER JOIN public.ticket_tiers tt ON tt.id = t.tier_id
        WHERE t.holder_id = ps.user_id
          AND t.status IN ('valid', 'used')
          AND (tt.name = 'vip' OR lower(tt.display_name) LIKE '%vip%')
      )
      ELSE false
    END
  ORDER BY ps.id
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 100), 1), 500);
$$;
