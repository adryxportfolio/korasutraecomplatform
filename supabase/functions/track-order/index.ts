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

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { orderNumber, phone } = await req.json();
    const lookup = String(orderNumber || "").trim().toUpperCase();
    if (!/^KS-\d{4,}$/.test(lookup)) return json({ error: "Enter a valid order number" }, 400);
    const lookupPhone = String(phone || "").replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
    const sessionToken = req.headers.get("x-session-token");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: order, error } = await supabase
      .from("orders")
      .select(`
        customer_id,
        contact_email,
        contact_phone,
        ship_full_name,
        ship_phone,
        ship_address_line1,
        ship_address_line2,
        order_number,
        status,
        payment_method,
        payment_status,
        subtotal,
        shipping_amount,
        cod_surcharge,
        discount_amount,
        total,
        ship_city,
        ship_state,
        ship_postal_code,
        ship_country,
        tracking_number,
        tracking_url,
        carrier,
        created_at,
        order_items (
          id,
          product_title,
          variant_title,
          sku,
          quantity,
          unit_price,
          line_total,
          image_url
        )
      `)
      .eq("order_number", lookup)
      .single();

    if (error || !order) return json({ error: "Order not found" }, 404);

    let authorized = false;
    if (sessionToken) {
      const { data: session } = await supabase
        .from("customer_sessions")
        .select("customer_id, expires_at")
        .eq("token", sessionToken)
        .single();
      authorized = Boolean(session && new Date(session.expires_at) >= new Date() && session.customer_id === order.customer_id);
    }

    if (!authorized) {
      authorized = Boolean(lookupPhone.length >= 10 && [order.contact_phone, order.ship_phone].includes(lookupPhone));
    }

    if (!authorized) return json({ error: "Enter the verified phone number for this order" }, 401);

    const { customer_id: _customerId, ...safeOrder } = order;
    return json({ order: safeOrder });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Internal server error" }, 500);
  }
});
