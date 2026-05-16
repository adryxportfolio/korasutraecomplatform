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

const { filterProductsWithImages } = await import("./shopify");

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
