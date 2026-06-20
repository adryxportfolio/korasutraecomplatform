// Recover product images from the original Shopify CDN export and re-host them
// in Supabase Storage, then rewrite product_images.url to the new public URLs.
//
// The previous host (Cloudinary cloud "dcobed5zm") was disabled at the account
// level, so every image 401s and the Cloudinary originals are unrecoverable.
// The catalog was originally imported from Shopify, and the seed export still
// maps every product (by handle + position) to a live cdn.shopify.com URL.
//
// Usage:
//   node scripts/migrate-images-to-supabase.mjs            # dry-run (no writes)
//   node scripts/migrate-images-to-supabase.mjs --apply    # download + upload + update

import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const APPLY = process.argv.includes("--apply");
const CONCURRENCY = Number(process.env.IMAGE_MIGRATION_CONCURRENCY || 4);
const BUCKET = "product-images";
const SEED_FILE = "supabase/seed-archive/20260502203000_seed_shopify_products_export.sql";

function parseEnv(text) {
  const env = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^([^=]+)=(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[match[1].trim()] = value;
  }
  return env;
}

function required(env, key) {
  if (!env[key]) throw new Error(`${key} is required`);
  return env[key];
}

// handle -> { [position]: shopifyUrl } built from the Shopify export seed.
async function buildSeedMap() {
  const sql = await readFile(SEED_FILE, "utf8");
  const map = new Map();
  const re =
    /insert into public\.product_images[^;]*?where handle = '([^']+)'\),\s*'([^']+)',\s*'(?:[^']|'')*',\s*(\d+)\)/g;
  let match;
  while ((match = re.exec(sql)) !== null) {
    const [, handle, url, position] = match;
    if (!map.has(handle)) map.set(handle, {});
    map.get(handle)[Number(position)] = url;
  }
  return map;
}

function productHandle(product) {
  if (Array.isArray(product)) return product[0]?.handle;
  return product?.handle;
}

function isSupabaseStorageUrl(url, supabaseUrl) {
  return typeof url === "string" && url.startsWith(`${supabaseUrl}/storage/v1/object/public/${BUCKET}/`);
}

function extensionFor(url) {
  const path = String(url).split("?")[0];
  const ext = (path.split(".").pop() || "jpg").toLowerCase();
  return ["jpg", "jpeg", "png", "webp", "gif"].includes(ext) ? ext : "jpg";
}

const CONTENT_TYPES = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

async function eachLimit(items, limit, worker) {
  let index = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) || 0 }, async () => {
    while (index < items.length) {
      const item = items[index];
      index += 1;
      await worker(item);
    }
  });
  await Promise.all(runners);
}

async function loadImageRows(supabase) {
  const { data, error } = await supabase
    .from("product_images")
    .select("id, url, position, product:products(handle)");
  if (error) throw new Error(`Image lookup failed: ${error.message}`);
  return (data || []).map((row) => ({ ...row, handle: productHandle(row.product) }));
}

async function rehost(supabase, supabaseUrl, row, sourceUrl) {
  const response = await fetch(sourceUrl, { redirect: "follow" });
  if (!response.ok) throw new Error(`source fetch ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const ext = extensionFor(sourceUrl);
  const path = `${row.handle}/${row.position}-${row.id.slice(0, 8)}.${ext}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType: CONTENT_TYPES[ext] || "image/jpeg",
    upsert: true,
  });
  if (uploadError) throw new Error(`upload: ${uploadError.message}`);

  const publicUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${path}`;
  const { error: updateError } = await supabase.from("product_images").update({ url: publicUrl }).eq("id", row.id);
  if (updateError) throw new Error(`db update: ${updateError.message}`);
  return publicUrl;
}

async function main() {
  const env = { ...parseEnv(await readFile(".env", "utf8")), ...process.env };
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const serviceRoleKey = required(env, "SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl) throw new Error("SUPABASE_URL or VITE_SUPABASE_URL is required");

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const seedMap = await buildSeedMap();
  const rows = await loadImageRows(supabase);

  const alreadyDone = [];
  const recoverable = [];
  const unmatched = [];

  for (const row of rows) {
    if (isSupabaseStorageUrl(row.url, supabaseUrl)) {
      alreadyDone.push(row);
      continue;
    }
    const source = seedMap.get(row.handle)?.[row.position];
    if (source) recoverable.push({ row, source });
    else unmatched.push(row);
  }

  console.log(
    `seed: ${seedMap.size} products / ${[...seedMap.values()].reduce((n, p) => n + Object.keys(p).length, 0)} images`,
  );
  console.log(
    `live: ${rows.length} images | alreadySupabase: ${alreadyDone.length} | recoverable: ${recoverable.length} | unmatched: ${unmatched.length}`,
  );

  const unmatchedByHandle = [...new Set(unmatched.map((r) => r.handle))].sort();
  if (unmatchedByHandle.length) {
    console.log(`\nUnmatched products (not in Shopify export — need manual re-upload):`);
    for (const handle of unmatchedByHandle) {
      const count = unmatched.filter((r) => r.handle === handle).length;
      console.log(`  - ${handle} (${count})`);
    }
  }

  if (!APPLY) {
    console.log(`\nDry-run only. Re-run with --apply to download from Shopify and re-host in Supabase.`);
    return;
  }

  let migrated = 0;
  const failures = [];
  await eachLimit(recoverable, CONCURRENCY, async ({ row, source }) => {
    try {
      await rehost(supabase, supabaseUrl, row, source);
      migrated += 1;
    } catch (error) {
      failures.push({ id: row.id, handle: row.handle, position: row.position, error: String(error.message || error) });
    }
  });

  console.log(`\nApplied: ${migrated}/${recoverable.length} re-hosted.`);
  if (failures.length) {
    console.log(`Failures (${failures.length}):`);
    console.log(JSON.stringify(failures, null, 2));
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
