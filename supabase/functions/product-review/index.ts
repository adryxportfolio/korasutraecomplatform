/* eslint-disable @typescript-eslint/no-explicit-any */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-session-token",
};

const reviewableOrderStatuses = new Set(["confirmed", "processing", "shipped", "delivered"]);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeText(value: unknown, maxLength: number) {
  const text = String(value || "").trim();
  return text.slice(0, maxLength);
}

function orderCanBeReviewed(order: any) {
  if (!reviewableOrderStatuses.has(String(order.status || ""))) return false;
  if (order.payment_method === "cod") return order.payment_status === "pending" || order.payment_status === "paid";
  return order.payment_status === "paid";
}

async function notifyCommerceSync(payload: Record<string, unknown>) {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) return;

    const response = await fetch(`${supabaseUrl}/realtime/v1/api/broadcast`, {
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
    if (!response.ok) {
      console.error("Review realtime broadcast failed:", response.status, await response.text());
    }
  } catch (error) {
    console.error("Review realtime broadcast error:", error);
  }
}

async function loadSessionCustomer(supabase: any, token: string | null) {
  if (!token) return null;

  const { data: session, error } = await supabase
    .from("customer_sessions")
    .select("customer_id, expires_at")
    .eq("token", token)
    .single();

  if (error || !session || new Date(session.expires_at) < new Date()) return null;

  const { data: customer } = await supabase
    .from("customers")
    .select("id, name, email")
    .eq("id", session.customer_id)
    .single();

  return customer || null;
}

async function findPurchasedOrderItem(supabase: any, customerId: string, productId: string) {
  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, status, payment_method, payment_status, order_items(id, product_id)")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw new Error("Unable to verify purchase history");

  for (const order of orders || []) {
    if (!orderCanBeReviewed(order)) continue;
    const item = (order.order_items || []).find((orderItem: any) => String(orderItem.product_id) === productId);
    if (item) return item;
  }

  return null;
}

async function hasExistingReview(supabase: any, customerId: string, productId: string) {
  const { data, error } = await supabase
    .from("reviews")
    .select("id")
    .eq("customer_id", customerId)
    .eq("product_id", productId)
    .maybeSingle();

  if (error) throw new Error("Unable to check existing review");
  return Boolean(data);
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const action = body.action === "submit" ? "submit" : "check";
    const productId = normalizeText(body.productId, 120);
    const productHandle = normalizeText(body.productHandle, 220);

    if (!productId || !productHandle) return json({ error: "Product is required" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const customer = await loadSessionCustomer(supabase, req.headers.get("x-session-token") || body.customerSessionToken);
    if (!customer) {
      const response = { eligible: false, reason: "Complete checkout with WhatsApp OTP before writing a review." };
      return action === "check" ? json(response) : json({ error: response.reason }, 401);
    }

    if (await hasExistingReview(supabase, customer.id, productId)) {
      const response = { eligible: false, reason: "You have already reviewed this product." };
      return action === "check" ? json(response) : json({ error: response.reason }, 409);
    }

    const orderItem = await findPurchasedOrderItem(supabase, customer.id, productId);
    if (!orderItem) {
      const response = { eligible: false, reason: "Purchase this product before reviewing it." };
      return action === "check" ? json(response) : json({ error: response.reason }, 403);
    }

    if (action === "check") return json({ eligible: true });

    const customerName = normalizeText(body.customerName, 100) || customer.name || "Kora Sutra Customer";
    const title = normalizeText(body.title, 150);
    const content = normalizeText(body.content, 2000);
    const rating = Math.min(5, Math.max(1, Math.round(Number(body.rating || 0))));

    if (!content) return json({ error: "Review content is required" }, 400);

    const { data: review, error: insertError } = await supabase
      .from("reviews")
      .insert({
        product_id: productId,
        product_handle: productHandle,
        customer_id: customer.id,
        order_item_id: orderItem.id,
        customer_name: customerName,
        customer_email: customer.email || null,
        rating,
        title: title || null,
        content,
        is_verified_purchase: true,
        is_approved: true,
      })
      .select("id")
      .single();

    if (insertError || !review) return json({ error: "Unable to submit review" }, 500);

    await notifyCommerceSync({
      action: "review-created",
      table: "reviews",
      productId,
      customerId: customer.id,
      reviewId: review.id,
    });

    return json({ success: true, reviewId: review.id });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Internal server error" }, 500);
  }
});
