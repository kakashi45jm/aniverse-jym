import { createFileRoute } from "@tanstack/react-router";

/**
 * File upload endpoint — accepts multipart form data, stores the file in
 * the Supabase "uploads" storage bucket, and returns the public URL.
 * Requires the admin key in the X-Admin-Key header.
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

export const Route = createFileRoute("/api/public/upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const adminKey = process.env["ADMIN_UPLOAD_KEY"];
        const sentKey = request.headers.get("x-admin-key") ?? "";

        if (!adminKey || sentKey !== adminKey) {
          return json({ error: "Wrong admin key" }, 401);
        }

        const contentType = request.headers.get("content-type") ?? "";
        if (!contentType.includes("multipart/form-data")) {
          return json({ error: "Expected multipart/form-data" }, 400);
        }

        let formData: FormData;
        try {
          formData = await request.formData();
        } catch {
          return json({ error: "Could not read form data" }, 400);
        }

        const file = formData.get("file");
        if (!(file instanceof File)) {
          return json({ error: "No file field in upload" }, 400);
        }

        if (file.size > 5 * 1024 * 1024 * 1024) {
          return json({ error: "File too large (5GB max)" }, 400);
        }

        const ext = (file.name.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
        const fileName = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const folder = (formData.get("folder") as string) || "media";
        const path = `${folder}/${fileName}`;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const arrayBuf = await file.arrayBuffer();
        const { data, error } = await supabaseAdmin
          .storage
          .from("uploads")
          .upload(path, arrayBuf, {
            contentType: file.type || "application/octet-stream",
            upsert: false,
          });

        if (error) {
          return json({ error: error.message }, 500);
        }

        const storedPath = data?.path ?? path;
        // The bucket is private; serve through our own stable proxy route.
        // Relative URL so the same record works on preview and published domains.
        return json({
          url: `/api/public/file?p=${encodeURIComponent(storedPath)}`,
          path: storedPath,
        });
      },
    },
  },
});
