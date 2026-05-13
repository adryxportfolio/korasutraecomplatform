import { describe, expect, test } from "bun:test";
import {
  nextCartOwnerState,
  scopedCartOwnerKey,
  type CartOwnerState,
} from "./cartOwner";

const cartState: CartOwnerState = {
  items: ["cart-item"],
  cartId: "cart_123",
  checkoutUrl: "/checkout",
  cartOwnerKey: null,
};

describe("cart owner isolation", () => {
  test("keeps guest cart when the first verified customer claims it", () => {
    expect(nextCartOwnerState(cartState, scopedCartOwnerKey("token-a"))).toEqual({
      ...cartState,
      cartOwnerKey: "customer:4cd198c4",
    });
  });

  test("clears cart when a different verified customer becomes active", () => {
    const ownedState = nextCartOwnerState(cartState, scopedCartOwnerKey("token-a"));

    expect(nextCartOwnerState(ownedState, scopedCartOwnerKey("token-b"))).toEqual({
      items: [],
      cartId: null,
      checkoutUrl: null,
      cartOwnerKey: "customer:4fd19d7d",
    });
  });

  test("does not clear cart when the same customer session is restored", () => {
    const ownedState = nextCartOwnerState(cartState, scopedCartOwnerKey("token-a"));

    expect(nextCartOwnerState(ownedState, scopedCartOwnerKey("token-a"))).toEqual(ownedState);
  });

  test("clears a verified customer cart when the session is removed", () => {
    const ownedState = nextCartOwnerState(cartState, scopedCartOwnerKey("token-a"));

    expect(nextCartOwnerState(ownedState, null)).toEqual({
      items: [],
      cartId: null,
      checkoutUrl: null,
      cartOwnerKey: null,
    });
  });
});
