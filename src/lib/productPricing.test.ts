import { describe, expect, test } from "bun:test";
import { getPriceDisplay, validateCompareAtPrice } from "./productPricing";

describe("product pricing display", () => {
  test("shows only the current price when compare-at price is blank", () => {
    expect(getPriceDisplay("1999.00", null)).toEqual({
      priceAmount: 1999,
      compareAtAmount: null,
      discountPercentage: null,
      savingsAmount: null,
      isDiscounted: false,
    });
  });

  test("shows a discount when compare-at price is higher than price", () => {
    expect(getPriceDisplay("1999.00", "2999.00")).toEqual({
      priceAmount: 1999,
      compareAtAmount: 2999,
      discountPercentage: 33,
      savingsAmount: 1000,
      isDiscounted: true,
    });
  });
});

describe("product compare-at validation", () => {
  test("rejects compare-at prices that are equal to or lower than price", () => {
    expect(validateCompareAtPrice(1999, 1999)).toBe("Compare-at Price must be higher than Price");
    expect(validateCompareAtPrice(1999, 1499)).toBe("Compare-at Price must be higher than Price");
  });

  test("allows blank compare-at prices and higher compare-at prices", () => {
    expect(validateCompareAtPrice(1999, null)).toBeNull();
    expect(validateCompareAtPrice(1999, 2999)).toBeNull();
  });
});
