/* eslint-disable @typescript-eslint/no-explicit-any */
import { AdminImportProduct, parseShopifyProductsCsv } from "@/lib/shopifyCsv";
import type { ShopifyProduct } from "@/lib/shopify";
import { textMatchesCatalogQuery } from "@/lib/catalogTaxonomy";
import { cacheSiteSettings, defaultSiteSettings, readCachedSiteSettings, type SiteSettings } from "@/lib/siteSettings";

const LOCAL_PRODUCTS_KEY = "ks_local_products";
const LOCAL_COUPONS_KEY = "ks_local_coupons";
const LOCAL_ADMIN_HASH_KEY = "ks_local_admin_hash";
const LOCAL_ADMIN_HASH = "9d3bfeceeeab8f06130d094b83f2bd5f574dc495ab1c6927ad5f77ed8d0d3061";
const LOCAL_ADMIN_USERNAME = "korasutra.official@gmail.com";
const CSV_PATH = "/products_export_1.csv";

export type LocalAdminData = {
  admin: { username: string; mode: "local" };
  orders: any[];
  products: any[];
  customers: any[];
  inventory: any[];
  coupons: any[];
  siteSettings: SiteSettings;
  categories: Array<{ id: string; slug: string; name: string; sort_order: number }>;
};

async function sha256(value: string) {
  const data = new TextEncoder().encode(value);
  const buffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buffer)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function categoryFor(slug: string) {
  return slug === "blouses"
    ? { id: "local-category-blouses", slug: "blouses", name: "Blouses", sort_order: 2 }
    : { id: "local-category-sarees", slug: "sarees", name: "Sarees", sort_order: 1 };
}

function productToAdminRow(product: AdminImportProduct & { videos?: any[] }, index: number) {
  const category = categoryFor(product.categorySlug);
  const id = `local-product-${product.handle}`;

  return {
    id,
    handle: product.handle,
    title: product.title,
    description: product.description,
    short_description: product.shortDescription,
    category_id: category.id,
    category,
    fabric: product.fabric,
    technique: product.technique,
    color: product.color,
    has_blouse_piece: product.hasBlousePiece,
    price: product.price,
    compare_at_price: product.compareAtPrice,
    status: product.status,
    seo_title: product.seoTitle,
    seo_description: product.seoDescription,
    tags: product.tags,
    position: index,
    created_at: new Date(2026, 0, 1, 0, index).toISOString(),
    updated_at: new Date().toISOString(),
    product_images: product.images.map((image, imageIndex) => ({
      id: `local-image-${product.handle}-${imageIndex}`,
      product_id: id,
      url: image.url,
      alt_text: image.altText || product.title,
      position: imageIndex,
    })),
    product_videos: (product.videos || []).map((video: any, videoIndex: number) => ({
      id: `local-video-${product.handle}-${videoIndex}`,
      product_id: id,
      url: video.url,
      alt_text: video.altText || product.title,
      position: videoIndex,
      content_type: video.contentType || "video/mp4",
      storage_key: video.storageKey || null,
    })),
    product_variants: product.variants.map((variant, variantIndex) => ({
      id: `local-variant-${variant.sku || product.handle}-${variantIndex}`,
      product_id: id,
      sku: variant.sku || `KS-${product.handle}-${variantIndex + 1}`,
      title: variant.title || "Default",
      option1_name: variant.option1Name,
      option1_value: variant.option1Value,
      option2_name: variant.option2Name,
      option2_value: variant.option2Value,
      price: variant.price || product.price,
      compare_at_price: variant.compareAtPrice,
      inventory_qty: Math.max(variant.inventoryQty, 1),
      track_inventory: variant.trackInventory,
      position: variant.position ?? variantIndex,
      product: { title: product.title, handle: product.handle },
    })),
  };
}

export function adminRowToShopifyProduct(row: any): ShopifyProduct {
  const images = [...(row.product_images || [])].sort((a, b) => a.position - b.position);
  const variants = [...(row.product_variants || [])].sort((a, b) => a.position - b.position);
  const firstVariant = variants[0];
  const minPrice = variants.reduce((min, variant) => Math.min(min, Number(variant.price ?? row.price)), Number(firstVariant?.price ?? row.price));

  return {
    node: {
      id: row.id,
      title: row.title,
      description: row.description || "",
      handle: row.handle,
      tags: [row.fabric, row.technique, row.color, ...(row.tags || []), row.has_blouse_piece ? "with blouse" : null].filter(Boolean),
      priceRange: {
        minVariantPrice: {
          amount: Number(minPrice || row.price || 0).toFixed(2),
          currencyCode: "INR",
        },
      },
      images: {
        edges: images.map((image) => ({
          node: { url: image.url, altText: image.alt_text || row.title },
        })),
      },
      videos: {
        edges: [...(row.product_videos || [])].sort((a, b) => a.position - b.position).map((video) => ({
          node: { url: video.url, altText: video.alt_text || row.title, contentType: video.content_type || "video/mp4" },
        })),
      },
      variants: {
        edges: variants.map((variant) => ({
          node: {
            id: variant.id,
            title: variant.title || "Default",
            sku: variant.sku,
            price: {
              amount: Number(variant.price ?? row.price ?? 0).toFixed(2),
              currencyCode: "INR",
            },
            availableForSale: !variant.track_inventory || Number(variant.inventory_qty || 0) > 0,
            selectedOptions: [
              variant.option1_name && variant.option1_value ? { name: variant.option1_name, value: variant.option1_value } : null,
              variant.option2_name && variant.option2_value ? { name: variant.option2_name, value: variant.option2_value } : null,
            ].filter(Boolean) as Array<{ name: string; value: string }>,
          },
        })),
      },
      options: buildOptions(variants),
    },
  };
}

