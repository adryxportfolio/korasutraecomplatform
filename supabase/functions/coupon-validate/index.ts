/* eslint-disable @typescript-eslint/no-explicit-any */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { couponRowToDomain, evaluateCoupon, normalizeCouponCode } from "../_shared/coupons.ts";
import { calculateCheckoutTotals } from "../_shared/gst.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-session-token",
};

type CartLine = { variantId: string; quantity: number };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const code = normalizeCouponCode(String(body.couponCode || ""));
    const items = (body.items || []) as CartLine[];
    if (!code) return json({ error: "Enter a coupon code" }, 400);
    if (!items.length) return json({ error: "Cart is empty" }, 400);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const sessionToken = req.headers.get("x-session-token") || String(body.customerSessionToken || "");
    if (!sessionToken) return json({ error: "Verify your WhatsApp number before applying a coupon" }, 401);
    let customerId: string | null = null;
    let customerOrderCount = 0;

    const { data: session } = await supabase
      .from("customer_sessions")
      .select("customer_id, expires_at")
      .eq("token", sessionToken)
      .maybeSingle();
    if (!session || new Date(session.expires_at) < new Date()) return json({ error: "Your checkout verification has expired" }, 401);
    customerId = session.customer_id;
    const { count } = await supabase.from("orders").select("id", { count: "exact", head: true }).eq("customer_id", customerId);
    customerOrderCount = count || 0;

    const variantIds = items.map((item) => item.variantId);
    const { data: variants, error: variantsError } = await supabase
      .from("product_variants")
      .select("id, price, compare_at_price, product:products(id, price, compare_at_price, status, tags, category:categories(slug))")
      .in("id", variantIds);

    if (variantsError) return json({ error: "Unable to validate cart" }, 500);
    if ((variants || []).length !== variantIds.length) return json({ error: "One or more cart items are unavailable" }, 409);

    const variantById = new Map((variants || []).map((variant: any) => [variant.id, variant]));
    const couponItems = items.map((item) => {
      const variant: any = variantById.get(item.variantId);
      const unitPrice = Number(variant.price ?? variant.product.price);
      const compareAtPrice = Number(variant.compare_at_price ?? variant.product.compare_at_price ?? 0);
      return {
        productId: variant.product.id,
        categorySlug: variant.product.category?.slug || null,
        unitPrice,
        quantity: Number(item.quantity || 0),
        isSaleItem: compareAtPrice > unitPrice,
        tags: variant.product.tags || [],
      };
    });
    const subtotal = couponItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

    const { data: couponRow, error: couponError } = await supabase.from("coupons").select("*").eq("code", code).maybeSingle();
    if (couponError) return json({ error: "Unable to validate coupon" }, 500);
    if (!couponRow) return json({ error: "Coupon not found" }, 404);

    const { count: customerUsageCount } = customerId
      ? await supabase.from("coupon_redemptions").select("id", { count: "exact", head: true }).eq("coupon_id", couponRow.id).eq("customer_id", customerId)
      : { count: 0 };

    const coupon = couponRowToDomain(couponRow, customerUsageCount || 0);
    const result = evaluateCoupon(coupon, {
      items: couponItems,
      subtotal,
      shippingAmount: 0,
      customerOrderCount,
      customerUsageCount: customerUsageCount || 0,
    });

    if (!result.valid) return json({ error: result.reason || "Coupon is invalid" }, 400);

    const discountAmount = result.discountAmount + result.shippingDiscountAmount;
    const { gstAmount, total } = calculateCheckoutTotals({ subtotal, discountAmount });

    return json({
      success: true,
      coupon: {
        id: couponRow.id,
        code: couponRow.code,
        description: couponRow.description,
        discountType: couponRow.discount_type,
      },
      subtotal,
      discountAmount,
      gstAmount,
      total,
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Internal server error" }, 500);
  }
});
