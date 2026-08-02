import { createFileRoute } from "@tanstack/react-router";

type Body = {
  key?: string;
  action?: string;
  kind?: string;
  slug?: string;
  title?: string;
  payload?: unknown;
  notify?: boolean;
};

const KINDS = ["anime", "manga", "novel", "song", "album", "artist"];

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export const Route = createFileRoute("/api/public/library")({
  server: {
    handlers: {
      GET: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("library_items")
          .select("kind, slug, title, payload, created_at")
          .order("created_at", { ascending: true });
        if (error) return json({ error: error.message }, 500);
        return json({ items: data ?? [] });
      },

      POST: async ({ request }) => {
        let body: Body;
        try {
          body = (await request.json()) as Body;
        } catch {
          return json({ error: "Invalid JSON body" }, 400);
        }

        const adminKey = process.env["ADMIN_UPLOAD_KEY"];
        if (!adminKey || body.key !== adminKey) {
          return json({ error: "Wrong admin key" }, 401);
        }

        if (body.action === "verify") return json({ ok: true });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        if (body.action === "delete") {
          if (!body.slug) return json({ error: "slug is required" }, 400);
          const { error } = await supabaseAdmin
            .from("library_items")
            .delete()
            .eq("slug", body.slug);
          if (error) return json({ error: error.message }, 500);
          return json({ ok: true });
        }

        const kind = String(body.kind ?? "");
        const title = String(body.title ?? "").trim();
        if (!KINDS.includes(kind)) return json({ error: "Unknown kind" }, 400);
        if (!title) return json({ error: "Title is required" }, 400);

        const slug =
          body.slug ||
          `${kind}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

        const { error } = await supabaseAdmin.from("library_items").upsert(
          {
            kind,
            slug,
            title,
            payload: (body.payload ?? {}) as never,
          },
          { onConflict: "slug" },
        );
        if (error) return json({ error: error.message }, 500);

        if (body.notify !== false) {
          const label =
            kind === "anime"
              ? "New anime"
              : kind === "manga"
                ? "New manga"
                : kind === "novel"
                  ? "New novel"
                  : kind === "song"
                    ? "New song"
                    : "New upload";
          await supabaseAdmin.from("notifications").insert({
            title: `${label}: ${title}`,
            body: "Just added to AniVerse Library — tap to open.",
            href: kind === "anime" ? `#/anime/${slug}` : `#/${kind === "song" ? "music" : kind + "s"}`,
          });
        }

        return json({ ok: true, slug });
      },
    },
  },
});
