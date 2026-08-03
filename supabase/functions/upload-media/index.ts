import { createClient } from "npm:@supabase/supabase-js@2.111.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-Admin-Key",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const adminKey = Deno.env.get("ADMIN_UPLOAD_KEY") ?? "aniverce23";
    const sentKey = req.headers.get("x-admin-key") ?? "";

    if (!adminKey || sentKey !== adminKey) {
      return new Response(
        JSON.stringify({ error: "Wrong admin key" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return new Response(
        JSON.stringify({ error: "No file field in upload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (file.size > 100 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: "File too large (100MB max)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const ext = (file.name.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
    const fileName = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const folder = (formData.get("folder") as string) || "media";
    const path = `${folder}/${fileName}`;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const arrayBuf = await file.arrayBuffer();
    const { data, error } = await supabase
      .storage
      .from("uploads")
      .upload(path, arrayBuf, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const storedPath = data?.path ?? path;
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/uploads/${storedPath}`;

    return new Response(
      JSON.stringify({ url: publicUrl, path: storedPath }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
