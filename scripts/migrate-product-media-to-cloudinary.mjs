import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const CONCURRENCY = Number(process.env.CLOUDINARY_MIGRATION_CONCURRENCY || 4);

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

function required(env, key) {
  if (!env[key]) throw new Error(`${key} is required`);
  return env[key];
}

function sanitize(value) {
  return String(value || "media")
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function cloudinaryAuth(env) {
  return Buffer.from(`${required(env, "CLOUDINARY_API_KEY")}:${required(env, "CLOUDINARY_API_SECRET")}`).toString(
    "base64",
  );
}

async function uploadRemoteUrl(env, item, folder, resourceType = "auto") {
  const form = new FormData();
  form.append("file", item.url);
  form.append("folder", folder);
  form.append("public_id", `${sanitize(item.handle)}-${item.position ?? 0}-${item.id.slice(0, 8)}`);
  form.append("overwrite", "true");
  form.append("resource_type", resourceType);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${required(env, "CLOUDINARY_CLOUD_NAME")}/${resourceType}/upload`,
    {
      method: "POST",
      headers: { Authorization: `Basic ${cloudinaryAuth(env)}` },
      body: form,
    },
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.secure_url) {
    throw new Error(payload.error?.message || `Cloudinary upload failed: ${response.status}`);
  }

  return {
    url: payload.secure_url,
    publicId: payload.public_id,
  };
}

function productHandle(product) {
  if (Array.isArray(product)) return product[0]?.handle;
  return product?.handle;
}

async function loadImageRows(supabase) {
  const { data, error } = await supabase
    .from("product_images")
    .select("id, url, position, product:products(handle)")
    .not("url", "ilike", "%res.cloudinary.com%");
  if (error) throw new Error(`Image lookup failed: ${error.message}`);
  return (data || []).map((item) => ({ ...item, handle: productHandle(item.product), kind: "image" }));
}

async function loadVideoRows(supabase) {
  const { data, error } = await supabase
    .from("product_videos")
    .select("id, url, position, product:products(handle)")
    .not("url", "ilike", "%res.cloudinary.com%");
  if (error) throw new Error(`Video lookup failed: ${error.message}`);
  return (data || []).map((item) => ({ ...item, handle: productHandle(item.product), kind: "video" }));
}

async function eachLimit(items, limit, worker) {
  let index = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const item = items[index];
      index += 1;
      await worker(item);
    }
  });
  await Promise.all(runners);
}

async function main() {
  const env = { ...parseEnv(await readFile(".env", "utf8")), ...process.env };
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const serviceRoleKey = required(env, "SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl) throw new Error("SUPABASE_URL or VITE_SUPABASE_URL is required");

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const images = await loadImageRows(supabase);
  const videos = await loadVideoRows(supabase);
  const failures = [];
  let migratedImages = 0;
  let migratedVideos = 0;

  await eachLimit(images, CONCURRENCY, async (image) => {
    try {
      const uploaded = await uploadRemoteUrl(env, image, "korasutra/products/images", "auto");
      const { error } = await supabase.from("product_images").update({ url: uploaded.url }).eq("id", image.id);
      if (error) throw error;
      migratedImages += 1;
    } catch (error) {
      failures.push({ table: "product_images", id: image.id, error: error instanceof Error ? error.message : String(error) });
    }
  });

  await eachLimit(videos, Math.max(1, Math.min(CONCURRENCY, 2)), async (video) => {
    try {
      const uploaded = await uploadRemoteUrl(env, video, "korasutra/products/videos", "auto");
      const { error } = await supabase
        .from("product_videos")
        .update({ url: uploaded.url, storage_key: uploaded.publicId })
        .eq("id", video.id);
      if (error) throw error;
      migratedVideos += 1;
    } catch (error) {
      failures.push({ table: "product_videos", id: video.id, error: error instanceof Error ? error.message : String(error) });
    }
  });

  console.log(
    JSON.stringify(
      {
        scannedImages: images.length,
        migratedImages,
        scannedVideos: videos.length,
        migratedVideos,
        failed: failures,
      },
      null,
      2,
    ),
  );

  if (failures.length) process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
