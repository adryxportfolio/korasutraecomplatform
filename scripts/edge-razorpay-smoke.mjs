import { readFile } from "node:fs/promises";

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

const env = parseEnv(await readFile(".env", "utf8"));
const endpoint = `${env.SUPABASE_URL.replace(/\/$/, "")}/functions/v1/razorpay-create-order`;
const response = await fetch(endpoint, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    amount: 1,
    receipt: `ks_edge_smoke_${Date.now()}`.slice(0, 40),
  }),
});

const data = await response.json().catch(() => ({}));
console.log(JSON.stringify({
  success: response.status === 401 && !data.order_id,
  status: response.status,
  orderIdPrefix: data.order_id ? data.order_id.slice(0, 10) : null,
  amount: data.amount || null,
  currency: data.currency || null,
  error: data.error || null,
  assertion: "unauthenticated Razorpay order creation is blocked",
}, null, 2));
