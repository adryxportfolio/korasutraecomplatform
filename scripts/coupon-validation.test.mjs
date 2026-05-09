import assert from "node:assert/strict";

import {
  calculateCouponDiscount,
  isCouponCurrentlyValid,
  normalizeCouponCode,
} from "../src/lib/coupons.ts";

const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

const baseCoupon = {
  code: "SAVE20",
  description: "20% off",
  status: "active",
  discountType: "percentage",
  discountValue: 20,
  maxDiscountCap: null,
  minOrderValue: 0,
  usageLimitTotal: null,
  usageLimitPerCustomer: null,
  usageCount: 0,
  customerUsageCount: 0,
  firstOrderOnly: false,
  startAt: "2026-05-01T00:00:00.000Z",
  endAt: "2026-05-31T23:59:59.000Z",
  neverExpires: false,
  appliesTo: "all",
  includedProductIds: [],
  includedCategorySlugs: [],
  excludedProductIds: [],
  excludedCategorySlugs: [],
  excludeSaleItems: false,
  canCombineWithSalePrices: true,
  buyQuantity: null,
  getQuantity: null,
};

const cart = [
  {
    productId: "saree-1",
    categorySlug: "sarees",
    unitPrice: 1200,
    quantity: 1,
    isSaleItem: false,
    tags: ["fabric:tussar", "pattern:jamdani"],
  },
  {
    productId: "saree-2",
    categorySlug: "sarees",
    unitPrice: 800,
    quantity: 1,
    isSaleItem: true,
    tags: ["fabric:linen"],
  },
];

test("normalizes coupon codes consistently", () => {
  assert.equal(normalizeCouponCode(" save 20 "), "SAVE20");
  assert.equal(normalizeCouponCode("welcome-10"), "WELCOME-10");
});

test("validates active coupon dates and usage limits", () => {
  assert.equal(isCouponCurrentlyValid(baseCoupon, new Date("2026-05-10T00:00:00.000Z")).valid, true);

  assert.deepEqual(
    isCouponCurrentlyValid({ ...baseCoupon, status: "inactive" }, new Date("2026-05-10T00:00:00.000Z")),
    { valid: false, reason: "Coupon is inactive" },
  );

  assert.deepEqual(
    isCouponCurrentlyValid({ ...baseCoupon, usageLimitTotal: 2, usageCount: 2 }, new Date("2026-05-10T00:00:00.000Z")),
    { valid: false, reason: "Coupon usage limit reached" },
  );
});

test("calculates capped percentage discounts on eligible items only", () => {
  const result = calculateCouponDiscount(
    {
      ...baseCoupon,
      maxDiscountCap: 100,
      appliesTo: "specific_products",
      includedProductIds: ["saree-1"],
      excludeSaleItems: true,
    },
    {
      items: cart,
      subtotal: 2000,
      shippingAmount: 0,
      customerOrderCount: 0,
    },
    new Date("2026-05-10T00:00:00.000Z"),
  );

  assert.equal(result.valid, true);
  assert.equal(result.discountAmount, 100);
});

test("rejects first-order coupons for returning customers", () => {
  const result = calculateCouponDiscount(
    { ...baseCoupon, firstOrderOnly: true },
    { items: cart, subtotal: 2000, shippingAmount: 0, customerOrderCount: 1 },
    new Date("2026-05-10T00:00:00.000Z"),
  );

  assert.equal(result.valid, false);
  assert.equal(result.reason, "Coupon is valid only on first orders");
});

test("calculates buy X get Y discount from cheapest eligible units", () => {
  const result = calculateCouponDiscount(
    {
      ...baseCoupon,
      discountType: "buy_x_get_y",
      discountValue: 0,
      buyQuantity: 2,
      getQuantity: 1,
    },
    {
      items: [
        { productId: "a", categorySlug: "sarees", unitPrice: 500, quantity: 1, tags: [] },
        { productId: "b", categorySlug: "sarees", unitPrice: 300, quantity: 1, tags: [] },
        { productId: "c", categorySlug: "sarees", unitPrice: 200, quantity: 1, tags: [] },
      ],
      subtotal: 1000,
      shippingAmount: 0,
      customerOrderCount: 0,
    },
    new Date("2026-05-10T00:00:00.000Z"),
  );

  assert.equal(result.valid, true);
  assert.equal(result.discountAmount, 200);
});

let failed = 0;
for (const { name, fn } of tests) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`not ok - ${name}`);
    console.error(error);
  }
}

if (failed > 0) process.exit(1);
