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
const base = env.SUPABASE_URL.replace(/\/$/, "");

async function post(functionName, body) {
  const response = await fetch(`${base}/functions/v1/${functionName}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  return { status: response.status, ok: response.ok, error: data.error || null };
}

const sendInvalid = await post("whatsapp-send-otp", { phone: "123", countryCode: "+91" });
const verifyInvalid = await post("whatsapp-verify-otp", { verificationId: "00000000-0000-0000-0000-000000000000", phone: "9999999999", countryCode: "+91", otp: "123456" });

console.log(JSON.stringify({ sendInvalid, verifyInvalid }, null, 2));
