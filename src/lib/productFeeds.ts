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

export type ProductFeedRow = {
  id?: string | null;
  handle?: string | null;
  title?: string | null;
  category?: { name?: string | null; slug?: string | null } | null;
  status?: string | null;
  price?: number | string | null;
  compare_at_price?: number | string | null;
  fabric?: string | null;
  technique?: string | null;
  color?: string | null;
  has_blouse_piece?: boolean | null;
  product_images?: ProductFeedImage[] | null;
  product_variants?: ProductFeedVariant[] | null;
};

type ProductFeedOptions = {
  siteUrl?: string;
};

const PRODUCT_EXPORT_HEADERS = [
  "ID",
  "Handle",
  "Title",
  "Category",
  "Status",
  "Price",
  "Compare-at Price",
  "Stock",
  "Fabric",
  "Technique",
  "Color",
  "Blouse Piece",
  "Product URL",
  "Image URLs",
  "SKUs",
];

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

export function buildProductExportCsv(products: ProductFeedRow[] = [], options: ProductFeedOptions = {}) {
  const rows = products.map((product) => [
    product.id || "",
    product.handle || "",
    product.title || "",
    product.category?.name || product.category?.slug || "",
    product.status || "",
    product.price ?? "",
    product.compare_at_price ?? "",
    stockTotal(product),
    product.fabric || "",
    product.technique || "",
    product.color || "",
    blouseStatus(product),
    productUrl(product, options.siteUrl),
    sortedImages(product).join(", "),
    skuList(product).join(", "),
  ].map(csvCell).join(","));

  return [
    PRODUCT_EXPORT_HEADERS.join(","),
    ...rows,
  ].join("\n");
}

export function buildProductFeedXml(products: ProductFeedRow[] = [], options: ProductFeedOptions = {}) {
  const entries = products.map((product) => {
    const images = sortedImages(product)
      .map((image) => `    <image>${xmlText(image)}</image>`)
      .join("\n");
    const skus = skuList(product)
      .map((sku) => `    <sku>${xmlText(sku)}</sku>`)
      .join("\n");

    return [
      "  <product>",
      `    <id>${xmlText(product.id || "")}</id>`,
      `    <handle>${xmlText(product.handle || "")}</handle>`,
      `    <title>${xmlText(product.title || "")}</title>`,
      `    <category>${xmlText(product.category?.name || product.category?.slug || "")}</category>`,
      `    <status>${xmlText(product.status || "")}</status>`,
      `    <price>${xmlText(product.price ?? "")}</price>`,
      `    <compare_at_price>${xmlText(product.compare_at_price ?? "")}</compare_at_price>`,
      `    <stock>${xmlText(stockTotal(product))}</stock>`,
      `    <fabric>${xmlText(product.fabric || "")}</fabric>`,
      `    <technique>${xmlText(product.technique || "")}</technique>`,
      `    <color>${xmlText(product.color || "")}</color>`,
      `    <blouse_piece>${xmlText(blouseStatus(product))}</blouse_piece>`,
      `    <url>${xmlText(productUrl(product, options.siteUrl))}</url>`,
      images,
      skus,
      "  </product>",
    ].filter(Boolean).join("\n");
  }).join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    "<products>",
    entries,
    "</products>",
  ].join("\n");
}
