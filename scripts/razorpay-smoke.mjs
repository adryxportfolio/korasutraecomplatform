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
const auth = btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);
const response = await fetch("https://api.razorpay.com/v1/orders", {
  method: "POST",
  headers: {
    Authorization: `Basic ${auth}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    amount: 100,
    currency: env.RAZORPAY_CURRENCY || "INR",
    receipt: `ks_smoke_${Date.now()}`.slice(0, 40),
  }),
});

const data = await response.json().catch(() => ({}));
console.log(JSON.stringify({
  success: response.ok,
  status: response.status,
  orderIdPrefix: data.id ? data.id.slice(0, 10) : null,
  amount: data.amount || null,
  currency: data.currency || null,
  orderStatus: data.status || null,
  error: data.error?.description || null,
}, null, 2));
