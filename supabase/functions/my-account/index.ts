import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const SESSION_DURATION_MS = 180 * 24 * 60 * 60 * 1000;

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

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const sessionToken = req.headers.get("x-session-token");
    if (!sessionToken) return json({ error: "Sign in with WhatsApp OTP first" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: session, error: sessionError } = await supabase
      .from("customer_sessions")
      .select("customer_id, expires_at")
      .eq("token", sessionToken)
      .single();

    if (sessionError || !session) {
      return json({ error: "Your account session was not found" }, 401);
    }

    if (new Date(session.expires_at) < new Date()) {
      return json({ error: "Your account session has expired" }, 401);
    }

    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();
    const refreshSessionPromise = supabase
      .from("customer_sessions")
      .update({ expires_at: expiresAt })
      .eq("token", sessionToken);

    const [customerRes, ordersRes] = await Promise.all([
      supabase
        .from("customers")
        .select("id, phone, country_code, name, email, is_verified")
        .eq("id", session.customer_id)
        .single(),
      supabase
        .from("orders")
        .select(`
          order_number,
          status,
          payment_status,
          total,
          created_at
        `)
        .eq("customer_id", session.customer_id)
        .order("created_at", { ascending: false })
        .limit(20),
      refreshSessionPromise,
    ]);

    if (customerRes.error || !customerRes.data) return json({ error: "Unable to load your account profile" }, 500);
    if (ordersRes.error) return json({ error: "Unable to load account orders" }, 500);

    return json({
      customer: customerRes.data,
      orders: ordersRes.data || [],
      expiresAt,
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Internal server error" }, 500);
  }
});
