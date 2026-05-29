/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/integrations/supabase/client";
import { loadLocalProductByHandle, loadLocalShopifyProducts } from "@/lib/localCommerce";
import { textMatchesCatalogQuery } from "@/lib/catalogTaxonomy";

export interface ShopifyProduct {
  node: {
    id: string;
    title: string;
    description: string;
    handle: string;
    tags?: string[];
    seoTitle?: string | null;
    seoDescription?: string | null;
    fabric?: string | null;
    technique?: string | null;
    color?: string | null;
    hasBlousePiece?: boolean;
    category?: {
      slug: string | null;
      name: string | null;
    } | null;
    priceRange: {
      minVariantPrice: {
        amount: string;
        currencyCode: string;
      };
      minVariantCompareAtPrice?: {
        amount: string;
        currencyCode: string;
      } | null;
    };
    images: {
      edges: Array<{
        node: {
          url: string;
          altText: string | null;
        };
      }>;
    };
    videos?: {
      edges: Array<{
        node: {
          url: string;
          altText: string | null;
          contentType: string | null;
        };
      }>;
    };
    variants: {
      edges: Array<{
        node: {
          id: string;
          title: string;
          sku: string | null;
          price: {
            amount: string;
            currencyCode: string;
          };
          compareAtPrice?: {
            amount: string;
            currencyCode: string;
          } | null;
          availableForSale: boolean;
          quantityAvailable: number | null;
          selectedOptions: Array<{
            name: string;
            value: string;
          }>;
        };
      }>;
    };
    options: Array<{
      name: string;
      values: string[];
    }>;
  };
}

type CatalogProductRow = {
  id: string;
  title: string;
  description: string | null;
  handle: string;
  tags: string[] | null;
  seo_title?: string | null;
  seo_description?: string | null;
  price: number | string;
  compare_at_price: number | string | null;
  fabric: string | null;
  technique: string | null;
  color: string | null;
  has_blouse_piece: boolean;
  category?: { slug: string | null; name: string | null } | null;
  product_images?: Array<{ url: string; alt_text: string | null; position: number }>;
  product_videos?: Array<{ url: string; alt_text: string | null; position: number; content_type: string | null }>;
  product_variants?: Array<{
    id: string;
    sku: string | null;
    title: string;
    option1_name: string | null;
    option1_value: string | null;
    option2_name: string | null;
    option2_value: string | null;
    price: number | string | null;
    compare_at_price: number | string | null;
    inventory_qty: number;
    track_inventory: boolean;
    position: number;
  }>;
};

function normalizeAmount(value: number | string | null | undefined) {
  return Number(value || 0).toFixed(2);
}

function moneyOrNull(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
}

function compareAtMoney(price: number | string | null | undefined, compareAtPrice: number | string | null | undefined) {
  const priceAmount = moneyOrNull(price) ?? 0;
  const compareAtAmount = moneyOrNull(compareAtPrice);
  return compareAtAmount !== null && compareAtAmount > priceAmount
    ? { amount: normalizeAmount(compareAtAmount), currencyCode: "INR" }
    : null;
}

function selectedOptionsForVariant(variant: CatalogProductRow["product_variants"][number]) {
  return [
    variant.option1_name && variant.option1_value ? { name: variant.option1_name, value: variant.option1_value } : null,
    variant.option2_name && variant.option2_value ? { name: variant.option2_name, value: variant.option2_value } : null,
  ].filter(Boolean) as Array<{ name: string; value: string }>;
}

function buildOptions(variants: CatalogProductRow["product_variants"] = []) {
  const optionMap = new Map<string, Set<string>>();

  variants.forEach((variant) => {
    selectedOptionsForVariant(variant).forEach((option) => {
      if (!optionMap.has(option.name)) optionMap.set(option.name, new Set());
      optionMap.get(option.name)?.add(option.value);
    });
  });

  return Array.from(optionMap.entries()).map(([name, values]) => ({
    name,
    values: Array.from(values),
  }));
}

