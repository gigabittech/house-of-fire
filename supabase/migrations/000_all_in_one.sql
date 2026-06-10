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
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_tiers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_photos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.refund_requests;

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
