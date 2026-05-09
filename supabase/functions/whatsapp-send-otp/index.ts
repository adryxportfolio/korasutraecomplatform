import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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

function destination(countryCode: string, phone: string) {
  return `${normalizeCountryCode(countryCode)}${normalizePhone(phone)}`;
}

function generateOtp() {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return String(100000 + (bytes[0] % 900000));
}

async function hashOtp(countryCode: string, phone: string, otp: string) {
  const secret = Deno.env.get("OTP_HASH_SECRET") || Deno.env.get("ADMIN_PASSWORD_PEPPER") || "";
  const data = new TextEncoder().encode(`${normalizeCountryCode(countryCode)}:${normalizePhone(phone)}:${otp}:${secret}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const phone = normalizePhone(String(body.phone || ""));
    const countryCode = normalizeCountryCode(String(body.countryCode || "+91"));
    const userName = String(body.name || "Kora Sutra Customer").trim() || "Kora Sutra Customer";

    if (phone.length < 10) return json({ error: "Enter a valid mobile number" }, 400);

    const apiKey = Deno.env.get("WHATSAPP_OTP_API_KEY") || Deno.env.get("AISENSY_API_KEY");
    const campaignName = Deno.env.get("WHATSAPP_OTP_CAMPAIGN_NAME") || Deno.env.get("AISENSY_CAMPAIGN_NAME") || "Authforkora";
    const endpoint = Deno.env.get("WHATSAPP_OTP_BASE_URL") || Deno.env.get("AISENSY_BASE_URL") || "https://backend.aisensy.com/campaign/t1/api/v2";
    const source = Deno.env.get("WHATSAPP_OTP_SOURCE") || Deno.env.get("AISENSY_SOURCE") || "Kora Sutra Checkout";
    if (!apiKey) return json({ error: "WhatsApp OTP service is not configured" }, 500);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: recentVerification } = await supabase
      .from("otp_verifications")
      .select("created_at")
      .eq("country_code", countryCode)
      .eq("phone", phone)
      .eq("verified", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentVerification?.created_at && Date.now() - new Date(recentVerification.created_at).getTime() < 60_000) {
      return json({ error: "Please wait a minute before requesting another OTP" }, 429);
    }

    const otp = generateOtp();
    const otpHash = await hashOtp(countryCode, phone, otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await supabase
      .from("otp_verifications")
      .delete()
      .eq("country_code", countryCode)
      .eq("phone", phone)
      .eq("verified", false);

    const { data: verification, error: insertError } = await supabase
      .from("otp_verifications")
      .insert({
        country_code: countryCode,
        phone,
        otp_hash: otpHash,
        expires_at: expiresAt,
      })
      .select("id")
      .single();

    if (insertError || !verification) return json({ error: "Unable to start OTP verification" }, 500);

    const whatsappResponse = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey,
        campaignName,
        destination: destination(countryCode, phone),
        userName,
        source,
        templateParams: [otp],
        buttons: [
          {
            type: "button",
            sub_type: "url",
            index: "0",
            parameters: [
              {
                type: "text",
                text: otp,
              },
            ],
          },
        ],
        tags: ["checkout_auth"],
        attributes: {
          phone,
          country_code: countryCode,
        },
      }),
    });

    if (!whatsappResponse.ok) {
      await supabase.from("otp_verifications").delete().eq("id", verification.id);
      return json({ error: "Unable to send WhatsApp OTP" }, 502);
    }

    return json({
      success: true,
      verificationId: verification.id,
      expiresInSeconds: 600,
      destination: `${countryCode} ******${phone.slice(-4)}`,
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Internal server error" }, 500);
  }
});
