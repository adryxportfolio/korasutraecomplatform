import { describe, expect, test } from "bun:test";
import { storefrontRealtimeTables } from "./realtimeTables";

describe("storefrontRealtimeTables", () => {
  test("covers catalog, inventory, coupon, and order surfaces updated from admin", () => {
    expect(storefrontRealtimeTables).toEqual([
      "products",
      "product_images",
      "product_videos",
      "product_variants",
      "coupons",
      "coupon_redemptions",
      "orders",
      "order_items",
      "site_settings",
    ]);
  });
});
