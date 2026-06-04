-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ─── Profiles (extends auth.users) ──────────────────────────────────────────
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  handle text unique not null,
  display_name text not null,
  member_since timestamptz default now() not null,
  role text default 'member' not null check (role in ('member', 'crew', 'admin')),
  avatar_url text,
  settings jsonb default '{
    "push": true,
    "email": true,
    "sms": false,
    "lineupAlerts": true,
    "communityMentions": true,
    "postAnonymously": false,
    "shareActivity": true
  }'::jsonb not null
);
alter table public.profiles enable row level security;
create policy "Users can read all profiles" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base_handle text;
  final_handle text;
  counter int := 0;
begin
  base_handle := lower(regexp_replace(coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)), '[^a-z0-9]', '', 'g'));
  if base_handle = '' then base_handle := 'member'; end if;
  final_handle := base_handle;
  loop
    begin
      insert into public.profiles (id, handle, display_name)
      values (new.id, final_handle, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
      exit;
    exception when unique_violation then
      counter := counter + 1;
      final_handle := base_handle || counter::text;
    end;
  end loop;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Events ─────────────────────────────────────────────────────────────────
create table public.events (
  id uuid primary key default gen_random_uuid(),
  edition_number int not null unique,
  name text not null,
  tagline text,
  date timestamptz not null,
  doors_open timestamptz not null,
  doors_close timestamptz not null,
  venue_name text not null default 'Junkyard Social Club',
  venue_address text not null default '2525 Pearl St, Boulder, CO 80302',
  venue_lat numeric default 40.0189,
  venue_lng numeric default -105.2747,
  capacity int not null default 300,
  status text default 'upcoming' not null check (status in ('upcoming', 'live', 'past', 'cancelled')),
  hero_image_url text,
  created_at timestamptz default now() not null
);
alter table public.events enable row level security;
create policy "Anyone can read events" on public.events for select using (true);
create policy "Crew can manage events" on public.events for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('crew', 'admin'))
);

-- ─── Ticket Tiers ────────────────────────────────────────────────────────────
create table public.ticket_tiers (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events on delete cascade not null,
  name text not null,
  display_name text not null,
  description text,
  price_cents int not null,
  capacity int not null,
  doors_start timestamptz,
  doors_end timestamptz,
  status text default 'available' not null check (status in ('available', 'sold_out', 'hidden')),
  stripe_price_id text,
  sort_order int default 0 not null
);
alter table public.ticket_tiers enable row level security;
create policy "Anyone can read tiers" on public.ticket_tiers for select using (true);
create policy "Crew can manage tiers" on public.ticket_tiers for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('crew', 'admin'))
);

-- Function to check available capacity
create or replace function public.tier_available_count(tier_id uuid)
returns int language sql stable as $$
  select t.capacity - count(tk.id)::int
  from public.ticket_tiers t
  left join public.tickets tk on tk.tier_id = t.id and tk.status not in ('transferred', 'refunded', 'cancelled')
  where t.id = tier_id
  group by t.capacity;
$$;

create or replace function public.user_event_ticket_count(p_user_id uuid, p_event_id uuid)
returns int language sql stable as $$
  select count(*)::int
  from public.tickets
  where holder_id = p_user_id
    and event_id = p_event_id
    and status not in ('transferred', 'refunded', 'cancelled');
$$;

-- ─── Orders (one per checkout / PaymentIntent) ───────────────────────────────
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles not null,
  event_id uuid references public.events not null,
  tier_id uuid references public.ticket_tiers not null,
  quantity int not null check (quantity >= 1 and quantity <= 4),
  subtotal_cents int not null,
  discount_cents int not null default 0,
  fee_cents int not null default 0,
  total_cents int not null,
  stripe_payment_intent_id text unique not null,
  status text default 'completed' not null check (status in ('pending', 'completed', 'refunded', 'cancelled')),
  created_at timestamptz default now() not null
);
alter table public.orders enable row level security;
create policy "Users can read own orders" on public.orders for select using (user_id = auth.uid());
create policy "Crew can read all orders" on public.orders for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('crew', 'admin'))
);
create policy "Service role can manage orders" on public.orders for all using (true) with check (true);

-- ─── Tickets ─────────────────────────────────────────────────────────────────
create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  event_id uuid references public.events not null,
  tier_id uuid references public.ticket_tiers not null,
  holder_id uuid references public.profiles,           -- nullable for door/guest sales
  order_id uuid references public.orders,
  stripe_payment_intent_id text,
  stripe_charge_id text,
  amount_cents int not null,
  fee_cents int not null default 0,
  status text default 'valid' not null check (status in ('valid', 'used', 'transferred', 'refunded', 'cancelled')),
  purchased_at timestamptz default now() not null,
  used_at timestamptz,
  checked_in_at timestamptz,                           -- set when bouncer scans or door-sells a ticket
  source text default 'online' not null,               -- 'online' | 'door'
  metadata jsonb default '{}'::jsonb not null,         -- door sale: {first_name, last_name, email, phone, pay_method}
  qr_data text not null
);
alter table public.tickets enable row level security;
create policy "Users can read own tickets" on public.tickets for select using (holder_id = auth.uid());
create policy "Crew can read all tickets" on public.tickets for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('crew', 'admin'))
);
create policy "Service role can insert tickets" on public.tickets for insert with check (true);
create policy "Service role can update tickets" on public.tickets for update using (true);

