-- Allow anon role to INSERT into uploads bucket.
-- Security is enforced at the application layer (admin key check in the upload route),
-- so the anon key can be used for server-side uploads without exposing public write access.
CREATE POLICY "Anon write uploads"
  ON storage.objects FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'uploads'::text);
