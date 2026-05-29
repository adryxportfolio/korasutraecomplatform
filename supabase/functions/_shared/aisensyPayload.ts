export type AisensyTemplatePayload = {
  apiKey: string;
  campaignName: string;
  destination: string;
  userName: string;
  source: string;
  templateParams: string[];
  tags: string[];
  attributes: Record<string, string>;
};

export function normalizeWhatsappDestination(countryCode: string, phone: string) {
  const countryDigits = String(countryCode || "91").replace(/\D/g, "") || "91";
  const phoneDigits = String(phone || "").replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
  return `+${countryDigits}${phoneDigits}`;
}

function safeText(value: unknown, fallback = "") {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text || fallback;
}

export function buildOrderCancelledTemplateMessage(input: {
  apiKey: string;
  destination: string;
  customerName?: string | null;
  orderNumber: string;
  orderTotal?: string | number | null;
  templateName?: string;
  source?: string;
}) {
  const customerName = safeText(input.customerName, "Korasutra Customer");
  const orderTotal = safeText(input.orderTotal, "0.00");
  return {
    apiKey: input.apiKey,
    campaignName: input.templateName || "order_cancelled",
    destination: input.destination,
    userName: customerName,
    source: input.source || "Korasutra Commerce",
    templateParams: [customerName, safeText(input.orderNumber), orderTotal],
    tags: ["order_cancelled"],
    attributes: {
      order_number: safeText(input.orderNumber),
      order_total: orderTotal,
    },
  } satisfies AisensyTemplatePayload;
}

export function buildAbandonedCartTemplateMessage(input: {
  apiKey: string;
  destination: string;
  customerName?: string | null;
  itemSummary?: string | null;
  cartUrl: string;
  templateName?: string;
  source?: string;
}) {
  const customerName = safeText(input.customerName, "Korasutra Customer");
  const itemSummary = safeText(input.itemSummary, "your selected Korasutra pieces");
  return {
    apiKey: input.apiKey,
    campaignName: input.templateName || "abandoned_cart_",
    destination: input.destination,
    userName: customerName,
    source: input.source || "Korasutra Commerce",
    templateParams: [customerName, itemSummary, input.cartUrl],
    tags: ["abandoned_cart"],
    attributes: {
      item_summary: itemSummary,
      cart_url: input.cartUrl,
    },
  } satisfies AisensyTemplatePayload;
}
