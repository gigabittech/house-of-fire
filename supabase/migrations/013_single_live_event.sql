-- Only one event may be live at a time.
CREATE UNIQUE INDEX IF NOT EXISTS events_single_live_idx ON events ((1)) WHERE status = 'live';
