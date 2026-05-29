import { describe, expect, test } from "bun:test";
import {
  buildAbandonedCartTemplateMessage,
  buildOrderCancelledTemplateMessage,
  normalizeWhatsappDestination,
} from "./aisensyPayload";

describe("AI Sensy payload helpers", () => {
  test("normalizes Indian WhatsApp destinations", () => {
    expect(normalizeWhatsappDestination("+91", "79958 62266")).toBe("+917995862266");
    expect(normalizeWhatsappDestination("91", "+91-79958-62266")).toBe("+917995862266");
  });

  test("builds the order_cancelled template payload", () => {
    const payload = buildOrderCancelledTemplateMessage({
      apiKey: "key",
      destination: "+917995862266",
      customerName: "Anika",
      orderNumber: "KS-100001",
      orderTotal: "2199.00",
      templateName: "order_cancelled",
      source: "Korasutra Commerce",
    });

    expect(payload.campaignName).toBe("order_cancelled");
    expect(payload.templateParams).toEqual(["Anika", "KS-100001", "2199.00"]);
    expect(payload.tags).toContain("order_cancelled");
  });

  test("builds the abandoned_cart_ template payload", () => {
    const payload = buildAbandonedCartTemplateMessage({
      apiKey: "key",
      destination: "+917995862266",
      customerName: "Anika",
      itemSummary: "Red Saree",
      cartUrl: "https://korasutra.com/cart",
      templateName: "abandoned_cart_",
      source: "Korasutra Commerce",
    });

    expect(payload.campaignName).toBe("abandoned_cart_");
    expect(payload.templateParams).toEqual(["Anika", "Red Saree", "https://korasutra.com/cart"]);
    expect(payload.tags).toContain("abandoned_cart");
  });
});