-- ─── Posts ───────────────────────────────────────────────────────────────────
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events,
  author_id uuid references public.profiles not null,
  channel text not null check (channel in ('general', 'lineup', 'recap', 'help', 'crew')),
  title text not null,
  body text,
  is_anonymous bool default false not null,
  is_pinned bool default false not null,
  reply_count int default 0 not null,
  reaction_counts jsonb default '{"fire": 0, "eyes": 0, "heart": 0, "music": 0, "pray": 0}'::jsonb not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
alter table public.posts enable row level security;
create policy "Anyone can read posts" on public.posts for select using (true);
create policy "Authenticated users can post" on public.posts for insert with check (auth.uid() = author_id);
create policy "Authors can update own posts" on public.posts for update using (auth.uid() = author_id);

-- ─── Replies ─────────────────────────────────────────────────────────────────
create table public.replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts on delete cascade not null,
  author_id uuid references public.profiles not null,
  body text not null,
  is_anonymous bool default false not null,
  reaction_counts jsonb default '{"fire": 0, "eyes": 0, "heart": 0, "music": 0, "pray": 0}'::jsonb not null,
  created_at timestamptz default now() not null
);
alter table public.replies enable row level security;
create policy "Anyone can read replies" on public.replies for select using (true);
create policy "Authenticated users can reply" on public.replies for insert with check (auth.uid() = author_id);

-- Update reply_count on insert/delete
create or replace function public.update_reply_count()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'INSERT' then
    update public.posts set reply_count = reply_count + 1, updated_at = now() where id = NEW.post_id;
  elsif TG_OP = 'DELETE' then
    update public.posts set reply_count = greatest(0, reply_count - 1) where id = OLD.post_id;
  end if;
  return null;
end;
$$;
create trigger on_reply_insert after insert on public.replies for each row execute procedure public.update_reply_count();
create trigger on_reply_delete after delete on public.replies for each row execute procedure public.update_reply_count();

-- ─── Reactions ───────────────────────────────────────────────────────────────
create table public.post_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts on delete cascade not null,
  user_id uuid references public.profiles on delete cascade not null,
  emoji text not null check (emoji in ('fire', 'eyes', 'heart', 'music', 'pray')),
  unique (post_id, user_id, emoji)
);
alter table public.post_reactions enable row level security;
create policy "Anyone can read reactions" on public.post_reactions for select using (true);
create policy "Authenticated users can react" on public.post_reactions for insert with check (auth.uid() = user_id);
create policy "Users can remove own reactions" on public.post_reactions for delete using (auth.uid() = user_id);

create table public.reply_reactions (
  id uuid primary key default gen_random_uuid(),
  reply_id uuid references public.replies on delete cascade not null,
  user_id uuid references public.profiles on delete cascade not null,
  emoji text not null check (emoji in ('fire', 'eyes', 'heart', 'music', 'pray')),
  unique (reply_id, user_id, emoji)
);
alter table public.reply_reactions enable row level security;
create policy "Anyone can read reply reactions" on public.reply_reactions for select using (true);
create policy "Authenticated users can react to replies" on public.reply_reactions for insert with check (auth.uid() = user_id);
create policy "Users can remove own reply reactions" on public.reply_reactions for delete using (auth.uid() = user_id);

-- Update reaction_counts on posts when reactions change
create or replace function public.sync_post_reaction_counts()
returns trigger language plpgsql as $$
declare
  counts jsonb;
begin
  select jsonb_build_object(
    'fire',  count(*) filter (where emoji = 'fire'),
    'eyes',  count(*) filter (where emoji = 'eyes'),
    'heart', count(*) filter (where emoji = 'heart'),
    'music', count(*) filter (where emoji = 'music'),
    'pray',  count(*) filter (where emoji = 'pray')
  ) into counts
  from public.post_reactions
  where post_id = coalesce(NEW.post_id, OLD.post_id);

  update public.posts set reaction_counts = counts where id = coalesce(NEW.post_id, OLD.post_id);
  return null;
end;
$$;
create trigger on_post_reaction_change after insert or delete on public.post_reactions
  for each row execute procedure public.sync_post_reaction_counts();

