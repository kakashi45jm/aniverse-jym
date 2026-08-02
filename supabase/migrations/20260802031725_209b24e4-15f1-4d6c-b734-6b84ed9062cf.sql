CREATE TABLE public.library_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kind text NOT NULL,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.library_items TO anon;
GRANT SELECT ON public.library_items TO authenticated;
GRANT ALL ON public.library_items TO service_role;
ALTER TABLE public.library_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Library items are public to read" ON public.library_items FOR SELECT USING (true);

CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  href text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.notifications TO anon;
GRANT SELECT ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Notifications are public to read" ON public.notifications FOR SELECT USING (true);

CREATE TABLE public.bible_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book text NOT NULL,
  chapter int NOT NULL,
  verses jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (book, chapter)
);
GRANT SELECT ON public.bible_cache TO anon;
GRANT SELECT ON public.bible_cache TO authenticated;
GRANT ALL ON public.bible_cache TO service_role;
ALTER TABLE public.bible_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Bible text is public to read" ON public.bible_cache FOR SELECT USING (true);

CREATE INDEX library_items_kind_idx ON public.library_items (kind, created_at DESC);
CREATE INDEX notifications_created_idx ON public.notifications (created_at DESC);