/* eslint-disable @typescript-eslint/no-explicit-any */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { aisensyConfig, sendAisensyTemplateMessage } from "../_shared/aisensy.ts";
import { buildAbandonedCartTemplateMessage, normalizeWhatsappDestination } from "../_shared/aisensyPayload.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function minutesEnv(name: string, fallback: number) {
  const value = Number(Deno.env.get(name) || fallback);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function itemSummary(activity: any) {
  const items = Array.isArray(activity?.metadata?.items) ? activity.metadata.items : [];
  const titles = items
    .map((item: any) => String(item?.productTitle || item?.sku || "").trim())
    .filter(Boolean);
  if (!titles.length) return activity?.sku || "your selected Korasutra pieces";
  const first = titles[0];
  const extra = titles.length > 1 ? ` + ${titles.length - 1} more` : "";
  return `${first}${extra}`;
}

async function hasLaterOrder(supabase: any, customerId: string, activityCreatedAt: string) {
  const { data } = await supabase
    .from("orders")
    .select("id")
    .eq("customer_id", customerId)
    .gte("created_at", activityCreatedAt)
    .limit(1)
    .maybeSingle();
  return Boolean(data?.id);
}

async function hasExistingLog(supabase: any, activityId: string) {
  const { data } = await supabase
    .from("whatsapp_message_log")
    .select("id")
    .eq("activity_id", activityId)
    .eq("message_type", "abandoned_cart")
    .maybeSingle();
  return Boolean(data?.id);
}

async function insertLog(supabase: any, activity: any, params: {
  destination: string;
  templateName: string;
  status: "sent" | "failed" | "skipped";
  reason?: string;
  responseBody?: string;
}) {
  await supabase.from("whatsapp_message_log").insert({
    customer_id: activity.customer_id,
    activity_id: activity.id,
    message_type: "abandoned_cart",
    destination: params.destination,
    template_name: params.templateName,
    status: params.status,
    reason: params.reason || null,
    response_body: params.responseBody || null,
  });
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (!["GET", "POST"].includes(req.method)) return json({ error: "Method not allowed" }, 405);

  const url = new URL(req.url);
  const cronSecret = Deno.env.get("CRON_SECRET") || "";
  if (cronSecret && req.headers.get("x-cron-secret") !== cronSecret && url.searchParams.get("token") !== cronSecret) {
    return json({ error: "Unauthorized" }, 401);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const minAgeMinutes = minutesEnv("ABANDONED_CART_MIN_AGE_MINUTES", 60);
  const maxAgeHours = minutesEnv("ABANDONED_CART_MAX_AGE_HOURS", 48) * 60;
  const now = Date.now();
  const cutoffIso = new Date(now - minAgeMinutes * 60_000).toISOString();
  const floorIso = new Date(now - maxAgeHours * 60_000).toISOString();

  const { data: activities, error } = await supabase
    .from("customer_activities")
    .select("id, customer_id, sku, metadata, created_at, customer:customers(id, name, phone, country_code)")
    .eq("activity_type", "cart_snapshot")
    .gte("created_at", floorIso)
    .lte("created_at", cutoffIso)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return json({ error: "Unable to load abandoned cart activity" }, 500);

  const config = aisensyConfig();
  const cartUrl = Deno.env.get("ABANDONED_CART_CHECKOUT_URL") || `${Deno.env.get("NEXT_PUBLIC_SITE_URL") || "https://korasutra.com"}/cart`;
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const activity of activities || []) {
    const itemCount = Number(activity?.metadata?.itemCount || 0);
    if (!activity.customer_id || itemCount <= 0) {
      skipped += 1;
      continue;
    }
    if (await hasExistingLog(supabase, activity.id) || await hasLaterOrder(supabase, activity.customer_id, activity.created_at)) {
      skipped += 1;
      continue;
    }

    const customer = Array.isArray(activity.customer) ? activity.customer[0] : activity.customer;
    const destination = normalizeWhatsappDestination(customer?.country_code || "+91", customer?.phone || "");
    if (!customer?.phone || destination.length < 13) {
      await insertLog(supabase, activity, {
        destination: destination || "-",
        templateName: config.abandonedCartTemplateName,
        status: "skipped",
        reason: "Customer WhatsApp phone is missing",
      });
      skipped += 1;
      continue;
    }

    const payload = buildAbandonedCartTemplateMessage({
      apiKey: config.apiKey,
      destination,
      customerName: customer?.name,
      itemSummary: itemSummary(activity),
      cartUrl,
      templateName: config.abandonedCartTemplateName,
      source: config.source,
    });
    const result = await sendAisensyTemplateMessage(payload, config.endpoint);
    await insertLog(supabase, activity, {
      destination,
      templateName: config.abandonedCartTemplateName,
      status: result.sent ? "sent" : "failed",
      reason: result.reason,
      responseBody: result.responseBody,
    });
    if (result.sent) sent += 1;
    else failed += 1;
  }

  return json({ success: true, sent, skipped, failed });
});
