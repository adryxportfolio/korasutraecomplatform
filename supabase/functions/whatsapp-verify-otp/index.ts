import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const SESSION_DURATION_MS = 180 * 24 * 60 * 60 * 1000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
}

function normalizeCountryCode(countryCode: string) {
  const digits = countryCode.replace(/\D/g, "") || "91";
  return `+${digits}`;
}

async function hashOtp(countryCode: string, phone: string, otp: string) {
  const secret = Deno.env.get("OTP_HASH_SECRET") || Deno.env.get("ADMIN_PASSWORD_PEPPER") || "";
  const data = new TextEncoder().encode(`${normalizeCountryCode(countryCode)}:${normalizePhone(phone)}:${otp}:${secret}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function generateToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function optionalText(value: unknown) {
  const text = String(value || "").trim();
  return text ? text : null;
}

async function notifyCommerceSync(payload: Record<string, unknown>) {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) return;

    const response = await fetch(`${supabaseUrl}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [{
          topic: "commerce-sync",
          event: "commerce-updated",
          payload: { ...payload, savedAt: new Date().toISOString() },
        }],
      }),
    });
    if (!response.ok) {
      console.error("Customer login realtime broadcast failed:", response.status, await response.text());
    }
  } catch (error) {
    console.error("Customer login realtime broadcast error:", error);
  }
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const verificationId = String(body.verificationId || "");
    const phone = normalizePhone(String(body.phone || ""));
    const countryCode = normalizeCountryCode(String(body.countryCode || "+91"));
    const otp = String(body.otp || "").replace(/\D/g, "");

    if (!verificationId || phone.length < 10 || otp.length !== 6) {
      return json({ error: "Enter the 6 digit OTP" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: verification, error: lookupError } = await supabase
      .from("otp_verifications")
      .select("id, otp_hash, attempts, expires_at, verified")
      .eq("id", verificationId)
      .eq("country_code", countryCode)
      .eq("phone", phone)
      .single();

    if (lookupError || !verification) return json({ error: "OTP verification not found" }, 404);
    if (verification.verified) return json({ error: "OTP is already used" }, 409);
    if (new Date(verification.expires_at) < new Date()) return json({ error: "OTP has expired" }, 410);
    if (Number(verification.attempts || 0) >= 5) return json({ error: "Too many OTP attempts" }, 429);

    const otpHash = await hashOtp(countryCode, phone, otp);
    if (otpHash !== verification.otp_hash) {
      await supabase
        .from("otp_verifications")
        .update({ attempts: Number(verification.attempts || 0) + 1 })
        .eq("id", verification.id);
      return json({ error: "Invalid OTP" }, 401);
    }

    const name = optionalText(body.name);
    const email = optionalText(body.email);
    const timestamp = new Date().toISOString();

    const { data: exactCustomer, error: exactCustomerError } = await supabase
      .from("customers")
      .select("id, phone, country_code, name, email")
      .eq("country_code", countryCode)
      .eq("phone", phone)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (exactCustomerError) return json({ error: "Unable to verify customer" }, 500);

    const { data: legacyCustomer, error: legacyCustomerError } = exactCustomer
      ? { data: null, error: null }
      : await supabase
        .from("customers")
        .select("id, phone, country_code, name, email")
        .eq("phone", phone)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (legacyCustomerError) return json({ error: "Unable to verify customer" }, 500);

    const existingCustomer = exactCustomer || legacyCustomer;
    const customerPayload = {
      country_code: countryCode,
      is_verified: true,
      updated_at: timestamp,
      ...(name ? { name } : {}),
      ...(email ? { email } : {}),
    };

    const { data: customer, error: customerError } = existingCustomer
      ? await supabase
        .from("customers")
        .update(customerPayload)
        .eq("id", existingCustomer.id)
        .select("id, phone, country_code, name, email")
        .single()
      : await supabase
        .from("customers")
        .insert({
          phone,
          country_code: countryCode,
          name,
          email,
          is_verified: true,
          updated_at: timestamp,
        })
        .select("id, phone, country_code, name, email")
        .single();

    if (customerError || !customer) return json({ error: "Unable to verify customer" }, 500);

    const token = generateToken();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();
    const { error: sessionError } = await supabase
      .from("customer_sessions")
      .insert({ customer_id: customer.id, token, expires_at: expiresAt });

    if (sessionError) return json({ error: "Unable to create customer session" }, 500);

    await supabase
      .from("otp_verifications")
      .update({ verified: true, attempts: Number(verification.attempts || 0) + 1 })
      .eq("id", verification.id);

    await supabase.from("customer_activities").insert({
      customer_id: customer.id,
      activity_type: "just_visit",
      metadata: { source: "whatsapp-login" },
    });

    await notifyCommerceSync({
      action: "customer-login",
      tables: ["customers", "customer_activities"],
      customerId: customer.id,
    });

    return json({
      success: true,
      verified: true,
      token,
      expiresAt,
      customer,
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Internal server error" }, 500);
  }
});
