// Rewrite the offline fallback catalog (public/products_export_1.csv) so its
// image URLs point at the recovered Supabase Storage assets instead of the
// disabled Cloudinary cloud. Driven by the live product_images table: for each
// product handle, the Cloudinary image rows are replaced, in order, with the
// Supabase URLs now stored in the DB. Handles with no Supabase asset (images
// that could not be recovered) are left untouched.

import { readFile, writeFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const CSV_FILE = "public/products_export_1.csv";
const APPLY = process.argv.includes("--apply");

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

function productHandle(product) {
  return Array.isArray(product) ? product[0]?.handle : product?.handle;
}

async function main() {
  const env = { ...parseEnv(await readFile(".env", "utf8")), ...process.env };
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const { data, error } = await supabase
    .from("product_images")
    .select("url, position, product:products(handle)")
    .order("position", { ascending: true });
  if (error) throw new Error(error.message);

  // handle -> ordered list of Supabase public URLs
  const byHandle = new Map();
  for (const row of data || []) {
    const handle = productHandle(row.product);
    if (!handle || !String(row.url).includes("/storage/v1/object/public/")) continue;
    if (!byHandle.has(handle)) byHandle.set(handle, []);
    byHandle.get(handle).push(row.url);
  }

  const csv = await readFile(CSV_FILE, "utf8");
  const lines = csv.split(/\r?\n/);
  const cursor = new Map(); // handle -> next index into its Supabase URL list
  let replaced = 0;
  let leftAlone = 0;

  const out = lines.map((line) => {
    const cloud = line.match(/(https:\/\/res\.cloudinary\.com\/[^,"]+)/);
    if (!cloud) return line;
    const handle = line.split(",")[0];
    const urls = byHandle.get(handle);
    const index = cursor.get(handle) || 0;
    if (!urls || index >= urls.length) {
      leftAlone += 1;
      return line;
    }
    cursor.set(handle, index + 1);
    replaced += 1;
    return line.replace(cloud[1], urls[index]);
  });

  console.log(`handles with Supabase assets: ${byHandle.size}`);
  console.log(`cloudinary image rows replaced: ${replaced} | left unchanged (unrecovered): ${leftAlone}`);

  if (!APPLY) {
    console.log("Dry-run only. Re-run with --apply to write the CSV.");
    return;
  }
  await writeFile(CSV_FILE, out.join("\n"), "utf8");
  console.log(`Wrote ${CSV_FILE}.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