-- ─── Transfers ───────────────────────────────────────────────────────────────
create table public.ticket_transfers (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references public.tickets not null,
  from_user_id uuid references public.profiles not null,
  to_email text not null,
  to_user_id uuid references public.profiles,
  status text default 'pending' not null check (status in ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at timestamptz default (now() + interval '24 hours') not null,
  created_at timestamptz default now() not null
);
alter table public.ticket_transfers enable row level security;
create policy "Users can read own transfers" on public.ticket_transfers for select using (from_user_id = auth.uid() or to_user_id = auth.uid());
create policy "Authenticated users can create transfers" on public.ticket_transfers for insert with check (auth.uid() = from_user_id);

-- ─── Refunds ─────────────────────────────────────────────────────────────────
create table public.refund_requests (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references public.tickets not null,
  user_id uuid references public.profiles not null,
  reason text,
  status text default 'pending' not null check (status in ('pending', 'approved', 'rejected', 'processed')),
  stripe_refund_id text,
  created_at timestamptz default now() not null
);
alter table public.refund_requests enable row level security;
create policy "Users can read own refund requests" on public.refund_requests for select using (user_id = auth.uid());
create policy "Authenticated users can request refunds" on public.refund_requests for insert with check (auth.uid() = user_id);

-- ─── Photos ──────────────────────────────────────────────────────────────────
create table public.event_photos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events not null,
  uploader_id uuid references public.profiles not null,
  storage_path text not null,
  public_url text,
  status text default 'pending' not null check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now() not null
);
alter table public.event_photos enable row level security;
create policy "Anyone can read approved photos" on public.event_photos for select using (status = 'approved' or uploader_id = auth.uid());
create policy "Authenticated users can upload photos" on public.event_photos for insert with check (auth.uid() = uploader_id);

-- ─── Notifications ───────────────────────────────────────────────────────────
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles on delete cascade not null,
  type text not null,
  title text not null,
  body text,
  read bool default false not null,
  link text,
  created_at timestamptz default now() not null
);
alter table public.notifications enable row level security;
create policy "Users can read own notifications" on public.notifications for select using (user_id = auth.uid());
create policy "Users can mark own notifications read" on public.notifications for update using (user_id = auth.uid());
create policy "Service role can create notifications" on public.notifications for insert with check (true);

-- ─── Newsletter Subscribers ──────────────────────────────────────────────────
create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  subscribed_at timestamptz default now() not null,
  source text default 'website' not null
);
alter table public.newsletter_subscribers enable row level security;
-- Anyone can subscribe (insert); only service role can read the list
create policy "Anyone can subscribe" on public.newsletter_subscribers for insert with check (true);
create policy "Service role reads subscribers" on public.newsletter_subscribers for select using (false);

-- ─── Storage Buckets ─────────────────────────────────────────────────────────
-- Run these in Supabase SQL editor with service role:
-- insert into storage.buckets (id, name, public) values ('event-photos', 'event-photos', true);
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
-- (Commented out because storage.buckets requires service role; create via Supabase dashboard)

-- ─── Waitlist ─────────────────────────────────────────────────────────────────
create table public.waitlist (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references public.events(id) on delete cascade,
  email        text not null,
  name         text not null default '',
  position     int  not null,
  notified_at  timestamptz,
  joined_at    timestamptz default now() not null,
  unique (event_id, email)
);
alter table public.waitlist enable row level security;
create policy "Anyone can join waitlist" on public.waitlist for insert with check (true);
create policy "Service role manages waitlist" on public.waitlist for select using (false);

-- ─── Referrals ────────────────────────────────────────────────────────────────
-- referral_code + referred_by live on profiles table:
alter table public.profiles
  add column if not exists referral_code text unique,
  add column if not exists referred_by   uuid references public.profiles(id);

create table public.referrals (
  id          uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  referee_id  uuid not null references public.profiles(id) on delete cascade,
  event_id    uuid references public.events(id),
  converted   boolean default false not null,
  created_at  timestamptz default now() not null,
  unique (referrer_id, referee_id)
);
alter table public.referrals enable row level security;
create policy "Users see their own referrals" on public.referrals
  for select using (auth.uid() = referrer_id or auth.uid() = referee_id);
create policy "Service role manages referrals" on public.referrals
  for all using (false);

-- ─── Push subscriptions ───────────────────────────────────────────────────────
create table public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  endpoint   text not null,
  p256dh     text not null,
  auth_key   text not null,
  platform   text not null default 'web',  -- 'web' | 'ios' | 'android'
  created_at timestamptz default now() not null,
  unique (user_id, endpoint)
);
alter table public.push_subscriptions enable row level security;
create policy "Users manage own push subs" on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── Ticket transfers (Phase 2 seed — extends existing ticket_transfers table) ─
-- Note: ticket_transfers table already created above. Adding extra columns for Phase 2.
alter table public.ticket_transfers
  add column if not exists amount_cents  int not null default 0,
  add column if not exists completed_at  timestamptz;

