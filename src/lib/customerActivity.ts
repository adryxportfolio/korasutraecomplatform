import { getCustomerSessionToken } from "@/lib/customerSession";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export type CustomerActivityType = "just_visit" | "product_added_to_cart" | "checkout";

export async function trackCustomerActivity(activityType: CustomerActivityType, payload: { sku?: string | null; metadata?: Record<string, unknown> } = {}) {
  const token = getCustomerSessionToken();
  if (!token || !SUPABASE_URL) return { skipped: true };

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/customer-activity`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-session-token": token,
      },
      body: JSON.stringify({
        customerSessionToken: token,
        activityType,
        ...payload,
      }),
    });
    return await response.json().catch(() => ({ success: response.ok }));
  } catch (error) {
    console.error("Unable to track customer activity:", error);
    return { skipped: true };
  }
}