export function mapCatalogProduct(row: CatalogProductRow): ShopifyProduct {
  const images = [...(row.product_images || [])].sort((a, b) => a.position - b.position);
  const variants = [...(row.product_variants || [])].sort((a, b) => a.position - b.position);
  const firstVariant = variants[0];
  const minPriceVariant = variants.length ? variants.reduce((lowest, variant) => {
    const variantPrice = Number(variant.price ?? row.price);
    const lowestPrice = Number(lowest.price ?? row.price);
    return variantPrice < lowestPrice ? variant : lowest;
  }, variants[0]) : undefined;
  const minPrice = variants.reduce((min, variant) => {
    const price = Number(variant.price ?? row.price);
    return Math.min(min, price);
  }, Number(firstVariant?.price ?? row.price));
  const minVariantCompareAtPrice = compareAtMoney(
    minPrice,
    minPriceVariant?.compare_at_price ?? row.compare_at_price,
  );

  return {
    node: {
      id: row.id,
      title: row.title,
      description: row.description || "",
      handle: row.handle,
      fabric: row.fabric,
      technique: row.technique,
      color: row.color,
      hasBlousePiece: Boolean(row.has_blouse_piece),
      category: row.category || null,
      tags: [
        ...(row.tags || []),
        row.fabric,
        row.technique,
        row.color,
        row.category?.slug,
        row.category?.name,
        row.has_blouse_piece ? "with blouse" : null,
      ].filter(Boolean) as string[],
      seoTitle: row.seo_title,
      seoDescription: row.seo_description,
      priceRange: {
        minVariantPrice: {
          amount: normalizeAmount(minPrice),
          currencyCode: "INR",
        },
        minVariantCompareAtPrice,
      },
      images: {
        edges: images.map((image) => ({
          node: {
            url: image.url,
            altText: image.alt_text,
          },
        })),
      },
      videos: {
        edges: [...(row.product_videos || [])].sort((a, b) => a.position - b.position).map((video) => ({
          node: {
            url: video.url,
            altText: video.alt_text,
            contentType: video.content_type || "video/mp4",
          },
        })),
      },
      variants: {
        edges: variants.map((variant) => ({
          node: {
            id: variant.id,
            title: variant.title || "Default",
            sku: variant.sku,
            price: {
              amount: normalizeAmount(variant.price ?? row.price),
              currencyCode: "INR",
            },
            compareAtPrice: compareAtMoney(
              variant.price ?? row.price,
              variant.compare_at_price ?? row.compare_at_price,
            ),
            availableForSale: !variant.track_inventory || variant.inventory_qty > 0,
            quantityAvailable: variant.track_inventory ? Number(variant.inventory_qty || 0) : null,
            selectedOptions: selectedOptionsForVariant(variant),
          },
        })),
      },
      options: buildOptions(variants),
    },
  };
}

export function productHasRenderableImage(product: ShopifyProduct) {
  return product.node.images.edges.some((edge) => Boolean(edge.node.url?.trim()));
}

export function filterProductsWithImages(products: ShopifyProduct[]) {
  return products.filter(productHasRenderableImage);
}

function baseProductSelect() {
  return "id, title, description, handle, tags, seo_title, seo_description, price, compare_at_price, fabric, technique, color, has_blouse_piece, category:categories(slug, name), product_images(url, alt_text, position), product_videos(url, alt_text, position, content_type), product_variants(id, sku, title, option1_name, option1_value, option2_name, option2_value, price, compare_at_price, inventory_qty, track_inventory, position)";
}

export async function fetchProducts(first: number = 20, query?: string): Promise<ShopifyProduct[]> {
  try {
    const requestLimit = query?.trim() ? Math.max(first, 500) : Math.max(first, 100);
    const request = (supabase as any)
      .from("products")
      .select(baseProductSelect())
      .eq("status", "active")
      .order("position", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(requestLimit);

    const { data, error } = await request;
    if (error) throw error;
    if (!data?.length) return filterProductsWithImages(await loadLocalShopifyProducts(first, query));
    const rows = query?.trim()
      ? data.filter((row: CatalogProductRow) => textMatchesCatalogQuery(`${row.title} ${row.description || ""} ${row.fabric || ""} ${row.technique || ""} ${row.color || ""} ${row.category?.slug || ""} ${row.category?.name || ""}`, row.tags || [], query))
      : data;
    return filterProductsWithImages(rows.map(mapCatalogProduct)).slice(0, first);
  } catch (error) {
    console.error("Error fetching catalog products:", error);
    return filterProductsWithImages(await loadLocalShopifyProducts(first, query));
  }
}

export async function fetchProductByHandle(handle: string): Promise<ShopifyProduct["node"] | null> {
  try {
    const { data, error } = await (supabase as any)
      .from("products")
      .select(baseProductSelect())
      .eq("handle", handle)
      .eq("status", "active")
      .single();

    if (error || !data) return loadLocalProductByHandle(handle);
    const product = mapCatalogProduct(data);
    return productHasRenderableImage(product) ? product.node : null;
  } catch (error) {
    console.error("Error fetching catalog product:", error);
    return loadLocalProductByHandle(handle);
  }
}

export async function createStorefrontCheckout(): Promise<string> {
  return "/checkout";
}

export function formatPrice(amount: string, currencyCode: string = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currencyCode,
  }).format(parseFloat(amount));
}
