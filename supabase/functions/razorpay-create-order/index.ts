/* eslint-disable @typescript-eslint/no-explicit-any */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { couponRowToDomain, evaluateCoupon, normalizeCouponCode } from "../_shared/coupons.ts";
import { calculateCheckoutTotals } from "../_shared/gst.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-session-token",
};

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { amount, receipt, notes, customerSessionToken, items = [], couponCode = "", contact = {}, shipping = {} } = await req.json();
    const keyId = Deno.env.get("RAZORPAY_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    const currency = Deno.env.get("RAZORPAY_CURRENCY") || "INR";
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!keyId || !keySecret) {
      return json({ error: "Razorpay keys are not configured" }, 500);
    }
    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: "Supabase service credentials are not configured" }, 500);
    }

    const sessionToken = req.headers.get("x-session-token") || String(customerSessionToken || "");
    if (!sessionToken) {
      return json({ error: "Complete WhatsApp OTP verification before payment" }, 401);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: customerSession, error: sessionError } = await supabase
      .from("customer_sessions")
      .select("id, customer_id, expires_at")
      .eq("token", sessionToken)
      .single();

    if (sessionError || !customerSession) {
      return json({ error: "Your checkout verification was not found" }, 401);
    }

    if (new Date(customerSession.expires_at) < new Date()) {
      return json({ error: "Your checkout verification has expired" }, 401);
    }

    const { data: verifiedCustomer, error: verifiedCustomerError } = await supabase
      .from("customers")
      .select("phone")
      .eq("id", customerSession.customer_id)
      .single();

    if (verifiedCustomerError || !verifiedCustomer) return json({ error: "Unable to load verified customer" }, 500);

    const contactPhone = normalizePhone(String(contact.phone || ""));
    if (!contactPhone || !shipping.fullName || !shipping.addressLine1 || !shipping.city || !shipping.state || !shipping.postalCode) {
      return json({ error: "Complete contact and shipping details before payment" }, 400);
    }
    if ((verifiedCustomer as any)?.phone && (verifiedCustomer as any).phone !== contactPhone) {
      return json({ error: "Payment phone number must match the verified WhatsApp number" }, 401);
    }

    let payableAmount = Number(amount);
    const cartLines = Array.isArray(items) ? items : [];
    let subtotal = 0;
    let discountAmount = 0;

    if (cartLines.length) {
      const variantIds = cartLines.map((item: any) => item.variantId);
      const { data: variants, error: variantsError } = await supabase
        .from("product_variants")
        .select("id, price, compare_at_price, inventory_qty, track_inventory, product:products(id, price, compare_at_price, status, tags, category:categories(slug))")
        .in("id", variantIds);
      if (variantsError) return json({ error: "Unable to validate cart" }, 500);
      if ((variants || []).length !== variantIds.length) return json({ error: "One or more cart items are unavailable" }, 409);

      const variantById = new Map((variants || []).map((variant: any) => [variant.id, variant]));
      const couponItems = cartLines.map((item: any) => {
        const variant: any = variantById.get(item.variantId);
        const quantity = Number(item.quantity || 0);
        if (!variant || variant.product?.status !== "active" || quantity < 1) throw new Error("Invalid cart item");
        const unitPrice = Number(variant.price ?? variant.product.price);
        if (variant.track_inventory && Number(variant.inventory_qty || 0) < quantity) throw new Error("One or more cart items are out of stock");
        const compareAtPrice = Number(variant.compare_at_price ?? variant.product.compare_at_price ?? 0);
        subtotal += unitPrice * quantity;
        return {
          productId: variant.product.id,
          categorySlug: variant.product.category?.slug || null,
          unitPrice,
          quantity,
          isSaleItem: compareAtPrice > unitPrice,
          tags: variant.product.tags || [],
        };
      });

      const normalizedCouponCode = normalizeCouponCode(String(couponCode || ""));
      if (normalizedCouponCode) {
        const { data: couponRow, error: couponError } = await supabase.from("coupons").select("*").eq("code", normalizedCouponCode).maybeSingle();
        if (couponError) return json({ error: "Unable to validate coupon" }, 500);
        if (!couponRow) return json({ error: "Coupon not found" }, 404);

        const [{ count: customerUsageCount }, { count: customerOrderCount }] = await Promise.all([
          supabase.from("coupon_redemptions").select("id", { count: "exact", head: true }).eq("coupon_id", couponRow.id).eq("customer_id", customerSession.customer_id),
          supabase.from("orders").select("id", { count: "exact", head: true }).eq("customer_id", customerSession.customer_id),
        ]);
        const evaluation = evaluateCoupon(couponRowToDomain(couponRow, customerUsageCount || 0), {
          items: couponItems,
          subtotal,
          shippingAmount: 0,
          customerOrderCount: customerOrderCount || 0,
          customerUsageCount: customerUsageCount || 0,
        });
        if (!evaluation.valid) return json({ error: evaluation.reason || "Coupon is invalid" }, 400);
        discountAmount = evaluation.discountAmount + evaluation.shippingDiscountAmount;
      }

      const totals = calculateCheckoutTotals({ subtotal, discountAmount });
      payableAmount = totals.total;
    }

    const amountInPaise = Math.round(payableAmount * 100);
    if (!Number.isFinite(amountInPaise) || amountInPaise < 100) return json({ error: "Invalid amount" }, 400);

    const safeReceipt = String(receipt || `ks_${Date.now()}`).slice(0, 40);

    const auth = btoa(`${keyId}:${keySecret}`);
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency,
        receipt: safeReceipt,
        notes: {
          source: "korasutra_checkout",
          subtotal: String(subtotal || payableAmount),
          discount_amount: String(discountAmount),
          gst_amount: String(cartLines.length ? calculateCheckoutTotals({ subtotal, discountAmount }).gstAmount : 0),
          coupon_code: normalizeCouponCode(String(couponCode || "")) || undefined,
          ...(notes && typeof notes === "object" ? notes : {}),
        },
      }),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) return json({
      error: data?.error?.description || "Unable to create Razorpay order",
      code: data?.error?.code || "RAZORPAY_ORDER_CREATE_FAILED",
    }, response.status);

    return json({
      key: keyId,
      order_id: data.id,
      amount: data.amount,
      currency: data.currency,
      receipt: data.receipt,
      subtotal,
      discountAmount,
      gstAmount: cartLines.length ? calculateCheckoutTotals({ subtotal, discountAmount }).gstAmount : 0,
      total: payableAmount,
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Internal server error" }, 500);
  }
});
