ALTER TABLE event_photos
  ADD COLUMN IF NOT EXISTS caption text;
