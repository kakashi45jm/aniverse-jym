import { createFileRoute } from "@tanstack/react-router";

/**
 * Full Bible text (King James Version + World English Bible — public domain, complete Christian canon).
 * Tries bible-api.com first, falls back to bolls.life API.
 * Tagalog text is stored by the admin via the Admin panel (bible_cache table with translation column).
 */

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=86400",
    },
  });
}

function bookName(slug: string) {
  return slug.replace(/-/g, " ");
}

/** Map our book slug to the numeric book ID used by bolls.life API (1-66). */
const BOLLS_BOOK_MAP: Record<string, number> = {
  "genesis": 1, "exodus": 2, "leviticus": 3, "numbers": 4, "deuteronomy": 5,
  "joshua": 6, "judges": 7, "ruth": 8, "1-samuel": 9, "2-samuel": 10,
  "1-kings": 11, "2-kings": 12, "1-chronicles": 13, "2-chronicles": 14,
  "ezra": 15, "nehemiah": 16, "esther": 17, "job": 18, "psalms": 19,
  "proverbs": 20, "ecclesiastes": 21, "song-of-solomon": 22, "isaiah": 23,
  "jeremiah": 24, "lamentations": 25, "ezekiel": 26, "daniel": 27,
  "hosea": 28, "joel": 29, "amos": 30, "obadiah": 31, "jonah": 32,
  "micah": 33, "nahum": 34, "habakkuk": 35, "zephaniah": 36, "haggai": 37,
  "zechariah": 38, "malachi": 39,
  "matthew": 40, "mark": 41, "luke": 42, "john": 43, "acts": 44,
  "romans": 45, "1-corinthians": 46, "2-corinthians": 47, "galatians": 48,
  "ephesians": 49, "philippians": 50, "colossians": 51,
  "1-thessalonians": 52, "2-thessalonians": 53, "1-timothy": 54,
  "2-timothy": 55, "titus": 56, "philemon": 57, "hebrews": 58,
  "james": 59, "1-peter": 60, "2-peter": 61, "1-john": 62, "2-john": 63,
  "3-john": 64, "jude": 65, "revelation": 66,
};

export const Route = createFileRoute("/api/public/bible")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const book = (url.searchParams.get("book") ?? "").toLowerCase().replace(/[^a-z0-9-]/g, "");
        const chapter = parseInt(url.searchParams.get("chapter") ?? "1", 10);
        const translation = (url.searchParams.get("translation") ?? "kjv").toLowerCase();

        if (!book || !chapter || chapter < 1 || chapter > 200) {
          return json({ error: "book and chapter are required" }, 400);
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Check cache first
        const cached = await supabaseAdmin
          .from("bible_cache")
          .select("verses")
          .eq("book", book)
          .eq("chapter", chapter)
          .eq("translation", translation)
          .maybeSingle();

        if (cached.data?.verses) {
          return json({ book, chapter, translation, verses: cached.data.verses });
        }

        // For Tagalog, there's no free API — only admin-uploaded text is available
        if (translation === "tag") {
          return json({ error: "No Tagalog text uploaded yet for this chapter. Ask the admin to add it." }, 404);
        }

        // Try bible-api.com first (KJV or WEB)
        const apiTranslation = translation === "kjv" ? "kjv" : "web";
        let verses: string[] = [];

        try {
          const remote = await fetch(
            `https://bible-api.com/${encodeURIComponent(bookName(book) + " " + chapter)}?translation=${apiTranslation}`,
          );
          if (remote.ok) {
            const payload = (await remote.json()) as {
              verses?: Array<{ verse: number; text: string }>;
            };
            verses = (payload.verses ?? []).map((v) => v.text.replace(/\s+/g, " ").trim());
          }
        } catch {
          // fall through to bolls.life
        }

        // Fallback: bolls.life API
        if (!verses.length) {
          try {
            const bollsBook = BOLLS_BOOK_MAP[book];
            if (bollsBook) {
              const bollsTrans = translation === "kjv" ? "KJV" : "WEB";
              const remote2 = await fetch(
                `https://bolls.life/get-text/${bollsTrans}/${bollsBook}/${chapter}/`,
              );
              if (remote2.ok) {
                const payload2 = (await remote2.json()) as Array<{
                  verse: number;
                  text: string;
                }>;
                verses = payload2.map((v) => {
                  // bolls.life returns HTML, strip tags
                  return v.text.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
                });
              }
            }
          } catch {
            // both APIs failed
          }
        }

        if (!verses.length) {
          return json({ error: "Could not load this chapter right now. Please try again in a moment." }, 502);
        }

        // Cache for next time
        await supabaseAdmin
          .from("bible_cache")
          .upsert(
            { book, chapter, translation, verses: verses as never },
            { onConflict: "book,chapter,translation" },
          );

        return json({ book, chapter, translation, verses });
      },

      POST: async ({ request }) => {
        // Admin uploads Tagalog (or any) text for a chapter
        let body: { key?: string; book?: string; chapter?: number; translation?: string; verses?: string[] };
        try {
          body = (await request.json()) as typeof body;
        } catch {
          return json({ error: "Invalid JSON body" }, 400);
        }

        const adminKey = process.env["ADMIN_UPLOAD_KEY"];
        if (!adminKey || body.key !== adminKey) {
          return json({ error: "Wrong admin key" }, 401);
        }

        const book = (body.book ?? "").toLowerCase().replace(/[^a-z0-9-]/g, "");
        const chapter = parseInt(String(body.chapter ?? "0"), 10);
        const translation = (body.translation ?? "tag").toLowerCase();
        const verses = body.verses ?? [];

        if (!book || !chapter || !verses.length) {
          return json({ error: "book, chapter and verses are required" }, 400);
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin
          .from("bible_cache")
          .upsert(
            { book, chapter, translation, verses: verses as never },
            { onConflict: "book,chapter,translation" },
          );

        if (error) return json({ error: error.message }, 500);
        return json({ ok: true });
      },
    },
  },
});
