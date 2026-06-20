/* eslint-disable @typescript-eslint/no-explicit-any */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { uploadToSupabaseStorage } from "../_shared/storage.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-token",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function sanitize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "");
}

function decodeDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid media data");
  const contentType = match[1];
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return { contentType, bytes };
}

async function validateAdminToken(supabase: any, token: string | null) {
  if (!token) return false;
  const { data } = await supabase
    .from("admin_sessions")
    .select("admin_id, expires_at")
    .eq("token", token)
    .single();
  return Boolean(data && new Date(data.expires_at) > new Date());
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    if (!await validateAdminToken(supabase, req.headers.get("x-admin-token"))) {
      return json({ error: "Unauthorized" }, 401);
    }

    const body = await req.json();
    const { contentType, bytes } = decodeDataUrl(String(body.dataUrl || ""));
    const mediaType = contentType.startsWith("video/") ? "video" : contentType.startsWith("image/") ? "image" : null;
    if (!mediaType) return json({ error: "Only image and video uploads are supported" }, 400);
    const maxBytes = mediaType === "video" ? 50 * 1024 * 1024 : 8 * 1024 * 1024;
    if (bytes.byteLength > maxBytes) return json({ error: mediaType === "video" ? "Video must be smaller than 50MB" : "Image must be smaller than 8MB" }, 400);

    const handle = sanitize(String(body.productHandle || "product")) || "product";
    const defaultExtension = mediaType === "video" ? "mp4" : "jpg";
    const fileName = sanitize(String(body.fileName || `${mediaType}.${contentType.split("/")[1] || defaultExtension}`));
    const bucket = mediaType === "video" ? "product-videos" : "product-images";
    const folder = `${handle}/${mediaType}s`;
    const upload = await uploadToSupabaseStorage(supabase, { bytes, contentType, fileName, folder, bucket });

    return json({
      success: true,
      path: upload.path,
      url: upload.url,
      mediaType,
      contentType,
      storage: "supabase",
      supabase: {
        bucket,
        path: upload.path,
        bytes: upload.bytes,
      },
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Internal server error" }, 500);
  }
});
