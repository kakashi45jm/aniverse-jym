-- Fix uploads bucket: remove wildcard MIME types (unsupported by Supabase Storage)
-- and increase file size limit to 100MB to accommodate larger music/video files.
-- allowed_mime_types set to NULL allows all file types.

UPDATE storage.buckets
SET allowed_mime_types = NULL,
    file_size_limit = 104857600
WHERE id = 'uploads';
