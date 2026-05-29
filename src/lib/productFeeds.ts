import { blousePieceDisplayText } from "@/lib/productPresentation";

type ProductFeedImage = {
  url?: string | null;
  position?: number | null;
};

type ProductFeedVariant = {
  sku?: string | null;
  inventory_qty?: number | string | null;
  position?: number | null;
};

type ProductFeedVideo = {
  url?: string | null;
  position?: number | null;
};

export type ProductFeedRow = {
  id?: string | null;
  handle?: string | null;
  title?: string | null;
  description?: string | null;
  short_description?: string | null;
  category?: { name?: string | null; slug?: string | null } | null;
  status?: string | null;
  price?: number | string | null;
  compare_at_price?: number | string | null;
  fabric?: string | null;
  technique?: string | null;
  color?: string | null;
  has_blouse_piece?: boolean | null;
  tags?: string[] | null;
  product_images?: ProductFeedImage[] | null;
  product_videos?: ProductFeedVideo[] | null;
  product_variants?: ProductFeedVariant[] | null;
};

type ProductFeedOptions = {
  siteUrl?: string;
};

const META_CATALOG_HEADERS = [
  "id",
  "title",
  "description",
  "availability",
  "condition",
  "price",
  "link",
  "image_link",
  "brand",
  "google_product_category",
  "fb_product_category",
  "quantity_to_sell_on_facebook",
  "sale_price",
  "sale_price_effective_date",
  "item_group_id",
  "gender",
  "color",
  "size",
  "age_group",
  "material",
  "pattern",
  "shipping",
  "shipping_weight",
  "offer_disclaimer",
  "offer_disclaimer_url",
  "video[0].url",
  "video[0].tag[0]",
  "gtin",
  "product_tags[0]",
  "product_tags[1]",
  "style[0]",
];

