import { describe, expect, test } from "bun:test";
import { customerAccountLinks } from "./accountMenuLinks";

describe("customerAccountLinks", () => {
  test("exposes the expected customer account destinations", () => {
    expect(customerAccountLinks.map((link) => link.label)).toEqual([
      "Order Status",
      "Order History",
      "Refund Status",
      "Support",
    ]);

    expect(customerAccountLinks.map((link) => link.href)).toEqual([
      "/order-tracking",
      "/order-tracking?view=history",
      "/returns",
      "/contact",
    ]);
  });
});
