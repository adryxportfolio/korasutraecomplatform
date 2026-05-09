import { readFile } from "node:fs/promises";

function parseEnv(text) {
  const env = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index === -1) continue;
    env[line.slice(0, index).trim()] = line.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
  }
  return env;
}

const phone = String(process.argv[2] || "").replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
if (phone.length < 10) {
  console.error("Usage: node scripts/otp-delivery-smoke.mjs <10-digit-phone>");
  process.exit(1);
}

const env = parseEnv(await readFile(".env", "utf8"));
const base = env.SUPABASE_URL.replace(/\/$/, "");

const response = await fetch(`${base}/functions/v1/whatsapp-send-otp`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    phone,
    countryCode: "+91",
    name: "Kora Sutra OTP Test",
  }),
});

const data = await response.json().catch(() => ({}));
console.log(JSON.stringify({
  success: response.ok && data.success === true,
  status: response.status,
  destination: data.destination || `+91 ******${phone.slice(-4)}`,
  expiresInSeconds: data.expiresInSeconds || null,
  error: data.error || null,
  assertion: "Live WhatsApp OTP function accepted or rejected a real delivery request",
}, null, 2));

if (!response.ok || data.error) process.exit(1);
