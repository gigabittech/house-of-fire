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
