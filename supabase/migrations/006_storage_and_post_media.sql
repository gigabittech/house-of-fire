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
    8388608,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']::text[]
  ),
  (
    'event-heroes',
    'event-heroes',
    true,
    8388608,
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
  USING (bucket_id = 'event-photos');

DROP POLICY IF EXISTS "Public read event-heroes" ON storage.objects;
CREATE POLICY "Public read event-heroes"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-heroes');
