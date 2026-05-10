import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-session-token",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function notifyCommerceSync(payload: Record<string, unknown>) {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) return;

    await fetch(`${supabaseUrl}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [{
          topic: "commerce-sync",
          event: "commerce-updated",
          payload: { ...payload, savedAt: new Date().toISOString() },
        }],
      }),
    });
  } catch (error) {
    console.error("Customer activity realtime broadcast error:", error);
  }
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const activityType = String(body.activityType || body.activity_type || "");
    if (!["just_visit", "product_added_to_cart", "checkout"].includes(activityType)) {
      return json({ error: "Invalid activity type" }, 400);
    }

    const sessionToken = req.headers.get("x-session-token") || String(body.customerSessionToken || "");
    if (!sessionToken) return json({ skipped: true, reason: "No customer session" });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: session, error: sessionError } = await supabase
      .from("customer_sessions")
      .select("customer_id, expires_at")
      .eq("token", sessionToken)
      .maybeSingle();

    if (sessionError || !session || new Date(session.expires_at) < new Date()) {
      return json({ skipped: true, reason: "Invalid customer session" }, 401);
    }

    const sku = String(body.sku || "").trim() || null;
    const metadata = body.metadata && typeof body.metadata === "object" ? body.metadata : {};
    const { data, error } = await supabase
      .from("customer_activities")
      .insert({
        customer_id: session.customer_id,
        activity_type: activityType,
        sku,
        metadata,
      })
      .select("id")
      .single();

    if (error || !data) return json({ error: "Unable to track activity" }, 500);

    await supabase.from("customers").update({ updated_at: new Date().toISOString() }).eq("id", session.customer_id);
    await notifyCommerceSync({ action: "customer-activity", table: "customer_activities", customerId: session.customer_id });
    return json({ success: true, activityId: data.id });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Internal server error" }, 500);
  }
});
