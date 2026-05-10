/* eslint-disable @typescript-eslint/no-explicit-any */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { couponRowToDomain, evaluateCoupon, normalizeCouponCode } from "../_shared/coupons.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-session-token",
};

type CartLine = { variantId: string; quantity: number };
type EmailResult = { sent: boolean; reason: string };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
}

function normalizeCountryCode(countryCode: string) {
  const digits = countryCode.replace(/\D/g, "") || "91";
  return `+${digits}`;
}

function isValidEmail(value: unknown) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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
      console.error("Commerce realtime broadcast failed:", response.status, await response.text());
    }
  } catch (error) {
    console.error("Commerce realtime broadcast error:", error);
  }
}

async function sendOrderEmails(order: any, orderItems: any[]) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("RESEND_FROM_EMAIL") || "Kora Sutra <orders@korasutra.com>";
  if (!apiKey) {
    console.warn("Order email skipped: RESEND_API_KEY is not configured");
    return;
  }

  const lineItems = orderItems
    .map((item) => `${item.quantity}x ${item.product_title} (${item.sku || "no SKU"}) - ₹${item.line_total}`)
    .join("<br/>");

  const adminHtml = `
    <h2>New order ${order.order_number}</h2>
    <p><strong>Customer:</strong> ${order.ship_full_name}</p>
    <p><strong>Phone:</strong> ${order.contact_phone}</p>
    <p><strong>Email:</strong> ${order.contact_email || "-"}</p>
    <p><strong>Address:</strong> ${order.ship_address_line1}, ${order.ship_address_line2 || ""} ${order.ship_city}, ${order.ship_state} ${order.ship_postal_code}</p>
    <p><strong>Payment:</strong> ${order.payment_method} / ${order.payment_status}</p>
    <p><strong>Total:</strong> ₹${order.total}</p>
    <hr/>
    <p>${lineItems}</p>
  `;

  const requests = [
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: ["korasutra.official@gmail.com"],
        subject: `New order ${order.order_number} - ₹${order.total}`,
        html: adminHtml,
      }),
    }),
  ];

  if (order.contact_email) {
    requests.push(fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [order.contact_email],
        subject: `Order ${order.order_number} confirmed - Korasutra`,
        html: `
          <h2>Thank you for your order</h2>
          <p>Your Kora Sutra order <strong>${order.order_number}</strong> is confirmed.</p>
          <p>Total: <strong>₹${order.total}</strong></p>
          <p>Track your order: <a href="https://korasutra.com/order-tracking/${order.order_number}">https://korasutra.com/order-tracking/${order.order_number}</a></p>
          <hr/>
          <p>${lineItems}</p>
        `,
      }),
    }));
  }

  const results = await Promise.allSettled(requests.map(async (request) => {
    const response = await request;
    const responseBody = await response.text();
    if (!response.ok) throw new Error(`Resend ${response.status}: ${responseBody}`);
    return responseBody;
  }));
  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error(`Order email ${index + 1} failed for ${order.order_number}:`, result.reason);
    }
  });
}

async function sendEmail(params: { apiKey: string; from: string; to: string; subject: string; html: string }): Promise<EmailResult> {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${params.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: params.from,
        to: [params.to],
        subject: params.subject,
        html: params.html,
      }),
    });
    const responseBody = await response.text();
    if (!response.ok) return { sent: false, reason: `Resend ${response.status}: ${responseBody}` };
    return { sent: true, reason: "" };
  } catch (error) {
    return { sent: false, reason: error instanceof Error ? error.message : "Email request failed" };
  }
}

