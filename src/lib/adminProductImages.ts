export type AdminProductImageInput = {
  url?: string;
  altText?: string;
  storageKey?: string;
};

export type BuildAdminProductImagesInput = {
  title: string;
  imageUrls?: string;
  uploadedImages?: AdminProductImageInput[];
  orderedImages?: AdminProductImageInput[];
  maxImages?: number;
};

export type ProductMediaUrlInput = {
  images?: Array<{ url?: string | null }>;
  videos?: Array<{ url?: string | null }>;
};

export function isShopifyCdnMediaUrl(url: string) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === "cdn.shopify.com" || host.endsWith(".myshopify.com");
  } catch {
    return false;
  }
}

export function isHttpMediaUrl(url: string) {
  try {
    const protocol = new URL(url).protocol.toLowerCase();
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
}

export function findShopifyCdnMediaUrls({ images = [], videos = [] }: ProductMediaUrlInput) {
  return [...images, ...videos]
    .map((item) => String(item.url || "").trim())
    .filter((url) => url && isShopifyCdnMediaUrl(url));
}

// Product media must be reachable over http(s). Any hosted URL is accepted
// (uploads go to Supabase Storage); Shopify CDN URLs are rejected separately.
export function findInvalidMediaUrls({ images = [], videos = [] }: ProductMediaUrlInput) {
  return [...images, ...videos]
    .map((item) => String(item.url || "").trim())
    .filter((url) => url && !isHttpMediaUrl(url));
}

export function buildAdminProductImages({
  title,
  imageUrls = "",
  uploadedImages = [],
  orderedImages,
  maxImages = 12,
}: BuildAdminProductImagesInput) {
  const seen = new Set<string>();
  const urlImages = imageUrls
    .split(/\r?\n/)
    .map((url) => url.trim())
    .filter(Boolean)
    .map((url) => ({ url }));

  const images = orderedImages || [...urlImages, ...uploadedImages];

  return images
    .map((image) => ({
      ...image,
      url: String(image.url || "").trim(),
      altText: ("altText" in image ? image.altText : undefined) || title,
    }))
    .filter((image) => {
      if (!image.url || seen.has(image.url)) return false;
      seen.add(image.url);
      return true;
    })
    .slice(0, maxImages);
}

export function moveAdminProductImage<T>(images: T[], fromIndex: number, toIndex: number) {
  if (fromIndex === toIndex) return [...images];
  if (fromIndex < 0 || fromIndex >= images.length) return [...images];
  const next = [...images];
  const [image] = next.splice(fromIndex, 1);
  const targetIndex = Math.max(0, Math.min(toIndex, next.length));
  next.splice(targetIndex, 0, image);
  return next;
}

export function removeAdminProductImage<T>(images: T[], index: number) {
  if (index < 0 || index >= images.length) return [...images];
  return images.filter((_, currentIndex) => currentIndex !== index);
}
