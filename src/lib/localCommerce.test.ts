import { describe, expect, test } from "bun:test";
import { removeLocalProductRows } from "./localCommerce";

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