async function sendOrderEmailsWithResults(order: any, orderItems: any[]) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("RESEND_FROM_EMAIL") || "Kora Sutra <orders@korasutra.com>";
  const adminEmail = Deno.env.get("ADMIN_ORDER_NOTIFICATION_EMAIL") || "korasutra.official@gmail.com";
  if (!apiKey) {
    const result = { sent: false, reason: "RESEND_API_KEY is not configured" };
    console.warn("Order email skipped:", result.reason);
    return { customer: result, admin: result };
  }

  const lineItems = orderItems
    .map((item) => `<li>${Number(item.quantity)}x ${escapeHtml(item.product_title)} (${escapeHtml(item.sku || "no SKU")}) - INR ${Number(item.line_total).toFixed(2)}</li>`)
    .join("");

  const admin = await sendEmail({
    apiKey,
    from,
    to: adminEmail,
    subject: `New order ${order.order_number} - INR ${Number(order.total || 0).toFixed(2)}`,
    html: `
      <h2>New order ${escapeHtml(order.order_number)}</h2>
      <p><strong>Customer:</strong> ${escapeHtml(order.ship_full_name)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(order.contact_phone)}</p>
      <p><strong>Email:</strong> ${escapeHtml(order.contact_email || "-")}</p>
      <p><strong>Address:</strong> ${escapeHtml(order.ship_address_line1)}, ${escapeHtml(order.ship_address_line2 || "")} ${escapeHtml(order.ship_city)}, ${escapeHtml(order.ship_state)} ${escapeHtml(order.ship_postal_code)}</p>
      <p><strong>Payment:</strong> ${escapeHtml(order.payment_method)} / ${escapeHtml(order.payment_status)}</p>
      <p><strong>Total:</strong> INR ${Number(order.total || 0).toFixed(2)}</p>
      <hr/>
      <ul>${lineItems}</ul>
    `,
  });

  let customer: EmailResult = { sent: false, reason: "Customer email is missing" };
  if (order.contact_email) {
    customer = await sendEmail({
      apiKey,
      from,
      to: order.contact_email,
      subject: `Order ${order.order_number} confirmed - Kora Sutra`,
      html: `
        <h2>Thank you for your order</h2>
        <p>Your Kora Sutra order <strong>${escapeHtml(order.order_number)}</strong> is confirmed.</p>
        <p>Total: <strong>INR ${Number(order.total || 0).toFixed(2)}</strong></p>
        <p>Track your order: <a href="https://korasutra.com/order-tracking/${encodeURIComponent(order.order_number)}">https://korasutra.com/order-tracking/${escapeHtml(order.order_number)}</a></p>
        <hr/>
        <ul>${lineItems}</ul>
      `,
    });
  }

  if (!admin.sent) console.error(`Admin order email failed for ${order.order_number}:`, admin.reason);
  if (!customer.sent) console.error(`Customer order email failed for ${order.order_number}:`, customer.reason);
  return { customer, admin };
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const items = (body.items || []) as CartLine[];
    const shipping = body.shipping || {};
    const contact = body.contact || {};
    const contactPhone = normalizePhone(String(contact.phone || ""));
    const contactCountryCode = normalizeCountryCode(String(contact.countryCode || "+91"));
    const contactEmail = String(contact.email || "").trim().toLowerCase();
    const paymentMethod = body.paymentMethod === "cod" ? "cod" : "razorpay";

    if (!items.length) return json({ error: "Cart is empty" }, 400);
    if (!contactPhone || !shipping.fullName || !shipping.addressLine1 || !shipping.city || !shipping.state || !shipping.postalCode) {
      return json({ error: "Contact and shipping details are required" }, 400);
    }
    if (!isValidEmail(contactEmail)) {
      return json({ error: "A valid email is required for the order receipt" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const customerSessionToken = req.headers.get("x-session-token") || body.customerSessionToken;
    if (!customerSessionToken) return json({ error: "Complete WhatsApp OTP verification before checkout" }, 401);

    const { data: customerSession, error: sessionError } = await supabase
      .from("customer_sessions")
      .select("customer_id, expires_at")
      .eq("token", customerSessionToken)
      .single();

    if (sessionError || !customerSession) {
      return json({ error: "Your checkout verification was not found" }, 401);
    }

    if (new Date(customerSession.expires_at) < new Date()) {
      return json({ error: "Your checkout verification has expired" }, 401);
    }

    const { data: sessionCustomer, error: sessionCustomerError } = await supabase
      .from("customers")
      .select("id, phone, country_code")
      .eq("id", customerSession.customer_id)
      .single();

    if (sessionCustomerError || !sessionCustomer) return json({ error: "Unable to load verified customer" }, 500);

    if (sessionCustomer?.phone !== contactPhone || sessionCustomer?.country_code !== contactCountryCode) {
      return json({ error: "Checkout phone number must match the verified WhatsApp number" }, 401);
    }

    const variantIds = items.map((item) => item.variantId);
    const { data: variants, error: variantsError } = await supabase
      .from("product_variants")
      .select("id, sku, title, price, compare_at_price, inventory_qty, track_inventory, product:products(id, title, price, compare_at_price, status, tags, category:categories(slug), product_images(url, position))")
      .in("id", variantIds);

    if (variantsError) return json({ error: "Unable to validate cart" }, 500);
    if ((variants || []).length !== variantIds.length) return json({ error: "One or more cart items are unavailable" }, 409);

    const variantById = new Map((variants || []).map((variant: any) => [variant.id, variant]));
    let subtotal = 0;

    for (const item of items) {
      const variant: any = variantById.get(item.variantId);
      if (!variant || variant.product?.status !== "active") return json({ error: "One or more cart items are unavailable" }, 409);
      if (item.quantity < 1) return json({ error: "Invalid item quantity" }, 400);
      if (variant.track_inventory && variant.inventory_qty < item.quantity) {
        return json({ error: `${variant.product.title} is out of stock` }, 409);
      }
      const unitPrice = Number(variant.price ?? variant.product.price);
      subtotal += unitPrice * item.quantity;
    }

    const codSurcharge = paymentMethod === "cod" ? 200 : 0;
    let discountAmount = 0;
    let couponId: string | null = null;
    let couponCode: string | null = null;

    const requestedCouponCode = normalizeCouponCode(String(body.couponCode || ""));
    if (requestedCouponCode) {
      const { count: customerOrderCount } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("customer_id", customerSession.customer_id);

      const { data: couponRow, error: couponError } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", requestedCouponCode)
        .maybeSingle();

      if (couponError) return json({ error: "Unable to validate coupon" }, 500);
      if (!couponRow) return json({ error: "Coupon not found" }, 404);

      const { count: customerUsageCount } = await supabase
        .from("coupon_redemptions")
        .select("id", { count: "exact", head: true })
        .eq("coupon_id", couponRow.id)
        .eq("customer_id", customerSession.customer_id);

      const couponItems = items.map((item) => {
        const variant: any = variantById.get(item.variantId);
        const unitPrice = Number(variant.price ?? variant.product.price);
        const compareAtPrice = Number(variant.compare_at_price ?? variant.product.compare_at_price ?? 0);
        return {
          productId: variant.product.id,
          categorySlug: variant.product.category?.slug || null,
          unitPrice,
          quantity: item.quantity,
          isSaleItem: compareAtPrice > unitPrice,
          tags: variant.product.tags || [],
        };
      });

      const coupon = couponRowToDomain(couponRow, customerUsageCount || 0);
      const evaluation = evaluateCoupon(coupon, {
        items: couponItems,
        subtotal,
        shippingAmount: 0,
        customerOrderCount: customerOrderCount || 0,
        customerUsageCount: customerUsageCount || 0,
      });
      if (!evaluation.valid) return json({ error: evaluation.reason || "Coupon is invalid" }, 400);

      discountAmount = evaluation.discountAmount + evaluation.shippingDiscountAmount;
      couponId = couponRow.id;
      couponCode = couponRow.code;
    }

    const total = Math.max(0, subtotal + codSurcharge - discountAmount);

    if (paymentMethod === "razorpay" && !body.razorpayPaymentId) {
      return json({ error: "Razorpay payment details are required" }, 400);
    }

    const { data: customer, error: customerUpdateError } = await supabase
      .from("customers")
      .update({
        email: contactEmail,
        name: shipping.fullName,
        is_verified: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", customerSession.customer_id)
      .select("id")
      .single();
    if (customerUpdateError || !customer) return json({ error: "Unable to update customer profile" }, 500);

    const { data: generatedNumber, error: numberError } = await supabase.rpc("generate_order_number");
    if (numberError || !generatedNumber) return json({ error: "Unable to generate order number" }, 500);

    const now = new Date().toISOString();
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: generatedNumber,
        customer_id: customer.id,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        ship_full_name: shipping.fullName,
        ship_phone: normalizePhone(String(shipping.phone || contactPhone)),
        ship_address_line1: shipping.addressLine1,
        ship_address_line2: shipping.addressLine2 || null,
        ship_city: shipping.city,
        ship_state: shipping.state,
        ship_postal_code: shipping.postalCode,
        ship_country: "India",
        subtotal,
        shipping_amount: 0,
        cod_surcharge: codSurcharge,
        discount_amount: discountAmount,
        total,
        coupon_id: couponId,
        coupon_code: couponCode,
        payment_method: paymentMethod,
        payment_status: paymentMethod === "razorpay" ? "paid" : "pending",
        status: paymentMethod === "razorpay" ? "confirmed" : "confirmed",
        razorpay_order_id: body.razorpayOrderId || null,
        razorpay_payment_id: body.razorpayPaymentId || null,
        razorpay_signature: body.razorpaySignature || null,
        placed_at: now,
      })
      .select("id, order_number")
      .single();

    if (orderError || !order) return json({ error: "Unable to place order" }, 500);

    const orderItems = items.map((item) => {
      const variant: any = variantById.get(item.variantId);
      const image = [...(variant.product.product_images || [])].sort((a: any, b: any) => a.position - b.position)[0];
      const unitPrice = Number(variant.price ?? variant.product.price);
      return {
        order_id: order.id,
        product_id: variant.product.id,
        variant_id: variant.id,
        product_title: variant.product.title,
        variant_title: variant.title,
        sku: variant.sku,
        image_url: image?.url || null,
        unit_price: unitPrice,
        quantity: item.quantity,
        line_total: unitPrice * item.quantity,
      };
    });

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
    if (itemsError) return json({ error: "Order was created but items could not be saved" }, 500);

    const { data: inventoryUpdates, error: inventoryError } = await supabase.rpc("decrement_order_inventory", {
      p_order_id: order.id,
    });
    if (inventoryError) {
      await supabase.from("orders").delete().eq("id", order.id);
      const message = String(inventoryError.message || "");
      const isStockConflict = message.includes("OUT_OF_STOCK") || message.includes("VARIANT_NOT_FOUND") || message.includes("INVALID_QUANTITY");
      return json({
        error: isStockConflict ? "One or more cart items are no longer available" : "Unable to update inventory for this order",
      }, isStockConflict ? 409 : 500);
    }

    if (couponId) {
      const { error: redemptionError } = await supabase.from("coupon_redemptions").insert({
        coupon_id: couponId,
        order_id: order.id,
        customer_id: customer?.id || customerSession.customer_id,
        discount_amount: discountAmount,
      });
      if (!redemptionError) await supabase.rpc("increment_coupon_usage", { coupon_id_input: couponId });
    }

    await supabase.from("customer_activities").insert({
      customer_id: customer?.id || customerSession.customer_id,
      activity_type: "checkout",
      sku: orderItems.map((item) => item.sku).filter(Boolean).join(", ") || null,
      metadata: {
        orderId: order.id,
        orderNumber: order.order_number,
        skus: orderItems.map((item) => item.sku).filter(Boolean),
      },
    });

    const emailResults = await sendOrderEmailsWithResults({
      ...order,
      ...{
        contact_email: contactEmail,
        contact_phone: contactPhone,
        ship_full_name: shipping.fullName,
        ship_address_line1: shipping.addressLine1,
        ship_address_line2: shipping.addressLine2 || null,
        ship_city: shipping.city,
        ship_state: shipping.state,
        ship_postal_code: shipping.postalCode,
        payment_method: paymentMethod,
        payment_status: paymentMethod === "razorpay" ? "paid" : "pending",
        total,
      },
    }, orderItems);

    await notifyCommerceSync({
      action: "order-created",
      tables: ["orders", "order_items", "customers", "product_variants", "inventory_movements", "coupon_redemptions"],
      orderId: order.id,
      orderNumber: order.order_number,
      customerId: customer.id,
      inventoryUpdates,
      emailResults,
    });

    return json({ order_id: order.id, order_number: order.order_number, emailResults });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Internal server error" }, 500);
  }
});
