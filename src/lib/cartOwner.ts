export type CartOwnerState = {
  items: unknown[];
  cartId: string | null;
  checkoutUrl: string | null;
  cartOwnerKey: string | null;
};

function fnv1a(value: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function scopedCartOwnerKey(customerSessionToken: string | null | undefined) {
  return customerSessionToken ? `customer:${fnv1a(customerSessionToken)}` : null;
}

export function nextCartOwnerState<TState extends CartOwnerState>(state: TState, nextOwnerKey: string | null): TState {
  if (!nextOwnerKey) {
    if (!state.cartOwnerKey) return state;
    return {
      ...state,
      items: [],
      cartId: null,
      checkoutUrl: null,
      cartOwnerKey: null,
    };
  }

  if (state.cartOwnerKey === nextOwnerKey) return state;

  if (!state.cartOwnerKey) {
    return {
      ...state,
      cartOwnerKey: nextOwnerKey,
    };
  }

  return {
    ...state,
    items: [],
    cartId: null,
    checkoutUrl: null,
    cartOwnerKey: nextOwnerKey,
  };
}
