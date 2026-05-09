import { readFile } from "node:fs/promises";

function parseEnv(text) {
  const env = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^([^=]+)=(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    env[match[1].trim()] = value;
  }
  return env;
}

const env = parseEnv(await readFile(".env", "utf8"));
const required = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"];
const missing = required.filter((key) => !env[key]);

if (missing.length) {
  console.log(JSON.stringify({
    success: false,
    missing,
    assertion: "Cloudinary upload credentials are present before production deployment",
  }, null, 2));
  process.exit(1);
}

const bytes = Uint8Array.from(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=", "base64"));
const form = new FormData();
form.set("file", new Blob([bytes], { type: "image/png" }), "korasutra-cloudinary-smoke.png");
form.set("folder", "korasutra/setup-check");
form.set("public_id", `edge-upload-smoke-${Date.now()}`);
form.set("tags", "korasutra,setup-check,edge-smoke");
form.set("overwrite", "false");

const response = await fetch(`https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/auto/upload`, {
  method: "POST",
  headers: {
    authorization: `Basic ${Buffer.from(`${env.CLOUDINARY_API_KEY}:${env.CLOUDINARY_API_SECRET}`).toString("base64")}`,
  },
  body: form,
});

const data = await response.json().catch(() => ({}));
const success = response.ok && Boolean(data.secure_url) && data.resource_type === "image";

console.log(JSON.stringify({
  success,
  status: response.status,
  resourceType: data.resource_type || null,
  publicId: data.public_id || null,
  secureUrlHost: data.secure_url ? new URL(data.secure_url).host : null,
  error: data.error?.message || null,
  assertion: "Cloudinary authenticated upload accepts product media",
}, null, 2));

if (!success) process.exit(1);
