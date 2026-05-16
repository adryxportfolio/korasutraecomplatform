import { describe, expect, test } from "bun:test";
import { adminRowToShopifyProduct, removeLocalProductRows } from "./localCommerce";

describe("local commerce product deletion", () => {
  test("removes a product by id without touching other products", () => {
    const products = [
      { id: "product-a", handle: "a", product_variants: [{ id: "variant-a" }] },
      { id: "product-b", handle: "b", product_variants: [{ id: "variant-b" }] },
    ];

    expect(removeLocalProductRows(products, "product-a")).toEqual([
      { id: "product-b", handle: "b", product_variants: [{ id: "variant-b" }] },
    ]);
  });
});

describe("local commerce storefront pricing", () => {
  test("maps compare-at prices onto storefront variants and product price ranges", () => {
    const product = adminRowToShopifyProduct({
      id: "product-a",
      handle: "discounted-saree",
      title: "Discounted Saree",
      description: "",
      price: 1999,
      compare_at_price: 2999,
      has_blouse_piece: false,
      product_images: [{ url: "https://res.cloudinary.com/demo/image/upload/saree.jpg", alt_text: null, position: 0 }],
      product_variants: [{
        id: "variant-a",
        sku: "KS-A",
        title: "Default",
        price: 1999,
        compare_at_price: 2999,
        inventory_qty: 1,
        track_inventory: true,
        position: 0,
      }],
    });

    expect(product.node.priceRange.minVariantCompareAtPrice).toEqual({
      amount: "2999.00",
      currencyCode: "INR",
    });
    expect(product.node.variants.edges[0].node.compareAtPrice).toEqual({
      amount: "2999.00",
      currencyCode: "INR",
    });
  });
});
