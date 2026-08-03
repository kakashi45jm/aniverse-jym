-- Make the uploads bucket public so files can be read via public URLs.
-- Write access is still controlled by the edge function (admin key check).
UPDATE storage.buckets
SET public = true
WHERE id = 'uploads';