function buildOptions(variants: any[]) {
  const options = new Map<string, Set<string>>();
  variants.forEach((variant) => {
    [
      variant.option1_name && variant.option1_value ? { name: variant.option1_name, value: variant.option1_value } : null,
      variant.option2_name && variant.option2_value ? { name: variant.option2_name, value: variant.option2_value } : null,
    ].filter(Boolean).forEach((option: any) => {
      if (!options.has(option.name)) options.set(option.name, new Set());
      options.get(option.name)?.add(option.value);
    });
  });
  return Array.from(options.entries()).map(([name, values]) => ({ name, values: Array.from(values) }));
}

function readStoredProducts() {
  try {
    const raw = localStorage.getItem(LOCAL_PRODUCTS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStoredProducts(products: any[]) {
  localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(products));
}

function readStoredCoupons() {
  try {
    const raw = localStorage.getItem(LOCAL_COUPONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeStoredCoupons(coupons: any[]) {
  localStorage.setItem(LOCAL_COUPONS_KEY, JSON.stringify(coupons));
}

function readStoredSiteSettings(): SiteSettings {
  return readCachedSiteSettings() || defaultSiteSettings;
}

function writeStoredSiteSettings(settings: SiteSettings) {
  cacheSiteSettings(settings);
}

function normalizeStoredProducts(products: any[]) {
  return products.map((product) => ({
    ...product,
    status: product.status === "archived" ? "archived" : "active",
    product_variants: (product.product_variants || []).map((variant: any) => ({
      ...variant,
      inventory_qty: Math.max(Number(variant.inventory_qty || 0), 1),
    })),
  }));
}

export async function loadLocalAdminProducts() {
  const stored = readStoredProducts();
  if (Array.isArray(stored) && stored.length) {
    const normalized = normalizeStoredProducts(stored);
    writeStoredProducts(normalized);
    return normalized;
  }

  const response = await fetch(CSV_PATH, { cache: "no-store" });
  if (!response.ok) throw new Error("Local product CSV is unavailable");
  const csv = await response.text();
  const products = normalizeStoredProducts(parseShopifyProductsCsv(csv).map(productToAdminRow));
  writeStoredProducts(products);
  return products;
}

export async function loadLocalShopifyProducts(first = 100, query?: string): Promise<ShopifyProduct[]> {
  const rows = await loadLocalAdminProducts();
  const normalizedQuery = query?.trim().toLowerCase();
  const filtered = rows.filter((product) => {
    if (product.status !== "active") return false;
    if (!normalizedQuery) return true;
    return textMatchesCatalogQuery(`${product.title} ${product.description} ${product.fabric} ${product.technique} ${product.color}`, product.tags, normalizedQuery);
  });
  return filtered.slice(0, first).map(adminRowToShopifyProduct);
}

export async function loadLocalProductByHandle(handle: string) {
  const products = await loadLocalShopifyProducts(500);
  return products.find((product) => product.node.handle === handle)?.node || null;
}

export async function canUseLocalAdmin(username: string, password: string) {
  const storedHash = localStorage.getItem(LOCAL_ADMIN_HASH_KEY) || LOCAL_ADMIN_HASH;
  return username.trim().toLowerCase() === LOCAL_ADMIN_USERNAME && await sha256(password) === storedHash;
}

export async function loadLocalAdminData(): Promise<LocalAdminData> {
  const products = await loadLocalAdminProducts();
  const inventory = products.flatMap((product) => product.product_variants);
  return {
    admin: { username: LOCAL_ADMIN_USERNAME, mode: "local" },
    orders: [],
    products,
    customers: [],
    inventory,
    coupons: readStoredCoupons(),
    siteSettings: readStoredSiteSettings(),
    categories: [categoryFor("sarees"), categoryFor("blouses")],
  };
}

export async function saveLocalProduct(product: any) {
  const products = await loadLocalAdminProducts();
  const importProduct: AdminImportProduct & { videos?: any[] } = {
    handle: product.handle,
    title: product.title,
    description: product.description || "",
    shortDescription: product.shortDescription || "",
    categorySlug: product.categorySlug || "sarees",
    price: Number(product.price || 0),
    compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
    fabric: product.fabric || "",
    technique: product.technique || "",
    color: product.color || "",
    status: product.status || "draft",
    hasBlousePiece: Boolean(product.hasBlousePiece),
    seoTitle: product.seoTitle || "",
    seoDescription: product.seoDescription || "",
    tags: product.tags || [],
    images: product.images || [],
    videos: product.videos || [],
    variants: product.variant ? [product.variant] : product.variants || [],
  };
  const row = productToAdminRow(importProduct, products.length);
  const existingIndex = products.findIndex((item) => item.handle === row.handle);
  if (existingIndex >= 0) products[existingIndex] = { ...products[existingIndex], ...row, id: products[existingIndex].id };
  else products.unshift(row);
  writeStoredProducts(products);
  return row.id;
}

export async function changeLocalAdminPassword(currentPassword: string, newPassword: string) {
  if (!await canUseLocalAdmin(LOCAL_ADMIN_USERNAME, currentPassword)) {
    throw new Error("Current password is incorrect");
  }
  localStorage.setItem(LOCAL_ADMIN_HASH_KEY, await sha256(newPassword));
  return { success: true };
}

export async function adjustLocalInventory(variantId: string, delta: number) {
  const products = await loadLocalAdminProducts();
  let nextQty: number | null = null;

  const updated = products.map((product) => ({
    ...product,
    product_variants: product.product_variants.map((variant: any) => {
      if (variant.id !== variantId) return variant;
      nextQty = Math.max(0, Number(variant.inventory_qty || 0) + delta);
      return { ...variant, inventory_qty: nextQty };
    }),
  }));

  if (nextQty === null) throw new Error("Variant not found");
  writeStoredProducts(updated);
  return { success: true, inventoryQty: nextQty };
}

export async function importLocalProducts(products: AdminImportProduct[]) {
  const rows = products.map(productToAdminRow);
  const existing = await loadLocalAdminProducts();
  const merged = [...existing];
  rows.forEach((row) => {
    const index = merged.findIndex((item) => item.handle === row.handle);
    if (index >= 0) merged[index] = { ...merged[index], ...row, id: merged[index].id };
    else merged.push(row);
  });
  writeStoredProducts(merged);
  return { success: true, imported: rows.length, failed: [] };
}

export async function saveLocalCoupon(coupon: any) {
  const code = String(coupon.code || "").trim().replace(/\s+/g, "").toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9_-]{2,39}$/.test(code)) throw new Error("Coupon code must be 3-40 letters, numbers, dashes, or underscores");
  const coupons = readStoredCoupons();
  const row = {
    id: coupon.id || `local-coupon-${code}`,
    code,
    description: coupon.description || "",
    status: coupon.status || "active",
    discount_type: coupon.discountType || "percentage",
    discount_value: Number(coupon.discountValue || 0),
    min_order_value: coupon.minOrderValue ? Number(coupon.minOrderValue) : null,
    max_discount_cap: coupon.maxDiscountCap ? Number(coupon.maxDiscountCap) : null,
    usage_limit_total: coupon.usageLimitTotal ? Number(coupon.usageLimitTotal) : null,
    usage_limit_per_customer: coupon.usageLimitPerCustomer ? Number(coupon.usageLimitPerCustomer) : null,
    usage_count: Number(coupon.usageCount || 0),
    first_order_only: Boolean(coupon.firstOrderOnly),
    start_at: coupon.startAt || null,
    end_at: coupon.neverExpires ? null : coupon.endAt || null,
    never_expires: Boolean(coupon.neverExpires),
    applies_to: coupon.appliesTo || "all",
    included_product_ids: coupon.includedProductIds || [],
    included_category_slugs: coupon.includedCategorySlugs || [],
    included_tags: coupon.includedTags || [],
    excluded_product_ids: coupon.excludedProductIds || [],
    excluded_category_slugs: coupon.excludedCategorySlugs || [],
    exclude_sale_items: Boolean(coupon.excludeSaleItems),
    can_combine_with_coupons: Boolean(coupon.canCombineWithCoupons),
    can_combine_with_sale_prices: coupon.canCombineWithSalePrices !== false,
    auto_apply: Boolean(coupon.autoApply),
    display_on_website: Boolean(coupon.displayOnWebsite),
    priority: Number(coupon.priority || 0),
    buy_quantity: coupon.buyQuantity ? Number(coupon.buyQuantity) : null,
    get_quantity: coupon.getQuantity ? Number(coupon.getQuantity) : null,
    coupon_redemptions: [],
    created_at: coupon.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const index = coupons.findIndex((item: any) => item.code === code || item.id === row.id);
  if (index >= 0) coupons[index] = { ...coupons[index], ...row, id: coupons[index].id };
  else coupons.unshift(row);
  writeStoredCoupons(coupons);
  return row.id;
}

export async function deleteLocalCoupon(couponId: string) {
  writeStoredCoupons(readStoredCoupons().filter((coupon: any) => coupon.id !== couponId));
  return { success: true };
}

export async function saveLocalSiteSettings(settings: SiteSettings) {
  writeStoredSiteSettings(settings);
  return { success: true, siteSettings: settings };
}
