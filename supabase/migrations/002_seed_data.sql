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
