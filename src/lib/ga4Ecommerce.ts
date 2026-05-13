import type { CartItem } from "@/stores/cartStore";
import type { ShopifyProduct } from "@/lib/shopify";

export type Ga4EcommerceEventName =
  | "view_item"
  | "add_to_cart"
  | "remove_from_cart"
  | "view_cart"
  | "begin_checkout"
  | "add_payment_info"
  | "purchase";

export type Ga4Item = {
  item_id: string;
  item_name: string;
  item_brand: string;
  item_category?: string;
  item_variant?: string;
  item_list_id?: string;
  item_list_name?: string;
  index?: number;
  price: number;
  quantity: number;
  google_business_vertical: "retail";
};

export type Ga4EcommercePayload = {
  currency: string;
  value: number;
  items: Ga4Item[];
  coupon?: string;
  payment_type?: string;
  shipping_tier?: string;
  transaction_id?: string;
  shipping?: number;
  tax?: number;
};

export type DataLayerEvent =
  | { ecommerce: null }
  | { event: Ga4EcommerceEventName; ecommerce: Ga4EcommercePayload };

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

type VariantNode = ShopifyProduct["node"]["variants"]["edges"][number]["node"];

function toMoneyNumber(amount: string | number | null | undefined) {
  const value = typeof amount === "number" ? amount : Number.parseFloat(String(amount || 0));
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

function firstMeaningfulTag(tags: string[] | undefined) {
  return tags?.find((tag) => tag && !/with blouse|without blouse/i.test(tag));
}

function itemId(product: ShopifyProduct["node"], variant?: Pick<VariantNode, "sku" | "id"> | null) {
  return variant?.sku || variant?.id || product.id;
}

export function buildGa4ItemFromVariant(
  product: ShopifyProduct["node"],
  variant: Pick<VariantNode, "id" | "sku" | "title" | "price">,
  quantity = 1,
  index = 0,
  listId = "product",
  listName = "Product Detail",
): Ga4Item {
  return {
    item_id: itemId(product, variant),
    item_name: product.title,
    item_brand: "Kora Sutra",
    item_category: firstMeaningfulTag(product.tags),
    item_variant: variant.title,
    item_list_id: listId,
    item_list_name: listName,
    index,
    price: toMoneyNumber(variant.price.amount),
    quantity,
    google_business_vertical: "retail",
  };
}

export function buildGa4Item(item: CartItem, index = 0): Ga4Item {
  const variant = item.product.node.variants.edges.find((edge) => edge.node.id === item.variantId)?.node;
  return {
    item_id: itemId(item.product.node, variant || { id: item.variantId, sku: null }),
    item_name: item.product.node.title,
    item_brand: "Kora Sutra",
    item_category: firstMeaningfulTag(item.product.node.tags),
    item_variant: item.variantTitle,
    item_list_id: "cart",
    item_list_name: "Shopping Cart",
    index,
    price: toMoneyNumber(item.price.amount),
    quantity: item.quantity,
    google_business_vertical: "retail",
  };
}

export function buildGa4CartPayload(
  items: CartItem[],
  overrides: Partial<Ga4EcommercePayload> = {},
): Ga4EcommercePayload {
  const currency = items[0]?.price.currencyCode || "INR";
  const value = toMoneyNumber(items.reduce((sum, item) => sum + toMoneyNumber(item.price.amount) * item.quantity, 0));
  return {
    currency,
    value,
    items: items.map((item, index) => buildGa4Item(item, index)),
    ...overrides,
  };
}

export function trackGa4EcommerceEvent(
  event: Ga4EcommerceEventName,
  payload: Ga4EcommercePayload,
  dataLayer: unknown[] | undefined = typeof window !== "undefined" ? window.dataLayer : undefined,
) {
  const activeDataLayer = dataLayer || (typeof window !== "undefined" ? (window.dataLayer = window.dataLayer || []) : null);
  if (!activeDataLayer) return;

  activeDataLayer.push({ ecommerce: null });
  activeDataLayer.push({ event, ecommerce: payload });
}
