-- Customers only see approved photos in the app; uploaders may see their own pending submissions.
DROP POLICY IF EXISTS "read_approved_photos" ON event_photos;
CREATE POLICY "read_approved_photos"
  ON event_photos
  FOR SELECT
  USING (
    status = 'approved'
    OR (auth.uid() = uploader_id AND status = 'pending')
  );

-- Block public CDN access to files moved under inactive/.
DROP POLICY IF EXISTS "Public read event-photos" ON storage.objects;
CREATE POLICY "Public read event-photos"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'event-photos'
    AND NOT (name LIKE 'inactive/%')
  );
