export type AdminProductImageInput = {
  url?: string;
  altText?: string;
  storageKey?: string;
};

export type BuildAdminProductImagesInput = {
  title: string;
  imageUrls?: string;
  uploadedImages?: AdminProductImageInput[];
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

export function isCloudinaryMediaUrl(url: string) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === "res.cloudinary.com" || host.endsWith(".cloudinary.com");
  } catch {
    return false;
  }
}

export function findShopifyCdnMediaUrls({ images = [], videos = [] }: ProductMediaUrlInput) {
  return [...images, ...videos]
    .map((item) => String(item.url || "").trim())
    .filter((url) => url && isShopifyCdnMediaUrl(url));
}

export function findNonCloudinaryMediaUrls({ images = [], videos = [] }: ProductMediaUrlInput) {
  return [...images, ...videos]
    .map((item) => String(item.url || "").trim())
    .filter((url) => url && !isCloudinaryMediaUrl(url));
}

export function buildAdminProductImages({
  title,
  imageUrls = "",
  uploadedImages = [],
  maxImages = 12,
}: BuildAdminProductImagesInput) {
  const seen = new Set<string>();
  const urlImages = imageUrls
    .split(/\r?\n/)
    .map((url) => url.trim())
    .filter(Boolean)
    .map((url) => ({ url }));

  return [...urlImages, ...uploadedImages]
    .map((image) => ({
      ...image,
      url: String(image.url || "").trim(),
      altText: image.altText || title,
    }))
    .filter((image) => {
      if (!image.url || seen.has(image.url)) return false;
      seen.add(image.url);
      return true;
    })
    .slice(0, maxImages);
}
