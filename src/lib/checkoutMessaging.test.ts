import { describe, expect, test } from "bun:test";
import { CHECKOUT_COST_DISCLOSURE } from "./checkoutMessaging";

describe("checkout messaging", () => {
  test("sets customer expectation that taxes and shipping are calculated at checkout", () => {
    expect(CHECKOUT_COST_DISCLOSURE).toBe("Taxes and shipping calculated at checkout.");
  });
});
