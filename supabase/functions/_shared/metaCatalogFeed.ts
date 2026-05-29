type FeedImage = { url?: string | null; position?: number | null };
type FeedVideo = { url?: string | null; position?: number | null };
type FeedVariant = { sku?: string | null; inventory_qty?: number | string | null; position?: number | null };

export type MetaCatalogProduct = {
  id?: string | null;
  handle?: string | null;
  title?: string | null;
  description?: string | null;
  short_description?: string | null;
  status?: string | null;
  price?: number | string | null;
  compare_at_price?: number | string | null;
  fabric?: string | null;
  technique?: string | null;
  color?: string | null;
  has_blouse_piece?: boolean | null;
  tags?: string[] | null;
  product_images?: FeedImage[] | null;
  product_videos?: FeedVideo[] | null;
  product_variants?: FeedVariant[] | null;
};

const headers = [
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

function normalizeSiteUrl(siteUrl = "https://korasutra.com") {
  return siteUrl.replace(/\/+$/, "");
}

function productUrl(product: MetaCatalogProduct, siteUrl?: string) {
  return `${normalizeSiteUrl(siteUrl)}/products/${encodeURIComponent(String(product.handle || "").trim())}`;
}

function sortedImages(product: MetaCatalogProduct) {
  return [...(product.product_images || [])].sort((a, b) => Number(a.position || 0) - Number(b.position || 0)).map((image) => String(image.url || "").trim()).filter(Boolean);
}

function sortedVideos(product: MetaCatalogProduct) {
  return [...(product.product_videos || [])].sort((a, b) => Number(a.position || 0) - Number(b.position || 0)).map((video) => String(video.url || "").trim()).filter(Boolean);
}

function sortedVariants(product: MetaCatalogProduct) {
  return [...(product.product_variants || [])].sort((a, b) => Number(a.position || 0) - Number(b.position || 0));
}

function stock(product: MetaCatalogProduct) {
  return sortedVariants(product).reduce((sum, variant) => sum + Number(variant.inventory_qty || 0), 0);
}

function sku(product: MetaCatalogProduct) {
  return sortedVariants(product).map((variant) => String(variant.sku || "").trim()).find(Boolean) || product.id || product.handle || "";
}

function money(value: unknown) {
  const amount = Number(value || 0);
  return `${(Number.isFinite(amount) ? amount : 0).toFixed(2)} INR`;
}

function priceAmount(product: MetaCatalogProduct) {
  const price = Number(product.price || 0);
  const compareAt = Number(product.compare_at_price || 0);
  return compareAt > price ? compareAt : price;
}

function salePrice(product: MetaCatalogProduct) {
  const price = Number(product.price || 0);
  const compareAt = Number(product.compare_at_price || 0);
  return compareAt > price ? money(price) : "";
}

function stripHtml(value: unknown) {
  return String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function description(product: MetaCatalogProduct) {
  return stripHtml(product.short_description || product.description || `${product.title || "Handcrafted saree"} from Korasutra.`);
}

function blouseText(product: MetaCatalogProduct) {
  return product.has_blouse_piece ? "Blouse Piece Included" : "Blouse Piece Not Included";
}

function tag(product: MetaCatalogProduct, index: number) {
  return (product.tags || []).filter(Boolean)[index] || "";
}

function row(product: MetaCatalogProduct, siteUrl?: string) {
  const images = sortedImages(product);
  const videos = sortedVideos(product);
  return [
    sku(product),
    product.title || "",
    description(product),
    product.status === "active" && stock(product) > 0 ? "in stock" : "out of stock",
    "new",
    money(priceAmount(product)),
    productUrl(product, siteUrl),
    images[0] || "",
    "Korasutra",
    "Apparel & Accessories > Clothing > Traditional & Ceremonial Clothing > Saris",
    "Clothing & Accessories > Clothing",
    stock(product),
    salePrice(product),
    "",
    product.id || product.handle || sku(product),
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
    tag(product, 0) || product.fabric || "",
    tag(product, 1) || product.technique || "",
    blouseText(product),
  ];
}

export function buildMetaCatalogCsv(products: MetaCatalogProduct[], siteUrl?: string) {
  return [headers.join(","), ...products.map((product) => row(product, siteUrl).map(csvCell).join(","))].join("\n");
}

function g(name: string, value: unknown) {
  const text = String(value ?? "");
  return text ? `      <g:${name}>${xmlText(text)}</g:${name}>` : "";
}

export function buildMetaCatalogXml(products: MetaCatalogProduct[], siteUrl?: string) {
  const items = products.map((product) => {
    const images = sortedImages(product);
    const videos = sortedVideos(product);
    return [
      "    <item>",
      g("id", sku(product)),
      g("title", product.title || ""),
      g("description", description(product)),
      g("availability", product.status === "active" && stock(product) > 0 ? "in stock" : "out of stock"),
      g("condition", "new"),
      g("price", money(priceAmount(product))),
      g("sale_price", salePrice(product)),
      g("link", productUrl(product, siteUrl)),
      g("image_link", images[0] || ""),
      ...images.slice(1, 10).map((image) => g("additional_image_link", image)),
      g("brand", "Korasutra"),
      g("google_product_category", "Apparel & Accessories > Clothing > Traditional & Ceremonial Clothing > Saris"),
      g("fb_product_category", "Clothing & Accessories > Clothing"),
      g("quantity_to_sell_on_facebook", stock(product)),
      g("item_group_id", product.id || product.handle || sku(product)),
      g("gender", "unisex"),
      g("color", product.color || ""),
      g("age_group", "adult"),
      g("material", product.fabric || ""),
      g("pattern", product.technique || ""),
      g("shipping", "IN::Standard:0.00 INR"),
      g("video", videos[0] || ""),
      g("custom_label_0", tag(product, 0) || product.fabric || ""),
      g("custom_label_1", tag(product, 1) || product.technique || ""),
      g("style", blouseText(product)),
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
    items,
    "  </channel>",
    "</rss>",
  ].join("\n");
}
