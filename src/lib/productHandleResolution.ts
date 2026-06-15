export type ProductHandleResolution<T> = {
  product: T | null;
  canonicalHandle: string | null;
};

export async function resolveProductHandle<T extends { handle: string }>(
  requestedHandle: string,
  loaders: {
    loadCurrent: (handle: string) => Promise<T | null>;
    loadRedirect: (oldHandle: string) => Promise<string | null>;
  },
): Promise<ProductHandleResolution<T>> {
  const current = await loaders.loadCurrent(requestedHandle);
  if (current) {
    return { product: current, canonicalHandle: current.handle };
  }

  const canonicalHandle = await loaders.loadRedirect(requestedHandle);
  if (!canonicalHandle) return { product: null, canonicalHandle: null };

  const redirected = await loaders.loadCurrent(canonicalHandle);
  return {
    product: redirected,
    canonicalHandle: redirected?.handle || canonicalHandle,
  };
}
