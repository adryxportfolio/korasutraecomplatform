type AddToCartUrlOptions = {
  variantId?: string;
  quantity?: number;
  checkout?: boolean;
};

function normalizeHandle(handle: string) {
  return handle
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeOrigin(origin: string) {
  return origin.replace(/\/+$/, "");
}

export function buildAddToCartUrl(handle: string, origin: string, options: AddToCartUrlOptions = {}) {
  const url = new URL(`/cart/add/${normalizeHandle(handle)}`, normalizeOrigin(origin));
  if (options.variantId) url.searchParams.set("variant", options.variantId);
  if (options.quantity && options.quantity > 1) url.searchParams.set("quantity", String(Math.floor(options.quantity)));
  if (options.checkout) url.searchParams.set("checkout", "1");
  return url.toString();
}

export function parseAddToCartParams(searchParams: URLSearchParams) {
  const requestedQuantity = Number(searchParams.get("quantity") || 1);
  return {
    variantId: searchParams.get("variant") || "",
    quantity: Number.isFinite(requestedQuantity) && requestedQuantity > 0 ? Math.floor(requestedQuantity) : 1,
    checkout: searchParams.get("checkout") === "1" || searchParams.get("checkout") === "true",
  };
}
