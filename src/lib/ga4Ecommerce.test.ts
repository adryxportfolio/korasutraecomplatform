import { describe, expect, test } from "bun:test";
import {
  buildGa4CartPayload,
  buildGa4Item,
  trackGa4EcommerceEvent,
  type DataLayerEvent,
} from "./ga4Ecommerce";
import type { CartItem } from "@/stores/cartStore";
import type { ShopifyProduct } from "./shopify";

function makeProduct(overrides: Partial<ShopifyProduct["node"]> = {}): ShopifyProduct {
  const node: ShopifyProduct["node"] = {
    id: "prod_1",
    title: "Red Muslin Saree",
    description: "Handcrafted muslin saree",
    handle: "red-muslin-saree",
    tags: ["Muslin", "Red", "Festive"],
    priceRange: {
      minVariantPrice: {
        amount: "4999.00",
        currencyCode: "INR",
      },
    },
    images: { edges: [] },
    videos: { edges: [] },
    variants: {
      edges: [
        {
          node: {
            id: "variant_1",
            title: "Default Title",
            sku: "KS-RED",
            price: {
              amount: "4999.00",
              currencyCode: "INR",
            },
            availableForSale: true,
            quantityAvailable: 1,
            selectedOptions: [{ name: "Color", value: "Red" }],
          },
        },
      ],
    },
    options: [{ name: "Color", values: ["Red"] }],
    ...overrides,
  };

  return { node };
}

function makeCartItem(overrides: Partial<CartItem> = {}): CartItem {
  const product = makeProduct();
  return {
    product,
    variantId: "variant_1",
    variantTitle: "Default Title",
    price: {
      amount: "4999.00",
      currencyCode: "INR",
    },
    quantity: 2,
    maxQuantity: 2,
    selectedOptions: [{ name: "Color", value: "Red" }],
    ...overrides,
  };
}

describe("GA4 ecommerce data layer", () => {
  test("maps a cart item to the GA4 ecommerce item shape", () => {
    expect(buildGa4Item(makeCartItem(), 1)).toEqual({
      item_id: "KS-RED",
      item_name: "Red Muslin Saree",
      item_brand: "Kora Sutra",
      item_category: "Muslin",
      item_variant: "Default Title",
      item_list_id: "cart",
      item_list_name: "Shopping Cart",
      index: 1,
      price: 4999,
      quantity: 2,
      google_business_vertical: "retail",
    });
  });

  test("builds cart payload with event-level currency and value", () => {
    expect(buildGa4CartPayload([makeCartItem()])).toEqual({
      currency: "INR",
      value: 9998,
      items: [buildGa4Item(makeCartItem(), 0)],
    });
  });

  test("clears stale ecommerce data before pushing a fresh event", () => {
    const events: DataLayerEvent[] = [];

    trackGa4EcommerceEvent(
      "view_cart",
      buildGa4CartPayload([makeCartItem()]),
      events,
    );

    expect(events).toEqual([
      { ecommerce: null },
      {
        event: "view_cart",
        ecommerce: {
          currency: "INR",
          value: 9998,
          items: [buildGa4Item(makeCartItem(), 0)],
        },
      },
    ]);
  });
});
