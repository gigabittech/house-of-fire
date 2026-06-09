-- Raise image upload limit from 8 MB to 50 MB.
UPDATE storage.buckets
SET file_size_limit = 52428800
WHERE id IN ('event-photos', 'event-heroes');
