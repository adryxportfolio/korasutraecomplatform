import { describe, expect, test } from "bun:test";
import { buildAddToCartUrl, parseAddToCartParams } from "./addToCartUrl";

describe("add-to-cart URLs", () => {
  test("builds a canonical product add-to-cart URL", () => {
    expect(buildAddToCartUrl("red-muslin-saree", "https://korasutra.com")).toBe(
      "https://korasutra.com/cart/add/red-muslin-saree",
    );
  });

  test("adds optional variant, quantity, and checkout parameters", () => {
    expect(
      buildAddToCartUrl("red muslin saree", "https://korasutra.com/", {
        variantId: "variant-123",
        quantity: 2,
        checkout: true,
      }),
    ).toBe("https://korasutra.com/cart/add/red-muslin-saree?variant=variant-123&quantity=2&checkout=1");
  });

  test("parses add-to-cart parameters with safe defaults", () => {
    expect(parseAddToCartParams(new URLSearchParams("variant=variant-123&quantity=3&checkout=1"))).toEqual({
      variantId: "variant-123",
      quantity: 3,
      checkout: true,
    });

    expect(parseAddToCartParams(new URLSearchParams("quantity=0"))).toEqual({
      variantId: "",
      quantity: 1,
      checkout: false,
    });
  });
});
