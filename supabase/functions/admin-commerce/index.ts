/* eslint-disable @typescript-eslint/no-explicit-any */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-token",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function validateAdminToken(supabase: any, token: string | null) {
  if (!token) return null;
  const { data } = await supabase
    .from("admin_sessions")
    .select("admin_id, expires_at, admin:admin_users(username)")
    .eq("token", token)
    .single();
  if (!data || new Date(data.expires_at) < new Date()) return null;
  return data;
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

async function sendOrderUpdateEmail(order: any) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("RESEND_FROM_EMAIL") || "Kora Sutra <orders@korasutra.com>";
  if (!apiKey) return { sent: false, reason: "RESEND_API_KEY is not configured" };
  if (!order?.contact_email) return { sent: false, reason: "Customer email is missing" };

  const trackingHtml = order.tracking_number || order.tracking_url || order.carrier
    ? `
      <p><strong>Carrier:</strong> ${order.carrier || "-"}</p>
      <p><strong>Tracking number:</strong> ${order.tracking_number || "-"}</p>
      ${order.tracking_url ? `<p><a href="${order.tracking_url}">Track shipment</a></p>` : ""}
    `
    : "";

  const itemsHtml = (order.order_items || [])
    .map((item: any) => `<li>${item.quantity}x ${item.product_title} - INR ${item.line_total}</li>`)
    .join("");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [order.contact_email],
      subject: `Order ${order.order_number} update - Korasutra`,
      html: `
        <h2>Your Kora Sutra order was updated</h2>
        <p>Order <strong>${order.order_number}</strong> is now <strong>${String(order.status || "").replace("_", " ")}</strong>.</p>
        <p>Payment status: <strong>${String(order.payment_status || "").replace("_", " ")}</strong></p>
        ${trackingHtml}
        <p>Track your order: <a href="https://korasutra.com/order-tracking/${order.order_number}">https://korasutra.com/order-tracking/${order.order_number}</a></p>
        ${itemsHtml ? `<ul>${itemsHtml}</ul>` : ""}
      `,
    }),
  });

  if (!response.ok) {
    const reason = `Resend ${response.status}: ${await response.text()}`;
    console.error(`Order update email failed for ${order.order_number}:`, reason);
    return { sent: false, reason };
  }
  return { sent: true, reason: "" };
}

async function saveProduct(supabase: any, product: any) {
  const { data: category } = await supabase.from("categories").select("id").eq("slug", product.categorySlug || "sarees").single();
  const payload = {
    handle: product.handle,
    title: product.title,
    description: product.description || null,
    short_description: product.shortDescription || null,
    category_id: category?.id || null,
    fabric: product.fabric || null,
    technique: product.technique || null,
    color: product.color || null,
    has_blouse_piece: Boolean(product.hasBlousePiece),
    price: Number(product.price || 0),
    compare_at_price: product.compareAtPrice ? Number(product.compareAtPrice) : null,
    status: product.status || "draft",
    seo_title: product.seoTitle || null,
    seo_description: product.seoDescription || null,
    tags: product.tags || [],
  };
  if (!payload.handle || !payload.title || !payload.price) throw new Error("Title, handle, and price are required");

  const { data: saved, error } = await supabase
    .from("products")
    .upsert(payload, { onConflict: "handle" })
    .select("id")
    .single();
  if (error || !saved) throw new Error("Unable to save product");

  if (Array.isArray(product.images)) {
    await supabase.from("product_images").delete().eq("product_id", saved.id);
    const images = product.images
      .filter((image: any) => image?.url)
      .slice(0, 5)
      .map((image: any, index: number) => ({
        product_id: saved.id,
        url: image.url,
        alt_text: image.altText || product.title,
        position: index,
      }));
    if (images.length) await supabase.from("product_images").insert(images);
  }

  if (Array.isArray(product.videos)) {
    await supabase.from("product_videos").delete().eq("product_id", saved.id);
    const videos = product.videos
      .filter((video: any) => video?.url)
      .slice(0, 4)
      .map((video: any, index: number) => ({
        product_id: saved.id,
        url: video.url,
        alt_text: video.altText || product.title,
        position: index,
        content_type: video.contentType || null,
        storage_key: video.storageKey || null,
      }));
    if (videos.length) await supabase.from("product_videos").insert(videos);
  }

  const variants = Array.isArray(product.variants)
    ? product.variants
    : product.variant
      ? [product.variant]
      : [];

  if (variants.length) {
    await supabase.from("product_variants").delete().eq("product_id", saved.id);
  }

  for (const variant of variants) {
    const sku = variant.sku || `${product.handle}-${variant.title || "default"}`.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    await supabase.from("product_variants").upsert({
      product_id: saved.id,
      sku,
      title: variant.title || "Default",
      option1_name: variant.option1Name || null,
      option1_value: variant.option1Value || null,
      option2_name: variant.option2Name || null,
      option2_value: variant.option2Value || null,
      price: variant.price ? Number(variant.price) : null,
      compare_at_price: variant.compareAtPrice ? Number(variant.compareAtPrice) : null,
      inventory_qty: Number(variant.inventoryQty || 0),
      track_inventory: variant.trackInventory !== false,
      position: Number(variant.position || 0),
    }, { onConflict: "sku" });
  }

  return saved.id;
}

