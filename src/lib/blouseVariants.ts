export const BLOUSE_SIZES = ["34", "36", "38", "40", "42", "44", "46"] as const;

export type BlouseSize = typeof BLOUSE_SIZES[number];

export type BlouseSizeRow = {
  size: BlouseSize;
  enabled: boolean;
  sku: string;
  inventoryQty: string;
};

type SavedProductVariant = {
  sku?: string | null;
  title?: string | null;
  option1_name?: string | null;
  option1_value?: string | null;
  inventory_qty?: number | string | null;
};

type BuildAdminProductVariantsInput = {
  categorySlug: string;
  handle: string;
  sku: string;
  inventoryQty: string;
  price: string;
  compareAtPrice: string;
  blouseSizeRows: BlouseSizeRow[];
};

export type AdminProductVariantInput = {
  sku: string;
  title: string;
  option1Name?: string;
  option1Value?: string;
  price: number;
  compareAtPrice: number | null;
  inventoryQty: number;
  trackInventory: true;
  position: number;
};

function supportedSize(value: unknown): BlouseSize | null {
  const normalized = String(value || "").trim();
  return BLOUSE_SIZES.includes(normalized as BlouseSize) ? normalized as BlouseSize : null;
}

function sizeFromVariant(variant: SavedProductVariant) {
  if (String(variant.option1_name || "").trim().toLowerCase() === "size") {
    return supportedSize(variant.option1_value);
  }

  return supportedSize(String(variant.title || "").match(/\b(34|36|38|40|42|44|46)\b/)?.[1]);
}

function inventoryQuantity(value: string | number | null | undefined) {
  const quantity = Math.floor(Number(value || 0));
  return Number.isFinite(quantity) ? Math.max(0, quantity) : 0;
}

function skuPart(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function createBlouseSizeRows(variants: SavedProductVariant[] = []): BlouseSizeRow[] {
  const variantBySize = new Map<BlouseSize, SavedProductVariant>();

  variants.forEach((variant) => {
    const size = sizeFromVariant(variant);
    if (size) variantBySize.set(size, variant);
  });

  return BLOUSE_SIZES.map((size) => {
    const variant = variantBySize.get(size);
    return {
      size,
      enabled: Boolean(variant),
      sku: String(variant?.sku || ""),
      inventoryQty: variant ? String(inventoryQuantity(variant.inventory_qty)) : "0",
    };
  });
}

export function buildAdminProductVariants({
  categorySlug,
  handle,
  sku,
  inventoryQty,
  price,
  compareAtPrice,
  blouseSizeRows,
}: BuildAdminProductVariantsInput): AdminProductVariantInput[] {
  const productPrice = Number(price || 0);
  const productCompareAtPrice = compareAtPrice ? Number(compareAtPrice) : null;
  const normalizedHandle = skuPart(handle) || "BLOUSE";

  if (categorySlug !== "blouses") {
    return [{
      sku: sku.trim() || `KS-${normalizedHandle}`,
      title: "Default",
      price: productPrice,
      compareAtPrice: productCompareAtPrice,
      inventoryQty: inventoryQuantity(inventoryQty),
      trackInventory: true,
      position: 0,
    }];
  }

  const selectedRows = blouseSizeRows.filter((row) => row.enabled);
  if (!selectedRows.length) throw new Error("Select at least one blouse size");

  return selectedRows.map((row, position) => ({
    sku: row.sku.trim() || `KS-${normalizedHandle}-${row.size}`,
    title: `Size ${row.size}`,
    option1Name: "Size",
    option1Value: row.size,
    price: productPrice,
    compareAtPrice: productCompareAtPrice,
    inventoryQty: inventoryQuantity(row.inventoryQty),
    trackInventory: true,
    position,
  }));
}
