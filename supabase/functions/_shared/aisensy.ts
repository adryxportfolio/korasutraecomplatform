import type { AisensyTemplatePayload } from "./aisensyPayload.ts";

export type AisensySendResult = {
  sent: boolean;
  reason: string;
  status?: number;
  responseBody?: string;
};

export function aisensyConfig() {
  return {
    apiKey: Deno.env.get("AISENSY_API_KEY") || Deno.env.get("WHATSAPP_OTP_API_KEY") || "",
    endpoint: Deno.env.get("AISENSY_BASE_URL") || Deno.env.get("WHATSAPP_OTP_BASE_URL") || "https://backend.aisensy.com/campaign/t1/api/v2",
    source: Deno.env.get("AISENSY_TRANSACTIONAL_SOURCE") || Deno.env.get("AISENSY_SOURCE") || "Korasutra Commerce",
    orderCancelledTemplateName: Deno.env.get("AISENSY_ORDER_CANCELLED_TEMPLATE_NAME") || "order_cancelled",
    abandonedCartTemplateName: Deno.env.get("AISENSY_ABANDONED_CART_TEMPLATE_NAME") || "abandoned_cart_",
  };
}

export async function sendAisensyTemplateMessage(payload: AisensyTemplatePayload, endpoint: string): Promise<AisensySendResult> {
  if (!payload.apiKey) return { sent: false, reason: "AISENSY_API_KEY is not configured" };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const responseBody = await response.text();
    if (!response.ok) {
      return {
        sent: false,
        reason: `AI Sensy ${response.status}: ${responseBody}`,
        status: response.status,
        responseBody,
      };
    }
    return { sent: true, reason: "", status: response.status, responseBody };
  } catch (error) {
    return {
      sent: false,
      reason: error instanceof Error ? error.message : "AI Sensy request failed",
    };
  }
}