-- ─── Helper functions ────────────────────────────────────────────────────────
create or replace function public.increment_code_uses(code_id uuid)
returns void language plpgsql security definer as $$
begin
  update public.discount_codes
  set uses = uses + 1
  where id = code_id;
end;
$$;

-- ─── Discount / Promo Codes ─────────────────────────────────────────────────
create table if not exists public.discount_codes (
  id          uuid primary key default gen_random_uuid(),
  code        text unique not null,                        -- e.g. 'FIREFAMILY', stored UPPERCASE
  kind        text not null default 'percent',             -- 'percent' | 'flat_cents'
  value       numeric not null,                           -- 15 = 15% | 1500 = $15.00 flat
  max_uses    int,                                        -- null = unlimited
  uses        int not null default 0,
  event_id    uuid references public.events(id) on delete cascade, -- null = any event
  active      boolean not null default true,
  expires_at  timestamptz,                                -- null = never
  note        text,
  created_at  timestamptz default now() not null
);

alter table public.discount_codes enable row level security;
-- Only service role can write; authenticated users can read (for validation)
create policy "Authenticated users can validate codes"
  on public.discount_codes for select
  using (auth.role() = 'authenticated');
create policy "Service role manages codes"
  on public.discount_codes for all
  using (auth.role() = 'service_role');

-- Seed two example codes (idempotent)
insert into public.discount_codes (code, kind, value, max_uses, note)
values
  ('FIREFAMILY', 'percent',    15,  null, 'Friends & family — 15% off forever'),
  ('BOULDER-15', 'percent',    15,  100,  'Local partner code — 100 uses')
on conflict (code) do nothing;

-- ─── Artist profiles (Phase 3 seed) ──────────────────────────────────────────
create table public.artists (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  bio         text,
  photo_url   text,
  instagram   text,
  soundcloud  text,
  genres      text[] not null default '{}',
  created_at  timestamptz default now() not null
);
alter table public.artists enable row level security;
create policy "Anyone can read artists" on public.artists for select using (true);

create table public.event_lineups (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events(id) on delete cascade,
  artist_id  uuid not null references public.artists(id) on delete cascade,
  set_time   text,    -- e.g. '9:00 PM'
  role       text not null default 'performer' check (role in ('headliner','opener','resident','performer')),
  sort_order int  not null default 0,
  unique (event_id, artist_id)
);
alter table public.event_lineups enable row level security;
create policy "Anyone can read event lineups" on public.event_lineups for select using (true);

-- ─── Seed Data ───────────────────────────────────────────────────────────────
-- Insert the upcoming Edition 24 event
insert into public.events (edition_number, name, tagline, date, doors_open, doors_close, venue_name, venue_address, capacity, status)
values (
  24,
  'Fireversary',
  '2-Year Anniversary',
  '2026-06-26T01:00:00Z',  -- 8 PM MT = 01:00 UTC next day (MDT = UTC-6)
  '2026-06-27T02:00:00Z',  -- 8 PM MT doors
  '2026-06-27T07:00:00Z',  -- 1 AM MT close
  'Junkyard Social Club',
  '2525 Pearl St, Boulder, CO 80302',
  300,
  'upcoming'
);

-- Insert ticket tiers for Edition 24
with ev as (select id from public.events where edition_number = 24)
insert into public.ticket_tiers (event_id, name, display_name, description, price_cents, capacity, status, sort_order)
values
  ((select id from ev), 'early_bird', 'Early Bird', 'Doors 8 — 10 PM', 2000, 50, 'sold_out', 0),
  ((select id from ev), 'ga', 'General', 'Doors all night', 2800, 200, 'available', 1),
  ((select id from ev), 'vip', 'VIP', 'Private room · open bar first hour · member pre-sale', 5500, 50, 'available', 2);

-- Insert past events (23 down to 1)
do $$
declare
  i int;
  ev_date timestamptz;
  ev_names text[] := array['Late Bloom', 'Slow Burn', 'The Equinox', 'Hothouse', 'Deep Current', 'Ember', 'The Long Night', 'First Light', 'Undercurrent', 'Signal', 'The Gathering', 'Drift', 'Resonance', 'Hollow', 'The Circuit', 'Nightfall', 'Undertow', 'Pulse', 'The Archive', 'Static', 'Freefall', 'Origin', 'Ignition'];
begin
  for i in reverse 23..1 loop
    ev_date := now() - ((24 - i) * interval '30 days');
    insert into public.events (edition_number, name, date, doors_open, doors_close, venue_name, venue_address, capacity, status)
    values (i, ev_names[24-i], ev_date, ev_date, ev_date + interval '5 hours', 'Junkyard Social Club', '2525 Pearl St, Boulder, CO 80302', 300, 'past');
  end loop;
end;
$$;
