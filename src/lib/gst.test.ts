import { describe, expect, test } from "bun:test";
import { GST_RATE, calculateCheckoutTotals } from "./gst";

describe("GST checkout totals", () => {
  test("keeps catalog prices excluding GST and adds 5% GST at checkout", () => {
    const totals = calculateCheckoutTotals({
      subtotal: 10000,
      discountAmount: 1000,
      codSurcharge: 200,
    });

    expect(GST_RATE).toBe(0.05);
    expect(totals.taxableAmount).toBe(9000);
    expect(totals.gstAmount).toBe(450);
    expect(totals.total).toBe(9650);
  });

  test("does not charge GST on discounts that reduce the taxable amount to zero", () => {
    expect(calculateCheckoutTotals({
      subtotal: 500,
      discountAmount: 700,
      codSurcharge: 200,
    })).toEqual({
      taxableAmount: 0,
      gstAmount: 0,
      total: 200,
    });
  });
});
