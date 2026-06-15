import { textMatchesCatalogQuery } from "@/lib/catalogTaxonomy";

export type CollectionProductSearchFields = {
  title?: string;
  description?: string;
  tags?: string[];
  fabric?: string | null;
  technique?: string | null;
  color?: string | null;
  category?: { slug?: string | null; name?: string | null } | null;
  variants?: Array<{ selectedOptions?: Array<{ name: string; value: string }> }> | {
    edges?: Array<{ node?: { selectedOptions?: Array<{ name: string; value: string }> } }>;
  };
};

export type ProductTypeFilter = "sarees" | "blouses";

export type BlouseAttributeFilters = {
  sleeves: string[];
  necks: string[];
  closeTypes: string[];
};

const blouseCategoryTerms = new Set(["blouse", "blouses"]);

function normalizeCollectionTerm(value?: string | null) {
  return String(value || "").toLowerCase().trim().replace(/\s+/g, "-");
}

export function productIsBlouseCategory(product: CollectionProductSearchFields) {
  return [
    product.category?.slug,
    product.category?.name,
  ].some((value) => blouseCategoryTerms.has(normalizeCollectionTerm(value)));
}

function productVariants(product: CollectionProductSearchFields) {
  if (Array.isArray(product.variants)) return product.variants;
  return product.variants?.edges?.map((edge) => edge.node || {}).filter(Boolean) || [];
}

function normalizedOptionName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function selectedOptionValue(
  variant: { selectedOptions?: Array<{ name: string; value: string }> },
  name: string,
) {
  return variant.selectedOptions?.find((option) => (
    normalizedOptionName(option.name) === normalizedOptionName(name)
  ))?.value;
}

export function productMatchesProductTypes(
  product: CollectionProductSearchFields,
  selectedTypes: ProductTypeFilter[],
) {
  const productType: ProductTypeFilter = productIsBlouseCategory(product) ? "blouses" : "sarees";
  return selectedTypes.includes(productType);
}

export function blouseAttributeOptions(products: CollectionProductSearchFields[]): BlouseAttributeFilters {
  const result: BlouseAttributeFilters = { sleeves: [], necks: [], closeTypes: [] };
  const seen = {
    sleeves: new Set<string>(),
    necks: new Set<string>(),
    closeTypes: new Set<string>(),
  };

  products.filter(productIsBlouseCategory).forEach((product) => {
    productVariants(product).forEach((variant) => {
      ([
        ["sleeves", selectedOptionValue(variant, "Sleeves")],
        ["necks", selectedOptionValue(variant, "Neck")],
        ["closeTypes", selectedOptionValue(variant, "Close Type")],
      ] as const).forEach(([group, value]) => {
        const normalized = normalizedOptionName(value || "");
        if (!normalized || seen[group].has(normalized)) return;
        seen[group].add(normalized);
        result[group].push(String(value));
      });
    });
  });

  return result;
}

function valueMatchesSelection(value: string | undefined, selected: string[]) {
  if (!selected.length) return true;
  const normalizedValue = normalizedOptionName(value || "");
  return selected.some((item) => normalizedOptionName(item) === normalizedValue);
}

export function productMatchesBlouseAttributes(
  product: CollectionProductSearchFields,
  filters: BlouseAttributeFilters,
  selectedTypes: ProductTypeFilter[],
) {
  if (!productMatchesProductTypes(product, selectedTypes)) return false;
  if (!productIsBlouseCategory(product)) return true;

  const hasActiveFilters = filters.sleeves.length || filters.necks.length || filters.closeTypes.length;
  if (!hasActiveFilters) return true;

  return productVariants(product).some((variant) => (
    valueMatchesSelection(selectedOptionValue(variant, "Sleeves"), filters.sleeves)
    && valueMatchesSelection(selectedOptionValue(variant, "Neck"), filters.necks)
    && valueMatchesSelection(selectedOptionValue(variant, "Close Type"), filters.closeTypes)
  ));
}

function isBlouseCollectionTerm(query: string) {
  return blouseCategoryTerms.has(normalizeCollectionTerm(query));
}

export function productMatchesCollectionScope(product: CollectionProductSearchFields, slug?: string | null) {
  const collectionSlug = normalizeCollectionTerm(slug);
  if (!collectionSlug) return true;
  if (["all", "best-sellers", "new-arrivals"].includes(collectionSlug)) return true;
  if (blouseCategoryTerms.has(collectionSlug)) return productIsBlouseCategory(product);
  return !productIsBlouseCategory(product);
}

export function productHasSareeBlousePiece(product: CollectionProductSearchFields) {
  if (productIsBlouseCategory(product)) return false;

  const text = `${product.title || ""} ${product.description || ""}`.toLowerCase();
  const tags = product.tags?.map((tag) => tag.toLowerCase()) || [];
  const withBlouseIndicators = ["with blouse", "blouse included", "includes blouse", "blouse piece included", "running blouse"];
  const withoutBlouseIndicators = ["without blouse", "no blouse", "blouse not included", "saree only"];

  for (const tag of tags) {
    if (withBlouseIndicators.some((indicator) => tag.includes(indicator))) return true;
    if (withoutBlouseIndicators.some((indicator) => tag.includes(indicator))) return false;
  }

  if (withBlouseIndicators.some((indicator) => text.includes(indicator))) return true;
  if (withoutBlouseIndicators.some((indicator) => text.includes(indicator))) return false;
  if (text.includes("blouse") && !text.includes("without blouse")) return true;

  return false;
}

export function productMatchesCollectionQuery(product: CollectionProductSearchFields, query: string) {
  if (isBlouseCollectionTerm(query)) return productIsBlouseCategory(product);
  if (productIsBlouseCategory(product)) return false;

  const text = [
    product.title,
    product.description,
    product.fabric,
    product.technique,
    product.color,
    product.category?.slug,
    product.category?.name,
  ].filter(Boolean).join(" ");

  return textMatchesCatalogQuery(text, product.tags || [], query);
}
