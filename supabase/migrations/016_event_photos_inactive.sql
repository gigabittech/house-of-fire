ALTER TABLE event_photos DROP CONSTRAINT IF EXISTS event_photos_status_check;

ALTER TABLE event_photos
  ADD CONSTRAINT event_photos_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'inactive'));
