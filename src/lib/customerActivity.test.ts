import { describe, expect, test } from "bun:test";
import { buildCartSnapshotActivityPayload } from "./customerActivity";

describe("customer activity payloads", () => {
  test("builds an abandoned-cart snapshot from current cart items", () => {
    const payload = buildCartSnapshotActivityPayload([
      {
        variantId: "variant-1",
        variantTitle: "Default",
        quantity: 2,
        maxQuantity: 3,
        price: { amount: "1200", currencyCode: "INR" },
        selectedOptions: [],
        product: {
          node: {
            id: "product-1",
            handle: "blue-saree",
            title: "Blue Saree",
            description: "",
            tags: [],
            priceRange: { minVariantPrice: { amount: "1200", currencyCode: "INR" } },
            images: { edges: [] },
            variants: {
              edges: [{
                node: {
                  id: "variant-1",
                  title: "Default",
                  sku: "KS-BLUE",
                  price: { amount: "1200", currencyCode: "INR" },
                  availableForSale: true,
                  quantityAvailable: 3,
                  selectedOptions: [],
                },
              }],
            },
            options: [],
          },
        },
      },
    ]);

    expect(payload).toEqual({
      sku: "KS-BLUE",
      metadata: {
        itemCount: 2,
        items: [{
          variantId: "variant-1",
          productId: "product-1",
          productHandle: "blue-saree",
          productTitle: "Blue Saree",
          sku: "KS-BLUE",
          quantity: 2,
        }],
      },
    });
  });
});