const META_GOOGLE_PRODUCT_CATEGORY = "Apparel & Accessories > Clothing > Traditional & Ceremonial Clothing > Saris";
const META_FB_PRODUCT_CATEGORY = "Clothing & Accessories > Clothing";
const META_BRAND = "Korasutra";
const META_CURRENCY = "INR";

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function xmlText(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function sortedImages(product: ProductFeedRow) {
  return [...(product.product_images || [])]
    .sort((a, b) => Number(a.position ?? 0) - Number(b.position ?? 0))
    .map((image) => String(image.url || "").trim())
    .filter(Boolean);
}

function sortedVariants(product: ProductFeedRow) {
  return [...(product.product_variants || [])]
    .sort((a, b) => Number(a.position ?? 0) - Number(b.position ?? 0));
}

function sortedVideos(product: ProductFeedRow) {
  return [...(product.product_videos || [])]
    .sort((a, b) => Number(a.position ?? 0) - Number(b.position ?? 0))
    .map((video) => String(video.url || "").trim())
    .filter(Boolean);
}

function stockTotal(product: ProductFeedRow) {
  return sortedVariants(product).reduce((sum, variant) => sum + Number(variant.inventory_qty || 0), 0);
}

function skuList(product: ProductFeedRow) {
  return sortedVariants(product)
    .map((variant) => String(variant.sku || "").trim())
    .filter(Boolean);
}

function normalizeSiteUrl(siteUrl = "https://korasutra.com") {
  return siteUrl.replace(/\/+$/, "");
}

function productUrl(product: ProductFeedRow, siteUrl?: string) {
  const handle = String(product.handle || "").trim();
  return handle ? `${normalizeSiteUrl(siteUrl)}/products/${encodeURIComponent(handle)}` : normalizeSiteUrl(siteUrl);
}

function blouseStatus(product: ProductFeedRow) {
  return blousePieceDisplayText(Boolean(product.has_blouse_piece));
}

function stripHtml(value: unknown) {
  return String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clampText(value: string, maxLength: number) {
  return value.length > maxLength ? value.slice(0, maxLength - 1).trimEnd() : value;
}

function catalogDescription(product: ProductFeedRow) {
  const description = stripHtml(product.short_description || product.description);
  if (description) return clampText(description, 9999);
  const fabric = product.fabric ? `${product.fabric} ` : "";
  const color = product.color ? `${product.color} ` : "";
  return clampText(`${color}${fabric}${product.title || "handcrafted saree"} from Korasutra.`, 9999);
}

function moneyAmount(value: unknown) {
  const amount = Number(value || 0);
  return Number.isFinite(amount) ? amount : 0;
}

function metaMoney(value: unknown) {
  return `${moneyAmount(value).toFixed(2)} ${META_CURRENCY}`;
}

function catalogPrice(product: ProductFeedRow) {
  const price = moneyAmount(product.price);
  const compareAtPrice = moneyAmount(product.compare_at_price);
  return compareAtPrice > price ? compareAtPrice : price;
}

function catalogSalePrice(product: ProductFeedRow) {
  const price = moneyAmount(product.price);
  const compareAtPrice = moneyAmount(product.compare_at_price);
  return compareAtPrice > price ? metaMoney(price) : "";
}

function catalogId(product: ProductFeedRow) {
  return skuList(product)[0] || product.id || product.handle || "";
}

function availability(product: ProductFeedRow) {
  return product.status === "active" && stockTotal(product) > 0 ? "in stock" : "out of stock";
}

function productTag(product: ProductFeedRow, index: number) {
  return (product.tags || []).filter(Boolean)[index] || "";
}

function metaCatalogRow(product: ProductFeedRow, options: ProductFeedOptions) {
  const images = sortedImages(product);
  const videos = sortedVideos(product);
  return [
    catalogId(product),
    product.title || "",
    catalogDescription(product),
    availability(product),
    "new",
    metaMoney(catalogPrice(product)),
    productUrl(product, options.siteUrl),
    images[0] || "",
    META_BRAND,
    META_GOOGLE_PRODUCT_CATEGORY,
    META_FB_PRODUCT_CATEGORY,
    stockTotal(product),
    catalogSalePrice(product),
    "",
    product.id || product.handle || catalogId(product),
    "unisex",
    product.color || "",
    "",
    "adult",
    product.fabric || "",
    product.technique || "",
    "IN::Standard:0.00 INR",
    "",
    "",
    "",
    videos[0] || "",
    videos[0] ? "Product" : "",
    "",
    productTag(product, 0) || product.fabric || "",
    productTag(product, 1) || product.technique || "",
    blouseStatus(product),
  ];
}

export function buildMetaCatalogCsv(products: ProductFeedRow[] = [], options: ProductFeedOptions = {}) {
  const rows = products.map((product) => metaCatalogRow(product, options).map(csvCell).join(","));

  return [
    META_CATALOG_HEADERS.join(","),
    ...rows,
  ].join("\n");
}

function gField(name: string, value: unknown) {
  const text = String(value ?? "");
  return text ? `      <g:${name}>${xmlText(text)}</g:${name}>` : "";
}

export function buildMetaCatalogXml(products: ProductFeedRow[] = [], options: ProductFeedOptions = {}) {
  const entries = products.map((product) => {
    const images = sortedImages(product);
    const videos = sortedVideos(product);
    const additionalImages = images.slice(1, 10)
      .map((image) => gField("additional_image_link", image))
      .filter(Boolean)
      .join("\n");

    return [
      "    <item>",
      gField("id", catalogId(product)),
      gField("title", product.title || ""),
      gField("description", catalogDescription(product)),
      gField("availability", availability(product)),
      gField("condition", "new"),
      gField("price", metaMoney(catalogPrice(product))),
      gField("sale_price", catalogSalePrice(product)),
      gField("link", productUrl(product, options.siteUrl)),
      gField("image_link", images[0] || ""),
      additionalImages,
      gField("brand", META_BRAND),
      gField("google_product_category", META_GOOGLE_PRODUCT_CATEGORY),
      gField("fb_product_category", META_FB_PRODUCT_CATEGORY),
      gField("quantity_to_sell_on_facebook", stockTotal(product)),
      gField("item_group_id", product.id || product.handle || catalogId(product)),
      gField("gender", "unisex"),
      gField("color", product.color || ""),
      gField("age_group", "adult"),
      gField("material", product.fabric || ""),
      gField("pattern", product.technique || ""),
      gField("shipping", "IN::Standard:0.00 INR"),
      gField("video", videos[0] || ""),
      gField("custom_label_0", productTag(product, 0) || product.fabric || ""),
      gField("custom_label_1", productTag(product, 1) || product.technique || ""),
      gField("style", blouseStatus(product)),
      "    </item>",
    ].filter(Boolean).join("\n");
  }).join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
    "  <channel>",
    "    <title>Korasutra Meta Catalog</title>",
    "    <link>https://korasutra.com</link>",
    "    <description>Live product catalog for Meta Commerce Manager.</description>",
    entries,
    "  </channel>",
    "</rss>",
  ].join("\n");
}

export const buildProductExportCsv = buildMetaCatalogCsv;
export const buildProductFeedXml = buildMetaCatalogXml;
