import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hmacSha256(secret: string, payload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return toHex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)));
}

serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") || "";
  const webhookSecret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
  if (!webhookSecret) return json({ error: "Webhook secret is not configured" }, 500);

  const expectedSignature = await hmacSha256(webhookSecret, rawBody);
  if (expectedSignature !== signature.toLowerCase()) {
    return json({ error: "Invalid Razorpay webhook signature" }, 400);
  }

  const event = JSON.parse(rawBody);
  const payment = event?.payload?.payment?.entity;
  if (!payment?.order_id) return json({ received: true });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  if (event.event === "payment.captured") {
    await supabase
      .from("orders")
      .update({
        payment_status: "paid",
        status: "confirmed",
        razorpay_payment_id: payment.id,
      })
      .eq("razorpay_order_id", payment.order_id);
  }

  if (event.event === "payment.failed") {
    await supabase
      .from("orders")
      .update({
        payment_status: "failed",
        razorpay_payment_id: payment.id,
        notes: payment.error_description || "Razorpay payment failed",
      })
      .eq("razorpay_order_id", payment.order_id);
  }

  return json({ received: true });
});