function optionalText(value: unknown) {
  const text = String(value || "").trim();
  return text ? text : null;
}

function normalizeCouponCode(code: string) {
  return code.trim().replace(/\s+/g, "").toUpperCase();
}

async function saveCoupon(supabase: any, coupon: any) {
  const code = normalizeCouponCode(String(coupon.code || ""));
  if (!/^[A-Z0-9][A-Z0-9_-]{2,39}$/.test(code)) throw new Error("Coupon code must be 3-40 letters, numbers, dashes, or underscores");

  const discountType = coupon.discountType || "percentage";
  const discountValue = Number(coupon.discountValue || 0);
  if (["percentage", "fixed_amount"].includes(discountType) && discountValue <= 0) throw new Error("Discount value must be greater than zero");
  if (discountType === "percentage" && discountValue > 100) throw new Error("Percentage discount cannot exceed 100%");
  if (discountType === "buy_x_get_y" && (Number(coupon.buyQuantity || 0) < 1 || Number(coupon.getQuantity || 0) < 1)) {
    throw new Error("Buy X Get Y coupons need buy and get quantities");
  }

  const payload = {
    code,
    description: coupon.description || null,
    status: coupon.status === "inactive" ? "inactive" : "active",
    discount_type: discountType,
    discount_value: discountType === "free_shipping" || discountType === "buy_x_get_y" ? 0 : discountValue,
    min_order_value: coupon.minOrderValue ? Number(coupon.minOrderValue) : null,
    max_discount_cap: coupon.maxDiscountCap ? Number(coupon.maxDiscountCap) : null,
    usage_limit_total: coupon.usageLimitTotal ? Number(coupon.usageLimitTotal) : null,
    usage_limit_per_customer: coupon.usageLimitPerCustomer ? Number(coupon.usageLimitPerCustomer) : null,
    first_order_only: Boolean(coupon.firstOrderOnly),
    start_at: coupon.startAt || null,
    end_at: coupon.neverExpires ? null : coupon.endAt || null,
    never_expires: Boolean(coupon.neverExpires),
    applies_to: coupon.appliesTo || "all",
    included_product_ids: Array.isArray(coupon.includedProductIds) ? coupon.includedProductIds : [],
    included_category_slugs: Array.isArray(coupon.includedCategorySlugs) ? coupon.includedCategorySlugs : [],
    included_tags: Array.isArray(coupon.includedTags) ? coupon.includedTags : [],
    excluded_product_ids: Array.isArray(coupon.excludedProductIds) ? coupon.excludedProductIds : [],
    excluded_category_slugs: Array.isArray(coupon.excludedCategorySlugs) ? coupon.excludedCategorySlugs : [],
    exclude_sale_items: Boolean(coupon.excludeSaleItems),
    can_combine_with_coupons: Boolean(coupon.canCombineWithCoupons),
    can_combine_with_sale_prices: coupon.canCombineWithSalePrices !== false,
    auto_apply: Boolean(coupon.autoApply),
    display_on_website: Boolean(coupon.displayOnWebsite),
    priority: Number(coupon.priority || 0),
    buy_quantity: coupon.buyQuantity ? Number(coupon.buyQuantity) : null,
    get_quantity: coupon.getQuantity ? Number(coupon.getQuantity) : null,
  };

  const query = coupon.id
    ? supabase.from("coupons").update(payload).eq("id", coupon.id)
    : supabase.from("coupons").upsert(payload, { onConflict: "code" });
  const { data: saved, error } = await query.select("id").single();
  if (error || !saved) throw new Error("Unable to save coupon");
  return saved.id;
}

async function saveSiteSettings(supabase: any, settings: any) {
  const payload = {
    id: "global",
    hero: settings.hero || {},
    navbar: settings.navbar || {},
    promo_popup: settings.promoPopup || settings.promo_popup || {},
  };

  const { data, error } = await supabase
    .from("site_settings")
    .upsert(payload, { onConflict: "id" })
    .select("hero, navbar, promo_popup")
    .single();
  if (error || !data) throw new Error("Unable to save website content");
  return data;
}

