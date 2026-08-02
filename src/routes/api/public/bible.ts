import { createFileRoute } from "@tanstack/react-router";

/**
 * Full Bible text (King James Version — public domain, complete Christian canon).
 * Chapters are fetched once from bible-api.com and cached in the database,
 * so old browsers only ever talk to our own origin.
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

export const Route = createFileRoute("/api/public/bible")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const book = (url.searchParams.get("book") ?? "").toLowerCase().replace(/[^a-z0-9-]/g, "");
        const chapter = parseInt(url.searchParams.get("chapter") ?? "1", 10);

        if (!book || !chapter || chapter < 1 || chapter > 200) {
          return json({ error: "book and chapter are required" }, 400);
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const cached = await supabaseAdmin
          .from("bible_cache")
          .select("verses")
          .eq("book", book)
          .eq("chapter", chapter)
          .maybeSingle();

        if (cached.data?.verses) {
          return json({ book, chapter, verses: cached.data.verses });
        }

        const remote = await fetch(
          `https://bible-api.com/${encodeURIComponent(bookName(book) + " " + chapter)}?translation=kjv`,
        );
        if (!remote.ok) {
          return json({ error: "Could not load this chapter right now." }, 502);
        }
        const payload = (await remote.json()) as {
          verses?: Array<{ verse: number; text: string }>;
        };
        const verses = (payload.verses ?? []).map((v) => v.text.replace(/\s+/g, " ").trim());
        if (!verses.length) {
          return json({ error: "No text found for this chapter." }, 404);
        }

        await supabaseAdmin
          .from("bible_cache")
          .upsert({ book, chapter, verses: verses as never }, { onConflict: "book,chapter" });

        return json({ book, chapter, verses });
      },
    },
  },
});
