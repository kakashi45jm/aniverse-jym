ALTER TABLE public.bible_cache ADD COLUMN IF NOT EXISTS translation text NOT NULL DEFAULT 'kjv';
ALTER TABLE public.bible_cache DROP CONSTRAINT IF EXISTS bible_cache_book_chapter_key;
CREATE UNIQUE INDEX IF NOT EXISTS bible_cache_book_chapter_translation_key ON public.bible_cache (book, chapter, translation);