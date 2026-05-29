/* eslint-disable @typescript-eslint/no-explicit-any */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { buildMetaCatalogCsv, buildMetaCatalogXml } from "../_shared/metaCatalogFeed.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function text(body: string, contentType: string, status = 200) {
  return new Response(body, {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=900, s-maxage=900",
    },
  });
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);

  const url = new URL(req.url);
  const feedToken = Deno.env.get("META_CATALOG_FEED_TOKEN") || "";
  if (feedToken && url.searchParams.get("token") !== feedToken) {
    return json({ error: "Unauthorized" }, 401);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data, error } = await supabase
    .from("products")
    .select("id, handle, title, description, short_description, status, price, compare_at_price, fabric, technique, color, has_blouse_piece, tags, product_images(url, position), product_videos(url, position), product_variants(sku, inventory_qty, position)")
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .limit(500);

  if (error) return json({ error: "Unable to build catalog feed" }, 500);

  const siteUrl = Deno.env.get("NEXT_PUBLIC_SITE_URL") || Deno.env.get("APP_URL") || "https://korasutra.com";
  const products = (data || []).filter((product: any) => product.handle && product.title);
  const format = (url.searchParams.get("format") || "csv").toLowerCase();

  if (format === "xml") {
    return text(buildMetaCatalogXml(products, siteUrl), "application/xml;charset=utf-8");
  }

  return text(buildMetaCatalogCsv(products, siteUrl), "text/csv;charset=utf-8");
});
