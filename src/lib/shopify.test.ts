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

const { catalogSupportsExtendedVariants, filterProductsWithImages, mapCatalogProduct } = await import("./shopify");

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

describe("shopify catalog schema rollout", () => {
  test("uses extended variant columns only after the migration marker is present", () => {
    expect(catalogSupportsExtendedVariants(null)).toBe(false);
    expect(catalogSupportsExtendedVariants({ commerceSchemaVersion: 1 })).toBe(false);
    expect(catalogSupportsExtendedVariants({ commerceSchemaVersion: 2 })).toBe(true);
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
        option3_name: null,
        option3_value: null,
        option4_name: null,
        option4_value: null,
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

describe("shopify blouse options", () => {
  test("maps four independently stocked blouse options in order", () => {
    const item = mapCatalogProduct({
      id: "product-blouse",
      title: "Silk Blouse",
      description: "",
      handle: "silk-blouse",
      tags: [],
      price: 2499,
      compare_at_price: null,
      fabric: "silk",
      technique: null,
      color: "red",
      has_blouse_piece: false,
      category: { slug: "blouses", name: "Blouses" },
      product_images: [{ url: "https://res.cloudinary.com/demo/image/upload/blouse.jpg", alt_text: null, position: 0 }],
      product_variants: [
        {
          id: "variant-38",
          sku: "KS-BLOUSE-38",
          title: "Size 38",
          option1_name: "Size",
          option1_value: "38",
          option2_name: null,
          option2_value: null,
          option3_name: null,
          option3_value: null,
          option4_name: null,
          option4_value: null,
          price: 2499,
          compare_at_price: null,
          inventory_qty: 5,
          track_inventory: true,
          position: 1,
        },
        {
          id: "variant-34",
          sku: "KS-BLOUSE-34",
          title: "Size 34",
          option1_name: "Size",
          option1_value: "34",
          option2_name: "Sleeves",
          option2_value: "Sleeveless",
          option3_name: "Neck",
          option3_value: "Halter",
          option4_name: "Close Type",
          option4_value: "Zip",
          price: 2499,
          compare_at_price: null,
          inventory_qty: 2,
          track_inventory: true,
          position: 0,
        },
      ],
    });

    expect(item.node.options).toEqual([
      { name: "Size", values: ["34", "38"] },
      { name: "Sleeves", values: ["Sleeveless"] },
      { name: "Neck", values: ["Halter"] },
      { name: "Close Type", values: ["Zip"] },
    ]);
    expect(item.node.variants.edges.map(({ node }) => ({
      title: node.title,
      quantityAvailable: node.quantityAvailable,
      selectedOptions: node.selectedOptions,
    }))).toEqual([
      {
        title: "Size 34",
        quantityAvailable: 2,
        selectedOptions: [
          { name: "Size", value: "34" },
          { name: "Sleeves", value: "Sleeveless" },
          { name: "Neck", value: "Halter" },
          { name: "Close Type", value: "Zip" },
        ],
      },
      {
        title: "Size 38",
        quantityAvailable: 5,
        selectedOptions: [{ name: "Size", value: "38" }],
      },
    ]);
  });
});
