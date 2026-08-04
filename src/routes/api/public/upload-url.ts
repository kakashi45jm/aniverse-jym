import { createFileRoute } from "@tanstack/react-router";

/**
 * Returns a short-lived signed upload URL so the browser can PUT a file
 * straight into the private "uploads" bucket. This avoids server request-body
 * size limits, so very large videos (multi-GB) can be uploaded.
 * Requires the admin key.
 */

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export const Route = createFileRoute("/api/public/upload-url")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: { key?: string; name?: string; folder?: string };
        try {
          body = (await request.json()) as typeof body;
        } catch {
          return json({ error: "Invalid JSON body" }, 400);
        }

        const adminKey = process.env["ADMIN_UPLOAD_KEY"];
        if (!adminKey || body.key !== adminKey) {
          return json({ error: "Wrong admin key" }, 401);
        }

        const ext = (String(body.name ?? "file.bin").split(".").pop() ?? "bin")
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "");
        const folder = String(body.folder ?? "media").replace(/[^a-z0-9_-]/g, "") || "media";
        const path = `${folder}/${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage
          .from("uploads")
          .createSignedUploadUrl(path);

        if (error || !data?.signedUrl) {
          return json({ error: error?.message ?? "Could not create upload URL" }, 500);
        }

        const base = process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"] || "";
        const uploadUrl = data.signedUrl.startsWith("http")
          ? data.signedUrl
          : `${base.replace(/\/$/, "")}${data.signedUrl.startsWith("/") ? "" : "/"}${data.signedUrl}`;

        return json({
          uploadUrl,
          token: data.token,
          path,
          url: `/api/public/file?p=${encodeURIComponent(path)}`,
        });
      },
    },
  },
});
