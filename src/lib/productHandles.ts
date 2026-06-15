export function slugifyHandlePart(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildSkuPrefixedHandle(sku: string, title: string) {
  const skuPart = slugifyHandlePart(sku);
  if (!skuPart) throw new Error("A first variant SKU is required");

  return [skuPart, slugifyHandlePart(title)].filter(Boolean).join("-");
}

export function withHandleCollisionSuffix(handle: string, productId: string) {
  const suffix = productId.replace(/[^a-z0-9]/gi, "").slice(0, 8).toLowerCase();
  return suffix ? `${handle}-${suffix}` : handle;
}
