import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";

const root = process.cwd();
const envFile = join(root, ".env");
const ignoredDirs = new Set([".git", "node_modules", ".vercel", "supabase/.temp"]);
const ignoredFiles = new Set([".env", ".env.local", ".env.production", ".env.development"]);
const privateKeys = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "RAZORPAY_KEY_SECRET",
  "RAZORPAY_WEBHOOK_SECRET",
  "RESEND_API_KEY",
  "WHATSAPP_OTP_API_KEY",
  "AISENSY_API_KEY",
  "OTP_HASH_SECRET",
  "ADMIN_PASSWORD_PEPPER",
  "SHOPIFY_ADMIN_ACCESS_TOKEN",
  "SHOPIFY_STOREFRONT_ACCESS_TOKEN",
  "CLOUDINARY_API_SECRET",
];

function parseEnv(content) {
  const values = new Map();
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [rawKey, ...rest] = trimmed.split("=");
    const key = rawKey.trim();
    let value = rest.join("=").trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (privateKeys.includes(key) && value.length >= 8) values.set(key, value);
  }
  return values;
}

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    const rel = relative(root, full).replaceAll("\\", "/");
    if (entry.isDirectory()) {
      if (!ignoredDirs.has(rel) && !ignoredDirs.has(entry.name)) yield* walk(full);
      continue;
    }
    if (!entry.isFile() || ignoredFiles.has(rel) || ignoredFiles.has(entry.name)) continue;
    const info = await stat(full);
    if (info.size > 5 * 1024 * 1024) continue;
    yield { full, rel };
  }
}

const envContent = await readFile(envFile, "utf8").catch(() => "");
const secretValues = parseEnv(envContent);
const findings = [];

for await (const file of walk(root)) {
  const content = await readFile(file.full, "utf8").catch(() => "");
  for (const [key, value] of secretValues.entries()) {
    if (content.includes(value)) findings.push({ key, file: file.rel });
  }
}

if (findings.length) {
  console.error("Private secret values found outside ignored env files:");
  for (const finding of findings) console.error(`- ${finding.key}: ${finding.file}`);
  process.exit(1);
}

console.log(`Security scan passed: ${secretValues.size} private env values were not found in source or build artifacts.`);
