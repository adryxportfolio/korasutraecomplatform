import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { parseShopifyProductsCsv } from "../src/lib/shopifyCsv.ts";

const DEFAULT_ADMIN_USERNAME = "korasutra.official@gmail.com";
const LEGACY_ADMIN_USERNAME = "korasutra_admin";
const DEFAULT_ADMIN_PASSWORD_HASH = "9d3bfeceeeab8f06130d094b83f2bd5f574dc495ab1c6927ad5f77ed8d0d3061";
const DEFAULT_CSV_PATH = "C:\\Users\\Admin\\Downloads\\products_export_1.csv";
const PLACEHOLDER_PASSWORDS = new Set([
  "replace_before_production",
  "change_me",
  "changeme",
  "password",
]);

function parseEnv(text) {
  const env = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^([^=]+)=(.*)$/);
    if (!match) continue;
    const key = match[1].trim();
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function hashPassword(password) {
  return createHash("sha256").update(password).digest("hex");
}

async function loadEnv() {
  const fileEnv = parseEnv(await readFile(".env", "utf8"));
  return { ...fileEnv, ...process.env };
}

async function ensureAdmin(supabase, env) {
  const username = (env.ADMIN_DEFAULT_USERNAME || DEFAULT_ADMIN_USERNAME).trim().toLowerCase();
  const configuredPassword = env.ADMIN_DEFAULT_PASSWORD?.trim();
  const passwordHash = configuredPassword && !PLACEHOLDER_PASSWORDS.has(configuredPassword.toLowerCase())
    ? hashPassword(configuredPassword)
    : DEFAULT_ADMIN_PASSWORD_HASH;

  const { data: existingAdmins, error: selectError } = await supabase
    .from("admin_users")
    .select("id, username")
    .in("username", [username, LEGACY_ADMIN_USERNAME]);

  if (selectError) throw new Error(`Admin lookup failed: ${selectError.message}`);

  const admins = existingAdmins || [];
  const defaultAdmin = admins.find((admin) => admin.username === username);
  const legacyAdmins = admins.filter((admin) => admin.username === LEGACY_ADMIN_USERNAME);

  if (defaultAdmin) {
    const { error: updateError } = await supabase
      .from("admin_users")
      .update({ password_hash: passwordHash })
      .eq("id", defaultAdmin.id);
    if (updateError) throw new Error(`Admin password update failed: ${updateError.message}`);

    for (const legacyAdmin of legacyAdmins) {
      await supabase.from("admin_sessions").delete().eq("admin_id", legacyAdmin.id);
      await supabase.from("admin_users").delete().eq("id", legacyAdmin.id);
    }

    return { username, repairedFromLegacy: false };
  }

  if (legacyAdmins[0]) {
    const { error: repairError } = await supabase
      .from("admin_users")
      .update({ username, password_hash: passwordHash })
      .eq("id", legacyAdmins[0].id);
    if (repairError) throw new Error(`Legacy admin repair failed: ${repairError.message}`);
    return { username, repairedFromLegacy: true };
  }

  const { error: insertError } = await supabase
    .from("admin_users")
    .insert({ username, password_hash: passwordHash });
  if (insertError) throw new Error(`Admin insert failed: ${insertError.message}`);

  return { username, repairedFromLegacy: false };
}

async function getCategoryMap(supabase) {
  const defaults = [
    { slug: "sarees", name: "Sarees", sort_order: 1 },
    { slug: "blouses", name: "Blouses", sort_order: 2 },
  ];
  const { error: categoryError } = await supabase.from("categories").upsert(defaults, { onConflict: "slug" });
  if (categoryError) throw new Error(`Category upsert failed: ${categoryError.message}`);

  const { data, error } = await supabase.from("categories").select("id, slug");
  if (error) throw new Error(`Category lookup failed: ${error.message}`);
  return new Map((data || []).map((category) => [category.slug, category.id]));
}

async function saveProduct(supabase, categoryMap, product) {
  const payload = {
    handle: product.handle,
    title: product.title,
    description: product.description || null,
    short_description: product.shortDescription || null,
    category_id: categoryMap.get(product.categorySlug || "sarees") || null,
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

  if (!payload.handle || !payload.title || !payload.price) {
    throw new Error("Title, handle, and price are required");
  }

  const { data: saved, error } = await supabase
    .from("products")
    .upsert(payload, { onConflict: "handle" })
    .select("id")
    .single();
  if (error || !saved) throw new Error(error?.message || "Unable to save product");

  const { error: deleteImagesError } = await supabase.from("product_images").delete().eq("product_id", saved.id);
  if (deleteImagesError) throw new Error(`Image cleanup failed: ${deleteImagesError.message}`);

  const images = (product.images || [])
    .filter((image) => image?.url)
    .slice(0, 5)
    .map((image, index) => ({
      product_id: saved.id,
      url: image.url,
      alt_text: image.altText || product.title,
      position: index,
    }));

  if (images.length) {
    const { error: imagesError } = await supabase.from("product_images").insert(images);
    if (imagesError) throw new Error(`Image insert failed: ${imagesError.message}`);
  }

  for (const [index, variant] of (product.variants || []).entries()) {
    const sku = (variant.sku || `KS-${product.handle}-${index + 1}`)
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const { error: variantError } = await supabase.from("product_variants").upsert({
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
      position: Number(variant.position || index),
    }, { onConflict: "sku" });

    if (variantError) throw new Error(`Variant upsert failed: ${variantError.message}`);
  }

  return saved.id;
}

async function syncProducts(supabase, csvPath) {
  const csvText = await readFile(csvPath, "utf8");
  const products = parseShopifyProductsCsv(csvText);
  const categoryMap = await getCategoryMap(supabase);
  const failed = [];

  for (const product of products) {
    try {
      await saveProduct(supabase, categoryMap, product);
    } catch (error) {
      failed.push({
        handle: product.handle || "unknown",
        error: error instanceof Error ? error.message : "Import failed",
      });
    }
  }

  const handles = products.map((product) => product.handle);
  const { data: matchedProducts, error: verifyError } = await supabase
    .from("products")
    .select("handle")
    .in("handle", handles);
  if (verifyError) throw new Error(`Product verification failed: ${verifyError.message}`);

  const matchedHandles = new Set((matchedProducts || []).map((product) => product.handle));
  const missing = handles.filter((handle) => !matchedHandles.has(handle));

  return {
    csvProducts: products.length,
    imported: products.length - failed.length,
    failed,
    verifiedInDatabase: matchedHandles.size,
    missing,
  };
}

async function main() {
  const env = await loadEnv();
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const csvPath = process.argv[2] || DEFAULT_CSV_PATH;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const admin = await ensureAdmin(supabase, env);
  const products = await syncProducts(supabase, csvPath);

  console.log(JSON.stringify({ admin, products }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
