import { createFileRoute } from "@tanstack/react-router";

/**
 * Public file proxy for the private "uploads" storage bucket.
 * Redirects to a short-lived signed URL so stored links never expire
 * and byte-range requests (video/audio seeking) are handled by storage.
 * Usage: /api/public/file?p=media/abc123.mp4
 */
export const Route = createFileRoute("/api/public/file")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const path = url.searchParams.get("p") ?? "";
        const wantJson = url.searchParams.get("json") === "1";

        if (!path || path.indexOf("..") !== -1) {
          return new Response("Bad path", { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .storage
          .from("uploads")
          .createSignedUrl(path, 60 * 60 * 12);

        if (error || !data?.signedUrl) {
          const msg = error?.message ?? "Not found";
          return wantJson
            ? new Response(JSON.stringify({ error: msg }), {
                status: 404,
                headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
              })
            : new Response(msg, { status: 404 });
        }

        // Old Safari (iOS 9) handles byte-range requests badly across a 302 hop,
        // so clients can ask for the signed URL directly and stream from storage.
        if (wantJson) {
          return new Response(JSON.stringify({ url: data.signedUrl }), {
            headers: {
              "content-type": "application/json; charset=utf-8",
              "cache-control": "public, max-age=3600",
            },
          });
        }

        return new Response(null, {
          status: 302,
          headers: {
            location: data.signedUrl,
            "cache-control": "public, max-age=3600",
          },
        });
      },

    },
  },
});
