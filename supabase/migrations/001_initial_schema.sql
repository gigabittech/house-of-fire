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
  UNIQUE (post_id, user_id, emoji)
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
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
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
CREATE POLICY "read_approved_photos"    ON event_photos        FOR SELECT USING (status = 'approved' OR auth.uid() = uploader_id);
CREATE POLICY "own_referrals"           ON referrals           FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referee_id);
CREATE POLICY "discount_codes_read"     ON discount_codes      FOR SELECT USING (active = true);
