export const BLOUSE_SIZES = ["34", "36", "38", "40", "42", "44", "46"] as const;
export const MAX_BLOUSE_VARIANTS = 250;

export type BlouseSize = typeof BLOUSE_SIZES[number];

export type BlouseSizeRow = {
  size: BlouseSize;
  enabled: boolean;
  sku: string;
  inventoryQty: string;
};

export type BlouseOptionInputs = {
  sleeves: string;
  necks: string;
  closeTypes: string;
};

export type BlouseVariantRow = {
  key: string;
  size: string;
  sleeves: string;
  neck: string;
  closeType: string;
  sku: string;
  inventoryQty: string;
};

// A saved blouse variant that does not fit the four-option (Size / Sleeves / Neck /
// Close Type) model — e.g. legacy blouses with only a Size option or a bare "Default"
// variant. These stay editable for stock without being forced into the option matrix.
export type BlouseSimpleVariantRow = {
  key: string;
  sku: string;
  title: string;
  inventoryQty: string;
  optionPairs: Array<{ name: string; value: string }>;
};

type SavedProductVariant = {
  sku?: string | null;
  title?: string | null;
  option1_name?: string | null;
  option1_value?: string | null;
  option2_name?: string | null;
  option2_value?: string | null;
  option3_name?: string | null;
  option3_value?: string | null;
  option4_name?: string | null;
  option4_value?: string | null;
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
  blouseOptionInputs?: BlouseOptionInputs;
  blouseVariantRows?: BlouseVariantRow[];
  blouseSimpleRows?: BlouseSimpleVariantRow[];
};

