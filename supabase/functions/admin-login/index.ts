/* eslint-disable @typescript-eslint/no-explicit-any */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_ADMIN_USERNAME = "korasutra.official@gmail.com";
const LEGACY_ADMIN_USERNAME = "korasutra_admin";
const DEFAULT_ADMIN_PASSWORD_HASH = "9d3bfeceeeab8f06130d094b83f2bd5f574dc495ab1c6927ad5f77ed8d0d3061";
const PLACEHOLDER_PASSWORDS = new Set([
  "replace_before_production",
  "change_me",
  "changeme",
  "password",
]);

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function getDefaultAdminPasswordHash(): Promise<string> {
  const configuredPassword = Deno.env.get("ADMIN_DEFAULT_PASSWORD")?.trim();
  if (!configuredPassword || PLACEHOLDER_PASSWORDS.has(configuredPassword.toLowerCase())) {
    return DEFAULT_ADMIN_PASSWORD_HASH;
  }
  return await hashPassword(configuredPassword);
}

async function ensureDefaultAdmin(supabase: any, passwordHash: string) {
  const defaultUsername = (Deno.env.get("ADMIN_DEFAULT_USERNAME") || DEFAULT_ADMIN_USERNAME).trim().toLowerCase();

  const { data: existingAdmins, error: selectError } = await supabase
    .from("admin_users")
    .select("id, username")
    .in("username", [defaultUsername, LEGACY_ADMIN_USERNAME]);

  if (selectError) throw selectError;

  const admins = existingAdmins || [];
  const defaultAdmin = admins.find((admin: any) => admin.username === defaultUsername);
  const legacyAdmins = admins.filter((admin: any) => admin.username === LEGACY_ADMIN_USERNAME);

  if (defaultAdmin) {
    const { error: updateError } = await supabase
      .from("admin_users")
      .update({ password_hash: passwordHash })
      .eq("id", defaultAdmin.id);
    if (updateError) throw updateError;

    for (const legacyAdmin of legacyAdmins) {
      await supabase.from("admin_sessions").delete().eq("admin_id", legacyAdmin.id);
      await supabase.from("admin_users").delete().eq("id", legacyAdmin.id);
    }

    return defaultAdmin;
  }

  if (legacyAdmins[0]) {
    const { data: repairedAdmin, error: repairError } = await supabase
      .from("admin_users")
      .update({ username: defaultUsername, password_hash: passwordHash })
      .eq("id", legacyAdmins[0].id)
      .select("id, username")
      .single();

    if (repairError) throw repairError;
    return repairedAdmin;
  }

  const { data: insertedAdmin, error: insertError } = await supabase
    .from("admin_users")
    .insert({ username: defaultUsername, password_hash: passwordHash })
    .select("id, username")
    .single();

  if (insertError) throw insertError;
  return insertedAdmin;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: "Username and password are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const passwordHash = await hashPassword(password);
    const normalizedUsername = String(username).trim().toLowerCase();
    const defaultUsername = (Deno.env.get("ADMIN_DEFAULT_USERNAME") || DEFAULT_ADMIN_USERNAME).trim().toLowerCase();
    const defaultPasswordHash = await getDefaultAdminPasswordHash();

    if (normalizedUsername === defaultUsername && passwordHash === defaultPasswordHash) {
      await ensureDefaultAdmin(supabase, defaultPasswordHash);
    }

    const { data: admin, error } = await supabase
      .from("admin_users")
      .select("id, username")
      .eq("username", normalizedUsername)
      .eq("password_hash", passwordHash)
      .single();

    if (error || !admin) {
      return new Response(
        JSON.stringify({ error: "Invalid username or password" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Delete existing sessions for this admin
    await supabase.from("admin_sessions").delete().eq("admin_id", admin.id);

    // Create a new session with a configurable expiry.
    const token = generateToken();
    const configuredTtlHours = Number(Deno.env.get("ADMIN_SESSION_TTL_HOURS") || 24);
    const ttlHours = Number.isFinite(configuredTtlHours) && configuredTtlHours > 0 ? configuredTtlHours : 24;
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString();

    const { error: sessionError } = await supabase.from("admin_sessions").insert({
      admin_id: admin.id,
      token,
      expires_at: expiresAt,
    });

    if (sessionError) {
      return new Response(
        JSON.stringify({ error: "Failed to create session" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, token, username: admin.username }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
