/*
# Add translation column to bible_cache

1. Changes
- Add `translation` column (text, default 'kjv') to `bible_cache` table.
- Drop the old unique constraint on (book, chapter).
- Add a new unique constraint on (book, chapter, translation).
- This allows storing multiple translations (KJV, WEB, Tagalog) per chapter.

2. Security
- No policy changes. Existing public-read RLS policy remains in effect.
*/

ALTER TABLE public.bible_cache ADD COLUMN IF NOT EXISTS translation text NOT NULL DEFAULT 'kjv';

ALTER TABLE public.bible_cache DROP CONSTRAINT IF EXISTS bible_cache_book_chapter_key;

CREATE UNIQUE INDEX IF NOT EXISTS bible_cache_book_chapter_trans_idx
  ON public.bible_cache (book, chapter, translation);