export type AdminProductVariantInput = {
  sku: string;
  title: string;
  option1Name?: string;
  option1Value?: string;
  option2Name?: string;
  option2Value?: string;
  option3Name?: string;
  option3Value?: string;
  option4Name?: string;
  option4Value?: string;
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

function presentOptionPairs(variant: SavedProductVariant) {
  return [
    [variant.option1_name, variant.option1_value],
    [variant.option2_name, variant.option2_value],
    [variant.option3_name, variant.option3_value],
    [variant.option4_name, variant.option4_value],
  ]
    .map(([name, value]) => ({ name: String(name || "").trim(), value: String(value || "").trim() }))
    .filter((pair) => pair.name && pair.value);
}

function optionValue(variant: SavedProductVariant, optionName: string) {
  const pairs = [
    [variant.option1_name, variant.option1_value],
    [variant.option2_name, variant.option2_value],
    [variant.option3_name, variant.option3_value],
    [variant.option4_name, variant.option4_value],
  ];

  return String(pairs.find(([name]) => (
    String(name || "").trim().toLowerCase() === optionName.toLowerCase()
  ))?.[1] || "").trim();
}

function sizeFromVariant(variant: SavedProductVariant) {
  return supportedSize(optionValue(variant, "Size"))
    || supportedSize(String(variant.title || "").match(/\b(34|36|38|40|42|44|46)\b/)?.[1]);
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

function normalizedOption(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function combinationKey(size: string, sleeves: string, neck: string, closeType: string) {
  return [size, sleeves, neck, closeType].map(normalizedOption).join("|");
}

function uniqueValues(values: string[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = normalizedOption(value);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function parseCustomOptionValues(value: string) {
  return uniqueValues(value.split(",").map((item) => item.trim()).filter(Boolean));
}

export function createBlouseSizeRows(variants: SavedProductVariant[] = []): BlouseSizeRow[] {
  return BLOUSE_SIZES.map((size) => {
    const matching = variants.filter((variant) => sizeFromVariant(variant) === size);
    return {
      size,
      enabled: matching.length > 0,
      sku: String(matching[0]?.sku || ""),
      inventoryQty: matching.length
        ? String(matching.reduce((sum, variant) => sum + inventoryQuantity(variant.inventory_qty), 0))
        : "0",
    };
  });
}

export function createBlouseEditorState(variants: SavedProductVariant[] = []) {
  const sleeves = uniqueValues(variants.map((variant) => optionValue(variant, "Sleeves")).filter(Boolean));
  const necks = uniqueValues(variants.map((variant) => optionValue(variant, "Neck")).filter(Boolean));
  const closeTypes = uniqueValues(variants.map((variant) => optionValue(variant, "Close Type")).filter(Boolean));
  const decorated = variants.map((variant) => ({
    variant,
    size: sizeFromVariant(variant) || "",
    sleeve: optionValue(variant, "Sleeves"),
    neck: optionValue(variant, "Neck"),
    closeType: optionValue(variant, "Close Type"),
  }));
  const isComplete = (row: typeof decorated[number]) => Boolean(row.size && row.sleeve && row.neck && row.closeType);

  const variantRows: BlouseVariantRow[] = decorated.filter(isComplete).map(({ variant, size, sleeve, neck, closeType }) => ({
    key: combinationKey(size, sleeve, neck, closeType),
    size,
    sleeves: sleeve,
    neck,
    closeType,
    sku: String(variant.sku || ""),
    inventoryQty: String(inventoryQuantity(variant.inventory_qty)),
  }));

  const simpleRows: BlouseSimpleVariantRow[] = decorated.filter((row) => !isComplete(row)).map(({ variant }, index) => ({
    key: String(variant.sku || "") || `blouse-simple-${index}`,
    sku: String(variant.sku || ""),
    title: String(variant.title || "").trim() || String(variant.sku || "") || "Default",
    inventoryQty: String(inventoryQuantity(variant.inventory_qty)),
    optionPairs: presentOptionPairs(variant),
  }));

  return {
    sizeRows: createBlouseSizeRows(variants),
    optionInputs: {
      sleeves: sleeves.join(", "),
      necks: necks.join(", "),
      closeTypes: closeTypes.join(", "),
    },
    variantRows,
    simpleRows,
  };
}

export function generateBlouseVariantRows({
  handleSeed,
  sizeRows,
  optionInputs,
  savedRows = [],
}: {
  handleSeed: string;
  sizeRows: BlouseSizeRow[];
  optionInputs: BlouseOptionInputs;
  savedRows?: BlouseVariantRow[];
}) {
  const sizes = sizeRows.filter((row) => row.enabled).map((row) => row.size);
  if (!sizes.length) throw new Error("Select at least one blouse size");

  const sleeves = parseCustomOptionValues(optionInputs.sleeves);
  const necks = parseCustomOptionValues(optionInputs.necks);
  const closeTypes = parseCustomOptionValues(optionInputs.closeTypes);
  if (!sleeves.length) throw new Error("Add at least one Sleeves value");
  if (!necks.length) throw new Error("Add at least one Neck value");
  if (!closeTypes.length) throw new Error("Add at least one Close Type value");

  const count = sizes.length * sleeves.length * necks.length * closeTypes.length;
  if (count > MAX_BLOUSE_VARIANTS) {
    throw new Error(`Blouse products are limited to ${MAX_BLOUSE_VARIANTS} variants`);
  }

  const savedByKey = new Map(savedRows.map((row) => [row.key || combinationKey(
    row.size,
    row.sleeves,
    row.neck,
    row.closeType,
  ), row]));
  const normalizedHandle = skuPart(handleSeed) || "BLOUSE";
  const rows: BlouseVariantRow[] = [];

  sizes.forEach((size) => {
    sleeves.forEach((sleeve) => {
      necks.forEach((neck) => {
        closeTypes.forEach((closeType) => {
          const key = combinationKey(size, sleeve, neck, closeType);
          const saved = savedByKey.get(key);
          rows.push({
            key,
            size,
            sleeves: sleeve,
            neck,
            closeType,
            sku: saved?.sku || [
              "KS",
              normalizedHandle,
              skuPart(size),
              skuPart(sleeve),
              skuPart(neck),
              skuPart(closeType),
            ].filter(Boolean).join("-"),
            inventoryQty: saved?.inventoryQty || "0",
          });
        });
      });
    });
  });

  return rows;
}

export function buildAdminProductVariants({
  categorySlug,
  handle,
  sku,
  inventoryQty,
  price,
  compareAtPrice,
  blouseSizeRows,
  blouseOptionInputs = { sleeves: "", necks: "", closeTypes: "" },
  blouseVariantRows = [],
  blouseSimpleRows = [],
}: BuildAdminProductVariantsInput): AdminProductVariantInput[] {
  const productPrice = Number(price || 0);
  const productCompareAtPrice = compareAtPrice ? Number(compareAtPrice) : null;
  const normalizedHandle = skuPart(handle) || "PRODUCT";

  // Legacy blouse whose variants never adopted the four-option matrix: keep its
  // existing variants (and their options) intact and only carry stock/SKU forward.
  if (categorySlug === "blouses" && !blouseVariantRows.length && blouseSimpleRows.length) {
    const seenSimpleSkus = new Set<string>();
    return blouseSimpleRows.map((row, position) => {
      const trimmedSku = row.sku.trim();
      const normalizedSku = skuPart(row.sku);
      if (!normalizedSku) throw new Error(`Add a SKU for ${row.title || "the blouse variant"}`);
      if (seenSimpleSkus.has(normalizedSku)) throw new Error(`Duplicate variant SKU: ${trimmedSku}`);
      seenSimpleSkus.add(normalizedSku);

      const pairs = (row.optionPairs || [])
        .map((pair) => ({ name: pair.name.trim(), value: pair.value.trim() }))
        .filter((pair) => pair.name && pair.value)
        .slice(0, 4);

      return {
        sku: trimmedSku,
        title: row.title.trim() || trimmedSku || "Default",
        option1Name: pairs[0]?.name,
        option1Value: pairs[0]?.value,
        option2Name: pairs[1]?.name,
        option2Value: pairs[1]?.value,
        option3Name: pairs[2]?.name,
        option3Value: pairs[2]?.value,
        option4Name: pairs[3]?.name,
        option4Value: pairs[3]?.value,
        price: productPrice,
        compareAtPrice: productCompareAtPrice,
        inventoryQty: inventoryQuantity(row.inventoryQty),
        trackInventory: true,
        position,
      };
    });
  }

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

  const rows = blouseVariantRows.length
    ? blouseVariantRows
    : generateBlouseVariantRows({
      handleSeed: handle,
      sizeRows: blouseSizeRows,
      optionInputs: blouseOptionInputs,
    });
  if (rows.length > MAX_BLOUSE_VARIANTS) {
    throw new Error(`Blouse products are limited to ${MAX_BLOUSE_VARIANTS} variants`);
  }

  const seenSkus = new Set<string>();
  rows.forEach((row) => {
    const normalizedSku = skuPart(row.sku);
    if (!normalizedSku) throw new Error(`Add a SKU for ${row.size} / ${row.sleeves} / ${row.neck} / ${row.closeType}`);
    if (seenSkus.has(normalizedSku)) throw new Error(`Duplicate variant SKU: ${row.sku.trim()}`);
    seenSkus.add(normalizedSku);
  });

  return rows.map((row, position) => ({
    sku: row.sku.trim(),
    title: `${row.size} / ${row.sleeves} / ${row.neck} / ${row.closeType}`,
    option1Name: "Size",
    option1Value: row.size,
    option2Name: "Sleeves",
    option2Value: row.sleeves,
    option3Name: "Neck",
    option3Value: row.neck,
    option4Name: "Close Type",
    option4Value: row.closeType,
    price: productPrice,
    compareAtPrice: productCompareAtPrice,
    inventoryQty: inventoryQuantity(row.inventoryQty),
    trackInventory: true,
    position,
  }));
}
