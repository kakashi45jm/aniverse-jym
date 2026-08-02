-- Create public uploads bucket and storage policies
-- 1. Create bucket for media files (images, audio, video), 50MB limit, public read
-- 2. Public read policy for anon and authenticated
-- 3. Service role write policy (server-side admin uploads only)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('uploads', 'uploads', true, 52428800, ARRAY['image/*', 'audio/*', 'video/*'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read uploads" ON storage.objects;
CREATE POLICY "Public read uploads"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'uploads');

DROP POLICY IF EXISTS "Service role write uploads" ON storage.objects;
CREATE POLICY "Service role write uploads"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'uploads');
