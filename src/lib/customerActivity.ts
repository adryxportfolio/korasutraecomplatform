import { getCustomerSessionToken } from "@/lib/customerSession";
import type { CartItem } from "@/stores/cartStore";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export type CustomerActivityType = "just_visit" | "product_added_to_cart" | "checkout" | "cart_snapshot";

function itemSku(item: CartItem) {
  return item.product.node.variants.edges.find((edge) => edge.node.id === item.variantId)?.node.sku || item.variantTitle || item.variantId;
}

export function buildCartSnapshotActivityPayload(items: CartItem[]) {
  const snapshotItems = items.map((item) => ({
    variantId: item.variantId,
    productId: item.product.node.id,
    productHandle: item.product.node.handle,
    productTitle: item.product.node.title,
    sku: itemSku(item),
    quantity: item.quantity,
  }));

  return {
    sku: snapshotItems.map((item) => item.sku).filter(Boolean).join(", "),
    metadata: {
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      items: snapshotItems,
    },
  };
}

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
