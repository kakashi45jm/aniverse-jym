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

        if (!path || path.indexOf("..") !== -1) {
          return new Response("Bad path", { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .storage
          .from("uploads")
          .createSignedUrl(path, 60 * 60 * 6);

        if (error || !data?.signedUrl) {
          return new Response(error?.message ?? "Not found", { status: 404 });
        }

        return new Response(null, {
          status: 302,
          headers: {
            location: data.signedUrl,
            "cache-control": "no-store",
          },
        });
      },
    },
  },
});
