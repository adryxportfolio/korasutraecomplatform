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
