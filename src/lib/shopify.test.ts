import { describe, expect, test } from "bun:test";
import type { ShopifyProduct } from "./shopify";

globalThis.localStorage = {
  clear() {},
  getItem() { return null; },
  key() { return null; },
  removeItem() {},
  setItem() {},
  length: 0,
} as Storage;

const { filterProductsWithImages, mapCatalogProduct } = await import("./shopify");

function product(handle: string, imageUrl?: string): ShopifyProduct {
  return {
    node: {
      id: handle,
      title: handle,
      description: "",
      handle,
      priceRange: {
        minVariantPrice: {
          amount: "1.00",
          currencyCode: "INR",
        },
      },
      images: {
        edges: imageUrl
          ? [{
              node: {
                url: imageUrl,
                altText: handle,
              },
            }]
          : [],
      },
      variants: {
        edges: [],
      },
      options: [],
    },
  };
}

describe("shopify product image guards", () => {
  test("filters products without renderable image URLs from storefront lists", () => {
    expect(filterProductsWithImages([
      product("missing"),
      product("blank", " "),
      product("cloudinary", "https://res.cloudinary.com/demo/image/upload/front.jpg"),
    ]).map((item) => item.node.handle)).toEqual(["cloudinary"]);
  });
});

describe("shopify catalog pricing", () => {
  test("maps compare-at prices onto storefront variants and product price ranges", () => {
    const item = mapCatalogProduct({
      id: "product-a",
      title: "Discounted Saree",
      description: "",
      handle: "discounted-saree",
      tags: [],
      price: 1999,
      compare_at_price: 2999,
      fabric: null,
      technique: null,
      color: null,
      has_blouse_piece: false,
      product_images: [{ url: "https://res.cloudinary.com/demo/image/upload/saree.jpg", alt_text: null, position: 0 }],
      product_variants: [{
        id: "variant-a",
        sku: "KS-A",
        title: "Default",
        option1_name: null,
        option1_value: null,
        option2_name: null,
        option2_value: null,
        price: 1999,
        compare_at_price: 2999,
        inventory_qty: 1,
        track_inventory: true,
        position: 0,
      }],
    });

    expect(item.node.priceRange.minVariantCompareAtPrice).toEqual({
      amount: "2999.00",
      currencyCode: "INR",
    });
    expect(item.node.variants.edges[0].node.compareAtPrice).toEqual({
      amount: "2999.00",
      currencyCode: "INR",
    });
  });
});