async function saveJournal(supabase: any, journal: any) {
  const slug = String(journal.slug || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const title = String(journal.title || "").trim();
  if (!slug || !title) throw new Error("Journal title and slug are required");

  const status = journal.status === "published" ? "published" : "draft";
  const payload = {
    slug,
    title,
    excerpt: String(journal.excerpt || "").trim(),
    content: String(journal.content || "").trim(),
    image_url: optionalText(journal.imageUrl || journal.image_url),
    category: String(journal.category || "Journal").trim() || "Journal",
    author: String(journal.author || "Kora Sutra").trim() || "Kora Sutra",
    read_time: String(journal.readTime || journal.read_time || "3 min read").trim() || "3 min read",
    keywords: Array.isArray(journal.keywords) ? journal.keywords : [],
    seo_title: optionalText(journal.seoTitle || journal.seo_title),
    seo_description: optionalText(journal.seoDescription || journal.seo_description),
    status,
    published_at: status === "published"
      ? journal.publishedAt || journal.published_at || new Date().toISOString()
      : null,
  };

  const query = journal.id
    ? supabase.from("journal_articles").update(payload).eq("id", journal.id)
    : supabase.from("journal_articles").upsert(payload, { onConflict: "slug" });
  const { data, error } = await query.select("id").single();
  if (error || !data) throw new Error("Unable to save journal");
  return data.id;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const session = await validateAdminToken(supabase, req.headers.get("x-admin-token"));
  if (!session) return json({ error: "Unauthorized" }, 401);

  try {
    if (req.method === "POST") {
      const body = await req.json();

      if (body.action === "change-password") {
        const currentPassword = String(body.currentPassword || "");
        const newPassword = String(body.newPassword || "");
        if (newPassword.length < 12) return json({ error: "New password must be at least 12 characters" }, 400);

        const currentHash = await hashPassword(currentPassword);
        const { data: admin } = await supabase
          .from("admin_users")
          .select("id, password_hash")
          .eq("id", session.admin_id)
          .single();

        if (!admin || admin.password_hash !== currentHash) {
          return json({ error: "Current password is incorrect" }, 401);
        }

        const newHash = await hashPassword(newPassword);
        const { error } = await supabase
          .from("admin_users")
          .update({ password_hash: newHash })
          .eq("id", session.admin_id);
        if (error) return json({ error: "Unable to change password" }, 500);

        await supabase.from("admin_sessions").delete().eq("admin_id", session.admin_id).neq("token", req.headers.get("x-admin-token"));
        return json({ success: true });
      }

      if (body.action === "update-order") {
        const updates: Record<string, unknown> = {
          status: body.status,
          payment_status: body.paymentStatus,
          tracking_number: body.trackingNumber || null,
          tracking_url: body.trackingUrl || null,
          carrier: body.carrier || null,
          notes: body.notes || null,
        };
        if (body.status === "shipped") updates.shipped_at = new Date().toISOString();
        if (body.status === "delivered") updates.delivered_at = new Date().toISOString();
        if (body.status === "cancelled") updates.cancelled_at = new Date().toISOString();

        const { error } = await supabase.from("orders").update(updates).eq("id", body.orderId);
        if (error) return json({ error: "Unable to update order" }, 500);

        const { data: updatedOrder } = await supabase
          .from("orders")
          .select("*, order_items(*)")
          .eq("id", body.orderId)
          .single();
        const emailResult = updatedOrder ? await sendOrderUpdateEmail(updatedOrder) : { sent: false, reason: "Updated order could not be loaded" };
        await notifyCommerceSync({
          action: "order-updated",
          table: "orders",
          orderId: body.orderId,
          orderNumber: updatedOrder?.order_number,
          customerId: updatedOrder?.customer_id,
        });
        return json({ success: true, emailSent: emailResult.sent, emailReason: emailResult.reason });
      }

      if (body.action === "adjust-inventory") {
        const delta = Number(body.delta);
        if (!body.variantId || !Number.isFinite(delta) || delta === 0) return json({ error: "Invalid inventory adjustment" }, 400);

        const { data: variant } = await supabase
          .from("product_variants")
          .select("inventory_qty")
          .eq("id", body.variantId)
          .single();
        if (!variant) return json({ error: "Variant not found" }, 404);

        const nextQty = Math.max(0, Number(variant.inventory_qty) + delta);
        const { error } = await supabase.from("product_variants").update({ inventory_qty: nextQty }).eq("id", body.variantId);
        if (error) return json({ error: "Unable to adjust inventory" }, 500);
        await supabase.from("inventory_movements").insert({
          variant_id: body.variantId,
          delta,
          reason: body.reason || "adjustment",
          reference: body.reference || "admin",
        });
        await notifyCommerceSync({ action: "inventory-updated", tables: ["product_variants", "inventory_movements"], variantId: body.variantId });
        return json({ success: true, inventoryQty: nextQty });
      }

      if (body.action === "upsert-product") {
        const productId = await saveProduct(supabase, body.product || {});
        await notifyCommerceSync({ action: "product-updated", table: "products", productId });
        return json({ success: true, productId });
      }

      if (body.action === "bulk-import-products") {
        const products = Array.isArray(body.products) ? body.products : [];
        if (!products.length) return json({ error: "No products supplied" }, 400);

        let imported = 0;
        const failed: Array<{ handle: string; error: string }> = [];
        for (const product of products) {
          try {
            await saveProduct(supabase, product);
            imported += 1;
          } catch (error) {
            failed.push({
              handle: product.handle || "unknown",
              error: error instanceof Error ? error.message : "Import failed",
            });
          }
        }

        await notifyCommerceSync({ action: "products-imported", tables: ["products", "product_images", "product_videos", "product_variants"] });
        return json({ success: failed.length === 0, imported, failed });
      }

      if (body.action === "upsert-coupon") {
        const couponId = await saveCoupon(supabase, body.coupon || {});
        await notifyCommerceSync({ action: "coupon-updated", table: "coupons", couponId });
        return json({ success: true, couponId });
      }

      if (body.action === "delete-coupon") {
        const { error } = await supabase.from("coupons").delete().eq("id", body.couponId);
        if (error) return json({ error: "Unable to delete coupon" }, 500);
        await notifyCommerceSync({ action: "coupon-deleted", table: "coupons", couponId: body.couponId });
        return json({ success: true });
      }

      if (body.action === "upsert-site-settings") {
        const siteSettings = await saveSiteSettings(supabase, body.settings || {});
        await notifyCommerceSync({ action: "site-settings-updated", table: "site_settings" });
        return json({ success: true, siteSettings });
      }

      if (body.action === "upsert-journal") {
        const journalId = await saveJournal(supabase, body.journal || {});
        await notifyCommerceSync({ action: "journal-updated", table: "journal_articles", journalId });
        return json({ success: true, journalId });
      }

      if (body.action === "delete-journal") {
        const { error } = await supabase.from("journal_articles").delete().eq("id", body.journalId);
        if (error) return json({ error: "Unable to delete journal" }, 500);
        await notifyCommerceSync({ action: "journal-deleted", table: "journal_articles", journalId: body.journalId });
        return json({ success: true });
      }

      return json({ error: "Unknown action" }, 400);
    }

    const [ordersRes, productsRes, customersRes, activitiesRes, inventoryRes, categoriesRes, couponsRes, journalsRes, siteSettingsRes] = await Promise.all([
      supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }).limit(100),
      supabase.from("products").select("*, category:categories(slug, name), product_images(*), product_videos(*), product_variants(*)").order("updated_at", { ascending: false }).limit(200),
      supabase.from("customers").select("id, phone, country_code, name, email, is_verified, created_at, updated_at").order("updated_at", { ascending: false }).limit(200),
      supabase.from("customer_activities").select("*").order("created_at", { ascending: false }).limit(1000),
      supabase.from("product_variants").select("*, product:products(title, handle)").order("updated_at", { ascending: false }).limit(300),
      supabase.from("categories").select("*").order("sort_order", { ascending: true }),
      supabase.from("coupons").select("*, coupon_redemptions(id, discount_amount, created_at)").order("priority", { ascending: false }).order("created_at", { ascending: false }).limit(200),
      supabase.from("journal_articles").select("*").order("published_at", { ascending: false }).order("created_at", { ascending: false }).limit(200),
      supabase.from("site_settings").select("hero, navbar, promo_popup").eq("id", "global").maybeSingle(),
    ]);

    if (ordersRes.error || productsRes.error || customersRes.error || activitiesRes.error || inventoryRes.error || categoriesRes.error || couponsRes.error || journalsRes.error || siteSettingsRes.error) {
      return json({ error: "Unable to fetch admin data" }, 500);
    }

    return json({
      admin: { username: session.admin?.username || "Admin" },
      orders: ordersRes.data || [],
      products: productsRes.data || [],
      customers: customersRes.data || [],
      customerActivities: activitiesRes.data || [],
      inventory: inventoryRes.data || [],
      categories: categoriesRes.data || [],
      coupons: couponsRes.data || [],
      journals: journalsRes.data || [],
      siteSettings: siteSettingsRes.data || null,
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Internal server error" }, 500);
  }
});
